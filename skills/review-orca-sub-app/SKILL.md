---
name: review-orca-sub-app
description: Code review for generated Orca sub-apps. Checks source files against Module Federation rules, routing patterns, API patterns, UX completeness, and security. Produces a structured report. The caller decides whether to block, warn, or proceed based on the findings.
---

# Review Orca Sub-App

Read the generated source files and check them against the rules below. Produce a structured report and return it to the caller. The caller applies the gate logic (block on 🔴 Issues, ask on ⚠️ Warnings, proceed if clean).

## Inputs

| Variable | Example |
|---|---|
| `APP_NAME` | `invoice-viewer` |
| `COMPONENT_NAME` | `InvoiceViewer` |
| `FEATURE_NAME` | `invoiceViewer` |

---

## Step 1 — Discover and read all source files

First, list every `.ts` and `.tsx` file under `src/`, excluding test files and the test setup file. Also include `vite.config.ts` and `package.json` from the root.

**Mac / Linux:**
```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  | grep -v "\.test\." \
  | grep -v "test-setup\.ts" \
  | sort
```

**Windows (PowerShell):**
```powershell
Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx" |
  Where-Object { $_.Name -notmatch "\.test\." -and $_.Name -ne "test-setup.ts" } |
  Select-Object -ExpandProperty FullName |
  Sort-Object
```

Read every file returned by the command above, plus `vite.config.ts` and `package.json`. Do not skip any file — violations can appear anywhere, not just in the expected locations.

---

## Step 2 — Apply the checklist

Work through each category. For every item, mark it as:

- ✅ **Pass** — rule is satisfied
- ⚠️ **Warning** — rule is violated but not critical
- 🔴 **Issue** — critical violation that will likely break the app in production

### Category A — Module Federation

| Check | Severity |
|---|---|
| `vite.config.ts` exposes `"./OrcaApp": "./src/OrcaApp.tsx"` | 🔴 Issue |
| `react` and `react-dom` are in `shared` with `singleton: true` | 🔴 Issue |
| If the app uses routing (any `react-router` import), `react-router` is ALSO in `shared` with `singleton: true` | 🔴 Issue |
| No extra packages added to `shared` beyond `react`, `react-dom`, and (only when routing is used) `react-router` | ⚠️ Warning |
| `src/OrcaApp.tsx` has `export default OrcaApp` | 🔴 Issue |

### Category B — Routing

Only applies if the app has more than one page/view. Skip this category entirely (mark N/A, not pass) if the app is single-page.

| Check | Severity |
|---|---|
| All routing imports come from `react-router` — never `react-router-dom` | 🔴 Issue |
| `package.json` declares `react-router` (not `react-router-dom`) as a dependency | 🔴 Issue |
| `OrcaApp.tsx` does NOT import `BrowserRouter`, `HashRouter`, or call `createBrowserRouter` | 🔴 Issue |
| Routing uses `useRoutes()` or `<Routes>` (hooks into host router) | 🔴 Issue |
| `OrcaApp` accepts `basename?: string` prop | 🔴 Issue |
| The raw `basename` PROP is used ONLY to seed `SubAppBasenameContext` (Category C) — it is never passed directly to `useLocation()`/`useRoutes()` stripping logic or `navigate()` targets | 🔴 Issue |
| Any manual location override passed to `useRoutes(routes, override)` is derived from `useSubAppRouterBasePath()` (router-relative), never the raw `basename` prop | 🔴 Issue |
| If the app's top-level route table is a single catch-all (`{ path: "*", element: ... }`), `useRoutes` is called WITHOUT a second (location override) argument — it matches unconditionally, so an override only adds risk | ⚠️ Warning |

> **Why `react-router` vs `react-router-dom` is a 🔴, not a style nit:** the Orca host shares `react-router` (not `react-router-dom`) as a federation singleton and renders `OrcaApp` nested inside its own `react-router` Router. If the sub-app imports `react-router-dom` — or imports `react-router` but omits it from `shared` — Module Federation bundles a second, unshared copy with its own React Context. The sub-app then crashes at runtime with `useLocation() may be used only in the context of a <Router> component`, even though it visibly *is* nested inside the host's Router in the component tree — because Context matching requires the exact same module instance, not just a matching shape. This only surfaces when the built remote is actually loaded by the host, never in standalone `bun run dev` — so it will not be caught by typecheck, tests, or a standalone smoke test. Reviewers must check `vite.config.ts`'s `shared` and `package.json`'s dependency name directly.

> **Why the raw `basename` prop is a trap:** it is HOST-absolute (e.g. `/ng/orca/apps/my-app`) — it already includes the ambient router's OWN basename (`/ng`). Once `react-router` is correctly shared (above), `useLocation()`/`useNavigate()` inside the sub-app read that SAME ambient Router, so they already operate relative to `/ng`. Stripping or re-prefixing the RAW prop against them double-counts it, producing URLs like `/ng/ng/orca/apps/my-app/...` and silent 404s — the app renders, tab navigation visibly "works" in isolation, and the bug only shows up as a broken URL after a click. Separately, passing a manually-stripped path as `useRoutes`'s location override throws `the location pathname must begin with the portion of the URL pathname that was matched by all parent routes`, because that override must stay consistent with whatever ancestor route (e.g. the host's `/orca/apps/:appId/*`) already matched — a locally-stripped path never is. Both failure modes are invisible in standalone `bun run dev` (no ambient basename or ancestor route there) and only surface once the built remote is loaded by the real host nested under a route. `useSubAppRouterBasePath()` (Category C) exists specifically to compute the safe, router-relative value — reviewers should treat any other use of the raw `basename` prop for navigation as suspect.

### Category C — Navigation

Only applies if the app uses routing (Category B). Skip if single-page.

| Check | Severity |
|---|---|
| `src/shared/SubAppLink.tsx` (or equivalent) exists, exporting `SubAppBasenameContext`, `useSubAppBasePath()`, and `useSubAppRouterBasePath()` | 🔴 Issue |
| `OrcaApp.tsx` provides `SubAppBasenameContext` with the raw (host-absolute) resolved `basename` | ⚠️ Warning |
| Tab/segment derivation from the current path, and all `navigate()` targets, use `useSubAppRouterBasePath()` — not the raw `basename` prop, not `useSubAppBasePath()` | 🔴 Issue |
| No plain `<Link to="...">` from react-router in page components — only `<SubAppLink>` | ⚠️ Warning |
| `backHref` props use `useSubAppRouterBasePath()`, not `useSubAppBasePath()` | ⚠️ Warning |

### Category D — API patterns

| Check | Severity |
|---|---|
| No raw `fetch()` calls anywhere (`api.ts`, `hooks.ts`, page) — all HTTP goes through `httpClient` | ⚠️ Warning |
| All endpoints start with `/orcaagents/db/` or `/orcaagents/auth/` | ⚠️ Warning |
| `IS_STANDALONE` guard present in `api.ts`: `const IS_STANDALONE = import.meta.env.DEV` | ⚠️ Warning |
| Mock data in `api.ts` uses realistic values (not `"Item 1"`, `"Test"`, `"example@test.com"`) | ⚠️ Warning |
| `DOC_BASE` follows the pattern `"apps/{{APP_NAME}}"` | ⚠️ Warning |
| `hooks.ts` uses `useQuery`/`useMutation` wrappers — no direct API calls inside components | ⚠️ Warning |

### Category D2 — Type definitions (any `types.ts` file)

| Check | Severity |
|---|---|
| No `any` type in domain interfaces | ⚠️ Warning |
| Interface names reflect the app's actual domain (not generic `Item`, `Data`, `Record`) | ⚠️ Warning |
| All required fields are non-optional; optional fields are intentionally marked `?` | ⚠️ Warning |

### Category E — UX completeness

| Check | Severity |
|---|---|
| Page component renders a loading state when `isLoading` is true | ⚠️ Warning |
| Page component renders an error state when `error` is truthy | ⚠️ Warning |

### Category F — Code quality (all files)

| Check | Severity |
|---|---|
| No `console.log` or `console.error` in any generated source file | ⚠️ Warning |
| No TypeScript `any` type in any generated file (except where explicitly unavoidable and commented) | ⚠️ Warning |
| No `@ts-ignore` or `@ts-nocheck` directives in any file | ⚠️ Warning |
| `queryKeys.ts` keys match the feature name and are used consistently in `hooks.ts` | ⚠️ Warning |

### Category G — Security

| Check | Severity |
|---|---|
| No `dangerouslySetInnerHTML` | 🔴 Issue |
| No `eval()` or `new Function(...)` | 🔴 Issue |
| No hardcoded secrets, tokens, passwords, or API keys | 🔴 Issue |

---

## Step 3 — Produce the report

Output a single formatted report using this template. Substitute all placeholders:

```
## Code Review — {{APP_NAME}}

### 🔴 Issues (fix before deploying to production)
- [list each 🔴 finding with the file and context, or write "None"]

### ⚠️ Warnings (recommended to fix)
- [list each ⚠️ finding with the file and relevant detail, or write "None"]

### ✅ Passed
- [list each category where all rules passed, e.g. "Category G — Security"]

---
**Summary:** X issues · Y warnings
[One sentence about overall quality and the most important thing to fix, or "Looks good — ready to upload."]
```

---

## Step 4 — Return the report

After outputting the report, return control to the caller with the full report including the count of 🔴 Issues and ⚠️ Warnings. The caller (e.g. `build-orca-sub-app`) applies the gate: block on issues, ask on warnings, proceed if clean.
