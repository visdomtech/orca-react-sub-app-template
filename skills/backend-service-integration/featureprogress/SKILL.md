---
name: featureprogress-service-integration
description: "Integrate with the Orca Onboarding Feature Progress API (`/orcaagents/featureprogress`). Operations: listFeatures, getFeatureStatus, updateFeatureStatus, createFeature, getFeature, updateFeature, deleteFeature."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Feature Progress Service Integration Guide

The **Feature Progress Service** tracks tenant workspace onboarding progress, setup checklist milestones, and feature adoption states in PostgreSQL.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/featureprogress`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/featureprogress`
- **Auth & RBAC**:
  - `GET /features`, `GET /features/{feature}/status`, `GET /features/{id}`: Authenticated workspace users
  - `POST .../actions/updatestatus`: Requires **`ADMIN`** or **`SYSTEM_ADMIN`** role
  - CRUD on master features (`createFeature`, `updateFeature`, `deleteFeature`): Requires **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Track setup checklist items per workspace (e.g. `STARTED`, `INITING`, `UPLOADING`, `FINALIZING`, `CONFIRMATION`, `READY`, `COMPLETED`)
  - Admin management of onboarding feature catalog

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/featureprogress/features` | `listFeatures` | `void` | `Feature[]` | Lists all registered onboarding features |
| `GET` | `/orcaagents/featureprogress/features/{feature}/status` | `getFeatureStatus` | `void` | `FeatureProgress` | Gets the progress status of a feature in caller's workspace |
| `POST` | `/orcaagents/featureprogress/features/{feature}/actions/updatestatus` | `updateFeatureStatus` | `UpdateFeatureStatusRequest` | `FeatureProgress` | Updates progress status for a feature in workspace (Admin) |
| `POST` | `/orcaagents/featureprogress/features` | `createFeature` | `FeatureRequest` | `FeatureIdResponse` | Creates a new onboarding feature in catalog (System Admin) |
| `GET` | `/orcaagents/featureprogress/features/{id}` | `getFeature` | `void` | `Feature` | Returns details of an onboarding feature by ID |
| `PUT` | `/orcaagents/featureprogress/features/{id}` | `updateFeature` | `FeatureRequest` | `OkResponse` | Updates an onboarding feature by ID (System Admin) |
| `DELETE` | `/orcaagents/featureprogress/features/{id}` | `deleteFeature` | `void` | `OkResponse` | Deletes an onboarding feature from catalog (System Admin) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export type ProgressStatus = 'STARTED' | 'INITING' | 'UPLOADING' | 'FINALIZING' | 'CONFIRMATION' | 'READY' | 'COMPLETED';

export interface Feature {
  id: number;
  name: string;
  description?: string;
}

export interface FeatureProgress {
  feature: string;
  status: ProgressStatus;
  activeTask?: string;
}

export interface UpdateFeatureStatusRequest {
  status: ProgressStatus;
}

export interface FeatureRequest {
  name: string;
  description?: string;
}

export interface FeatureIdResponse {
  id: number;
}

export interface OkResponse {
  status: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const featureProgressClient = {
  /**
   * List all features available in the onboarding catalog.
   */
  async listFeatures(): Promise<Feature[]> {
    return orcaFetch<Feature[]>('/orcaagents/featureprogress/features', {
      method: 'GET',
    });
  },

  /**
   * Get workspace onboarding status for a specific feature.
   */
  async getStatus(featureName: string): Promise<FeatureProgress> {
    return orcaFetch<FeatureProgress>(`/orcaagents/featureprogress/features/${encodeURIComponent(featureName)}/status`, {
      method: 'GET',
    });
  },

  /**
   * Update workspace onboarding status for a feature (Admin).
   * Returns the updated FeatureProgress.
   */
  async updateStatus(featureName: string, status: ProgressStatus): Promise<FeatureProgress> {
    return orcaFetch<FeatureProgress>(`/orcaagents/featureprogress/features/${encodeURIComponent(featureName)}/actions/updatestatus`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get a feature by its numeric ID.
   */
  async getFeature(id: number): Promise<Feature> {
    return orcaFetch<Feature>(`/orcaagents/featureprogress/features/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new onboarding feature (System Admin).
   */
  async createFeature(req: FeatureRequest): Promise<FeatureIdResponse> {
    return orcaFetch<FeatureIdResponse>('/orcaagents/featureprogress/features', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * Update an existing onboarding feature (System Admin).
   */
  async updateFeature(id: number, req: FeatureRequest): Promise<OkResponse> {
    return orcaFetch<OkResponse>(`/orcaagents/featureprogress/features/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  /**
   * Delete an onboarding feature (System Admin).
   */
  async deleteFeature(id: number): Promise<OkResponse> {
    return orcaFetch<OkResponse>(`/orcaagents/featureprogress/features/${id}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Query & Path Parameters

| Endpoint | Parameter | Location | Type | Required | Description |
|---|---|---|---|---|---|
| `getFeatureStatus` | `feature` | path | `string` | yes | Feature name (e.g. `ORCA_ASK`, `ORCA_COMPLIANCE`). Short aliases `ASK` / `COMPLIANCE` are normalized. |
| `updateFeatureStatus` | `feature` | path | `string` | yes | Same as above. |
| `updateFeatureStatus` | `status` | body | `ProgressStatus` | yes | New status value. Must be one of the valid enum values. |
| `getFeature` | `id` | path | `number` | yes | Numeric feature ID. |
| `updateFeature` | `id` | path | `number` | yes | Numeric feature ID. |
| `deleteFeature` | `id` | path | `number` | yes | Numeric feature ID. |

---

## 6. SSE/Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| HTTP Status | Condition | Details |
|---|---|---|
| `400` | `updateFeatureStatus` with empty or invalid status | `"status is required"` or `"invalid status value"` |
| `400` | `createFeature` / `updateFeature` with empty name | `"name is required"` |
| `401` | Missing or invalid auth token | `"unauthorized"` |
| `403` | Non-admin calling `createFeature`, `updateFeature`, or `deleteFeature` | `"SYSTEM_ADMIN role required"` |
| `403` | Non-admin calling `updateFeatureStatus` | `"forbidden"` |
| `404` | Feature not found (get/update/delete/status) | `"feature not found"` |
| `409` | Duplicate feature name on create/update | Feature name already exists |
| `409` | Delete feature that is in use | Feature is in use and cannot be deleted |
| `500` | Database or unexpected error | Internal server error |

### Key Behaviors

1. **Default Status**: Getting status for a feature that has never been interacted with returns `STARTED` (not an error).
2. **Feature Name Normalization**: The `{feature}` path parameter is normalized — `ASK` or `ORCA_ASK` maps to `ORCA_ASK`, `COMPLIANCE` or `ORCA_COMPLIANCE` maps to `ORCA_COMPLIANCE`. Other values are uppercased.
3. **Workspace Isolation**: Feature statuses are per-workspace. Each workspace tracks its own progress independently.
