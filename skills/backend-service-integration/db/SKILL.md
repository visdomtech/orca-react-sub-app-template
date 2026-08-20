---
name: db-service-integration
description: "Integrate with the Orca Firestore Database Proxy API (`/orcaagents/db`). Operations: readWorkspaceDoc, writeWorkspaceDoc, deleteWorkspaceDoc, batchReadWorkspaceDocs, batchWriteWorkspaceDocs, listWorkspaceDocSubCollections, listWorkspaceSubCollectionDocs, readUserDoc, writeUserDoc, batchReadUserDocs, batchWriteUserDocs, listUserDocSubCollections, listUserSubCollectionDocs, listWorkspaceRepositories, updateWorkspaceRepository."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Database Proxy Service Integration Guide

The **Database Proxy Service** provides secure, workspace- and user-scoped Firestore document storage and retrieval with automatic multi-tenant path isolation and fine-grained authorization.

---

## 1. Endpoints

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `POST` | `/orcaagents/db/workspace/doc/read` | `readWorkspaceDoc` | `DocIDRequest` | `FirestoreDoc` | Reads a document from caller's workspace collection |
| `POST` | `/orcaagents/db/workspace/doc/write` | `writeWorkspaceDoc` | `WriteDocRequest` | `OkResponse` | Writes (sets or merges) a document in workspace collection |
| `POST` | `/orcaagents/db/workspace/doc/delete` | `deleteWorkspaceDoc` | `DocIDRequest` | `OkResponse` | Deletes a document from workspace collection |
| `POST` | `/orcaagents/db/workspace/docs/batch/read` | `batchReadWorkspaceDocs` | `BatchReadRequest` | `FirestoreDoc[]` | Batch reads up to 500 documents from workspace collection |
| `POST` | `/orcaagents/db/workspace/docs/batch/write` | `batchWriteWorkspaceDocs` | `BatchWriteRequest` | `OkResponse` | Batch writes up to 500 documents into workspace collection |
| `POST` | `/orcaagents/db/workspace/doc/subcollections` | `listWorkspaceDocSubCollections` | `ListSubCollectionsRequest` | `string[]` | Returns names of subcollections under a workspace doc |
| `POST` | `/orcaagents/db/workspace/doc/subcollection/docs` | `listWorkspaceSubCollectionDocs` | `ListSubCollectionDocsRequest` | `Record<string, FirestoreDoc>` | Returns all documents in a subcollection |
| `POST` | `/orcaagents/db/user/doc/read` | `readUserDoc` | `DocIDRequest` | `FirestoreDoc` | Reads a document from caller's user collection |
| `POST` | `/orcaagents/db/user/doc/write` | `writeUserDoc` | `WriteDocRequest` | `OkResponse` | Writes a document to caller's user collection |
| `POST` | `/orcaagents/db/user/docs/batch/read` | `batchReadUserDocs` | `BatchReadRequest` | `FirestoreDoc[]` | Batch reads documents from caller's user collection |
| `POST` | `/orcaagents/db/user/docs/batch/write` | `batchWriteUserDocs` | `BatchWriteRequest` | `OkResponse` | Batch writes documents into caller's user collection |
| `POST` | `/orcaagents/db/user/doc/subcollections` | `listUserDocSubCollections` | `ListSubCollectionsRequest` | `string[]` | Returns names of subcollections under a user doc |
| `POST` | `/orcaagents/db/user/doc/subcollection/docs` | `listUserSubCollectionDocs` | `ListSubCollectionDocsRequest` | `Record<string, FirestoreDoc>` | Returns all documents in a user subcollection |
| `POST` | `/orcaagents/db/workspace/repositories/list` | `listWorkspaceRepositories` | `void` | `Record<string, Repository \| null>` | Lists standard policy/regulation repository configs keyed by repo ID |
| `POST` | `/orcaagents/db/workspace/repositories/update` | `updateWorkspaceRepository` | `UpdateRepositoryRequest` | `OkResponse` | Updates corpus mapping for a workspace repository (SYSTEM_ADMIN only) |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/db`
- **Auth & RBAC**:
  - `workspace/*`: Scoped to `claims.WorkspaceID`. Mutating operations require write permission on the workspace.
  - `user/*`: Scoped to `claims.WorkspaceID / users / claims.Email`.
  - `workspace/repositories/update`: Requires **`SYSTEM_ADMIN`** role only.
- **Key Responsibilities**:
  - CRUD operations on workspace-scoped Firestore documents
  - CRUD operations on user-scoped personal Firestore documents
  - Subcollection listing and querying
  - High-throughput batch read and batch write (up to 500 documents per call)
  - Repository / corpus mapping configurations (keyed by repo ID: `"policy"` or `"regulation"`)

---

## 3. TypeScript Interfaces

```typescript
export type FirestoreDoc = Record<string, any>;

export interface DocIDRequest {
  docId: string;
}

export interface WriteDocRequest {
  docId: string;
  data: Record<string, any>;
}

export interface BatchReadRequest {
  docIds: string[]; // max 500
}

export interface BatchWriteRequest {
  writes: Record<string, Record<string, any>>; // map of docId -> data (max 500)
}

export interface ListSubCollectionsRequest {
  docId: string;
}

export interface ListSubCollectionDocsRequest {
  docId: string;
  subCollectionId: string;
}

/** Repository config returned by listWorkspaceRepositories. The repo ID ("policy" | "regulation") is the map key, not a struct field. */
export interface Repository {
  corpusName: string;
  displayName: string;
  updatedAt: number;   // Unix milliseconds
  updatedBy: string;   // email of the last modifier
}

export interface UpdateRepositoryRequest {
  repoId: string;      // "policy" | "regulation"
  corpusName: string;
  displayName: string; // required
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const dbClient = {
  // --- Workspace Documents ---
  async readWorkspaceDoc(docId: string): Promise<FirestoreDoc> {
    return orcaFetch<FirestoreDoc>('/orcaagents/db/workspace/doc/read', {
      method: 'POST',
      body: JSON.stringify({ docId }),
    });
  },

  async writeWorkspaceDoc(docId: string, data: Record<string, any>): Promise<void> {
    return orcaFetch<void>('/orcaagents/db/workspace/doc/write', {
      method: 'POST',
      body: JSON.stringify({ docId, data }),
    });
  },

  async deleteWorkspaceDoc(docId: string): Promise<void> {
    return orcaFetch<void>('/orcaagents/db/workspace/doc/delete', {
      method: 'POST',
      body: JSON.stringify({ docId }),
    });
  },

  async batchReadWorkspaceDocs(docIds: string[]): Promise<FirestoreDoc[]> {
    return orcaFetch<FirestoreDoc[]>('/orcaagents/db/workspace/docs/batch/read', {
      method: 'POST',
      body: JSON.stringify({ docIds }),
    });
  },

  async batchWriteWorkspaceDocs(writes: Record<string, Record<string, any>>): Promise<void> {
    return orcaFetch<void>('/orcaagents/db/workspace/docs/batch/write', {
      method: 'POST',
      body: JSON.stringify({ writes }),
    });
  },

  // --- User Documents ---
  async readUserDoc(docId: string): Promise<FirestoreDoc> {
    return orcaFetch<FirestoreDoc>('/orcaagents/db/user/doc/read', {
      method: 'POST',
      body: JSON.stringify({ docId }),
    });
  },

  async writeUserDoc(docId: string, data: Record<string, any>): Promise<void> {
    return orcaFetch<void>('/orcaagents/db/user/doc/write', {
      method: 'POST',
      body: JSON.stringify({ docId, data }),
    });
  },

  // --- Repositories ---
  async listRepositories(): Promise<Record<string, Repository | null>> {
    return orcaFetch<Record<string, Repository | null>>('/orcaagents/db/workspace/repositories/list', {
      method: 'POST',
    });
  },

  async updateRepository(req: UpdateRepositoryRequest): Promise<void> {
    return orcaFetch<void>('/orcaagents/db/workspace/repositories/update', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
```

---

## 5. Query & Path Parameters

All endpoints use POST with JSON body — no query or path parameters.

---

## 6. SSE / Binary

Not applicable — all endpoints return JSON responses.

---

## 7. Error Scenarios

| Status | Condition | Mitigation / Resolution |
|--------|-----------|-------------------------|
| `400` | Missing `docId`, empty `subCollectionId`, or unsupported `repoId` | Ensure required fields are populated; `repoId` must be `"policy"` or `"regulation"` |
| `401` | Missing or invalid JWT | Include a valid `Authorization: Bearer <token>` header |
| `403` | Permission denied or insufficient role | `updateWorkspaceRepository` requires `SYSTEM_ADMIN` role; workspace ops require appropriate scope permission |
| `404` | Document not found (Firestore not-found) | Handle gracefully in client code |
| `500` | Internal server error | Inspect backend logs |

### Common Gotchas

1. **404 vs Empty Doc**: `readWorkspaceDoc` and `readUserDoc` return HTTP 404 if the document does not exist. Handle 404 gracefully in client code.
2. **Batch Limits**: The server enforces a maximum limit of 500 items per batch for both `batchRead` and `batchWrite`.
3. **Repository Map Key**: `listWorkspaceRepositories` returns a map keyed by repo ID (`"policy"`, `"regulation"`). Values may be `null` if the repository has not been configured yet.
4. **SYSTEM_ADMIN Only**: `updateWorkspaceRepository` requires `SYSTEM_ADMIN` role — `ADMIN` is not sufficient.
