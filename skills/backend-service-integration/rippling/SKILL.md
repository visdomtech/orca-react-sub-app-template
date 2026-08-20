---
name: rippling-service-integration
description: "Integrate with the Orca Rippling HRIS API (`/orcaagents/rippling`). Operations: getRipplingConnection, saveRipplingConnection, deleteRipplingConnection, testRipplingConnection, listRipplingEmployees, getRipplingEmployee."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Rippling Service

> Workspace-scoped Rippling HRIS integration — connection management, credential testing, and employee retrieval.

**Route prefix:** `/orcaagents/rippling`  
**Handler:** `handler/web/rippling_handler.go`  
**Auth required:** Yes (JWT)  
**Access level:** Connection management requires Workspace Admin; employee queries require Authenticated User

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#31-fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#31-fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before calling any endpoint.

---

## 1. Endpoints

| Method | Path | OperationID | Description |
|--------|------|-------------|-------------|
| `GET` | `/orcaagents/rippling/connection` | `getRipplingConnection` | Get Rippling connection status |
| `PUT` | `/orcaagents/rippling/connection` | `saveRipplingConnection` | Create or replace workspace Rippling connection (admin) |
| `DELETE` | `/orcaagents/rippling/connection` | `deleteRipplingConnection` | Remove workspace Rippling connection (admin) |
| `POST` | `/orcaagents/rippling/connection/test` | `testRipplingConnection` | Verify API key can reach Rippling (admin) |
| `GET` | `/orcaagents/rippling/employees` | `listRipplingEmployees` | List Rippling employees |
| `GET` | `/orcaagents/rippling/employees/{id}` | `getRipplingEmployee` | Get a single Rippling employee by ID |

---

## 2. Architecture & Workflow

```mermaid
sequenceDiagram
  participant Admin as Workspace Admin
  participant API as OrcaAgents API
  participant RP as Rippling API

  Admin->>API: PUT /connection (apiKey)
  API-->>Admin: { status: "ok" }

  Admin->>API: POST /connection/test
  API->>RP: Ping
  RP-->>API: 200 OK
  API-->>Admin: { status: "ok" }

  Admin->>API: GET /employees
  API->>RP: List employees
  RP-->>API: RipplingEmployee[]
  API-->>Admin: RipplingEmployee[]
```

### Connection Lifecycle

State transitions: `disconnected` → `connected` (PUT) → `verified` (POST /test) → `disconnected` (DELETE).

- **DELETE is idempotent**: safe to call when already disconnected.
- **In-flight queries during DELETE**: may return `502` or `503`; clients should retry after reconnect.
- **Reconnection**: call PUT with new or same credentials. No UI cache is auto-invalidated — refetch connection status after PUT.
- **Stale UI state**: after DELETE, a client holding `connected: true` will receive `503` on employee queries until a new connection is saved.

---

## 3. TypeScript Interfaces

```ts
export interface RipplingConnectionRequest {
  apiKey: string;
}

export interface RipplingConnectionResponse {
  connected: boolean;
  connectedAt?: string; // ISO 8601
  connectedBy?: string;
}

export interface RipplingEmployee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  department: string;
  location: string;
  startDate: string;
  employmentType: string;
  status: string;
  workState: string;
  managerId: string;
}

export interface OkResponse {
  status: "ok";
}
```

---

## 4. Client Functions

```ts
import { orcaFetch, headers } from "../SKILL.md#31-fetch-wrapper-orcafetch";

export const ripplingClient = {
  async getConnection(): Promise<RipplingConnectionResponse> {
    const res = await orcaFetch("/orcaagents/rippling/connection", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Rippling connection");
    }
    return res.json();
  },

  async saveConnection(req: RipplingConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/rippling/connection", {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save Rippling connection");
    }
    return res.json();
  },

  async deleteConnection(): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/rippling/connection", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete Rippling connection");
    }
    return res.json();
  },

  async testConnection(req: RipplingConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/rippling/connection/test", {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Rippling connection test failed");
    }
    return res.json();
  },

  async listEmployees(): Promise<RipplingEmployee[]> {
    const res = await orcaFetch("/orcaagents/rippling/employees", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to list Rippling employees");
    }
    return res.json();
  },

  async getEmployee(id: string): Promise<RipplingEmployee> {
    const res = await orcaFetch(`/orcaagents/rippling/employees/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Rippling employee");
    }
    return res.json();
  },
};
```

---

## 5. Query & Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Rippling employee identifier |

---

## 6. SSE Streaming / Binary Payloads

Not applicable — this service returns JSON only.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing API key | Provide apiKey in the request body |
| `400` | Connection test failed | Verify API key in Rippling developer settings |
| `401` | Unauthorized | Refresh JWT session |
| `403` | Forbidden (admin endpoints) | Verify user has Workspace Admin role |
| `500` | Internal server error | Check backend logs |
| `502` | Rippling upstream request failed | Verify Rippling is reachable and credentials are valid |
| `503` | Rippling not connected | Save a connection first via PUT /connection |
