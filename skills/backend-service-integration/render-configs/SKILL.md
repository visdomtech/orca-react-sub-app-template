# Render Config Service

> JsonLogic-based render configurations that control which agent outputs appear in the chat UI and how they are rendered.

**Route prefix:** `/orcaagents/renderconfig`
**Handler:** `handler/web/renderconfig_handler.go`
**Service:** `service/renderconfig/`
**Auth required:** Yes (admin endpoints: customer admin; public read: any user)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Admin (Customer Admin only)

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/renderconfig/admin/configs` | `adminListRenderConfigs` | List all render configs |
| `POST` | `/orcaagents/renderconfig/admin/configs` | `adminCreateRenderConfig` | Create a render config |
| `GET` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminGetRenderConfig` | Get a render config by ID |
| `PATCH` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminUpdateRenderConfig` | Update a render config |
| `DELETE` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminDeleteRenderConfig` | Delete a render config |

### Public

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/renderconfig/configs` | `listEnabledRenderConfigs` | List enabled render configs (cached in-memory) |

---

## Architecture

Each render config defines a **JsonLogic condition** evaluated in the frontend
against `AgentEvent` objects. When a condition matches, the corresponding
`fieldRenders` and `rootTemplate` control how the agent output appears in the
chat UI. Configs have a `priority` field for ordering and an `enabled` toggle.

The public read endpoint (`listEnabledRenderConfigs`) uses an in-memory cache
that is invalidated on any admin write.

---

## Types

```ts
interface RenderConfig {
  id: number;
  label: string;
  condition: unknown;        // JsonLogic condition object
  fieldRenders: unknown;     // per-field render instructions
  rootTemplate?: string;
  reasoningThoughts: boolean;
  collapsed: boolean;
  priority: number;
  enabled: boolean;
  createdBy?: string;
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}

// Used for create/update (fields are optional on update)
interface RenderConfigInput {
  label: string;
  condition: unknown;
  fieldRenders: unknown;
  rootTemplate?: string;
  reasoningThoughts?: boolean;
  collapsed?: boolean;
  priority?: number;
  enabled?: boolean;
}
```

---

## List Render Configs (Admin)

```ts
async function adminListRenderConfigs(): Promise<RenderConfig[]> {
  const res = await orcaFetch("/orcaagents/renderconfig/admin/configs", {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Create Render Config

```http
POST /orcaagents/renderconfig/admin/configs
```

```ts
async function adminCreateRenderConfig(
  input: RenderConfigInput
): Promise<RenderConfig> {
  const res = await orcaFetch("/orcaagents/renderconfig/admin/configs", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Get Render Config

```ts
async function adminGetRenderConfig(id: number): Promise<RenderConfig> {
  const res = await orcaFetch(`/orcaagents/renderconfig/admin/configs/${id}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Update Render Config

```ts
async function adminUpdateRenderConfig(
  id: number,
  input: Partial<RenderConfigInput>
): Promise<RenderConfig> {
  const res = await orcaFetch(`/orcaagents/renderconfig/admin/configs/${id}`, {
    method: "PATCH",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Delete Render Config

```ts
async function adminDeleteRenderConfig(id: number): Promise<void> {
  const res = await orcaFetch(`/orcaagents/renderconfig/admin/configs/${id}`, {
    method: "DELETE",
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## List Enabled Render Configs (Public)

Returns enabled render configs. Cached in-memory; cache invalidates on any admin write.

```ts
async function listEnabledRenderConfigs(): Promise<RenderConfig[]> {
  const res = await orcaFetch("/orcaagents/renderconfig/configs", {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid JSON body, missing required `label`/`condition`/`fieldRenders` |
| `401` | Not authenticated |
| `403` | Not customer admin (admin endpoints) |
| `404` | Render config not found (get/update/delete by ID) |
| `500` | Database error |
