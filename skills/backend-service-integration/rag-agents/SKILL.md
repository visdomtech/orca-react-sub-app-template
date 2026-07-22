# RAG Agent Configs Service

> Custom RAG agent configuration CRUD with hot-reload into the agent registry.

**Route prefix:** `/orcaagents/ragagent`
**Handler:** `handler/web/ragagent_handler.go`
**Service:** `service/ragagent/`
**Auth required:** Yes (list enabled: any user; admin CRUD: admin)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Public

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/ragagent/agents` | `listEnabledRagAgents` | List enabled RAG agent configs for use in `/app/run` |

### Admin

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/ragagent/admin/agents` | `adminListRagAgents` | List all configs (enabled + disabled) |
| `POST` | `/orcaagents/ragagent/admin/agents` | `adminCreateRagAgent` | Create a RAG agent config |
| `GET` | `/orcaagents/ragagent/admin/agents/{id}` | `adminGetRagAgent` | Get a config by ID |
| `PATCH` | `/orcaagents/ragagent/admin/agents/{id}` | `adminUpdateRagAgent` | Update a config |
| `DELETE` | `/orcaagents/ragagent/admin/agents/{id}` | `adminDeleteRagAgent` | Delete a config |

---

## Agent Naming

- Name must be a valid **RFC 1123 DNS subdomain** (lowercase alphanumeric, `-` or `.`, max 253 chars)
- Non-system-admin users must use the `cust-` prefix to avoid collisions with built-in agents

## Hot-Reload Behavior

Creating, updating, or deleting a RAG agent config automatically registers/unregisters it in the in-memory agent registry. The new config takes effect immediately without requiring a manual `/admin/config/reload`.

## TypeScript

```ts
interface RagAgentConfig {
  id: number;
  name: string;           // RFC 1123 DNS subdomain
  displayName: string;
  enabled: boolean;
  corpusName?: string;
  metadataFilters?: Record<string, string>;
  createdBy: string;
  created: string;
  updated: string;
}

interface RagAgentConfigInput {
  name: string;           // required — must start with "cust-" for non-sysadmin
  displayName: string;    // required
  enabled?: boolean;
  corpusName?: string;
  metadataFilters?: Record<string, string>;
}

async function listEnabledRagAgents(): Promise<RagAgentConfig[]> {
  const res = await orcaFetch("/orcaagents/ragagent/agents", { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function createRagAgent(input: RagAgentConfigInput): Promise<RagAgentConfig> {
  const res = await orcaFetch("/orcaagents/ragagent/admin/agents", {
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

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `name`/`displayName`, invalid name format, missing `cust-` prefix |
| `401` | Not authenticated |
| `403` | Not admin |
| `404` | Config not found |
| `409` | Duplicate agent name |
