# Authentication Service

> Retrieve authenticated user information.

**Route prefix:** `/orcaagents/auth`
**Handler:** `handler/web/auth_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/auth/userinfo` | `getUserInfo` | Returns the authenticated user's workspace ID, email, and subject |

---

## Get User Info

```http
GET /orcaagents/auth/userinfo
```

Returns the identity of the currently authenticated user.

### Response

```json
{
  "workspaceId": "123",
  "email": "user@example.com",
  "subject": "user-id-abc"
}
```

### TypeScript

```ts
interface UserInfo {
  workspaceId: string;
  email: string;
  subject: string;
}

async function getUserInfo(): Promise<UserInfo> {
  const res = await fetch("/orcaagents/auth/userinfo", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```
