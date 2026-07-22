# Policy Service

> AI-powered policy draft generation, refinement, versioning, and PDF export.

**Route prefix:** `/orcaagents/orca`
**Handler:** `handler/web/policy_handler.go`
**Auth required:** Yes (JWT)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/orca/policy-templates` | `listPolicyTemplates` | List active policy templates |
| `GET` | `/orcaagents/orca/policy-drafts` | `listPolicyDrafts` | List policy drafts (cursor-paginated, 25/page) |
| `POST` | `/orcaagents/orca/policy-drafts/init` | `initPolicyDraft` | Create a new draft from a template |
| `GET` | `/orcaagents/orca/policy-drafts/{id}` | `getPolicyDraft` | Get a single draft by ID |
| `DELETE` | `/orcaagents/orca/policy-drafts/{id}` | `deletePolicyDraft` | Soft-delete a draft |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/generate` | `generatePolicyDraft` | Start AI generation (returns 202, runs async) |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/refine` | `refinePolicyDraft` | Start AI refinement of existing content (returns 202) |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/actions/finalize` | `finalizePolicyDraft` | Mark draft as FINALIZED |
| `GET` | `/orcaagents/orca/policy-drafts/{id}/versions` | `listPolicyDraftVersions` | List version history (newest first) |
| `POST` | `/orcaagents/orca/policy-drafts/{id}/versions/{version}/actions/restore` | `restorePolicyDraftVersion` | Restore draft to a previous version |
| `GET` | `/orcaagents/orca/policy-drafts/{id}/export/pdf` | `exportPolicyDraftPDF` | Export draft as a PDF download |

---

## Architecture

The policy service manages the lifecycle of workplace policy documents:

1. **Template catalog** — `orca.policy_templates` stores pre-defined templates (e.g. HR handbook, code of conduct) with a system prompt per template.
2. **Draft lifecycle** — a draft moves through statuses: `INITIALIZED` → `GENERATING` / `REFINING` → `DRAFT` → `FINALIZED`. Soft-deleted drafts set `deleted_at`.
3. **AI generation** — `generate` and `refine` return `202 Accepted` immediately; Gemini runs in a background goroutine (5-min timeout). On success a new version is saved and the draft status becomes `DRAFT`. On failure the status reverts to `DRAFT`.
4. **Version history** — every content change (generate, refine, restore) creates an immutable `orca.policy_draft_versions` row with an incrementing `version_number`.
5. **PDF export** — the finalize step locks the draft; `export/pdf` streams a generated PDF (via `go-pdf/fpdf`).

All drafts are scoped to `workspace_id`. The `friendly_id` follows the format `POL-00001`.

### Draft Statuses

| Status | Meaning |
|--------|---------|
| `INITIALIZED` | Just created from template, no content yet |
| `GENERATING` | AI generation in progress |
| `REFINING` | AI refinement in progress |
| `DRAFT` | Content ready for review (can be refined again or finalized) |
| `FINALIZED` | Locked, no more edits |

---

## Types

```ts
interface PolicyTemplate {
  templateId: number;
  templateType: string;     // e.g. "HR_HANDBOOK"
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

interface PolicyDraft {
  draftId: number;
  friendlyId: string;        // "POL-00001"
  title: string;
  contentMd: string;         // Markdown content
  status: string;            // INITIALIZED | GENERATING | REFINING | DRAFT | FINALIZED
  templateType?: string;
  generationMessage?: string;
  generationConfig: Record<string, unknown>;
  progressTrackerId?: string;
  currentVersion: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;         // ISO 8601
  updatedAt: string;
  finalizedAt?: string;
}

interface PolicyDraftVersion {
  versionId: number;
  draftId: number;
  versionNumber: number;
  title: string;
  contentMd: string;
  editSummary: string;
  generationConfig: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

interface GenerationConfig {
  cultureStyle?: string;          // e.g. "professional", "casual"
  communicationStyle?: string;    // e.g. "formal", "friendly"
  coreValues?: string[];
  policyTones?: string[];
  instruction?: string;           // free-form additional instruction
}

interface InitDraftRequest {
  templateType: string;
}
```

All responses are wrapped in:

```ts
interface PolicyResponse<T> {
  success: boolean;  // always true on success
  data: T;
}
```

---

## List Policy Templates

```ts
async function listPolicyTemplates(): Promise<PolicyTemplate[]> {
  const res = await orcaFetch("/orcaagents/orca/policy-templates", {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const body = await res.json();
  return body.data;
}
```

---

## List Policy Drafts

Cursor-based pagination (25 per page). Use the `draftId` of the last item as the next `pageKey`.

| Query Param | Type | Description |
|-------------|------|-------------|
| `status` | string | Optional filter: `INITIALIZED`, `DRAFT`, `FINALIZED`, etc. |
| `pageKey` | string | Cursor (last item's `draftId`) for next page |

```ts
async function listPolicyDrafts(params?: {
  status?: string;
  pageKey?: string;
}): Promise<PolicyDraft[]> {
  const p = new URLSearchParams();
  if (params?.status) p.set("status", params.status);
  if (params?.pageKey) p.set("pageKey", params.pageKey);
  const qs = p.toString() ? `?${p}` : "";
  const res = await orcaFetch(`/orcaagents/orca/policy-drafts${qs}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const body = await res.json();
  return body.data;
}
```

---

## Initialise Policy Draft

```ts
async function initPolicyDraft(
  templateType: string
): Promise<PolicyDraft> {
  const res = await orcaFetch("/orcaagents/orca/policy-drafts/init", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ templateType }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const body = await res.json();
  return body.data;
}
```

---

## Get Policy Draft

```ts
async function getPolicyDraft(draftId: number): Promise<PolicyDraft> {
  const res = await orcaFetch(`/orcaagents/orca/policy-drafts/${draftId}`, {
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  const body = await res.json();
  return body.data;
}
```

---

## Delete Policy Draft (soft-delete)

```ts
async function deletePolicyDraft(draftId: number): Promise<void> {
  const res = await orcaFetch(`/orcaagents/orca/policy-drafts/${draftId}`, {
    method: "DELETE",
    headers: headers(),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Generate Draft (AI)

Returns `202 Accepted`. Generation runs asynchronously (up to 5 minutes). Poll `GET /policy-drafts/{id}` to check when `status` becomes `DRAFT` (success) or remains `DRAFT` after a failed generation.

```ts
async function generatePolicyDraft(
  draftId: number,
  config: GenerationConfig
): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/actions/generate`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(config),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Refine Draft (AI)

Returns `202 Accepted`. Uses the current draft content plus the `GenerationConfig` to produce a refined version. A new version row is created on success.

```ts
async function refinePolicyDraft(
  draftId: number,
  config: GenerationConfig
): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/actions/refine`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(config),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Finalize Draft

Locks the draft. Only drafts in `DRAFT` status can be finalized.

```ts
async function finalizePolicyDraft(draftId: number): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/actions/finalize`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## List Draft Versions

Returns all versions, newest first. Each version is an immutable snapshot of content + config.

```ts
async function listPolicyDraftVersions(
  draftId: number
): Promise<PolicyDraftVersion[]> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/versions`,
    { headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  const body = await res.json();
  return body.data;
}
```

---

## Restore Draft Version

Restores the draft to the content of a previous version. Creates a new version row as a snapshot of the restored state.

```ts
async function restorePolicyDraftVersion(
  draftId: number,
  versionNumber: number
): Promise<void> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/versions/${versionNumber}/actions/restore`,
    {
      method: "POST",
      headers: headers(),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Export Draft as PDF

Streams a PDF file. The response `Content-Type` is `application/pdf` and `Content-Disposition` is `attachment; filename="<friendlyId>.pdf"`.

```ts
async function exportPolicyDraftPDF(draftId: number): Promise<Blob> {
  const res = await orcaFetch(
    `/orcaagents/orca/policy-drafts/${draftId}/export/pdf`,
    { headers: headers(), credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.blob();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid draft ID, invalid JSON body, template not found or inactive, draft has no template type (generate) |
| `401` | Not authenticated |
| `404` | Draft not found (not in caller's workspace or soft-deleted), version not found |
| `409` | Generation or refinement already in progress (`GENERATING` / `REFINING` status) |
| `500` | Database error, AI generation failure (logged server-side) |
