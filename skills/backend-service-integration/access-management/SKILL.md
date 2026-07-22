# Access Management Service

> User CRUD, role management, session management, MFA, and impersonation — proxied to auth-go.

**Route prefix:** `/orcaagents/access`
**Handler:** `handler/web/access_handler.go`
**Auth required:** Yes (Admin only — all endpoints gated by `RequireAdmin()`)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### User CRUD

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/access/users` | `listUsers` | List all user accounts with customer associations |
| `POST` | `/orcaagents/access/users/search` | `searchUsers` | Search users by email/name with pagination |
| `GET` | `/orcaagents/access/users/{userId}` | `getUser` | Get user account with MFA status |
| `POST` | `/orcaagents/access/users` | `createUser` | Create a new user account |
| `PATCH` | `/orcaagents/access/users` | `updateUser` | Update email, name, state, or SCIM flag |
| `POST` | `/orcaagents/access/users/password` | `setPassword` | Set user password by globalId |

### MFA

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/access/users/{userId}/totp` | `hasTOTP` | Check if user has TOTP configured |
| `DELETE` | `/orcaagents/access/users/{userId}/totp` | `removeTOTP` | Remove user TOTP configuration |

### Impersonation

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/access/users/{userId}/loginas` | `loginAs` | Issue token to impersonate a user |

### Roles

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/access/roles` | `listRoles` | List all available roles |
| `POST` | `/orcaagents/access/roles` | `createRole` | Create a custom role |
| `DELETE` | `/orcaagents/access/roles/{roleId}` | `deleteRole` | Delete a custom role |
| `GET` | `/orcaagents/access/roles/{roleId}/members?workspaceId=X` | `listMembersForRole` | List members of a role in a workspace |

### Role Assignments

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/access/workspaces/{workspaceId}/rolemembers` | `listRoleMembers` | List all role assignments in a workspace |
| `GET` | `/orcaagents/access/workspaces/{workspaceId}/users/{userId}/roles` | `listRolesForUser` | List roles for a user in workspace |
| `POST` | `/orcaagents/access/workspaces/{workspaceId}/users/{userId}/roles` | `addRole` | Add role to user (preserves existing) |
| `DELETE` | `/orcaagents/access/workspaces/{workspaceId}/users/{userId}/roles/{roleId}` | `removeRoleFromUser` | Remove role from user |

### Sessions

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/access/sessions` | `listSessions` | List all active sessions |
| `GET` | `/orcaagents/access/users/{userId}/sessions` | `listSessionsByUser` | List sessions for a user |
| `GET` | `/orcaagents/access/customers/{customerId}/sessions` | `listSessionsByCustomer` | List sessions for a customer |

---

## TypeScript Examples

### List Users

```ts
async function listUsers(): Promise<UserCustomer[]> {
  const res = await orcaFetch("/orcaagents/access/users", {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

### Create User

```ts
interface CreateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  workspaceID?: number; // auto-injected from JWT if omitted
}

async function createUser(req: CreateUserRequest): Promise<{ globalId: string }> {
  const res = await orcaFetch("/orcaagents/access/users", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

### Add Role to User

```ts
interface AddRoleRequest {
  roleId: number;
}

async function addRoleToUser(
  workspaceId: number,
  userId: number,
  roleId: number
): Promise<RoleMember> {
  const res = await orcaFetch(
    `/orcaagents/access/workspaces/${workspaceId}/users/${userId}/roles`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify({ roleId }),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

### Login As (Impersonate)

```ts
interface LoginAsRequest {
  assumedBy: string;
}

interface LoginAsResponse {
  token: string;
}

async function loginAs(userId: number, assumedBy: string): Promise<LoginAsResponse> {
  const res = await orcaFetch(`/orcaagents/access/users/${userId}/loginas`, {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ assumedBy }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid userId, workspaceId, roleId, or malformed JSON body |
| `401` | Not authenticated |
| `403` | Not an admin user |
| `502` | Upstream auth-go service failure |
