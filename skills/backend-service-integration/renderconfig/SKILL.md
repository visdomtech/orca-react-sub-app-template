---
name: renderconfig-service-integration
description: "Integrate with the Orca Agent Output Render Configuration API (`/orcaagents/renderconfig`). Operations: listEnabledRenderConfigs, adminListRenderConfigs, adminCreateRenderConfig, adminGetRenderConfig, adminUpdateRenderConfig, adminDeleteRenderConfig."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Agent Output Render Configuration Service Integration Guide

The **Render Config Service** manages frontend UI presentation rules (`orca.agent_output_render_configs`) for dynamic agent events, evaluating JsonLogic conditions against streamed agent outputs to select custom cards, badges, and layout widgets.

---

## 1. Endpoint Reference Table

| Method | Path | Operation ID | Request Body | Response | Status | Description |
|---|---|---|---|---|---|---|
| `GET` | `/orcaagents/renderconfig/configs` | `listEnabledRenderConfigs` | — | `RenderConfig[]` | 200 | Lists enabled configs (cached, sorted by priority DESC) |
| `GET` | `/orcaagents/renderconfig/admin/configs` | `adminListRenderConfigs` | — | `RenderConfig[]` | 200 | Admin: lists all render configs |
| `POST` | `/orcaagents/renderconfig/admin/configs` | `adminCreateRenderConfig` | `RenderConfigInput` | `RenderConfig` | 201 | Admin: creates a render config |
| `GET` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminGetRenderConfig` | — | `RenderConfig` | 200 | Admin: gets a render config by ID |
| `PATCH` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminUpdateRenderConfig` | `RenderConfigInput` | `RenderConfig` | 200 | Admin: updates a render config |
| `DELETE` | `/orcaagents/renderconfig/admin/configs/{id}` | `adminDeleteRenderConfig` | — | — | 204 | Admin: deletes a render config |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/renderconfig`
- **Auth & RBAC**:
  - `GET /configs`: Authenticated users (in-memory cached, sorted by priority descending)
  - `admin*` routes: Require **`SYSTEM_ADMIN`** role
- **Services**: `renderconfig.Service` (CRUD + cache), `audit.Service`
- **Two Rendering Modes**:
  1. **Field-level rendering**: `fieldRenders` contains a JSON array of `FieldRender` directives describing how to render individual output fields
  2. **Root template rendering**: `rootTemplate` contains a Go template string that renders the entire output; `fieldRenders` must be empty when `rootTemplate` is set
- **JsonLogic Conditions**: `condition` is stored as raw JSON and evaluated in the frontend against `AgentEvent` payloads

---

## 3. TypeScript Interfaces & Enums

```typescript
// Valid contentType values for FieldRender
export type FieldContentType = 'markdown' | 'json' | 'text' | 'citation' | 'nested' | 'template';

export interface FieldRender {
  field: string;
  contentType: FieldContentType;
  children?: FieldRender[];    // recursive; used when contentType is 'nested'
  template?: string;           // required when contentType is 'template'
}

export interface RenderConfig {
  id: number;
  label: string;
  condition: any;              // JsonLogic expression (raw JSON)
  fieldRenders: FieldRender[]; // raw JSON array; empty when rootTemplate is set
  rootTemplate?: string;       // Go template string; mutually exclusive with fieldRenders
  reasoningThoughts: boolean;
  collapsed: boolean;
  priority: number;
  enabled: boolean;
  createdBy?: string;
  createdAt: string;           // ISO-8601
  updatedAt: string;           // ISO-8601
}

export interface RenderConfigInput {
  label: string;
  condition?: any;             // JsonLogic expression (raw JSON)
  fieldRenders?: FieldRender[]; // JSON array; omit when using rootTemplate
  rootTemplate?: string;       // Go template string; mutually exclusive with fieldRenders
  reasoningThoughts?: boolean;
  collapsed?: boolean;
  priority?: number;
  enabled?: boolean;
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const renderConfigClient = {
  /** Fetch enabled render configs for the chat UI (cached, sorted by priority DESC). */
  async listEnabledConfigs(): Promise<RenderConfig[]> {
    return orcaFetch<RenderConfig[]>('/orcaagents/renderconfig/configs', {
      method: 'GET',
    });
  },

  /** Admin: list all render configs. */
  async adminListConfigs(): Promise<RenderConfig[]> {
    return orcaFetch<RenderConfig[]>('/orcaagents/renderconfig/admin/configs', {
      method: 'GET',
    });
  },

  /** Admin: create a new render config. Returns 201. */
  async createConfig(input: RenderConfigInput): Promise<RenderConfig> {
    return orcaFetch<RenderConfig>('/orcaagents/renderconfig/admin/configs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /** Admin: get a render config by ID. */
  async getConfig(id: number): Promise<RenderConfig> {
    return orcaFetch<RenderConfig>(`/orcaagents/renderconfig/admin/configs/${id}`, {
      method: 'GET',
    });
  },

  /** Admin: update a render config. */
  async updateConfig(id: number, input: RenderConfigInput): Promise<RenderConfig> {
    return orcaFetch<RenderConfig>(`/orcaagents/renderconfig/admin/configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  /** Admin: delete a render config. Returns 204. */
  async deleteConfig(id: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/renderconfig/admin/configs/${id}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Query & Path Parameters

| Operation | Path Params | Query Params | Notes |
|---|---|---|---|
| `adminGetRenderConfig` | `{id}` (int64) | — | — |
| `adminUpdateRenderConfig` | `{id}` (int64) | — | Body: `RenderConfigInput` |
| `adminDeleteRenderConfig` | `{id}` (int64) | — | Returns 204 No Content |
| `adminCreateRenderConfig` | — | — | Body: `RenderConfigInput`; `label` is required |

---

## 6. SSE / Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| Scenario | HTTP Status | Details |
|---|---|---|
| Unauthenticated | 401 | Missing or invalid JWT |
| Non-admin on admin routes | 403 | `SYSTEM_ADMIN role required` or `forbidden` |
| Config not found | 404 | `config not found` |
| Missing label | 400 | `label is required` |
| Invalid condition JSON | 400 | `condition must be valid JSON` |
| Invalid fieldRenders JSON | 400 | `fieldRenders must be valid JSON` or `fieldRenders must be a JSON array of field render objects` |
| fieldRenders with rootTemplate | 400 | `fieldRenders must be empty when rootTemplate is set` |
| FieldRender validation: missing field | 400 | `fieldRenders[N].field is required` |
| FieldRender validation: duplicate field | 400 | `fieldRenders[N].field "X" is a duplicate` |
| FieldRender validation: bad contentType | 400 | `fieldRenders[N].contentType must be one of: markdown, json, text, citation, nested, template` |
| FieldRender validation: template required | 400 | `fieldRenders[N].template is required when contentType is template` |
| FieldRender validation: children with template | 400 | `fieldRenders[N].children must be empty when contentType is template` |
