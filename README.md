# Orca React Sub-App Template

A template for building mini-apps that plug into the Orca platform. Each app lives in its own folder, can be built and shared independently, and shows up as a card on the Orca home page.

---

## How it works

You build your app, put it somewhere accessible (a URL), and tell Orca where to find it. Orca then loads it automatically and shows it on the home page — no changes to the main platform needed.

---

## Getting started

Choose the path that fits you:

- **[I'm not a developer →](#option-1-using-ai-to-create-your-app)** Let AI write the app for you. You just describe what you want.
- **[I'm a developer →](#option-2-building-the-app-yourself)** Clone the template, write your code, and wire it up.

---

## Option 1: Using AI to create your app

You don't need to write any code. Just describe what you want — Claude handles the rest.

### What you need before starting

- [Claude Desktop](https://claude.ai/download) installed on your computer
- Access to the Orca platform

### Step 1 — Create and run your app

1. Open Claude Desktop, select **Code** at the top, and start a new chat
2. Copy the entire contents of [`skills/create-orca-sub-app/SKILL.md`](skills/create-orca-sub-app/SKILL.md) and paste it as your first message
3. In the same message, describe your app. For example:

   > *"Create an employee onboarding checklist app. It should show a list of tasks new employees need to complete, like signing contracts, setting up their laptop, and meeting their team. Each task can be checked off and the progress is saved."*

4. Claude will ask where to save your app folder — your Desktop is a good choice

Claude will create the folder, write all the files, install any required tools, build the app, and start a local server. When it's done, it will tell you the app is ready.

Leave the terminal window that Claude opens running — closing it stops your app.

> This is only for running on your own computer. When you're ready to share with others, see [Deploying to production](#deploying-to-production).

### Step 2 — Add your app to Orca

At the end of Step 1, Claude will give you a table with all the values you need.

1. Open the Orca platform and go to **Settings → Apps** (the address is `/orca/sysadmin/apps`)
2. Click **Add App** and copy the values Claude gave you into the form
3. Click **Create** and refresh the page — your app will appear as a card under **Extensions**.

---

## Option 2: Building the app yourself

For developers who want to write their own code.

### Step 1 — Create the app

**Using AI (recommended even for developers)**

Open [claude.ai](https://claude.ai), paste the contents of [`skills/create-orca-sub-app/SKILL.md`](skills/create-orca-sub-app/SKILL.md), and describe your app. The AI scaffolds all files following the correct patterns.

**Cloning manually**

```bash
git clone https://github.com/visdomtech/orca-react-sub-app-template.git my-app
cd my-app
rm -rf .git && git init
```

Then:
- Set a unique `name` in `vite.config.ts` (the federation name — no two sub-apps can share this)
- Set the same name in `package.json`
- Replace `src/features/hello/` with your feature
- Update `src/OrcaApp.tsx` to render your root page

### Step 2 — Build and serve

```bash
bun install
bun run build
bunx serve dist --cors -l 4174
```

`dist/app.js` is the remote entry. Verify it's reachable at `http://localhost:4174/app.js`.

> Open the app via the Orca host (`http://localhost:3001/orca/my-app`), not directly at `localhost:4174`. The bundle server has no API proxy — all API calls use relative URLs that resolve against the host origin.

### Step 3 — Register in the Orca sysadmin UI

Go to `/orca/sysadmin/apps` → **Add App**:

| Field | Example | Notes |
|---|---|---|
| **ID** | `my-app` | Kebab-case, unique |
| **Route** | `/orca/my-app` | Must start with `/orca/` |
| **Title** | `My App` | Shown on home page card |
| **Description** | `Short description.` | Required |
| **Icon ID** | `assignment` | MUI icon name (`assignment`, `star`, `apps`, `checklist`, `groups`, `security`…) |
| **Icon Background** | `bg-indigo-500` | Any Tailwind `bg-*` class |
| **Badge** | *(optional)* | `Beta`, `New`, etc. |
| **Display Order** | `0` | Lower = appears first |
| **Admin Only** | unchecked | Tick to hide from non-admins |
| **Remote URL** | `http://localhost:4174/app.js` | URL to your served `app.js` |
| **Exposed Module** | `./OrcaApp` | Must match `exposes` key in `vite.config.ts` |

> ID, Route, Title, Description, Icon ID, and Icon Background are all **required**. Leaving any of the last three empty causes a 500 on save.

### Step 4 — Hard-refresh the host

Routes register at bootstrap. Press **Ctrl+Shift+R** after saving the DB entry.

Your app card appears on `/orca/home` under **Extensions**.

---

## Data storage

Sub-apps store data using the built-in Orca agents API — no backend endpoint needed. Data is automatically scoped per workspace.

```typescript
// api.ts
const DOC_ID = "apps/my-app/data/state";  // must have 4 path segments — see rule below

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

> **DocId must have exactly 4 path segments.** The storage system alternates between group names and document names. Use `apps/<app-name>/<group>/<document>`:
> - ✅ `apps/my-app/data/state`
> - ✅ `apps/my-app/config/settings`
> - ❌ `apps/my-app/state` — only 3 segments, causes a 500 error

For REST backend calls, use `secured()`:

```typescript
import { secured } from "../../api/secured";
const response = await httpClient.get<Response<MyData>>(secured("/my-app/items"));
```

---

## Feature structure

```
src/features/myFeature/
├── data.ts         # Hardcoded static content (task list, categories, etc.)
├── types.ts        # TypeScript interfaces
├── api.ts          # Storage read/write functions
├── queryKeys.ts    # React Query cache keys
├── hooks.ts        # Data hooks (merges static content with stored state)
├── pages/          # Page components
└── components/     # Reusable UI components
```

---

## Commands

```bash
bun run dev        # Dev server at http://localhost:4173 (UI only, no backend)
bun run build      # Type-check + build to dist/app.js
bun run typecheck  # Type-check only
bun run preview    # Preview the built bundle
```

---

## Deploying to production

1. `bun run build`
2. Deploy the `dist/` folder to any static host (S3, GCS, Vercel, Netlify, etc.)
3. Update **Remote URL** in the Orca sysadmin UI to the production URL
4. Hard-refresh the Orca host

No changes to the Orca platform needed — it fetches `app.js` from wherever you point it.

---

## Troubleshooting

**My app card doesn't appear on the home page**
Press Ctrl+Shift+R to fully reload Orca after registering the app.

**I get an error when saving the app in the settings form**
Make sure Description, Icon ID, and Icon Background are all filled in — they are required.

**Clicking a button or checkbox gives a 500 error**
Check your storage path (`docId`). It must have 4 parts separated by `/`, like `apps/my-app/data/state`. A path with only 3 parts will always fail.

**The app shows a blank page or "Page not found"**
- Make sure **Exposed Module** in the settings form is exactly `./OrcaApp`
- Make sure the bundle server is still running (`bunx serve dist --cors -l 4174`)
- Open browser DevTools → Console for more detail

**React error about hooks when the app loads in Orca**
Both the sub-app and the Orca host must declare React as a shared singleton in their `vite.config.ts`. This is already set up correctly in this template — if you see this error, check that you haven't removed or modified the `shared` config.

**API calls fail with network errors**
Make sure you're opening the app through the Orca host (e.g. `http://localhost:3001/orca/my-app`), not directly at `localhost:4174`. The bundle server is not a full web server — it can't handle API requests.

**Standalone dev (`bun run dev`) can't reach the backend**
Add a proxy to `vite.config.ts`:

```typescript
server: {
  port: 4173,
  proxy: {
    "^/orcaagents/": { target: "http://localhost:3001", changeOrigin: true },
    "^/app/api/":    { target: "http://localhost:3001", changeOrigin: true },
  },
},
```

**Styles are missing when the app loads inside Orca**
Make sure `./index.css` is imported in `OrcaApp.tsx`, not in `main.tsx`.

---

## Host requirements

The Orca host must have `@originjs/vite-plugin-federation` configured — this is already done in the main repo:

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
