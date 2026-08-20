---
name: headcount-service-integration
description: "Integrate with the Orca Headcount & Organization Management API (`/orcaagents/headcount`). See endpoint table for full operation list."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Headcount & Organization Service Integration Guide

The **Headcount Service** is the central workforce planning and organization hierarchy engine. It manages employee records, manager trees, job assignments, requisitions, custom attributes, multi-currency FX rates, business relationships/access rules, and a high-performance 3-phase CSV import and transformation pipeline.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/headcount`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/headcount`
- **Auth & RBAC**:
  - Employee/Requisition/OrgTree reads: Authenticated workspace users (visibility filtering applies based on relationships & access rules)
  - Write/Mutation endpoints: Require **`ADMIN`** or **`SYSTEM_ADMIN`** role (`requireHeadcountAdmin`)
- **Key Sub-Domains**:
  1. **Org Hierarchy & Employees**: Tree calculation, employee records, multi-assignment job history
  2. **Requisitions**: Job requisitions, approval status transitions
  3. **3-Phase CSV Ingest Engine**: Stage raw rows -> Map & transform -> Ingest into core entities
  4. **Dynamic Relationships & Scopes**: Employee/department relationships, role scoping
  5. **Custom Attributes & Types**: Schema-extensible attributes, employee & requisition types
  6. **FX Rates & Taxonomies**: Multi-currency conversion rates and topic trees

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Summary |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/org-tree` | `headcountGetOrgTree` | Get organizational hierarchy tree |
| `GET` | `/orcaagents/headcount/employees` | `headcountListEmployees` | List employees with visibility scoping |
| `GET` | `/orcaagents/headcount/employees/managers` | `headcountListManagerCodes` | List employee codes of managers |
| `GET` | `/orcaagents/headcount/employees/{employeeCode}` | `headcountGetEmployee` | Get employee by code |
| `POST` | `/orcaagents/headcount/employees` | `headcountCreateEmployee` | Create a new employee with allocation |
| `POST` | `/orcaagents/headcount/employees/{employeeCode}/assignments` | `headcountCreateAssignment` | Create a new job assignment |
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
| `GET` | `/orcaagents/headcount/admin/mapping-target-fields` | `headcountGetMappingTargetFields` | Get mapping target fields for an object type |
| `GET` | `/orcaagents/headcount/imports/csv/{id}/source-fields` | `headcountGetSourceFields` | Get source headers/fields from CSV |
| `PUT` | `/orcaagents/headcount/imports/csv/{id}/mapping` | `headcountSaveImportMapping` | Save field mapping configuration |
| `POST` | `/orcaagents/headcount/requisitions` | `headcountCreateRequisition` | Create a new job requisition |
| `GET` | `/orcaagents/headcount/requisitions` | `headcountListRequisitions` | List job requisitions |
| `POST` | `/orcaagents/headcount/requisitions/{reqCode}/transition` | `headcountTransitionRequisition` | Transition requisition status |
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
| `GET` | `/orcaagents/headcount/admin/scopes` | `headcountListScopes` | List scope codes |
| `POST` | `/orcaagents/headcount/admin/scopes` | `headcountCreateScope` | Create scope code |
| `GET` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountGetScope` | Get scope code details |
| `PATCH` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountUpdateScope` | Update scope code |
| `DELETE` | `/orcaagents/headcount/admin/scopes/{code}` | `headcountDeleteScope` | Delete scope code |
| `GET` | `/orcaagents/headcount/admin/item-relationships` | `headcountListAllItemRelationships` | List all item relationships |
| `POST` | `/orcaagents/headcount/admin/item-relationships` | `headcountAssignItemRelationship` | Assign an item relationship |
| `DELETE` | `/orcaagents/headcount/admin/item-relationships/{id}` | `headcountDeleteItemRelationship` | Delete an item relationship |
| `GET` | `/orcaagents/headcount/admin/custom-attributes` | `headcountListCustomAttributes` | List custom attribute definitions |
| `POST` | `/orcaagents/headcount/admin/custom-attributes` | `headcountCreateCustomAttribute` | Create custom attribute definition |
| `PUT` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountUpdateCustomAttribute` | Update custom attribute definition |
| `DELETE` | `/orcaagents/headcount/admin/custom-attributes/{code}` | `headcountDeleteCustomAttribute` | Delete custom attribute definition |
| `GET` | `/orcaagents/headcount/admin/employee-types` | `headcountListEmployeeTypes` | List employee types |
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
| `GET` | `/orcaagents/headcount/admin/fx-rates` | `headcountListFXRates` | List historical FX rates |
| `POST` | `/orcaagents/headcount/admin/fx-rates` | `headcountCreateFXRate` | Create historical FX rate |
| `GET` | `/orcaagents/headcount/admin/taxonomies` | `headcountListTaxonomies` | List taxonomies |
| `POST` | `/orcaagents/headcount/admin/taxonomies` | `headcountCreateTaxonomy` | Create taxonomy |
| `PUT` | `/orcaagents/headcount/admin/taxonomies/{code}` | `headcountUpdateTaxonomy` | Update taxonomy |
| `DELETE` | `/orcaagents/headcount/admin/taxonomies/{code}` | `headcountDeleteTaxonomy` | Delete taxonomy |
| `GET` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics` | `headcountListTaxonomyTopics` | List taxonomy topics |
| `POST` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics` | `headcountCreateTaxonomyTopic` | Create taxonomy topic |
| `PUT` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics/{topicCode}` | `headcountUpdateTaxonomyTopic` | Update taxonomy topic |
| `DELETE` | `/orcaagents/headcount/admin/taxonomies/{taxonomyCode}/topics/{topicCode}` | `headcountDeleteTaxonomyTopic` | Delete taxonomy topic |
| `POST` | `/orcaagents/headcount/users-employees` | `headcountLinkUserEmployee` | Link user email to employee code |
| `GET` | `/orcaagents/headcount/users-employees` | `headcountGetUserEmployeeLink` | Get or list user employee links |
| `DELETE` | `/orcaagents/headcount/users-employees` | `headcountUnlinkUserEmployee` | Unlink user from employee |

---

### `headcountListEmployees` Query Parameters

| Param | Type | Description |
|---|---|---|
| `department` | `string` | Filter by department code |
| `status` | `string` | Filter by employment status (e.g. `ACTIVE`, `TERMINATED`, `ON_LEAVE`) |
| `search` | `string` | Search by name, email, or employee code (ILIKE) |
| `scope` | `string` | Datamodel scope (default `global`) |
| `manager` | `string` | Filter to direct reports of this employee code (`manager_employee_code = value`) |
| `team` | `string` | Filter to direct + indirect reports of this employee code (uses `employee_allocation_path`) |
| `costCenter` | `string` | Filter by cost center code |
| `page` | `int` | Page number (1-based, default 1) |
| `pageSize` | `int` | Page size (default 25, max 100) |

All filter params are optional and composable (AND semantics). ReBAC row-level visibility remains enforced regardless of filters.

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface Employee {
  employeeCode: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  status: 'ACTIVE' | 'TERMINATED' | 'LEAVE' | string;
  typeCode: string;
  hireDate: string; // YYYY-MM-DD
  terminationDate?: string;
  managerCode?: string;
  allocationPath?: string;
  customAttributes?: Record<string, any>;
  assignments?: Assignment[];
}

export interface Assignment {
  id: number;
  employeeCode: string;
  jobTitle: string;
  departmentCode: string;
  locationCode: string;
  fte: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
}

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
  effectiveDate: string; // YYYY-MM-DD or RFC3339
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

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
   * List employees with optional filters.
   */
  async listEmployees(params?: Record<string, string>): Promise<Employee[]> {
    const sp = new URLSearchParams(params);
    const qs = sp.toString();
    const suffix = qs ? '?' + qs : '';
    return orcaFetch<Employee[]>('/orcaagents/headcount/employees' + suffix, {
      method: 'GET',
    });
  },

  /**
   * Get employee details and assignment history by code.
   */
  async getEmployee(employeeCode: string): Promise<Employee> {
    return orcaFetch<Employee>(`/orcaagents/headcount/employees/${encodeURIComponent(employeeCode)}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new employee record.
   */
  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    return orcaFetch<Employee>('/orcaagents/headcount/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  /**
   * Upload CSV file to stage a new headcount import.
   * Form fields: file (CSV), object_code (default: "employee"), field_mapping (optional JSON), supplement (optional).
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

## 5. Code Examples & Real-World Flows

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

## 6. Common Gotchas & Edge Cases

1. **Date Formatting**: All date inputs (`effectiveDate`, `hireDate`, `startDate`) expect format `YYYY-MM-DD`. Do not send RFC 3339 timestamps for date fields.
2. **Visibility Scoping**: Non-admin users only see employees and requisitions within their allowed manager hierarchy chain or granted by explicit Access Rules.
3. **Multi-Part CSV Upload**: When calling `uploadCSV`, do not manually set `Content-Type: multipart/form-data`; let the browser or `FormData` helper include the boundary header automatically.
4. **CSV Form Field Is `object_code`**: The multipart form field for specifying the target object type is `object_code` (not `target_object_type`). Default value is `employee`.
5. **`headcountListRelationshipTypes` Path**: This endpoint is at `/headcount/relationship-types` (not `/headcount/admin/relationship-types`). The create/update/delete mutations ARE under `/admin/`.
6. **`headcountListManagerCodes`**: A dedicated endpoint exists at `GET /headcount/employees/managers` returning `string[]` of employee codes where `direct_report_count > 0`. It must be registered before the `{employeeCode}` path parameter route.
