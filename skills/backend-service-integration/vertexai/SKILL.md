---
name: vertexai-service-integration
description: "Integrate with the Orca Vertex AI RAG Corpora & Files Mirror API (`/orcaagents/vertexai`). Operations: adminListCorpora, adminGetCorpus, adminSyncCorpora, adminListCorpusFiles, adminSyncCorpusFiles, adminDeleteCorpusFile, policyListFiles, policySyncFiles, policyUploadFile, policyDeleteFile, regulationDeleteFile."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Vertex AI RAG Corpora & Files Mirror Integration Guide

The **Vertex AI Service** manages Google Cloud Vertex AI RAG corpora metadata, indexed files (`orca.vertex_rag_corpora` / `orca.vertex_rag_corpus_files`), and background synchronization jobs across policy and regulation knowledge bases.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/vertexai`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/vertexai`
- **Auth & RBAC**:
  - `policyListFiles`: Authenticated workspace users
  - `policySyncFiles`, `policyUploadFile`, `policyDeleteFile`: Requires **`CUSTOMER_ADMIN`** or higher
  - `adminSyncCorpora`, `adminSyncCorpusFiles`, `adminDeleteCorpusFile`, `regulationDeleteFile`: Require **`SYSTEM_ADMIN`** role
  - `adminListCorpora`, `adminGetCorpus`, `adminListCorpusFiles`: Require **`ADMIN`** role
- **Key Responsibilities**:
  - Mirroring Vertex AI RAG corpora metadata and file indexing states
  - Triggering River background workers for file synchronization and GCS ingestion

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/vertexai/admin/corpora` | `adminListCorpora` | `?location=` | `VertexCorpus[]` | Admin: list all synced Vertex AI corpora |
| `GET` | `/orcaagents/vertexai/admin/corpora/{id}` | `adminGetCorpus` | `void` | `VertexCorpus` | Admin: get Vertex AI corpus by ID |
| `POST` | `/orcaagents/vertexai/admin/corpora/sync` | `adminSyncCorpora` | `void` | `SyncCorporaResult` | Admin: sync all corpora metadata from GCP |
| `GET` | `/orcaagents/vertexai/admin/corpora/{id}/files` | `adminListCorpusFiles` | `?page=&pageSize=&search=` | `ListFilesResult` | Admin: list files in a corpus |
| `POST` | `/orcaagents/vertexai/admin/corpora/{id}/files/sync` | `adminSyncCorpusFiles` | `void` | (202 Accepted) | Admin: trigger background file sync |
| `DELETE` | `/orcaagents/vertexai/admin/corpora/{id}/files/{fileId}` | `adminDeleteCorpusFile` | `void` | (204 No Content) | Admin: delete file from GCP and DB |
| `GET` | `/orcaagents/vertexai/policy/files` | `policyListFiles` | `?page=&pageSize=&search=` | `ListFilesResult` | List files in workspace policy corpus |
| `POST` | `/orcaagents/vertexai/policy/files/sync` | `policySyncFiles` | `void` | (202 Accepted) | Trigger policy corpus file sync |
| `POST` | `/orcaagents/vertexai/policy/files/upload` | `policyUploadFile` | `PolicyUploadRequest` | (202 Accepted) | Import uploaded PDF into policy corpus |
| `DELETE` | `/orcaagents/vertexai/policy/files/{fileId}` | `policyDeleteFile` | `void` | (204 No Content) | Delete file from policy corpus |
| `DELETE` | `/orcaagents/vertexai/regulation/files/{fileId}` | `regulationDeleteFile` | `void` | (204 No Content) | Delete file from regulation corpus |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface VertexCorpus {
  id: number;
  name: string;
  location: string;
  displayName: string;
  description: string;
  createTime: string;
  filesSyncedAt: string | null;
  fileCount: number;
}

export interface VertexCorpusFile {
  id: number;
  corpusName: string;
  name: string;
  displayName: string;
  description: string;
  createTime: string;
}

export interface ListFilesResult {
  files: VertexCorpusFile[];
  totalCount: number;
}

export interface SyncCorporaResult {
  corporaSynced: number;
  byLocation: Record<string, number>;
  syncedAt: string;
}

export interface PolicyUploadRequest {
  fileId: string;          // ULID from Files API upload
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const vertexAIClient = {
  /**
   * List files indexed in the workspace's policy RAG corpus.
   */
  async listPolicyFiles(page = 1, pageSize = 25, search = ''): Promise<ListFilesResult> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    if (search) params.set('search', search);
    return orcaFetch<ListFilesResult>(`/orcaagents/vertexai/policy/files?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Enqueue a PDF import into the workspace policy corpus.
   */
  async uploadPolicyFile(fileId: string): Promise<{ jobId: string; fileId: string; fileName: string }> {
    return orcaFetch('/orcaagents/vertexai/policy/files/upload', {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });
  },

  /**
   * Trigger background file sync between Vertex AI and PostgreSQL.
   */
  async syncPolicyFiles(): Promise<{ jobId: string; corpusId: number; corpusName: string }> {
    return orcaFetch('/orcaagents/vertexai/policy/files/sync', {
      method: 'POST',
    });
  },

  /**
   * Delete a file from the policy corpus (CUSTOMER_ADMIN required).
   */
  async deletePolicyFile(fileId: number): Promise<void> {
    await orcaFetch(`/orcaagents/vertexai/policy/files/${fileId}`, {
      method: 'DELETE',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Upload PDF & Index into Policy Corpus
```typescript
import { filesClient } from '../files/filesClient';
import { vertexAIClient } from './vertexAIClient';

async function uploadAndIndexHandbook(file: File) {
  // 1. Upload raw PDF to Files service
  const fileUpload = await filesClient.uploadFile(file);

  // 2. Queue Vertex AI RAG corpus indexing
  const result = await vertexAIClient.uploadPolicyFile(fileUpload.id);
  console.log('Handbook queued for Vertex AI RAG indexing! Job:', result.jobId);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Async River Jobs**: Upload and sync operations return `202 Accepted` immediately while River background workers perform long-running GCS copies and Vertex AI embedding imports. Use the returned `jobId` to poll status via the Jobs API.
2. **Double Deletion**: Deleting a file removes the file from Google Vertex AI RAG storage and the local PostgreSQL mirror. Returns `204 No Content` on success.
3. **`name` vs `corpusName`**: On `VertexCorpus`, the resource identifier field is `name` (not `corpusName`). On `VertexCorpusFile`, the parent corpus is referenced by `corpusName` (a string), not a numeric `corpusId`.
4. **`pageSize` Not `limit`**: List files endpoints use `pageSize` query parameter (not `limit`). Default is 25 if not specified or less than 1.
5. **`search` Query Param**: Both admin and policy list-files endpoints support a `search` query parameter for case-insensitive substring matching on file display names.
6. **`location` Filter**: `adminListCorpora` accepts an optional `location` query parameter to filter corpora by GCP region (e.g. `us-east4`, `europe-central2`).
7. **Policy Corpus Resolution**: Policy endpoints resolve the workspace's policy corpus via the repository system. If no policy repository is configured, a 404 is returned.
