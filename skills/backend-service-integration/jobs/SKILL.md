---
name: jobs-service-integration
description: "Integrate with the Orca Background Jobs Status API (`/orcaagents/jobs`). Operations: listJobs, getJob."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Background Jobs Service Integration Guide

The **Background Jobs Service** tracks long-running River and Cloud Build jobs (app builds, CSV mapping/ingestion, vector embeddings) in the `orca.app_job` tracking table.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/jobs`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/jobs`
- **Auth & RBAC**: Authenticated workspace users (scoped to own workspace; `SYSTEM_ADMIN` can query globally across workspaces).
- **Key Responsibilities**:
  - Polling background task status, duration, and completion
  - Inspecting job errors and results

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/jobs` | `listJobs` | `ListJobsQuery` | `AppJob[]` | Lists background jobs filtered by app, kind, or state |
| `GET` | `/orcaagents/jobs/{id}` | `getJob` | `void` | `AppJob` | Returns details and execution status of a background job |

---

## 3. TypeScript Interfaces & Enums

```typescript
export type JobState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobKind =
  | 'build_sync'
  | 'vertex_file_sync'
  | 'policy_file_import'
  | 'regulation_import_parse'
  | 'regulation_batch_import'
  | 'headcount_csv_import'
  | 'headcount_csv_map'
  | 'headcount_csv_ingest'
  | string;

export interface AppJob {
  id: string;
  kind: JobKind;
  state: JobState;
  refId: string;
  appId?: string;
  workspaceId: string;
  result?: Record<string, any>;
  error?: string;
  createdAt: string;
  finalizedAt: string | null;
}

export interface ListJobsQuery {
  appId?: string;
  kind?: JobKind;
  state?: JobState;
  limit?: number; // default 50, max 100
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const jobsClient = {
  /**
   * List background jobs matching filter criteria.
   */
  async listJobs(query: ListJobsQuery = {}): Promise<AppJob[]> {
    const params = new URLSearchParams();
    if (query.appId) params.set('appId', query.appId);
    if (query.kind) params.set('kind', query.kind);
    if (query.state) params.set('state', query.state);
    if (query.limit) params.set('limit', query.limit.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return orcaFetch<AppJob[]>(`/orcaagents/jobs${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Get job execution status and error details.
   */
  async getJob(jobId: string): Promise<AppJob> {
    return orcaFetch<AppJob>(`/orcaagents/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * Helper to poll a background job until finished or timeout.
   */
  async pollJobUntilDone(jobId: string, intervalMs = 2000, maxAttempts = 60): Promise<AppJob> {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await this.getJob(jobId);
      if (job.state === 'completed' || job.state === 'failed' || job.state === 'cancelled') {
        return job;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Job ${jobId} timed out after ${maxAttempts * intervalMs}ms`);
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Monitoring a Background App Build
```typescript
import { jobsClient } from './jobsClient';

async function monitorBuild(jobId: string) {
  const finished = await jobsClient.pollJobUntilDone(jobId, 2000);
  if (finished.state === 'completed') {
    console.log('Build completed successfully:', finished.result);
  } else {
    console.error(`Build failed with state: ${finished.state}. Error: ${finished.error}`);
  }
}
```

---

## 6. Common Gotchas & Edge Cases

1. **404 Scoping**: Accessing a `jobId` that belongs to another workspace returns HTTP 404 (unless the caller is a `SYSTEM_ADMIN`).
2. **Terminal States**: `completed`, `failed`, and `cancelled` are terminal states.
3. **`error` Field, Not `errorMessage`**: The error message field on `AppJob` is named `error`, not `errorMessage`.
4. **`finalizedAt` Instead of `completedAt`**: Use `finalizedAt` to determine when a job reached a terminal state. It is `null` while the job is still pending or running.
5. **`refId` Links to Source Entity**: The `refId` field references the source entity (e.g. a corpus ID, file ID, or import ID) that triggered the job.
