---
name: datamodel-guide
description: "Conceptual guide to the Orca datamodel: scopes, objects, and attributes; the global employee object every sub-app shares; the ReBAC visibility model (Relationship Types, Access Matrix, Item Relationships); and employee list/filter usage. Read this before integrating with headcount or objects APIs."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Orca Datamodel Guide

The **datamodel** is the shared data backbone every Orca sub-app builds on. It is not a single API — it is a set of cross-cutting concepts implemented by the [`objects`](../objects/SKILL.md) and [`headcount`](../headcount/SKILL.md) services and enforced inside PostgreSQL.

**The golden rule:** sub-apps never own employee data. They read the same centrally-ingested employee records (one per workspace) through the visibility-aware list APIs, and extend them only through custom attributes — never by duplicating employee tables.

---

## 1. Mental Model

```
Scope ("global" | per-app partition)
 └── Object ("employee" [builtin], "requisition" [builtin], custom…)
      ├── Native attributes   — fixed columns/registry fields (e.g. first_name, pay_rate_amount)
      ├── Custom attributes   — workspace/system-defined, stored as JSONB per scope
      ├── Object types        — variants (e.g. FULL_TIME) that restrict allowed attributes
      └── Relationships (ReBAC)
           ├── Relationship Types  — HRBP, DIRECT_MANAGER, … (assignable vs computed)
           ├── Access Matrix       — per-(type × attribute) can_view rules
           └── Item Relationships  — "employee E-001 is HRBP for employee E-100"
```

Visibility is decided per request: the caller's JWT email resolves to an employee record, their relationships are matched, and `orca.employee_list()` masks fields (`''`/`NULL`) or hides rows accordingly. There is **no admin bypass** on read — admins manage the model via `/admin/*` endpoints but read through the same ReBAC lens as everyone else.

---

## 2. Topic Index

| # | Topic | Guide | When to read |
|---|-------|-------|--------------|
| 1 | **Scopes, Objects & Attributes** | [`concepts.md`](concepts.md) | You need the vocabulary: what a scope partitions, system vs workspace rows, native vs custom attributes, `access_policy` |
| 2 | **The Employee Object** | [`employee-object.md`](employee-object.md) | You need the employee schema: the 13 native fields, pay ledger, custom attributes, CSV ingest, user↔employee identity link |
| 3 | **ReBAC** | [`rebac.md`](rebac.md) | You need relationship-based visibility: relationship types, the access matrix, item relationships, and how masking/gating is enforced |
| 4 | **Employee List & Filters** | [`employee-list.md`](employee-list.md) | You want to query employees: paginated list, 7 composable filters, masked-field handling, TypeScript client examples |

Related service guides (endpoint-level references):

- [`objects/SKILL.md`](../objects/SKILL.md) — full CRUD for object & object-type definitions (`/orcaagents/objects`)
- [`headcount/SKILL.md`](../headcount/SKILL.md) — full headcount endpoint catalog (`/orcaagents/headcount`): CSV import, org tree, requisitions, admin ReBAC/scopes/custom-attribute endpoints

---

## 3. Sixty-Second Orientation

1. **Everything is scoped.** Every definition row carries `scope text DEFAULT 'global'`. Until a workspace creates its own scope, everything lives in `global`. → [concepts.md](concepts.md#1-scopes)
2. **`employee` is a builtin object.** Its identifier attribute is `employee_code`; its native fields are fixed; workspaces extend it with custom attributes only. → [employee-object.md](employee-object.md)
3. **Pay data is never a plain column.** `pay_rate_amount`, `pay_rate_currency`, `fx_rate_to_base` live in a temporal allocation ledger and are `REBAC_REQUIRED` — hidden unless a relationship grants access. → [employee-object.md](employee-object.md#3-native-attribute-registry)
4. **ReBAC = types + rules + assignments.** Stored rows cover assignable types (HRBP, Recruiter…); manager types are computed from the reporting chain. Field visibility = `COALESCE(access_rule, access_policy default)`. → [rebac.md](rebac.md)
5. **One list endpoint for everything.** `GET /orcaagents/headcount/employees` with composable filters (`department`, `status`, `search`, `manager`, `team`, `costCenter`, `scope`, pagination) returns a masked, paginated envelope. → [employee-list.md](employee-list.md)

---

## 4. Where Things Live (Backend Map)

| Concept | Table(s) | Go package | HTTP surface |
|---|---|---|---|
| Scopes | `orca.scopes` | `service/headcount/repository_scope.go` | `/orcaagents/headcount/admin/scopes` |
| Objects / types | `orca.objects`, `orca.object_types` | `service/objects/` | `/orcaagents/objects` |
| Attribute definitions | `orca.attribute_definitions` | `service/headcount/repository_admin.go` | `/orcaagents/headcount/admin/custom-attributes` |
| Employee records | `orca.employees`, `orca.employee_allocations` | `service/headcount/` | `/orcaagents/headcount/employees` |
| Scoped attribute values | `orca.attribute_values`, `orca.employee_scoped_attribute_values` | (trigger-maintained) | via `?scope=` on employee reads |
| Relationship types / rules / items | `orca.relationship_types`, `orca.relationship_access_rules`, `orca.item_relationships` | `service/headcount/repository_relationship.go` | `/orcaagents/headcount/(admin/)relationship-types`, `/admin/access-rules`, `/admin/item-relationships` |
| Visibility engine | `orca.employee_list()` SQL function | `service/headcount/repository_employee.go` | `GET /headcount/employees` |
| User↔employee identity | `orca.headcount_users_employees` | `service/headcount/repository_user_employee.go` | `/orcaagents/headcount/users-employees` |

---

## 5. Error Handling Standard

All endpoints return errors as `{ "error": "human-readable description" }`. Common datamodel errors:

| HTTP | Condition |
|---|---|
| `400` | Invalid scope/attribute/relationship code; non-assignable relationship type on assign |
| `403` | Modifying the immutable `global` scope; mutating a system-reserved row; non-admin calling `/admin/*` |
| `404` | Scope / object / type / rule / relationship not found |
| `409` | Duplicate code; deleting a scope or attribute definition still in use |
| `422` | Changing immutable fields on a system-built-in attribute definition |
