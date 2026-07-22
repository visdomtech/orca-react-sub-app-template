# OrcaAgents Backend Service Skills

> Comprehensive guide for connecting to and integrating with the OrcaAgents backend service.

---

## Overview

The OrcaAgents backend exposes REST endpoints under `/orcaagents/*` for frontend and third-party integrations. All JSON APIs require JWT authentication (via cookie or `Authorization: Bearer` header) unless noted otherwise.

**Base URL pattern:** `https://{host}/orcaagents/{service}/{resource}`

**Frontend SPA:** Served separately at `/ng` (unauthenticated, CDN-proxied).

---

## Service Index

| # | Service | Route Prefix | Skill Guide | Purpose |
|---|---------|-------------|-------------|---------|
| 1 | [Authentication](authentication/SKILL.md) | `/orcaagents/auth` | `authentication/SKILL.md` | Retrieve authenticated user info |
| 2 | [Access Management](access-management/SKILL.md) | `/orcaagents/access` | `access-management/SKILL.md` | User CRUD, roles, sessions, MFA, impersonation (admin only, proxied to auth-go) |
| 3 | [Document Storage (DB)](document-storage/SKILL.md) | `/orcaagents/db` | `document-storage/SKILL.md` | Firestore-backed document CRUD with workspace and user scopes |
| 4 | [Agent Runtime (App)](agent-runtime/SKILL.md) | `/orcaagents/app` | `agent-runtime/SKILL.md` | Run agents with SSE streaming, list agents/sessions |
| 5 | [App Registry](app-registry/SKILL.md) | `/orcaagents/appregistry` | `app-registry/SKILL.md` | App descriptor CRUD, workspace enable/disable, Cloud Build deployment |
| 6 | [Approval Engine](approval-engine/SKILL.md) | `/orcaagents/approval` | `approval-engine/SKILL.md` | Multi-phase approval workflows, definitions, approver management |
| 7 | [Workflow](workflow/SKILL.md) | `/orcaagents/workflow` | `workflow/SKILL.md` | Email sending via Mailgun |
| 8 | [Background Jobs](background-jobs/SKILL.md) | `/orcaagents/jobs` | `background-jobs/SKILL.md` | River-backed job status tracking and listing |
| 9 | [Files](files/SKILL.md) | `/orcaagents/files` | `files/SKILL.md` | GCS file upload/download with signed URLs |
| 10 | [Feature Flags](feature-flags/SKILL.md) | `/orcaagents/featureflags` | `feature-flags/SKILL.md` | Workspace-level feature and module flag toggles |
| 11 | [Feature Progress](feature-progress/SKILL.md) | `/orcaagents/featureprogress` | `feature-progress/SKILL.md` | Onboarding feature adoption tracking |
| 12 | [Jurisdictions](jurisdictions/SKILL.md) | `/orcaagents/jurisdictions` | `jurisdictions/SKILL.md` | Legal jurisdiction CRUD (federal/state/city hierarchy) |
| 13 | [RAG Agent Configs](rag-agents/SKILL.md) | `/orcaagents/ragagent` | `rag-agents/SKILL.md` | Custom RAG agent configuration CRUD |
| 14 | [Vertex AI](vertex-ai/SKILL.md) | `/orcaagents/vertexai` | `vertex-ai/SKILL.md` | Vertex AI RAG corpus management and file sync |
| 15 | [Admin](admin/SKILL.md) | `/orcaagents/admin` | `admin/SKILL.md` | System hot-reload and prompt cache management |
| 16 | [Audit Log](audit-log/SKILL.md) | `/orcaagents/audit` | `audit-log/SKILL.md` | Workspace-scoped audit trail (admin-only read, tx-aware logging from Go/SQL) |
| 17 | [Regulations](regulations/SKILL.md) | `/orcaagents/regulations` | `regulations/SKILL.md` | Source-of-truth regulation records with batch upload + AI extraction pipeline |
| 18 | [Policy](policy/SKILL.md) | `/orcaagents/orca` | `policy/SKILL.md` | AI-powered policy draft generation, refinement, versioning, and PDF export |
| 19 | [Notifications](notifications/SKILL.md) | `/orcaagents/notification` | `notifications/SKILL.md` | OAuth2 channel connection and test notification sending |
| 20 | [Render Configs](render-configs/SKILL.md) | `/orcaagents/renderconfig` | `render-configs/SKILL.md` | JsonLogic-based render configurations for agent output UI |

---

## Base URL & Authentication

All endpoints (except `/ng` frontend) require a valid JWT. The JWT can be provided via:

- **Cookie**: The `s` cookie (production) or any cookie containing a valid JWT
- **Authorization header**: `Authorization: Bearer <token>`

### Development Access

In local development, requests from `localhost:8080` are automatically granted a dev JWT with system admin privileges. For dev/staging environments, inject the `X-doublefin-api-key` header with the appropriate API key.

### Fetch Wrapper (`orcaFetch`)

Use this wrapper everywhere instead of calling `fetch` directly. It transparently routes requests through the dev API when not running on a production domain.

- **Production** (`*.doublefin.com`): calls are passed through to the native `fetch` with no modifications (JWT is in the `s` cookie).
- **Development** (localhost, etc.): the request URL is prepended with the dev API base URL, and the `X-doublefin-api-key` header is injected for authentication.

```ts
const DEV_API_BASE = "https://devorcaapi.doublefin.com";
const DEV_API_KEY = "your api key connects to devorcaapi.doublefin.com";

/**
 * Whether the current page is served from a *.doublefin.com production domain.
 * When true, requests go directly to the same origin (no proxying).
 */
function isProduction(): boolean {
  return window.location.host.endsWith(".doublefin.com");
}

/**
 * Default request headers.
 * In production, no special headers are needed (JWT is in the `s` cookie).
 * In development, the `X-doublefin-api-key` header is injected automatically.
 */
function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Fetch wrapper that transparently routes requests through the dev API
 * when not running on a production domain.
 *
 * - Production (*.doublefin.com): calls are passed through to the native
 *   `fetch` with no modifications.
 * - Development (localhost, etc.): the request URL is prepended with the
 *   dev API base URL, and the `X-doublefin-api-key` header is injected
 *   for authentication.
 *
 * Use this wrapper everywhere instead of calling `fetch` directly.
 *
 * @example
 * // Works in both production and development automatically:
 * const res = await orcaFetch("/orcaagents/db/workspace/doc/read", {
 *   method: "POST",
 *   headers: headers(),
 *   credentials: "include",
 *   body: JSON.stringify({ docId: "apps/myapp" }),
 * });
 */
async function orcaFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (isProduction()) {
    // Same-origin request — pass through unchanged
    return fetch(path, init);
  }

  // Development: proxy to dev API, inject auth header, and strip credentials
  // (cross-origin cookie auth doesn't apply — the API key header handles it)
  const url = `${DEV_API_BASE}${path}`;
  const { credentials: _unused, ...rest } = init ?? {};
  const devHeaders = {
    ...(rest.headers as Record<string, string>),
    "X-doublefin-api-key": DEV_API_KEY,
  };
  return fetch(url, { ...rest, headers: devHeaders });
}
```

---

## Role-Based Access

| Role | Access Level |
|------|-------------|
| **System Admin** | Full system access, all admin endpoints |
| **Customer Admin** | Workspace-scoped admin operations (app registry, feature flags, etc.) |
| **Authenticated User** | Read operations, user-scoped writes, approval participation |

Admin-only endpoints are gated by `RequireAdmin()` middleware or inline `claims.IsAdmin()` checks.

---

## Error Handling

All endpoints return errors in a consistent JSON shape:

```json
{ "error": "human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad Request — missing or malformed request body |
| `401` | Unauthorized — JWT missing, invalid, or expired |
| `403` | Forbidden — caller lacks required permission |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate item or invalid state transition |
| `500` | Internal Error — unexpected server error |
| `502` | Bad Gateway — upstream service failure |

---

## Cross-Cutting Concerns

### Workspace Scoping

Most services scope data to the caller's workspace (`claims.WorkspaceID`). Non-admin users can only access resources within their workspace.

### CORS

All endpoints include permissive CORS headers (`Access-Control-Allow-Origin: *`). Preflight `OPTIONS` requests are answered with `200`.

### Content Type

All request and response bodies use `application/json` unless otherwise specified (e.g., file download logs use `text/plain`).

---

## How to Use These Skills

Each skill document provides:
1. **Service overview** — what the service does and when to use it
2. **Endpoint reference** — complete list of endpoints with methods, paths, and descriptions
3. **Request/response examples** — TypeScript code snippets showing how to call each endpoint
4. **TypeScript types** — interface definitions for request/response payloads
5. **Error scenarios** — service-specific error conditions and their HTTP status codes

Start with the service index table above, then drill into the specific skill guide for the service you need to integrate with.
