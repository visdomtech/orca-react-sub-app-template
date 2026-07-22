# Audit Log Service

> Workspace-scoped, transaction-aware audit trail for all meaningful state changes.

**Route prefix:** `/orcaagents/audit`
**Handler:** `handler/web/audit_handler.go`
**Service:** `service/audit/`
**Auth required:** Yes (admin only)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/audit` | `listAuditEntries` | List audit entries with optional filters (admin) |
| `GET` | `/orcaagents/audit/{id}` | `getAuditEntry` | Get a single audit entry by ID (admin) |

---

## Architecture

The audit log records **who did what, to which entity, when, and with what result**. It is the platform-wide compliance trail. There are three insertion paths, all sharing a single contract:

| Path | Consumer | Mechanism |
|------|----------|-----------|
| PL/pgSQL `orca.log_entry()` | Raw SQL / migrations | Direct function call |
| Package-level DAO `audit.LogEntry(ctx, q, entry)` | Go services (tx-atomic) | `dbQuerier` (pool OR `pgx.Tx`) |
| `audit.Service` (`New(pool)`) | Go services (fire-and-forget) | Wraps the pool |

The Go DAO delegates to the `orca.log_entry()` SQL function — there is one source of truth for INSERT logic.

### Entity Types

Use these constants for consistency. Entity types are `lower_snake_case`.

| Constant | Value | Used by |
|----------|-------|--------|
| `EntityApproval` | `approval` | Approval engine |
| `EntityFeatureFlag` | `feature_flag` | Feature flags |
| `EntityModuleFlag` | `module_flag` | Module flags |
| `EntityAppRegistry` | `app_registry` | App registry |
| `EntityAppJob` | `app_job` | Background jobs |
| `EntityRagAgent` | `rag_agent` | RAG agent configs |
| `EntityRagCorpus` | `rag_corpus` | RAG corpora |
| `EntityVertexCorpus` | `vertex_corpus` | Vertex AI corpora |
| `EntityJurisdiction` | `jurisdiction` | Jurisdictions |
| `EntityRegulation` | `regulation` | Regulations |
| `EntityRenderConfig` | `render_config` | Render configs |
| `EntitySession` | `session` | Agent sessions |
| `EntityFile` | `file` | Files |
| `EntityAgentConfig` | `agent_config` | Agent configs |
| `EntityWorkspace` | `workspace` | Workspace-level events |

### Actions

| Constant | Value | When to use |
|----------|-------|-------------|
| `ActionCreate` | `create` | Entity created |
| `ActionUpdate` | `update` | Entity modified |
| `ActionDelete` | `delete` | Entity removed |
| `ActionRead` | `read` | Privileged read (e.g. viewing sensitive config) |
| `ActionLogin` | `login` | User logged in |
| `ActionLogout` | `logout` | User logged out |
| `ActionExport` | `export` | Bulk data export |
| `ActionImport` | `import` | Bulk data import |
| `ActionConfig` | `config` | Configuration changes (hot-reload, log level, etc.) |

---

## List Audit Entries

```http
GET /orcaagents/audit?entityType=approval&action=create&limit=50
```

All query params are optional. Results are always scoped to the caller's workspace. Admin only.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `entityType` | string | Filter by entity type (e.g. `approval`) |
| `entityId` | string | Filter by entity ID |
| `action` | string | Filter by action (e.g. `create`, `delete`) |
| `userEmail` | string | Filter by user email |
| `from` | string (RFC3339) | Inclusive lower bound on `created_at` |
| `to` | string (RFC3339) | Inclusive upper bound on `created_at` |
| `limit` | int | Max results (default 50, max 200) |

### TypeScript

```ts
interface AuditEntry {
  auditId: number;
  workspaceId: string;
  entityType: string;
  entityId?: string;       // absent for type-level events (config reloads, etc.)
  action: string;          // create | update | delete | read | login | ...
  event?: string;          // free-form sub-label
  comment?: string;
  data?: unknown;           // arbitrary JSON payload
  userEmail: string;
  userSubject?: string;     // user UUID
  assumedBy?: string;       // admin acting on behalf
  createdAt: string;        // ISO 8601 timestamp
}

interface ListAuditFilter {
  entityType?: string;
  entityId?: string;
  action?: string;
  userEmail?: string;
  from?: string;  // RFC3339
  to?: string;    // RFC3339
  limit?: number;
}

async function listAuditEntries(filter?: ListAuditFilter): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filter?.entityType) params.set("entityType", filter.entityType);
  if (filter?.entityId) params.set("entityId", filter.entityId);
  if (filter?.action) params.set("action", filter.action);
  if (filter?.userEmail) params.set("userEmail", filter.userEmail);
  if (filter?.from) params.set("from", filter.from);
  if (filter?.to) params.set("to", filter.to);
  if (filter?.limit) params.set("limit", String(filter.limit));

  const qs = params.toString() ? `?${params}` : "";
  const res = await orcaFetch(`/orcaagents/audit${qs}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Get Audit Entry

```ts
async function getAuditEntry(auditId: number): Promise<AuditEntry> {
  const res = await orcaFetch(`/orcaagents/audit/${auditId}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Backend Integration (Go)

Other Go services can log audit entries directly. Two patterns:

### Fire-and-forget

```go
import "github.com/visdomtech/orcaagents/service/audit"

auditSvc := audit.New(pool)
_, err := auditSvc.Log(ctx, &audit.Entry{
    WorkspaceID: claims.WorkspaceID,
    UserEmail:   claims.Email,
    EntityType:  audit.EntityFeatureFlag,
    EntityID:    flagName,
    Action:      audit.ActionCreate,
    Comment:     "enabled feature flag",
})
```

### From background workers (no JWT identity)

Background workers (River jobs) have no JWT claims. Use `audit.LogSystem` — it
sets `UserEmail` to the `SystemUser` sentinel, applies a 2s timeout, and
swallows errors (logged via `slog.Warn`). Nil-safe when `svc == nil`.

```go
// Inside a River worker's Work() method:
audit.LogSystem(ctx, w.audit, args.WorkspaceID, audit.EntityRegulation,
    strconv.FormatInt(regID, 10), audit.ActionImport,
    &audit.Entry{Event: "regulation_imported"})
```

### Transaction-aware (atomic with business write)

```go
err := pool.BeginTxFunc(ctx, pgx.TxOptions{}, func(tx pgx.Tx) error {
    // 1. business write
    if _, err := tx.Exec(ctx, "UPDATE ..."); err != nil {
        return err
    }
    // 2. audit - rolls back with the business write if either fails
    _, err := audit.LogEntry(ctx, tx, &audit.Entry{
        WorkspaceID: claims.WorkspaceID,
        UserEmail:   claims.Email,
        EntityType:  audit.EntityAppJob,
        EntityID:    jobID,
        Action:      audit.ActionCreate,
    })
    return err
})
```

### From raw SQL

```sql
SELECT orca.log_entry(
    'ws-123', 'admin@corp.com', 'feature_flag', 'delete',
    'ORCA_ASK', '', 'disabled via console', NULL, 'user-uuid', 'superadmin'
);
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid `from`/`to` date format (must be RFC3339), or invalid audit ID |
| `401` | Not authenticated |
| `403` | Not admin (all endpoints require admin role) |
| `404` | Audit entry not found (get by ID) |
| `500` | Database error |
