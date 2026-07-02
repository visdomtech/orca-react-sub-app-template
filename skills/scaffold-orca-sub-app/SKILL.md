---
name: scaffold-orca-sub-app
description: Generate the feature-specific source files for a new Orca sub-app on top of the cloned template. Overwrites the placeholder feature with code tailored to the user's app description. Called by create-orca-sub-app after cloning.
---

# Scaffold Orca Sub-App

The template has already been cloned. The boilerplate files (config, api/, main.tsx, index.css) are correct as-is. This skill generates only the files that must be tailored to the user's specific app.

Inputs already computed by `create-orca-sub-app`:

| Variable | Example |
|---|---|
| `APP_NAME` | `invoice-viewer` |
| `COMPONENT_NAME` | `InvoiceViewer` |
| `DISPLAY_NAME` | `Invoice Viewer` |
| `FEATURE_NAME` | `invoiceViewer` |
| App description | "Show a list of invoices and let the user mark them as paid." |

---

## Files to generate

Write or overwrite these five files. Adapt every placeholder and all business logic to fit the user's description — do not use generic filler content.

---

### `src/OrcaApp.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { {{COMPONENT_NAME}}Page } from "./features/{{FEATURE_NAME}}/pages/{{COMPONENT_NAME}}Page";
import "./index.css";

const queryClient = new QueryClient();

export function OrcaApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <{{COMPONENT_NAME}}Page />
    </QueryClientProvider>
  );
}

export default OrcaApp;
```

---

### `src/features/{{FEATURE_NAME}}/types.ts`

Define interfaces that reflect the app's actual domain. Use field names that match the description (e.g. `invoice`, `employee`, `task`) — never generic names like `Item`.

```typescript
export interface {{COMPONENT_NAME}}Item {
  id: string;
  // add fields that make sense for this app
}
```

---

### `src/features/{{FEATURE_NAME}}/api.ts`

All data storage and retrieval goes through the **OrcaAgents DB API** — never call `secured()` or invent custom endpoints. When running standalone (`bun run dev`), return in-memory mock data so the app is previewable without the backend.

```typescript
import { httpClient } from "../../api/httpClient";
import { orcaagents } from "../../api/secured";
import type { {{COMPONENT_NAME}}Item } from "./types";

const IS_STANDALONE = import.meta.env.DEV;

// Realistic mock data for standalone dev — tailor to the app's domain.
// Use real-looking values (e.g. actual names, dates, amounts) — never "Item 1".
const MOCK_ITEMS: {{COMPONENT_NAME}}Item[] = [
  // add 2–3 representative records here
];

// Namespace for all documents owned by this app.
const DOC_BASE = "apps/{{APP_NAME}}";

// The sub-collection name under DOC_BASE that holds the list of items.
// Choose a name that matches the domain (e.g. "incidents", "tasks", "requests").
const COLLECTION = "items";

// Pure async functions — no React, no hooks, no side effects.

export async function getItems(): Promise<{{COMPONENT_NAME}}Item[]> {
  if (IS_STANDALONE) return MOCK_ITEMS;
  const res = await httpClient.post<Record<string, {{COMPONENT_NAME}}Item>>(
    orcaagents("/db/workspace/doc/subcollection/docs"),
    { docId: DOC_BASE, subCollectionId: COLLECTION }
  );
  return Object.values(res);
}

export async function createItem(
  data: Omit<{{COMPONENT_NAME}}Item, "id">
): Promise<void> {
  if (IS_STANDALONE) {
    MOCK_ITEMS.push({ id: crypto.randomUUID(), ...data } as {{COMPONENT_NAME}}Item);
    return;
  }
  const id = crypto.randomUUID();
  await httpClient.post(orcaagents("/db/workspace/doc/write"), {
    docId: `${DOC_BASE}/${COLLECTION}/${id}`,
    data: { id, ...data },
  });
}

export async function updateItem(
  id: string,
  data: Partial<Omit<{{COMPONENT_NAME}}Item, "id">>
): Promise<void> {
  if (IS_STANDALONE) {
    const idx = MOCK_ITEMS.findIndex((i) => i.id === id);
    if (idx !== -1) MOCK_ITEMS[idx] = { ...MOCK_ITEMS[idx], ...data };
    return;
  }
  const current = await httpClient.post<{{COMPONENT_NAME}}Item>(
    orcaagents("/db/workspace/doc/read"),
    { docId: `${DOC_BASE}/${COLLECTION}/${id}` }
  );
  await httpClient.post(orcaagents("/db/workspace/doc/write"), {
    docId: `${DOC_BASE}/${COLLECTION}/${id}`,
    data: { ...current, ...data },
  });
}

// Call this when you need the current user's identity (e.g. for "createdBy" fields).
export async function getCurrentUser(): Promise<{ email: string; subject: string }> {
  return httpClient.get(orcaagents("/auth/userinfo"));
}
```

Adapt the functions above to the app's domain — rename `getItems`/`createItem`/`updateItem` to match the entity (e.g. `getIncidents`/`createIncident`). Add or remove functions as the description requires. Always pass the current user's email to any "created by" or "reported by" field by calling `getCurrentUser()` — never leave it empty.

---

### `src/features/{{FEATURE_NAME}}/queryKeys.ts`

```typescript
export const {{FEATURE_NAME}}QueryKeys = {
  root: ["{{FEATURE_NAME}}"] as const,
  items: () => [...{{FEATURE_NAME}}QueryKeys.root, "items"] as const,
};
```

---

### `src/features/{{FEATURE_NAME}}/hooks.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { {{FEATURE_NAME}}QueryKeys } from "./queryKeys";
// import api functions and types

// useQuery wrapper for fetching
// useMutation wrapper for writes (if applicable)
```

---

### `src/features/{{FEATURE_NAME}}/pages/{{COMPONENT_NAME}}Page.tsx`

Build the actual UI for this app. Use TailwindCSS v4 utility classes.

Style reference:
```tsx
// Page container
<div className="p-8">

// Section heading
<h1 className="text-2xl font-bold text-slate-800 mb-6">

// Card
<div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-colors">

// Primary button
<button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">

// Secondary button
<button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors">
```

Loading and error states are required:

```tsx
if (isLoading) return <div className="flex items-center justify-center min-h-64"><div className="text-slate-400 text-sm">Loading...</div></div>;
if (error) return <div className="p-8"><p className="text-red-600 text-sm">Failed to load data.</p></div>;
```

---

## After writing files

Run `bun run typecheck` from the app folder. Fix every TypeScript error before returning to `create-orca-sub-app`.
