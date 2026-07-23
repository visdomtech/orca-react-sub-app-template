# Notifications Service

> OAuth2 channel connection and notification sending.

**Route prefix:** `/orcaagents/notification`
**Handler:** `handler/web/notification_handler.go`
**Service:** `service/notifications/`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/notification/oauth2/authorize` | `startOAuth2Authorize` | Redirect to auth-go's OAuth2 authorize flow |
| `GET` | `/orcaagents/notification/oauth2/status` | `getOAuth2Status` | Check if a notification channel is connected |
| `DELETE` | `/orcaagents/notification/oauth2/disconnect` | `disconnectOAuth2` | Remove a connected notification channel |
| `POST` | `/orcaagents/notification/send` | `sendNotification` | Send a notification via a connected channel |

---

## Architecture

All four endpoints require a `provider` query parameter. The only supported
provider is `SLACK`.

The OAuth2 credential lifecycle is delegated to **auth-go**'s vault:
- **Authorize** redirects the browser to auth-go's `/oauth2/authorize` with
  `key_id = user:{email}` and `usage_type = NOTIFY`.
- **Status** queries auth-go for an existing credential.
- **Disconnect** deletes the credential from auth-go's vault.

The **send** endpoint sends a Slack message via `service/notifications/`.
The Slack channel is resolved automatically from the user's Slack user ID
(stored in auth-go's vault); the caller does not specify a channel destination.

---

## Types

```ts
interface NotificationStatus {
  connected: boolean;
  email?: string;    // present only when connected
  provider: string;  // "SLACK"
}

interface SendNotificationRequest {
  channel: string;   // "slack"
  // Slack chat.postMessage fields (channel resolved server-side):
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  mrkdwn?: boolean;
  parse?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  link_names?: boolean;
}
```

---

## Start OAuth2 Authorize

```http
GET /orcaagents/notification/oauth2/authorize?provider=SLACK
```

Redirects the browser (`302 Found`) to auth-go's OAuth2 authorization page.
The `success_url` is set to `https://{host}/ng/oauth2/success`.

### Browser

```ts
function startOAuth2Authorize(provider: string): void {
  window.location.href = `/orcaagents/notification/oauth2/authorize?provider=${encodeURIComponent(provider)}`;
}
```

### API (programmatic)

```ts
async function startOAuth2Authorize(provider: string): Promise<string> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/authorize?provider=${encodeURIComponent(provider)}`,
    { headers: headers(), credentials: "include", redirect: "manual" }
  );
  // Returns 302 with Location header; extract redirect URL
  if (res.type === "opaqueredirect") {
    throw new Error("Cannot read redirect URL in opaque redirect mode");
  }
  return res.headers.get("Location") ?? "";
}
```

---

## Get OAuth2 Status

```http
GET /orcaagents/notification/oauth2/status?provider=SLACK
```

### TypeScript

```ts
async function getOAuth2Status(provider: string): Promise<NotificationStatus> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/status?provider=${encodeURIComponent(provider)}`,
    { headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Disconnect OAuth2

```http
DELETE /orcaagents/notification/oauth2/disconnect?provider=SLACK
```

### TypeScript

```ts
async function disconnectOAuth2(provider: string): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/disconnect?provider=${encodeURIComponent(provider)}`,
    { method: "DELETE", headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Send Notification

```http
POST /orcaagents/notification/send
```

Body is limited to 64 KB. Currently only `channel: "slack"` is supported.

### TypeScript

```ts
async function sendNotification(
  msg: SendNotificationRequest
): Promise<void> {
  const res = await orcaFetch("/orcaagents/notification/send", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `provider` query param, unsupported provider, unsupported channel (send), invalid JSON body (send) |
| `401` | Not authenticated (no JWT email) |
| `502` | auth-go vault error (status/disconnect), failed to send notification (Slack API error) |
