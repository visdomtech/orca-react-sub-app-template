---
name: guide-react-app
description: Receives app name and description from the user message, then runs all steps to create and build the Orca sub-app automatically. No UI required.
---

# Create an Orca Sub-App

## Step 1 — Parse inputs

Extract from the user message:

- `APP_NAME` — the value after `App name:` (must be kebab-case, no spaces, e.g. `leave-tracker`)
- `DESCRIPTION` — the value after `What it does:`

If either value is missing or blank, ask the user for it before continuing. Do not proceed with placeholders.

## Step 2 — Start immediately

Do not summarise, confirm, or ask follow-up questions. Fetch and follow the full build instructions at:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/create-orca-sub-app/SKILL.md
```

Use the `APP_NAME` and `DESCRIPTION` extracted above as the skill inputs and run every step automatically.
