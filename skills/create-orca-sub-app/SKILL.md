---
name: create-orca-sub-app
description: Scaffold a new React-based Orca sub-app using Vite Module Federation. Use when creating a new standalone micro-frontend that plugs into the Orca host at runtime. Generates all required files following the feature-based patterns used in the main Orca React app.
---

# Create Orca React Sub-App

## When to Use

- You need to create a new standalone micro-frontend for the Orca platform
- A task or feature requires a new route under `/orca/<name>` in the Orca host
- You are bootstrapping a new sub-app repository from scratch

## How It Works

Sub-apps are independently built React apps loaded into the Orca host at runtime via [Vite Module Federation](https://github.com/originjs/vite-plugin-federation). The host discovers them from the database registry (`/orca/apps` API), dynamically imports `app.js` from the configured remote URL, and renders the exported `OrcaApp` React component at the registered route.

```
Sub-app repo (this)          Orca host
─────────────────────        ─────────────────────────────────────
src/OrcaApp.tsx  ──build──▶  dist/app.js  ◀──loadRemoteModule()──
                             dist/app.js.map
                             dist/*.css      (auto-injected)
```

React and ReactDOM are **shared singletons** — the host provides one instance, shared with all sub-apps. Do NOT bundle your own React. Everything else (React Query, TailwindCSS, MUI, etc.) is bundled by the sub-app.

---

## Inputs

**Required: `APP_NAME`** — kebab-case identifier (e.g. `invoice-viewer`, `report-builder`).

Derive it from context:
- If the user named the app explicitly, use that (normalize to kebab-case).
- If the task describes a feature (e.g. "build a contract summary page"), derive a concise name (e.g. `contract-summary`).
- If ambiguous, ask: "What should this sub-app be named? (kebab-case, e.g. `my-feature`)"

**Derived values** (compute before writing any files):

| Variable | Derivation | Example (`invoice-viewer`) |
|---|---|---|
| `APP_NAME` | input | `invoice-viewer` |
| `COMPONENT_NAME` | PascalCase of APP_NAME | `InvoiceViewer` |
| `DISPLAY_NAME` | Title-cased words | `Invoice Viewer` |
| `ROUTE` | `/orca/APP_NAME` | `/orca/invoice-viewer` |
| `FEATURE_NAME` | camelCase of APP_NAME | `invoiceViewer` |

**Output directory:** A new directory named `APP_NAME` in the current working directory (or wherever specified).

---

## Steps

### 1. Check for name collisions

Federation `name` must be globally unique across all running sub-apps:

```bash
# Ask the user or check existing sub-app repos
# Federation names must not clash — two sub-apps with the same name will conflict at runtime
```

If a collision is found, ask the user to choose a different name.

### 2. Create the directory structure

```
APP_NAME/
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   ├── secured.ts
│   │   └── types.ts
│   ├── features/
│   │   └── FEATURE_NAME/
│   │       ├── api.ts
│   │       ├── types.ts
│   │       ├── queryKeys.ts
│   │       ├── hooks.ts
│   │       └── pages/
│   │           └── COMPONENT_NAMEPage.tsx
│   ├── index.css
│   ├── OrcaApp.tsx
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 3. Write each file

Replace every `{{APP_NAME}}`, `{{COMPONENT_NAME}}`, `{{DISPLAY_NAME}}`, `{{FEATURE_NAME}}`, and `{{ROUTE}}` with the computed values.

---

#### `package.json`

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

#### `tsconfig.json`

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

#### `vite.config.ts`

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

> **Critical:** `name` must be globally unique across all deployed sub-apps — it is the Module Federation identifier used at runtime.
>
> **Critical:** `react` and `react-dom` are declared as `singleton: true` — the host provides these instances. Do NOT add other packages to `shared`. Bundle everything else directly.

---

#### `index.html`

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

#### `src/index.css`

```css
@import "tailwindcss";
```

---

#### `src/OrcaApp.tsx`

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

#### `src/main.tsx`

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

#### `src/api/httpClient.ts`

Fetch and copy verbatim from `src/api/httpClient.ts` in this same repository. Do not modify.

> This client uses `credentials: "include"` so the session cookie set by the Orca host is forwarded automatically. If the session expires, the 401 propagates to React Query and surfaces in the UI.

---

#### `src/api/secured.ts`

```typescript
export const secured = (path: string) => "/app/api/v1/s" + path;
export const securedv2 = (path: string) => "/app/api/v2/s" + path;
export const securedv3 = (path: string) => "/app/api/v3/s" + path;
export const securedv4 = (path: string) => "/app/api/v4/s" + path;
```

Use `secured()` for all authenticated API calls — it prepends the correct API base path used by the Orca backend. Most endpoints use v1; use v2/v3/v4 only when explicitly required by the backend.

---

#### `src/api/types.ts`

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

#### `src/features/{{FEATURE_NAME}}/types.ts`

Define your data model interfaces here. Example:

```typescript
export interface {{COMPONENT_NAME}}Item {
  id: number;
  name: string;
  createdAt: string;
}
```

---

#### `src/features/{{FEATURE_NAME}}/api.ts`

Pure async functions that call the backend. Never use React hooks here.

```typescript
import { httpClient } from "../../api/httpClient";
import { secured } from "../../api/secured";
import type { ListResponse, Response } from "../../api/types";
import type { {{COMPONENT_NAME}}Item } from "./types";

export async function list{{COMPONENT_NAME}}Items(): Promise<{{COMPONENT_NAME}}Item[]> {
  const response = await httpClient.get<ListResponse<{{COMPONENT_NAME}}Item>>(
    secured("/{{APP_NAME}}/items")
  );
  return response.data.items;
}

export async function get{{COMPONENT_NAME}}Item(id: number): Promise<{{COMPONENT_NAME}}Item> {
  const response = await httpClient.get<Response<{{COMPONENT_NAME}}Item>>(
    secured(`/{{APP_NAME}}/items/${id}`)
  );
  return response.data;
}

export async function create{{COMPONENT_NAME}}Item(
  payload: Omit<{{COMPONENT_NAME}}Item, "id" | "createdAt">
): Promise<{{COMPONENT_NAME}}Item> {
  const response = await httpClient.post<Response<{{COMPONENT_NAME}}Item>>(
    secured("/{{APP_NAME}}/items"),
    payload
  );
  return response.data;
}
```

---

#### `src/features/{{FEATURE_NAME}}/queryKeys.ts`

Centralize React Query cache keys for this feature. This prevents stale-cache bugs when invalidating after mutations.

```typescript
export const {{FEATURE_NAME}}QueryKeys = {
  root: ["{{FEATURE_NAME}}"] as const,
  items: () => [...{{FEATURE_NAME}}QueryKeys.root, "items"] as const,
  item: (id: number) => [...{{FEATURE_NAME}}QueryKeys.root, "item", id] as const,
};
```

---

#### `src/features/{{FEATURE_NAME}}/hooks.ts`

Wrap api.ts calls in React Query hooks. One hook per logical data concern.

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  create{{COMPONENT_NAME}}Item,
  get{{COMPONENT_NAME}}Item,
  list{{COMPONENT_NAME}}Items,
} from "./api";
import { {{FEATURE_NAME}}QueryKeys } from "./queryKeys";
import type { {{COMPONENT_NAME}}Item } from "./types";

export function use{{COMPONENT_NAME}}Items() {
  return useQuery({
    queryKey: {{FEATURE_NAME}}QueryKeys.items(),
    queryFn: list{{COMPONENT_NAME}}Items,
  });
}

export function use{{COMPONENT_NAME}}Item(id: number) {
  return useQuery({
    queryKey: {{FEATURE_NAME}}QueryKeys.item(id),
    queryFn: () => get{{COMPONENT_NAME}}Item(id),
  });
}

export function useCreate{{COMPONENT_NAME}}Item() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<{{COMPONENT_NAME}}Item, "id" | "createdAt">) =>
      create{{COMPONENT_NAME}}Item(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: {{FEATURE_NAME}}QueryKeys.items(),
      });
    },
  });
}
```

---

#### `src/features/{{FEATURE_NAME}}/pages/{{COMPONENT_NAME}}Page.tsx`

The root page component. This is what `OrcaApp.tsx` renders.

```tsx
import { useState } from "react";
import { use{{COMPONENT_NAME}}Items } from "../hooks";

export function {{COMPONENT_NAME}}Page() {
  const { data: items, isLoading, error } = use{{COMPONENT_NAME}}Items();
  const [selected, setSelected] = useState<number | null>(null);

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

      <div className="space-y-2">
        {items?.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item.id)}
            className="p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <p className="text-sm font-medium text-slate-700">{item.name}</p>
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

#### `.gitignore`

```
dist
node_modules
```

---

### 4. Install and verify

```bash
cd {{APP_NAME}}
bun install
bun run build
```

Expected: `dist/app.js` is created. TypeScript errors surface here — fix before proceeding.

Verify standalone dev:

```bash
bun run dev
# Opens at http://localhost:4173
```

---

### 5. Serve and register with the Orca host

**Serve the built bundle with CORS:**

```bash
bunx serve dist --cors -l 4174
```

The remote entry is now at `http://localhost:4174/app.js`.

**Register in the sysadmin UI** — go to `/sysadmin/orca/apps` and create an entry:

| Field | Value |
|---|---|
| ID | `{{APP_NAME}}` |
| Route | `{{ROUTE}}` |
| Title | `{{DISPLAY_NAME}}` |
| Description | Short description of what the app does |
| Remote URL | `http://localhost:4174/app.js` |
| Exposed Module | `./OrcaApp` |
| Icon BG | `bg-indigo-500` (any Tailwind `bg-*` class) |
| Admin Only | `false` |

**Hard-refresh the Orca host.** Routes are registered at bootstrap — a full page reload is required after adding the DB entry.

You should see:
- A card for the sub-app on the Orca home page (`/orca/home`)
- Clicking it navigates to `{{ROUTE}}` and renders `OrcaApp`

---

## Feature-Based Architecture

Sub-apps follow the same feature-based architecture as the main Orca React app. Each feature module has:

```
features/
└── featureName/
    ├── api.ts          # Pure async fetch functions (no React hooks)
    ├── types.ts        # TypeScript interfaces for this feature's data
    ├── queryKeys.ts    # React Query cache key factories
    ├── hooks.ts        # useQuery / useMutation wrappers
    ├── pages/          # Page-level React components
    └── components/     # Reusable UI components for this feature
```

**Rules:**
- `api.ts` is pure TypeScript — no React, no hooks, no side effects
- `hooks.ts` depends on `api.ts` and `queryKeys.ts` — never the other way around
- `pages/` depends on `hooks.ts` — page components call hooks, not api.ts directly
- Each feature owns its query keys — never import another feature's queryKeys

---

## API Call Patterns

### GET — fetch a list

```typescript
// api.ts
export async function listItems(): Promise<Item[]> {
  const response = await httpClient.get<ListResponse<Item>>(
    secured("/my-feature/items")
  );
  return response.data.items;
}

// hooks.ts
export function useItems() {
  return useQuery({
    queryKey: myFeatureQueryKeys.items(),
    queryFn: listItems,
  });
}
```

### GET — fetch a single record

```typescript
// api.ts
export async function getItem(id: number): Promise<Item> {
  const response = await httpClient.get<Response<Item>>(
    secured(`/my-feature/items/${id}`)
  );
  return response.data;
}

// hooks.ts
export function useItem(id: number) {
  return useQuery({
    queryKey: myFeatureQueryKeys.item(id),
    queryFn: () => getItem(id),
  });
}
```

### POST — create

```typescript
// api.ts
export async function createItem(payload: CreateItemRequest): Promise<Item> {
  const response = await httpClient.post<Response<Item>>(
    secured("/my-feature/items"),
    payload
  );
  return response.data;
}

// hooks.ts
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myFeatureQueryKeys.items() });
    },
  });
}
```

### Paginated list (cursor-based)

```typescript
// api.ts
export async function listItemsPage(
  pageKey?: string
): Promise<{ items: Item[]; pageKey?: string }> {
  const params = pageKey ? `?pageKey=${pageKey}` : "";
  const response = await httpClient.get<ListResponse<Item>>(
    secured(`/my-feature/items${params}`)
  );
  return {
    items: response.data.items,
    pageKey: response.data.pageKey,
  };
}

// hooks.ts
export function useItemsInfinite() {
  return useInfiniteQuery({
    queryKey: myFeatureQueryKeys.items(),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listItemsPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.pageKey,
    initialPageParam: undefined as string | undefined,
  });
}
```

---

## Styling

Use **TailwindCSS v4** utility classes. The sub-app bundles its own TailwindCSS — styles are injected at runtime when the module loads.

Common patterns matching the Orca host visual language:

```tsx
// Page container
<div className="p-8">

// Section heading
<h1 className="text-2xl font-bold text-slate-800 mb-6">

// Card
<div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-colors">

// Loading state
<div className="flex items-center justify-center min-h-64">
  <div className="text-slate-400 text-sm">Loading...</div>
</div>

// Error state
<p className="text-red-600 text-sm">Something went wrong.</p>

// Empty state
<p className="text-slate-500 text-sm">No items yet.</p>

// Primary action button
<button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">

// Secondary button
<button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors">
```

To add **MUI v6** (for full visual parity with the Orca host):

```bash
bun add @mui/material @emotion/react @emotion/styled @mui/icons-material
```

Wrap OrcaApp with a ThemeProvider using the same indigo/violet palette:

```tsx
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },    // indigo-600
    secondary: { main: "#7c3aed" },  // violet-600
    error: { main: "#ef4444" },      // red-500
  },
});

export function OrcaApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <YourPage />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

---

## Internal Navigation (optional)

If the sub-app needs multiple internal pages, add `react-router`:

```bash
bun add react-router
```

Use `MemoryRouter` in the standalone dev entry (`main.tsx`) and rely on the host's `BrowserRouter` at runtime:

```tsx
// OrcaApp.tsx — rendered inside host's BrowserRouter, so Routes just works
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
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="*" element={<ListPage />} />
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
```

---

## Checklist

Before declaring the sub-app scaffolded:

- [ ] All files created with `{{...}}` placeholders substituted
- [ ] `name` in `vite.config.ts` and `package.json` match and use `APP_NAME`
- [ ] `bun run build` succeeds and `dist/app.js` exists
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run dev` opens a working standalone preview
- [ ] Federation `name` does not collide with existing sub-apps

---

## Troubleshooting

**`React is not defined` or hooks error after loading in host**
Both the sub-app and host must share the same React 19.x instance. Ensure `react` and `react-dom` are in `shared` with `singleton: true, eager: true` in `vite.config.ts`. The host's vite config must also list these as shared.

**`Failed to fetch` or CORS error in devtools**
Ensure the static server was started with `--cors`. Restart it if the error persists.

**Route renders blank in the host**
Verify `exposedModule` in the DB entry is exactly `./OrcaApp` — it must match the key in `vite.config.ts`'s `exposes` object. Check the browser console for federation loading errors.

**`dist/app.js` is not created after `bun run build`**
TypeScript errors prevent the build from completing. Run `bun run typecheck` first to surface all errors.

**CSS not applied inside the host**
Import `./index.css` at the top of `OrcaApp.tsx` (not `main.tsx`). The federation plugin injects this CSS when the remote module is loaded.

**React Query data not fetching**
Ensure `QueryClientProvider` wraps the component in `OrcaApp.tsx`. The sub-app has its own `QueryClient` instance — it cannot share the host's.
