---
name: admin-service-integration
description: "Integrate with the Orca Admin Backend API (`/orcaagents/admin`). Operations: reloadConfig, clearCache, getLogLevel, setLogLevel."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Admin Service Integration Guide

The **Admin Service** manages core system lifecycle, atomic configuration hot-reloading from Firestore, LLM prompt cache invalidation, and dynamic log-level adjustment at runtime.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/admin`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/admin`
- **Auth & RBAC**:
  - `GET /loglevel`: Requires JWT authentication (any authenticated user); no `SYSTEM_ADMIN` role required
  - `POST /config/reload`, `DELETE /config/cache`, `PUT /loglevel`: Strictly requires **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Hot-reloading system prompt templates and agent configurations without restarting the server process
  - Invalidate model prompt cache (all or per-agent)
  - Query and dynamically mutate structured logging level (`DEBUG`, `INFO`, `WARN`, `ERROR`)

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `POST` | `/orcaagents/admin/config/reload` | `reloadConfig` | `void` | `OkResponse` | Forces an immediate atomic hot-reload of all agents and prompts from Firestore |
| `DELETE` | `/orcaagents/admin/config/cache` | `clearCache` | `ClearCacheQuery` | `OkResponse` | Clears cached LLM templates or custom system instructions from local memory |
| `GET` | `/orcaagents/admin/loglevel` | `getLogLevel` | `void` | `LogLevelResponse` | Returns the current slog log level (`DEBUG`, `INFO`, `WARN`, `ERROR`) |
| `PUT` | `/orcaagents/admin/loglevel` | `setLogLevel` | `SetLogLevelRequest` | `OkResponse` | Changes the slog log level at runtime |

---

## 3. TypeScript Interfaces & Enums

```typescript
export type SlogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface OkResponse {
  status: 'ok';
}

export interface LogLevelResponse {
  level: SlogLevel | string;
}

export interface SetLogLevelRequest {
  level: SlogLevel;
}

export interface ClearCacheQuery {
  agent?: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const adminClient = {
  /**
   * Reload all agents, prompts, and config from Firestore atomically.
   * Requires SYSTEM_ADMIN role.
   */
  async reloadConfig(): Promise<OkResponse> {
    return orcaFetch<OkResponse>('/orcaagents/admin/config/reload', {
      method: 'POST',
    });
  },

  /**
   * Clear prompt cache across all agents or for a specific agent.
   * Requires SYSTEM_ADMIN role.
   */
  async clearCache(agentId?: string): Promise<OkResponse> {
    const query = agentId ? `?agent=${encodeURIComponent(agentId)}` : '';
    return orcaFetch<OkResponse>(`/orcaagents/admin/config/cache${query}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get the current server log level.
   */
  async getLogLevel(): Promise<LogLevelResponse> {
    return orcaFetch<LogLevelResponse>('/orcaagents/admin/loglevel', {
      method: 'GET',
    });
  },

  /**
   * Dynamically update the server log level at runtime.
   * Requires SYSTEM_ADMIN role.
   */
  async setLogLevel(level: SlogLevel): Promise<OkResponse> {
    return orcaFetch<OkResponse>('/orcaagents/admin/loglevel', {
      method: 'PUT',
      body: JSON.stringify({ level }),
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Updating Prompt Config and Reloading
```typescript
import { adminClient } from './adminClient';

async function applyPromptUpdate(agentName: string) {
  console.log(`Invalidating cache for agent: ${agentName}...`);
  await adminClient.clearCache(agentName);

  console.log('Reloading agent configurations atomically...');
  const reloadRes = await adminClient.reloadConfig();
  console.log('Registry reloaded:', reloadRes.status);
}
```

### Flow: Temporarily Enabling Debug Logging
```typescript
import { adminClient } from './adminClient';

async function enableTemporaryDebugLogs(durationMs: number = 60000) {
  const previous = await adminClient.getLogLevel();
  console.log(`Current log level: ${previous.level}`);

  await adminClient.setLogLevel('DEBUG');
  console.log('Log level set to DEBUG for troubleshooting');

  setTimeout(async () => {
    await adminClient.setLogLevel(previous.level as any);
    console.log(`Restored log level back to ${previous.level}`);
  }, durationMs);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **403 Forbidden on Reload/Cache/LogLevel**: Mutating routes require the `SYSTEM_ADMIN` role claim in the JWT. Standard users or `WORKSPACE_ADMIN`s will receive a 403 Forbidden.
2. **Atomic Hot-Reload**: `/config/reload` is transactional. If one agent configuration fails Yaegi compilation or schema parsing, the entire reload rolls back and the old registry remains active.
3. **Query Parameter Encoding**: When clearing cache for a specific agent (`DELETE /config/cache?agent=foo`), ensure agent identifiers with special characters are URI-encoded.
