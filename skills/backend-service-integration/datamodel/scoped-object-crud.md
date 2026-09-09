---
name: datamodel-scoped-object-crud
description: "Scoped object record CRUD and visibility: GET/POST/PUT/DELETE /orcaagents/objects/{code}/records?scope=. Operations: listObjectRecords, getObjectRecord, createObjectRecord, updateObjectRecord, deleteObjectRecord, listScopeRecords. Also covers object definitions (/orcaagents/objects), object types, scoped attribute definitions, scoped relationships, and scoped access rules. SQL: orca.scoped_object_list(), orca.scoped_object_list_internal()."
parent: datamodel-guide
---

# Scoped Object CRUD & Visibility

> Part of the [Datamodel Guide](SKILL.md). This is the canonical reference for reading and writing **scoped-object records** — custom business objects (deals, policies, plans, etc.) with full ReBAC visibility. It parallels [employee-list.md](employee-list.md) but covers the broader CRUD surface: object definitions, object types, attribute definitions, record lifecycle, scoped relationships, and scoped access rules.

---

## 1. `GET /orcaagents/objects/{code}/records` — List Object Records

- **Operation ID**: `listObjectRecords` · **Auth**: any authenticated workspace user (no admin role needed).
- **Visibility**: results are ReBAC-gated and attribute-masked per the caller's relationships — see §7. SYSTEM_ADMIN sees all records unmasked (`p_bypass_access=true`).
- **Backing SQL**: `orca.scoped_object_list(...)` (9 params, 16-CTE chain). All user filters apply before visibility and pagination.
- **Builtin rejection**: `employee` and `requisition` are rejected (`403 system-reserved`) — use the [employee list API](employee-list.md) instead.

### Query parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `scope` | string | `global` | Datamodel [scope](concepts.md#1-scopes) — switches definitions, attribute source, and ReBAC rules |
| `search` | string | — | ILIKE substring over `code_value` |
| `page` | int | `1` | 1-based; values < 1 clamp to 1 |
| `pageSize` | int | `25` | Server-capped at **100** |

### Response — paginated envelope

```typescript
export interface ObjectRecordListResult {
  items: ObjectRecord[];     // always non-null ([] when empty)
  totalCount: number;        // post-filter, post-row-gate, pre-pagination
  page: number;
  pageSize: number;
}

export interface ObjectRecord {
  objectCode: string;                   // e.g. "deal"
  codeValue: string;                    // the id_attribute value, e.g. "D-001"
  scope: string;
  attributes: Record<string, any>;     // visibility-filtered, def-driven
  updatedAt: string;                   // RFC3339
  created?: string;                    // creator email (only for records you can VIEW)
  accessPolicy?: string;               // "PUBLIC" | "REBAC_REQUIRED"
}
```

**Def-driven reads**: only attributes with a matching `attribute_definitions` row appear in output. `PUBLIC` attributes are always visible. `REBAC_REQUIRED` attributes require a matching relationship (via `employee_code` or `department_code` in the record's snapshot). Attributes with no definition are omitted. Records where masking leaves zero visible attributes (`masked_data = '{}'`) are filtered out.

---

## 2. `GET /orcaagents/objects/{code}/records/{codeValue}` — Get Single Record

- **Operation ID**: `getObjectRecord` · **Auth**: any authenticated user.
- **SYSTEM_ADMIN**: returns full unmasked data via `GetRecordSnapshot` (bypasses ReBAC).
- **Non-system**: ReBAC-gated via `scoped_object_list` — denied or non-existent records return `404` (no existence leak).

### Query parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `scope` | string | `global` | Scope filter |

```typescript
export async function getObjectRecord(
  objectCode: string, codeValue: string, scope?: string
): Promise<ObjectRecord> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await orcaFetch(
    `/orcaagents/objects/${encodeURIComponent(objectCode)}/records/${encodeURIComponent(codeValue)}${qs}`
  );
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}
```

---

## 3. `POST /orcaagents/objects/{code}/records` — Create Record

- **Operation ID**: `createObjectRecord` · **Auth**: SYSTEM_ADMIN bypasses; non-system users need **EDIT** access (in-tx post-insert check).
- **Response**: `201` with the created `ObjectRecord`.
- **Audit**: logged as `object_record` entity, `create` action.

### Request body

```typescript
interface CreateRecordBody {
  scope: string;                     // required; the scope for the record
  attributes: Record<string, any>;   // required; must include the object's id_attribute
}
```

### Write semantics

- **Permissive writes**: any attribute code is accepted — no validation against `attribute_definitions` at write time. Unknown codes are stored but won't appear in reads until a definition exists.
- **In-transaction access check**: for non-system users, after the record is inserted, `has_object_access()` verifies EDIT access. Denied → transaction rolls back, no trace, returns `404` (not `403` — no existence oracle).
- **Creator tracking**: the record's `created` field is set to the caller's email. The CREATOR computed relationship grants access defined by `CREATOR`-type rules.
- **Duplicate detection**: `(workspace_id, object_code, code_value, scope)` unique violation → `409`.
- **Attribute cap**: 100 keys per write → `400`.

```typescript
export async function createObjectRecord(
  objectCode: string, scope: string, attributes: Record<string, any>
): Promise<ObjectRecord> {
  const res = await orcaFetch(`/orcaagents/objects/${encodeURIComponent(objectCode)}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, attributes }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}
```

---

## 4. `PUT /orcaagents/objects/{code}/records/{codeValue}` — Update Record

- **Operation ID**: `updateObjectRecord` · **Auth**: SYSTEM_ADMIN bypasses; non-system users need **EDIT** access (in-tx check).
- **Response**: `200` with the updated `ObjectRecord`.
- **Audit**: logged as `object_record` entity, `update` action.

### Request body

```typescript
interface UpdateRecordBody {
  scope: string;                     // required; the scope to update in
  attributes: Record<string, any>;   // required; id_attribute is rejected (immutable)
}
```

### Temporal upsert semantics

Updates use a 3-statement set-based approach within a single transaction:

1. **Same-day rows**: updated in place (no empty `[today, today)` range).
2. **Older open rows**: closed with `[start, today)` + new `[today, ∞)` row inserted.
3. **Missing current rows**: inserted.

A GiST exclusion constraint on `valid_period` guards against concurrent races. The `scope` is caller-supplied and required. The id_attribute (e.g., `deal_id`) cannot appear in the update body → `400 immutable field`.

```typescript
export async function updateObjectRecord(
  objectCode: string, codeValue: string, scope: string, attributes: Record<string, any>
): Promise<ObjectRecord> {
  const res = await orcaFetch(
    `/orcaagents/objects/${encodeURIComponent(objectCode)}/records/${encodeURIComponent(codeValue)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, attributes }),
    }
  );
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}
```

---

## 5. `DELETE /orcaagents/objects/{code}/records/{codeValue}` — Delete Record

- **Operation ID**: `deleteObjectRecord` · **Auth**: SYSTEM_ADMIN bypasses; non-system users need **ADMIN** access on every scope row (in-tx check).
- **Cross-scope**: removes `attribute_values` and `scoped_objects` rows across **all** scopes. Record identity is `(object_code, code_value)` within a workspace regardless of scope.
- **Response**: `200` with `{ status: "ok" }`.
- **Audit**: logged as `object_record` entity, `delete` action.

### Access-check placement

| Op | SYSTEM_ADMIN | Non-system |
|---|---|---|
| **GET list** | `p_bypass_access=true` | per-record gating via `scoped_object_list` |
| **GET single** | `GetRecordSnapshot` (unmasked) | `CheckRecordAccess(VIEW)` → 404 on denial; masked `GetRecord` |
| **POST** | bypass | `RequiredAccess=EDIT` in-tx; denied → 404 + rollback |
| **PUT** | bypass | `CheckRecordAccess(EDIT)` → 404; `accessPolicy` change → `ADMIN` → 403 |
| **DELETE** | bypass | `CheckRecordAccessAllScopes(ADMIN)` → 404 on denial |

> **PUBLIC records without explicit ADMIN rules cannot be deleted** by non-system users — the ADMIN rank is unreachable via the PUBLIC fallback. Use the admin API to grant explicit ADMIN rules, or delete as SYSTEM_ADMIN.

---

## 6. `GET /orcaagents/objects/scope-records` — List All Records in a Scope

- **Operation ID**: `listScopeRecords` · **Auth**: **SYSTEM_ADMIN only** (`403` for non-sysadmin).
- Returns all records across every object in the given scope, with full unmasked data.
- Intended for the sysadmin datamodel workbench (Sample Data step).
- `scope` is **required** and must be non-global (`400` for `global` or empty).
- Optional `requesterEmail` query param simulates the ReBAC-gated view for that employee.

### Query parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `scope` | string | ✅ | Non-global scope code |
| `requesterEmail` | string | — | Simulate ReBAC view for this employee (SYSTEM_ADMIN only) |

---

## 7. Visibility Engine — `orca.scoped_object_list()`

The SQL function `orca.scoped_object_list()` (migration `20260904000000`, v4) mirrors `employee_list()`'s full ReBAC infrastructure with additional per-record gating. It executes a **16-CTE chain**:

```
resolved_requester → effective_types → stored_relationships → computed_relationships
  → requester_relationships → effective_rules → resolved_attr_defs → filtered
  → record_types → object_rules → object_levels → gated_records
  → applicable → combined → visibility → masked → total → paged
```

### 7.1 The ReBAC chain for scoped objects

1. **Requester resolution** — `p_requester_email` is resolved to an employee code via `orca.employees.work_email`. Unlinked callers resolve to `''` and match no relationships.

2. **Relationship match** — stored (assignable) ∪ computed (DIRECT_MANAGER, INDIRECT_MANAGER from `employee_allocation_path`), same as [rebac.md §5](rebac.md#5-computed-vs-assigned-relationships).

3. **Per-record relationship types** (`record_types` CTE) — the requester's relationships are matched against each record's snapshot attributes:
   - `employee_code` in the record's data → matches EMPLOYEE-type relationships
   - `department_code` in the record's data → matches DEPARTMENT-type relationships
   - **CREATOR** — when `lower(scoped_objects.created) = lower(requester_email)`

4. **Object-level gating** (`object_levels` CTE) — rules with `attribute_code IS NULL` and `object_code = p_object_code` grant per-record access levels. Records where the requester has no object-level relationship and the object's `access_policy = 'REBAC_REQUIRED'` are **gated out** (hidden entirely).

5. **Attribute masking** — per attribute: `COALESCE(min(rule_access_rank) >= 1, attr_def.access_policy = 'PUBLIC')`. `REBAC_REQUIRED` attributes without a granting relationship are masked (omitted from the `data` JSONB).

6. **Empty-data filtering** — records where masking leaves `masked_data = '{}'` are omitted from list results.

7. **Self-view bypass** (v4) — when the record's `employee_code` matches the requester's resolved employee code, the record is returned with full unmasked data.

### 7.2 SYSTEM_ADMIN bypass

When `p_bypass_access = true` (set by the handler for SYSTEM_ADMIN), the query routes to `scoped_object_list_internal()` — a simple query that skips the entire ReBAC chain and returns raw data from `scoped_objects`.

### 7.3 How records link to ReBAC

The bridge between a custom object record and the ReBAC chain is the record's **snapshot attributes**:

| Snapshot attribute | Links to |
|---|---|
| `employee_code` | Requester's relationships on that employee (HRBP, DIRECT_MANAGER, CREATOR, etc.) |
| `department_code` | Requester's relationships on that department |
| `created` (identity column) | CREATOR computed relationship |

**Records without `employee_code` or `department_code`** can still be accessed through object-level rules, CREATOR relationship, self-view bypass, or PUBLIC access policy.

---

## 8. Object Definitions — Schema CRUD

Object definitions are the schema layer — they define what kinds of records can exist. All object definition endpoints require **SYSTEM_ADMIN** for writes.

### 8.1 Endpoints

| Method | Path | Operation ID | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/orcaagents/objects?scope=` | `listObjects` | any user | System + workspace objects, tenant shadow resolution |
| `POST` | `/orcaagents/objects` | `createObject` | SYSTEM_ADMIN | `201`; duplicate/system-reserved code → `409`/`403` |
| `GET` | `/orcaagents/objects/{code}?scope=` | `getObject` | any user | Single object definition |
| `PUT` | `/orcaagents/objects/{code}?scope=` | `updateObject` | SYSTEM_ADMIN | Name, idAttribute, accessPolicy |
| `DELETE` | `/orcaagents/objects/{code}?scope=` | `deleteObject` | SYSTEM_ADMIN | `204`; builtin codes → `403` |
| `POST` | `/orcaagents/objects/{code}/status?scope=` | `setObjectStatus` | SYSTEM_ADMIN | Activate / disable |

### 8.2 Create object body

```typescript
interface CreateObjectBody {
  code: string;               // e.g. "deal"; must match ^[a-z][a-z0-9_]{0,63}$
  name: string;               // display name
  idAttribute: string;        // e.g. "deal_id" (immutable after create)
  scope?: string;             // default "global"
  accessPolicy?: string;      // "PUBLIC" (default) | "REBAC_REQUIRED"
}
```

**`accessPolicy`** at the object level controls per-record row gating:
- `PUBLIC` — all authenticated users see the record (attribute masking still applies).
- `REBAC_REQUIRED` — the record is gated by `has_object_access()`; requesters without ≥ VIEW access see `404`.

### 8.3 Object definition response

```typescript
interface Object {
  objectId: string;           // int64 serialized as string
  workspaceId: string | null; // null = system builtin
  code: string;
  name: string;
  idAttribute: string;
  status: "ACTIVE" | "DISABLED";
  scope: string;
  accessPolicy: "PUBLIC" | "REBAC_REQUIRED";
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Object Types — Variant CRUD

Object types define variants of an object (e.g., deal types: `PROSPECT`, `CLOSED`). They carry editor layout, behavior rules, and validation rules.

### 9.1 Endpoints

| Method | Path | Operation ID | Auth |
|---|---|---|---|
| `GET` | `/orcaagents/objects/{code}/types?scope=` | `listObjectTypes` | any user |
| `POST` | `/orcaagents/objects/{code}/types` | `createObjectType` | SYSTEM_ADMIN |
| `GET` | `/orcaagents/objects/{code}/types/{typeCode}?scope=` | `getObjectType` | any user |
| `PUT` | `/orcaagents/objects/{code}/types/{typeCode}?scope=` | `updateObjectType` | SYSTEM_ADMIN |
| `DELETE` | `/orcaagents/objects/{code}/types/{typeCode}?scope=` | `deleteObjectType` | SYSTEM_ADMIN |
| `POST` | `/orcaagents/objects/{code}/types/{typeCode}/status?scope=` | `setObjectTypeStatus` | SYSTEM_ADMIN |

### 9.2 Create object type body

```typescript
interface CreateObjectTypeBody {
  code: string;                 // e.g. "PROSPECT"
  name: string;                 // display name
  layout?: any;                 // editor layout JSON (default: {"groups":[]})
  behaviors?: any;              // closed 12-type behavior catalog
  rules?: any;                  // closed 4-type validation-rule catalog
  sortOrder?: number;           // display ordering
  scope?: string;               // default "global"
}
```

**Closed catalogs**: behaviors (12 types: `instantify`, `requiredwhen`, `visiblewhen`, `hiddenwhen`, `disabledwhen`, `clearvaluewhen`, `showgroupwhen`, `hidegroupwhen`, `derive`, `derive-classification`, `derive-default-properties`, `copy-item-properties`) and rules (3 types: `requiredfields`, `forbiddenfields`, `fieldvalue`) are validated at write time. Unknown types → `400`.

---

## 10. Scoped Attribute Definitions

Attribute definitions define the schema for record attributes within a scope. They are **shared infrastructure** with the [employee data model](employee-object.md) — the same `orca.attribute_definitions` table serves both employees and custom objects.

### 10.1 Endpoints (under headcount admin)

| Method | Path | Operation ID | Auth |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/admin/custom-attributes?scope=` | `headcountListCustomAttributes` | admin |
| `POST` | `/orcaagents/headcount/admin/custom-attributes` | `headcountCreateCustomAttribute` | admin → `201` |
| `PUT` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountUpdateCustomAttribute` | admin |
| `DELETE` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountDeleteCustomAttribute` | admin → `204` |

### 10.2 Create attribute definition body

```typescript
interface CreateCustomAttributeBody {
  code: string;                                  // unique per (scope, workspace)
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'object';
  dataSchema?: any;                              // e.g. { options: [...] } for enum
  appliesToObjects?: string[];                   // object codes; empty = all objects
  required?: boolean;                            // default false
  accessPolicy?: 'PUBLIC' | 'REBAC_REQUIRED';    // default PUBLIC
  scope?: string;                                // default "global"
}
```

**Key semantics for scoped objects**:
- `appliesToObjects` restricts which objects an attribute is valid for. Empty array = applies to all objects including custom ones.
- `accessPolicy` controls cell-level visibility: `PUBLIC` attributes are always shown; `REBAC_REQUIRED` attributes are masked unless a relationship grants access.
- **Writes are permissive**: records accept any attribute code. **Reads are def-driven**: only attributes with a matching definition appear in output.

---

## 11. Scoped Relationships & Access Rules

Relationships and access rules are **shared infrastructure** with the employee model. The same tables (`orca.relationship_types`, `orca.relationship_access_rules`, `orca.item_relationships`) and endpoints serve both employees and scoped objects. See [rebac.md](rebac.md) for the full model and endpoint reference.

### 11.1 What's different for scoped objects

Scoped objects use relationships and rules for a **dual purpose**: controlling both **who sees which records** (object-level rules) and **which fields are visible** (attribute-level rules). The endpoint tables and CRUD operations are identical to the employee model (→ [rebac.md §2.3](rebac.md#22-semantics), [§3.3](rebac.md#33-endpoints-all-admin), [§4.2](rebac.md#42-endpoints)), but the *effect* differs:

| Relationship target | Employee model effect | Scoped-object effect |
|---|---|---|
| **Employee-level** (`item_type=EMPLOYEE`) | Masks/hides employee fields | Grants access to records whose snapshot contains that `employee_code` |
| **Department-level** (`item_type=DEPARTMENT`) | Extends employee visibility to dept members | Grants access to records whose snapshot contains that `department_code` |
| **Object-level rule** (N/A for employees) | — | `object_code` set, `attribute_code` NULL → gates the entire record |
| **CREATOR** (computed, scoped-objects only) | — | Record creator auto-gains CREATOR-type relationship access |

For scoped objects, custom relationship types define the roles that can access records (e.g., `DEAL_DESK`, `BUDGET_OWNER`, `POLICY_AUTHOR`). The same seeded system types (HRBP, DIRECT_MANAGER, etc.) are also available.

### 11.2 Object-level vs attribute-level rules

Access rules come in two flavors for scoped objects:

**Object-level rules** (row gating): `object_code` is set, `attribute_code` is NULL. Grants access to the entire record.

```json
{
  "relationshipType": "DEAL_DESK",
  "objectCode": "deal",
  "access": "VIEW"
}
```

→ "DEAL_DESK can view all deal records" (no per-attribute configuration needed).

**Attribute-level rules** (cell masking): `attribute_code` is set. Grants access to specific fields.

```json
{
  "relationshipType": "DEAL_DESK",
  "attributeCode": "deal_amount",
  "attributeScope": "CUSTOM",
  "access": "VIEW"
}
```

→ "DEAL_DESK can see the `deal_amount` field on deal records."

### 11.3 Upsert access rule body

```typescript
interface UpsertAccessRuleBody {
  relationshipType: string;       // e.g. "DEAL_DESK"
  objectCode?: string;            // object-level rule target (null for attribute-level)
  attributeCode?: string;         // e.g. "deal_amount" (null for object-level)
  attributeScope?: 'NATIVE' | 'CUSTOM';  // default "CUSTOM" for scoped objects
  scope?: string;                 // default "global"
  access: 'VIEW' | 'EDIT' | 'ADMIN' | 'NONE';
}
```

### 11.4 The access-level hierarchy

```
NONE (0) < VIEW (1) < EDIT (2) < ADMIN (3)
```

- **VIEW** — can see the record/field in reads.
- **EDIT** — can create and update records (required for POST/PUT).
- **ADMIN** — can delete records (required for DELETE).
- **NONE** — explicitly denies (overrides PUBLIC fallback).

Most-restrictive-wins across multiple matched relationships: `MIN(rank)`. Visibility requires effective level ≥ VIEW (rank ≥ 1).

---

## 12. Example Requests

```http
# 1. (SYSTEM_ADMIN) Create a custom object
POST /orcaagents/objects
{ "code": "deal", "name": "Deal", "idAttribute": "deal_id",
  "scope": "sales", "accessPolicy": "REBAC_REQUIRED" }

# 2. (SYSTEM_ADMIN) Create attribute definitions
POST /orcaagents/headcount/admin/custom-attributes
{ "code": "deal_amount", "name": "Deal Amount", "dataType": "number",
  "accessPolicy": "REBAC_REQUIRED", "appliesToObjects": ["deal"], "scope": "sales" }

POST /orcaagents/headcount/admin/custom-attributes
{ "code": "deal_stage", "name": "Deal Stage", "dataType": "enum",
  "dataSchema": { "options": ["PROSPECT", "NEGOTIATION", "CLOSED"] },
  "appliesToObjects": ["deal"], "scope": "sales" }

# 3. (SYSTEM_ADMIN) Create relationship type and access rules
POST /orcaagents/headcount/admin/relationship-types
{ "code": "DEAL_DESK", "name": "Deal Desk", "assignable": true, "scope": "sales" }

# Object-level rule: DEAL_DESK can view all deal records
POST /orcaagents/headcount/admin/access-rules
{ "relationshipType": "DEAL_DESK", "objectCode": "deal", "access": "VIEW", "scope": "sales" }

# Attribute-level rule: DEAL_DESK can see deal_amount
POST /orcaagents/headcount/admin/access-rules
{ "relationshipType": "DEAL_DESK", "attributeCode": "deal_amount",
  "attributeScope": "CUSTOM", "access": "VIEW", "scope": "sales" }

# 4. (Admin) Assign a relationship
POST /orcaagents/headcount/employees/E-100/relationships?scope=sales
{ "relationshipEmployeeCode": "E-001", "relationshipType": "DEAL_DESK",
  "validPeriod": { "start": "2026-01-01", "end": "2026-12-31" } }

# 5. Create a record (SYSTEM_ADMIN or user with EDIT access)
POST /orcaagents/objects/deal/records
{ "scope": "sales",
  "attributes": { "deal_id": "D-001", "deal_amount": 50000,
                  "deal_stage": "PROSPECT", "employee_code": "E-100" } }

# 6. List records (any user — ReBAC-gated)
GET /orcaagents/objects/deal/records?scope=sales

# 7. Update a record
PUT /orcaagents/objects/deal/records/D-001
{ "scope": "sales", "attributes": { "deal_stage": "NEGOTIATION" } }

# 8. Delete a record (SYSTEM_ADMIN or user with ADMIN access)
DELETE /orcaagents/objects/deal/records/D-001

# 9. List all records in a scope (SYSTEM_ADMIN only — unmasked)
GET /orcaagents/objects/scope-records?scope=sales
```

---

## 13. Gotchas

1. **Builtin objects rejected**: `employee` and `requisition` cannot be used with record CRUD endpoints — use the [headcount API](employee-list.md) instead.
2. **Writes are permissive, reads are def-driven**: a successful `POST` does not guarantee the attribute will appear in subsequent `GET` responses. Ensure attribute definitions exist and records carry `employee_code`/`department_code` for ReBAC visibility.
3. **`pageSize` cap**: values above 100 are silently capped to 100 server-side.
4. **`totalCount` semantics**: counted after user filters, object-level gating, attribute masking, and empty-data filtering, before `LIMIT/OFFSET`.
5. **Empty-data filtering**: records where masking leaves zero visible attributes are omitted from list results — `totalCount` reflects this.
6. **Delete is cross-scope**: `DELETE` removes the record across all scopes. There is no scope parameter on the delete endpoint.
7. **PUBLIC records + ADMIN**: PUBLIC `access_policy` makes records visible to everyone, but the ADMIN rank needed for delete is unreachable via PUBLIC fallback. Non-system users cannot delete PUBLIC records without explicit ADMIN rules.
8. **TOCTOU on GET**: pre-transaction access checks on GET create a tiny race window. Accepted because GET is read-only (worst case: stale data self-corrected on next request). POST/PUT/DELETE use in-transaction checks with rollback on deny.
9. **CREATOR for backfilled records**: records with `created = NULL` (migrated from legacy data) never match the CREATOR computed relationship. To restore CREATOR access, manually `UPDATE scoped_objects SET created = '<email>'`.
10. **Scope consistency**: pass the same `?scope=` to list, get, relationship-type, and access-rule calls — mixing scopes produces confusing visibility results.
11. **Null requester**: when `p_requester_email` is NULL (never happens via HTTP — the handler always passes the JWT email), `scoped_object_list()` returns PUBLIC-rows-only.

---

## 14. Related Guides

- [storage-models.md](storage-models.md) — when to use Scoped Objects vs Firestore vs Employee Data Model
- [concepts.md](concepts.md) — scopes, objects, and attributes vocabulary
- [rebac.md](rebac.md) — the full ReBAC model (relationship types, access matrix, item relationships)
- [employee-list.md](employee-list.md) — the parallel API for the builtin employee object
- [yaml-onboarding.md](yaml-onboarding.md) — bulk-provision an entire scoped object model from YAML
- [`objects/SKILL.md`](../objects/SKILL.md) — full endpoint reference for the objects service
