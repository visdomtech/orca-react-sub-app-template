---
name: datamodel-yaml-onboarding
description: "YAML-driven datamodel onboarding: upload a single YAML file to create an entire scoped object model (scope, objects, attributes, relationship types, access rules, sample data, visibility tests). Idempotent apply, assertion-based validation against the real ReBAC engine, and interactive preview."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
parent: datamodel-guide
---

# Datamodel YAML Onboarding

The datamodel onboarding API lets system administrators onboard a complete scoped
object model from a single YAML file. The YAML covers all seven sections: scope,
objects, attributes (with object association), relationship types, access rules,
sample data (records + item relationships), and visibility tests.

All endpoints are gated to `SYSTEM_ADMIN` role.

---

## 1. YAML Schema (version: 1)

```yaml
version: 1
scope:
  code: acme_sales              # lowercase, ^[a-z][a-z0-9_]{0,63}$, != "global"
  name: "Acme Sales"
objects:
  - code: deal                  # builtin codes (employee, requisition) rejected
    name: Deal
    id_attribute: deal_id
attributes:
  - code: deal_amount
    name: Deal Amount
    data_type: number           # string|number|boolean|date|enum|object
    access_policy: REBAC_REQUIRED  # PUBLIC|REBAC_REQUIRED (default PUBLIC)
    applies_to_objects: [deal]  # empty = all objects
    required: false
relationship_types:
  - code: DEAL_DESK
    name: Deal Desk
    description: "Manages deal flow"
    assignable: true
access_rules:
  - relationship_type: DEAL_DESK
    attribute_code: deal_amount
    attribute_scope: CUSTOM     # NATIVE|CUSTOM (default CUSTOM)
    access: VIEW                # VIEW|EDIT|ADMIN|NONE (default VIEW)
sample_data:
  records:
    - object: deal
      attributes:
        deal_id: D-001          # must contain the object's id_attribute
        deal_amount: 50000
        employee_code: E-100
  item_relationships:
    - item_type: EMPLOYEE       # EMPLOYEE|DEPARTMENT
      item_code: E-100
      relationship_employee_code: E-001
      relationship_type: DEAL_DESK
      valid_from: "2026-01-01"  # optional; defaults to [today, ∞)
      valid_to: "2026-12-31"
tests:
  - name: deal-desk sees amount
    requester: hrbp@acme.com    # must be a real workspace user
    target:
      object: deal              # exactly one of {object+code} or {employee}
      code: D-001
    attribute: deal_amount
    expect: visible             # visible|masked|row-hidden
```

### Validation Rules

- **Scope:** code must match `^[a-z][a-z0-9_]{0,63}$` and must not be `global`.
- **Objects:** builtin codes (`employee`, `requisition`) are rejected. No duplicates.
- **Attributes:** `data_type` must be one of the allowed values. `access_policy` defaults to `PUBLIC`.
- **Cross-refs:** `applies_to_objects` entries must be declared or builtin. Access rule `attribute_code` and `relationship_type` must be declared. Records must contain the object's `id_attribute`. Test targets must specify exactly one kind.
- **Cardinality caps:** objects ≤100, attributes ≤500, rules ≤1000, records ≤1000, relationships ≤2000, tests ≤500.

---

## 2. Endpoints

### `POST /orcaagents/datamodel/apply`

Parses, validates, and **idempotently applies** all sections as workspace rows.
Invalid input returns 400 with zero writes. Valid input upserts each item:

- **created** — new row inserted
- **updated** — existing row changed
- **unchanged** — no write needed (delta detected)
- **skipped** — guard condition (e.g. system-reserved object)
- **error** — per-item failure with detail

**Apply order:** scope → objects → attributes → relationship_types → access_rules → records → item_relationships.

**Idempotency:** re-applying the same document yields all-`unchanged` with zero writes and zero `updated_at` churn.

**Response** includes the resolved `scope` code:
```json
{
  "scope": "comp_plan",
  "results": [...],
  "hasErrors": false
}
```

**No deletions:** apply never deletes existing rows. Use the cleanup endpoints to tear down scoped data.

**Audit:** logged as `datamodel_onboarding` entity, `import` action.

### `POST /orcaagents/datamodel/validate`

Parses the YAML, then **executes each test assertion** against the real ReBAC
visibility engine (`scoped_object_list()` / `employee_list()`).

Each assertion specifies: requester (real workspace user) × target record/employee ×
attribute × expected visibility (`visible` | `masked` | `row-hidden`).

**Response:**
```json
{
  "results": [
    { "name": "deal-desk sees amount", "requester": "hrbp@acme.com", "requesterEmployeeCode": "E-001", "target": "deal:D-001", "attribute": "deal_amount", "expected": "visible", "actual": "visible", "status": "pass" },
    { "name": "wrong expectation", "requester": "hrbp@acme.com", "target": "deal:D-001", "attribute": "deal_amount", "expected": "masked", "actual": "visible", "status": "fail" }
  ],
  "passed": 1, "failed": 1, "errored": 0, "total": 2
}
```

### `POST /orcaagents/datamodel/preview`

Returns the **masked/unmasked read output** for a chosen requester. The requester
must be a real workspace user (resolved via `access_users`).

**Request:**
```json
{ "requesterEmail": "hrbp@acme.com", "object": "deal", "code": "D-001" }
```

**Response:**
```json
{
  "requesterEmail": "hrbp@acme.com",
  "resolvedEmployeeCode": "E-001",
  "found": true,
  "items": [{ "codeValue": "D-001", "attributes": { "deal_id": "D-001", "deal_amount": 50000 } }],
  "totalCount": 1
}
```

Preview supports single-record (`object` + `code`), list mode (`object` only), and
employee mode (`employee` code).

**Audit:** logged as `datamodel_onboarding` entity, `read` action.

### `POST /orcaagents/datamodel/cleanup-records`

Deletes all **record data** (attribute values + scoped objects) for the given scope
in the caller's workspace. Object types, attribute definitions, and relationship
types are retained. Use this to re-apply sample data without rebuilding the schema.

**Request:**
```json
{ "scope": "comp_plan" }
```
`scope` is required and must not be `"global"` or empty (400).

**Response:**
```json
{
  "scope": "comp_plan",
  "scopeDeleted": false,
  "counts": { "attributeValues": 12, "scopedObjects": 3, "itemRelationships": 0, "accessRules": 0, "relationshipTypes": 0, "attributeDefinitions": 0, "objectTypes": 0, "objects": 0 }
}
```
`scopeDeleted` is always `false` for this endpoint (the scope row is never touched).

**Idempotent:** re-running on an already-clean scope returns 200 with zero counts.

**Audit:** logged as `datamodel_onboarding` entity, `delete` action.

### `POST /orcaagents/datamodel/cleanup-scoped-datamodel`

Full teardown of the scoped datamodel in the caller's workspace: record data,
item relationships (heuristic: via the scope's non-system relationship-type codes),
access rules, relationship types, attribute definitions, object types, and objects.
Post-commit, the scope registry row is deleted if no other workspace references it.

**Request / response:** same shape as cleanup-records. `scopeDeleted` reports the
scope row outcome:
- `true` — scope row deleted (unique to this workspace, or already gone).
- `false` — scope row retained because another workspace still references it
  (partial success: workspace teardown stands; scope registry preserved).

**Guard chain:** 401 → 403 (SYSTEM_ADMIN) → 503 (service nil) → 400 (invalid scope).

**Audit:** logged as `datamodel_onboarding` entity, `delete` action, with per-section counts.

---

## 2a. Scope Filter on Item Relationships

`GET /orcaagents/headcount/admin/item-relationships?scope=<code>` filters results
via the scope's relationship-type codes (the `item_relationships` table has no scope
column). When `scope` is omitted, defaults to `global`.

```sql
WHERE workspace_id = $ws
  AND relationship_type IN (
    SELECT code FROM orca.relationship_types
    WHERE (workspace_id = $ws OR workspace_id IS NULL)
      AND scope = $scope
  )
```

---

## 3. Semantics

### Idempotent Apply

Each section is processed with read-then-write:

| Section | Read | Write |
|---------|------|-------|
| scope | `GetScope(code)` → compare name | Create or Update |
| objects | `GetObject(ws, code, scope)` | Create or Update (name only; id_attribute immutable) |
| attributes | `ListCustomAttributeDefinitions(ws, scope)` | Create (never Update — system-row guard) |
| relationship_types | `GetRelationshipTypeByCode` | Create or Update (system rows skipped) |
| access_rules | `ListAccessRules(ws, "", scope)` | UpsertAccessRule |
| records | `GetRecordSnapshot` (unmasked) | Create or Update (subset = no-op) |
| item_relationships | `GetRelationshipsForItem` (dedupe) | AssignRelationship |

### System-Row Guards

- **Objects:** system-reserved objects (`WorkspaceID = nil`) produce an `error` item.
- **Attributes:** when the resolved definition is system-only, a workspace shadow is created (never calls Update which could mutate system rows).
- **Relationship types:** system-defined types are skipped (rules may still reference them).

### Record Idempotency

Records are compared by checking if YAML attributes are a subset of the snapshot
(`GetRecordSnapshot` reads unmasked data). If all YAML attribute values match the
snapshot, the record is `unchanged` — zero temporal churn, no new rows.

### Requester Resolution

For assertions and preview, the requester email is resolved:
1. Must exist in `access_users` (otherwise `error: unknown workspace user`).
2. Must be linked to an employee via `headcount_users_employees` (otherwise `error: user not linked to an employee`).
3. Requesters are memoized — each unique email is resolved once per validate call.

---

## 4. Security Notes

- All six endpoints require `SYSTEM_ADMIN` role (stricter than `IsAdmin()`).
- Preview and validate are requester-impersonation surfaces — they read data as the named requester, not as the admin. This is by design for access-rule validation.
- No admin bypass on reads — the ReBAC engine sees the named requester's relationships, not the admin's.
- Body size capped at 1 MiB on all endpoints.
- Per-section cardinality caps prevent abuse.
