# CLAUDE.md

This file guides Claude Code when working in an Orca React sub-app repo.

## What this repo is

A standalone React micro-frontend that plugs into the Orca host at runtime via **Vite Module Federation**. The host fetches `dist/app.js` from a remote URL, dynamically imports `./OrcaApp`, and renders `<OrcaApp />` as a React component at a registered route.

## Quick Commands

```bash
bun install            # Install dependencies
bun run dev            # Dev server at http://localhost:4173 (standalone, no host required)
bun run build          # Type-check + build → dist/app.js
bun run typecheck      # TypeScript check only
bunx serve dist --cors -l 4174  # Serve built bundle for host integration testing
```

## Architecture

```
src/
├── OrcaApp.tsx        ← root component exported to host (default export required)
├── main.tsx           ← standalone dev entry only — NOT loaded by host
├── index.css          ← TailwindCSS v4 — must be imported in OrcaApp.tsx
├── api/
│   ├── httpClient.ts  ← pre-built HTTP client (credentials: include)
│   └── types.ts       ← shared Response<T>, ListResponse<T>, etc.
└── features/
    └── <featureName>/
        ├── api.ts       ← pure async fetch functions — no React hooks
        ├── types.ts     ← TypeScript interfaces for this feature
        ├── queryKeys.ts ← React Query cache key factories
        ├── hooks.ts     ← useQuery / useMutation wrappers
        ├── pages/       ← page-level components
        └── components/  ← reusable components for this feature
```

## Key Rules

### Module Federation constraints

- `react` and `react-dom` are shared singletons — the host provides these instances
- Do NOT add other packages to the `shared` section in `vite.config.ts` — bundle everything else
- The federation `name` in `vite.config.ts` must be globally unique across all sub-apps
- `OrcaApp.tsx` MUST have a `default export` — the host checks `remote.default`
- Import `./index.css` in `OrcaApp.tsx` (not `main.tsx`) so CSS is injected at load time

### API calls

- Always use `httpClient` from `src/api/httpClient.ts` — never use raw `fetch` directly
- Store and read all app-owned data via the **OrcaAgents DB API** — never invent custom endpoints:
  - Write: `httpClient.post("/orcaagents/db/workspace/doc/write", { docId: "apps/<appName>/<collection>/<id>", data })`
  - Read list: `httpClient.post("/orcaagents/db/workspace/doc/subcollection/docs", { docId: "apps/<appName>", subCollectionId: "<collection>" })`
  - Read one: `httpClient.post("/orcaagents/db/workspace/doc/read", { docId: "apps/<appName>/<collection>/<id>" })`
  - Current user: `httpClient.get("/orcaagents/auth/userinfo")`
- `api.ts` files must be pure TypeScript — no React, no hooks, no side effects
- All Orca host API responses follow the `Response<T>` wrapper pattern from `src/api/types.ts`

### Data fetching pattern

```
api.ts (pure fetch) → hooks.ts (React Query wrapper) → pages/ (component uses hook)
```

Never skip layers: pages must not import from `api.ts` directly.

### Styling

- **MUI-first with `sx` + theme tokens** (Mercury Console design system)
- See `styles.md` for the full design specification
- Import UI kit components from `~/shared/ui` (AdminTable, PageHeader, DetailLayout, StatusPill, etc.)
- Use theme tokens (`divider`, `text.secondary`, `background.paper`, `primary.main`) - no raw hex values
- Single accent: indigo (`primary.main` = #4f46e5). No violet/purple.
- Backgrounds: `background.default` (slate-50), `background.paper` (white); borders: `divider` (slate-200)
- No gradient backgrounds, no gradient text, no hover lifts, no card shadows
- Tailwind is available but reserved for non-admin pages; admin/data pages use MUI `sx`

## Registering with the host

After `bun run build` and `bunx serve dist --cors -l 4174`:

1. Go to `/sysadmin/orca/apps` in the Orca host
2. Create an entry with:
   - **Remote URL**: `http://localhost:4174/app.js`
   - **Exposed Module**: `./OrcaApp`
   - **Route**: `/orca/<your-app-name>`
3. Hard-refresh the host (routes are cached at bootstrap)

## Adding features

To add a new feature:

1. Create `src/features/<featureName>/` with `api.ts`, `types.ts`, `queryKeys.ts`, `hooks.ts`, `pages/`
2. Add the page to `OrcaApp.tsx` (or route to it if using `react-router`)
3. Run `bun run typecheck` — fix all errors before building

## Adding MUI

MUI is required for the Mercury Console design system. Install:

```bash
bun add @mui/material@^6 @emotion/react @emotion/styled @mui/icons-material@^6 react-router
```

The Mercury Console theme and UI kit are already in this repo. Wire them up:

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme/theme";

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

See `styles.md` for the full design spec and `skills/orca-fe/SKILL.md` for the migration guide.

## Adding internal routing

If the app needs multiple pages, add `react-router`:

```bash
bun add react-router
```

Use `<Routes>` in `OrcaApp.tsx` — at runtime it works inside the host's `BrowserRouter`. For standalone dev, wrap `main.tsx` with its own `<BrowserRouter>`.
