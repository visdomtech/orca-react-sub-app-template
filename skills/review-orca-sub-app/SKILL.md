---
name: review-orca-sub-app
description: Automated advisory code review for generated Orca sub-apps. Checks generated source files against AGENTS.md routing rules, API patterns, UX completeness, and security. Produces a structured report but never blocks the build pipeline. Called by create-orca-sub-app after scaffold-orca-sub-app completes.
---

# Review Orca Sub-App

Read the generated source files and check them against the rules below. This review is **advisory only** — findings are reported to the user but the pipeline always continues.

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
| No extra packages added to `shared` beyond `react` and `react-dom` | ⚠️ Warning |
| `src/OrcaApp.tsx` has `export default OrcaApp` | 🔴 Issue |

### Category B — Routing

| Check | Severity |
|---|---|
| `OrcaApp.tsx` does NOT import `BrowserRouter`, `HashRouter`, or call `createBrowserRouter` | 🔴 Issue |
| Routing uses `useRoutes()` or `<Routes>` (hooks into host router) | 🔴 Issue |
| `OrcaApp` accepts `basename?: string` prop | 🔴 Issue |
| `basename` is stripped from `useLocation().pathname` before passing to `useRoutes` | 🔴 Issue |

### Category C — Navigation

| Check | Severity |
|---|---|
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

## Step 4 — Return to the pipeline

After outputting the report, return control to `create-orca-sub-app`. Do **not** stop or error — the build pipeline continues regardless of findings.
