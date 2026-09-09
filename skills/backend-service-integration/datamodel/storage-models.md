---
name: datamodel-storage-models
description: "Choosing between the three Orca storage models: Firestore documents (schemaless, workspace/user-scoped, role-based access, no field masking), Employee Data Model (structured employee records with ReBAC cell-level masking + row gating), Scoped Objects (custom business objects with full ReBAC + per-record access policy + non-admin writes). Decision flowchart and comparison matrix included."
parent: datamodel-guide
---

# Storage Models: Choosing the Right Data Store

> Part of the [Datamodel Guide](SKILL.md). Orca provides three distinct data storage models for sub-apps. Each serves a different purpose and comes with its own access-control semantics. This guide helps sub-app developers and AI agents pick the right one.

---

## 1. Overview — Three Storage Models at a Glance

| | **Firestore (db service)** | **Employee Data Model** | **Scoped Objects** |
|---|---|---|---|
| **Storage engine** | Google Firestore (document DB) | PostgreSQL (`orca.employees` + `orca.attribute_values`) | PostgreSQL (`orca.scoped_objects` + `orca.attribute_values`) |
| **Data shape** | Schemaless JSON documents | Structured employee records with native + custom attributes | Arbitrary object records with custom attributes |
| **Identity** | Document path (`collection/docID`) | `employee_code` (one per workspace) | `(object_code, code_value)` per scope |
| **Scope** | Workspace or user-private | Global scope + per-app scopes | Global scope + per-app scopes |
| **Access control** | Role-based (admin/member/owner) — **no row-level or cell-level security** | ReBAC — cell-level field masking + row gating | ReBAC — cell-level field masking + per-record row gating + object-level rules |
| **Who writes** | Workspace admins (write), any member (read); user owns private docs | Admin via CSV ingest or API; sub-apps via supplement CSV or custom attributes | Any authenticated user (access-level gated); SYSTEM_ADMIN bypasses |
| **Best for** | App config, agent state, user preferences, scratchpad data | Anything coherently tied to employees — org charts, HR data, compensation | Custom business objects (deals, policies, plans) needing fine-grained visibility |

### Decision Flowchart

```
Is the data coherently about employees?
├── YES → Does it need cell-level (per-field) visibility control?
│   ├── YES → Employee Data Model (§3)
│   │         + custom attributes in your own scope
│   └── NO  → Employee Data Model (§3)
│             + custom attributes with access_policy=PUBLIC
│
└── NO → Does the data need per-record or per-field visibility
│        control based on organizational relationships?
│   ├── YES → Scoped Objects (§4)
│   │         Define custom objects, attributes, ReBAC rules
│   └── NO  → Is the data workspace-shared or user-private?
│       ├── Workspace-shared → Firestore (§2) — workspace docs
│       └── User-private     → Firestore (§2) — user docs
```

---

## 2. Firestore Storage (db Service)

The `db` service wraps Google Firestore and exposes a simple document CRUD API. It is the lightest-weight storage option and the only one that does **not** use PostgreSQL.

### 2.1 What It Stores

Schemaless JSON documents organized into two scoping levels:

| Scope | Firestore path pattern | Who can read | Who can write |
|---|---|---|---|
| **Workspace docs** | `/workspaces/{workspaceID}/{collection}/{docID}` | Any authenticated workspace member | Admins only (`SYSTEM_ADMIN` or `CUSTOMER_ADMIN`) |
| **User docs** | `/workspaces/{workspaceID}/users/{userEmail}/{collection}/{docID}` | The owning user only (`claims.Email == targetUserID`) | The owning user only |

Both scopes support subcollections (nested document hierarchies) and batch read/write operations.

### 2.2 Access Control

Firestore uses a simple **role-based** model — no row-level or cell-level security:

- **Workspace scope**: `ActionRead` = any workspace member; `ActionWrite` = admin role required.
- **User scope**: read and write both require `claims.Email == targetUserID` (ownership check).
- **No field masking**: every document field is fully visible to anyone authorized to read the document.
- **No row gating**: there is no concept of "hiding" a document from a workspace member who has read access to the collection.

### 2.3 API Surface

All endpoints are under `/orcaagents/db/` and use POST with JSON bodies:

| Operation | Workspace | User-Private |
|---|---|---|
| Read single doc | `POST /db/workspace/doc/read` | `POST /db/user/doc/read` |
| Write single doc | `POST /db/workspace/doc/write` | `POST /db/user/doc/write` |
| Delete doc | `POST /db/workspace/doc/delete` | — |
| Batch read | `POST /db/workspace/docs/batch/read` | `POST /db/user/docs/batch/read` |
| Batch write | `POST /db/workspace/docs/batch/write` | `POST /db/user/docs/batch/write` |
| List subcollections | `POST /db/workspace/doc/subcollections` | `POST /db/user/doc/subcollections` |
| List subcollection docs | `POST /db/workspace/doc/subcollection/docs` | `POST /db/user/doc/subcollection/docs` |

### 2.4 When to Use Firestore

- **Agent conversational state**: session variables, intermediate reasoning scratchpads (`temp:` prefixed keys).
- **App configuration**: workspace-level settings, feature toggles stored as documents.
- **User preferences**: private UI state, bookmarks, personal notes.
- **Unstructured or semi-structured data** that does not need relational queries, joins, or fine-grained access control.
- **Rapid prototyping**: schemaless documents let you iterate without migrations.

### 2.5 When NOT to Use Firestore

- Data that needs **field-level visibility control** (e.g., "HRBP sees compensation but not name").
- Data that needs **row-level gating** (e.g., "employees without a relationship should not see this record at all").
- Data that needs **relational queries** (joins, aggregations, referential integrity).
- Data that is coherently about **employees** — use the Employee Data Model instead to avoid duplicating the employee directory.

### 2.6 TypeScript Client Example

```typescript
import { orcaFetch } from '../common';

// Read a workspace-scoped document
export async function readWorkspaceDoc(docId: string): Promise<Record<string, any> | null> {
  const res = await orcaFetch('/orcaagents/db/workspace/doc/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Write a user-private document
export async function writeUserDoc(docId: string, data: Record<string, any>): Promise<void> {
  const res = await orcaFetch('/orcaagents/db/user/doc/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, data }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
```

---

## 3. Employee Data Model (Builtin)

The employee data model is the **shared, centrally-ingested employee directory** that every sub-app reads from. It is the single source of truth for "who works here" — sub-apps never create their own employee tables.

### 3.1 What It Stores

| Layer | Table | Content |
|---|---|---|
| **Native attributes** | `orca.employees` (columns) + `orca.employee_allocations` (pay ledger) | 13 fixed fields: `employee_code`, `first_name`, `last_name`, `work_email`, `hire_date`, `department_code`, `employee_type_code`, `manager_employee_code`, `cost_center_code`, `status`, `termination_date`, plus pay fields (`pay_rate_amount`, `pay_rate_currency`, `fx_rate_to_base`) in a temporal allocation ledger |
| **Custom attributes** | `employees.custom_attributes` (global scope JSONB) or `orca.attribute_values` (non-global scopes, temporal) | Workspace-defined extensions: `job_title`, `job_level`, `performance_rating`, etc. |
| **Relationships** | `orca.relationship_types` + `orca.relationship_access_rules` + `orca.item_relationships` | Who holds what relationship (HRBP, Recruiter, Direct Manager…) over which employee/department, with validity periods |
| **Org hierarchy** | `orca.employee_allocation_path` | Materialized manager chain for org trees, `team` filter, computed manager relationships |
| **User↔employee link** | `orca.headcount_users_employees` | Maps login email → `employee_code` for ReBAC requester resolution |

### 3.2 Access Control — ReBAC

The employee model uses **Relationship-Based Access Control** (ReBAC) with two enforcement layers: **cell-level attribute masking** (each attribute is `PUBLIC` or `REBAC_REQUIRED`) and **row-level gating** (employees with no relationship to the requester disappear when any attribute is `REBAC_REQUIRED`). There is no admin bypass on reads.

→ Full ReBAC model: [rebac.md](rebac.md) (relationship types §2, access matrix §3, item relationships §4, enforcement §6)

### 3.3 Scopes

Employee data can be read through different **scopes** (`?scope=` query param):

- **`global`** (default): definitions and custom attributes from `employees.custom_attributes` JSONB.
- **Named scope** (e.g., `performance`, `comp_plan`): definitions filtered to that scope; custom attribute values from `orca.attribute_values` / `orca.scoped_objects`; ReBAC rules specific to that scope.

Sub-apps typically create their own scope to isolate their custom attributes and access rules from other sub-apps.

### 3.4 API Surface

| Operation | Endpoint | Auth |
|---|---|---|
| List employees (masked, paginated) | `GET /orcaagents/headcount/employees` | Any authenticated user |
| Get single employee | `GET /orcaagents/headcount/employees/{code}?scope=` | Any authenticated user |
| List manager codes | `GET /orcaagents/headcount/employees/managers` | Any authenticated user |
| Org tree | `GET /orcaagents/headcount/org-tree` | Any authenticated user |
| CSV import (ingest) | `POST /orcaagents/headcount/imports/csv` → map → ingest | Admin |
| Create employee | `POST /orcaagents/headcount/employees` | Admin |
| Link user↔employee | `POST /orcaagents/headcount/users-employees` | Admin |
| Custom attribute CRUD | `/orcaagents/headcount/admin/custom-attributes` | Admin |
| Relationship type CRUD | `/orcaagents/headcount/(admin/)relationship-types` | Read: any; Write: admin |
| Access rule CRUD | `/orcaagents/headcount/admin/access-rules` | Admin |
| Item relationship CRUD | `/orcaagents/headcount/.../relationships`, `/admin/item-relationships` | Admin |
| Scope CRUD | `/orcaagents/headcount/admin/scopes` | Admin |

### 3.5 When to Use the Employee Data Model

- **Any data coherently associated with employees**: job titles, performance ratings, compensation, onboarding status, training records.
- **Org chart and reporting chain** visualization and traversal.
- **Sub-apps that extend employee profiles**: add custom attributes in your own scope (e.g., a "performance" scope with `performance_rating`, `goals_met`).
- **Cross-sub-app interoperability**: the 25 seeded system attribute definitions are the shared vocabulary — every sub-app reads and writes the same codes.
- **Visibility rules tied to organizational relationships**: "managers see their reports' compensation", "HRBPs see everything in their assigned department".

### 3.6 When NOT to Use the Employee Data Model

- Data that is **not about employees** (deals, policies, projects, equipment).
- Data that needs **non-employee object types** as first-class entities.
- Data that needs **per-record access policy** (some records PUBLIC, some REBAC_REQUIRED within the same object type) — use Scoped Objects instead.

### 3.7 Sub-App Integration Pattern

```
1. Create a scope:       POST /headcount/admin/scopes { code: "my_app", name: "My App" }
2. Add custom attributes: POST /headcount/admin/custom-attributes { code: "my_attr", scope: "my_app", ... }
3. Set access rules:      POST /headcount/admin/access-rules { relationshipType: "HRBP", attributeCode: "my_attr", ... }
4. Read employees:        GET /headcount/employees?scope=my_app
```

Sub-apps read the shared employee directory through the scope-aware list API and extend it only through custom attributes — never by creating parallel employee tables.

---

## 4. Scoped Objects (Generic Object Model)

Scoped Objects extend the datamodel beyond employees to **arbitrary business objects** — deals, policies, compensation plans, equipment — with the same ReBAC infrastructure used for employee visibility.

### 4.1 What It Stores

| Layer | Table | Content |
|---|---|---|
| **Object definitions** | `orca.objects` | Datamodel kinds: `deal`, `comp_plan`, `policy`, etc. Each has an `id_attribute` (e.g., `deal_id`) and an `access_policy` (`PUBLIC` or `REBAC_REQUIRED`) at the object level |
| **Object types** | `orca.object_types` | Variants of an object (e.g., `FULL_TIME` / `CONTRACTOR` for employee; `ACTIVE` / `CLOSED` for deal) with editor layout, behaviors, and validation rules |
| **Attribute definitions** | `orca.attribute_definitions` | Custom attribute schema (code, name, data_type, access_policy) per scope, shared with the employee model |
| **Record identity** | `orca.scoped_objects` | First-class identity row: `(workspace_id, object_code, code_value, scope)` + `data jsonb` snapshot + `created` (creator email) + `access_policy` |
| **Temporal attribute values** | `orca.attribute_values` | Temporal rows with `valid_period daterange` (GiST exclusion constraint); trigger-maintained snapshot into `scoped_objects.data` |
| **Relationships + access rules** | Same tables as employee model | `relationship_types`, `relationship_access_rules`, `item_relationships` — shared infrastructure |

### 4.2 Access Control — Full ReBAC Stack

Scoped Objects apply the **most comprehensive access control** in the platform. They extend the employee ReBAC model ([rebac.md](rebac.md)) with per-record and object-level controls:

- **Object-level gating** and **per-record access policy** (`PUBLIC` or `REBAC_REQUIRED` on each record)
- **Four-level access model**: `NONE < VIEW < EDIT < ADMIN` (write ops require EDIT/ADMIN, verified in-transaction with rollback on deny)
- **CREATOR computed relationship** and **self-view bypass** (scoped-object-only extensions)
- **Empty-data filtering**: records where masking leaves zero visible attributes are omitted

→ Full scoped-object ReBAC extensions: [rebac.md §9](rebac.md#9-scoped-object-rebac-extensions)  
→ Full visibility engine (16-CTE chain): [scoped-object-crud.md §7](scoped-object-crud.md#7-visibility-engine----orcascoped_object_list)

### 4.3 How Records Link to ReBAC

Records connect to the ReBAC chain via snapshot attributes: `employee_code` and/or `department_code` link to the requester's relationships on those entities. Records without either can still be accessed through object-level rules, CREATOR relationship, self-view bypass, or PUBLIC access policy.

→ Details and worked example: [scoped-object-crud.md §7.3](scoped-object-crud.md#73-how-records-link-to-rebac), [§12](scoped-object-crud.md#12-example-requests)

### 4.4 API Surface

| Operation | Endpoint | Auth |
|---|---|---|
| Object CRUD | `GET/POST/PUT/DELETE /orcaagents/objects/{code}` | Read: any; Write: admin |
| Object type CRUD | `GET/POST/PUT/DELETE /orcaagents/objects/{code}/types/{typeCode}` | Read: any; Write: admin |
| List records | `GET /orcaagents/objects/{code}/records?scope=` | Any authenticated user (ReBAC-gated) |
| Get record | `GET /orcaagents/objects/{code}/records/{codeValue}?scope=` | Any authenticated user (ReBAC-gated; 404 on denial) |
| Create record | `POST /orcaagents/objects/{code}/records` | SYSTEM_ADMIN bypasses; others need EDIT access (in-tx) |
| Update record | `PUT /orcaagents/objects/{code}/records/{codeValue}` | SYSTEM_ADMIN bypasses; others need EDIT access |
| Delete record | `DELETE /orcaagents/objects/{code}/records/{codeValue}` | SYSTEM_ADMIN bypasses; others need ADMIN access |
| List scope records | `GET /orcaagents/objects/scope-records?scope=` | SYSTEM_ADMIN only (unmasked) |
| Check record access | Service-level `CheckRecordAccess()` | Internal; used by handlers |

### 4.5 When to Use Scoped Objects

- **Custom business objects** that need fine-grained visibility: deals, compensation plans, legal policies, project budgets.
- **Per-record access control**: some records are public, others are confidential within the same object type.
- **Relationship-gated visibility**: "deal desk sees deal amounts", "budget owners see cost center budgets".
- **Non-admin writes**: regular users can create/edit records they have EDIT access on (not just admins).
- **Creator-tracked data**: "users can edit their own submissions" via the CREATOR computed relationship.
- **Data that needs relational integrity**: PostgreSQL transactions, temporal validity, foreign keys.

### 4.6 When NOT to Use Scoped Objects

- **Simple key-value config** or **unstructured documents** — use Firestore instead.
- **Data that is purely about employees** — use the Employee Data Model directly with custom attributes in your own scope.
- **Data that does not need any access control** — Firestore workspace docs are simpler.

### 4.7 Sub-App Integration Pattern (YAML Onboarding)

The fastest way to stand up a scoped object model is the YAML onboarding API (`SYSTEM_ADMIN`):

```yaml
version: 1
scope:
  code: acme_sales
  name: "Acme Sales"
objects:
  - code: deal
    name: Deal
    id_attribute: deal_id
attributes:
  - code: deal_amount
    name: Deal Amount
    data_type: number
    access_policy: REBAC_REQUIRED
    applies_to_objects: [deal]
relationship_types:
  - code: DEAL_DESK
    name: Deal Desk
    assignable: true
access_rules:
  - relationship_type: DEAL_DESK
    attribute_code: deal_amount
    attribute_scope: CUSTOM
    access: VIEW
sample_data:
  records:
    - object: deal
      attributes:
        deal_id: D-001
        deal_amount: 50000
        employee_code: E-100
  item_relationships:
    - item_type: EMPLOYEE
      item_code: E-100
      relationship_employee_code: E-001
      relationship_type: DEAL_DESK
tests:
  - name: deal-desk sees amount
    requester: hrbp@acme.com
    target: { object: deal, code: D-001 }
    attribute: deal_amount
    expect: visible
```

Apply with `POST /orcaagents/datamodel/apply`, validate with `POST /orcaagents/datamodel/validate`, preview with `POST /orcaagents/datamodel/preview`. See [yaml-onboarding.md](yaml-onboarding.md) for the full schema.

For the complete CRUD endpoint reference — list, get, create, update, delete records, plus object definitions, types, scoped attributes, relationships, and access rules — see [scoped-object-crud.md](scoped-object-crud.md).

---

## 5. Comparison Matrix

| Capability | Firestore | Employee Model | Scoped Objects |
|---|:---:|:---:|:---:|
| Schemaless documents | ✅ | ❌ | ❌ |
| Relational queries / joins | ❌ | ✅ | ✅ |
| Temporal attribute history | ❌ | ✅ (`attribute_values` + `employee_allocations`) | ✅ (`attribute_values`) |
| Workspace isolation | ✅ (path-scoped) | ✅ (`workspace_id`) | ✅ (`workspace_id`) |
| User-private data | ✅ (user docs) | ❌ | ❌ |
| Role-based access (admin/member) | ✅ | ✅ (admin endpoints) | ✅ (admin endpoints) |
| Cell-level field masking | ❌ | ✅ | ✅ |
| Row-level gating | ❌ | ✅ (when any `REBAC_REQUIRED` attr) | ✅ (per-record `access_policy`) |
| Object-level access rules | ❌ | ❌ | ✅ |
| Per-record access policy | ❌ | ❌ | ✅ |
| Four-level access (VIEW/EDIT/ADMIN/NONE) | ❌ | ❌ (VIEW only on reads) | ✅ |
| CREATOR computed relationship | ❌ | ❌ | ✅ |
| Self-view bypass | ❌ | ❌ | ✅ |
| Org hierarchy / manager chains | ❌ | ✅ | ✅ (via employee_code link) |
| CSV bulk ingest | ❌ | ✅ (3-phase pipeline) | ❌ |
| YAML bulk provisioning | ❌ | ✅ (via datamodel API) | ✅ (via datamodel API) |
| Non-admin writes | ❌ (admin-only for workspace) | ❌ (admin/CSV only) | ✅ (EDIT-level users) |
| In-transaction access checks | ❌ | ❌ | ✅ (rollback on deny) |
| Subcollection nesting | ✅ | ❌ | ❌ |

---

## 6. Common Patterns

### Pattern A: Sub-App with Employee Extensions Only

A performance-review sub-app that reads employees and adds review scores:

1. **Storage**: Employee Data Model with scope `performance_reviews`.
2. **Custom attributes**: `review_score`, `review_notes` (in scope `performance_reviews`).
3. **Access rules**: `DIRECT_MANAGER` → VIEW on `review_score`; `HRBP` → VIEW on all.
4. **Read**: `GET /headcount/employees?scope=performance_reviews`.

No custom objects needed — the employee record is the entity.

### Pattern B: Sub-App with Custom Business Objects

A deal-management sub-app:

1. **Storage**: Scoped Objects with scope `sales`.
2. **Object**: `deal` with `id_attribute: deal_id`, `access_policy: REBAC_REQUIRED`.
3. **Attributes**: `deal_amount` (REBAC_REQUIRED), `deal_stage` (PUBLIC), `employee_code` (links to ReBAC).
4. **Relationship type**: `DEAL_DESK` (assignable).
5. **Access rules**: `DEAL_DESK` → VIEW on deal (object-level rule).
6. **Records**: each deal carries `employee_code` to link visibility to org relationships.

### Pattern C: Sub-App with Mixed Storage

A legal-compliance sub-app:

1. **Firestore**: workspace docs for regulation repository config, corpus links.
2. **Scoped Objects**: `policy` records with per-record access policy (some public, some confidential).
3. **Employee Model**: reads employee directory for policy assignment and approval routing.

### Pattern D: Agent State and User Preferences

An AI agent that stores conversational state:

1. **Firestore workspace docs**: shared agent configuration, system prompt overrides.
2. **Firestore user docs**: per-user session state, conversation history, UI preferences.

---

## 7. Migration Between Models

| From → To | How |
|---|---|
| Firestore → Employee custom attributes | Extract structured data from docs, write via CSV supplement import or `POST /admin/custom-attributes` + attribute value writes |
| Firestore → Scoped Objects | Define object/attributes via YAML or API, migrate documents to records via `CreateRecord` |
| Employee attributes → Scoped Objects | Define a new object in a scope, migrate attribute values to scoped object records, update reads to use `GET /objects/{code}/records` |

**Key principle:** the three models are not mutually exclusive. A single sub-app commonly uses Firestore for config/state and Scoped Objects (or Employee extensions) for business data.
