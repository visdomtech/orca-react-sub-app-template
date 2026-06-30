---
name: scaffold-orca-sub-app
description: Write all project files for a new Orca sub-app. Expects APP_NAME, COMPONENT_NAME, DISPLAY_NAME, FEATURE_NAME, and ROUTE to already be computed. Called by create-orca-sub-app after the save location is chosen.
---

# Scaffold Orca Sub-App

Writes every file in the new sub-app project. Replace every `{{placeholder}}` with the computed value before writing.

---

## Directory structure

```
{{APP_NAME}}/
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   ├── secured.ts
│   │   └── types.ts
│   ├── features/
│   │   └── {{FEATURE_NAME}}/
│   │       ├── api.ts
│   │       ├── data.ts
│   │       ├── types.ts
│   │       ├── queryKeys.ts
│   │       ├── hooks.ts
│   │       └── pages/
│   │           └── {{COMPONENT_NAME}}Page.tsx
│   ├── index.css
│   ├── OrcaApp.tsx
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Files

### `package.json`

```json
{
  "name": "{{APP_NAME}}",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.62.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@originjs/vite-plugin-federation": "^1.4.1",
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  }
}
```

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "moduleDetection": "force"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### `vite.config.ts`

```typescript
import { resolve } from "path";
import federation from "@originjs/vite-plugin-federation";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "{{APP_NAME}}",
      filename: "app.js",
      exposes: {
        "./OrcaApp": "./src/OrcaApp.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19", eager: true },
        "react-dom": { singleton: true, requiredVersion: "^19", eager: true },
      },
    }),
  ],
  build: {
    target: "esnext",
    outDir: resolve(__dirname, "dist"),
    assetsDir: "",
    sourcemap: true,
  },
  server: {
    port: 4173,
  },
});
```

> `name` must be globally unique across all sub-apps — it is the Module Federation identifier used at runtime.
> Never add other packages to `shared`. Bundle everything except `react` and `react-dom`.

---

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{DISPLAY_NAME}} — Dev Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### `src/index.css`

```css
@import "tailwindcss";
```

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

### `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import OrcaApp from "./OrcaApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OrcaApp />
  </StrictMode>
);
```

---

### `src/api/httpClient.ts`

```typescript
const DEFAULT_TIMEOUT = 30_000;

export class HttpError extends Error {
  response?: { code?: string; message?: string };

  constructor(message: string, response?: { code?: string; message?: string }) {
    super(message);
    this.name = "HttpError";
    this.response = response;
  }
}

async function rawRequest<R>(
  method: string,
  endpoint: string,
  payload?: unknown
): Promise<R> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { code?: string; message?: string } | undefined;
      try { errorBody = await response.json(); } catch { /* not JSON */ }
      throw new HttpError(
        errorBody?.message ?? `HTTP ${response.status}: ${response.statusText}`,
        errorBody
      );
    }

    if (response.status === 204) return undefined as R;
    return response.json() as Promise<R>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === "AbortError")
      throw new HttpError("Request timed out");
    throw new HttpError(error instanceof Error ? error.message : "Network error");
  }
}

export const httpClient = {
  get: <R>(endpoint: string): Promise<R> => rawRequest<R>("GET", endpoint),
  post: <R, P = unknown>(endpoint: string, payload: P): Promise<R> => rawRequest<R>("POST", endpoint, payload),
  put: <R, P = unknown>(endpoint: string, payload: P): Promise<R> => rawRequest<R>("PUT", endpoint, payload),
  patch: <R, P = unknown>(endpoint: string, payload: P): Promise<R> => rawRequest<R>("PATCH", endpoint, payload),
  delete: <R>(endpoint: string): Promise<R> => rawRequest<R>("DELETE", endpoint),
};
```

> Uses `credentials: "include"` so the Orca session cookie is forwarded automatically.

---

### `src/api/secured.ts`

```typescript
export const secured   = (path: string) => "/app/api/v1/s" + path;
export const securedv2 = (path: string) => "/app/api/v2/s" + path;
export const securedv3 = (path: string) => "/app/api/v3/s" + path;
export const securedv4 = (path: string) => "/app/api/v4/s" + path;
```

Use `secured()` for all authenticated REST calls. Use v2/v3/v4 only when the backend explicitly requires it.

---

### `src/api/types.ts`

```typescript
export interface Response<T> {
  success: true;
  data: T;
}

export type ListResponse<T> = Response<{ items: T[]; pageKey?: string }>;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ResponseError {
  response?: { code?: string; errors?: ValidationError[] };
}

export interface Pageable {
  pageKey?: string;
  size?: number | "all";
}
```

---

### `src/features/{{FEATURE_NAME}}/types.ts`

```typescript
export interface {{COMPONENT_NAME}}Item {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface {{COMPONENT_NAME}}State {
  completedIds: string[];
}
```

Adjust field names to fit the app's domain (e.g. `approved`, `selectedIds`).

---

### `src/features/{{FEATURE_NAME}}/data.ts`

Hardcoded static definitions — only completion/selection state lives in Firestore.

```typescript
import type { {{COMPONENT_NAME}}Item } from "./types";

export const ITEMS: Omit<{{COMPONENT_NAME}}Item, "completed">[] = [
  { id: "item-1", title: "First item", description: "What the user does here." },
  { id: "item-2", title: "Second item" },
];
```

If the app has no fixed list (fully user-generated content), delete `data.ts` and store everything via `api.ts`.

---

### `src/features/{{FEATURE_NAME}}/api.ts`

```typescript
import { httpClient } from "../../api/httpClient";
import type { {{COMPONENT_NAME}}State } from "./types";

const DOC_ID = "apps/{{APP_NAME}}/data/state";

export async function fetch{{COMPONENT_NAME}}State(): Promise<{{COMPONENT_NAME}}State> {
  try {
    const data = await httpClient.post<{{COMPONENT_NAME}}State>(
      "/orcaagents/db/workspace/doc/read",
      { docId: DOC_ID }
    );
    if (!data?.completedIds) return { completedIds: [] };
    return data;
  } catch {
    return { completedIds: [] };
  }
}

export async function save{{COMPONENT_NAME}}State(state: {{COMPONENT_NAME}}State): Promise<void> {
  await httpClient.post("/orcaagents/db/workspace/doc/write", {
    docId: DOC_ID,
    data: state,
  });
}
```

> `DOC_ID` must have exactly 4 path segments (`apps/<name>/<group>/<doc>`). A 3-segment path points to a collection, not a document, and the API returns 500.

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
import { fetch{{COMPONENT_NAME}}State, save{{COMPONENT_NAME}}State } from "./api";
import { ITEMS } from "./data";
import { {{FEATURE_NAME}}QueryKeys } from "./queryKeys";
import type { {{COMPONENT_NAME}}Item } from "./types";

export function use{{COMPONENT_NAME}}Items() {
  return useQuery({
    queryKey: {{FEATURE_NAME}}QueryKeys.items(),
    queryFn: async (): Promise<{{COMPONENT_NAME}}Item[]> => {
      const state = await fetch{{COMPONENT_NAME}}State();
      return ITEMS.map((item) => ({
        ...item,
        completed: state.completedIds.includes(item.id),
      }));
    },
  });
}

export function useToggle{{COMPONENT_NAME}}Item() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const state = await fetch{{COMPONENT_NAME}}State();
      const completedIds = completed
        ? state.completedIds.filter((cid) => cid !== id)
        : [...state.completedIds, id];
      await save{{COMPONENT_NAME}}State({ completedIds });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: {{FEATURE_NAME}}QueryKeys.items() });
    },
  });
}
```

---

### `src/features/{{FEATURE_NAME}}/pages/{{COMPONENT_NAME}}Page.tsx`

```tsx
import { use{{COMPONENT_NAME}}Items, useToggle{{COMPONENT_NAME}}Item } from "../hooks";

export function {{COMPONENT_NAME}}Page() {
  const { data: items, isLoading, error } = use{{COMPONENT_NAME}}Items();
  const toggle = useToggle{{COMPONENT_NAME}}Item();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 text-sm">Failed to load data.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{{DISPLAY_NAME}}</h1>
      <div className="space-y-3">
        {items?.map((item) => (
          <div
            key={item.id}
            onClick={() => toggle.mutate({ id: item.id, completed: item.completed })}
            className={`p-4 bg-white rounded-lg border cursor-pointer transition-colors ${
              item.completed
                ? "border-green-300 bg-green-50"
                : "border-slate-200 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                item.completed ? "bg-green-500 border-green-500" : "border-slate-300"
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  item.completed ? "text-slate-500 line-through" : "text-slate-700"
                }`}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {items?.length === 0 && (
          <p className="text-slate-500 text-sm">No items yet.</p>
        )}
      </div>
    </div>
  );
}
```

---

### `.gitignore`

```
dist
node_modules
```

---

## Feature architecture rules

```
features/featureName/
├── data.ts       — static definitions only, no imports from api.ts or hooks.ts
├── types.ts      — TypeScript interfaces
├── api.ts        — pure async functions, no React, no hooks
├── queryKeys.ts  — React Query cache key factories
├── hooks.ts      — useQuery/useMutation wrappers, imports api.ts + data.ts
└── pages/        — components that import hooks.ts only, never api.ts directly
```

---

## Data storage patterns

### Multiple documents in one app

```typescript
const SETTINGS_DOC = "apps/{{APP_NAME}}/config/settings";
const RESULTS_DOC  = "apps/{{APP_NAME}}/data/results";
```

### REST backend calls

```typescript
import { secured } from "../../api/secured";

export async function listItems(): Promise<Item[]> {
  const response = await httpClient.get<ListResponse<Item>>(secured("/{{APP_NAME}}/items"));
  return response.data.items;
}
```

---

## Styling reference

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

To add MUI for full visual parity with the Orca host: `bun add @mui/material @emotion/react @emotion/styled @mui/icons-material`

---

## Internal navigation (optional)

If the app needs multiple pages, add `react-router`: `bun add react-router`

```tsx
// OrcaApp.tsx — runs inside host's BrowserRouter at runtime
import { Route, Routes } from "react-router";

export function OrcaApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/orca/{{APP_NAME}}" element={<ListPage />} />
        <Route path="/orca/{{APP_NAME}}/:id" element={<DetailPage />} />
      </Routes>
    </QueryClientProvider>
  );
}

// main.tsx — standalone dev needs its own router
import { BrowserRouter, Route, Routes } from "react-router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ListPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```
