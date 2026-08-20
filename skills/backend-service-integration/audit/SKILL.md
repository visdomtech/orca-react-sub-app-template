---
name: audit-service-integration
description: "Integrate with the Orca Audit Log Service (`/orcaagents/audit`). Operations: listAuditEntries, getAuditEntry."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Audit Log Service Integration Guide

The **Audit Log Service** provides workspace-scoped, transaction-aware audit trail logging. It records who did what, to which entity, when, and with what result across all mutated resources in the system.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/audit`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/audit`
- **Auth & RBAC**: Strictly requires **`ADMIN`** or **`SYSTEM_ADMIN`** role. All audit queries are workspace-scoped automatically from the JWT claims.
- **Key Responsibilities**:
  - Query audit events filtered by entity type, entity ID, action, user email, and RFC3339 time ranges
  - Keyset/cursor-based pagination for fast large-scale log browsing
  - Single audit entry detail retrieval

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/audit` | `listAuditEntries` | `ListAuditEntriesQuery` | `AuditListResult` | Lists audit log entries for caller's workspace (Admin only) |
| `GET` | `/orcaagents/audit/{id}` | `getAuditEntry` | `void` | `AuditEntry` | Returns a single audit log entry by ID (Admin only) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface AuditEntry {
  auditId: number;
  workspaceId: string;
  entityType: string;
  entityId?: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'export' | 'import' | 'config' | string;
  event?: string;
  comment?: string;
  data?: Record<string, any>;
  userEmail: string;
  userSubject?: string;
  assumedBy?: string;
  createdAt: string;
}

export interface ListAuditEntriesQuery {
  entityType?: string;
  entityId?: string;
  action?: string;
  userEmail?: string;
  from?: string; // RFC3339 timestamp
  to?: string;   // RFC3339 timestamp
  limit?: number; // default 50, max 200
  cursor?: number; // last-seen auditId for cursor pagination
}

export interface AuditListResult {
  entries: AuditEntry[];
  nextCursor: number; // 0 means no more pages
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const auditClient = {
  /**
   * List audit log entries with optional filters and cursor pagination.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  async listEntries(query: ListAuditEntriesQuery = {}): Promise<AuditListResult> {
    const params = new URLSearchParams();
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.entityId) params.set('entityId', query.entityId);
    if (query.action) params.set('action', query.action);
    if (query.userEmail) params.set('userEmail', query.userEmail);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.cursor) params.set('cursor', query.cursor.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return orcaFetch<AuditListResult>(`/orcaagents/audit${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Get a specific audit entry by ID.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  async getEntry(id: number): Promise<AuditEntry> {
    return orcaFetch<AuditEntry>(`/orcaagents/audit/${id}`, {
      method: 'GET',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Investigating Changes to a Policy or Requisition
```typescript
import { auditClient } from './auditClient';

async function investigateEntityHistory(entityType: string, entityId: string) {
  const result = await auditClient.listEntries({
    entityType,
    entityId,
    limit: 100,
  });

  console.log(`Found ${result.entries.length} audit entries for ${entityType}/${entityId}:`);
  for (const entry of result.entries) {
    console.log(`[${entry.createdAt}] ${entry.userEmail ?? 'System'} performed ${entry.action} - ${entry.comment ?? ''}`);
  }
}
```

---

## 6. Common Gotchas & Edge Cases

1. **403 Forbidden for Non-Admins**: Only users with `ADMIN` or `SYSTEM_ADMIN` role can access audit logs.
2. **RFC3339 Timestamp Formatting**: When specifying `from` and `to` filters, dates must be full ISO-8601/RFC3339 format (e.g. `2026-01-01T00:00:00Z`).
3. **Keyset Cursor Pagination**: Use `nextCursor` from the response in the next query as `cursor` to smoothly paginate through historical audit streams. A `nextCursor` of `0` means there are no more pages.
4. **`data` Field**: The `data` field contains arbitrary JSON payload attached by the writing service (e.g. `{"name": "flag_name", "workspaceId": "..."}`). Its shape varies by action/entity.
5. **`assumedBy` Field**: Present when an admin acts on behalf of another user (impersonation context).
