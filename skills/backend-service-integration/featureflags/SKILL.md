---
name: featureflags-service-integration
description: "Integrate with the Orca Feature Flags & Module Flags API (`/orcaagents/featureflags` & `/orcaagents/moduleflags`). Operations: listFeatureFlags, addFeatureFlag, removeFeatureFlag, listModuleFlags, addModuleFlag, removeModuleFlag."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Feature & Module Flags Service Integration Guide

The **Feature Flags Service** manages workspace-scoped feature toggles and higher-level module capability flags in PostgreSQL.

---

## 1. Overview & Scope

- **Route Prefixes**:
  - `/orcaagents/featureflags`
  - `/orcaagents/moduleflags`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents`
- **Auth & RBAC**:
  - `GET`: Authenticated workspace users (read current workspace flags)
  - `POST` / `DELETE`: Requires **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Query active feature flags for client-side capability branching
  - Query active module flags (e.g., leave compliance, headcount planning, compensation)
  - Admin toggle controls per tenant workspace

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/featureflags` | `listFeatureFlags` | `void` | `FeatureFlagInfo[]` | Returns all feature flags for caller's workspace |
| `POST` | `/orcaagents/featureflags` | `addFeatureFlag` | `FeatureFlagRequest` | `OkResponse` | Adds a feature flag for workspace (SYSTEM_ADMIN) |
| `DELETE` | `/orcaagents/featureflags/{name}` | `removeFeatureFlag` | `void` | `OkResponse` | Removes a feature flag from workspace (SYSTEM_ADMIN) |
| `GET` | `/orcaagents/moduleflags` | `listModuleFlags` | `void` | `string[]` | Returns all module flag names for caller's workspace |
| `POST` | `/orcaagents/moduleflags` | `addModuleFlag` | `FeatureFlagRequest` | `OkResponse` | Adds a module flag for workspace (SYSTEM_ADMIN) |
| `DELETE` | `/orcaagents/moduleflags/{name}` | `removeModuleFlag` | `void` | `OkResponse` | Removes a module flag from workspace (SYSTEM_ADMIN) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface FeatureFlagInfo {
  name: string;
}

export interface FeatureFlagRequest {
  name: string;
}

export interface OkResponse {
  status: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const featureFlagsClient = {
  // --- Feature Flags ---
  async listFeatureFlags(): Promise<FeatureFlagInfo[]> {
    return orcaFetch<FeatureFlagInfo[]>('/orcaagents/featureflags', {
      method: 'GET',
    });
  },

  async addFeatureFlag(name: string): Promise<OkResponse> {
    return orcaFetch<OkResponse>('/orcaagents/featureflags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async removeFeatureFlag(name: string): Promise<OkResponse> {
    return orcaFetch<OkResponse>(`/orcaagents/featureflags/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  // --- Module Flags ---
  async listModuleFlags(): Promise<string[]> {
    return orcaFetch<string[]>('/orcaagents/moduleflags', {
      method: 'GET',
    });
  },

  async addModuleFlag(name: string): Promise<OkResponse> {
    return orcaFetch<OkResponse>('/orcaagents/moduleflags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async removeModuleFlag(name: string): Promise<OkResponse> {
    return orcaFetch<OkResponse>(`/orcaagents/moduleflags/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Conditional Feature Rendering in React
```typescript
import { featureFlagsClient } from './featureFlagsClient';

export async function checkFeatureEnabled(flagName: string): Promise<boolean> {
  const flags = await featureFlagsClient.listFeatureFlags();
  return flags.some((f) => f.name === flagName);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Feature Flags Return Objects, Not Strings**: `listFeatureFlags` returns `FeatureFlagInfo[]` (objects with a `name` field), not a plain string array. Use `flags.some(f => f.name === flagName)` to check.
2. **Module Flags Return Strings**: `listModuleFlags` returns `string[]` (plain array of flag names), unlike feature flags.
3. **Duplicate Adds Return 409**: Adding a flag that already exists returns HTTP 409 Conflict — it is NOT idempotent.
4. **SYSTEM_ADMIN Only**: POST and DELETE operations require `SYSTEM_ADMIN` role specifically (not just `ADMIN`). Non-SYSTEM_ADMIN users receive HTTP 403 Forbidden.
5. **404 on Remove Missing**: Removing a flag that doesn't exist returns HTTP 404 Not Found.
