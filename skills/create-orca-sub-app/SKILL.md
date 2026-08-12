---
name: create-orca-sub-app
description: Create all app files from scratch, build, zip, and start the local server. No git clone required. Called by guide-react-app after parsing the app name and description.
---

# Create Orca Sub-App

## Inputs

- `APP_NAME` — kebab-case identifier (e.g. `invoice-viewer`)
- `DESCRIPTION` — one sentence describing what the app does

Derived values (compute before starting):

| Variable | Rule | Example |
|---|---|---|
| `DISPLAY_NAME` | Title-cased words from APP_NAME | `Invoice Viewer` |
| `ROUTE` | `/orca/APP_NAME` | `/orca/invoice-viewer` |
| `COMPONENT_NAME` | PascalCase of APP_NAME | `InvoiceViewer` |
| `FEATURE_NAME` | camelCase of APP_NAME | `invoiceViewer` |

---

## Step 1 — Check and install Bun

```bash
bun --version
```

If not found, install:

**Mac / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
$env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
```

Verify with `bun --version` before continuing.

---

## Step 2 — Create the app folder and boilerplate files

Create the folder in the user's home directory:

**Mac / Linux:** `~/{{APP_NAME}}/`
**Windows:** `$env:USERPROFILE\{{APP_NAME}}\`

Then write every file below exactly as shown, substituting `{{APP_NAME}}` throughout.

---

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
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.62.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@module-federation/vite": "^1.16.12",
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  }
}
```

---

### `vite.config.ts`

```typescript
import { resolve } from "path";
import { federation } from "@module-federation/vite";
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
        react: { singleton: true, requiredVersion: "^19" },
        "react-dom": { singleton: true, requiredVersion: "^19" },
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

---

### `vitest.config.ts`

A separate Vite config for tests that omits the Module Federation plugin (federation only applies to the production build, not tests).

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
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

### `src/index.css`

```css
@import "tailwindcss";
```

---

### `src/test-setup.ts`

```typescript
import "@testing-library/jest-dom";
```

---

### `src/api/httpClient.ts`

```typescript
const DEFAULT_TIMEOUT = 30_000;

export class HttpError extends Error {
  response?: { code?: string; error?: string };

  constructor(message: string, response?: { code?: string; error?: string }) {
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
      let errorBody: { code?: string; error?: string } | undefined;
      try {
        errorBody = await response.json();
      } catch {
        // response body is not JSON
      }
      throw new HttpError(
        errorBody?.error ?? `HTTP ${response.status}: ${response.statusText}`,
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

---

### `src/api/types.ts`

```typescript
// ─── Orca host API types ──────────────────────────────────────────────────────

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

// ─── OrcaAgents DB types ──────────────────────────────────────────────────────

export type DocData = Record<string, unknown>;

// ─── OrcaAgents Auth types ────────────────────────────────────────────────────

export interface UserInfo {
  workspaceId: string;
  email: string;
  subject: string;
}

// ─── OrcaAgents Workflow types ────────────────────────────────────────────────

export interface WorkflowAttachment {
  filename: string;
  contentType: string;
  data: string; // base64-encoded
  inline?: boolean;
}

export interface WorkflowSendEmailRequest {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: WorkflowAttachment[];
}

export interface WorkflowSendEmailResponse {
  sent: boolean;
  messageId: string;
}

// ─── OrcaAgents Approval types ────────────────────────────────────────────────

export type ApprovalStatus = "FUTURE" | "PENDING" | "COMPLETED" | "CANCELLED";
export type ApprovalDecision = "UNDECIDED" | "APPROVED" | "REJECTED";

export interface ApprovalInstance {
  instanceId: number;
  workspaceId: string;
  definitionId?: number;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  currentPhaseId?: number;
  createdBy: string;
  created: string; // ISO 8601
  updated: string;
}

export interface ApprovalApprover {
  approverId: number;
  instanceId: number;
  phaseId: number;
  userId: string;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  decisionTime?: string;
  decisionTakenBy?: string;
}

export interface ApprovalPhase {
  phaseId: number;
  instanceId: number;
  previousPhaseId?: number;
  minRequiredApprovers: number;
  status: ApprovalStatus;
  startTime?: string;
  endTime?: string;
  approvers: ApprovalApprover[];
}

export interface ApprovalDecisionResult {
  instance: ApprovalInstance;
  phases: ApprovalPhase[];
}

export interface ApprovalProcessSpec {
  definitionId?: number;
  createdBy: string;
  phases: {
    approvers: string[];
    minRequiredApprovers: number;
  }[];
}

export interface ApprovalUserDef {
  description?: string;
  conditionSrc?: string;
  userId: string;
}

export interface ApprovalPhaseDef {
  type: "manual" | "dynamic";
  description?: string;
  conditionSrc?: string;
  minRequiredApprovers: number;
  approvers?: ApprovalUserDef[];
  variant?: string;
  data?: unknown;
}

export interface ApprovalFallbackStrategy {
  type: "approve" | "reject" | "manual";
  phases?: ApprovalPhaseDef[];
}

export interface ApprovalBlueprint {
  description?: string;
  conditionSrc?: string;
  phases: ApprovalPhaseDef[];
  fallbackStrategy: ApprovalFallbackStrategy;
}

export interface ApprovalDefinition {
  definitionId: number;
  workspaceId: string;
  name: string;
  description: string;
  blueprint: ApprovalBlueprint;
  created: string;
  updated: string;
}
```

---

### `src/shared/OrcaHostContext.tsx`

```tsx
import { createContext, useContext, type ComponentType } from "react";

export interface ApprovalPhaseSpec {
  approvers: string[];
  minRequiredApprovers: number;
  conditions?: string;
  description?: string;
}

export interface ApprovalFlowProps {
  objectType: string;
  objectId: string;
  definitionId?: number;
  phases?: ApprovalPhaseSpec[];
  currentUserId?: string;
  onApproved?: () => void;
  onRejected?: () => void;
  adminMode?: boolean;
  displayMode?: "full" | "compact";
}

export interface OrcaHostComponents {
  ApprovalFlow?: ComponentType<ApprovalFlowProps>;
}

const OrcaHostContext = createContext<OrcaHostComponents>({});

export const OrcaHostProvider = OrcaHostContext.Provider;

export function useOrcaHost(): OrcaHostComponents {
  return useContext(OrcaHostContext);
}
```

---

### `src/shared/SubAppLink.tsx`

```tsx
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { useHref, useNavigate } from "react-router";

export const SubAppBasenameContext = createContext<string>("");

export function useSubAppBasePath(): string {
  return useContext(SubAppBasenameContext);
}

export function useSubAppRouterBasePath(): string {
  const basename = useSubAppBasePath();
  const routerHrefRoot = useHref("/");
  const routerBasename = routerHrefRoot.endsWith("/")
    ? routerHrefRoot.slice(0, -1)
    : routerHrefRoot;
  return useMemo(() => {
    if (routerBasename && basename.startsWith(routerBasename)) {
      return basename.slice(routerBasename.length) || "/";
    }
    return basename;
  }, [basename, routerBasename]);
}

interface SubAppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children?: ReactNode;
}

export function SubAppLink({ to, children, onClick, ...rest }: SubAppLinkProps) {
  const basename = useSubAppBasePath();
  const navigate = useNavigate();
  const routerHrefRoot = useHref("/");
  const routerBasename = routerHrefRoot.endsWith("/")
    ? routerHrefRoot.slice(0, -1)
    : routerHrefRoot;

  const href = `${basename}${to}`;
  const navigatePath = useMemo(() => {
    if (routerBasename && href.startsWith(routerBasename)) {
      return href.slice(routerBasename.length) || "/";
    }
    return href;
  }, [href, routerBasename]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      navigate(navigatePath);
    },
    [navigatePath, navigate, onClick],
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
```

---

## Step 2.5 — Add the code review gate

Fetch and follow:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/add-pre-zip-check/SKILL.md
```

Run from inside the app folder. This creates `scripts/pre-zip-check.mjs` and patches `postbuild` into `package.json`.

---

## Step 3 — Generate feature code

Fetch and follow:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/scaffold-orca-sub-app/SKILL.md
```

Pass `APP_NAME`, `COMPONENT_NAME`, `FEATURE_NAME`, `DISPLAY_NAME`, and `DESCRIPTION` as inputs.

---

## Step 4 — Install, build, test, review, and zip

Fetch and follow **Steps 1–4** (including Step 3.5 — Code Review Gate) of:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/build-orca-sub-app/SKILL.md
```

Stop after Step 4 (zip created). Do **not** follow Step 5 (serve) or Step 6 (confirm) — the dev server and deliverables summary are handled below.

> If Step 3.5 blocks due to 🔴 Issues, the zip will not be created and the flow stops here. The user must fix the issues and ask to build again.

---

## Step 5 — Start the local dev server

Run from inside the app folder (leave it running in the background):

**Mac / Linux:**
```bash
bun run dev &
```

**Windows (PowerShell):**
```powershell
Start-Process bun -ArgumentList "run", "dev" -NoNewWindow
```

---

## Step 6 — Present deliverables

Open the zip folder, then show all three deliverables in a **single message**. Never split them across separate messages.

Open the folder with the zip selected:

**Mac / Linux:**
```bash
open -R ~/{{APP_NAME}}/{{APP_NAME}}.zip
```

**Windows (PowerShell):**
```powershell
explorer.exe /select,"$env:USERPROFILE\{{APP_NAME}}\{{APP_NAME}}.zip"
```

Then output this summary with all placeholders substituted:

---

**Your app is ready. Here are your deliverables:**

**1 — Registration info**

Go to **System Admin → Sub-App Registry**, click **Add App**, and fill in the fields below. Leave **Remote URL blank** — it is set automatically after the build succeeds.

| Field | Value |
|---|---|
| ID | `{{APP_NAME}}` |
| Route | `/orca/{{APP_NAME}}` |
| Title | `{{DISPLAY_NAME}}` |
| Description | *(one sentence from the user's original description)* |
| Icon ID | *(pick best fit: `assignment` `checklist` `groups` `star` `security` `apps` `inventory` `person` `work`)* |
| Icon Background | `bg-indigo-500` |
| Badge | *(leave empty)* |
| Display Order | `0` |
| Admin Only | unchecked |
| Remote URL | *(leave blank)* |
| Exposed Module | `./OrcaApp` |

**2 — Local preview**

[http://localhost:4173](http://localhost:4173) — opens with mock data so you can review the UI without the Orca backend.

**3 — Zip file**

A file explorer window has opened with **{{APP_NAME}}.zip** selected. Save it somewhere you'll find it — you'll need to upload it to Orca in the next step.

---

---

## Checklist

Before declaring done:

- [ ] `bun --version` succeeds
- [ ] All boilerplate files written with `{{APP_NAME}}` substituted (including `vitest.config.ts`, `src/test-setup.ts`, `src/shared/`)
- [ ] `scripts/pre-zip-check.mjs` created and `postbuild` patched into `package.json` (via `add-pre-zip-check`)
- [ ] Feature files generated (including `{{COMPONENT_NAME}}Page.test.tsx`) and typecheck passes
- [ ] Code review gate passed — no 🔴 Issues blocking zip creation (warnings resolved or user-skipped)
- [ ] `bun test` passes
- [ ] `dist/app.js` exists after build
- [ ] Zip created at `~/{{APP_NAME}}/{{APP_NAME}}.zip`
- [ ] Dev server running at `http://localhost:4173`
- [ ] All three deliverables shown in a single message: registration table, local URL, zip file

---

## Troubleshooting

**React / hooks error after loading in Orca host**
Both the sub-app and host must share the same React singleton. Verify `vite.config.ts` has `react` and `react-dom` in `shared` with `singleton: true`.

**CORS error in devtools**
The static server must be started with `--cors`. Restart it if the flag is missing.

**Blank page in the host**
Check that `exposedModule` in the Orca DB entry is exactly `./OrcaApp` — it must match the key in `vite.config.ts`'s `exposes` object.

**CSS missing inside the host**
`./index.css` must be imported in `OrcaApp.tsx`, not `main.tsx`.

**Zip upload fails with "appears to use backslashes as path separators"**
This happens on Windows when `Compress-Archive` is used instead of the ZipArchive-based script in `build-orca-sub-app` Step 3 — `Compress-Archive` writes native backslash separators into zip entries, which Linux-based unpackers reject. Always use the .NET ZipArchive approach on Windows.
