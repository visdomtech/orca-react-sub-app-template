# Files Service

> GCS file upload/download with signed URLs and workspace scoping.

**Route prefix:** `/orcaagents/files`
**Handler:** `handler/web/files_handler.go`
**Service:** `service/files/`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/files/upload-url` | `getUploadURL` | Generate signed GCS upload URL |
| `POST` | `/orcaagents/files/{id}/confirm` | `confirmUpload` | Confirm upload (PENDING → CONFIRMED) |
| `POST` | `/orcaagents/files/download-url` | `getDownloadURL` | Generate signed GCS download URL |
| `GET` | `/orcaagents/files` | `listFiles` | List workspace files |
| `DELETE` | `/orcaagents/files/{id}` | `deleteFile` | Delete file and GCS object |

---

## Upload Flow

1. **Get upload URL** — creates a PENDING file record, returns a signed GCS upload URL
2. **Upload directly to GCS** — client uploads file to the returned URL
3. **Confirm upload** — marks the file as CONFIRMED

```ts
// Step 1: Get upload URL
interface UploadURLRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

interface UploadURLResponse {
  id: string;
  uploadUrl: string;
  gcsUri: string;
  expiresAt: string;
}

// Step 2: Upload to GCS (direct PUT)
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": contentType },
  body: fileBlob,
});

// Step 3: Confirm
interface ConfirmResponse {
  id: string;
  fileName: string;
  status: string; // "CONFIRMED"
  gcsUri: string;
}
```

## Download Flow

```ts
interface DownloadURLRequest { id: string; }
interface DownloadURLResponse { downloadUrl: string; expiresAt: string; }

async function downloadFile(fileId: string): Promise<void> {
  const res = await fetch("/orcaagents/files/download-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: fileId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const { downloadUrl } = await res.json();
  window.location.href = downloadUrl;
}
```

## List Files

```ts
interface FileRecord {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: string;     // PENDING | CONFIRMED
  uploadedBy: string;
  uploadedAt: string;
  gcsUri: string;
}

async function listFiles(): Promise<{ files: FileRecord[] }> {
  const res = await fetch("/orcaagents/files", { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid input, path traversal detected, bad content type, file too large |
| `401` | Not authenticated |
| `404` | File not found |
| `409` | Invalid status transition (e.g., confirming a non-PENDING file) |
