---
name: datamodel-employee-object
description: "Schema reference for the builtin employee object: 13 native fields, pay allocation ledger (pay_rate_amount, pay_rate_currency, fx_rate_to_base in orca.employee_allocations), custom attributes, CSV ingest pipeline, user-employee identity link (orca.headcount_users_employees). Tables: orca.employees, orca.employee_allocations, orca.employee_allocation_path."
parent: datamodel-guide
---

# The Global Employee Object

> Part of the [Datamodel Guide](SKILL.md). The `employee` object is the most important object in the platform: **every sub-app must read the same centrally-ingested employee data** instead of maintaining its own copy. This file is the schema reference for that shared record.

---

## 1. Why Employee Data Is Centralized

- One employee record per `(workspace_id, employee_code)` — ingested once via the CSV pipeline (or created via API), read by every sub-app through the visibility-aware list APIs.
- Sub-apps extend the record **only through custom attributes** (optionally in their own [scope](concepts.md#1-scopes)) — never by creating parallel employee tables.
- Identity linkage (`orca.headcount_users_employees`) ties a login email to an employee code; this powers both "who am I" lookups and the [ReBAC](rebac.md) requester resolution.
- The reporting chain is materialized in `orca.employee_allocation_path`, powering org trees, `manager`/`team` filters, and computed manager relationships.

---

## 2. Storage Schema

```sql
orca.employees (
    employee_id            BIGSERIAL PK,
    workspace_id           text NOT NULL,
    employee_code          text NOT NULL,
    first_name             text NOT NULL DEFAULT '',
    last_name              text NOT NULL DEFAULT '',
    work_email             text NOT NULL DEFAULT '',
    status                 text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | TERMINATED | ON_LEAVE (Go constants)
    hire_date              date,
    termination_date       date,
    manager_employee_code  text,
    cost_center_code       text,
    department_code        text NOT NULL DEFAULT '',
    employee_type_code     text NOT NULL DEFAULT '',
    custom_attributes      jsonb NOT NULL DEFAULT '{}'::jsonb,   -- GIN (jsonb_path_ops)
    created_at / updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, employee_code)
    -- partial unique: (workspace_id, work_email) WHERE work_email <> ''
)
```

**Pay fields are NOT columns.** `pay_rate_amount`, `pay_rate_currency`, `fx_rate_to_base` live in `orca.employee_allocations` — a temporal ledger (`valid_period daterange`, GIST exclusion against overlapping slices per employee). The list API joins the *current* allocation slice. This preserves full compensation history instead of overwriting it.

**Manager chains** are materialized in `orca.employee_allocation_path` (`path text[]`, GIN-indexed; SQL `path[1]` = direct manager = Go `path[0]`; the employee themself is never in their own path). Rebuilt transactionally after every employee ingest.

---

## 3. Native Attribute Registry

The authoritative native-field list lives in `service/headcount/employee_native_fields.go` (`EmployeeNativeFields`). It drives CSV mapping target fields, coercion, and identifier handling.

| Key | Label | Type | Required | Identifier | Access Policy | Notes |
|---|---|---|---|---|---|---|
| `employee_code` | Employee Code | string | ✅ | ✅ | PUBLIC | Immutable identity; from `orca.objects.id_attribute` |
| `first_name` | First Name | string | | | PUBLIC | |
| `last_name` | Last Name | string | | | PUBLIC | |
| `work_email` | Work Email | string | | | PUBLIC | Basis of user↔employee auto-link |
| `hire_date` | Hire Date | date | | | PUBLIC | Output `YYYY-MM-DD` |
| `department_code` | Department Code | string | | | PUBLIC | Taxonomy: `departments` |
| `employee_type_code` | Employee Type | enum | | | PUBLIC | References an ACTIVE object type of `employee` |
| `pay_rate_amount` | Pay Rate Amount | number | | | **REBAC_REQUIRED** | Lives in allocations ledger |
| `pay_rate_currency` | Pay Rate Currency | string | | | **REBAC_REQUIRED** | char(3) |
| `termination_date` | Termination Date | date | | | PUBLIC | |
| `manager_employee_code` | Manager Employee Code | string | | | PUBLIC | Drives allocation paths |
| `cost_center_code` | Cost Center Code | string | | | PUBLIC | Taxonomy: `costcenters` |
| `fx_rate_to_base` | FX Rate to Base | number | | | **REBAC_REQUIRED** | Base-currency conversion |

Never masked (identifiers used for correlation): `employee_code`, `department_code`, `employee_type_code`, `status`. Everything else can be masked by ReBAC rules — see [rebac.md](rebac.md#3-access-matrix--access-rules).

Native attributes are also seeded as system rows in `orca.attribute_definitions` (`applies_to_objects: ["employee"]`) so the access matrix can target them uniformly with custom attributes.

---

## 4. Custom Attributes on Employees

### 4.1 The seeded standard catalog — reuse-first

The platform seeds **25 system-built-in attribute definitions** distilled from headcount domain experience (ported from the legacy Java `StdProperties` enum; `migrations/20260804000001_headcount_seed.sql`, applicability corrected by `20260810000001` §8). **15 of them apply to employees.**

> **Sub-apps must always reuse these seeded definitions instead of defining their own look-alike attributes.** Do not create a workspace attribute `title`, `grade`, or `base_salary` when `job_title`, `job_level`, and `pay_rate` already exist. The seeded codes are the shared vocabulary every sub-app reads and writes: CSV mapping target fields, access-matrix rules, taxonomy provisioning, and cross-app reporting all key off the definition `code`. A duplicate definition fragments that vocabulary and splits the data. Only create a new definition (via `POST /admin/custom-attributes`) when **no** seeded code genuinely fits the concept.

All 25 seeds are `required: false`, `access_policy: PUBLIC`, scope `global`, system-owned (`workspace_id NULL`): they **cannot be deleted** and their `data_type` is immutable; workspaces may relabel `name` and adjust `required` / `applies_to_objects` / `access_policy` (see [concepts.md §3.1](concepts.md#31-attribute-definitions-orcaattribute_definitions)).

**Employee-only attributes (4):**

| Code | Name | Type | Description |
|---|---|---|---|
| `apex_employee` | Apex Employee | string | Reference to the apex (top-of-hierarchy) employee — marks the root of the org chain |
| `compensation_currency` | Compensation Currency | string | Currency in which the employee's compensation is denominated |
| `employment_status` | Employment Status | string | Fine-grained employment lifecycle status, complementing the native `status` column |
| `employment_type` | Employment Type | string | Engagement classification (e.g. full-time / part-time / contract; see the `employmenttype` taxonomy) |

**Attributes shared by employee and requisition (11):**

| Code | Name | Type | Description |
|---|---|---|---|
| `job_title` | Job Title | string | Job title of the position or incumbent |
| `job_family` | Job Family | string | Grouping of related jobs (e.g. Engineering, Sales; see `jobfamilies` taxonomy) |
| `job_level` | Job Level | string | Seniority / grade of the role (e.g. L5; see `joblevels` taxonomy) |
| `job_location` | Job Location | string | Work location (see `locations` taxonomy) |
| `function` | Function | string | Business function the role belongs to (see `functions` taxonomy) |
| `pay_rate` | Pay Rate | number | Compensation rate value |
| `pay_type` | Pay Type | string | Pay cadence — canonical topics: `yearly`, `monthly`, `hourly` (`paytype` taxonomy) |
| `work_hours` | Work Hours | string | Weekly working hours / schedule |
| `source` | Source | string | Origin of the record — canonical topics: `hris`, `external`, `approved_backfill`, `approved_new_headcount`, `manual` (`sources` taxonomy) |
| `temp_end_date` | Temp End Date | date | End date of a temporary engagement |
| `hidden_when_inaccessible` | Hidden When Inaccessible | boolean | Hide the item entirely (not just fields) when the viewer lacks access |

**Requisition-only attributes (10)** — seeded but **not** applicable to employees; listed so integrators don't reinvent them on the wrong object:

`approval_date`, `approval_timestamp`, `backfill_for`, `backfill_for_id`, `business_impact`, `close_reason`, `confidential`, `position_description`, `reason_to_open`, `target_start_date`.

**Taxonomy vocabulary:** only the native `department_code` → `departments` and `cost_center_code` → `costcenters` links are hard-wired (`taxonomy_code`), but the seed also ships system taxonomies matching several attributes above (`jobfamilies`, `joblevels`, `locations`, `employmenttype`, `paytype`, `sources`, …) with canonical topics — prefer those vocabularies when writing values.

### 4.2 Workspace-defined attributes

Workspaces add genuinely new attributes via `POST /orcaagents/headcount/admin/custom-attributes` — see [concepts.md §3.2](concepts.md#32-admin-crud----orcaagentsheadcountadmincustom-attributes). Check the catalog in §4.1 first; reaching for a seeded code keeps the data interoperable across sub-apps.

### 4.3 How values surface

Values appear on API responses as a flat map, e.g. `"customAttributes": {"job_title": "Staff Engineer", "job_level": "L6"}`.

**Supplement CSV mode**: an import created with `supplement=true` merges *only* custom attributes onto existing employees (`UPDATE … SET custom_attributes = custom_attributes || @attrs`) — no new rows, no native writes. This is the safe way for a sub-app to contribute attribute values without owning the record.

---

## 5. Getting Employee Data In

Three-phase pipeline, each phase a River background job (full details: [`headcount/SKILL.md`](../headcount/SKILL.md)):

```
POST /orcaagents/headcount/imports/csv            (multipart: file, object_code=employee, supplement?)
  → POST /imports/csv/{id}/map                    (transform rows; GET /admin/mapping-target-fields lists targets)
  → POST /imports/csv/{id}/ingest                 (upsert employees + allocations)
```

Ingest post-processing automatically:

1. **Rebuilds `employee_allocation_path`** for the workspace (manager chains; cycles truncated).
2. **Provisions taxonomy topics** for `department_code` → `departments` and `cost_center_code` → `costcenters`.
3. **Auto-links users to employees** by work email (best-effort, see §6).

Single-record creation is also available: `POST /orcaagents/headcount/employees` (admin).

---

## 6. User ↔ Employee Identity Link

`orca.headcount_users_employees` maps `(workspace_id, user_email) → employee_code` (FK to employees). It is the bridge between an authenticated user and their employee record — and the input `orca.employee_list()` uses to resolve the ReBAC requester.

| Method | Path | Operation ID | Body / Params |
|---|---|---|---|
| `POST` | `/orcaagents/headcount/users-employees` | `headcountLinkUserEmployee` | `{userEmail, employeeCode}` (upsert, admin) |
| `GET` | `/orcaagents/headcount/users-employees` | `headcountGetUserEmployeeLink` | `?userEmail=` or `?employeeCode=`; bare → list (max 10000) |
| `DELETE` | `/orcaagents/headcount/users-employees` | `headcountUnlinkUserEmployee` | `{employeeCode}` (admin) |

```typescript
export interface UserEmployeeLink {
  workspaceId: string;
  userEmail: string;
  employeeCode: string;
}
```

**Integration implication:** if a caller has no link row, `employee_list()` resolves their employee code to `''` — no relationships match, so they see only `PUBLIC`-default fields, and (when any attribute is `REBAC_REQUIRED`) potentially zero rows. Link users before expecting relationship-scoped visibility to work.

---

## 7. Employee Types (Variants)

Employee types are ACTIVE `object_types` of the `employee` object (e.g. `FULL_TIME`, `CONTRACTOR`), managed under `/orcaagents/objects/employee/types` (see [`objects/SKILL.md`](../objects/SKILL.md)). The `/orcaagents/headcount/admin/employee-types` endpoints are **delegating aliases** over the objects service, kept for compatibility. Types drive:

- `employee_type_code` enum values on ingest and update.
- Which custom attributes apply (via type codes in `applies_to_objects` and `PUT …/employee-types/{code}/attributes` — [concepts.md §3.4](concepts.md#34-restricting-attributes-per-employee-type)).
- Editor layout/behavior/validation rules for employee forms.

---

## 8. Reading Employees

All reads go through the visibility-aware function — continue to [employee-list.md](employee-list.md) for the list endpoint, filters, and client code, and [rebac.md](rebac.md) for how field masking and row gating decide what a caller sees.
