---
name: jurisdiction-service-integration
description: "Integrate with the Orca Legal Jurisdictions Catalog API (`/orcaagents/jurisdictions`). Operations: listJurisdictions, getJurisdiction, getJurisdictionByCode, upsertJurisdiction, deleteJurisdiction."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Legal Jurisdictions Service Integration Guide

The **Jurisdictions Service** provides a standardized 3-level catalog of US employment and labor law jurisdictions (`FEDERAL`, `STATE`, `CITY`).

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/jurisdictions`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/jurisdictions`
- **Auth & RBAC**:
  - `GET`: Open to any authenticated user
  - `POST` / `DELETE`: Requires **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Hierarchy query (e.g. all cities under California state ID)
  - Full-text search on official names / full names
  - Resolution by jurisdiction ID or code string (e.g., `US-CA-SF`, `US-NY`)

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/jurisdictions` | `listJurisdictions` | `ListJurisdictionsQuery` | `Jurisdiction[]` | Lists jurisdictions with optional type/parent/search filters |
| `GET` | `/orcaagents/jurisdictions/{id}` | `getJurisdiction` | `void` | `Jurisdiction` | Returns a single jurisdiction by numeric ID |
| `GET` | `/orcaagents/jurisdictions/by-code/{code}` | `getJurisdictionByCode` | `void` | `Jurisdiction` | Returns a single jurisdiction by code string |
| `POST` | `/orcaagents/jurisdictions` | `upsertJurisdiction` | `UpsertJurisdictionRequest` | `Jurisdiction` | Creates or updates a jurisdiction (System Admin) |
| `DELETE` | `/orcaagents/jurisdictions/{id}` | `deleteJurisdiction` | `void` | `OkResponse` | Deletes a jurisdiction by ID (System Admin) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export type JurisdictionType = 'FEDERAL' | 'STATE' | 'CITY';

export interface Jurisdiction {
  jurisdictionId: number;
  jurisdictionType: JurisdictionType;
  parentJurisdictionId: number | null;
  code: string;               // e.g. "US", "US-CA", "US-CA-SF"
  name: string;               // e.g. "San Francisco"
  fullName: string | null;    // e.g. "City and County of San Francisco"
  fipsCode: string | null;
  population: number | null;
  websiteUrl: string | null;
  laborDeptUrl: string | null;
  timezone: string | null;    // IANA timezone
  aliases: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any> | null;
}

export interface ListJurisdictionsQuery {
  type?: JurisdictionType;
  parent?: number;  // Filter children of parent jurisdiction ID
  q?: string;       // Full-text search query
}

export interface UpsertJurisdictionRequest {
  jurisdictionType: JurisdictionType;
  code: string;
  name: string;
  parentJurisdictionId?: number;
  fullName?: string;
  fipsCode?: string;
  population?: number;
  websiteUrl?: string;
  laborDeptUrl?: string;
  timezone?: string;
  aliases?: string[];
  metadata?: Record<string, any>;
}

export interface OkResponse {
  status: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const jurisdictionClient = {
  /**
   * Search or list jurisdictions with optional filters.
   * Precedence: q > type > parent > (all).
   */
  async listJurisdictions(query: ListJurisdictionsQuery = {}): Promise<Jurisdiction[]> {
    const params = new URLSearchParams();
    if (query.type) params.set('type', query.type);
    if (query.parent) params.set('parent', query.parent.toString());
    if (query.q) params.set('q', query.q);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return orcaFetch<Jurisdiction[]>(`/orcaagents/jurisdictions${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Get jurisdiction by unique code (e.g. "US-CA-SF"). Case-insensitive.
   */
  async getByCode(code: string): Promise<Jurisdiction> {
    return orcaFetch<Jurisdiction>(`/orcaagents/jurisdictions/by-code/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  },

  /**
   * Get jurisdiction by numeric ID.
   */
  async getById(id: number): Promise<Jurisdiction> {
    return orcaFetch<Jurisdiction>(`/orcaagents/jurisdictions/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create or update a jurisdiction by code (System Admin).
   */
  async upsert(req: UpsertJurisdictionRequest): Promise<Jurisdiction> {
    return orcaFetch<Jurisdiction>('/orcaagents/jurisdictions', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * Delete a jurisdiction by ID (System Admin).
   */
  async delete(id: number): Promise<OkResponse> {
    return orcaFetch<OkResponse>(`/orcaagents/jurisdictions/${id}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Query & Path Parameters

| Endpoint | Parameter | Location | Type | Required | Description |
|---|---|---|---|---|---|
| `listJurisdictions` | `type` | query | `JurisdictionType` | no | Filter by type: `FEDERAL`, `STATE`, or `CITY` |
| `listJurisdictions` | `parent` | query | `number` | no | Filter children of parent jurisdiction ID |
| `listJurisdictions` | `q` | query | `string` | no | Full-text search on name/fullName |
| `getJurisdiction` | `id` | path | `number` | yes | Numeric jurisdiction ID |
| `getJurisdictionByCode` | `code` | path | `string` | yes | Jurisdiction code (case-insensitive) |
| `deleteJurisdiction` | `id` | path | `number` | yes | Numeric jurisdiction ID |

**Filter Precedence**: When multiple query params are provided, precedence is `q` > `type` > `parent` > (list all).

---

## 6. SSE/Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| HTTP Status | Condition | Details |
|---|---|---|
| `400` | Invalid `type` query param value | `"invalid type; must be FEDERAL, STATE, or CITY"` |
| `400` | Invalid `jurisdictionType` in upsert body | `"invalid jurisdictionType; must be FEDERAL, STATE, or CITY"` |
| `400` | Missing required fields in upsert | Validation error from Huma |
| `401` | Missing or invalid auth token | `"unauthorized"` |
| `403` | Non-SYSTEM_ADMIN calling `upsertJurisdiction` or `deleteJurisdiction` | `"SYSTEM_ADMIN role required"` |
| `404` | Jurisdiction not found (get/getByCode/delete) | `"jurisdiction not found"` |
| `500` | Database or unexpected error | Internal server error |

### Key Behaviors

1. **Case-Insensitive Code Lookup**: `getJurisdictionByCode` matches codes case-insensitively (e.g., `us-ca` matches `US-CA`).
2. **Upsert Semantics**: `POST /jurisdictions` inserts a new row or updates the existing one with the same `code` (ON CONFLICT on code). Returns the full jurisdiction row after write with HTTP 201.
3. **Nullable Fields**: Many Jurisdiction fields (`parentJurisdictionId`, `fullName`, `fipsCode`, `population`, `websiteUrl`, `laborDeptUrl`, `timezone`, `metadata`) are nullable and will be `null` in JSON when the database column is NULL.
