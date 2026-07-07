# Admin Service

> System hot-reload and prompt cache management.

**Route prefix:** `/orcaagents/admin`
**Handler:** `handler/web/mgmt_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/admin/config/reload` | `reloadConfig` | Force atomic hot-reload of all agents and prompts from Firestore |
| `DELETE` | `/orcaagents/admin/config/cache` | `clearCache` | Clear cached LLM templates and system instructions |

---

## Hot-Reload

Triggers an immediate atomic rebuild of all active agents from Firestore configuration. This is an all-or-nothing operation — if any agent fails to build, the entire reload is rolled back.

```ts
async function reloadConfig(): Promise<void> {
  const res = await fetch("/orcaagents/admin/config/reload", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error);
  }
}
```

## Clear Prompt Cache

Clears in-memory LLM template caches. Optionally target a specific agent.

```ts
// Clear all agent caches
async function clearAllCaches(): Promise<void> {
  const res = await fetch("/orcaagents/admin/config/cache", {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

// Clear cache for a specific agent
async function clearAgentCache(agentId: string): Promise<void> {
  const res = await fetch(`/orcaagents/admin/config/cache?agent=${agentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `500` | Hot-reload failed (agent build error) |
