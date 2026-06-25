---
name: run-orca-sub-app
description: Use Claude Desktop (with computer use) to set up and run an Orca sub-app locally. Installs Bun if missing, builds the app, and starts the local server — no terminal knowledge required.
---

# Run Orca Sub-App

You are helping a non-technical user set up and run an Orca sub-app on their computer. Use computer use to complete every step — the user should not need to touch the terminal themselves.

## Step 1 — Find the app folder

Ask the user:

> "What is the name of your app folder, and where is it saved? For example: a folder called `employee-onboarding` on the Desktop."

If they are unsure, use computer use to open File Explorer (Windows) or Finder (Mac) and help them locate it.

## Step 2 — Open a terminal

- **Windows:** Open PowerShell — press Win+R, type `powershell`, press Enter
- **Mac:** Open Terminal — press Cmd+Space, type "Terminal", press Enter

## Step 3 — Check if Bun is installed

Run:

```
bun --version
```

If it prints a version number, Bun is already installed — skip to Step 4.

If the command is not found, install Bun:

- **Windows:**
  ```
  powershell -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
  ```
  After installation, close and reopen PowerShell, then set the path:
  ```
  $env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
  ```

- **Mac:**
  ```
  curl -fsSL https://bun.sh/install | bash
  ```
  After installation, close and reopen Terminal.

## Step 4 — Navigate to the app folder

Run `cd` followed by the full path to the app folder. For example:

- **Windows:** `cd C:\Users\YourName\Desktop\employee-onboarding`
- **Mac:** `cd ~/Desktop/employee-onboarding`

## Step 5 — Install, build, and serve

Run each command and wait for it to finish before running the next:

```
bun install
bun run build
bunx serve dist --cors -l 4174
```

If `bun run build` fails, read the error output and fix the issue before continuing.

## Step 6 — Confirm with the user

When the server is running, tell the user:

> "Your app is running at http://localhost:4174. Keep this window open — closing it will stop the app. You can now go to the Orca platform and register your app."

## Notes

- The terminal window must stay open for the app to remain accessible to Orca
- If Bun installation fails due to permissions on Windows, try reopening PowerShell as Administrator (right-click → Run as administrator) and repeat Step 3
- If the build fails with TypeScript errors, read them aloud to the user and ask if they want help fixing them
