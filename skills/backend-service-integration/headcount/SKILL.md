---
name: headcount-service-integration
description: "Integrate with the Orca Headcount & Organization Management API (`/orcaagents/headcount`). CSV import pipeline, org tree, requisitions, FX rates, taxonomies. Shared datamodel endpoints (employee list, ReBAC, scopes, custom attributes, object types) delegate to the Datamodel Guide."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Headcount & Organization Service Integration Guide

The **Headcount Service** is the central workforce planning and organization hierarchy engine. It manages employee records, manager trees, job assignments, requisitions, custom attributes, multi-currency FX rates, business relationships/access rules, and a high-performance 3-phase CSV import and transformation pipeline.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/headcount`
- **Auth & RBAC**:
  - Employee/Requisition/OrgTree reads: Authenticated workspace users (visibility filtering applies based on relationships & access rules)
  - Write/Mutation endpoints: Require **`CUSTOMER_ADMIN`** or **`SYSTEM_ADMIN`** role (`requireHeadcountAdmin`)
  - **Uniform rule**: All POST/PUT/PATCH/DELETE endpoints under `/headcount` require admin, including `map-one` (preview) and `/admin/*` GET endpoints (e.g. `headcountGetMappingTargetFields`)
- **Key Sub-Domains**:
  1. **Org Hierarchy & Employees**: Tree calculation, employee records, multi-assignment job history
  2. **Requisitions**: Job requisitions, approval status transitions
  3. **3-Phase CSV Ingest Engine**: Stage raw rows -> Map & transform -> Ingest into core entities
  4. **Dynamic Relationships & Scopes**: Employee/department relationships, role scoping
  5. **Custom Attributes & Types**: Schema-extensible attributes, employee & requisition types
  6. **FX Rates & Taxonomies**: Multi-currency conversion rates and topic trees

---

## 2. Cross-References

Many headcount endpoints are shared infrastructure with the datamodel layer.
For canonical documentation (SQL schema, semantics, worked examples), see:

| Endpoint Group | Canonical Reference |
|---|---|
| Employee list & filters | [`datamodel/employee-list.md`](../datamodel/employee-list.md) |
| Relationship types, access rules, item relationships | [`datamodel/rebac.md`](../datamodel/rebac.md) |
| Scoped object records, custom attributes, object types | [`datamodel/scoped-object-crud.md`](../datamodel/scoped-object-crud.md) |
| Employee schema, native fields, identity link | [`datamodel/employee-object.md`](../datamodel/employee-object.md) |

---

## 3. Endpoint Reference Table

Endpoints marked *(→ datamodel)* are canonically documented in the linked datamodel guide; the row is retained here for route completeness.

### Org Hierarchy & Employees

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/org-tree` | `headcountGetOrgTree` | Get organizational hierarchy tree |
| `GET` | `/orcaagents/headcount/employees` | `headcountListEmployees` | List employees with visibility scoping *(→ [employee-list.md](../datamodel/employee-list.md))* |
| `GET` | `/orcaagents/headcount/employees/managers` | `headcountListManagerCodes` | List employee codes of managers *(→ [employee-list.md §4](../datamodel/employee-list.md#4-related-read-endpoints))* |
| `GET` | `/orcaagents/headcount/employees/{employeeCode}` | `headcountGetEmployee` | Get employee by code *(→ [employee-list.md §4](../datamodel/employee-list.md#4-related-read-endpoints))* |
| `POST` | `/orcaagents/headcount/employees` | `headcountCreateEmployee` | Create a new employee with allocation |
| `POST` | `/orcaagents/headcount/employees/{employeeCode}/assignments` | `headcountCreateAssignment` | Create a new job assignment |

### 3-Phase CSV Import Pipeline

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `POST` | `/orcaagents/headcount/imports/csv` | `headcountUploadCSV` | Upload and stage CSV file for import |
| `POST` | `/orcaagents/headcount/imports/csv/{id}/process` | `headcountProcessCSVImport` | Enqueue CSV processing (legacy pipeline) |
| `POST` | `/orcaagents/headcount/imports/csv/{id}/map` | `headcountMapCSVImport` | Enqueue CSV map phase |
| `POST` | `/orcaagents/headcount/imports/csv/{id}/map-one` | `headcountMapOneRow` | Preview mapping evaluation on a single row |
| `GET` | `/orcaagents/headcount/imports/csv/{id}/mapped-records` | `headcountListCSVMappedRecords` | List mapped CSV import records |
| `PATCH` | `/orcaagents/headcount/imports/csv/{id}/mapped-records/{recordId}/include` | `headcountToggleMappedRecordInclude` | Toggle mapped record include flag |
| `PUT` | `/orcaagents/headcount/imports/csv/{id}/filter` | `headcountSetFilterExpression` | Set filter expression for CSV import |
| `POST` | `/orcaagents/headcount/imports/csv/{id}/ingest` | `headcountIngestCSVImport` | Enqueue CSV ingest phase |
| `GET` | `/orcaagents/headcount/imports/csv/{id}` | `headcountGetCSVImportStatus` | Get status of CSV import |
| `GET` | `/orcaagents/headcount/imports/csv` | `headcountListCSVImports` | List CSV imports for workspace |
| `GET` | `/orcaagents/headcount/imports/csv/{id}/records` | `headcountListCSVImportRecords` | List raw CSV import records |
| `POST` | `/orcaagents/headcount/imports/csv/{id}/retry` | `headcountRetryCSVImport` | Retry CSV import error rows |
| `GET` | `/orcaagents/headcount/imports/csv/{id}/download` | `headcountDownloadCSVImport` | Get signed download URL for the original CSV file |
| `GET` | `/orcaagents/headcount/admin/mapping-target-fields` | `headcountGetMappingTargetFields` | Get mapping target fields for an object type |
| `GET` | `/orcaagents/headcount/imports/csv/{id}/source-fields` | `headcountGetSourceFields` | Get source headers/fields from CSV |
| `PUT` | `/orcaagents/headcount/imports/csv/{id}/mapping` | `headcountSaveImportMapping` | Save field mapping configuration |

### Requisitions

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `POST` | `/orcaagents/headcount/requisitions` | `headcountCreateRequisition` | Create a new job requisition |
| `GET` | `/orcaagents/headcount/requisitions` | `headcountListRequisitions` | List job requisitions |
| `POST` | `/orcaagents/headcount/requisitions/{reqCode}/transition` | `headcountTransitionRequisition` | Transition requisition status |

### Relationships & Access Rules *(→ [rebac.md](../datamodel/rebac.md))*

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/employees/{employeeCode}/relationships` | `headcountGetEmployeeRelationships` | Get relationships for an employee |
| `POST` | `/orcaagents/headcount/employees/{employeeCode}/relationships` | `headcountAssignEmployeeRelationship` | Assign a relationship to an employee |
| `GET` | `/orcaagents/headcount/departments/{departmentCode}/relationships` | `headcountGetDepartmentRelationships` | Get relationships for a department |
| `POST` | `/orcaagents/headcount/departments/{departmentCode}/relationships` | `headcountAssignDepartmentRelationship` | Assign a relationship to a department |
| `GET` | `/orcaagents/headcount/relationship-types` | `headcountListRelationshipTypes` | List relationship types |
| `POST` | `/orcaagents/headcount/admin/relationship-types` | `headcountCreateRelationshipType` | Create relationship type |
| `PATCH` | `/orcaagents/headcount/admin/relationship-types/{code}` | `headcountUpdateRelationshipType` | Update relationship type |
| `DELETE` | `/orcaagents/headcount/admin/relationship-types/{code}` | `headcountDeleteRelationshipType` | Delete relationship type |
| `GET` | `/orcaagents/headcount/admin/access-rules` | `headcountListAccessRules` | List relationship access rules |
| `POST` | `/orcaagents/headcount/admin/access-rules` | `headcountUpsertAccessRule` | Upsert relationship access rule |
| `DELETE` | `/orcaagents/headcount/admin/access-rules/{ruleId}` | `headcountDeleteAccessRule` | Delete relationship access rule |
| `GET` | `/orcaagents/headcount/admin/item-relationships` | `headcountListAllItemRelationships` | List all item relationships |
| `POST` | `/orcaagents/headcount/admin/item-relationships` | `headcountAssignItemRelationship` | Assign an item relationship |
| `DELETE` | `/orcaagents/headcount/admin/item-relationships/{id}` | `headcountDeleteItemRelationship` | Delete an item relationship |

### Scopes *(→ [concepts.md](../datamodel/concepts.md))*

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/admin/scopes` | `headcountListScopes` | List scope codes |
| `POST` | `/orcaagents/headcount/admin/scopes` | `headcountCreateScope` | Create scope code |
| `GET` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountGetScope` | Get scope code details |
| `PATCH` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountUpdateScope` | Update scope code |
| `DELETE` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountDeleteScope` | Delete scope code |

### Admin CRUD *(→ [scoped-object-crud.md](../datamodel/scoped-object-crud.md), [employee-object.md](../datamodel/employee-object.md))*

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/admin/custom-attributes` | `headcountListCustomAttributes` | List custom attribute definitions |
| `POST` | `/orcaagents/headcount/admin/custom-attributes` | `headcountCreateCustomAttribute` | Create custom attribute definition |
| `PUT` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountUpdateCustomAttribute` | Update custom attribute definition |
| `DELETE` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountDeleteCustomAttribute` | Delete custom attribute definition |
| `GET` | `/orcaagents/headcount/admin/employee-types` | `headcountListEmployeeTypes` | List employee types *(→ [employee-object.md §7](../datamodel/employee-object.md#7-employee-types-variants))* |
| `POST` | `/orcaagents/headcount/admin/employee-types` | `headcountCreateEmployeeType` | Create employee type |
| `PUT` | `/orcaagents/headcount/admin/employee-types/{code}` | `headcountUpdateEmployeeType` | Update employee type |
| `DELETE` | `/orcaagents/headcount/admin/employee-types/{code}` | `headcountDeleteEmployeeType` | Delete employee type |
| `POST` | `/orcaagents/headcount/admin/employee-types/{code}/status` | `headcountSetEmployeeTypeStatus` | Set employee type status |
| `PUT` | `/orcaagents/headcount/admin/employee-types/{code}/attributes` | `headcountSetEmployeeTypeAttributes` | Set employee type allowed attribute codes |
| `GET` | `/orcaagents/headcount/admin/requisition-types` | `headcountListRequisitionTypes` | List requisition types |
| `POST` | `/orcaagents/headcount/admin/requisition-types` | `headcountCreateRequisitionType` | Create requisition type |
| `PUT` | `/orcaagents/headcount/admin/requisition-types/{code}` | `headcountUpdateRequisitionType` | Update requisition type |
| `DELETE` | `/orcaagents/headcount/admin/requisition-types/{code}` | `headcountDeleteRequisitionType` | Delete requisition type |
| `POST` | `/orcaagents/headcount/admin/requisition-types/{code}/status` | `headcountSetRequisitionTypeStatus` | Set requisition type status |

### FX Rates

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/admin/fx-rates` | `headcountListFXRates` | List historical FX rates |
| `POST` | `/orcaagents/headcount/admin/fx-rates` | `headcountCreateFXRate` | Create historical FX rate |

### Taxonomies

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/admin/taxonomies` | `headcountListTaxonomies` | List taxonomies |
| `POST` | `/orcaagents/headcount/admin/taxonomies` | `headcountCreateTaxonomy` | Create taxonomy |
| `PUT` | `/orcaagents/headcount/admin/taxonomies/{code}` | `headcountUpdateTaxonomy` | Update taxonomy |
| `DELETE` | `/orcaagents/headcount/admin/taxonomies/{code}` | `headcountDeleteTaxonomy` | Delete taxonomy |
| `GET` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics` | `headcountListTaxonomyTopics` | List taxonomy topics |
| `POST` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics` | `headcountCreateTaxonomyTopic` | Create taxonomy topic |
| `PUT` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics/{topicCode}` | `headcountUpdateTaxonomyTopic` | Update taxonomy topic |
| `DELETE` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics/{topicCode}` | `headcountDeleteTaxonomyTopic` | Delete taxonomy topic |

### User ↔ Employee Link *(→ [employee-object.md §6](../datamodel/employee-object.md#6-user--employee-identity-link))*

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `POST` | `/orcaagents/headcount/users-employees` | `headcountLinkUserEmployee` | Link user email to employee code |
| `GET` | `/orcaagents/headcount/users-employees` | `headcountGetUserEmployeeLink` | Get or list user employee links |
| `DELETE` | `/orcaagents/headcount/users-employees` | `headcountUnlinkUserEmployee` | Unlink user from employee |

---

### Employee List Query Parameters

For the full `headcountListEmployees` query parameter table (7 composable filters),
response envelope (`EmployeeListResult`), and TypeScript types (`EmployeeListRow`),
see [employee-list.md §1](../datamodel/employee-list.md#1-get-orcaagentsheadcountemployees).

---

## 4. TypeScript Interfaces

```typescript
export interface OrgTreeNode {
  employeeCode: string;
  name: string;
  title: string;
  email: string;
  directReports: OrgTreeNode[];
}

export interface CSVImport {
  id: number;
  workspaceId: string;
  status: 'STAGED' | 'MAPPING' | 'MAPPED' | 'INGESTING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  mappedRows: number;
  errorRows: number;
  createdAt: string;
}

export interface CreateFXRateRequest {
  baseCurrency: string;
  targetCurrency: string;
  fxRate: number;
  effectiveDate: string; // YYYY-MM-DD
}
```

Employee types (`EmployeeListRow`, `EmployeeListResult`) are defined in
[employee-list.md §1](../datamodel/employee-list.md#1-get-orcaagentsheadcountemployees).

---

## 5. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';
// Employee types: see datamodel/employee-list.md

export const headcountClient = {
  /**
   * Fetch the full org hierarchy tree.
   */
  async getOrgTree(): Promise<OrgTreeNode> {
    return orcaFetch<OrgTreeNode>('/orcaagents/headcount/org-tree', {
      method: 'GET',
    });
  },

  /**
   * Get employee details by code.
   * Returns EmployeeListRow (→ datamodel/employee-list.md).
   */
  async getEmployee(employeeCode: string): Promise<any> {
    return orcaFetch(`/orcaagents/headcount/employees/${encodeURIComponent(employeeCode)}`, {
      method: 'GET',
    });
  },

  /**
   * Upload CSV file to stage a new headcount import.
   * Form fields: file (CSV), object_code (default: "employee"),
   *   field_mapping (optional JSON), supplement (optional).
   */
  async uploadCSV(file: File, objectCode = 'employee'): Promise<{ importId: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('object_code', objectCode);
    return orcaFetch<{ importId: string; status: string }>('/orcaagents/headcount/imports/csv', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Get status of a CSV import pipeline run.
   */
  async getImportStatus(importId: number): Promise<CSVImport> {
    return orcaFetch<CSVImport>(`/orcaagents/headcount/imports/csv/${importId}`, {
      method: 'GET',
    });
  },
};
```

---

## 6. Code Examples & Real-World Flows

### Flow: Uploading, Mapping, and Ingesting Employee CSV

```typescript
import { headcountClient } from './headcountClient';
import { orcaFetch } from '../common';

async function importEmployeesFromCSV(file: File) {
  // 1. Upload & stage CSV
  const staged = await headcountClient.uploadCSV(file, 'employee');
  const importId = parseInt(staged.importId, 10);
  console.log(`Staged CSV with Import ID: ${importId}`);

  // 2. Trigger Map Phase
  await orcaFetch(`/orcaagents/headcount/imports/csv/${importId}/map`, { method: 'POST' });

  // 3. Poll for Mapped status
  let status = await headcountClient.getImportStatus(importId);
  while (status.status === 'MAPPING' || status.status === 'STAGED') {
    await new Promise((r) => setTimeout(r, 1000));
    status = await headcountClient.getImportStatus(importId);
  }

  // 4. Trigger Ingest Phase
  await orcaFetch(`/orcaagents/headcount/imports/csv/${importId}/ingest`, { method: 'POST' });
  console.log(`Ingest enqueued for import ID: ${importId}`);
}
```

---

## 7. Common Gotchas & Edge Cases

1. **Date Formatting**: All date inputs (`effectiveDate`, `hireDate`, `startDate`) expect format `YYYY-MM-DD`. Do not send RFC 3339 timestamps for date fields.
2. **Visibility Scoping**: Non-admin users only see employees and requisitions within their allowed manager hierarchy chain or granted by explicit Access Rules.
3. **Multi-Part CSV Upload**: When calling `uploadCSV`, do not manually set `Content-Type: multipart/form-data`; let the browser or `FormData` helper include the boundary header automatically.
4. **CSV Form Field Is `object_code`**: The multipart form field for specifying the target object type is `object_code` (not `target_object_type`). Default value is `employee`.
5. **`headcountListRelationshipTypes` Path**: This endpoint is at `/headcount/relationship-types` (not `/headcount/admin/relationship-types`). The create/update/delete mutations ARE under `/admin/`.
6. **`headcountListManagerCodes`**: A dedicated endpoint exists at `GET /headcount/employees/managers` returning `string[]` of employee codes where `direct_report_count > 0`. It must be registered before the `{employeeCode}` path parameter route.
