# Document Storage (DB) Service

> Firestore-backed document CRUD with workspace and user scopes.

**Route prefix:** `/orcaagents/db`
**Handler:** `handler/web/db_handler.go`
**Auth required:** Yes (reads: any workspace member; writes: admin for workspace scope, owner for user scope)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Scope Model

| Scope | Description | Access |
|-------|-------------|--------|
| **Workspace** | Data shared across all workspace members | Read: any member; Write: admin |
| **User** | Data scoped to the authenticated user only | Read/Write: owner only |

## Document ID Format

Documents use **slash-separated Firestore paths**: `collection/doc[/collection/doc/...]`. A bare name like `"settings"` (no slash) returns `400`.

```
// Bad: bare names
"settings"                    // 400
// Good: collection/doc paths
"apps/myapp"                  // OK
"apps/myapp/preferences/ui"   // OK
```

**Size limit:** 1 MB per document (Firestore limit).

---

## Endpoints

### Workspace Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orcaagents/db/workspace/doc/read` | Any member | Read a single workspace document |
| `POST` | `/orcaagents/db/workspace/doc/write` | Admin | Write a single workspace document |
| `POST` | `/orcaagents/db/workspace/docs/batch/read` | Any member | Batch read multiple workspace documents |
| `POST` | `/orcaagents/db/workspace/docs/batch/write` | Admin | Batch write multiple workspace documents |
| `POST` | `/orcaagents/db/workspace/doc/subcollections` | Any member | List sub-collections of a document |
| `POST` | `/orcaagents/db/workspace/doc/subcollection/docs` | Any member | List documents in a sub-collection |

### User Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orcaagents/db/user/doc/read` | Owner | Read a single user document |
| `POST` | `/orcaagents/db/user/doc/write` | Owner | Write a single user document |
| `POST` | `/orcaagents/db/user/docs/batch/read` | Owner | Batch read user documents |
| `POST` | `/orcaagents/db/user/docs/batch/write` | Owner | Batch write user documents |
| `POST` | `/orcaagents/db/user/doc/subcollections` | Owner | List user document sub-collections |
| `POST` | `/orcaagents/db/user/doc/subcollection/docs` | Owner | List user sub-collection documents |

---

## TypeScript Examples

### Read/Write Workspace Document

```ts
type DocData = Record<string, unknown>;

async function readWorkspaceDoc(docId: string): Promise<DocData> {
  const res = await fetch("/orcaagents/db/workspace/doc/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ docId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function writeWorkspaceDoc(docId: string, data: DocData): Promise<void> {
  const res = await fetch("/orcaagents/db/workspace/doc/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ docId, data }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

### Batch Read

```ts
// Returns ordered array: DocData or null if missing
async function batchReadWorkspaceDocs(docIds: string[]): Promise<(DocData | null)[]> {
  const res = await fetch("/orcaagents/db/workspace/docs/batch/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ docIds }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

### Batch Write

```ts
async function batchWriteWorkspaceDocs(
  writes: Record<string, DocData>
): Promise<void> {
  const res = await fetch("/orcaagents/db/workspace/docs/batch/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

### List Sub-Collection Documents

```ts
async function listSubCollectionDocs(
  docId: string,
  subCollectionId: string
): Promise<Record<string, DocData>> {
  const res = await fetch("/orcaagents/db/workspace/doc/subcollection/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ docId, subCollectionId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Request/Response Types

```ts
interface ReadDocRequest { docId: string; }
interface WriteDocRequest { docId: string; data: DocData; }
interface BatchReadRequest { docIds: string[]; }
interface BatchWriteRequest { writes: Record<string, DocData>; }
interface ListSubCollectionsRequest { docId: string; }
interface ListSubCollectionDocsRequest { docId: string; subCollectionId: string; }
```

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid `docId` format (no slash), malformed JSON |
| `401` | Not authenticated |
| `403` | Non-admin user attempting workspace write |
| `404` | Document not found |
