# App Registry Service

> App descriptor CRUD, workspace enable/disable, and Cloud Build deployment pipeline.

**Route prefix:** `/orcaagents/appregistry`
**Handler:** `handler/web/appregistry_handler.go`
**Auth required:** Yes (public: list enabled; admin: full CRUD + builds)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Public

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/appregistry/apps` | `listApps` | List apps enabled in the caller's workspace |

### Admin — App CRUD

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/appregistry/admin/apps` | `adminListAllApps` | List all registered app descriptors |
| `POST` | `/orcaagents/appregistry/admin/apps` | `adminCreateApp` | Create or overwrite an app descriptor |
| `PATCH` | `/orcaagents/appregistry/admin/apps/{id}` | `adminUpdateApp` | Partially update an app descriptor |
| `DELETE` | `/orcaagents/appregistry/admin/apps/{id}` | `adminDeleteApp` | Delete an app descriptor |
| `PUT` | `/orcaagents/appregistry/admin/apps/{id}/workspaces/{workspaceId}` | `adminSetEnabled` | Enable/disable app for a workspace |

### Admin — Build & Deploy

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/appregistry/admin/apps/{id}/build` | `adminTriggerBuild` | Submit Cloud Build deployment job |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds` | `adminListBuilds` | List build history for an app |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds/{buildId}` | `adminGetBuild` | Get build status |
| `GET` | `/orcaagents/appregistry/admin/apps/{id}/builds/{buildId}/logs` | `adminGetBuildLogs` | Get/download build logs |

### Workspace (System Admin)

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/appregistry/workspace/apps` | `listWorkspaceApps` | List all apps with workspace enabled status |
| `PUT` | `/orcaagents/appregistry/workspace/apps/{id}` | `setWorkspaceAppEnabled` | Enable/disable app for caller's workspace |

---

## App Descriptor

```ts
interface AppDescriptor {
  id: string;         // required — unique app identifier
  title: string;      // required — display name
  description?: string;
  icon?: string;
  route?: string;     // frontend route path
  remoteURL?: string; // CDN URL after deployment
  [key: string]: unknown;
}
```

## Trigger Build

```ts
interface TriggerBuildRequest {
  fileId: string; // required — file ID of the build artifact
}

interface BuildRecord {
  id: string;
  appId: string;
  status: string; // QUEUED | BUILDING | SUCCESS | FAILURE | CANCELLED
  version?: string;
  remoteURL?: string;
  triggeredBy: string;
  createdAt: string;
}

async function triggerBuild(appId: string, fileId: string): Promise<BuildRecord> {
  const res = await orcaFetch(`/orcaagents/appregistry/admin/apps/${appId}/build`, {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ fileId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

## Enable/Disable App for Workspace

```ts
async function setAppEnabled(
  appId: string,
  workspaceId: string,
  enabled: boolean
): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/appregistry/admin/apps/${appId}/workspaces/${workspaceId}`,
    {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify({ enabled }),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## List Workspace Apps

```http
GET /orcaagents/appregistry/workspace/apps
```

Lists all app descriptors with enabled status for the caller's workspace. System admin only.

### TypeScript

```ts
interface AppWithStatus extends AppDescriptor {
  enabled: boolean;
}

async function listWorkspaceApps(): Promise<AppWithStatus[]> {
  const res = await orcaFetch("/orcaagents/appregistry/workspace/apps", {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Set Workspace App Enabled

```http
PUT /orcaagents/appregistry/workspace/apps/{id}
```

Enables or disables an app for the caller's workspace. System admin only.

### TypeScript

```ts
async function setWorkspaceAppEnabled(
  appId: string,
  enabled: boolean
): Promise<void> {
  const res = await orcaFetch(`/orcaagents/appregistry/workspace/apps/${appId}`, {
    method: "PUT",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```


---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `id`/`title`, invalid JSON, missing `fileId` |
| `401` | Not authenticated |
| `403` | Not admin |
| `404` | App not found, build not found |
| `409` | File not in confirmed status (build trigger) |
| `503` | Build service unavailable |
