---
name: build-orca-sub-app
description: Install dependencies, build, create a zip archive, and serve the built bundle for host testing. Steps 1–3 are the canonical install/build/zip sequence — create-orca-sub-app delegates to those steps after scaffolding. Also usable standalone to rebuild an existing app.
---

# Build Orca Sub-App

Installs dependencies, builds the project, creates a zip for uploading, and serves the built bundle for Orca host integration testing. Run every command from inside the app folder.

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

## Step 2 — Install and build

Run these in order. Wait for each to finish before running the next.

```bash
bun install
bun run build
```

If `bun run build` fails with TypeScript errors, fix them before continuing — `bun run typecheck` lists them all.

---

## Step 3 — Create the zip file

Create a zip of the source files (excluding `dist`, `node_modules`, and `.git`) next to the app folder. The host builds the app from source when you upload this zip.

**Mac / Linux** (run from the parent folder):
```bash
cd ..
zip -r {{APP_NAME}}.zip {{APP_NAME}} \
  --exclude '*/dist/*' \
  --exclude '*/node_modules/*' \
  --exclude '*/.git/*' \
  --exclude '*/.mf/*'
```

**Windows (PowerShell)** (run from the parent folder):
```powershell
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$appDir = Join-Path $PWD "{{APP_NAME}}"
$tmpZip = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "{{APP_NAME}}-$(Get-Random).zip")
$outZip = Join-Path $PWD "{{APP_NAME}}.zip"
$skip   = @('dist', 'node_modules', '.git', '.mf')

$zipFile = [System.IO.Compression.ZipFile]::Open($tmpZip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -Path $appDir -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($appDir.Length + 1)
        if (-not ($rel -split '\\' | Where-Object { $skip -contains $_ })) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zipFile, $_.FullName,
                '{{APP_NAME}}/' + $rel.Replace('\', '/'),
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    }
} finally {
    $zipFile.Dispose()
}

if (Test-Path $outZip) { Remove-Item $outZip -Force }
Move-Item $tmpZip $outZip -Force
Write-Host "Created: $outZip"
```

---

## Step 4 — Serve the built bundle

Start the static server so the Orca host can load the app for integration testing:

```bash
bunx serve dist --cors -l 4174
```

Leave the server running. Closing the terminal stops the app.

---

## Step 5 — Confirm with the user

Tell the user:

> "Your app is built and running at **http://localhost:4174**. Keep this window open — closing it stops the app.
>
> I've also saved **{{APP_NAME}}.zip** next to your app folder. Upload it to Orca via **Builds → New Build** and the host will build it automatically."
