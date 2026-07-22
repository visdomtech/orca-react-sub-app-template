# Jurisdictions Service

> Legal jurisdiction CRUD with federal/state/city hierarchy.

**Route prefix:** `/orcaagents/jurisdictions`
**Handler:** `handler/web/jurisdiction_handler.go`
**Service:** `service/jurisdiction/`
**Auth required:** Yes (reads: any user; writes: admin)

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/jurisdictions` | `listJurisdictions` | List all jurisdictions (or filter) |
| `GET` | `/orcaagents/jurisdictions/{id}` | `getJurisdiction` | Get jurisdiction by ID |
| `GET` | `/orcaagents/jurisdictions/by-code/{code}` | `getJurisdictionByCode` | Get by code (case-insensitive) |
| `POST` | `/orcaagents/jurisdictions` | `upsertJurisdiction` | Create or update (admin) |
| `DELETE` | `/orcaagents/jurisdictions/{id}` | `deleteJurisdiction` | Delete (admin) |

---

## Filtering (List)

Query params on `GET /orcaagents/jurisdictions` (precedence: `q` > `type` > `parent`):

| Param | Description |
|-------|-------------|
| `q` | Full-text search on name/full_name |
| `type` | Filter by type: `FEDERAL`, `STATE`, or `CITY` |
| `parent` | Filter children of parent jurisdiction ID |

## Jurisdiction Types

```
FEDERAL → STATE → CITY
```

## TypeScript

```ts
interface Jurisdiction {
  id: number;
  code: string;             // e.g., "US-CA"
  name: string;
  fullName: string;
  type: "FEDERAL" | "STATE" | "CITY";
  parentId?: number;
}

interface UpsertJurisdictionRequest {
  code: string;
  name: string;
  fullName?: string;
  jurisdictionType: "FEDERAL" | "STATE" | "CITY";
  parentId?: number;
}

async function listJurisdictions(type?: string): Promise<Jurisdiction[]> {
  const qs = type ? `?type=${type}` : "";
  const res = await orcaFetch(`/orcaagents/jurisdictions${qs}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function searchJurisdictions(query: string): Promise<Jurisdiction[]> {
  const res = await orcaFetch(`/orcaagents/jurisdictions?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function getByCode(code: string): Promise<Jurisdiction> {
  const res = await orcaFetch(`/orcaagents/jurisdictions/by-code/${code}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Invalid type (not FEDERAL/STATE/CITY), invalid parent ID |
| `401` | Not authenticated |
| `403` | Not admin (write operations) |
| `404` | Jurisdiction not found |
