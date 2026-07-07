# Feature Flags Service

> Workspace-level feature and module flag toggles.

**Route prefix:** `/orcaagents/featureflags` and `/orcaagents/moduleflags`
**Handler:** `handler/web/featureflags_handler.go`
**Service:** `service/featureflags/`
**Auth required:** Yes (reads: any user; writes: admin)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Feature Flags

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/featureflags` | `listFeatureFlags` | List feature flags for the workspace |
| `POST` | `/orcaagents/featureflags` | `addFeatureFlag` | Add a feature flag (admin) |
| `DELETE` | `/orcaagents/featureflags/{name}` | `removeFeatureFlag` | Remove a feature flag (admin) |

### Module Flags

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/moduleflags` | `listModuleFlags` | List module flags for the workspace |
| `POST` | `/orcaagents/moduleflags` | `addModuleFlag` | Add a module flag (admin) |
| `DELETE` | `/orcaagents/moduleflags/{name}` | `removeModuleFlag` | Remove a module flag (admin) |

---

## Feature Flags vs Module Flags

- **Feature flags** toggle specific features on/off with additional metadata (`FeatureFlagInfo`)
- **Module flags** are simple string names indicating enabled modules

## TypeScript

```ts
interface FeatureFlagInfo {
  name: string;
  enabled: boolean;
  [key: string]: unknown;
}

async function listFeatureFlags(): Promise<FeatureFlagInfo[]> {
  const res = await fetch("/orcaagents/featureflags", { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function addFeatureFlag(name: string): Promise<void> {
  const res = await fetch("/orcaagents/featureflags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

async function listModuleFlags(): Promise<string[]> {
  const res = await fetch("/orcaagents/moduleflags", { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `name` |
| `401` | Not authenticated |
| `403` | Not admin (write operations) |
| `404` | Flag not found (delete) |
| `409` | Duplicate flag |
