---
name: workflow-service-integration
description: "Integrate with the Orca Workflow Automation & Email Dispatch API (`/orcaagents/workflow`). Operations: sendWorkflowEmail."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Workflow Automation Service Integration Guide

The **Workflow Service** provides automated notification, transactional email dispatch, and business automation triggers powered by Mailgun integration.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/workflow`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/workflow`
- **Auth & RBAC**: Authenticated workspace users
- **Key Responsibilities**:
  - Dispatching plain-text and HTML emails with CC/BCC support
  - Handling base64-encoded file attachments and inline graphics

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `POST` | `/orcaagents/workflow/email/send` | `sendWorkflowEmail` | `WorkflowSendEmailRequest` | `WorkflowSendEmailResponse` | Dispatches email via Mailgun |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface WorkflowAttachment {
  filename: string;
  contentType: string;
  data: string; // Base64-encoded content
  inline?: boolean;
}

export interface WorkflowSendEmailRequest {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: WorkflowAttachment[];
}

export interface WorkflowSendEmailResponse {
  sent: boolean;
  messageId: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const workflowClient = {
  /**
   * Send an automated email through the workflow dispatch pipeline.
   */
  async sendEmail(req: WorkflowSendEmailRequest): Promise<WorkflowSendEmailResponse> {
    return orcaFetch<WorkflowSendEmailResponse>('/orcaagents/workflow/email/send', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Sending a Welcome Notification with PDF Attachment
```typescript
import { workflowClient } from './workflowClient';

async function sendWelcomeEmailWithHandbook(userEmail: string, pdfBase64: string) {
  const result = await workflowClient.sendEmail({
    to: [userEmail],
    subject: 'Welcome to the Team — Employee Handbook Attached',
    html: '<h1>Welcome!</h1><p>Please find attached the official company policy handbook.</p>',
    attachments: [
      {
        filename: 'EmployeeHandbook2026.pdf',
        contentType: 'application/pdf',
        data: pdfBase64,
      },
    ],
  });
  console.log('Email sent successfully, messageId:', result.messageId);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **At Least One Body Required**: Either `text` or `html` (or both) must be supplied.
2. **Base64 Attachment Data**: `attachments[].data` must be a valid base64-encoded string without data URI prefixes (`data:application/pdf;base64,` must be stripped).
