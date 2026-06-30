---
name: guide-react-app
description: Walk a non-technical user through creating a frontend React app using Claude Desktop App as a visual guide. Reads demo-data.json in this folder and presents each step as a clear, human-friendly conversation with visual context. Use when a user has no coding background and wants to build their first React app.
---

# Guide: Build Your First React App (Non-Technical)

## When to Use

- A user says "I want to build a website / app but I don't know how to code"
- A product manager or designer wants to prototype a React frontend
- You're running a demo of Claude Desktop App guiding a non-technical person
- Someone wants a visual, step-by-step walkthrough without terminal fear

## How It Works

This skill reads `demo-data.json` (in the same folder) to load a structured list of
guided steps. Each step has:

- A **plain-English title** the user sees
- A **what-happens** explanation (no jargon)
- A **command** Claude runs on behalf of the user
- An **expected output** snippet so the user knows things worked
- A **screenshot hint** describing what Claude Desktop App should show visually

Claude walks the user through steps one at a time, confirms before proceeding, and
explains any error in plain English before retrying.

---

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `app_name` | Yes | The name the user wants for their app (e.g. "my-portfolio") |
| `destination` | No | Directory to create the app in (defaults to `~/Desktop`) |

---

## Step-by-Step Flow

### 0. Load demo data

```javascript
// Claude reads the step list from demo-data.json
const steps = require('./demo-data.json').steps;
```

### 1. Greet and set expectations

Tell the user in one friendly paragraph:
- What React is (a tool for building websites)
- What will happen in the next ~10 minutes
- That Claude will type all the scary commands for them

> "Great! I'll help you build your first React app. Think of React as LEGO for
> websites — we snap pieces together. I'll handle all the technical parts.
> You just tell me what you want and click Approve when I ask."

### 2. Walk each step from demo-data.json

For each step in `steps`:

1. **Show the step card** — title, plain-English explanation, and the command (greyed out, for info only)
2. **Ask for approval** — "Ready? I'll run this now."
3. **Run the command** via Bash
4. **Show expected vs actual output** — highlight any differences
5. **Confirm success** before moving to the next step

If a step fails:
- Translate the error into plain English
- Suggest the most likely fix
- Ask the user whether to retry or skip

### 3. Open in browser

After all steps complete, open `http://localhost:5173` in the default browser and
say: "Your app is live! Open that tab — you'll see a spinning React logo. That's
YOUR website."

### 4. Celebrate + next steps

Show a short "What you just built" summary and offer three optional next steps:
- "Change the text on the page"
- "Add a button that does something"
- "Deploy it to the internet for free"

---

## Demo Data File

All step content lives in `demo-data.json` next to this skill file. Edit that file
to update steps, expected outputs, or screenshot hints without touching this skill.

Schema:

```json
{
  "steps": [
    {
      "id": 1,
      "title": "Human-readable step title",
      "explanation": "Plain-English description for the user",
      "command": "shell command Claude will run",
      "expected_output_snippet": "key text that should appear in the output",
      "screenshot_hint": "Description of what Claude Desktop App should show visually",
      "duration_seconds": 10
    }
  ]
}
```

---

## Visualization in Claude Desktop App

Claude Desktop App renders tool calls and their outputs inline. This skill is
designed to exploit that: each Bash tool call produces output that Claude narrates
in plain English immediately below. The result is a live, visual log the user can
follow like a recipe.

```
┌─────────────────────────────────────────────────────┐
│  Step 1 of 7: Install Node.js package manager      │
│  ─────────────────────────────────────────────────  │
│  "This installs the toolbox React needs. ~15 sec."  │
│                                                     │
│  > bun install                                      │
│                                                     │
│  ✅ bun install v1.2.x — done in 3.4s              │
│     14 packages installed                           │
│                                                     │
│  ✔ Step complete! Moving to Step 2...              │
└─────────────────────────────────────────────────────┘
```

---

## Error Handling

| Error pattern | Plain-English translation | Auto-fix |
|---------------|--------------------------|----------|
| `ENOENT` / `not found` | "The tool isn't installed yet." | Run install step |
| `EADDRINUSE` | "Another app is using that port." | Suggest port 3001 |
| `SyntaxError` | "There's a typo in the code I generated." | Show the bad line, retry |
| `permission denied` | "Your computer needs permission for this." | Prefix with `sudo` after user approves |

---

## Notes

- This skill intentionally avoids the word "terminal", "CLI", "npm", or "Node" in
  user-facing text — replace with "toolbox", "installer", "package manager" etc.
- All commands should be non-destructive and reversible
- Never run `rm -rf` or anything destructive without an explicit user confirmation
  block that names exactly what will be deleted
