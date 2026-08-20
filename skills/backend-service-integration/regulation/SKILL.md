---
name: regulation-service-integration
description: "Integrate with the Orca Legal Regulation Repository & Ingestion Pipeline API (`/orcaagents/regulations`). Operations: createRegulationUpload, registerRegulationFile, startBatchImport, getRegulationUpload, listRegulations, getRegulation, retryRegulation, listTrackerEntries."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Legal Regulations Repository Integration Guide

The **Regulation Repository Service** manages employment law source documents, statutes, regulations, and automated multimodal extraction pipelines powered by Vertex AI and Gemini.

---

## 1. Endpoint Reference Table

| Method | Path | Operation ID | Request Body | Response | Status | Description |
|---|---|---|---|---|---|---|
| `POST` | `/orcaagents/regulations/uploads` | `createRegulationUpload` | `CreateRegulationUploadRequest` | `CreateRegulationUploadResponse` | 201 | Creates upload batch with signed URLs |
| `POST` | `/orcaagents/regulations/uploads/{id}/files` | `registerRegulationFile` | `RegisterRegulationFileRequest` | `RegisterRegulationFileResponse` | 202 | Registers confirmed file for import |
| `POST` | `/orcaagents/regulations/uploads/{id}/start-import` | `startBatchImport` | — | `StartBatchImportResponse` | 202 | Enqueues batch import worker |
| `GET` | `/orcaagents/regulations/uploads/{id}` | `getRegulationUpload` | — | `GetRegulationUploadResponse` | 200 | Gets batch + per-file regulation status |
| `GET` | `/orcaagents/regulations` | `listRegulations` | — | `RegulationListResult` | 200 | Lists regulations (searchable, paginated) |
| `GET` | `/orcaagents/regulations/{id}` | `getRegulation` | — | `Regulation` | 200 | Returns a single regulation |
| `POST` | `/orcaagents/regulations/{id}/retry` | `retryRegulation` | — | `RetryResponse` | 202 | Retries failed regulation from failed phase |
| `GET` | `/orcaagents/regulations/tracker/entries` | `listTrackerEntries` | — | `TrackerEntriesResponse` | 200 | Lists monthly law change entries |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/regulations`
- **Auth & RBAC**:
  - `listRegulations`, `getRegulation`, `listTrackerEntries`: Authenticated users
  - Upload/Ingest/Retry mutations: Require **`SYSTEM_ADMIN`** role (enforced via middleware)
- **Pipeline Phases**: `UPLOADING` → `IMPORTING` (GCS Copy + Vertex ImportRagFiles) → `EXTRACTING` (Gemini Multimodal Metadata Extraction) → `ACTIVE`
- **One-Batch-At-A-Time**: Creating a new upload batch while another is `IN_PROGRESS` returns 409 Conflict.
- **Services**: `regulation.Service`, `files.Service`, `db.Client` (Firestore tracker), `vertexai`, `jobqueue` (River)

---

## 3. TypeScript Interfaces & Enums

```typescript
// Regulation processing status
export type RegulationProcStatus = 'UPLOADING' | 'IMPORTING' | 'EXTRACTING' | 'ACTIVE' | 'FAILED';

// Upload batch status
export type UploadStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Regulation {
  regulationId: number;
  uploadId?: number;
  appJobId?: string;
  fileId?: string;
  ragCorpusFile?: string;
  gcsUri?: string;
  filename?: string;
  procStatus?: RegulationProcStatus;
  jurisdictionCode?: string;
  category?: string[];
  statuteCode?: string;
  shortTitle?: string;
  officialTitle?: string;
  summary?: string;
  policyClaims?: string[];
  regulatoryClauses?: string[];
  effectiveDate?: string;       // ISO-8601 date or null
  lastAmendedDate?: string;     // ISO-8601 date or null
  aiConfidence?: number;
  aiModelUsed?: string;
  aiExtractionNotes?: string;
  errorMessage?: string;
  currentPhase?: string;
  createdBy?: string;
  createdAt: string;            // ISO-8601
  updatedAt: string;            // ISO-8601
}

export interface RegulationUpload {
  uploadId: number;
  status: UploadStatus;
  totalFiles: number;
  processedFiles: number;
  createdBy: string;
  createdAt: string;            // ISO-8601
  updatedAt: string;            // ISO-8601
  completedAt?: string;         // ISO-8601 or null
}

// Request types
export interface RegulationFileSpec {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface CreateRegulationUploadRequest {
  files: RegulationFileSpec[];
}

export interface RegulationUploadFile {
  fileId: string;
  fileName: string;
  uploadUrl: string;
  expiresAt: string;            // ISO-8601
}

export interface CreateRegulationUploadResponse {
  uploadId: number;
  files: RegulationUploadFile[];
}

export interface RegisterRegulationFileRequest {
  fileId: string;
}

export interface RegisterRegulationFileResponse {
  regulationId: number;
  jobId: string;
  fileName: string;
}

export interface StartBatchImportResponse {
  uploadId: number;
  jobId: string;
}

export interface GetRegulationUploadResponse {
  upload: RegulationUpload;
  regulations: Regulation[];
}

export interface RetryResponse {
  regulationId: number;
  jobId: string;
}

// List response
export interface RegulationListResult {
  items: Regulation[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Tracker entries
export interface TrackerEntry {
  id: string;
  data: Record<string, any>;
}

export interface TrackerEntriesResponse {
  year: string;
  month: string;
  items: TrackerEntry[];
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const regulationClient = {
  /** Create an upload batch with signed URLs for each file. Returns 201. */
  async createUpload(files: RegulationFileSpec[]): Promise<CreateRegulationUploadResponse> {
    return orcaFetch<CreateRegulationUploadResponse>('/orcaagents/regulations/uploads', {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  },

  /** Register a confirmed uploaded file for regulation import. Returns 202. */
  async registerFile(uploadId: number, fileId: string): Promise<RegisterRegulationFileResponse> {
    return orcaFetch<RegisterRegulationFileResponse>(`/orcaagents/regulations/uploads/${uploadId}/files`, {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });
  },

  /** Start batch import for an upload batch. Returns 202. */
  async startBatchImport(uploadId: number): Promise<StartBatchImportResponse> {
    return orcaFetch<StartBatchImportResponse>(`/orcaagents/regulations/uploads/${uploadId}/start-import`, {
      method: 'POST',
    });
  },

  /** Get upload batch status with per-file regulation records. */
  async getUpload(uploadId: number): Promise<GetRegulationUploadResponse> {
    return orcaFetch<GetRegulationUploadResponse>(`/orcaagents/regulations/uploads/${uploadId}`, {
      method: 'GET',
    });
  },

  /** List regulations with search, category, and status filters. */
  async listRegulations(query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<RegulationListResult> {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', query.page.toString());
    if (query?.pageSize) params.set('pageSize', query.pageSize.toString());
    if (query?.search) params.set('search', query.search);
    if (query?.category) params.set('category', query.category);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return orcaFetch<RegulationListResult>(`/orcaagents/regulations${qs}`, { method: 'GET' });
  },

  /** Get a single regulation by ID. */
  async getRegulation(id: number): Promise<Regulation> {
    return orcaFetch<Regulation>(`/orcaagents/regulations/${id}`, { method: 'GET' });
  },

  /** Retry a failed regulation. Returns 202. */
  async retryRegulation(id: number): Promise<RetryResponse> {
    return orcaFetch<RetryResponse>(`/orcaagents/regulations/${id}/retry`, { method: 'POST' });
  },

  /** List tracker entries for a given year/month. */
  async listTrackerEntries(year?: string, month?: string): Promise<TrackerEntriesResponse> {
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (month) params.set('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return orcaFetch<TrackerEntriesResponse>(`/orcaagents/regulations/tracker/entries${qs}`, {
      method: 'GET',
    });
  },
};
```

---

## 5. Query & Path Parameters

| Operation | Path Params | Query Params | Notes |
|---|---|---|---|
| `registerRegulationFile` | `{id}` (int64, upload ID) | — | Body: `{ fileId: string }`. Only PDFs allowed. |
| `startBatchImport` | `{id}` (int64, upload ID) | — | Returns 202 |
| `getRegulationUpload` | `{id}` (int64, upload ID) | — | Response: `{ upload, regulations }` |
| `listRegulations` | — | `page` (int, default 1), `pageSize` (int, default 25), `search` (string), `category` (string), `status` (string) | Response: `{ items, totalCount, page, pageSize }` |
| `getRegulation` | `{id}` (int64, regulation ID) | — | — |
| `retryRegulation` | `{id}` (int64, regulation ID) | — | Only works when `procStatus` is `FAILED`. Returns 202. |
| `listTrackerEntries` | — | `year` (default: current year), `month` (default: current month) | Response: `{ year, month, items }` |

---

## 6. SSE / Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| Scenario | HTTP Status | Details |
|---|---|---|
| Unauthenticated | 401 | Missing or invalid JWT |
| Non-admin on mutation endpoints | 403 | `SYSTEM_ADMIN role required` |
| Batch already in progress | 409 | `a batch upload is already in progress; wait for it to complete` |
| Upload not found | 404 | `upload not found` |
| Regulation not found | 404 | `regulation not found` |
| File not confirmed | 404 | `file not found or not confirmed` |
| Non-PDF file (register) | 400 | `only PDF files are allowed` |
| Missing fileId | 400 | `fileId is required` |
| No files in batch | 400 | `at least one file is required` |
| Retry on non-failed regulation | 409 | `regulation is not in FAILED state (current: {status})` |
| Batch import: no pending files | 400 | `failed to start batch import; no pending files or corpus not configured` |
| Job queue unavailable | 503 | `job queue unavailable` |
