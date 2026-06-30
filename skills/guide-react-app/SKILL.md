---
name: guide-react-app
description: Walk a non-technical user through creating a frontend React app. IMMEDIATELY generates a self-contained HTML guide page and opens it in the browser — do NOT ask any questions first, do NOT wait for input. Use when a user has no coding background and wants to build their first React app.
---

# Guide: Build Your First React App (Non-Technical)

## When to Use

- A user says "I want to build a website / app but I don't know how to code"
- A product manager or designer wants to prototype a React frontend
- Someone wants a visual, step-by-step walkthrough without touching a terminal

---

## CRITICAL: Act First, Ask Nothing

**DO NOT ask the user any questions before generating the HTML page.**
**DO NOT collect inputs upfront.**
**DO NOT explain what you are about to do.**

The very first action when this skill runs is:
1. Read `demo-data.json`
2. Write `guide.html` to `/tmp/guide-react-app/guide.html`
3. Run `open /tmp/guide-react-app/guide.html`
4. Say one sentence in chat: "Your guide is open in the browser — follow the steps there."

Use `my-first-app` as the default `app_name`. The HTML page has an editable name
field so the user can change it without ever coming back to chat.

---

## How It Works

**The primary UI is an HTML page, not the chat window.**

```
demo-data.json  ──▶  Claude writes guide.html  ──▶  open in browser  ──▶  done
                                                           │
                              user reads steps, clicks "Run this step"
                                                           │
                              Claude executes, page updates with result
```

---

## Step-by-Step Flow

### 1. Read demo-data.json

Load all steps, the glossary, and meta from `demo-data.json` in this folder.
Default `{app_name}` to `my-first-app` and `{user_name}` to `there` — the user
overrides these inside the HTML page, never in chat.

### 2. Write guide.html and open it immediately

Write to `/tmp/guide-react-app/guide.html` then open it:

```bash
mkdir -p /tmp/guide-react-app
# write file, then:
open /tmp/guide-react-app/guide.html
```

After opening, send exactly one chat message: _"Your guide is open in the browser —
follow the steps there."_ Say nothing else.

### 3. guide.html requirements

The page must be **fully self-contained** (no CDN, no external fetches) and include:

#### Page structure

```
┌──────────────────────────────────────────────────────────────┐
│  🚀  Build Your First React App          10 min  7 steps     │
├──────────────────────────────────────────────────────────────┤
│  ████████████░░░░░░░░░░  Step 3 of 7                        │
├──────────────────┬───────────────────────────────────────────┤
│  STEPS SIDEBAR   │  ACTIVE STEP PANEL                        │
│                  │                                           │
│  ✅ Step 1       │  Step 3: Install all the ingredients      │
│  ✅ Step 2       │  ─────────────────────────────────────    │
│  ▶  Step 3  ◀   │  Your app needs a few helper libraries    │
│     Step 4       │  — like ingredients in a recipe.          │
│     Step 5       │  I'm downloading them now. ~15 sec.       │
│     Step 6       │                                           │
│     Step 7       │  ┌─ Command (Claude will run this) ─────┐ │
│                  │  │  $ bun install                       │ │
│                  │  └──────────────────────────────────────┘ │
│                  │                                           │
│  ──────────────  │  [ ▶ Run this step ]  [ Skip ]           │
│  📖 Glossary     │                                           │
│  React           │  ── Output ──────────────────────────── │ │
│  Bun             │  (appears here after Claude runs it)     │ │
│  Port            │                                           │
└──────────────────┴───────────────────────────────────────────┘
```

#### Required HTML sections

**Progress bar** — updates as steps complete (use `data-step` attributes + JS).

**Sidebar** — lists all step titles. Each item shows one of:
- ⬜ not started (grey)
- ⏳ in progress (blue, pulsing)
- ✅ success (green)
- ❌ failed (red, with retry button)

**App name field** — shown at the top of the page, pre-filled with `my-first-app`.
The user can edit it in-place; JS substitutes it into all command previews on change.
This replaces any need to ask the user for their app name in chat.

**Active step panel** — shows for the current step:
- Step number and title (large, friendly font)
- Plain-English explanation paragraph
- Command block (monospace, dark background, read-only — user never types here)
- A prominent **"Tell Claude to run this"** button
- Output area (empty until Claude reports back)
- Success / error banner

**Glossary sidebar** — collapsible list of jargon terms from `demo-data.json`.
User can click any term to see the plain-English definition inline.

**Completion screen** — replaces the panel when all steps finish:
- "🎉 You built a React app!" heading
- Summary of what was created
- Three next-step buttons from `demo-data.json`

#### HTML style requirements

- Clean, calm design: white background, `#4f46e5` accent, `#f8fafc` sidebar
- Large readable font (`system-ui`, 16px base, 1.6 line-height)
- No jargon in any visible label — use plain English everywhere
- Mobile-friendly (single column below 700px)
- All CSS and JS inline in the `<style>` and `<script>` tags — zero dependencies

#### "Tell Claude to run this" button

When the user clicks this button it does **not** run anything itself. Instead it
copies a short prompt to the clipboard and shows a banner:

> "Copied! Paste this into the Claude chat and press Enter."

The copied text is:
```
/run-step {step_id}
```

Claude listens for this pattern and responds by executing the step's command,
then reports back in a structured format the page can display (see below).

Alternatively, if the Claude Desktop App supports direct tool invocation from the
page, wire the button to `window.claude?.runBash(command)` if available, falling
back to the clipboard approach.

### 4. Execute steps on demand

When the user pastes `/run-step {id}`, Claude:

1. Looks up the step in `demo-data.json`
2. Runs the command via Bash
3. Checks output against `expected_output_snippet`
4. Replies with a structured result block:

```
STEP_RESULT
id: {step_id}
status: success | failure
output: {trimmed stdout, max 10 lines}
message: {plain-English sentence}
END_STEP_RESULT
```

The user pastes this back into the guide page's output area (or the page polls for
it if Claude Desktop App exposes a message bus). The sidebar and progress bar update
automatically via JS.

### 5. Handle failures

On failure, the page shows an error panel:
- Red banner: plain-English error message from `failure_message`
- Two buttons: **"Try again"** and **"Skip this step"**
- Collapsible "Show technical details" for the raw error (hidden by default)

### 6. Completion

When step 7 completes, the page transitions to the celebration screen. Claude sends
one final chat message:
> "Your app is live at http://localhost:5173 — the guide page will open it for you!"

---

## guide.html Generation Template

Claude must write the HTML from scratch each time (not hardcode it), drawing content
from `demo-data.json`. The structure below is the required skeleton — fill in real
step data from the JSON:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Build Your First React App</title>
  <style>
    /* All styles inline — no external CSS */
    :root { --accent: #4f46e5; --success: #16a34a; --error: #dc2626; }
    /* ... full styles here ... */
  </style>
</head>
<body>
  <header><!-- title + progress bar --></header>
  <main>
    <nav id="sidebar"><!-- step list + glossary --></nav>
    <section id="step-panel"><!-- active step --></section>
  </main>
  <script>
    const STEPS = /* paste steps array from demo-data.json here */;
    // step navigation, status updates, clipboard copy logic
  </script>
</body>
</html>
```

---

## Error Handling

| Error pattern | Plain-English shown on page | Auto-fix |
|---|---|---|
| `ENOENT` / `not found` | "The tool isn't installed yet." | Run install step |
| `EADDRINUSE` | "Another app is using that port." | Suggest port 3001 |
| `SyntaxError` | "There's a typo in the code I generated." | Show line, retry |
| `permission denied` | "Your computer needs permission." | Confirm then `sudo` |

---

## Notes

- Never show raw command output directly to the user — always wrap it in a
  plain-English sentence before displaying
- Never use the words "terminal", "CLI", "npm", "Node", "shell" in the HTML UI —
  replace with "toolbox", "installer", "package manager", "command window"
- All destructive operations (`rm`, overwrite) must show a confirmation modal in the
  HTML page before Claude executes them
- The HTML page is the source of truth for progress; Claude's chat is support-only
