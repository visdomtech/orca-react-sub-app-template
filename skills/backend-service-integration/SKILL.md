# OrcaAgents Backend Service Skills

> Comprehensive developer guide and TypeScript integration reference for the OrcaAgents backend platform.

---

## 1. Overview

The OrcaAgents backend exposes typed REST APIs and SSE streams under `/orcaagents/*` for frontend single-page applications and client services. All JSON APIs require JWT authentication (via cookie or `Authorization: Bearer` header) unless explicitly documented otherwise.

**Base URL Pattern:** `https://{host}/orcaagents/{service}/{resource}`

**Frontend SPA:** Served at `/ng` (CDN-proxied single-page application).

---

## 2. Service Index

All backend services are organized 1:1 by their sublauncher keyword:

| # | Service Keyword | Route Prefix | Skill Guide | Description |
|---|-----------------|--------------|-------------|-------------|
| 1 | `access` | `/orcaagents/access` | [`access/SKILL.md`](access/SKILL.md) | User management, roles, sessions, MFA, and auth-go administration |
| 2 | `admin` | `/orcaagents/admin` | [`admin/SKILL.md`](admin/SKILL.md) | System hot-reload, prompt cache management, and slog log level control |
| 3 | `app` | `/orcaagents/app` | [`app/SKILL.md`](app/SKILL.md) | Real-time agent runtime execution with SSE streaming and session listings |
| 4 | `appregistry` | `/orcaagents/appregistry` | [`appregistry/SKILL.md`](appregistry/SKILL.md) | Workspace app descriptor catalog, app lifecycle, and Cloud Build deployments |
| 5 | `approval` | `/orcaagents/approval` | [`approval/SKILL.md`](approval/SKILL.md) | Multi-phase polymorphic approval workflows, approver management, and audit trails |
| 6 | `audit` | `/orcaagents/audit` | [`audit/SKILL.md`](audit/SKILL.md) | Workspace-scoped compliance audit log querying and export |
| 7 | `auth` | `/orcaagents/auth` | [`auth/SKILL.md`](auth/SKILL.md) | Current authenticated user claims and workspace resolution |
| 8 | `bamboohr` | `/orcaagents/bamboohr` | [`bamboohr/SKILL.md`](bamboohr/SKILL.md) | BambooHR HRIS integration — connection management and employee directory |
| 9 | `db` | `/orcaagents/db` | [`db/SKILL.md`](db/SKILL.md) | Scoped Firestore document storage with workspace and user isolation |
| 10 | `deel` | `/orcaagents/deel` | [`deel/SKILL.md`](deel/SKILL.md) | Deel HRIS integration — connection management and employee retrieval |
| 11 | `featureflags` | `/orcaagents/featureflags` | [`featureflags/SKILL.md`](featureflags/SKILL.md) | Workspace-level feature flags, toggles, and rollout controls |
| 12 | `featureprogress` | `/orcaagents/featureprogress` | [`featureprogress/SKILL.md`](featureprogress/SKILL.md) | Onboarding checklist tracking and feature adoption progress |
| 13 | `files` | `/orcaagents/files` | [`files/SKILL.md`](files/SKILL.md) | File metadata persistence and Google Cloud Storage signed URL generation |
| 14 | `frontend` | `/ng` | [`frontend/SKILL.md`](frontend/SKILL.md) | CDN-hosted React SPA serving, version management, and CSP nonce injection |
| 15 | `governance` | `/orcaagents/orca/governance` | [`governance/SKILL.md`](governance/SKILL.md) | AI governance rules, risk assessments, and compliance constraints |
| 16 | `gusto` | `/orcaagents/gusto` | [`gusto/SKILL.md`](gusto/SKILL.md) | Gusto HRIS integration — OAuth2 connection flow and employee retrieval |
| 17 | `headcount` | `/orcaagents/headcount` | [`headcount/SKILL.md`](headcount/SKILL.md) | Headcount data engine, 3-phase CSV import, org tree, and requisitions |
| 18 | `health` | `/orcaagents/healthz` | [`health/SKILL.md`](health/SKILL.md) | Unauthenticated liveness and readiness probe endpoint |
| 19 | `hibob` | `/orcaagents/hibob` | [`hibob/SKILL.md`](hibob/SKILL.md) | HiBob HRIS integration — connection management and employee retrieval |
| 20 | `jobs` | `/orcaagents/jobs` | [`jobs/SKILL.md`](jobs/SKILL.md) | River background job queue status tracking and inspection |
| 21 | `jurisdiction` | `/orcaagents/jurisdictions` | [`jurisdiction/SKILL.md`](jurisdiction/SKILL.md) | US employment-law jurisdiction tree (Federal, State, City) |
| 22 | `mcp` | `/orcaagents/mcp` | [`mcp/SKILL.md`](mcp/SKILL.md) | MCP streamable HTTP endpoint with `regulation_qa` tool for AI agent clients |
| 23 | `notification` | `/orcaagents/notification` | [`notification/SKILL.md`](notification/SKILL.md) | Slack OAuth2 integration and transactional notifications |
| 24 | `objects` | `/orcaagents/objects` | [`objects/SKILL.md`](objects/SKILL.md) | Generic dynamic object datamodel, variants, schema rules, and layout editor |
| 25 | `personio` | `/orcaagents/personio` | [`personio/SKILL.md`](personio/SKILL.md) | Personio HRIS integration — connection management and employee retrieval |
| 26 | `policy` | `/orcaagents/orca` | [`policy/SKILL.md`](policy/SKILL.md) | Multi-turn AI policy generation, drafting, versioning, and PDF export |
| 27 | `proxy` | `/orcaagents/proxy` | [`proxy/SKILL.md`](proxy/SKILL.md) | External HTTP forwarding proxy and RSS feed aggregation |
| 28 | `ragagent` | `/orcaagents/ragagent` | [`ragagent/SKILL.md`](ragagent/SKILL.md) | Dynamic RAG agent configurations with metadata filters |
| 29 | `regulation` | `/orcaagents/regulations` | [`regulation/SKILL.md`](regulation/SKILL.md) | Canonical labor regulations repository with AI batch multimodal ingestion |
| 30 | `renderconfig` | `/orcaagents/renderconfig` | [`renderconfig/SKILL.md`](renderconfig/SKILL.md) | JsonLogic render configurations for dynamic agent event presentation |
| 31 | `rippling` | `/orcaagents/rippling` | [`rippling/SKILL.md`](rippling/SKILL.md) | Rippling HRIS integration — connection management and employee retrieval |
| 32 | `structuredlaw` | `/orcaagents/structuredlaw` | [`structuredlaw/SKILL.md`](structuredlaw/SKILL.md) | Structured statutory legal rules, exposure nodes, and citations |
| 33 | `vertexai` | `/orcaagents/vertexai` | [`vertexai/SKILL.md`](vertexai/SKILL.md) | Google Vertex AI RAG corpus metadata mirror and sync pipeline |
| 34 | `workday` | `/orcaagents/workday` | [`workday/SKILL.md`](workday/SKILL.md) | Workday HRIS integration — connection management and worker retrieval |
| 35 | `workflow` | `/orcaagents/workflow` | [`workflow/SKILL.md`](workflow/SKILL.md) | Transactional email delivery via Mailgun |

### Cross-Cutting Guides

These guides span multiple services and explain shared concepts rather than a single sublauncher:

| Guide | Description |
|-------|-------------|
| [`datamodel/SKILL.md`](datamodel/SKILL.md) | Datamodel concepts (scopes, objects, attributes), the shared global `employee` object, ReBAC visibility model, and employee list/filter usage — read before integrating with `objects` or `headcount` |

---

## 3. Base URL & Authentication

All API endpoints (except public assets and `/ng`) require a valid JWT token. The token can be passed via:

- **Cookie**: The HTTP-only `s` session cookie (default in browser production).
- **Authorization Header**: `Authorization: Bearer <jwt-token>` (for CLI / third-party clients).

### 3.1 Fetch Wrapper (`orcaFetch`)

Use this typed wrapper across all client implementations. It handles local development proxying, API key injection, and production same-origin requests transparently.

```ts
const DEV_API_BASE = "https://<your-dev-api-host>";
const DEV_API_KEY = "<your-dev-api-key>";

/**
 * Checks whether the application is running in a production environment.
 */
export function isProduction(): boolean {
  return typeof window !== "undefined" && window.location.host.endsWith(".doublefin.com");
}

/**
 * Standard JSON headers.
 */
export function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Unified fetch client for OrcaAgents APIs.
 */
export async function orcaFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (isProduction()) {
    return fetch(path, init);
  }

  // Development environment proxying:
  const url = `${DEV_API_BASE}${path}`;
  const { credentials: _unused, ...rest } = init ?? {};
  const devHeaders: Record<string, string> = {
    ...(rest.headers as Record<string, string>),
    "X-doublefin-api-key": DEV_API_KEY,
  };

  return fetch(url, { ...rest, headers: devHeaders });
}
```

---

## 4. Real-Time SSE Stream Consumption (`orcaEventStream`)

For long-lived streaming endpoints (e.g. `POST /orcaagents/app/run`), consume Server-Sent Events using this async generator:

```ts
export interface SSEEvent {
  event: string;
  data: string;
}

/**
 * Consumes an SSE stream as an asynchronous iterable of events.
 */
export async function* orcaEventStream(
  path: string,
  body: unknown,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent, void, unknown> {
  const res = await orcaFetch(path, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          yield { event: currentEvent, data };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

---

## 5. Role-Based Access Control (RBAC)

| Role | Scope | Permitted Capabilities |
|------|-------|------------------------|
| **System Admin** | Global / Platform-wide | LLM hot-reload, log level adjustment, global feature flags, full cross-tenant read/write |
| **Customer Admin** | Workspace | App registry config, workspace feature toggles, user/role assignment, CSV mapping & ingestion |
| **Authenticated User** | Workspace / User | Chat execution, document storage, reading assigned records, participating in approval workflows |

---

## 6. Error Handling Standard

All backend endpoints format errors as:

```json
{
  "error": "human-readable description of the error"
}
```

Standard error consumption pattern:

```ts
if (!res.ok) {
  const errorData = await res.json().catch(() => ({ error: "Unknown error occurred" }));
  throw new Error(errorData.error || `Request failed with status ${res.status}`);
}
```
