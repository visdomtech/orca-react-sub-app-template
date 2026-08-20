---
name: auth-service-integration
description: "Integrate with the Orca Authentication & User Info API (`/orcaagents/auth`). Operations: getUserInfo."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Authentication & User Info Service Integration Guide

The **Auth Service** installs the system-wide JWT and CORS middleware and provides the `/userinfo` endpoint to inspect the current caller's authenticated identity, tenant workspace, assigned roles, and impersonation context.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/auth`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/auth`
- **Auth & RBAC**: Requires valid JWT (Bearer token or `jwt` / `token` Cookie)
- **Key Responsibilities**:
  - Global JWT validation and claims extraction
  - Retrieving current user's workspace ID, email, role list, and admin status
  - Handling user impersonation (`assumedBy`) detection

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/auth/userinfo` | `getUserInfo` | `void` | `UserInfoResponse` | Returns workspace ID, email, subject, admin status, and role names of caller |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface UserInfoResponse {
  workspaceId: string;
  email: string;
  subject: string;
  isAdmin: boolean;
  roles: string[];
  assumedBy?: string; // Set if session is being impersonated by a support admin
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const authClient = {
  /**
   * Get the current authenticated user's profile and workspace context.
   */
  async getUserInfo(): Promise<UserInfoResponse> {
    return orcaFetch<UserInfoResponse>('/orcaagents/auth/userinfo', {
      method: 'GET',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Initializing App Context on Load
```typescript
import { authClient } from './authClient';

async function initializeSession() {
  try {
    const user = await authClient.getUserInfo();
    console.log(`Authenticated as ${user.email} in workspace ${user.workspaceId}`);
    if (user.isAdmin) {
      console.log('User has administrative privileges');
    }
    return user;
  } catch (err) {
    console.error('User not authenticated, redirecting to login...');
    window.location.href = '/login';
  }
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Cookie vs Header Auth**: The backend accepts JWTs from either the `Authorization: Bearer <jwt>` HTTP header or from `jwt` / `token` HTTP cookies.
2. **Workspace ID Invariant**: Every valid JWT has a non-empty `workspaceId`. Sub-app code should never need to hardcode tenant identifiers.
