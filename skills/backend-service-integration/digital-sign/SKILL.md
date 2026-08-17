# Digital Sign Service

> Send workspace files for digital signature via Dropbox Sign or Adobe Acrobat Sign.
> Provider credentials are configured workspace-wide — sub-apps never handle API keys.

**Route prefix:** `/orcaagents/esign`
**Handler:** `handler/web/esign_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

> **Prerequisite:** The file must be uploaded and confirmed with the [Files Service](../files/SKILL.md) before calling these endpoints. Only `CONFIRMED` files can be sent for signing.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/esign/providers` | `listESignProviders` | Check which providers are configured |
| `POST` | `/orcaagents/esign/document-requests` | `sendDocumentForSignature` | Send a file for digital signature |
| `GET` | `/orcaagents/esign/document-requests` | `listDocumentSignatureRequests` | List signature requests (filterable by object) |
| `GET` | `/orcaagents/esign/document-requests/{id}` | `getDocumentSignatureRequest` | Get a specific signature request |
| `POST` | `/orcaagents/esign/document-requests/{id}/sync` | `syncDocumentSignatureStatus` | Sync status from the provider |

---

## TypeScript Types

```ts
interface ESignSigner {
  name: string;
  email: string;
}

type DocumentSignatureStatus = "PENDING" | "SIGNED" | "CANCELLED";

interface DocumentSignatureRequest {
  id: string;
  workspaceId: string;
  fileId: string;
  title: string;
  objectType: string | null;  // sub-app object type, e.g. "contract"
  objectId: string | null;    // sub-app object ID
  signers: ESignSigner[];
  signatureRequestId: string | null;
  signatureProvider: "dropbox_sign" | "adobe_sign" | null;
  status: DocumentSignatureStatus;
  signedAt: string | null;    // ISO 8601
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ESignProvidersResponse {
  dropboxSign: boolean;
  adobeSign: boolean;
}

interface SendDocumentForSignatureRequest {
  fileId: string;
  title: string;
  signers: ESignSigner[];
  provider?: "dropbox_sign" | "adobe_sign"; // omit to auto-select
  objectType?: string;  // link to a sub-app object (optional)
  objectId?: string;
}

interface ListDocumentRequestsResponse {
  requests: DocumentSignatureRequest[];
}
```

---

## Check Configured Providers

```ts
async function fetchESignProviders(): Promise<ESignProvidersResponse> {
  const res = await orcaFetch("/orcaagents/esign/providers", {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Send a Document for Signing

```ts
async function sendForSignature(
  fileId: string,
  title: string,
  signers: ESignSigner[],
  objectType?: string,
  objectId?: string,
): Promise<DocumentSignatureRequest> {
  const body: SendDocumentForSignatureRequest = {
    fileId,
    title,
    signers,
    ...(objectType ? { objectType } : {}),
    ...(objectId ? { objectId } : {}),
  };
  const res = await orcaFetch("/orcaagents/esign/document-requests", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## List Signature Requests

```ts
// List all requests for the workspace
async function listSignatureRequests(): Promise<ListDocumentRequestsResponse> {
  const res = await orcaFetch("/orcaagents/esign/document-requests", {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// List requests linked to a specific sub-app object
async function listSignatureRequestsForObject(
  objectType: string,
  objectId: string,
): Promise<ListDocumentRequestsResponse> {
  const params = new URLSearchParams({ objectType, objectId });
  const res = await orcaFetch(
    `/orcaagents/esign/document-requests?${params}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Sync Status from Provider

Call this when you need to force-refresh status (e.g., webhooks not configured):

```ts
async function syncSignatureStatus(requestId: string): Promise<DocumentSignatureRequest> {
  const res = await orcaFetch(
    `/orcaagents/esign/document-requests/${requestId}/sync`,
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing required fields, no signers, signer missing name/email |
| `401` | Not authenticated |
| `404` | File or signature request not found |
| `409` | Signature request has not been sent yet (sync called too early) |
| `503` | No e-sign provider configured for this workspace |
| `502` | Provider API call failed |
