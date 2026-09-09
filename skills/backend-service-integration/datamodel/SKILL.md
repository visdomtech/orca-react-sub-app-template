---
name: datamodel-guide
description: "Orca datamodel guide: storage model selection (Firestore, Employee Data Model, Scoped Objects); scopes, objects, attributes; the global employee object; ReBAC (relationship types, access matrix, item relationships); employee list/filters; scoped object CRUD. YAML onboarding operations: datamodelApply, datamodelValidate, datamodelPreview, datamodelCleanupRecords, datamodelCleanupScopedDatamodel. Read before integrating with headcount, objects, or db APIs."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Orca Datamodel Guide

The **datamodel** is the shared data backbone every Orca sub-app builds on. It is not a single API — it is a set of cross-cutting concepts implemented by the [`objects`](../objects/SKILL.md), [`headcount`](../headcount/SKILL.md), and [`db`](../db/SKILL.md) services and enforced inside PostgreSQL and Firestore.

**The golden rules:**
- Sub-apps never own employee data. They read the same centrally-ingested employee records (one per workspace) through the visibility-aware list APIs, and extend them only through custom attributes — never by duplicating employee tables.
- Orca provides **three distinct storage models** — Firestore documents, the Employee Data Model, and Scoped Objects — each with different access-control semantics. Picking the right one is the first decision every sub-app makes. → [storage-models.md](storage-models.md)

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
           ├── Access Matrix       — per-(type × attribute) access rules (VIEW/EDIT/ADMIN/NONE)
           └── Item Relationships  — "employee E-001 is HRBP for employee E-100"
```

Visibility is decided per request: the caller's JWT email resolves to an employee record, their relationships are matched, and `orca.employee_list()` or `orca.scoped_object_list()` masks fields (`''`/`NULL`) or hides rows accordingly. There is **no admin bypass** on read — admins manage the model via `/admin/*` endpoints but read through the same ReBAC lens as everyone else.

---

## 2. Where Things Live (Backend Map)

| Concept | Table(s) / Engine | Go package | HTTP surface |
|---|---|---|---|
| **Firestore workspace docs** | Google Firestore (document DB) | `service/db/` | `/orcaagents/db/workspace/doc/*` |
| **Firestore user docs** | Google Firestore (document DB) | `service/db/` | `/orcaagents/db/user/doc/*` |
| Scopes | `orca.scopes` | `service/headcount/repository_scope.go` | `/orcaagents/headcount/admin/scopes` |
| Objects / types | `orca.objects`, `orca.object_types` | `service/objects/` | `/orcaagents/objects` |
| Attribute definitions | `orca.attribute_definitions` | `service/headcount/repository_admin.go` | `/orcaagents/headcount/admin/custom-attributes` |
| Employee records | `orca.employees`, `orca.employee_allocations` | `service/headcount/` | `/orcaagents/headcount/employees` |
| Scoped attribute values | `orca.attribute_values`, `orca.scoped_objects` | (trigger-maintained) | via `?scope=` on employee reads or `/objects/{code}/records` |
| Record CRUD (scoped objects) | `orca.scoped_objects` + `orca.attribute_values` | `service/objects/repository_records.go` | `/orcaagents/objects/{code}/records` |
| Relationship types / rules / items | `orca.relationship_types`, `orca.relationship_access_rules`, `orca.item_relationships` | `service/headcount/repository_relationship.go` | `/orcaagents/headcount/(admin/)relationship-types`, `/admin/access-rules`, `/admin/item-relationships` |
| Visibility engine (employees) | `orca.employee_list()` SQL function | `service/headcount/repository_employee.go` | `GET /headcount/employees` |
| Visibility engine (objects) | `orca.scoped_object_list()` SQL function | `service/objects/repository_records.go` | `GET /objects/{code}/records` |
| User↔employee identity | `orca.headcount_users_employees` | `service/headcount/repository_user_employee.go` | `/orcaagents/headcount/users-employees` |

---

## 3. Topic Index

| # | Topic | Guide | When to read |
|---|-------|-------|--------------|
| 1 | **Scopes, Objects & Attributes** | [`concepts.md`](concepts.md) | **Start here.** You need the vocabulary: what a scope partitions, system vs workspace rows, native vs custom attributes, `access_policy` |
| 2 | **Storage Model Selection** | [`storage-models.md`](storage-models.md) | You need to pick the right data store: Firestore (schemaless docs, no fine-grained access), Employee Data Model (employee-centric data with ReBAC), or Scoped Objects (custom business objects with full ReBAC + per-record control) |
| 3 | **The Employee Object** | [`employee-object.md`](employee-object.md) | You need the employee schema: the 13 native fields, pay ledger, custom attributes, CSV ingest, user↔employee identity link |
| 4 | **ReBAC** | [`rebac.md`](rebac.md) | You need relationship-based visibility: relationship types, the access matrix, item relationships, and how masking/gating is enforced (both employee and scoped-object reads) |
| 5 | **Scoped Object CRUD** | [`scoped-object-crud.md`](scoped-object-crud.md) | You want to create, read, update, or delete custom object records with ReBAC visibility; manage object definitions, types, scoped attributes, relationships, and access rules |
| 6 | **Employee List & Filters** | [`employee-list.md`](employee-list.md) | You want to query employees: paginated list, 7 composable filters, masked-field handling, TypeScript client examples |
| 7 | **YAML Onboarding** | [`yaml-onboarding.md`](yaml-onboarding.md) | You want to bulk-provision a datamodel (scope, objects, attributes, ReBAC, sample data) from a single YAML file, or validate access-rule assertions |

**YAML Onboarding operations** (all `SYSTEM_ADMIN`, all under `/orcaagents/datamodel/`):

| Operation ID | Method | Path | Description |
|---|---|---|---|
| `datamodelApply` | POST | `/orcaagents/datamodel/apply` | Parse, validate, and idempotently apply a YAML document |
| `datamodelValidate` | POST | `/orcaagents/datamodel/validate` | Run visibility assertions against real ReBAC engine |
| `datamodelPreview` | POST | `/orcaagents/datamodel/preview` | Preview ReBAC-masked output for a chosen requester |
| `datamodelCleanupRecords` | POST | `/orcaagents/datamodel/cleanup-records` | Delete workspace-scoped record data for a scope |
| `datamodelCleanupScopedDatamodel` | POST | `/orcaagents/datamodel/cleanup-scoped-datamodel` | Full teardown of all workspace-scoped datamodel data |

Related service guides (endpoint-level references):

- [`objects/SKILL.md`](../objects/SKILL.md) — delegation index pointing to this guide's scoped-object-crud.md for all object/type/record endpoints
- [`headcount/SKILL.md`](../headcount/SKILL.md) — CSV import pipeline, org tree, requisitions, FX rates, taxonomies; shared endpoints delegate back to this guide

---

## 4. Common Reading Paths

Multi-document paths for frequent agent tasks:

| Task | Read path |
|---|---|
| Pick a storage model for a new sub-app | [concepts.md](concepts.md) → [storage-models.md](storage-models.md) |
| Understand why a field is masked | [rebac.md](rebac.md) §3.2 (precedence formula), §6 (enforcement) → [employee-list.md](employee-list.md) §5 (gotchas) |
| Create or update a custom object record | [scoped-object-crud.md](scoped-object-crud.md) §1–5 (record CRUD) |
| Define a new scoped object type with access rules | [concepts.md](concepts.md) → [scoped-object-crud.md](scoped-object-crud.md) §8–11 |
| Provision a complete datamodel from YAML | [yaml-onboarding.md](yaml-onboarding.md) §1–2 |
| Debug a "record not found" error | [scoped-object-crud.md](scoped-object-crud.md) §7 (visibility engine), §13 (gotchas) |
| Understand scoped-object ReBAC extensions | [rebac.md](rebac.md) §9 (scoped-object ReBAC) |
| List employees with org hierarchy filters | [employee-list.md](employee-list.md) §1 (query params), §3 (examples) |

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
