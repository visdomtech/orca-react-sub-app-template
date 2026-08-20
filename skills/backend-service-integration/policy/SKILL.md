---
name: policy-service-integration
description: "Integrate with the Orca Policy Drafts & Templates API (`/orcaagents/orca/policy-*`). Operations: listPolicyTemplates, listPolicyDrafts, initPolicyDraft, getPolicyDraft, deletePolicyDraft, generatePolicyDraft, refinePolicyDraft, finalizePolicyDraft, listPolicyDraftVersions, restorePolicyDraftVersion, exportPolicyDraftPDF."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Policy Drafts & Templates Service Integration Guide

The **Policy Service** provides an AI-assisted workplace policy generation, editing, versioning, and PDF export lifecycle.

---

## 1. Endpoint Reference Table

| Method | Path | Operation ID | Request Body | Response | Status | Description |
|---|---|---|---|---|---|---|
| `GET` | `/orcaagents/orca/policy-templates` | `listPolicyTemplates` | — | `{ success, data: PolicyTemplate[] }` | 200 | Lists active policy templates |
| `GET` | `/orcaagents/orca/policy-drafts` | `listPolicyDrafts` | — | `{ success, data: { items, nextPageKey } }` | 200 | Lists drafts (cursor-paginated) |
| `POST` | `/orcaagents/orca/policy-drafts/init` | `initPolicyDraft` | `InitDraftRequest` | `{ success, data: PolicyDraft }` | 201 | Initializes a draft from a template |
| `GET` | `/orcaagents/orca/policy-drafts/{id}` | `getPolicyDraft` | — | `{ success, data: PolicyDraft }` | 200 | Gets a single policy draft |
| `DELETE` | `/orcaagents/orca/policy-drafts/{id}` | `deletePolicyDraft` | — | `{ status: "ok" }` | 200 | Soft-deletes a policy draft |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/generate` | `generatePolicyDraft` | `GenerationConfigRequest` | `{ success, data: { status: "accepted" } }` | 202 | Starts async AI generation |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/refine` | `refinePolicyDraft` | `GenerationConfigRequest` | `{ success, data: { status: "accepted" } }` | 202 | Starts async AI refinement |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/finalize` | `finalizePolicyDraft` | — | `{ status: "ok" }` | 200 | Finalizes a draft (must be in DRAFT status) |
| `GET` | `/orcaagents/orca/policy-drafts/{id}/versions` | `listPolicyDraftVersions` | — | `{ success, data: PolicyDraftVersion[] }` | 200 | Lists version history |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/versions/{version}/actions/restore` | `restorePolicyDraftVersion` | — | `{ status: "ok" }` | 200 | Restores draft to a previous version |
| `GET` | `/orcaagents/orca/policy-drafts/{id}/export/pdf` | `exportPolicyDraftPDF` | — | `application/pdf` (binary) | 200 | Exports formatted PDF |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/orca` (paths: `/orca/policy-templates`, `/orca/policy-drafts`)
- **Auth & RBAC**: Authenticated workspace users. All queries are scoped to the caller's `workspace_id`.
- **Response Wrapping**: All JSON responses use `{ success: boolean, data: ... }` wrapper (except `OkResponse` endpoints which return `{ status: "ok" }`).
- **Async AI Generation**: `generatePolicyDraft` and `refinePolicyDraft` return 202 Accepted immediately. The AI generation runs in a background goroutine (5-minute timeout). On completion, draft status returns to `DRAFT` with updated `contentMd` and a new version row.
- **Draft Status Lifecycle**: `INITIALIZED` → `GENERATING` → `DRAFT` → `REFINING` → `DRAFT` → `FINALIZED`

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface PolicyTemplate {
  templateId: number;
  templateType: string;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export type PolicyDraftStatus = 'INITIALIZED' | 'GENERATING' | 'REFINING' | 'DRAFT' | 'FINALIZED';

export interface PolicyDraft {
  draftId: number;
  friendlyId: string;          // e.g. "POL-00001"
  title: string;
  contentMd: string;           // flat Markdown content (not nested sections)
  status: PolicyDraftStatus;
  templateType?: string;
  generationMessage?: string;
  generationConfig?: Record<string, any>;
  progressTrackerId?: string;
  currentVersion: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;           // ISO-8601
  updatedAt: string;           // ISO-8601
  finalizedAt?: string;        // ISO-8601 or null
}

export interface PolicyDraftVersion {
  versionId: number;
  draftId: number;
  versionNumber: number;
  title: string;
  contentMd: string;
  editSummary: string;
  generationConfig?: Record<string, any>;
  createdBy: string;
  createdAt: string;           // ISO-8601
}

export interface InitDraftRequest {
  templateType: string;        // references policy_templates.template_type
}

// Used for both generate and refine actions
export interface GenerationConfigRequest {
  cultureStyle?: string;
  communicationStyle?: string;
  coreValues?: string[];
  policyTones?: string[];
  instruction?: string;
}

// Cursor-based pagination for listPolicyDrafts
export interface ListDraftsQuery {
  status?: string;             // filter by status
  pageKey?: string;            // cursor (last draft ID from previous page)
}

export interface ListDraftsResponse {
  items: PolicyDraft[];
  nextPageKey: string | null;  // null when no more pages (page size = 25)
}

// Standard API response wrapper used by most endpoints
export interface PolicyAPIResponse<T> {
  success: boolean;
  data: T;
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

const BASE = '/orcaagents/orca';

export const policyClient = {
  /** List available active policy templates. */
  async listTemplates(): Promise<PolicyTemplate[]> {
    const res = await orcaFetch<PolicyAPIResponse<PolicyTemplate[]>>(`${BASE}/policy-templates`, {
      method: 'GET',
    });
    return res.data;
  },

  /** List policy drafts with cursor-based pagination. */
  async listDrafts(query?: ListDraftsQuery): Promise<ListDraftsResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.pageKey) params.set('pageKey', query.pageKey);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await orcaFetch<PolicyAPIResponse<ListDraftsResponse>>(`${BASE}/policy-drafts${qs}`, {
      method: 'GET',
    });
    return res.data;
  },

  /** Initialize a new policy draft from a template type. */
  async initDraft(templateType: string): Promise<PolicyDraft> {
    const res = await orcaFetch<PolicyAPIResponse<PolicyDraft>>(`${BASE}/policy-drafts/init`, {
      method: 'POST',
      body: JSON.stringify({ templateType }),
    });
    return res.data;
  },

  /** Get draft by ID. */
  async getDraft(draftId: number): Promise<PolicyDraft> {
    const res = await orcaFetch<PolicyAPIResponse<PolicyDraft>>(`${BASE}/policy-drafts/${draftId}`, {
      method: 'GET',
    });
    return res.data;
  },

  /** Soft-delete a policy draft. */
  async deleteDraft(draftId: number): Promise<void> {
    await orcaFetch(`${BASE}/policy-drafts/${draftId}`, { method: 'DELETE' });
  },

  /** Start AI generation (async, returns 202). */
  async generateDraft(draftId: number, config: GenerationConfigRequest): Promise<void> {
    await orcaFetch(`${BASE}/policy-drafts/${draftId}/actions/generate`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /** Start AI refinement (async, returns 202). Uses same body as generate. */
  async refineDraft(draftId: number, config: GenerationConfigRequest): Promise<void> {
    await orcaFetch(`${BASE}/policy-drafts/${draftId}/actions/refine`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /** Finalize a policy draft (must be in DRAFT status). */
  async finalizeDraft(draftId: number): Promise<void> {
    await orcaFetch(`${BASE}/policy-drafts/${draftId}/actions/finalize`, { method: 'POST' });
  },

  /** List version history for a draft. */
  async listVersions(draftId: number): Promise<PolicyDraftVersion[]> {
    const res = await orcaFetch<PolicyAPIResponse<PolicyDraftVersion[]>>(
      `${BASE}/policy-drafts/${draftId}/versions`,
      { method: 'GET' },
    );
    return res.data;
  },

  /** Restore draft to a previous version. */
  async restoreVersion(draftId: number, version: number): Promise<void> {
    await orcaFetch(`${BASE}/policy-drafts/${draftId}/versions/${version}/actions/restore`, {
      method: 'POST',
    });
  },

  /** Download the policy draft as a PDF blob. */
  async downloadPDF(draftId: number): Promise<Blob> {
    const res = await fetch(`${BASE}/policy-drafts/${draftId}/export/pdf`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('orca_token') || ''}` },
    });
    if (!res.ok) throw new Error(`PDF export failed: ${res.statusText}`);
    return res.blob();
  },
};
```

---

## 5. Query & Path Parameters

| Operation | Path Params | Query Params | Notes |
|---|---|---|---|
| `listPolicyDrafts` | — | `status` (optional filter), `pageKey` (cursor) | Cursor-based pagination, page size = 25. `nextPageKey` is null when exhausted. |
| `initPolicyDraft` | — | — | Body: `{ templateType: string }` — must match an active template's `template_type` |
| `getPolicyDraft` / `deletePolicyDraft` | `{id}` (int64) | — | — |
| `generatePolicyDraft` / `refinePolicyDraft` | `{id}` (int64) | — | Body: `GenerationConfigRequest`. Returns 202 immediately. |
| `finalizePolicyDraft` | `{id}` (int64) | — | Only works when draft status is `DRAFT` |
| `listPolicyDraftVersions` | `{id}` (int64) | — | Returns versions sorted descending by `versionNumber` |
| `restorePolicyDraftVersion` | `{id}` (int64), `{version}` (int) | — | Creates a new version snapshot |
| `exportPolicyDraftPDF` | `{id}` (int64) | — | Returns binary PDF |

---

## 6. SSE / Binary

- **PDF Export**: `GET /orca/policy-drafts/{id}/export/pdf` returns `application/pdf` binary with `Content-Disposition: attachment; filename="POL-XXXXX.pdf"`.
- No SSE endpoints. AI generation/refinement runs as background goroutines; poll the draft's `status` field to detect completion (`GENERATING`/`REFINING` → `DRAFT`).

---

## 7. Error Scenarios

| Scenario | HTTP Status | Details |
|---|---|---|
| Unauthenticated | 401 | Missing or invalid JWT |
| Draft not found | 404 | `draft not found` |
| Draft not found or wrong status (finalize) | 404 | `draft not found or not in DRAFT status` |
| Template not found or inactive (init) | 400 | `template not found or inactive` |
| Missing templateType (init) | 400 | `templateType is required` |
| Generation already in progress | 409 | `generation already in progress` (status is GENERATING or REFINING) |
| Draft has no template type (generate) | 400 | `draft has no template type` |
| Invalid pageKey | 400 | `invalid pageKey` (must be numeric) |
| Version not found (restore) | 404 | `version not found` |
