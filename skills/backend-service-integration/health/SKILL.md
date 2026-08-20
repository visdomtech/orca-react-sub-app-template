---
name: health-service-integration
description: "Integrate with the Orca Health Check & Liveness Probe API (`/orcaagents/healthz`). Operations: getHealth."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Health Check Service Integration Guide

The **Health Service** exposes unauthenticated liveness and readiness probe endpoints for load balancers, container orchestrators (Kubernetes), and frontend connectivity health checks.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/healthz`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/healthz`
- **Auth & RBAC**: **Unauthenticated** (No JWT required)
- **Key Responsibilities**:
  - Immediate `200 OK` status response without DB or external blocking calls

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/healthz` | `getHealth` | `void` | `{ status: "ok" }` | Health check probe (unauthenticated) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface HealthResponse {
  status: 'ok';
}
```

---

## 4. Client SDK / Integration Functions

```typescript
export const healthClient = {
  /**
   * Check backend service liveness.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/orcaagents/healthz', { method: 'GET' });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Frontend Connection Status Indicator
```typescript
import { healthClient } from './healthClient';

async function verifyBackendOnline() {
  const isHealthy = await healthClient.checkHealth();
  if (!isHealthy) {
    console.warn('Orca backend is currently unreachable.');
  }
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Unauthenticated**: This endpoint intentionally bypasses `JwtAuthMiddleware`.
2. **Zero Dependency**: Does not query Firestore or PostgreSQL, ensuring probes remain fast and green even under partial database isolation.
