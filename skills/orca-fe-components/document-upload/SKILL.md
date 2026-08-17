---
name: add-document-upload
description: Add a document upload button/zone to any page in an Orca sub-app. Uses the Files Service (GCS-backed, signed URLs). Supports PDF, DOCX, XLSX, TXT, CSV, PNG, JPEG, ZIP up to 100 MB.
---

# Add Document Upload to a Sub-App

This skill adds a reusable `DocumentUploadButton` component that uploads files to the Orca Files Service (Google Cloud Storage via signed URLs). It does **not** require any npm install — it only uses the native `fetch` API and the sub-app's `httpClient`.

---

## Step 1 — Ask the developer

Before writing code, ask:

1. **Where should the upload appear?** (which page or component, e.g. `ContractDetailPage`)
2. **What file types are allowed?** (default: PDF only; options: PDF, DOCX, XLSX, PNG, JPEG, ZIP, TXT, CSV)
3. **Should multiple files be uploadable, or one at a time?** (default: one at a time)
4. **What happens after upload succeeds?** (e.g., save the file ID to state, call a parent callback, navigate away)

Record the answers as:
- `TARGET_PAGE` — e.g. `ContractDetailPage`
- `ALLOWED_TYPES` — MIME types comma-separated, e.g. `application/pdf`
- `MULTI` — `true` | `false`
- `ON_SUCCESS` — description of what to do with the returned `fileId`

---

## Step 2 — Write `src/features/<feature>/components/DocumentUploadButton.tsx`

```tsx
import { useRef, useState } from "react";
import { httpClient } from "../../../api/httpClient";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "application/zip": "ZIP",
};

interface UploadedFile {
  id: string;
  fileName: string;
  contentType: string;
  gcsUri: string;
}

interface DocumentUploadButtonProps {
  allowedTypes?: string[];        // MIME types; defaults to ["application/pdf"]
  maxSizeMb?: number;             // default 100
  onUploaded: (file: UploadedFile) => void;
  onError?: (message: string) => void;
  label?: string;
  disabled?: boolean;
}

export function DocumentUploadButton({
  allowedTypes = ["application/pdf"],
  maxSizeMb = 100,
  onUploaded,
  onError,
  label = "Upload Document",
  disabled = false,
}: DocumentUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!allowedTypes.includes(file.type)) {
      const allowed = allowedTypes.map((t) => ALLOWED_CONTENT_TYPES[t] ?? t).join(", ");
      onError?.(`File type not allowed. Allowed: ${allowed}`);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      onError?.(`File exceeds ${maxSizeMb} MB limit.`);
      return;
    }

    setUploading(true);
    try {
      // Step 1: Get signed upload URL
      const { id, uploadUrl } = await httpClient.post<
        { id: string; uploadUrl: string; gcsUri: string },
        { fileName: string; contentType: string; fileSize: number }
      >("/orcaagents/files/upload-url", {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      // Step 2: Upload directly to GCS
      const gcsRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!gcsRes.ok) throw new Error("Upload to storage failed");

      // Step 3: Confirm
      const confirmed = await httpClient.post<
        { id: string; fileName: string; status: string; gcsUri: string }
      >(`/orcaagents/files/${id}/confirm`, {});

      onUploaded({ id: confirmed.id, fileName: file.name, contentType: file.type, gcsUri: confirmed.gcsUri });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {label}
          </>
        )}
      </button>
    </>
  );
}
```

---

## Step 3 — Integrate into `TARGET_PAGE`

Add state for the uploaded file and render the button:

```tsx
import { DocumentUploadButton } from "../components/DocumentUploadButton";

// Inside the component:
const [uploadedFile, setUploadedFile] = useState<{
  id: string;
  fileName: string;
} | null>(null);
const [uploadError, setUploadError] = useState<string | null>(null);

// In JSX:
<div className="flex flex-col gap-2">
  <DocumentUploadButton
    allowedTypes={["application/pdf"]}
    onUploaded={(file) => {
      setUploadedFile(file);
      setUploadError(null);
      // → do something with file.id, e.g. save to state or trigger signing
    }}
    onError={setUploadError}
  />
  {uploadError && (
    <p className="text-sm text-red-600">{uploadError}</p>
  )}
  {uploadedFile && (
    <p className="text-sm text-green-700">
      Uploaded: <span className="font-medium">{uploadedFile.fileName}</span>
    </p>
  )}
</div>
```

---

## Checklist

- [ ] `DocumentUploadButton.tsx` created at the correct path
- [ ] Integrated into `TARGET_PAGE` with `onUploaded` callback
- [ ] `uploadedFile.id` is accessible where needed (state or prop)
- [ ] Error state rendered near the button
- [ ] TypeScript compiles with no errors (`bun run typecheck`)
