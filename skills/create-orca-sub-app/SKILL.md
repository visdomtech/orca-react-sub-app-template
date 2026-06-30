---
name: create-orca-sub-app
description: Clone the Orca sub-app template, configure it with the app name, build it, and start the local server. Called automatically from the guide UI after the user fills in their app name and description.
---

# Create Orca Sub-App

## Inputs

Received from `guide-react-app`:

- `APP_NAME` — kebab-case identifier (e.g. `invoice-viewer`)
- App description — used when registering in Orca

Derived values:

| Variable | Rule | Example |
|---|---|---|
| `APP_NAME` | input | `invoice-viewer` |
| `DISPLAY_NAME` | Title-cased words | `Invoice Viewer` |
| `ROUTE` | `/orca/APP_NAME` | `/orca/invoice-viewer` |

---

## Step 1 — Check and install prerequisites

Check each tool and install it if missing. Do not skip this step even if you think the tool is already installed.

### Git

```bash
git --version
```

If not found, install:

**Windows:**
```powershell
winget install --id Git.Git -e --source winget
```
If `winget` is unavailable, download and run the installer silently:
```powershell
$installer = "$env:TEMP\git-installer.exe"
Invoke-WebRequest "https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/Git-2.47.0-64-bit.exe" -OutFile $installer
Start-Process $installer -ArgumentList "/SILENT /NORESTART" -Wait
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"
```

**Mac:**
```bash
xcode-select --install
```
Or with Homebrew if Xcode tools are already installed:
```bash
brew install git
```

**Linux (Debian / Ubuntu):**
```bash
sudo apt-get update && sudo apt-get install -y git
```
**Linux (CentOS / RHEL / Fedora):**
```bash
sudo dnf install -y git
```

After installing, verify with `git --version` before continuing.

---

### Bun

```bash
bun --version
```

If not found, install:

**Mac / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
$env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
```

After installing, verify with `bun --version` before continuing.

---

## Step 2 — Clone the template

Save to the user's Desktop by default. No need to ask.

**Mac / Linux:**
```bash
git clone https://github.com/visdomtech/orca-react-sub-app-template.git ~/Desktop/{{APP_NAME}}
```

**Windows:**
```powershell
git clone https://github.com/visdomtech/orca-react-sub-app-template.git "$env:USERPROFILE\Desktop\{{APP_NAME}}"
```

---

## Step 3 — Set the app name

Two files need updating inside the cloned folder:

**`package.json`** — change the `name` field:
```json
"name": "{{APP_NAME}}"
```

**`vite.config.ts`** — change the federation `name`:
```ts
federation({
  name: "{{APP_NAME}}",
  ...
})
```

The federation `name` must be globally unique across all running sub-apps.

---

## Step 3b — Generate feature code

Compute these derived values before continuing:

| Variable | Rule | Example |
|---|---|---|
| `COMPONENT_NAME` | PascalCase of APP_NAME | `InvoiceViewer` |
| `FEATURE_NAME` | camelCase of APP_NAME | `invoiceViewer` |

Then follow **scaffold-orca-sub-app** to generate the feature-specific source files tailored to the user's app description.

---

## Step 4 — Install and build

Run from inside the cloned folder. Wait for each command to finish.

```bash
bun install
bun run build
```

If `bun run build` fails with TypeScript errors, fix them before continuing — `bun run typecheck` lists them all.

---

## Step 5 — Create the deployment zip

Zip only the `dist/` folder — that's all the remote server needs to serve.

**Mac / Linux:**
```bash
cd ~/Desktop
zip -r {{APP_NAME}}.zip {{APP_NAME}}/dist
```

**Windows:**
```powershell
Compress-Archive -Path "$env:USERPROFILE\Desktop\{{APP_NAME}}\dist" -DestinationPath "$env:USERPROFILE\Desktop\{{APP_NAME}}.zip" -Force
```

Tell the user:
> "Your deployment zip is saved as **{{APP_NAME}}.zip** on your Desktop. Upload it to your server, extract the `dist/` folder, and serve `app.js` with CORS enabled. Then update the Remote URL in Orca to point to your server."

---

## Step 6 — Start the local server

```bash
bunx serve dist --cors -l 4174
```

Leave the server running. Closing the terminal stops the app.

---

## Step 7 — Register in Orca

Follow **register-orca-sub-app** to show the completed registration table.

---

## Checklist

Before declaring done:

- [ ] `git --version` and `bun --version` both succeed
- [ ] `name` in `vite.config.ts` and `package.json` both equal `APP_NAME`
- [ ] `bun run build` succeeded — `dist/app.js` exists
- [ ] Deployment zip created on Desktop as `{{APP_NAME}}.zip`
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
