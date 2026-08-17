---
name: add-digital-sign
description: Add a digital signature panel to any page in an Orca sub-app. Supports Dropbox Sign and Adobe Acrobat Sign; providers are configured workspace-wide — the sub-app never handles API keys. Optionally adds document upload if the user needs to upload a file before signing.
---

# Add Digital Signing to a Sub-App

This skill adds a `DocumentSignaturePanel` component to a sub-app page. The panel lets users upload a document (optional), add signers, send it for digital signature, and track signing status — all using workspace-level Dropbox Sign or Adobe Acrobat Sign credentials.

No npm packages required. Uses the Orca Files Service and the Orca Digital Sign Service.

---

## Step 1 — Ask the developer

Before writing any code, ask these questions (one message):

1. **Which page should have the signing panel?** (file path or page name, e.g. `ContractDetailPage`)
2. **What object is being signed?** Give it a snake_case type name, e.g. `contract`, `invoice`, `agreement`.
3. **Does the user need to upload a document first, or is there already a file ID available?**
   - "Upload first" → the panel will include a file picker
   - "File ID from state/props" → the panel receives a `fileId` prop
4. **Where in the page should the panel appear?** (e.g., below the detail section, in a sidebar, in a modal)
5. **What should happen after signing completes?** (e.g., refetch the record, navigate away, show a success message)

Record answers as:
- `TARGET_PAGE` — e.g. `src/features/contracts/pages/ContractDetailPage.tsx`
- `OBJECT_TYPE` — e.g. `contract`
- `UPLOAD_FIRST` — `true` | `false`
- `PANEL_PLACEMENT` — description of where to add JSX
- `ON_SIGNED` — what to do after status becomes SIGNED

---

## Step 2 — Create `useDocumentSignature.ts`

Create this hook at `src/features/<feature>/hooks/useDocumentSignature.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../../api/httpClient";

export interface ESignSigner {
  name: string;
  email: string;
}

export type DocumentSignatureStatus = "PENDING" | "SIGNED" | "CANCELLED";

export interface DocumentSignatureRequest {
  id: string;
  fileId: string;
  title: string;
  objectType: string | null;
  objectId: string | null;
  signers: ESignSigner[];
  signatureRequestId: string | null;
  signatureProvider: "dropbox_sign" | "adobe_sign" | null;
  status: DocumentSignatureStatus;
  signedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SendForSignaturePayload {
  fileId: string;
  title: string;
  signers: ESignSigner[];
  objectType?: string;
  objectId?: string;
}

// Fetch signature requests for a specific object.
export function useDocumentSignatureRequests(objectType: string, objectId: string) {
  return useQuery({
    queryKey: ["esign", "document-requests", objectType, objectId],
    queryFn: async () => {
      const params = new URLSearchParams({ objectType, objectId });
      const res = await httpClient.get<{ requests: DocumentSignatureRequest[] }>(
        `/orcaagents/esign/document-requests?${params}`,
      );
      return res.requests;
    },
    enabled: Boolean(objectType && objectId),
  });
}

// Send a document for signature.
export function useSendForSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendForSignaturePayload) =>
      httpClient.post<DocumentSignatureRequest>("/orcaagents/esign/document-requests", payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["esign", "document-requests", vars.objectType, vars.objectId] });
    },
  });
}

// Sync status from the provider (manual refresh).
export function useSyncSignatureStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      httpClient.post<DocumentSignatureRequest>(
        `/orcaagents/esign/document-requests/${requestId}/sync`,
        {},
      ),
    onSuccess: (data) => {
      if (data.objectType && data.objectId) {
        qc.invalidateQueries({
          queryKey: ["esign", "document-requests", data.objectType, data.objectId],
        });
      }
    },
  });
}

// Check which providers are configured workspace-wide.
export function useESignProviders() {
  return useQuery({
    queryKey: ["esign", "providers"],
    queryFn: () =>
      httpClient.get<{ dropboxSign: boolean; adobeSign: boolean }>(
        "/orcaagents/esign/providers",
      ),
    staleTime: 60_000,
  });
}
```

---

## Step 3 — Create `DocumentSignaturePanel.tsx`

Create at `src/features/<feature>/components/DocumentSignaturePanel.tsx`.

Use `UPLOAD_FIRST` to decide which variant to generate:

### Variant A — User uploads a document then signs it

```tsx
import { useState } from "react";
import { DocumentUploadButton } from "./DocumentUploadButton";
import {
  useDocumentSignatureRequests,
  useSendForSignature,
  useSyncSignatureStatus,
  type ESignSigner,
} from "../hooks/useDocumentSignature";

interface DocumentSignaturePanelProps {
  objectType: string;
  objectId: string;
  documentTitle: string;
  onSigned?: () => void;
}

export function DocumentSignaturePanel({
  objectType,
  objectId,
  documentTitle,
  onSigned,
}: DocumentSignaturePanelProps) {
  const { data: requests = [], isLoading } = useDocumentSignatureRequests(objectType, objectId);
  const sendMutation = useSendForSignature();
  const syncMutation = useSyncSignatureStatus();

  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signers, setSigners] = useState<ESignSigner[]>([{ name: "", email: "" }]);
  const [sendError, setSendError] = useState<string | null>(null);

  const latestRequest = requests[0] ?? null;

  function addSigner() {
    if (signers.length < 5) setSigners((s) => [...s, { name: "", email: "" }]);
  }
  function removeSigner(i: number) {
    setSigners((s) => s.filter((_, idx) => idx !== i));
  }
  function updateSigner(i: number, field: keyof ESignSigner, value: string) {
    setSigners((s) => s.map((sg, idx) => (idx === i ? { ...sg, [field]: value } : sg)));
  }

  async function handleSend() {
    if (!uploadedFileId) return;
    setSendError(null);
    try {
      await sendMutation.mutateAsync({
        fileId: uploadedFileId,
        title: documentTitle,
        signers,
        objectType,
        objectId,
      });
      setUploadedFileId(null);
      setUploadedFileName(null);
      setSigners([{ name: "", email: "" }]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send for signature");
    }
  }

  async function handleSync(requestId: string) {
    const updated = await syncMutation.mutateAsync(requestId);
    if (updated.status === "SIGNED") onSigned?.();
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500 animate-pulse">Loading signature status…</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Digital Signature</h3>

      {/* Active request status */}
      {latestRequest && (
        <div className="space-y-3">
          <SignatureStatusBadge status={latestRequest.status} />
          {latestRequest.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Waiting for signers</span>
              <button
                type="button"
                onClick={() => handleSync(latestRequest.id)}
                disabled={syncMutation.isPending}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                {syncMutation.isPending ? "Refreshing…" : "Refresh status"}
              </button>
            </div>
          )}
          {latestRequest.status === "SIGNED" && latestRequest.signedAt && (
            <p className="text-sm text-gray-500">
              Signed on {new Date(latestRequest.signedAt).toLocaleDateString()}
            </p>
          )}
          {latestRequest.signers.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Signers: </span>
              {latestRequest.signers.map((s) => s.name).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* New signing form — show when no active request or previous one completed/cancelled */}
      {(!latestRequest || latestRequest.status === "CANCELLED") && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          {/* Step 1: Upload */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">1. Upload document</p>
            <DocumentUploadButton
              allowedTypes={["application/pdf"]}
              onUploaded={(f) => {
                setUploadedFileId(f.id);
                setUploadedFileName(f.fileName);
                setUploadError(null);
              }}
              onError={setUploadError}
              disabled={Boolean(uploadedFileId)}
            />
            {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
            {uploadedFileName && (
              <p className="mt-1 text-sm text-green-700">
                Ready: <span className="font-medium">{uploadedFileName}</span>
                <button
                  type="button"
                  onClick={() => { setUploadedFileId(null); setUploadedFileName(null); }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </p>
            )}
          </div>

          {/* Step 2: Signers */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">2. Add signers</p>
            <div className="space-y-2">
              {signers.map((signer, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={signer.name}
                    onChange={(e) => updateSigner(i, "name", e.target.value)}
                    className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={signer.email}
                    onChange={(e) => updateSigner(i, "email", e.target.value)}
                    className="block flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {signers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSigner(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {signers.length < 5 && (
                <button
                  type="button"
                  onClick={addSigner}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add signer
                </button>
              )}
            </div>
          </div>

          {/* Send button */}
          {sendError && <p className="text-sm text-red-600">{sendError}</p>}
          <button
            type="button"
            onClick={handleSend}
            disabled={
              !uploadedFileId ||
              signers.some((s) => !s.name || !s.email) ||
              sendMutation.isPending
            }
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMutation.isPending ? "Sending…" : "Send for Signature"}
          </button>
        </div>
      )}
    </div>
  );
}

function SignatureStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
    SIGNED: "bg-green-50 text-green-800 ring-green-600/20",
    CANCELLED: "bg-gray-50 text-gray-600 ring-gray-500/20",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending Signature",
    SIGNED: "Signed",
    CANCELLED: "Cancelled",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[status] ?? status}
    </span>
  );
}
```

### Variant B — File ID is already available (passed as a prop)

Replace the upload section with a `fileId` prop:

```tsx
interface DocumentSignaturePanelProps {
  objectType: string;
  objectId: string;
  fileId: string;          // already uploaded — no upload step
  documentTitle: string;
  onSigned?: () => void;
}

export function DocumentSignaturePanel({
  objectType,
  objectId,
  fileId,
  documentTitle,
  onSigned,
}: DocumentSignaturePanelProps) {
  // ... same hooks as above, no upload state
  // Replace the "Step 1: Upload" block with:
  //   <p className="text-sm text-gray-500">Document ready for signing.</p>
  // And handleSend uses fileId directly (from prop)
}
```

---

## Step 4 — Add `DocumentUploadButton` if needed

If `UPLOAD_FIRST` is `true`, also run the [add-document-upload](../document-upload/SKILL.md) skill to create the `DocumentUploadButton` component. The upload button is already imported in Variant A above.

---

## Step 5 — Add the panel to `TARGET_PAGE`

Inside `TARGET_PAGE`, import and render the panel at `PANEL_PLACEMENT`:

```tsx
import { DocumentSignaturePanel } from "../components/DocumentSignaturePanel";

// In JSX — replace with your actual objectId source:
<DocumentSignaturePanel
  objectType="OBJECT_TYPE"   // e.g. "contract"
  objectId={item.id}
  documentTitle={item.name ?? "Document"}
  onSigned={() => {
    // ON_SIGNED logic here, e.g.:
    refetch();
  }}
/>
```

---

## Step 6 — Verify

- [ ] `bun run typecheck` passes
- [ ] Panel renders in standalone dev mode (`bun run dev`)
- [ ] Upload button works (check Network tab for `/orcaagents/files/upload-url`)
- [ ] "Send for Signature" button is disabled until both a file and at least one signer are present
- [ ] Status badge shows `PENDING` after sending
- [ ] "Refresh status" button calls `/orcaagents/esign/document-requests/{id}/sync`

---

## Notes

- **Workspace config**: API keys are set by workspace admins at `/orca/admin/integrations/esign`. Sub-apps never touch credentials.
- **Provider selection**: If both Dropbox Sign and Adobe Sign are configured, the backend auto-selects. You can pass a `provider` field in the request body to override.
- **Webhooks**: Status updates via webhook automatically (no polling needed). "Refresh status" is a manual fallback.
- **Signed documents**: Signing providers host the signed PDF. After `status === "SIGNED"`, the provider's own completion email is sent to signers.
