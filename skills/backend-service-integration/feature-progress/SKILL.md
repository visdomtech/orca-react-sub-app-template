# Feature Progress Service

> Onboarding feature adoption tracking per workspace.

**Route prefix:** `/orcaagents/featureprogress`
**Handler:** `handler/web/featureprogress_handler.go`
**Service:** `service/featureprogress/`
**Auth required:** Yes (status reads: any user; CRUD: admin)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Feature Catalog (master list)

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/featureprogress/features` | `listFeatures` | List all registered onboarding features |
| `GET` | `/orcaagents/featureprogress/features/{id}` | `getFeature` | Get a feature by ID |
| `POST` | `/orcaagents/featureprogress/features` | `createFeature` | Create feature (admin) |
| `PUT` | `/orcaagents/featureprogress/features/{id}` | `updateFeature` | Update feature (admin) |
| `DELETE` | `/orcaagents/featureprogress/features/{id}` | `deleteFeature` | Delete feature if not in use (admin) |

### Workspace Progress

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/featureprogress/features/{feature}/status` | `getFeatureStatus` | Get progress for a feature in the workspace |
| `POST` | `/orcaagents/featureprogress/features/{feature}/actions/updatestatus` | `updateFeatureStatus` | Update progress (admin) |

---

## Status Values

```
STARTED → IN_PROGRESS → COMPLETED
```

## TypeScript

```ts
interface Feature {
  id: number;
  name: string;
  description: string;
}

interface FeatureProgress {
  feature: string;
  status: string; // STARTED | IN_PROGRESS | COMPLETED
}

async function getFeatureStatus(featureName: string): Promise<FeatureProgress> {
  const res = await fetch(
    `/orcaagents/featureprogress/features/${featureName}/status`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function updateFeatureStatus(
  featureName: string,
  status: string
): Promise<FeatureProgress> {
  const res = await fetch(
    `/orcaagents/featureprogress/features/${featureName}/actions/updatestatus`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid status value, missing name |
| `401` | Not authenticated |
| `403` | Not admin (write operations) |
| `404` | Feature not found |
| `409` | Duplicate feature name, or feature in use (delete) |
