---
name: create-orca-sub-app
description: Scaffold a complete new Orca sub-app from scratch. Orchestrates scaffold-orca-sub-app → build-orca-sub-app → register-orca-sub-app. Use when a user wants to create a new standalone micro-frontend for the Orca platform.
---

# Create Orca Sub-App

## What this skill does

Runs the full creation flow for a new Orca sub-app in four steps:

1. **Setup** — derive names, choose save location
2. **Scaffold** — generate all project files (see `scaffold-orca-sub-app`)
3. **Build** — install dependencies, build, start server, create zip (see `build-orca-sub-app`)
4. **Register** — show the Orca registration table (see `register-orca-sub-app`)

---

## Inputs

**Required: `APP_NAME`** — kebab-case identifier (e.g. `invoice-viewer`, `task-board`).

- If the user named the app explicitly, normalise it to kebab-case.
- If the user described a feature, derive a concise name (e.g. `contract-summary`).
- If ambiguous, ask: *"What should this sub-app be named? (e.g. `my-feature`)"*

**Derived values** — compute these before writing any files:

| Variable | Rule | Example |
|---|---|---|
| `APP_NAME` | input | `invoice-viewer` |
| `COMPONENT_NAME` | PascalCase of APP_NAME | `InvoiceViewer` |
| `DISPLAY_NAME` | Title-cased words | `Invoice Viewer` |
| `ROUTE` | `/orca/APP_NAME` | `/orca/invoice-viewer` |
| `FEATURE_NAME` | camelCase of APP_NAME | `invoiceViewer` |

---

## Step 1 — Choose the save location

Ask the user:

> "Where would you like me to save your app folder? Your Desktop is a good default."

Create the folder at the chosen path:

- **Windows:** `mkdir "$env:USERPROFILE\Desktop\{{APP_NAME}}"`
- **Mac / Linux:** `mkdir -p ~/Desktop/{{APP_NAME}}`

---

## Step 2 — Check for name collisions

The federation `name` in `vite.config.ts` must be globally unique across all running sub-apps. If you can see other sub-app repos, confirm no existing app uses `APP_NAME`. If a collision is found, ask the user to choose a different name before continuing.

---

## Step 3 — Scaffold

Follow **scaffold-orca-sub-app** to write every file in the project.

---

## Step 4 — Build and serve

Follow **build-orca-sub-app** to install dependencies, build the app, start the server, and create the zip file.

---

## Step 5 — Register in Orca

Follow **register-orca-sub-app** to show the completed registration table.

---

## Checklist

Before declaring done:

- [ ] All placeholders substituted (`APP_NAME`, `COMPONENT_NAME`, `DISPLAY_NAME`, `FEATURE_NAME`, `ROUTE`)
- [ ] `name` in `vite.config.ts` and `package.json` both equal `APP_NAME`
- [ ] `bun run build` succeeded — `dist/app.js` exists
- [ ] `bun run typecheck` passes with zero errors
- [ ] Server running at `http://localhost:4174`
- [ ] Registration table shown with all fields filled in (never skipped)
- [ ] Zip file created next to the app folder

---

## Troubleshooting

**React / hooks error after loading in Orca host**
Both the sub-app and host must share the same React 19.x singleton. Verify `vite.config.ts` has `react` and `react-dom` in `shared` with `singleton: true, eager: true`.

**CORS error in devtools**
The static server must be started with `--cors`. Restart it if the flag is missing.

**Blank page in the host**
Check that `exposedModule` in the Orca DB entry is exactly `./OrcaApp` — it must match the key in `vite.config.ts`'s `exposes` object.

**`dist/app.js` not created after build**
TypeScript errors blocked the build. Run `bun run typecheck` to surface them and fix before retrying.

**CSS missing inside the host**
`./index.css` must be imported in `OrcaApp.tsx`, not `main.tsx`.

**React Query not fetching**
Ensure `QueryClientProvider` wraps the root component inside `OrcaApp.tsx`. Sub-apps have their own `QueryClient` — they cannot share the host's.
