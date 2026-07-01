---
name: build-orca-sub-app
description: Install dependencies, build, start the local server, and create a zip archive for an Orca sub-app. Called by create-orca-sub-app after scaffolding. Also usable standalone when rebuilding an existing app.
---

# Build Orca Sub-App

Installs dependencies, builds the project, starts the local server, and creates a zip file. Run every command from inside the app folder.

---

## Step 1 — Check Bun

```bash
bun --version
```

If the command is not found, install Bun:

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

---

## Step 2 — Install, build, and serve

Run these in order. Wait for each to finish before running the next.

```bash
bun install
bun run build
bunx serve dist --cors -l 4174
```

If `bun run build` fails with TypeScript errors, fix them before continuing — `bun run typecheck` lists them all.

Leave the server running. Closing the terminal stops the app.

---

## Step 3 — Create the zip file

Create a zip of the source files (excluding `dist`, `node_modules`, and `.git`) next to the app folder. The host builds the app from source when you upload this zip.

**Mac / Linux** (run from the parent folder):
```bash
cd ..
zip -r {{APP_NAME}}.zip {{APP_NAME}} \
  --exclude '{{APP_NAME}}/dist/*' \
  --exclude '{{APP_NAME}}/node_modules/*' \
  --exclude '{{APP_NAME}}/.git/*'
```

**Windows (PowerShell)** (run from the parent folder):
```powershell
$src = "{{APP_NAME}}"
$out = "{{APP_NAME}}.zip"
Get-ChildItem -Path $src -Recurse |
  Where-Object { $_.FullName -notmatch '\\dist\\' -and $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' } |
  Compress-Archive -DestinationPath $out -Force
```

---

## Step 4 — Confirm with the user

Tell the user:

> "Your app is built and running at **http://localhost:4174**. Keep this window open — closing it stops the app.
>
> I've also saved **{{APP_NAME}}.zip** next to your app folder. Upload it to Orca via **Builds → New Build** and the host will build it automatically."
