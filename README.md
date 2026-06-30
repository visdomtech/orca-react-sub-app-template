# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Each sub-app is a standalone React project — build it, host it, and Orca loads it automatically without any changes to the main platform.

---

## Step 1 — Create your app

1. Open **Claude Desktop**, click **Code**, and start a new session

2. Copy the block below, replace the two placeholders, and paste it into Claude:

```
Fetch and follow the skill at: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/SKILL.md

App name: YOUR-APP-NAME
What it does: YOUR-APP-DESCRIPTION
```

> **`YOUR-APP-NAME`** — no spaces, e.g. `leave-tracker`
> **`YOUR-APP-DESCRIPTION`** — one sentence describing what the app does, e.g. `A checklist for new employees to complete their onboarding tasks.`

Claude fetches the skill and runs every command automatically. No terminal needed.

---

## Step 2 — Register with Orca

After Claude finishes, go to **Orca → Settings → Apps → Add App** and fill in:

| Field | Value |
|---|---|
| Remote URL | `http://localhost:4174/app.js` |
| Exposed Module | `./OrcaApp` |
| Route | `/orca/YOUR-APP-NAME` |
| Title | Your App Title |
| Icon ID | `apps` |
| Icon Background | `bg-indigo-500` |

Then press **Ctrl+Shift+R** to reload Orca and see your app.
