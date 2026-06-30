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

---

### `src/api/secured.ts`

```typescript
export const secured = (path: string) => "/app/api/v1/s" + path;
export const securedv2 = (path: string) => "/app/api/v2/s" + path;
export const securedv3 = (path: string) => "/app/api/v3/s" + path;
export const securedv4 = (path: string) => "/app/api/v4/s" + path;
```

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

## Step 3 — Generate feature code

Fetch and follow:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/scaffold-orca-sub-app/SKILL.md
```

Pass `APP_NAME`, `COMPONENT_NAME`, `FEATURE_NAME`, `DISPLAY_NAME`, and `DESCRIPTION` as inputs.

---

## Step 4 — Install and build

Run from inside the app folder. Wait for each command to finish.

```bash
bun install
bun run build
```

If `bun run build` fails with TypeScript errors, fix them before continuing — `bun run typecheck` lists them all.

---

## Step 5 — Create the zip and offer it for download

Zip the `dist/` folder only — that's what Orca needs. Save the zip inside the app folder.

**Mac / Linux:**
```bash
zip -r ~/{{APP_NAME}}/{{APP_NAME}}.zip ~/{{APP_NAME}}/dist
```

**Windows (PowerShell):**
```powershell
Compress-Archive -Path "$env:USERPROFILE\{{APP_NAME}}\dist" -DestinationPath "$env:USERPROFILE\{{APP_NAME}}\{{APP_NAME}}.zip" -Force
```

Then open the folder so the user can save the zip wherever they like:

**Mac / Linux:**
```bash
open -R ~/{{APP_NAME}}/{{APP_NAME}}.zip
```

**Windows (PowerShell):**
```powershell
explorer.exe /select,"$env:USERPROFILE\{{APP_NAME}}\{{APP_NAME}}.zip"
```

Tell the user:
> "A file explorer window has opened with **{{APP_NAME}}.zip** selected. Save it to a location you'll remember — you'll need to upload it to Orca in the next step."

---

## Step 6 — Start the local server

Run from inside the app folder:

```bash
bunx serve dist --cors -l 4174
```

Leave the server running. Closing the terminal stops the app.

---

## Step 7 — Register in Orca

Fetch and follow:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/register-orca-sub-app/SKILL.md
```

---

## Checklist

Before declaring done:

- [ ] `bun --version` succeeds
- [ ] All boilerplate files written with `{{APP_NAME}}` substituted
- [ ] Feature files generated and typecheck passes
- [ ] `dist/app.js` exists after build
- [ ] Deployment zip saved on Desktop as `{{APP_NAME}}.zip`
- [ ] Server running at `http://localhost:4174`
- [ ] Registration table shown with all fields filled in

---

## Troubleshooting

**React / hooks error after loading in Orca host**
Both the sub-app and host must share the same React singleton. Verify `vite.config.ts` has `react` and `react-dom` in `shared` with `singleton: true, eager: true`.

**CORS error in devtools**
The static server must be started with `--cors`. Restart it if the flag is missing.

**Blank page in the host**
Check that `exposedModule` in the Orca DB entry is exactly `./OrcaApp` — it must match the key in `vite.config.ts`'s `exposes` object.

**CSS missing inside the host**
`./index.css` must be imported in `OrcaApp.tsx`, not `main.tsx`.
