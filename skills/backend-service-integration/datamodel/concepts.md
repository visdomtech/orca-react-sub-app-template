# Concepts: Scopes, Objects & Attributes

> Part of the [Datamodel Guide](SKILL.md). This file defines the three foundational vocabulary terms every other datamodel topic uses.

---

## 1. Scopes

A **scope** is a datamodel partitioning dimension — a named registry row whose code is carried as a `scope text NOT NULL DEFAULT 'global'` column on every datamodel-definition table. Definitions (objects, object types, attribute definitions, relationship types, access rules) and scoped attribute *values* are resolved **per scope**: a query for scope `S` only sees rows with `scope = S`.

Introduced by `migrations/20260811000000_scope_concept.sql` ("multi-app datamodel partitioning").

### 1.1 The `orca.scopes` registry

```sql
CREATE TABLE orca.scopes (
    code text PRIMARY KEY,   -- ^[a-z][a-z0-9_]{0,63}$
    name text NOT NULL
);
-- seeded with exactly one row: ('global', 'Global')
```

- **`global` is the default and is immutable** — updating or deleting it returns `403` (`ErrScopeImmutable`).
- Empty scope input defaults to `global` everywhere (HTTP query params, service methods).
- Write paths **validate scope existence**: referencing a phantom scope code is rejected.
- **Delete is guarded**: a scope referenced by any of `objects`, `object_types`, `attribute_definitions`, `relationship_types`, `relationship_access_rules`, `attribute_values`, or `employee_scoped_attribute_values` cannot be deleted (`409` in-use).

### 1.2 Admin CRUD — `/orcaagents/headcount/admin/scopes`

All endpoints require `ADMIN` or `SYSTEM_ADMIN` and are audit-logged.

| Method | Path | Operation ID | Body → Response |
|---|---|---|---|
| `GET` | `/scopes` | `headcountListScopes` | → `Scope[]` |
| `POST` | `/scopes` | `headcountCreateScope` | `{code, name}` → `201 Scope` |
| `GET` | `/scopes/{code}` | `headcountGetScope` | → `Scope` |
| `PATCH` | `/scopes/{code}` | `headcountUpdateScope` | `{name}` → `Scope` |
| `DELETE` | `/scopes/{code}` | `headcountDeleteScope` | → `204` |

```typescript
export interface Scope {
  code: string;   // e.g. "global"
  name: string;   // e.g. "Global"
}
```

### 1.3 What scope actually changes

Passing `?scope=` on read APIs switches three things at once:

1. **Which definitions resolve** — objects, types, attribute definitions, relationship types, and access rules are all filtered to `scope = S` (with workspace-over-system shadow resolution, see §2.2).
2. **Where custom attribute values come from** — `global` reads `employees.custom_attributes` JSONB directly; any other scope reads the trigger-maintained snapshot `orca.employee_scoped_attribute_values` for that scope (backed by the temporal `orca.attribute_values` table).
3. **Which ReBAC rules apply** — relationship types and access rules are scope-specific. (Computed manager relationships are the exception: they are scope-independent — see [rebac.md](rebac.md#5-computed-vs-assigned-relationships).)

---

## 2. Objects

An **object** is a datamodel kind — a named entity type with a designated identifier attribute. Defined in `orca.objects`; variants live in `orca.object_types`.

### 2.1 Schema

```sql
orca.objects (
    object_id    BIGSERIAL PK,
    workspace_id text,              -- NULL = system builtin, visible in every workspace
    code         text NOT NULL,     -- e.g. 'employee'
    name         text NOT NULL,
    id_attribute text NOT NULL,     -- identifier attribute key, e.g. 'employee_code' (immutable)
    status       text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DISABLED
    scope        text NOT NULL DEFAULT 'global',
    created_at / updated_at timestamptz
)
UNIQUE (workspace_id, scope, code) NULLS NOT DISTINCT

orca.object_types (
    object_type_id BIGSERIAL PK,
    workspace_id   text,            -- NULL = system
    object_code    text NOT NULL,
    code           text NOT NULL,   -- e.g. 'FULL_TIME'
    name           text NOT NULL,
    layout         jsonb DEFAULT '{"groups":[]}',        -- editor layout metadata
    behaviors      jsonb DEFAULT '{"behaviors":[]}',     -- closed 12-type behavior catalog
    rules          jsonb DEFAULT '{"rules":[]}',         -- closed validation-rule catalog
    status         text DEFAULT 'ACTIVE',
    sort_order     int  DEFAULT 0,
    scope          text DEFAULT 'global',
    ...
)
```

Seeded builtin objects (system rows, `workspace_id NULL`):

| code | name | id_attribute | Guard |
|---|---|---|---|
| `employee` | Employee | `employee_code` | cannot be updated/deleted/disabled (`403 system-reserved`) |
| `requisition` | Requisition | `req_code` | same |

### 2.2 System vs workspace rows (shadow resolution)

Every datamodel-definition table shares one resolution pattern:

- **System rows** (`workspace_id IS NULL`) are platform builtins visible in every workspace.
- **Workspace rows** shadow the system row with the same code within their scope:

```sql
SELECT DISTINCT ON (code) ...
FROM orca.objects
WHERE (workspace_id = @workspace_id OR workspace_id IS NULL)
  AND scope = @scope
ORDER BY code ASC, workspace_id NULLS LAST
```

- Updating a system object *type* inserts a workspace-scoped **shadow row**; the system row stays untouched.
- A DB trigger prevents a workspace row from claiming a system-reserved code on create (`409`).

Full endpoint reference: [`objects/SKILL.md`](../objects/SKILL.md).

---

## 3. Attributes

Objects carry two kinds of attributes:

| Kind | Defined by | Stored in | Examples |
|---|---|---|---|
| **Native** | The backend's per-object registry (`service/headcount/employee_native_fields.go`) | Real columns (`orca.employees`, `orca.employee_allocations`) | `first_name`, `hire_date`, `pay_rate_amount` |
| **Custom** | `orca.attribute_definitions` rows (system-seeded or workspace-created) | `employees.custom_attributes` JSONB (`global` scope) or `orca.attribute_values` (other scopes) | `job_title`, `job_level`, `confidential` |

### 3.1 Attribute definitions (`orca.attribute_definitions`)

```sql
definition_id      BIGSERIAL PK,
workspace_id       text,            -- NULL = system-built-in
code               text NOT NULL,
name               text NOT NULL,
data_type          text NOT NULL CHECK (data_type IN
                     ('string','number','boolean','date','enum','object')),
data_schema        jsonb,           -- free-form, e.g. enum options
applies_to_objects jsonb NOT NULL DEFAULT '[]',
required           boolean NOT NULL DEFAULT false,
taxonomy_code      text,            -- link to a taxonomy, e.g. 'departments'
access_policy      text NOT NULL DEFAULT 'PUBLIC'
                     CHECK (access_policy IN ('PUBLIC','REBAC_REQUIRED')),
scope              text NOT NULL DEFAULT 'global',
created_at / updated_at timestamptz
-- unique per (scope, code) for system rows; per (workspace_id, scope, code) for tenant rows
```

Key semantics:

- **`access_policy`** is the default visibility when no access rule matches: `PUBLIC` = everyone sees it; `REBAC_REQUIRED` = masked/hidden unless the requester holds a granting relationship. Access rules override the default — the exact formula is in [rebac.md](rebac.md#6-enforcement-in-employee_list).
- **`applies_to_objects` three-way rule**: a definition applies to object `O` iff the array is **empty**, contains `O`'s object code, or contains an **ACTIVE type code** of `O`. This is how "allowed attributes per employee type" is expressed.
- **System-definition update restriction**: `PUT` on a system-built-in definition (without a workspace shadow) may only change `name`, `applies_to_objects`, `required`, `access_policy`; `data_type`, `data_schema`, `taxonomy_code` are immutable (`422`).
- **Delete guard**: a definition still present in any employee's `custom_attributes` cannot be deleted (`409`).

### 3.2 Admin CRUD — `/orcaagents/headcount/admin/custom-attributes`

All admin-only. `?scope=` selects the scope (empty → `global`).

| Method | Path | Operation ID | Notes |
|---|---|---|---|
| `GET` | `/custom-attributes` | `headcountListCustomAttributes` | System + workspace rows, tenant shadow resolution |
| `POST` | `/custom-attributes` | `headcountCreateCustomAttribute` | `201`; duplicate/system-reserved code → `409` |
| `PUT` | `/custom-attributes/{code}` | `headcountUpdateCustomAttribute` | Workspace row first, else restricted system update |
| `DELETE` | `/custom-attributes/{code}` | `headcountDeleteCustomAttribute` | `204`; in-use → `409` |

```typescript
export interface CustomAttributeDefinition {
  definitionId: string;             // int64 serialized as string
  workspaceId: string | null;       // null = system-built-in
  code: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'object';
  dataSchema?: any;                 // e.g. { options: [...] } for enum
  appliesToObjects: string[];       // object codes and/or ACTIVE type codes
  required: boolean;
  taxonomyCode?: string;
  accessPolicy: 'PUBLIC' | 'REBAC_REQUIRED';
  scope: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Where values live

- **Scope `global`**: flat `{code: value}` entries in `employees.custom_attributes` (GIN-indexed).
- **Any other scope**: rows in `orca.attribute_values` (temporal, `valid_period daterange`, overlap-excluded), materialized by trigger into `orca.employee_scoped_attribute_values (workspace_id, employee_code, scope) → data jsonb` — the snapshot `employee_list()` reads for non-global scopes.
- Values only appear in API responses when their definition resolves for the `(workspace, scope)` and survives the access-policy/ReBAC check.

### 3.4 Restricting attributes per employee type

`PUT /orcaagents/headcount/admin/employee-types/{code}/attributes` with body `{"attributeCodes": ["job_title", ...]}` rewrites `applies_to_objects` across the workspace's definitions in one transaction so that **exactly** the listed codes contain that type code. System-built-in definitions are skipped (no cross-tenant writes).

---

## 4. Putting It Together

```http
# List scopes
GET /orcaagents/headcount/admin/scopes

# List objects visible to my workspace within a scope
GET /orcaagents/objects?scope=global

# List custom attribute definitions (system + workspace) for a scope
GET /orcaagents/headcount/admin/custom-attributes?scope=global

# Define a workspace custom attribute on employees, hidden unless a relationship grants it
POST /orcaagents/headcount/admin/custom-attributes
{
  "code": "performance_rating",
  "name": "Performance Rating",
  "dataType": "enum",
  "dataSchema": { "options": ["EXCEEDS", "MEETS", "BELOW"] },
  "appliesToObjects": ["employee"],
  "accessPolicy": "REBAC_REQUIRED"
}
```

Next: how the builtin `employee` object combines all of this — [employee-object.md](employee-object.md).
