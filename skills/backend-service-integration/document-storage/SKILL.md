# Document Storage (DB) Service

> Firestore-backed document CRUD with workspace and user scopes.

**Route prefix:** `/orcaagents/db`
**Handler:** `handler/web/db_handler.go`
**Service:** `service/db/`
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

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/db/workspace/doc/read` | `readWorkspaceDoc` | Read a single workspace document |
| `POST` | `/orcaagents/db/workspace/doc/write` | `writeWorkspaceDoc` | Write a single workspace document (admin) |
| `POST` | `/orcaagents/db/workspace/doc/delete` | `deleteWorkspaceDoc` | Delete a workspace document (admin) |
| `POST` | `/orcaagents/db/workspace/docs/batch/read` | `batchReadWorkspaceDocs` | Batch read multiple workspace documents |
| `POST` | `/orcaagents/db/workspace/docs/batch/write` | `batchWriteWorkspaceDocs` | Batch write multiple workspace documents (admin) |
| `POST` | `/orcaagents/db/workspace/doc/subcollections` | `listWorkspaceDocSubCollections` | List sub-collections of a document |
| `POST` | `/orcaagents/db/workspace/doc/subcollection/docs` | `listWorkspaceSubCollectionDocs` | List documents in a sub-collection |

### User Documents

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/db/user/doc/read` | `readUserDoc` | Read a single user document |
| `POST` | `/orcaagents/db/user/doc/write` | `writeUserDoc` | Write a single user document |
| `POST` | `/orcaagents/db/user/docs/batch/read` | `batchReadUserDocs` | Batch read user documents |
| `POST` | `/orcaagents/db/user/docs/batch/write` | `batchWriteUserDocs` | Batch write user documents |
| `POST` | `/orcaagents/db/user/doc/subcollections` | `listUserDocSubCollections` | List user document sub-collections |
| `POST` | `/orcaagents/db/user/doc/subcollection/docs` | `listUserSubCollectionDocs` | List user sub-collection documents |

### Workspace Repositories

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/db/workspace/repositories/list` | `listWorkspaceRepositories` | List policy + regulation repository configs |
| `POST` | `/orcaagents/db/workspace/repositories/update` | `updateWorkspaceRepository` | Update a repository corpus link (system admin) |

---

## Types

```ts
type DocData = Record<string, unknown>;

interface ReadDocRequest { docId: string; }
interface WriteDocRequest { docId: string; data: DocData; }
interface BatchReadRequest { docIds: string[]; }
interface BatchWriteRequest { writes: Record<string, DocData>; }
interface ListSubCollectionsRequest { docId: string; }
interface ListSubCollectionDocsRequest { docId: string; subCollectionId: string; }

interface Repository {
  corpusName: string;    // Vertex AI corpus full resource name
  displayName: string;
  updatedAt: number;     // Unix milliseconds
  updatedBy: string;     // email of last modifier
}

interface UpdateRepositoryRequest {
  repoId: string;        // "policy" or "regulation"
  corpusName: string;
  displayName: string;
}
```

---

## Read/Write/Delete Workspace Document

```ts
async function readWorkspaceDoc(docId: string): Promise<DocData> {
  const res = await orcaFetch("/orcaagents/db/workspace/doc/read", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function writeWorkspaceDoc(docId: string, data: DocData): Promise<void> {
  const res = await orcaFetch("/orcaagents/db/workspace/doc/write", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId, data }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

async function deleteWorkspaceDoc(docId: string): Promise<void> {
  const res = await orcaFetch("/orcaagents/db/workspace/doc/delete", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Batch Read/Write Workspace Documents

```ts
// Returns ordered array: DocData or null if missing
async function batchReadWorkspaceDocs(
  docIds: string[]
): Promise<(DocData | null)[]> {
  const res = await orcaFetch("/orcaagents/db/workspace/docs/batch/read", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docIds }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function batchWriteWorkspaceDocs(
  writes: Record<string, DocData>
): Promise<void> {
  const res = await orcaFetch("/orcaagents/db/workspace/docs/batch/write", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## List Sub-Collection Documents

```ts
async function listWorkspaceSubCollectionDocs(
  docId: string,
  subCollectionId: string
): Promise<Record<string, DocData>> {
  const res = await orcaFetch("/orcaagents/db/workspace/doc/subcollection/docs", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId, subCollectionId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## User Documents

Same interface as workspace documents, but scoped to the authenticated user and
prefixed `/orcaagents/db/user/doc/...`:

```ts
async function readUserDoc(docId: string): Promise<DocData> {
  const res = await orcaFetch("/orcaagents/db/user/doc/read", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function writeUserDoc(docId: string, data: DocData): Promise<void> {
  const res = await orcaFetch("/orcaagents/db/user/doc/write", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docId, data }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

async function batchReadUserDocs(
  docIds: string[]
): Promise<(DocData | null)[]> {
  const res = await orcaFetch("/orcaagents/db/user/docs/batch/read", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ docIds }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

> `batchWriteUserDocs`, `listUserDocSubCollections`, and `listUserSubCollectionDocs`
> follow the same pattern as their workspace counterparts, with the `/user/doc/...`
> prefix.

---

## Workspace Repositories

```ts
// Returns { policy?: Repository, regulation?: Repository }
async function listWorkspaceRepositories(): Promise<Record<string, Repository | null>> {
  const res = await orcaFetch("/orcaagents/db/workspace/repositories/list", {
    method: "POST",
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function updateWorkspaceRepository(
  repoId: string,
  corpusName: string,
  displayName: string
): Promise<void> {
  const res = await orcaFetch("/orcaagents/db/workspace/repositories/update", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ repoId, corpusName, displayName }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid `docId` format (no slash), malformed JSON |
| `401` | Not authenticated |
| `403` | Non-admin user attempting workspace write; non-system-admin updating repository |
| `404` | Document not found |
