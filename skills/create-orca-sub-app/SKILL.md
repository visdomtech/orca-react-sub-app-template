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

### 1. Ask where to save the app and create the folder

Before writing any files, ask the user:

> "Where would you like me to save your app folder? I'll create it for you. For example, your Desktop or Documents folder."

If they are unsure, suggest the Desktop as the default.

Use computer use to create the folder at the chosen location:

- **Windows:** `mkdir "$env:USERPROFILE\Desktop\{{APP_NAME}}"`
- **Mac / Linux:** `mkdir -p ~/Desktop/{{APP_NAME}}`

Do not open a file picker — create the folder directly via the terminal.

### 2. Check for name collisions

Federation `name` must be globally unique across all running sub-apps. Ask the user or check existing sub-app repos — two sub-apps with the same name will conflict at runtime. If a collision is found, ask the user to choose a different name.

### 4. Create the directory structure

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
│   │       ├── data.ts       ← hardcoded content definitions
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

### 5. Write each file

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
      try {
        errorBody = await response.json();
      } catch {
        // response body is not JSON
      }
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
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpError("Request timed out");
    }
    throw new HttpError(error instanceof Error ? error.message : "Network error");
  }
}

export const httpClient = {
  get: <R>(endpoint: string): Promise<R> =>
    rawRequest<R>("GET", endpoint),
  post: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("POST", endpoint, payload),
  put: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("PUT", endpoint, payload),
  patch: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("PATCH", endpoint, payload),
  delete: <R>(endpoint: string): Promise<R> =>
    rawRequest<R>("DELETE", endpoint),
};
```

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

Two interfaces: the item shape (definition + state merged) and the state shape stored in Firestore.

```typescript
export interface {{COMPONENT_NAME}}Item {
  id: string;
  title: string;
  description?: string;
  completed: boolean;  // derived from Firestore state — not stored in data.ts
}

export interface {{COMPONENT_NAME}}State {
  completedIds: string[];  // the only thing persisted to Firestore
}
```

Adjust field names to fit your app's domain (e.g. `approved`, `selectedIds`, `scores`).

---

#### `src/features/{{FEATURE_NAME}}/data.ts`

Hardcoded static content — the definitions that never change. Only the completion/selection state lives in Firestore.

```typescript
import type { {{COMPONENT_NAME}}Item } from "./types";

// Static definitions — rename this constant to something descriptive
// (e.g. ONBOARDING_TASKS, REVIEW_QUESTIONS, CHECKLIST_ITEMS)
export const ITEMS: Omit<{{COMPONENT_NAME}}Item, "completed">[] = [
  {
    id: "item-1",
    title: "First item",
    description: "What the user needs to do here.",
  },
  {
    id: "item-2",
    title: "Second item",
  },
  // add more items…
];
```

If your app's content is entirely user-generated (no hardcoded list), store everything in Firestore and delete `data.ts`.

---

#### `src/features/{{FEATURE_NAME}}/api.ts`

Reads and writes app state to the Orca agents Firestore API. No backend endpoint needed — data is stored per-workspace automatically.

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

export async function save{{COMPONENT_NAME}}State(
  state: {{COMPONENT_NAME}}State
): Promise<void> {
  await httpClient.post("/orcaagents/db/workspace/doc/write", {
    docId: DOC_ID,
    data: state,
  });
}
```

> `DOC_ID` must have an **even number of path segments** — Firestore alternates collection/document. Use 4 segments: `apps/<APP_NAME>/<subcollection>/<document>` (e.g. `apps/my-app/data/state`). A 3-segment path like `apps/my-app/state` points to a subcollection reference, not a document, and the API returns 500. Each workspace gets its own document — scoping is handled automatically via the session cookie.

---

#### `src/features/{{FEATURE_NAME}}/queryKeys.ts`

Centralize React Query cache keys for this feature.

```typescript
export const {{FEATURE_NAME}}QueryKeys = {
  root: ["{{FEATURE_NAME}}"] as const,
  items: () => [...{{FEATURE_NAME}}QueryKeys.root, "items"] as const,
};
```

---

#### `src/features/{{FEATURE_NAME}}/hooks.ts`

Merges the hardcoded `ITEMS` definitions from `data.ts` with the completion state from Firestore.

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
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }) => {
      const state = await fetch{{COMPONENT_NAME}}State();
      const completedIds = completed
        ? state.completedIds.filter((cid) => cid !== id)
        : [...state.completedIds, id];
      await save{{COMPONENT_NAME}}State({ completedIds });
    },
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
            onClick={() =>
              toggle.mutate({ id: item.id, completed: item.completed })
            }
            className={`p-4 bg-white rounded-lg border cursor-pointer transition-colors ${
              item.completed
                ? "border-green-300 bg-green-50"
                : "border-slate-200 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                  item.completed
                    ? "bg-green-500 border-green-500"
                    : "border-slate-300"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? "text-slate-500 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.description}
                  </p>
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

#### `.gitignore`

```
dist
node_modules
```

---

### 6. Install, build, and serve — do this automatically without waiting for the user to ask

Immediately after writing all files, use computer use to open a terminal and run the following commands. Do not show the commands and wait — execute them now.

**Check if Bun is installed:**

```bash
bun --version
```

If the command is not found, install Bun first:

- **Windows (PowerShell):**
  ```
  powershell -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
  ```
  Then set the path for the current session:
  ```
  $env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
  ```

- **Mac / Linux:**
  ```
  curl -fsSL https://bun.sh/install | bash
  ```
  Then reload the shell or set:
  ```
  export PATH="$HOME/.bun/bin:$PATH"
  ```

**Navigate to the app folder and run:**

```bash
cd {{APP_NAME}}
bun install
bun run build
bunx serve dist --cors -l 4174
```

If `bun run build` fails due to TypeScript errors, fix them before running `bunx serve`.

Leave the terminal running — do not close it.

---

### 7. Tell the user the app is ready

Once the server is running, tell the user:

> "Your app is ready and running at http://localhost:4174. Keep the terminal window open — closing it will stop the app.
>
> To add it to Orca, go to **Settings → Apps** (`/orca/sysadmin/apps`), click **Add App**, and fill in every field using these values:"

| Field | Value |
|---|---|
| ID | `{{APP_NAME}}` |
| Route | `{{ROUTE}}` |
| Title | `{{DISPLAY_NAME}}` |
| Description | *(one sentence summarising what this app does, derived from the user's description)* |
| Icon ID | *(choose the most fitting word from: `assignment`, `checklist`, `groups`, `star`, `security`, `apps`, `inventory`, `person`, `work`)* |
| Icon Background | `bg-indigo-500` |
| Badge | *(leave empty)* |
| Display Order | `0` |
| Admin Only | unchecked |
| Remote URL | `http://localhost:4174/app.js` |
| Exposed Module | `./OrcaApp` |

---

## Feature-Based Architecture

Sub-apps follow the same feature-based architecture as the main Orca React app. Each feature module has:

```
features/
└── featureName/
    ├── data.ts         # Hardcoded static definitions (task list, categories, questions…)
    ├── types.ts        # TypeScript interfaces — item shape and Firestore state shape
    ├── api.ts          # Firestore read/write functions (no React hooks)
    ├── queryKeys.ts    # React Query cache key factories
    ├── hooks.ts        # useQuery / useMutation wrappers — merges data.ts + Firestore state
    ├── pages/          # Page-level React components
    └── components/     # Reusable UI components for this feature
```

**Rules:**
- `api.ts` is pure TypeScript — no React, no hooks, no side effects
- `data.ts` contains only static exports — no imports from `api.ts` or `hooks.ts`
- `hooks.ts` depends on `api.ts`, `data.ts`, and `queryKeys.ts` — never the other way around
- `pages/` depends on `hooks.ts` — page components call hooks, not api.ts directly
- Each feature owns its query keys — never import another feature's queryKeys

---

## Data Storage

Sub-apps use the **Orca agents Firestore API** as the default persistence layer. No backend endpoint is needed — data is automatically scoped per workspace.

### Firestore read/write (default pattern)

```typescript
// api.ts — read and write a single document per app
const DOC_ID = "apps/my-feature/state";

export async function fetchState(): Promise<MyState> {
  try {
    const data = await httpClient.post<MyState>(
      "/orcaagents/db/workspace/doc/read",
      { docId: DOC_ID }
    );
    if (!data) return { completedIds: [] };  // return safe default when doc is empty
    return data;
  } catch {
    return { completedIds: [] };
  }
}

export async function saveState(state: MyState): Promise<void> {
  await httpClient.post("/orcaagents/db/workspace/doc/write", {
    docId: DOC_ID,
    data: state,
  });
}
```

> - **`docId`** follows `apps/<APP_NAME>/<resource>`. Use different resource names for different documents within the same app (e.g. `apps/my-app/config`, `apps/my-app/results`).
> - The Orca host scopes documents to the current workspace automatically. Two users in different workspaces read/write separate documents even with the same `docId`.
> - Always return a safe default in the `catch` block — a missing document returns an error, not an empty object.

### Merging static definitions with Firestore state

When the app has a fixed list of items (tasks, questions, steps) and only the completion state is dynamic:

```typescript
// data.ts — static definitions
export const ITEMS = [
  { id: "step-1", title: "Do the first thing" },
  { id: "step-2", title: "Do the second thing" },
];

// api.ts — only store which IDs are "done"
export interface AppState { completedIds: string[] }

// hooks.ts — merge at query time
export function useItems() {
  return useQuery({
    queryKey: myFeatureQueryKeys.items(),
    queryFn: async () => {
      const state = await fetchState();
      return ITEMS.map((item) => ({
        ...item,
        completed: state.completedIds.includes(item.id),
      }));
    },
  });
}
```

### Multiple documents

If the app needs to store several independent datasets, use different `docId`s:

```typescript
const SETTINGS_DOC = "apps/my-feature/config/settings";
const RESULTS_DOC  = "apps/my-feature/data/results";
```

### REST backend (when you need it)

Use a REST backend only when the app needs server-side logic, multi-user sync, file storage, or access to existing backend data. Use `secured()` to prefix the path:

```typescript
import { secured } from "../../api/secured";

// api.ts — REST call to existing backend endpoint
export async function listItems(): Promise<Item[]> {
  const response = await httpClient.get<ListResponse<Item>>(
    secured("/my-feature/items")
  );
  return response.data.items;
}

export async function createItem(
  payload: Omit<Item, "id" | "createdAt">
): Promise<Item> {
  const response = await httpClient.post<Response<Item>>(
    secured("/my-feature/items"),
    payload
  );
  return response.data;
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
