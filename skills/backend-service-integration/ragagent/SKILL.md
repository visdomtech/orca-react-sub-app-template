---
name: ragagent-service-integration
description: "Integrate with the Orca Custom RAG Agents Configuration API (`/orcaagents/ragagent`). Operations: listEnabledRagAgents, adminListRagAgents, adminCreateRagAgent, adminGetRagAgent, adminUpdateRagAgent, adminDeleteRagAgent."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Custom RAG Agents Service Integration Guide

The **RAG Agent Service** manages customized domain-specific retrieval-augmented generation (RAG) agent configurations (`orca.rag_agent_configs`), enabling runtime instantiation of specialized legal & compliance agents with bespoke metadata filtering rules.

---

## 1. Endpoints

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/ragagent/agents` | `listEnabledRagAgents` | `void` | `RagAgentConfig[]` | Lists enabled RAG agents available for chat |
| `GET` | `/orcaagents/ragagent/admin/agents` | `adminListRagAgents` | `void` | `RagAgentConfig[]` | Admin: list all RAG agent configs (SYSTEM_ADMIN only) |
| `POST` | `/orcaagents/ragagent/admin/agents` | `adminCreateRagAgent` | `RagAgentConfigInput` | `RagAgentConfig` (201) | Admin: create a customized RAG agent (SYSTEM_ADMIN only) |
| `GET` | `/orcaagents/ragagent/admin/agents/{id}` | `adminGetRagAgent` | `void` | `RagAgentConfig` | Admin: get RAG agent config by ID (SYSTEM_ADMIN only) |
| `PATCH` | `/orcaagents/ragagent/admin/agents/{id}` | `adminUpdateRagAgent` | `RagAgentConfigInput` | `RagAgentConfig` | Admin: update RAG agent config (SYSTEM_ADMIN only) |
| `DELETE` | `/orcaagents/ragagent/admin/agents/{id}` | `adminDeleteRagAgent` | `void` | `void` (204) | Admin: delete RAG agent config (SYSTEM_ADMIN only) |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/ragagent`
- **Auth & RBAC**:
  - `GET /orcaagents/ragagent/agents`: Authenticated users (lists enabled agents available for invocation)
  - `admin/*` routes: Require **`SYSTEM_ADMIN`** role only (not `ADMIN`)
- **Key Responsibilities**:
  - Dynamic registration of RagLite LLM agents into the agent registry
  - Metadata filtering definitions for scoping retrieval (e.g., by jurisdiction, legal topic, document type)

---

## 3. TypeScript Interfaces

```typescript
export interface RagMetadataFilter {
  key: string;
  value: string;
}

export interface RagAgentConfig {
  id: number;
  name: string;             // RFC 1123 DNS subdomain format (e.g. "california-wage-agent")
  displayName: string;
  description: string;
  outputKey: string;        // session-state key (e.g. "rag_result:ca-leave-agent")
  corpusName: string;
  metadataFilters: RagMetadataFilter[];
  enabled: boolean;
  createdBy?: string;       // omitted when empty (omitempty)
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

export interface RagAgentConfigInput {
  name: string;             // required — RFC 1123 DNS subdomain
  displayName: string;      // required
  description?: string;
  outputKey?: string;
  corpusName?: string;
  metadataFilters?: RagMetadataFilter[];
  enabled?: boolean;        // pointer in Go; omit to default to true
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const ragAgentClient = {
  /** List all enabled RAG agents for chat invocation. */
  async listEnabledAgents(): Promise<RagAgentConfig[]> {
    return orcaFetch<RagAgentConfig[]>('/orcaagents/ragagent/agents', {
      method: 'GET',
    });
  },

  /** Admin: List all RAG agent configurations (SYSTEM_ADMIN only). */
  async adminListAgents(): Promise<RagAgentConfig[]> {
    return orcaFetch<RagAgentConfig[]>('/orcaagents/ragagent/admin/agents', {
      method: 'GET',
    });
  },

  /** Admin: Get a single RAG agent config by ID (SYSTEM_ADMIN only). */
  async adminGetAgent(id: number): Promise<RagAgentConfig> {
    return orcaFetch<RagAgentConfig>(`/orcaagents/ragagent/admin/agents/${id}`, {
      method: 'GET',
    });
  },

  /** Admin: Create a new custom RAG agent configuration (SYSTEM_ADMIN only). */
  async adminCreateAgent(agent: RagAgentConfigInput): Promise<RagAgentConfig> {
    return orcaFetch<RagAgentConfig>('/orcaagents/ragagent/admin/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  },

  /** Admin: Update an existing RAG agent config (SYSTEM_ADMIN only). */
  async adminUpdateAgent(id: number, agent: RagAgentConfigInput): Promise<RagAgentConfig> {
    return orcaFetch<RagAgentConfig>(`/orcaagents/ragagent/admin/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(agent),
    });
  },

  /** Admin: Delete a RAG agent config by ID (SYSTEM_ADMIN only). Returns 204 No Content. */
  async adminDeleteAgent(id: number): Promise<void> {
    await orcaFetch(`/orcaagents/ragagent/admin/agents/${id}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Query & Path Parameters

| Endpoint | Param | Location | Required | Type | Notes |
|---|---|---|---|---|---|
| `adminGetRagAgent` | `id` | path | yes | `number` (int64) | RAG agent config ID |
| `adminUpdateRagAgent` | `id` | path | yes | `number` (int64) | RAG agent config ID |
| `adminDeleteRagAgent` | `id` | path | yes | `number` (int64) | RAG agent config ID |

---

## 6. SSE / Binary

Not applicable — all endpoints return JSON responses.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing `name` or `displayName`; invalid `name` format | Both are required; `name` must be a valid RFC 1123 DNS subdomain |
| `401` | Missing or invalid JWT | Include a valid `Authorization: Bearer <token>` header |
| `403` | Insufficient role | All admin endpoints require `SYSTEM_ADMIN` role (`ADMIN` is not sufficient) |
| `404` | Config not found | Check the `id` path parameter |
| `409` | Duplicate agent `name` | Choose a unique agent name |
| `500` | Internal server error | Inspect backend logs |

### Common Gotchas

1. **RFC 1123 DNS Name Format**: Agent `name` must be a valid RFC 1123 DNS subdomain (lowercase letters, numbers, hyphens, and dots, e.g. `ca-leave-law`).
2. **Atomic Hot-Registration**: Creating or updating an agent immediately registers it into the running ADK mediator without requiring server restart.
3. **SYSTEM_ADMIN Only**: All admin endpoints require `SYSTEM_ADMIN` role — `ADMIN` is not sufficient.
4. **metadataFilters is an Array**: The `metadataFilters` field is `RagMetadataFilter[]` (array of `{key, value}` objects), not a `Record<string, any>`.
5. **outputKey**: Auto-derived from agent name as `rag_result:<name>`. Included in the response but rarely needs to be set in the request.
