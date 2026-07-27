# Notifications Service

> OAuth2 channel connection and Slack DM notification sending.

**Route prefix:** `/orcaagents/notification`
**Handler:** `handler/web/notification_handler.go`
**Service:** `service/notifications/`
**Auth required:** Yes (JWT — admin role **not** required; any authenticated user can connect and send to themselves)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/notification/oauth2/authorize` | `startOAuth2Authorize` | Redirect to auth-go's OAuth2 authorize flow |
| `GET` | `/orcaagents/notification/oauth2/status` | `getOAuth2Status` | Check if a notification channel is connected |
| `DELETE` | `/orcaagents/notification/oauth2/disconnect` | `disconnectOAuth2` | Remove a connected notification channel |
| `POST` | `/orcaagents/notification/send` | `sendNotification` | Send a notification to the calling user's DM |

---

## Architecture

- All three OAuth2 endpoints take a `provider` query param (uppercase, e.g. `SLACK`).
- The OAuth2 credential lifecycle is delegated to **auth-go**'s vault with
  `key_id = user:{email}` and `usage_type = NOTIFY`. Auth-go stores
  `{"user": {"id": "U12345"}}` in the credential meta — the Slack user ID used for DM routing.
- **Send** resolves the Slack destination server-side from the credential meta;
  Slack auto-resolves DMs from user IDs, so the caller never specifies a channel.
  Messages always go to the calling user's own DM.

---

## Types

```ts
interface NotificationStatus {
  connected: boolean;
  email?: string;    // present only when connected=true
  provider: string;  // "SLACK"
}

interface SendNotificationRequest {
  channel: string;   // must be "slack" (lowercase)
  // Slack chat.postMessage fields (all optional):
  text?: string;             // required if blocks/attachments omitted
  blocks?: unknown[];        // Block Kit layout blocks
  attachments?: unknown[];   // legacy attachment format
  thread_ts?: string;        // reply in a thread
  reply_broadcast?: boolean;
  mrkdwn?: boolean;
  parse?: string;            // "full" or "none"
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  link_names?: boolean;
}
```

---

## TypeScript

```ts
async function startOAuth2Authorize(provider: string): Promise<string> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/authorize?provider=${encodeURIComponent(provider)}`,
    { headers: headers(), credentials: "include", redirect: "manual" }
  );
  if (res.type === "opaqueredirect") {
    throw new Error("Cannot read redirect URL in opaque redirect mode");
  }
  return res.headers.get("Location") ?? "";
}

async function getOAuth2Status(provider: string): Promise<NotificationStatus> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/status?provider=${encodeURIComponent(provider)}`,
    { headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function disconnectOAuth2(provider: string): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/notification/oauth2/disconnect?provider=${encodeURIComponent(provider)}`,
    { method: "DELETE", headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}

async function sendNotification(msg: SendNotificationRequest): Promise<void> {
  const res = await orcaFetch("/orcaagents/notification/send", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

**Browser tip:** `GET /oauth2/authorize` returns `302` to auth-go's Slack consent page. In a SPA, open it in a popup (`window.open`) and listen for a `postMessage` of `{type: "oauth2-success"}` from the `success_url` page (`https://{host}/ng/oauth2/success`); then close the popup and refresh status.

---

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **`provider` vs `channel` case** | `provider` query param is **uppercase** (`SLACK`); `channel` body field is **lowercase** (`slack`). Mixing these up returns `400`. |
| **Self-only delivery** | Messages are always sent to the **calling user's own** Slack DM. You cannot send to another user. |
| **Credential meta must contain `user.id`** | If auth-go's Enrich step fails to store `{"user":{"id":"U..."}}`, sends fail with `502` even if status reports `connected=true`. |
| **64 KB body limit** | The send endpoint enforces a 64 KB request body limit. Large Block Kit payloads may hit this. |
| **Empty body = test message** | `{channel:"slack"}` with no `text`/`blocks`/`attachments` sends `"This is a test notification from Orca."` — useful for a connect-and-ping flow. |

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `provider` query param, unsupported provider (e.g. `TEAMS`), unsupported `channel` value in send body, invalid JSON body |
| `401` | Not authenticated (no JWT email in claims) |
| `502` | auth-go vault error on status/disconnect check, Slack API error (e.g. `channel_not_found`, `invalid_auth`), Slack user ID missing from credential meta |
