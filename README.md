# Orca React Sub-App Template

A React micro-frontend template for building Orca sub-apps using Vite Module Federation.

Sub-apps are independently developed, built, and deployed. The Orca host loads them dynamically at runtime — no host rebuild required when a sub-app ships.

---

## How it works

```
orca-react-sub-app-template/
├── src/
│   ├── OrcaApp.tsx          ← exported component (loaded by host)
│   ├── main.tsx             ← standalone dev entry (not used by host)
│   ├── api/                 ← httpClient, secured(), shared types
│   └── features/hello/      ← example feature (replace with yours)
├── vite.config.ts           ← federation config: exposes ./OrcaApp as app.js
└── dist/
    └── app.js               ← built remote entry (serve this)
```

The host discovers sub-apps from the database registry (`/orca/apps` API). For each entry with a `remoteUrl`, it:

1. Calls `loadRemoteModule(remoteUrl, exposedModule)` at bootstrap
2. Registers a lazy route at the configured `route` path
3. Renders `<OrcaApp />` as a React component inside the host's provider tree

React and ReactDOM are **shared singletons** — the host provides one instance used by all sub-apps.

---

## Local development

### Prerequisites

- [Bun](https://bun.sh/) installed
- Orca host running locally (`bun run dev` from `frontend/orca/` in the main repo)

### Run standalone

```bash
bun install
bun run dev
```

Opens at `http://localhost:4173` — the sub-app runs in isolation without the host.

### Load inside the host (end-to-end)

**1. Build**

```bash
bun run build
```

Output: `dist/app.js`

**2. Serve with CORS**

```bash
bunx serve dist --cors -l 4174
```

The remote entry is now at `http://localhost:4174/app.js`.

> The `--cors` flag is required because the host runs on a different port.

**3. Register via sysadmin UI**

Open the host and go to `/sysadmin/orca/apps`. Create a new entry:

| Field | Value |
|---|---|
| ID | `hello` |
| Route | `/orca/hello` |
| Title | `Hello Sub-App` |
| Description | Any short description |
| Remote URL | `http://localhost:4174/app.js` |
| Exposed Module | `./OrcaApp` |
| Icon BG | `bg-indigo-500` |
| Admin Only | false |

**4. Hard-refresh the host**

Routes are registered at bootstrap. A full page reload is required after adding the DB entry.

---

## Building your own sub-app

1. Copy this repo to a new directory (or clone it as a new repo)
2. Rename the federation `name` in `vite.config.ts` — must be unique per sub-app
3. Rename `package.json` `name` to match
4. Replace the `src/features/hello/` example with your feature
5. Update `src/OrcaApp.tsx` to render your feature's root page
6. Build, serve, and register as above

### vite.config.ts key settings

```typescript
federation({
  name: "my-orca-app",        // unique — no spaces, no collisions
  filename: "app.js",          // host expects this filename
  exposes: {
    "./OrcaApp": "./src/OrcaApp.tsx",  // host loads this module
  },
  shared: {
    react: { singleton: true, requiredVersion: "^19", eager: true },
    "react-dom": { singleton: true, requiredVersion: "^19", eager: true },
  },
})
```

### Feature structure

Follow the same pattern used in the main Orca React app:

```
src/features/myFeature/
├── api.ts          # Pure async fetch functions (httpClient + secured())
├── types.ts        # TypeScript interfaces
├── queryKeys.ts    # React Query cache key factories
├── hooks.ts        # useQuery / useMutation wrappers
├── pages/          # Page-level components
└── components/     # Reusable components for this feature
```

### API calls

Use the pre-built `httpClient` and `secured()` helpers:

```typescript
import { httpClient } from "../../api/httpClient";
import { secured } from "../../api/secured";
import type { Response } from "../../api/types";

export async function fetchMyData(): Promise<MyData> {
  const response = await httpClient.get<Response<MyData>>(
    secured("/my-feature/data")
  );
  return response.data;
}
```

The session cookie is forwarded automatically via `credentials: "include"`. No token management required in the sub-app — the host handles session refresh.

---

## Commands

```bash
bun run dev        # Standalone dev server (port 4173)
bun run build      # Type-check + build to dist/app.js
bun run typecheck  # Type-check only (no build)
bun run preview    # Preview the built bundle locally
```

---

## Host requirements

For React sub-apps to share React with the host, the host's `vite.config.ts` must include:

```typescript
import federation from "@originjs/vite-plugin-federation";

federation({
  name: "orca-host",
  remotes: {},  // empty — remotes are registered dynamically at runtime
  shared: {
    react: { singleton: true, requiredVersion: "^19", eager: true },
    "react-dom": { singleton: true, requiredVersion: "^19", eager: true },
  },
})
```

Without this, each sub-app bundles its own React, causing the "hooks can only be called inside a function component" error at runtime.

---

## Troubleshooting

**Card doesn't appear on Orca home**
Routes are cached at bootstrap. Hard-refresh the host after adding the DB entry.

**`Failed to fetch` or CORS error**
Start the static server with `--cors`. Restart it if the error persists.

**Route renders blank**
Check that `exposedModule` in the DB entry exactly matches the `exposes` key in `vite.config.ts` (e.g. `./OrcaApp`). Check the browser console for federation errors.

**React hooks error after loading in host**
`react` and `react-dom` must be shared singletons. Check both the sub-app's and host's vite configs. Both must declare these as `singleton: true`.

**CSS not applied inside host**
Import `./index.css` in `OrcaApp.tsx` — not `main.tsx`. The federation plugin injects the CSS when the remote module loads.
