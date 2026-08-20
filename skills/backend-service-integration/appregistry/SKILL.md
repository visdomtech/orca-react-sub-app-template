---
name: appregistry-service-integration
description: "Integrate with the Orca App Registry API (`/orcaagents/appregistry`). Operations: listApps, adminListAllApps, adminCreateApp, adminUpdateApp, adminDeleteApp, adminSetEnabled, adminTriggerBuild, adminGetBuild, adminListBuilds, listWorkspaceApps, setWorkspaceAppEnabled, adminGetBuildLogs."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# App Registry Service Integration Guide

The **App Registry Service** manages registered Orca application descriptors (Micro-frontends / Sub-apps), workspace-level feature enablement, and Google Cloud Build deployment pipelines.

---

## 1. Endpoint Reference Table

| Method | Path | Operation ID | Request Body | Response | Status | Description |
|---|---|---|---|---|---|---|
| `GET` | `/orcaagents/appregistry/apps` | `listApps` | — | `AppDescriptor[]` | 200 | Lists enabled app descriptors for caller's workspace |
| `GET` | `/orcaagents/appregistry/admin/apps` | `adminListAllApps` | — | `AppDescriptor[]` | 200 | Lists all app descriptors (System Admin) |
| `POST` | `/orcaagents/appregistry/admin/apps` | `adminCreateApp` | `AppDescriptor` | `AppDescriptor` | 201 | Creates or overwrites an app descriptor (System Admin) |
| `PATCH` | `/orcaagents/appregistry/admin/apps/{id}` | `adminUpdateApp` | `AppDescriptor` | `AppDescriptor` | 200 | Partially updates an app descriptor by ID (System Admin) |
| `DELETE` | `/orcaagents/appregistry/admin/apps/{id}` | `adminDeleteApp` | — | — | 204 | Deletes an app descriptor (System Admin) |
| `PUT` | `/orcaagents/appregistry/admin/apps/{id}/workspaces/{workspaceId}` | `adminSetEnabled` | `SetWorkspaceEnabledRequest` | — | 204 | Sets app enabled status for a specific workspace (System Admin) |
| `POST` | `/orcaagents/appregistry/admin/apps/{id}/build` | `adminTriggerBuild` | `TriggerBuildRequest` | `BuildRecord` | 202 | Submits a deployment Cloud Build job (System Admin) |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds/{buildId}` | `adminGetBuild` | — | `BuildRecord` | 200 | Retrieves status and details of a Cloud Build job (Admin) |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds` | `adminListBuilds` | — | `{ builds: BuildRecord[] }` | 200 | Lists deployment build records for an app (Admin) |
| `GET` | `/orcaagents/appregistry/workspace/apps` | `listWorkspaceApps` | — | `AppWithStatus[]` | 200 | Lists all apps with enabled status for caller's workspace (System Admin) |
| `PUT` | `/orcaagents/appregistry/workspace/apps/{id}` | `setWorkspaceAppEnabled` | `SetWorkspaceEnabledRequest` | — | 204 | Toggles app enablement for caller's workspace (System Admin) |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds/{buildId}/logs` | `adminGetBuildLogs` | — | `{ logLines: string[] }` or `text/plain` | 200 | Gets build logs (JSON or raw text download via `?download=true`) |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/appregistry`
- **Auth & RBAC**:
  - `GET /apps`: Authenticated users (returns enabled apps for caller's workspace; non-admin users see only non-`adminOnly` apps)
  - `GET /workspace/apps`, `PUT /workspace/apps/{id}`: Requires `SYSTEM_ADMIN` role
  - `admin*` routes: Require `SYSTEM_ADMIN` role (except `adminGetBuild`/`adminListBuilds`/`adminGetBuildLogs` which require any admin role)
- **Services**: `appregistry.Service` (CRUD + workspace enablement), `appbuild.Service` (Cloud Build pipeline), `audit.Service` (audit logging)
- **Key Responsibilities**:
  - CRUD for application metadata (ID, title, description, icon, badge, module federation config, approval object types)
  - Enable/disable sub-applications per tenant workspace
  - Trigger Cloud Build jobs for building and deploying bundled sub-apps to CDN

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface ApprovalObjectType {
  objectType: string;
  label: string;
}

export interface AppDescriptor {
  id: string;
  title: string;
  description?: string;
  iconId?: string;
  iconBg?: string;
  badge?: string;
  adminOnly: boolean;
  displayOrder: number;
  remoteUrl?: string;
  exposedModule?: string;
  currentBuildVersion?: string;
  approvalObjectTypes?: ApprovalObjectType[];
}

export interface AppWithStatus extends AppDescriptor {
  enabled: boolean;
}

export interface SetWorkspaceEnabledRequest {
  enabled: boolean;
}

export interface TriggerBuildRequest {
  fileId: string;
}

export type BuildStatus = 'QUEUED' | 'BUILDING' | 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'TIMEOUT';

export interface BuildRecord {
  buildId: string;
  jobId?: string;
  appId: string;
  fileId: string;
  status: BuildStatus;
  version: string;
  cdnDest?: string;
  errorMsg?: string;
  createdBy?: string;
  createdAt: string;        // ISO-8601
  finishedAt: string | null; // ISO-8601 or null
  logLines?: string[];       // populated on poll, not stored
}

export interface BuildLogsResponse {
  logLines: string[];
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const appRegistryClient = {
  /** List enabled apps for current workspace navigation. */
  async listEnabledApps(): Promise<AppDescriptor[]> {
    return orcaFetch<AppDescriptor[]>('/orcaagents/appregistry/apps', { method: 'GET' });
  },

  /** List all apps (System Admin). */
  async adminListAllApps(): Promise<AppDescriptor[]> {
    return orcaFetch<AppDescriptor[]>('/orcaagents/appregistry/admin/apps', { method: 'GET' });
  },

  /** Create or overwrite an app descriptor (System Admin). */
  async adminCreateApp(app: AppDescriptor): Promise<AppDescriptor> {
    return orcaFetch<AppDescriptor>('/orcaagents/appregistry/admin/apps', {
      method: 'POST',
      body: JSON.stringify(app),
    });
  },

  /** Partially update an app descriptor (System Admin). */
  async adminUpdateApp(id: string, app: Partial<AppDescriptor>): Promise<AppDescriptor> {
    return orcaFetch<AppDescriptor>(`/orcaagents/appregistry/admin/apps/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(app),
    });
  },

  /** Delete an app descriptor (System Admin). Returns 204. */
  async adminDeleteApp(id: string): Promise<void> {
    return orcaFetch<void>(`/orcaagents/appregistry/admin/apps/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  /** Set app enabled for a specific workspace (System Admin). Returns 204. */
  async adminSetEnabled(id: string, workspaceId: string, enabled: boolean): Promise<void> {
    return orcaFetch<void>(
      `/orcaagents/appregistry/admin/apps/${encodeURIComponent(id)}/workspaces/${encodeURIComponent(workspaceId)}`,
      { method: 'PUT', body: JSON.stringify({ enabled }) },
    );
  },

  /** List all workspace apps with enabled toggles (System Admin). */
  async listWorkspaceApps(): Promise<AppWithStatus[]> {
    return orcaFetch<AppWithStatus[]>('/orcaagents/appregistry/workspace/apps', { method: 'GET' });
  },

  /** Toggle app enablement for current workspace (System Admin). Returns 204. */
  async setWorkspaceAppEnabled(id: string, enabled: boolean): Promise<void> {
    return orcaFetch<void>(`/orcaagents/appregistry/workspace/apps/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  },

  /** Trigger a Cloud Build deployment (System Admin). Returns 202 Accepted. */
  async triggerBuild(appId: string, fileId: string): Promise<BuildRecord> {
    return orcaFetch<BuildRecord>(`/orcaagents/appregistry/admin/apps/${encodeURIComponent(appId)}/build`, {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });
  },

  /** Get build status (Admin). */
  async getBuild(appId: string, buildId: string): Promise<BuildRecord> {
    return orcaFetch<BuildRecord>(
      `/orcaagents/appregistry/admin/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}`,
      { method: 'GET' },
    );
  },

  /** List build records for an app (Admin). Response wraps in { builds: [...] }. */
  async listBuilds(appId: string): Promise<BuildRecord[]> {
    const res = await orcaFetch<{ builds: BuildRecord[] }>(
      `/orcaagents/appregistry/admin/apps/${encodeURIComponent(appId)}/builds`,
      { method: 'GET' },
    );
    return res.builds;
  },

  /** Fetch build logs as JSON (Admin). */
  async getBuildLogs(appId: string, buildId: string): Promise<BuildLogsResponse> {
    return orcaFetch<BuildLogsResponse>(
      `/orcaagents/appregistry/admin/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}/logs`,
      { method: 'GET' },
    );
  },

  /** Download build logs as plain text file attachment (Admin). */
  async downloadBuildLogs(appId: string, buildId: string): Promise<Blob> {
    const res = await fetch(
      `/orcaagents/appregistry/admin/apps/${encodeURIComponent(appId)}/builds/${encodeURIComponent(buildId)}/logs?download=true`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('orca_token') || ''}` } },
    );
    if (!res.ok) throw new Error(`Download logs failed: ${res.statusText}`);
    return res.blob();
  },
};
```

---

## 5. Query & Path Parameters

| Operation | Path Params | Query Params | Notes |
|---|---|---|---|
| `adminUpdateApp` | `{id}` (app ID) | — | Body is full `AppDescriptor`; `id` in path is set on the descriptor |
| `adminDeleteApp` | `{id}` (app ID) | — | Returns 204 No Content |
| `adminSetEnabled` | `{id}` (app ID), `{workspaceId}` | — | Body: `{ enabled: boolean }`; returns 204 |
| `adminTriggerBuild` | `{id}` (app ID) | — | Body: `{ fileId: string }`; returns 202 |
| `adminGetBuild` | `{id}` (app ID), `{buildId}` | — | — |
| `adminListBuilds` | `{id}` (app ID) | — | Response: `{ builds: BuildRecord[] }` (max 20 records) |
| `adminGetBuildLogs` | `{id}` (app ID), `{buildId}` | `?download=true` | Without `download`: returns JSON `{ logLines: string[] }`. With `download=true`: returns `text/plain; charset=utf-8` attachment |
| `setWorkspaceAppEnabled` | `{id}` (app ID) | — | Body: `{ enabled: boolean }`; returns 204 |

---

## 6. SSE / Binary

- **Build Logs Download**: `GET /builds/{buildId}/logs?download=true` returns raw text as `text/plain; charset=utf-8` with `Content-Disposition: attachment; filename="build-{buildId}.log"`.
- No SSE endpoints in this service.

---

## 7. Error Scenarios

| Scenario | HTTP Status | Details |
|---|---|---|
| Unauthenticated | 401 | Missing or invalid JWT |
| Non-admin accessing admin route | 403 | `SYSTEM_ADMIN` role required |
| App not found (delete, build trigger) | 404 | `app not found` |
| Build not found | 404 | `build not found` |
| File not confirmed (trigger build) | 409 | `file is not in confirmed status` |
| Build service unavailable | 503 | Cloud Build client not initialized |
| Missing `id`/`title` on create | 400 | `id and title are required` |
| Missing `fileId` on trigger build | 400 | `fileId is required` |
