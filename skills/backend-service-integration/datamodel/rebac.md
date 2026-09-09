---
name: datamodel-rebac
description: "Relationship-Based Access Control (ReBAC): relationship types (HRBP, DIRECT_MANAGER, RECRUITER), access matrix (per-type x attribute VIEW/EDIT/ADMIN/NONE rules), item relationships with validity periods, scoped-object ReBAC extensions (object-level gating, per-record access policy, CREATOR, self-view bypass). Tables: orca.relationship_types, orca.relationship_access_rules, orca.item_relationships. SQL functions: orca.employee_list(), orca.scoped_object_list(). Applies to both employee reads and scoped-object record reads."
parent: datamodel-guide
---

# ReBAC: Relationship-Based Access Control

> Part of the [Datamodel Guide](SKILL.md). ReBAC decides **who sees which records and which fields** on every employee and scoped-object read. The model has three pillars — exactly the three tabs of the frontend **Relationships** admin page (`frontend/orca/src/features/headcount/pages/RelationshipsPage.tsx`): **Relationship Types**, **Access Matrix**, and **Item Relationships**.

---

## 1. Model Overview

```
Relationship Types          Access Matrix                  Item Relationships
(what relationships exist)  (what each type may see)       (who holds which relationship)

 HRBP (assignable)           HRBP × pay_rate_amount → ✓     E-001 is HRBP of EMPLOYEE E-100
 RECRUITER (assignable)      FPA  × first_name     → ✗     E-002 is RECRUITER of DEPARTMENT ENG
 DIRECT_MANAGER (computed)   …                             (valid_period per row)
```

- **Stored relationships** come from `orca.item_relationships` rows and are honored only when their type is effectively **assignable**.
- **Computed relationships** (`DIRECT_MANAGER`, `INDIRECT_MANAGER`) are derived on every read from the reporting chain (`orca.employee_allocation_path`) — they always exist, scope-independent, with full masking parity.
- Enforcement happens inside the SQL function `orca.employee_list()` — attribute-level **masking** plus a row-level **gate** (§6). Every caller, including admins, reads through it; admin role only unlocks the `/admin/*` management endpoints.

---

## 2. Relationship Types

### 2.1 Table — `orca.relationship_types`

```sql
relationship_type_id BIGSERIAL PK,
workspace_id   text,                       -- NULL = system row
code           text NOT NULL,
name           text NOT NULL,
description    text,
is_system      boolean NOT NULL DEFAULT false,
assignable     boolean NOT NULL DEFAULT true,
scope          text NOT NULL DEFAULT 'global',
created_at     timestamptz NOT NULL DEFAULT now()
-- UNIQUE (workspace_id, scope, code) NULLS NOT DISTINCT
```

Seeded system types:

| Code | Name | Assignable | Why |
|---|---|---|---|
| `HRBP` | HRBP | ✅ | Manually assigned HR business partner |
| `RECRUITER` | Recruiter | ✅ | Manually assigned |
| `FPA` | FP&A | ✅ | Manually assigned |
| `BUDGET_OWNER` | Budget Owner | ✅ | Manually assigned |
| `EXECUTIVE` | Executive | ✅ | Manually assigned |
| `DIRECT_MANAGER` | Direct Manager | ❌ | **Computed** from the reporting chain — manual assignment is meaningless |
| `INDIRECT_MANAGER` | Indirect Manager | ❌ | **Computed** (dotted-line / skip-level) |

### 2.2 Semantics

- **Scope-aware resolution**: effective type = workspace row over system row (`DISTINCT ON (code) … ORDER BY code, workspace_id NULLS LAST`), filtered by `scope = S`.
- **`assignable` — write side (fail-closed)**: assigning a relationship with an unknown or non-assignable type → `400` (`"unknown relationship type: X"` / `"relationship type is not assignable: X"`).
- **`assignable` — read side (fail-open)**: stored rows whose type has *no* definition in scope are still honored (`COALESCE(assignable, true)`). Rationale: system types exist only at `scope='global'`; failing closed would silently revoke all stored-relationship effects in non-global scopes.
- **Flipping `DIRECT_MANAGER` to assignable** (via a workspace override) adds stored-row honoring *on top of* the always-present computed rows — dedup is idempotent.
- System types cannot be updated or deleted (`403`); workspace types can.

### 2.3 Endpoints

| Method | Path | Operation ID | Auth |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/relationship-types?scope=` | `headcountListRelationshipTypes` | any authenticated user |
| `POST` | `/orcaagents/headcount/admin/relationship-types` | `headcountCreateRelationshipType` | admin |
| `PATCH` | `/orcaagents/headcount/admin/relationship-types/{code}?scope=` | `headcountUpdateRelationshipType` | admin |
| `DELETE` | `/orcaagents/headcount/admin/relationship-types/{code}?scope=` | `headcountDeleteRelationshipType` | admin → `204` |

Note: the read endpoint is **not** under `/admin/` — any workspace user can list types (the picker needs them).

```typescript
export interface RelationshipType {
  relationshipTypeId: string;      // int64 serialized as string
  workspaceId: string | null;      // null = system row (frontend renders a "System" chip)
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  assignable: boolean;
  scope: string;
  createdAt: string;
}

// POST body:  { code, name?, description?, assignable?, scope? }
// PATCH body: { name?, description?, assignable? }   (code immutable)
```

---

## 3. Access Matrix — Access Rules

### 3.1 Table — `orca.relationship_access_rules`

One rule = a visibility decision for **(relationship type × attribute)** within a scope:

```sql
rule_id         BIGSERIAL PK,
workspace_id    text,                  -- NULL = system-level rule
relationship_type text NOT NULL,
object_code     text,                  -- NULL = attribute-level rule (legacy); non-NULL = object-level rule
attribute_code  text,                  -- NULL for object-level rules
attribute_scope text NOT NULL DEFAULT 'NATIVE' CHECK (IN ('NATIVE','CUSTOM')),
scope           text NOT NULL DEFAULT 'global',
access          text NOT NULL DEFAULT 'VIEW' CHECK (IN ('VIEW','EDIT','ADMIN','NONE')),
created_at      timestamptz
-- unique per (workspace_id, scope, relationship_type, object_code, attribute_code, attribute_scope) NULLS NOT DISTINCT
```

- `attribute_scope = 'NATIVE'` targets the maskable native fields: `first_name`, `last_name`, `work_email`, `hire_date`, `termination_date`, `manager_employee_code`, `cost_center_code`, `pay_rate_amount`, `pay_rate_currency`, `fx_rate_to_base`.
- `attribute_scope = 'CUSTOM'` targets any `attribute_definitions.code`.
- Never maskable (identifiers): `employee_code`, `department_code`, `employee_type_code`, `status`.
- **System seeds**: `access='VIEW'` on the three pay attributes for all six seeded types; `access='NONE'` for `FPA` on `first_name`, `last_name`, `work_email` (finance sees money, not names).

### 3.2 The precedence formula

For each attribute on each returned row:

```
visibility = COALESCE(min(access_level_rank(rule.access)) >= 1 over matched relationships, access_policy = 'PUBLIC')
```

- Any matching rule **overrides** the attribute's `access_policy` default; most-restrictive-wins across multiple matched relationships (`min(rank)`). Visibility requires effective level ≥ VIEW (rank ≥ 1).
- No matching rule → fall back to the definition's `access_policy` (`PUBLIC` shows, `REBAC_REQUIRED` hides).
- Masked values: strings → `''`, dates/numbers/nullables → `NULL` (field omitted in JSON via `omitempty`).

The frontend Access Matrix tab mirrors this exactly: rows = relationship types, columns = attributes, cells cycle **visible (green) → hidden (red) → undefined ("Attribute Default", dashed)**. Click-cycling a cell maps to: no rule → `POST access=VIEW`; system rule → `POST` a workspace override (never delete system rules); workspace `VIEW` → `POST NONE`; workspace `NONE` → `DELETE` (back to default).

### 3.3 Endpoints (all admin)

| Method | Path | Operation ID |
|---|---|---|
| `GET` | `/orcaagents/headcount/admin/access-rules?relationshipType=&scope=` | `headcountListAccessRules` |
| `POST` | `/orcaagents/headcount/admin/access-rules` | `headcountUpsertAccessRule` |
| `DELETE` | `/orcaagents/headcount/admin/access-rules/{ruleId}` | `headcountDeleteAccessRule` → `204` |

```typescript
export interface RelationshipAccessRule {
  ruleId: string;                 // int64 serialized as string
  workspaceId: string | null;
  relationshipType: string;       // '' = global pseudo-rule (read-only in UI)
  objectCode?: string;            // object-level rule target (null for attribute-level)
  attributeCode?: string;         // e.g. 'pay_rate_amount' or a custom code (null for object-level)
  attributeScope: 'NATIVE' | 'CUSTOM';
  scope: string;
  access: 'VIEW' | 'EDIT' | 'ADMIN' | 'NONE';
  createdAt: string;
}

// Upsert body (POST): { ruleId?, relationshipType, objectCode?, attributeCode?, attributeScope, scope?, access }
// ON CONFLICT (workspace_id, scope, relationship_type, object_code, attribute_code, attribute_scope) NULLS NOT DISTINCT DO UPDATE SET access
```

---

## 4. Item Relationships

### 4.1 Table — `orca.item_relationships`

```sql
relationship_id           BIGSERIAL PK,
workspace_id              text NOT NULL,
item_type                 text NOT NULL CHECK (IN ('EMPLOYEE','DEPARTMENT')),
item_code                 text NOT NULL,    -- employee_code or department_code (polymorphic, app-side integrity)
relationship_employee_code text NOT NULL,   -- the person holding the relationship
relationship_type         text NOT NULL,
valid_period              daterange NOT NULL,
created_at                timestamptz
-- FK (workspace_id, relationship_employee_code) → orca.employees ON DELETE RESTRICT
```

Read as: *"`relationship_employee_code` holds `relationship_type` over `item_type`/`item_code` during `valid_period`."* Only **current** rows (`valid_period @> CURRENT_DATE`) affect visibility and per-item listings. The frontend defaults blank dates to `today → 2099-12-31`.

### 4.2 Endpoints

| Method | Path | Operation ID | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/headcount/employees/{employeeCode}/relationships` | `headcountGetEmployeeRelationships` | any user | Current rows on that employee |
| `POST` | `/headcount/employees/{employeeCode}/relationships?scope=` | `headcountAssignEmployeeRelationship` | admin | `itemType` forced `EMPLOYEE` |
| `GET` | `/headcount/departments/{departmentCode}/relationships` | `headcountGetDepartmentRelationships` | any user | |
| `POST` | `/headcount/departments/{departmentCode}/relationships?scope=` | `headcountAssignDepartmentRelationship` | admin | |
| `GET` | `/headcount/admin/item-relationships` | `headcountListAllItemRelationships` | admin | All rows, `LIMIT 10000` |
| `POST` | `/headcount/admin/item-relationships?scope=` | `headcountAssignItemRelationship` | admin | Any `itemType`/`itemCode` |
| `DELETE` | `/headcount/admin/item-relationships/{id}` | `headcountDeleteItemRelationship` | admin | `204` |

(All paths prefixed with `/orcaagents`.) Assign validates the type is known and assignable (`400` otherwise).

```typescript
export interface ItemRelationship {
  relationshipId: string;          // int64 serialized as string
  workspaceId: string;
  itemType: 'EMPLOYEE' | 'DEPARTMENT';
  itemCode: string;
  relationshipEmployeeCode: string;
  relationshipType: string;        // e.g. 'HRBP'
  validPeriod: { start: string; end: string };  // RFC3339 date bounds
  createdAt: string;
}

// Assign body (per-employee/department): { relationshipEmployeeCode, relationshipType, validPeriod? }
// Assign body (admin):                 { itemType, itemCode, relationshipEmployeeCode, relationshipType, validPeriod? }
```

---

## 5. Computed vs Assigned Relationships

Inside `orca.employee_list()`, the requester's relationships are the **union** of:

```sql
-- Stored rows: honored only when the effective type is assignable in scope
stored_relationships   = SELECT … FROM orca.item_relationships ir
                         JOIN effective_types et ON et.code = ir.relationship_type
                         WHERE COALESCE(et.assignable, true)   -- fail-open
-- Computed rows: always present, scope-independent, from the reporting chain
computed_relationships = SELECT 'EMPLOYEE', ap.employee_code,
                         CASE WHEN ap.path[1] = requester THEN 'DIRECT_MANAGER'
                              ELSE 'INDIRECT_MANAGER' END
                         FROM orca.employee_allocation_path ap
                         WHERE ap.path @> ARRAY[requester]      -- one GIN scan
```

- SQL `path[1]` is the direct manager (Go `path[0]`); appearing anywhere later in the array makes the requester an indirect manager.
- Computed rows have **full parity**: field masking, `relationshipType` output, and the row gate all treat them identically to stored rows.
- Department-level relationships also apply: a relationship on an employee's department extends to that employee.

---

## 6. Enforcement in `orca.employee_list()`

Every employee read (list and get-by-code) calls `ListEmployeesWithVisibility` → `SELECT * FROM orca.employee_list($1..$12)` with `p_requester_email = claims.email`:

1. **Requester resolution** — `orca.headcount_users_employees` maps the caller's email to an employee code; unlinked callers resolve to `''` and match no relationships.
2. **Relationship match** — stored (assignable) ∪ computed, per §5.
3. **Attribute masking** — per field: `CASE WHEN COALESCE(min(rule_access_rank) >= 1, access_policy='PUBLIC') THEN value ELSE '' / NULL END`. Custom attributes are filtered key-by-key out of the JSONB map.
4. **Row gate (`REBAC_REQUIRED`)** — active only when at least one attribute definition in scope has `access_policy='REBAC_REQUIRED'`:

```sql
WHERE (matched.eid IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM resolved_attr_defs WHERE access_policy = 'REBAC_REQUIRED'))
```

When active, employees with **no relationship to the requester disappear entirely** — not just masked.
5. **Output markers** — each row carries `relationshipType` (sorted CSV of matched types, `''` if none) and `visibilitySource` (`'rules'` when any rule row applied, else `'defaults'`).

> **No admin bypass, no self-record special case.** Role checks exist only on `/admin/*` management endpoints. An admin calling `GET /headcount/employees` is masked and gated like anyone else — if their email isn't linked to an employee, they see only `PUBLIC` defaults.

---

## 7. Worked Example

```http
# 1. (Admin) Create a scoped relationship type
POST /orcaagents/headcount/admin/relationship-types
{ "code": "MENTOR", "name": "Mentor", "assignable": true, "scope": "global" }

# 2. (Admin) Grant mentors visibility into job_level (a custom attribute), nothing else new
POST /orcaagents/headcount/admin/access-rules
{ "relationshipType": "MENTOR", "attributeCode": "job_level",
  "attributeScope": "CUSTOM", "access": "VIEW" }

# 3. (Admin) Assign E-010 as mentor of employee E-100 for this year
POST /orcaagents/headcount/employees/E-100/relationships
{ "relationshipEmployeeCode": "E-010", "relationshipType": "MENTOR",
  "validPeriod": { "start": "2026-01-01", "end": "2026-12-31" } }

# 4. E-010's user (linked email) lists employees — E-100's row now shows job_level,
#    with relationshipType "MENTOR" and visibilitySource "rules"
GET /orcaagents/headcount/employees
```

---

## 8. Frontend Reference

The **Relationships** admin page (`?tab=types|matrix|items`, with a page-level scope selector) is the canonical UI over these APIs:

| Tab | Reads | Writes |
|---|---|---|
| Relationship Types | `GET /relationship-types?scope=` | `POST/PATCH/DELETE /admin/relationship-types` (system rows read-only) |
| Access Matrix | `GET /admin/access-rules`, `GET /admin/mapping-target-fields` (REBAC_REQUIRED columns), `GET /admin/custom-attributes` | `POST /admin/access-rules`, `DELETE /admin/access-rules/{id}` (never deletes system rules — overrides them) |
| Item Relationships | `GET /admin/item-relationships` | `POST /admin/item-relationships` (type dropdown filtered to `assignable` only), `DELETE /admin/item-relationships/{id}` |

Next: consuming the visibility-aware list API — [employee-list.md](employee-list.md).

---

## 9. Scoped-Object ReBAC Extensions

The scoped-object visibility engine (`orca.scoped_object_list()`) extends the employee ReBAC model with **four additional mechanisms** that do not exist for employee reads. For the full record CRUD reference, see [scoped-object-crud.md](scoped-object-crud.md).

| Extension | Description | Employee model equivalent |
|---|---|---|
| **Object-level gating** | `access_policy` on `orca.objects` gates the entire record when `REBAC_REQUIRED` | No equivalent (employees are always visible when row-gate passes) |
| **Per-record access policy** | Each `orca.scoped_objects` row carries its own `access_policy` (PUBLIC or REBAC_REQUIRED) | No per-employee access_policy |
| **CREATOR computed relationship** | Record creator auto-gains CREATOR-type relationship access | No creator concept |
| **Self-view bypass** | Record's `employee_code` matching requester → full unmasked data | No self-view special case |
| **Four-level access model** | NONE < VIEW < EDIT < ADMIN (write ops require EDIT/ADMIN, verified in-transaction) | VIEW-only on reads |
| **Empty-data filtering** | Records where masking leaves `masked_data = '{}'` are omitted | Employees always appear (never filtered by masking alone) |

The base ReBAC chain (requester resolution → relationship match → attribute masking) is identical to `employee_list()` (§6). The scoped-object chain adds per-record type matching, object-level rules, and the CREATOR/self-view bypass on top. Full 16-CTE chain: [scoped-object-crud.md §7](scoped-object-crud.md#7-visibility-engine----orcascoped_object_list).
