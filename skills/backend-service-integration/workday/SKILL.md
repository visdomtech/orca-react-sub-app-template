---
name: workday-service-integration
description: "Integrate with the Orca Workday HRIS API (`/orcaagents/workday`). Operations: getWorkdayConnection, saveWorkdayConnection, deleteWorkdayConnection, testWorkdayConnection, listWorkdayWorkers, getWorkdayWorker."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Workday Service

> Workspace-scoped Workday HRIS integration — connection management, credential testing, and worker retrieval.

**Route prefix:** `/orcaagents/workday`  
**Handler:** `handler/web/workday_handler.go`  
**Auth required:** Yes (JWT)  
**Access level:** Connection management requires Workspace Admin; worker queries require Authenticated User

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#31-fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#31-fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before calling any endpoint.

---

## 1. Endpoints

| Method | Path | OperationID | Description |
|--------|------|-------------|-------------|
| `GET` | `/orcaagents/workday/connection` | `getWorkdayConnection` | Get Workday connection status |
| `PUT` | `/orcaagents/workday/connection` | `saveWorkdayConnection` | Create or replace workspace Workday connection (admin) |
| `DELETE` | `/orcaagents/workday/connection` | `deleteWorkdayConnection` | Remove workspace Workday connection (admin) |
| `POST` | `/orcaagents/workday/connection/test` | `testWorkdayConnection` | Verify tenant credentials can reach Workday (admin) |
| `GET` | `/orcaagents/workday/workers` | `listWorkdayWorkers` | List Workday workers |
| `GET` | `/orcaagents/workday/workers/{id}` | `getWorkdayWorker` | Get detailed fields for a single Workday worker |

---

## 2. Architecture & Workflow

```mermaid
sequenceDiagram
  participant Admin as Workspace Admin
  participant API as OrcaAgents API
  participant WD as Workday API

  Admin->>API: PUT /connection (tenantId + clientId + clientSecret)
  API-->>Admin: { status: "ok" }

  Admin->>API: POST /connection/test
  API->>WD: OAuth token + Ping
  WD-->>API: 200 OK
  API-->>Admin: { status: "ok" }

  Admin->>API: GET /workers
  API->>WD: GET /workers
  WD-->>API: Worker[]
  API-->>Admin: Worker[]
```

### Connection Lifecycle

State transitions: `disconnected` → `connected` (PUT) → `verified` (POST /test) → `disconnected` (DELETE).

- **DELETE is idempotent**: safe to call when already disconnected.
- **In-flight queries during DELETE**: may return `502` or `503`; clients should retry after reconnect.
- **Reconnection**: call PUT with new or same credentials. No UI cache is auto-invalidated — refetch connection status after PUT.
- **Stale UI state**: after DELETE, a client holding `connected: true` will receive `503` on worker queries until a new connection is saved.

---

## 3. TypeScript Interfaces

```ts
export interface WorkdayConnectionRequest {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface WorkdayConnectionResponse {
  connected: boolean;
  tenantId?: string;
  clientId?: string;
  connectedAt?: string; // ISO 8601
  connectedBy?: string;
}

export interface WorkdayWorker {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  workEmail: string;
  department: string;
  location: string;
}

export interface WorkdayWorkerDetails extends WorkdayWorker {
  managerEmail: string;
  hireDate: string;
  workState: string;
  employeeType: string;
}

export interface OkResponse {
  status: "ok";
}
```

---

## 4. Client Functions

```ts
import { orcaFetch, headers } from "../SKILL.md#31-fetch-wrapper-orcafetch";

export const workdayClient = {
  async getConnection(): Promise<WorkdayConnectionResponse> {
    const res = await orcaFetch("/orcaagents/workday/connection", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Workday connection");
    }
    return res.json();
  },

  async saveConnection(req: WorkdayConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/workday/connection", {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save Workday connection");
    }
    return res.json();
  },

  async deleteConnection(): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/workday/connection", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete Workday connection");
    }
    return res.json();
  },

  async testConnection(req: WorkdayConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/workday/connection/test", {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Workday connection test failed");
    }
    return res.json();
  },

  async listWorkers(): Promise<WorkdayWorker[]> {
    const res = await orcaFetch("/orcaagents/workday/workers", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to list Workday workers");
    }
    return res.json();
  },

  async getWorker(id: string): Promise<WorkdayWorkerDetails> {
    const res = await orcaFetch(`/orcaagents/workday/workers/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Workday worker");
    }
    return res.json();
  },
};
```

---

## 5. Query & Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Workday worker identifier |

---

## 6. SSE Streaming / Binary Payloads

Not applicable — this service returns JSON only.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing tenantId, clientId, or clientSecret | Provide all three fields in the request body |
| `400` | Connection test failed | Verify tenant ID and credentials in Workday admin |
| `401` | Unauthorized | Refresh JWT session |
| `403` | Forbidden (admin endpoints) | Verify user has Workspace Admin role |
| `500` | Internal server error | Check backend logs |
| `502` | Workday upstream request failed | Verify Workday is reachable and credentials are valid |
| `503` | Workday not connected | Save a connection first via PUT /connection |
