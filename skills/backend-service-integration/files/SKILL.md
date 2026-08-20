---
name: files-service-integration
description: "Integrate with the Orca File Upload & Storage API (`/orcaagents/files`). Operations: getUploadURL, confirmUpload, getDownloadURL, listFiles, deleteFile."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Files Service Integration Guide

The **Files Service** manages secure, workspace-scoped file storage backed by Google Cloud Storage (GCS) and PostgreSQL metadata tracking. It uses a three-step pre-signed URL workflow (`getUploadURL` -> direct GCS upload -> `confirmUpload`).

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/files`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/files`
- **Auth & RBAC**: Authenticated workspace users (read/upload/confirm/delete own workspace files)
- **Key Responsibilities**:
  - Pre-signed GCS upload URL generation with tenant path scoping
  - Post-upload confirmation to transition status from `pending` to `confirmed`
  - Pre-signed GCS download URL generation
  - File metadata listing and deletion

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `POST` | `/orcaagents/files/upload-url` | `getUploadURL` | `UploadURLRequest` | `UploadURLResponse` | Generates a signed GCS PUT URL to upload a file directly |
| `POST` | `/orcaagents/files/{id}/confirm` | `confirmUpload` | `void` | `ConfirmResponse` | Confirms successful upload to GCS (transitions pending -> confirmed) |
| `POST` | `/orcaagents/files/download-url` | `getDownloadURL` | `DownloadURLRequest` | `DownloadURLResponse` | Generates a signed GCS GET URL to download a file |
| `GET` | `/orcaagents/files` | `listFiles` | `void` | `ListResponse` | Lists all file metadata records in caller's workspace |
| `DELETE` | `/orcaagents/files/{id}` | `deleteFile` | `void` | (204 No Content) | Deletes file metadata and underlying GCS object |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface UploadURLRequest {
  fileName: string;
  contentType?: string;
  fileSize?: number;
}

export interface UploadURLResponse {
  id: string;          // File record UUID
  uploadUrl: string;   // Signed GCS PUT URL
  gcsUri: string;      // gs://bucket/...
  expiresAt: string;   // ISO-8601 expiration time
}

export interface ConfirmResponse {
  id: string;
  fileName: string;
  status: 'pending' | 'confirmed';
  gcsUri: string;
}

export interface DownloadURLRequest {
  id: string;
}

export interface DownloadURLResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  uploadedBy: string;
  uploadedAt: string;
  gcsUri: string;
}

export interface ListResponse {
  files: FileMetadata[];
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const filesClient = {
  /**
   * Complete 3-step file upload workflow:
   * 1. Get signed GCS URL
   * 2. PUT file bytes directly to GCS
   * 3. Confirm upload on backend
   */
  async uploadFile(file: File): Promise<ConfirmResponse> {
    // 1. Get upload URL
    const prep = await orcaFetch<UploadURLResponse>('/orcaagents/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    });

    // 2. Direct PUT to GCS (without auth headers, using pre-signed URL)
    const gcsRes = await fetch(prep.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!gcsRes.ok) {
      throw new Error(`Failed to upload file to storage: ${gcsRes.statusText}`);
    }

    // 3. Confirm upload
    return orcaFetch<ConfirmResponse>(`/orcaagents/files/${prep.id}/confirm`, {
      method: 'POST',
    });
  },

  /**
   * Get temporary download URL for a file.
   */
  async getDownloadURL(fileId: string): Promise<string> {
    const res = await orcaFetch<DownloadURLResponse>('/orcaagents/files/download-url', {
      method: 'POST',
      body: JSON.stringify({ id: fileId }),
    });
    return res.downloadUrl;
  },

  /**
   * List all files in the current workspace.
   */
  async listFiles(): Promise<FileMetadata[]> {
    const res = await orcaFetch<ListResponse>('/orcaagents/files', {
      method: 'GET',
    });
    return res.files;
  },

  /**
   * Delete a file by ID. Returns 204 No Content on success.
   */
  async deleteFile(fileId: string): Promise<void> {
    await orcaFetch(`/orcaagents/files/${fileId}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Browser File Input Upload
```typescript
import { filesClient } from './filesClient';

async function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const confirmed = await filesClient.uploadFile(file);
    console.log('File successfully uploaded & registered:', confirmed.id);
  } catch (err) {
    console.error('File upload failed:', err);
  }
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Direct GCS PUT Content-Type**: The `Content-Type` header passed to `fetch(uploadUrl, { headers: { 'Content-Type': ... } })` must match the `contentType` requested in `getUploadURL`.
2. **Confirmation is Required**: If `confirmUpload` is not called after uploading to GCS, the file remains in `pending` status and won't be indexed or processed by background workers.
3. **Status Values Are Lowercase**: The file status values are `"pending"` and `"confirmed"` (lowercase), not uppercase.
4. **Delete Returns 204 No Content**: The `deleteFile` endpoint returns HTTP 204 with no response body (not an `OkResponse`).
5. **409 on Invalid Status Transition**: Confirming a file that is not in `pending` status returns HTTP 409 Conflict.
6. **400 on Path Traversal / Bad Content Type**: Uploading with suspicious filenames (path traversal) or disallowed content types returns HTTP 400.
