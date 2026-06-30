---
name: guide-react-app
description: Interactively collects app name and description from the user, then runs all steps to create and build the Orca sub-app automatically. No UI required.
---

# Create an Orca Sub-App

## Step 1 — Collect app name

Ask the user this exact question and wait for their reply before doing anything else:

> What would you like to name your app? (use kebab-case, e.g. `leave-tracker`)

Store the reply as `APP_NAME`.

## Step 2 — Collect app description

Once you have `APP_NAME`, ask this exact question and wait for their reply:

> What does your app do? (one or two sentences is fine)

Store the reply as `DESCRIPTION`.

## Step 3 — Start immediately

Do not summarise, confirm, or ask further questions. Fetch and follow the full build instructions at:

```
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/create-orca-sub-app/SKILL.md
```

Use the `APP_NAME` and `DESCRIPTION` collected above as the skill inputs and run every step automatically.
