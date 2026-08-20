---
name: hibob-service-integration
description: "Integrate with the Orca HiBob HRIS API (`/orcaagents/hibob`). Operations: getHiBobConnection, saveHiBobConnection, deleteHiBobConnection, testHiBobConnection, listHiBobEmployees, getHiBobEmployee."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# HiBob Service

> Workspace-scoped HiBob HRIS integration — connection management, credential testing, and employee retrieval.

**Route prefix:** `/orcaagents/hibob`  
**Handler:** `handler/web/hibob_handler.go`  
**Auth required:** Yes (JWT)  
**Access level:** Connection management requires Workspace Admin; employee queries require Authenticated User

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#31-fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#31-fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before calling any endpoint.

---

## 1. Endpoints

| Method | Path | OperationID | Description |
|--------|------|-------------|-------------|
| `GET` | `/orcaagents/hibob/connection` | `getHiBobConnection` | Get HiBob connection status |
| `PUT` | `/orcaagents/hibob/connection` | `saveHiBobConnection` | Create or replace workspace HiBob connection (admin) |
| `DELETE` | `/orcaagents/hibob/connection` | `deleteHiBobConnection` | Remove workspace HiBob connection (admin) |
| `POST` | `/orcaagents/hibob/connection/test` | `testHiBobConnection` | Verify service user credentials can reach HiBob (admin) |
| `GET` | `/orcaagents/hibob/employees` | `listHiBobEmployees` | List HiBob employees |
| `GET` | `/orcaagents/hibob/employees/{id}` | `getHiBobEmployee` | Get a single HiBob employee by ID |

---

## 2. Architecture & Workflow

```mermaid
sequenceDiagram
  participant Admin as Workspace Admin
  participant API as OrcaAgents API
  participant HB as HiBob API

  Admin->>API: PUT /connection (serviceUserId + serviceUserToken)
  API-->>Admin: { status: "ok" }

  Admin->>API: POST /connection/test
  API->>HB: Ping
  HB-->>API: 200 OK
  API-->>Admin: { status: "ok" }

  Admin->>API: GET /employees
  API->>HB: POST /people/search
  HB-->>API: HibobEmployee[]
  API-->>Admin: HibobEmployee[]
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
export interface HiBobConnectionRequest {
  serviceUserId: string;
  serviceUserToken: string;
}

export interface HiBobConnectionResponse {
  connected: boolean;
  serviceUserId?: string;
  connectedAt?: string; // ISO 8601
  connectedBy?: string;
}

export interface HiBobEmployee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  department: string;
  site: string;
  hireDate: string;
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

export const hibobClient = {
  async getConnection(): Promise<HiBobConnectionResponse> {
    const res = await orcaFetch("/orcaagents/hibob/connection", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get HiBob connection");
    }
    return res.json();
  },

  async saveConnection(req: HiBobConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/hibob/connection", {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save HiBob connection");
    }
    return res.json();
  },

  async deleteConnection(): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/hibob/connection", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete HiBob connection");
    }
    return res.json();
  },

  async testConnection(req: HiBobConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/hibob/connection/test", {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "HiBob connection test failed");
    }
    return res.json();
  },

  async listEmployees(): Promise<HiBobEmployee[]> {
    const res = await orcaFetch("/orcaagents/hibob/employees", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to list HiBob employees");
    }
    return res.json();
  },

  async getEmployee(id: string): Promise<HiBobEmployee> {
    const res = await orcaFetch(`/orcaagents/hibob/employees/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get HiBob employee");
    }
    return res.json();
  },
};
```

---

## 5. Query & Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | HiBob employee identifier |

---

## 6. SSE Streaming / Binary Payloads

Not applicable — this service returns JSON only.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing serviceUserId or serviceUserToken | Provide both fields in the request body |
| `400` | Connection test failed | Verify service user credentials in HiBob admin panel |
| `401` | Unauthorized | Refresh JWT session |
| `403` | Forbidden (admin endpoints) | Verify user has Workspace Admin role |
| `500` | Internal server error | Check backend logs |
| `502` | HiBob upstream request failed | Verify HiBob is reachable and credentials are valid |
| `503` | HiBob not connected | Save a connection first via PUT /connection |
