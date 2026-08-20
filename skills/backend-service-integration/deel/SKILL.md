---
name: deel-service-integration
description: "Integrate with the Orca Deel HRIS API (`/orcaagents/deel`). Operations: getDeelConnection, saveDeelConnection, deleteDeelConnection, testDeelConnection, listDeelEmployees, getDeelEmployee."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Deel Service

> Workspace-scoped Deel HRIS integration — connection management, credential testing, and employee retrieval.

**Route prefix:** `/orcaagents/deel`  
**Handler:** `handler/web/deel_handler.go`  
**Auth required:** Yes (JWT)  
**Access level:** Connection management requires Workspace Admin; employee queries require Authenticated User

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#31-fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#31-fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before calling any endpoint.

---

## 1. Endpoints

| Method | Path | OperationID | Description |
|--------|------|-------------|-------------|
| `GET` | `/orcaagents/deel/connection` | `getDeelConnection` | Get Deel connection status |
| `PUT` | `/orcaagents/deel/connection` | `saveDeelConnection` | Create or replace workspace Deel connection (admin) |
| `DELETE` | `/orcaagents/deel/connection` | `deleteDeelConnection` | Remove workspace Deel connection (admin) |
| `POST` | `/orcaagents/deel/connection/test` | `testDeelConnection` | Verify API key and environment can reach Deel (admin) |
| `GET` | `/orcaagents/deel/employees` | `listDeelEmployees` | List Deel employees |
| `GET` | `/orcaagents/deel/employees/{id}` | `getDeelEmployee` | Get a single Deel employee by ID |

---

## 2. Architecture & Workflow

```mermaid
sequenceDiagram
  participant Admin as Workspace Admin
  participant API as OrcaAgents API
  participant Deel as Deel API

  Admin->>API: PUT /connection (apiKey + environment)
  API-->>Admin: { status: "ok" }

  Admin->>API: POST /connection/test
  API->>Deel: Ping (environment-aware)
  Deel-->>API: 200 OK
  API-->>Admin: { status: "ok" }

  Admin->>API: GET /employees
  API->>Deel: List employees
  Deel-->>API: EmployeeRecord[]
  API-->>Admin: EmployeeRecord[]
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
export interface DeelConnectionRequest {
  apiKey: string;
  environment: string;
}

export interface DeelConnectionResponse {
  connected: boolean;
  connectedAt?: string; // ISO 8601
  connectedBy?: string;
  environment?: string;
}

export interface DeelEmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  state: string;
  managerEmail: string;
}

export interface OkResponse {
  status: "ok";
}
```

---

## 4. Client Functions

```ts
import { orcaFetch, headers } from "../SKILL.md#31-fetch-wrapper-orcafetch";

export const deelClient = {
  async getConnection(): Promise<DeelConnectionResponse> {
    const res = await orcaFetch("/orcaagents/deel/connection", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Deel connection");
    }
    return res.json();
  },

  async saveConnection(req: DeelConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/deel/connection", {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save Deel connection");
    }
    return res.json();
  },

  async deleteConnection(): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/deel/connection", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete Deel connection");
    }
    return res.json();
  },

  async testConnection(req: DeelConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/deel/connection/test", {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Deel connection test failed");
    }
    return res.json();
  },

  async listEmployees(): Promise<DeelEmployeeRecord[]> {
    const res = await orcaFetch("/orcaagents/deel/employees", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to list Deel employees");
    }
    return res.json();
  },

  async getEmployee(id: string): Promise<DeelEmployeeRecord> {
    const res = await orcaFetch(`/orcaagents/deel/employees/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get Deel employee");
    }
    return res.json();
  },
};
```

---

## 5. Query & Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Deel employee identifier |

---

## 6. SSE Streaming / Binary Payloads

Not applicable — this service returns JSON only.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing API key | Provide apiKey in the request body |
| `400` | Connection test failed | Verify API key and environment against Deel |
| `401` | Unauthorized | Refresh JWT session |
| `403` | Forbidden (admin endpoints) | Verify user has Workspace Admin role |
| `500` | Internal server error | Check backend logs |
| `502` | Deel upstream request failed | Verify Deel is reachable and credentials are valid |
| `503` | Deel not connected | Save a connection first via PUT /connection |
