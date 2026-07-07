# Workflow Service

> Email sending via Mailgun.

**Route prefix:** `/orcaagents/workflow`
**Handler:** `handler/web/workflow_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/workflow/email/send` | `sendEmail` | Send an email via Mailgun |

---

## Send Email

```http
POST /orcaagents/workflow/email/send
```

At least one of `text` or `html` must be provided. If `from` is omitted, the server default (`MAILGUN_FROM`) is used.

### Request

```ts
interface WorkflowSendEmailRequest {
  from?: string;               // sender address; omit to use server default
  to: string[];                // required — at least one recipient
  cc?: string[];
  bcc?: string[];
  subject: string;             // required
  text?: string;               // plain-text body
  html?: string;               // HTML body
  attachments?: WorkflowAttachment[];
}

interface WorkflowAttachment {
  filename: string;
  contentType: string;
  data: string;                // base64-encoded file content
  inline?: boolean;
}
```

### Response

```ts
interface WorkflowSendEmailResponse {
  sent: boolean;
  messageId: string;
}
```

### TypeScript

```ts
async function sendEmail(req: WorkflowSendEmailRequest): Promise<WorkflowSendEmailResponse> {
  const res = await fetch("/orcaagents/workflow/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// Attachment helper
async function fileToAttachment(file: File): Promise<WorkflowAttachment> {
  const buffer = await file.arrayBuffer();
  const data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return { filename: file.name, contentType: file.type, data };
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `to`/`subject`, neither `text` nor `html` provided |
| `401` | Not authenticated |
| `502` | Mailgun API failure |
