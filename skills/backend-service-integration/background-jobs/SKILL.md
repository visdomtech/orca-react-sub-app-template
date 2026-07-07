# Background Jobs Service

> River-backed background job status tracking and listing.

**Route prefix:** `/orcaagents/jobs`
**Handler:** `handler/web/jobs_handler.go`
**Service:** `service/jobqueue/`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/jobs` | `listJobs` | List jobs with optional filters |
| `GET` | `/orcaagents/jobs/{id}` | `getJob` | Get a single job by ID |

---

## Architecture

Jobs are backed by [River](https://github.com/riverqueue/river), a PostgreSQL-native job queue. A thin `app_job` mapping table links domain entities to River jobs, enabling domain-level filtering.

### Job Kinds

| Kind | Description |
|------|-------------|
| `build_sync` | Cloud Build status sync and deployment |
| `vertex_file_sync` | Vertex AI corpus file metadata sync |

### Job States

| State | Description |
|-------|-------------|
| `pending` | Job queued, not yet started |
| `running` | Job is being executed |
| `completed` | Job finished successfully |
| `failed` | Job encountered an error |
| `cancelled` | Job was cancelled |

---

## List Jobs

```http
GET /orcaagents/jobs?appId=X&kind=Y&state=Z&limit=50
```

All query params are optional. Non-admin users are automatically scoped to their workspace.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `appId` | string | Filter by associated app ID |
| `kind` | string | Filter by job kind (e.g., `build_sync`) |
| `state` | string | Filter by job state (e.g., `running`) |
| `limit` | int | Maximum number of results |

### Response

```ts
interface AppJob {
  id: string;
  kind: string;
  state: string;
  refId: string;        // domain entity ID (e.g., buildId)
  appId: string;
  result: unknown;      // populated on completion
  error: string | null; // populated on failure
  createdAt: string;
  finalizedAt: string | null;
}

// Response is AppJob[]
```

### TypeScript

```ts
interface ListJobsFilter {
  appId?: string;
  kind?: string;
  state?: string;
  limit?: number;
}

async function listJobs(filter?: ListJobsFilter): Promise<AppJob[]> {
  const params = new URLSearchParams();
  if (filter?.appId) params.set("appId", filter.appId);
  if (filter?.kind) params.set("kind", filter.kind);
  if (filter?.state) params.set("state", filter.state);
  if (filter?.limit) params.set("limit", String(filter.limit));

  const qs = params.toString() ? `?${params}` : "";
  const res = await fetch(`/orcaagents/jobs${qs}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

## Get Job

```ts
async function getJob(jobId: string): Promise<AppJob> {
  const res = await fetch(`/orcaagents/jobs/${jobId}`, {
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
| `401` | Not authenticated |
| `404` | Job not found, or job belongs to a different workspace |
