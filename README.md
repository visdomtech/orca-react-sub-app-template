# Orca React Sub-App Template

A React micro-frontend template for building standalone Orca sub-apps using Vite Module Federation. Sub-apps live in their own repository, build independently, and plug into the Orca host at runtime — no host rebuild required.

---

## How it works

```
Your sub-app repo                  Orca host (dfapps)
─────────────────────              ──────────────────────────────
src/OrcaApp.tsx  ──build──▶  dist/app.js  ◀──loadRemoteModule()──
```

1. You build the sub-app → `dist/app.js` (the Module Federation remote entry)
2. You serve `dist/` with a static file server (CORS enabled)
3. You register the app in the Orca sysadmin UI with the remote URL
4. The Orca host dynamically loads it at the registered route — no host restart needed

React and ReactDOM are **shared singletons** — the host provides one instance used by all sub-apps.

---

## Step-by-step: creating and connecting a new app

### Step 1 — Create the app

**Option A — AI-generated (recommended)**

Open [claude.ai](https://claude.ai) and start a new conversation. Paste the full contents of [`skills/create-orca-sub-app/SKILL.md`](skills/create-orca-sub-app/SKILL.md) as your first message, then describe your app. The AI will scaffold all files from the template.

**Option B — Clone this template manually**

```bash
git clone https://github.com/visdomtech/orca-react-sub-app-template.git my-app
cd my-app
rm -rf .git
git init
```

Then:
- Rename `name` in `vite.config.ts` (federation name — must be globally unique across all sub-apps)
- Rename `name` in `package.json`
- Replace `src/features/hello/` with your feature code
- Update `src/OrcaApp.tsx` to render your feature's root page

---

### Step 2 — Install and build

```bash
bun install
bun run build
```

Expected output: `dist/app.js` created. If there are TypeScript errors, they surface here — fix them before proceeding.

---

### Step 3 — Serve the bundle with CORS

The Orca host fetches your `app.js` from this server. Keep it running while you test.

```bash
bunx serve dist --cors -l 4174
```

Verify it's reachable: open `http://localhost:4174/app.js` in the browser — you should see JavaScript, not a 404.

> **Do not open `http://localhost:4174` as your app** — it won't have access to the backend APIs. You will access the app through the Orca host in Step 5.

---

### Step 4 — Register in the Orca sysadmin UI

In the Orca host, go to `/orca/sysadmin/apps` and click **Add App**. Fill in all required fields:

| Field | Example value | Notes |
|---|---|---|
| **ID** | `my-app` | Kebab-case, unique |
| **Route** | `/orca/my-app` | Must start with `/orca/` |
| **Title** | `My App` | Displayed on home page card |
| **Description** | `Short description of what this does.` | Required — shown on home page card |
| **Icon ID** | `assignment` | Any MUI icon name (e.g. `assignment`, `star`, `apps`, `checklist`) |
| **Icon Background** | `bg-indigo-500` | Any Tailwind `bg-*` class |
| **Badge** | *(leave empty)* | Optional label on the card (e.g. `Beta`, `New`) |
| **Display Order** | `0` | Lower numbers appear first |
| **Admin Only** | unchecked | Check to hide from non-admin users |
| **Remote URL** | `http://localhost:4174/app.js` | URL to your served `app.js` |
| **Exposed Module** | `./OrcaApp` | Must match the key in `vite.config.ts` `exposes` |

> All of ID, Route, Title, Description, Icon ID, and Icon Background are **required**. Leaving Description, Icon ID, or Icon Background empty will cause a 500 error on save.

---

### Step 5 — Hard-refresh the Orca host

Routes are registered at bootstrap. After saving the DB entry, do a **full page reload** (`Ctrl+Shift+R`) on the Orca host.

You should now see:
- A card for your app on the Orca home page (`/orca/home`) under **Extensions**
- Clicking the card navigates to your route and renders `OrcaApp`

---

## Data storage

Sub-apps use the **Orca agents Firestore API** for persistence — no backend endpoint needed. Data is automatically scoped per workspace.

```typescript
// api.ts
const DOC_ID = "apps/my-app/data/state";   // must have 4 path segments (see below)

export async function fetchState(): Promise<MyState> {
  try {
    const data = await httpClient.post<MyState>(
      "/orcaagents/db/workspace/doc/read",
      { docId: DOC_ID }
    );
    if (!data) return { /* safe default */ };
    return data;
  } catch {
    return { /* safe default */ };
  }
}

export async function saveState(state: MyState): Promise<void> {
  await httpClient.post("/orcaagents/db/workspace/doc/write", {
    docId: DOC_ID,
    data: state,
  });
}
```

> **DocId rule — 4 segments required.** Firestore paths alternate collection/document. Use `apps/<app-name>/<subcollection>/<document>`:
> - ✅ `apps/my-app/data/state`
> - ✅ `apps/my-app/config/settings`
> - ❌ `apps/my-app/state` — 3 segments, points to a subcollection, returns 500

For REST backend calls (when you need server-side logic), use `secured()`:

```typescript
import { secured } from "../../api/secured";

const response = await httpClient.get<Response<MyData>>(secured("/my-app/items"));
```

---

## Feature structure

Follow the same pattern used in the main Orca React app:

```
src/features/myFeature/
├── data.ts         # Hardcoded static definitions (task list, questions, etc.)
├── types.ts        # TypeScript interfaces — item shape + Firestore state shape
├── api.ts          # Firestore read/write functions
├── queryKeys.ts    # React Query cache key factories
├── hooks.ts        # useQuery / useMutation wrappers
├── pages/          # Page-level React components
└── components/     # Reusable UI components for this feature
```

---

## Commands

```bash
bun run dev        # Standalone dev server at http://localhost:4173
bun run build      # Type-check + build to dist/app.js
bun run typecheck  # Type-check only
bun run preview    # Preview the built bundle
```

> `bun run dev` is for UI development in isolation. API calls won't reach the backend unless you add a proxy (see Troubleshooting). For full end-to-end testing, use the build + serve + host flow described above.

---

## Deploying to production

1. Build: `bun run build`
2. Deploy `dist/` to a CDN or static host (S3, GCS, Vercel, etc.)
3. Update the **Remote URL** in the Orca sysadmin UI to the production URL
4. Hard-refresh the Orca host

No host redeployment needed — the host fetches `app.js` from wherever you point it.

---

## Troubleshooting

**Card doesn't appear on the home page**
Hard-refresh the Orca host after registering the app — routes are loaded at bootstrap.

**500 when saving app in sysadmin UI**
Description, Icon ID, and Icon Background are required fields. Fill them all in before saving.

**500 on Firestore read/write**
Your `docId` has an odd number of path segments. Firestore requires even segments (alternating collection/document). Use `apps/<app>/<subcollection>/<doc>` (4 segments).

**App renders blank or shows "Page not found"**
- Confirm `exposedModule` in the DB entry matches the key in `vite.config.ts`'s `exposes` object exactly (e.g. `./OrcaApp`)
- Check the browser console for federation loading errors
- Confirm `http://localhost:4174/app.js` is reachable (CORS header present)

**React hooks error (`Cannot read properties of null (reading 'useEffect')`)**
The sub-app and host are using different React instances. Ensure both `vite.config.ts` files declare `react` and `react-dom` as `singleton: true, eager: true` in the `shared` config.

**`Failed to fetch` or CORS error on API calls**
- The app must be accessed through the Orca host (`http://localhost:3001/orca/my-app`), not directly at `localhost:4174`
- API calls use relative URLs — they resolve against `window.location.origin`, which must be the Orca host
- Ensure `bunx serve dist --cors -l 4174` includes the `--cors` flag

**Standalone dev (`bun run dev`) API calls fail**
Add a proxy to `vite.config.ts` to forward API calls to the Orca host:

```typescript
server: {
  port: 4173,
  proxy: {
    "^/orcaagents/": { target: "http://localhost:3001", changeOrigin: true },
    "^/app/api/": { target: "http://localhost:3001", changeOrigin: true },
  },
},
```

**CSS not applied inside host**
Import `./index.css` in `OrcaApp.tsx` — not in `main.tsx`. The federation plugin injects the CSS when the remote module loads.

---

## Host requirements

The Orca host (`dfapps/frontend/orca`) must have `@originjs/vite-plugin-federation` configured as a host for React sharing to work:

```typescript
federation({
  name: "orca-host",
  remotes: {},
  shared: {
    react: { singleton: true, requiredVersion: "^19", eager: true },
    "react-dom": { singleton: true, requiredVersion: "^19", eager: true },
  },
})
```

This is already configured in the main repo — no changes needed unless you're setting up a new host.
