# Regulation Repository Service

> Source-of-truth regulation records with a batch upload + AI extraction pipeline (GCS copy -> Vertex AI import -> Gemini metadata extraction).

**Route prefix:** `/orcaagents/regulations`
**Handler:** `handler/web/regulation_handler.go`
**Service:** `service/regulation/`
**Auth required:** Yes (JWT)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/regulations/uploads` | `createRegulationUpload` | Create a regulation upload batch and get per-file GCS upload URLs |
| `POST` | `/orcaagents/regulations/uploads/{id}/files` | `registerRegulationFile` | Register a confirmed file into the batch (creates a regulation row) |
| `POST` | `/orcaagents/regulations/uploads/{id}/start-import` | `startBatchImport` | Start the batch import (copy to GCS + Vertex import + extraction fan-out) |
| `GET` | `/orcaagents/regulations/uploads/{id}` | `getRegulationUpload` | Get batch status and per-file regulation processing status |
| `GET` | `/orcaagents/regulations` | `listRegulations` | Paginated, searchable list of regulation records |
| `GET` | `/orcaagents/regulations/{id}` | `getRegulation` | Get a single regulation by ID |
| `POST` | `/orcaagents/regulations/{id}/retry` | `retryRegulation` | Retry a failed regulation from its failed phase |
| `GET` | `/orcaagents/regulations/tracker/entries` | `listTrackerEntries` | List law change tracker entries by year/month |

---

## Architecture

The regulation repository is the **source of truth** for regulation metadata (not
a mirror of the Vertex AI corpus). Each upload is a batch that groups one or more
PDF files and enforces a **one-batch-at-a-time** guard (HTTP `409` if another
batch is still in progress; batches older than 2 hours are treated as stale).

Each file flows through a four-phase pipeline, driven by two River background
workers:

| Phase | `proc_status` | Worker | Action |
|-------|---------------|--------|--------|
| 1 | `UPLOADING` | `RegulationBatchImportWorker` | Copy PDF to `gs://{GCS_REGULATION_BUCKET}/regulations/1/{filename}` |
| 2 | `IMPORTING` | `RegulationBatchImportWorker` | Single `ImportRagFiles` call into the workspace's regulation Vertex corpus |
| 3 | `EXTRACTING` | `RegulationImportParseWorker` | Gemini multimodal extraction -> structured metadata |
| 4 | `ACTIVE` | `RegulationImportParseWorker` | Write extracted metadata (`UpdateMetadata`) |

Terminal states: `ACTIVE` (success) or `FAILED` (with `errorMessage`).

> **Corpus resolution:** The Vertex corpus is resolved per workspace via the
> regulation repository link (set by a system admin). If no regulation corpus is
> configured for the workspace, `start-import` and `retry` return `404`.

### Upload Flow

1. **Create batch** - `POST /uploads` returns an `uploadId` plus a per-file
   signed GCS `uploadUrl` (created via the [Files service](../files/SKILL.md) in
   `PENDING` state).
2. **Upload to GCS** - client PUTs each PDF directly to its `uploadUrl`.
3. **Confirm each file** - call the [Files service](../files/SKILL.md)
   `POST /orcaagents/files/{id}/confirm` so the file becomes `CONFIRMED`.
4. **Register each file** - `POST /uploads/{id}/files { fileId }` creates the
   `orca.regulations` row (`proc_status=UPLOADING`). When the last file is
   registered, batch import is **auto-started** as a fallback.
5. **(Optional) Start import** - `POST /uploads/{id}/start-import` explicitly
   starts the batch import (idempotent - dedupes against an existing pending job).
6. **Poll status** - `GET /uploads/{id}` until the batch `status` is `COMPLETED`
   or `FAILED`.

---

## Types

```ts
// ---- Regulation record (source of truth) ----
interface Regulation {
  regulationId: number;
  uploadId?: number;
  appJobId?: string;
  fileId?: string;
  ragCorpusFile?: string;
  gcsUri?: string;
  filename?: string;
  procStatus?: string; // UPLOADING | IMPORTING | EXTRACTING | ACTIVE | FAILED
  jurisdictionCode?: string; // US state abbr (CA, NY) or "FED"
  category?: string[]; // one or more categories
  statuteCode?: string;
  shortTitle?: string;
  officialTitle?: string;
  summary?: string;
  policyClaims?: string[];
  regulatoryClauses?: string[];
  effectiveDate?: string; // YYYY-MM-DD
  lastAmendedDate?: string; // YYYY-MM-DD
  aiConfidence?: number; // 0.0 - 1.0
  aiModelUsed?: string;
  aiExtractionNotes?: string;
  errorMessage?: string;
  currentPhase?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Batch envelope ----
interface RegulationUpload {
  uploadId: number;
  status: string; // IN_PROGRESS | COMPLETED | FAILED | CANCELLED
  totalFiles: number;
  processedFiles: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

---

## Create Regulation Upload

```http
POST /orcaagents/regulations/uploads
```

Creates a new batch and returns per-file GCS upload URLs.

```ts
interface RegulationFileSpec {
  fileName: string;
  contentType: string; // must be "application/pdf"
  fileSize: number;
}

interface RegulationUploadFile {
  fileId: string;
  fileName: string;
  uploadUrl: string; // signed GCS PUT URL
  expiresAt: string; // ISO 8601 (Z)
}

interface CreateRegulationUploadRequest {
  files: RegulationFileSpec[];
}

interface CreateRegulationUploadResponse {
  uploadId: number;
  files: RegulationUploadFile[];
}

async function createRegulationUpload(
  files: RegulationFileSpec[]
): Promise<CreateRegulationUploadResponse> {
  const res = await orcaFetch("/orcaagents/regulations/uploads", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ files }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Register Regulation File

```http
POST /orcaagents/regulations/uploads/{id}/files
```

Registers a **confirmed** file into the batch, creating the `orca.regulations`
row. When the last file is registered, batch import auto-starts.

```ts
interface RegisterRegulationFileRequest {
  fileId: string; // a confirmed public.files id
}

interface RegisterRegulationFileResponse {
  regulationId: number;
  jobId: string; // orca.app_job id
  fileName: string;
}

async function registerRegulationFile(
  uploadId: number,
  fileId: string
): Promise<RegisterRegulationFileResponse> {
  const res = await orcaFetch(
    `/orcaagents/regulations/uploads/${uploadId}/files`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify({ fileId }),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

> The referenced `fileId` must be confirmed first via the [Files service](../files/SKILL.md) `confirmUpload` endpoint. Only PDF files are accepted.

---

## Start Batch Import

```http
POST /orcaagents/regulations/uploads/{id}/start-import
```

Explicitly starts the batch import (idempotent - dedupes against an existing
pending/running batch import job). Usually unnecessary because registration
auto-starts the import, but useful when the client missed the auto-detect.

```ts
interface StartBatchImportResponse {
  uploadId: number;
  jobId: string;
}

async function startBatchImport(
  uploadId: number
): Promise<StartBatchImportResponse> {
  const res = await orcaFetch(
    `/orcaagents/regulations/uploads/${uploadId}/start-import`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Get Regulation Upload

```http
GET /orcaagents/regulations/uploads/{id}
```

Returns the batch envelope plus all per-file regulation rows (with their
`proc_status`). Use this to poll import progress.

```ts
interface GetRegulationUploadResponse {
  upload: RegulationUpload;
  regulations: Regulation[];
}

async function getRegulationUpload(
  uploadId: number
): Promise<GetRegulationUploadResponse> {
  const res = await orcaFetch(
    `/orcaagents/regulations/uploads/${uploadId}`,
    { headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## List Regulations

```http
GET /orcaagents/regulations?page=1&pageSize=25&search=leave&category=LEAVE&status=ACTIVE
```

All query params are optional.

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | 1-based page number (default 1) |
| `pageSize` | int | Items per page (default 25, max 100) |
| `search` | string | Case-insensitive search on `short_title`, `summary`, `statute_code`, `filename` |
| `category` | string | Filter by category (array-contains) |
| `status` | string | Filter by `proc_status` |

```ts
interface ListResult {
  items: Regulation[];
  totalCount: number;
  page: number;
  pageSize: number;
}

async function listRegulations(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<ListResult> {
  const p = new URLSearchParams();
  if (params?.page) p.set("page", String(params.page));
  if (params?.pageSize) p.set("pageSize", String(params.pageSize));
  if (params?.search) p.set("search", params.search);
  if (params?.category) p.set("category", params.category);
  if (params?.status) p.set("status", params.status);
  const qs = p.toString() ? `?${p}` : "";
  const res = await orcaFetch(`/orcaagents/regulations${qs}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Get Regulation

```ts
async function getRegulation(regulationId: number): Promise<Regulation> {
  const res = await orcaFetch(`/orcaagents/regulations/${regulationId}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Retry Failed Regulation

```http
POST /orcaagents/regulations/{id}/retry
```

Re-enqueues the import+parse worker for a `FAILED` regulation. The worker reads
`currentPhase` to skip already-completed phases and resume from where it failed
(phase 1 GCS copy is always skipped on retry). Requires a configured regulation
corpus for the workspace.

```ts
interface RetryResponse {
  regulationId: number;
  jobId: string;
}

async function retryRegulation(
  regulationId: number
): Promise<RetryResponse> {
  const res = await orcaFetch(
    `/orcaagents/regulations/${regulationId}/retry`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## List Tracker Entries

```http
GET /orcaagents/regulations/tracker/entries?year=2026&month=07
```

Returns raw law change entries from the regulations Firestore, grouped by year and month.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `year` | string | 4-digit year (default: current year) |
| `month` | string | 2-digit month `01`-`12` (default: current month) |

### TypeScript

```ts
interface TrackerEntry {
  id: string;
  data: Record<string, unknown>;
}

async function listTrackerEntries(
  year?: string,
  month?: string
): Promise<{ entries: TrackerEntry[]; year: string; month: string }> {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  const qs = params.toString() ? `?${params}` : "";
  const res = await orcaFetch(`/orcaagents/regulations/tracker/entries${qs}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```


---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Empty `files` array, missing `fileId`, non-PDF content type, invalid upload/regulation ID, no pending files or corpus not configured (start-import) |
| `401` | Not authenticated |
| `404` | Upload not found, file not found or not confirmed, regulation not found, no regulation corpus configured for the workspace (start-import/retry) |
| `409` | Another batch upload is already in progress (create upload); regulation is not in `FAILED` state (retry) |
| `500` | Database error, batch creation/registration failure |
| `503` | Job queue unavailable (River client not initialized) |
