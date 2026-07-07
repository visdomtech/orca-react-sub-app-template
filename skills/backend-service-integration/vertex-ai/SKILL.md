# Vertex AI Service

> Vertex AI RAG corpus management and file metadata sync.

**Route prefix:** `/orcaagents/vertexai`
**Handler:** `handler/web/vertexai_handler.go`
**Service:** `service/vertexai/`
**Auth required:** Yes (Admin only — all endpoints)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/vertexai/admin/corpora` | `adminListCorpora` | List all synced Vertex AI RAG corpora |
| `GET` | `/orcaagents/vertexai/admin/corpora/{id}` | `adminGetCorpus` | Get a corpus by ID |
| `POST` | `/orcaagents/vertexai/admin/corpora/sync` | `adminSyncCorpora` | Sync corpus metadata from Vertex AI |
| `GET` | `/orcaagents/vertexai/admin/corpora/{id}/files` | `adminListCorpusFiles` | List files in a corpus (paginated) |
| `POST` | `/orcaagents/vertexai/admin/corpora/{id}/files/sync` | `adminSyncCorpusFiles` | Enqueue background file sync job |

---

## Query Parameters (List Corpus Files)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | 1-based page number |
| `pageSize` | int | 25 | Items per page |
| `search` | string | — | Case-insensitive substring match on display name |

## Query Parameters (List Corpora)

| Param | Type | Description |
|-------|------|-------------|
| `location` | string | Filter by Vertex AI location (e.g., `us-east4`) |

---

## File Sync Background Job

The `POST /admin/corpora/{id}/files/sync` endpoint enqueues a River background job to sync file metadata from Vertex AI. Returns a `jobId` that can be polled via `GET /orcaagents/jobs/{jobId}`.

```ts
interface SyncCorpusFilesResponse {
  jobId: string;
  corpusId: number;
  corpusName: string;
}
```

## TypeScript

```ts
interface VertexCorpus {
  id: number;
  name: string;
  displayName: string;
  location: string;
  description?: string;
  syncedAt: string;
}

interface ListFilesResult {
  files: { uri: string; displayName: string; state: string }[];
  totalCount: number;
  page: number;
  pageSize: number;
}

async function listCorpora(location?: string): Promise<VertexCorpus[]> {
  const qs = location ? `?location=${location}` : "";
  const res = await fetch(`/orcaagents/vertexai/admin/corpora${qs}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function syncCorpusFiles(corpusId: number): Promise<SyncCorpusFilesResponse> {
  const res = await fetch(`/orcaagents/vertexai/admin/corpora/${corpusId}/files/sync`, {
    method: "POST",
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
| `400` | Invalid corpus ID |
| `401` | Not authenticated |
| `403` | Not admin |
| `404` | Corpus not found |
| `503` | Job queue unavailable |
