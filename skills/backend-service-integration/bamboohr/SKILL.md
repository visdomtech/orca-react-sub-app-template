---
name: bamboohr-service-integration
description: "Integrate with the Orca BambooHR HRIS API (`/orcaagents/bamboohr`). Operations: getBambooHRConnection, saveBambooHRConnection, deleteBambooHRConnection, testBambooHRConnection, listBambooHREmployees, getBambooHREmployee."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# BambooHR Service

> Workspace-scoped BambooHR HRIS integration — connection management, credential testing, and employee directory/field retrieval.

**Route prefix:** `/orcaagents/bamboohr`  
**Handler:** `handler/web/bamboohr_handler.go`  
**Auth required:** Yes (JWT)  
**Access level:** Connection management requires Workspace Admin; employee queries require Authenticated User

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#31-fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#31-fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before calling any endpoint.

---

## 1. Endpoints

| Method | Path | OperationID | Description |
|--------|------|-------------|-------------|
| `GET` | `/orcaagents/bamboohr/connection` | `getBambooHRConnection` | Get BambooHR connection status (API key never returned) |
| `PUT` | `/orcaagents/bamboohr/connection` | `saveBambooHRConnection` | Create or replace workspace BambooHR connection (admin) |
| `DELETE` | `/orcaagents/bamboohr/connection` | `deleteBambooHRConnection` | Remove workspace BambooHR connection (admin) |
| `POST` | `/orcaagents/bamboohr/connection/test` | `testBambooHRConnection` | Verify subdomain and API key can reach BambooHR (admin) |
| `GET` | `/orcaagents/bamboohr/employees` | `listBambooHREmployees` | List company employee directory from BambooHR |
| `GET` | `/orcaagents/bamboohr/employees/{id}` | `getBambooHREmployee` | Get detailed fields for a single employee by BambooHR ID |

---

## 2. Architecture & Workflow

```mermaid
sequenceDiagram
  participant Admin as Workspace Admin
  participant API as OrcaAgents API
  participant BH as BambooHR API

  Admin->>API: PUT /connection (subdomain + apiKey)
  API-->>Admin: { status: "ok" }

  Admin->>API: POST /connection/test
  API->>BH: Ping
  BH-->>API: 200 OK
  API-->>Admin: { status: "ok" }

  Note over Admin: Authenticated user queries
  Admin->>API: GET /employees
  API->>BH: GET /employees/directory
  BH-->>API: DirectoryEmployee[]
  API-->>Admin: DirectoryEmployee[]
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
export interface BambooHRConnectionRequest {
  subdomain: string;
  apiKey: string;
}

export interface BambooHRConnectionResponse {
  connected: boolean;
  subdomain?: string;
  connectedAt?: string; // ISO 8601
  connectedBy?: string;
}

export interface BambooHRDirectoryEmployee {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  workEmail: string;
  department: string;
  location: string;
  workPhone: string;
  photoUrl: string;
}

export interface BambooHREmployeeFields {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  jobTitle: string;
  workEmail: string;
  department: string;
  location: string;
  division: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate: string;
  state: string;
  supervisorEmail: string;
  flsaCode: string;
  payRate: string;
  payType: string;
}

export interface OkResponse {
  status: "ok";
}
```

---

## 4. Client Functions

```ts
import { orcaFetch, headers } from "../SKILL.md#31-fetch-wrapper-orcafetch";

export const bamboohrClient = {
  async getConnection(): Promise<BambooHRConnectionResponse> {
    const res = await orcaFetch("/orcaagents/bamboohr/connection", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get BambooHR connection");
    }
    return res.json();
  },

  async saveConnection(req: BambooHRConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/bamboohr/connection", {
      method: "PUT",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save BambooHR connection");
    }
    return res.json();
  },

  async deleteConnection(): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/bamboohr/connection", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete BambooHR connection");
    }
    return res.json();
  },

  async testConnection(req: BambooHRConnectionRequest): Promise<OkResponse> {
    const res = await orcaFetch("/orcaagents/bamboohr/connection/test", {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "BambooHR connection test failed");
    }
    return res.json();
  },

  async listEmployees(): Promise<BambooHRDirectoryEmployee[]> {
    const res = await orcaFetch("/orcaagents/bamboohr/employees", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to list BambooHR employees");
    }
    return res.json();
  },

  async getEmployee(id: string): Promise<BambooHREmployeeFields> {
    const res = await orcaFetch(`/orcaagents/bamboohr/employees/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get BambooHR employee");
    }
    return res.json();
  },
};
```

---

## 5. Query & Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | BambooHR employee ID (must be numeric) |

---

## 6. SSE Streaming / Binary Payloads

Not applicable — this service returns JSON only.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing subdomain or API key | Provide both fields in the request body |
| `400` | Invalid employee ID (non-numeric) | Ensure employee ID is a numeric string |
| `400` | Connection test failed | Verify subdomain and API key against BambooHR |
| `401` | Unauthorized | Refresh JWT session |
| `403` | Forbidden (admin endpoints) | Verify user has Workspace Admin role |
| `500` | Internal server error | Check backend logs |
| `502` | BambooHR upstream request failed | Verify BambooHR is reachable and credentials are valid |
| `503` | BambooHR not connected | Save a connection first via PUT /connection |
