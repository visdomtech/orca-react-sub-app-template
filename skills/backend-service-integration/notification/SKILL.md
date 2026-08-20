---
name: notification-service-integration
description: "Integrate with the Orca Notification & Slack Integration API (`/orcaagents/notification`). Operations: getOAuth2AuthorizeURL, getOAuth2Status, disconnectOAuth2, sendNotification."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Notification Service Integration Guide

The **Notification Service** powers user-facing notification delivery via Slack and other OAuth2-connected notification providers.

---

## 1. Endpoints

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/notification/oauth2/authorize` | `getOAuth2AuthorizeURL` | `?provider=SLACK` | `OAuth2AuthorizeResponse` | Generates OAuth2 authorization URL |
| `GET` | `/orcaagents/notification/oauth2/status` | `getOAuth2Status` | `?provider=SLACK` | `OAuth2StatusResponse` | Checks provider connection status |
| `DELETE` | `/orcaagents/notification/oauth2/disconnect` | `disconnectOAuth2` | `?provider=SLACK` | `OkResponse` | Disconnects notification provider |
| `POST` | `/orcaagents/notification/send` | `sendNotification` | `SendNotificationRequest` | `OkResponse` | Sends notification to current user via channel |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/notification`
- **Auth & RBAC**: Authenticated workspace users (no admin role required)
- **Key Responsibilities**:
  - Initiating OAuth2 connection flow for Slack
  - Querying connection status and connected user email
  - Disconnecting notification integrations from auth vault
  - Sending direct messages and block kit rich notifications

---

## 3. TypeScript Interfaces

```typescript
export interface OAuth2AuthorizeResponse {
  authorizationUrl: string;
}

export interface OAuth2StatusResponse {
  connected: boolean;
  email?: string;
  provider: 'SLACK' | string;
}

/** Slack chat.postMessage parameters. Channel is the logical target (e.g. "slack"); the server resolves the Slack user ID automatically. */
export interface SendNotificationRequest {
  channel: 'slack' | string;   // lowercase 'slack' (not 'SLACK')
  text?: string;
  blocks?: any[];
  attachments?: any[];
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

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const notificationClient = {
  /**
   * Get OAuth2 redirect URL to connect Slack notifications.
   */
  async getAuthorizeUrl(provider = 'SLACK'): Promise<string> {
    const res = await orcaFetch<OAuth2AuthorizeResponse>(`/orcaagents/notification/oauth2/authorize?provider=${provider}`, {
      method: 'GET',
    });
    return res.authorizationUrl;
  },

  /**
   * Check if current user has connected Slack notifications.
   */
  async getStatus(provider = 'SLACK'): Promise<OAuth2StatusResponse> {
    return orcaFetch<OAuth2StatusResponse>(`/orcaagents/notification/oauth2/status?provider=${provider}`, {
      method: 'GET',
    });
  },

  /**
   * Disconnect notification integration.
   */
  async disconnect(provider = 'SLACK'): Promise<void> {
    await orcaFetch(`/orcaagents/notification/oauth2/disconnect?provider=${provider}`, {
      method: 'DELETE',
    });
  },

  /**
   * Send a test or event notification to the calling user.
   */
  async send(req: SendNotificationRequest): Promise<void> {
    await orcaFetch('/orcaagents/notification/send', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
```

---

## 5. Query & Path Parameters

| Endpoint | Param | Location | Required | Values | Notes |
|---|---|---|---|---|---|
| `getOAuth2AuthorizeURL` | `provider` | query | yes | `SLACK` | Uppercase — matches auth-go provider name |
| `getOAuth2Status` | `provider` | query | yes | `SLACK` | Uppercase |
| `disconnectOAuth2` | `provider` | query | yes | `SLACK` | Uppercase |
| `sendNotification` | — | body `channel` | yes | `slack` | **Lowercase** — distinct from the OAuth2 provider param |

---

## 6. SSE / Binary

Not applicable — all endpoints return JSON responses.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Unsupported provider or channel | Use `provider=SLACK` (uppercase) for OAuth2 endpoints; use `channel: "slack"` (lowercase) for send |
| `401` | Missing or invalid JWT | Include a valid `Authorization: Bearer <token>` header |
| `502` | Auth-go or Slack API unreachable | Retry; check upstream service health |

### Common Gotchas

1. **Provider vs Channel Case**: OAuth2 endpoints use uppercase `SLACK` as the `provider` query param. The send endpoint uses **lowercase** `slack` as the `channel` body field.
2. **Delivery Target**: The `/notification/send` endpoint delivers notifications directly to the Slack identity mapped to the caller's JWT user identity (resolved via OAuth2 credential meta).
3. **Empty Message**: If `text`, `blocks`, and `attachments` are all empty, the server sends a default test message: "This is a test notification from Orca."
