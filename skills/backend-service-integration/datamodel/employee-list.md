# Employee List & Filters

> Part of the [Datamodel Guide](SKILL.md). This is the canonical way for any sub-app to read the shared employee data: one endpoint, composable filters, ReBAC-masked results, stable pagination.

---

## 1. `GET /orcaagents/headcount/employees`

- **Operation ID**: `headcountListEmployees` · **Auth**: any authenticated workspace user (no admin role needed).
- **Visibility**: results are attribute-masked and (when any attribute is `REBAC_REQUIRED`) row-gated per the caller's relationships — see [rebac.md §6](rebac.md#6-enforcement-in-employee_list). The caller's identity is their JWT email, resolved through the [user↔employee link](employee-object.md#6-user--employee-identity-link).
- **Backing SQL**: `orca.employee_list(...)` (12 positional params). All user filters apply **before** visibility and pagination, so `totalCount` and ReBAC gating are unaffected by filters.

### Query parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `department` | string | — | Exact `department_code` match |
| `status` | string | — | Exact match: `ACTIVE` / `TERMINATED` / `ON_LEAVE` |
| `search` | string | — | ILIKE substring over employee code, first name, last name, work email |
| `scope` | string | `global` | Datamodel [scope](concepts.md#1-scopes) — switches definitions, custom-attribute source, and ReBAC rules |
| `manager` | string | — | **Direct reports** of this employee code (`manager_employee_code =`) |
| `team` | string | — | **Direct + indirect reports** of this employee code (GIN-indexed `employee_allocation_path` lookup) |
| `costCenter` | string | — | Exact `cost_center_code` match |
| `page` | int | `1` | 1-based; values < 1 clamp to 1 |
| `pageSize` | int | `25` | Server-capped at **100** |

All filters are optional and compose with **AND** semantics.

### Response — paginated envelope (not a bare array)

```typescript
export interface EmployeeListResult {
  items: EmployeeListRow[];   // always non-null ([] when empty)
  totalCount: number;         // post-filter, post-row-gate, pre-pagination (COUNT(*) OVER())
  page: number;
  pageSize: number;
}

export interface EmployeeListRow {
  employeeId: string;                  // int64 serialized as string
  employeeCode: string;
  workspaceId: string;
  firstName: string;                   // '' when masked
  lastName: string;
  workEmail: string;
  status: string;                      // never masked
  hireDate?: string;                   // RFC3339; omitted when masked/absent
  terminationDate?: string;
  managerEmployeeCode?: string;        // omitted when masked/absent
  costCenterCode?: string;
  departmentCode: string;              // never masked
  employeeTypeCode: string;            // never masked
  customAttributes: Record<string, any>; // visibility-filtered; scope-aware source
  payRateAmount?: number;              // current allocation slice; omitted when masked
  payRateCurrency?: string;
  fxRateToBase?: number;
  relationshipType: string;            // sorted CSV of matched types, '' if none
  visibilitySource: 'rules' | 'defaults';
}
```

**Handling masked data**: treat `''` strings and absent optional fields as "not visible to you", not as "empty value". `status`, `departmentCode`, `employeeTypeCode`, `employeeCode` are always real.

---

## 2. TypeScript Client

```typescript
import { orcaFetch } from '../common';

export interface ListEmployeesParams {
  department?: string;
  status?: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  search?: string;
  scope?: string;
  manager?: string;     // direct reports of this employee code
  team?: string;        // direct + indirect reports
  costCenter?: string;
  page?: number;
  pageSize?: number;    // capped at 100 server-side
}

export async function listEmployees(params: ListEmployeesParams = {}): Promise<EmployeeListResult> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v));
  }
  const qs = sp.toString();
  const res = await orcaFetch(`/orcaagents/headcount/employees${qs ? '?' + qs : ''}`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Bounded fan-out: fetch every visible employee (mirrors the Orca frontend's
 * listAllEmployees — page 1 first, then remaining pages with concurrency ≤ 4).
 */
export async function listAllEmployees(params: ListEmployeesParams = {}): Promise<EmployeeListRow[]> {
  const pageSize = 100;
  const first = await listEmployees({ ...params, page: 1, pageSize });
  const pages = Math.min(Math.ceil(first.totalCount / pageSize), 50); // safety ceiling: 50 pages × 100/page = 5,000 max; warn or use cursor pagination for larger workforces
  const rest: EmployeeListRow[] = [];
  for (let p = 2; p <= pages; p += 4) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(4, pages - p + 1) }, (_, i) =>
        listEmployees({ ...params, page: p + i, pageSize })),
    );
    for (const r of batch) rest.push(...r.items);
  }
  return [...first.items, ...rest];
}
```

---

## 3. Example Requests

```http
# Plain paginated list
GET /orcaagents/headcount/employees?page=2&pageSize=25

# Department + status (AND)
GET /orcaagents/headcount/employees?department=ENG&status=ACTIVE

# Free-text search (code / first / last / email)
GET /orcaagents/headcount/employees?search=ada

# Direct reports of manager E1000
GET /orcaagents/headcount/employees?manager=E1000

# Full team (direct + indirect) of E1000, in a non-global scope
GET /orcaagents/headcount/employees?team=E1000&scope=performance

# Cost center
GET /orcaagents/headcount/employees?costCenter=CC-ENG
```

Example `200` body — a manager caller (`E1000`) viewing a direct report, with `workEmail` masked because no rule grants it:

```json
{
  "items": [
    {
      "employeeId": "42",
      "employeeCode": "E1001",
      "workspaceId": "ws-abc",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "workEmail": "",
      "status": "ACTIVE",
      "hireDate": "2023-05-01T00:00:00Z",
      "managerEmployeeCode": "E1000",
      "departmentCode": "ENG",
      "employeeTypeCode": "FULL_TIME",
      "customAttributes": { "job_level": "L6" },
      "relationshipType": "DIRECT_MANAGER",
      "visibilitySource": "rules"
    }
  ],
  "totalCount": 7,
  "page": 1,
  "pageSize": 25
}
```

### Choosing `manager` vs `team`

- `manager=E1000` → only rows whose `manager_employee_code` is `E1000` (direct reports).
- `team=E1000` → any employee whose allocation path contains `E1000` (the whole subtree). Caveat: employees created via HTTP (not CSV ingest) may lack allocation-path rows — a pre-existing limitation shared with the org tree.

---

## 4. Related Read Endpoints

| Method | Path | Operation ID | Returns |
|---|---|---|---|
| `GET` | `/orcaagents/headcount/employees/managers` | `headcountListManagerCodes` | `string[]` — employee codes with `direct_report_count > 0` (not ReBAC-filtered) |
| `GET` | `/orcaagents/headcount/employees/{employeeCode}?scope=` | `headcountGetEmployee` | Single `EmployeeListRow` (`404` if absent); header `X-Visibility-Source: rules\|defaults` |
| `GET` | `/orcaagents/headcount/org-tree` | `headcountGetOrgTree` | `{nodes: [...]}` flat parent-linked list, capped at 10,000 nodes |

`GET /employees/{code}` reuses the same `employee_list()` function (single-code filter, pageSize 1) — masking and gating are identical to the list.

```typescript
export async function getEmployee(employeeCode: string, scope?: string): Promise<EmployeeListRow> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await orcaFetch(`/orcaagents/headcount/employees/${encodeURIComponent(employeeCode)}${qs}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export async function listManagerCodes(): Promise<string[]> {
  const res = await orcaFetch('/orcaagents/headcount/employees/managers');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

---

## 5. Gotchas

1. **`pageSize` cap**: values above 100 are silently capped to 100 server-side.
2. **`totalCount` semantics**: counted after user filters and the ReBAC row gate, before `LIMIT/OFFSET`. Attribute masking never removes rows.
3. **Unlinked callers see less**: without a `users-employees` link, the caller matches no relationships — `PUBLIC` fields only, and zero rows when any attribute in scope is `REBAC_REQUIRED`.
4. **Masked ≠ empty**: masked strings arrive as `''`, masked dates/numbers are omitted. Don't render `''` as a real value.
5. **Route ordering**: `/employees/managers` is registered before `/employees/{employeeCode}` — always call the literal path for manager codes.
6. **Naming trap**: `service/headcount/filter.go` is the *CSV import* expression filter (`expr-lang`), unrelated to list filters. List filters live entirely in the `orca.employee_list()` SQL function and `repository_employee.go`.
7. **Scope consistency**: pass the same `?scope=` to list, get-by-code, relationship-type, and access-rule calls — mixing scopes produces confusing visibility results.
