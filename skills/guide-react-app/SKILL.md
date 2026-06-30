---
name: guide-react-app
description: Interactively collects app name and description from the user, then runs all steps to create and build the Orca sub-app automatically. No UI required.
---

# Create an Orca Sub-App

## Step 1 — Collect app name

Send ONLY this message and stop. Do not ask anything else. Do not proceed to Step 2. Wait for the user's reply:

> What would you like to name your app? (use kebab-case, e.g. `leave-tracker`)

Store the reply as `APP_NAME`. Only after receiving `APP_NAME` move to Step 2.

## Step 2 — Collect app description

Send ONLY this message and stop. Do not proceed to Step 3. Wait for the user's reply:

> What does your app do? (one or two sentences is fine)

Store the reply as `DESCRIPTION`. Only after receiving `DESCRIPTION` move to Step 3.

## Step 3 — Build the app

Fetch the build guide below. It contains step-by-step instructions to scaffold the project files, install dependencies with Bun, run a TypeScript build, zip the `dist/` output, and start a local dev server. Follow every step using `APP_NAME` and `DESCRIPTION` as inputs.

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/create-orca-sub-app/SKILL.md
```
