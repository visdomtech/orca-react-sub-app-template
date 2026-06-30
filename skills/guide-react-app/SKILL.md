---
name: guide-react-app
description: Guide a non-technical user through creating an Orca sub-app. IMMEDIATELY generates a simple HTML wizard and opens it in the browser — do NOT ask questions first, do NOT wait for input.
---

# Guide: Create Your Orca App

## Critical: act first, ask nothing

The very first action when this skill runs:

1. Create the output folder:
   - Mac/Linux: `mkdir -p /tmp/orca-guide`
   - Windows: `New-Item -ItemType Directory -Force C:\tmp\orca-guide`
2. Write `guide.html` to that folder (see spec below)
3. Open it:
   - Mac: `open /tmp/orca-guide/guide.html`
   - Windows: `Start-Process C:\tmp\orca-guide\guide.html`
4. Send exactly one chat message: _"Your guide is open — follow the steps there."_

No questions. No explanation. Just open the page.

---

## Steps (embed directly in the HTML)

### Step 1 — Name your app
**Title:** What do you want to build?
**Explanation:** Give your app a short name — something like `leave-tracker` or `task-board`. Then describe what it should do in a sentence or two.
**UI:** Text input for app name (pre-filled `my-orca-app`) + textarea for description.
**Button label:** "Start →"
**No command to run.** Clicking the button advances to step 2.

### Step 2 — Check your tools
**Title:** Checking your computer
**Explanation:** Making sure your computer has the tools we need. Takes about 5 seconds.
**Command:** `git --version && bun --version`
**On failure:** Show "One tool is missing. Tell Claude to install it first." with fix command: `curl -fsSL https://bun.sh/install | bash`
**Skip link:** "I already have these →"

### Step 3 — Download the template
**Title:** Downloading the starting code
**Explanation:** Grabbing a ready-made starting point from the internet. This takes a few seconds.
**Command:** `git clone https://github.com/visdomtech/orca-react-sub-app-template.git {app_name} && cd {app_name} && bun install`

### Step 4 — Build your app
**Title:** Building your app
**Explanation:** Packaging everything into one file that Orca can load. Usually takes 10–20 seconds.
**Command:** `cd {app_name} && bun run build`

### Step 5 — Start the app server
**Title:** Starting your app
**Explanation:** Starting a local server on your computer. Keep the window open — closing it stops your app.
**Command:** `cd {app_name} && bunx serve dist --cors -l 4174`

### Step 6 — Add to Orca
**Title:** Add your app to Orca
**Explanation:** Tell Orca where to find your app. Go to Orca → Settings → Apps → Add App, fill in the table below, click Save, then press **Ctrl+Shift+R** to reload.
**No command.** Show this table (substitute `{app_name}` live):

| Field | Value |
|---|---|
| Remote URL | `http://localhost:4174/app.js` |
| Exposed Module | `./OrcaApp` |
| Route | `/orca/{app_name}` |
| Title | *(your app title)* |
| Description | *(your description)* |
| Icon ID | `apps` |
| Icon Background | `bg-indigo-500` |

**Button label:** "I've added it →" (advances to completion screen, no command)

---

## HTML design spec

Generate a **centered single-column wizard**. One step visible at a time. No sidebar, no split layout.

### Layout skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Create Your Orca App</title>
  <style>/* all styles inline — see style spec below */</style>
</head>
<body>
  <div class="page">
    <h1>Create Your Orca App</h1>
    <div class="dots" id="dots"><!-- one .dot per step --></div>
    <div class="card" id="step-panel"><!-- active step rendered here by JS --></div>
  </div>
  <div id="toast" class="toast hidden"></div>
  <script>
    const APP_NAME_DEFAULT = 'my-orca-app';
    const STEPS = [ /* step objects — see data spec below */ ];
    let current = 0;
    let appName = APP_NAME_DEFAULT;
    // renderStep(), advanceStep(), copyToClipboard(), markDone(), etc.
  </script>
</body>
</html>
```

### Step data structure (JS array)

```js
{
  title: "...",
  explanation: "...",
  command: "..." | null,       // null for steps 1 and 6
  skipLabel: "..." | null,     // only step 2
  inputFields: [...] | null,   // only step 1
  tableRows: [...] | null,     // only step 6
  completeLabel: "...",        // button text when done
}
```

### Step card structure (rendered by JS)

```
Step N of 6
[big title]
[explanation paragraph]

[command block — dark, monospace]   ← omit if command is null
[table — styled]                    ← only step 6

[ primary button ]
[ skip link ]                       ← only step 2

[ result area ]                     ← appears after user pastes reply
```

### Result area (below the button)

A `<details>` element, collapsed by default:

```
▸ Paste Claude's reply here to update progress
[textarea]
[Mark as done]
```

On "Mark as done":
- If textarea is empty or contains "success" / "done" / "✅" → green success box, show "Next →" button
- If textarea contains "error" / "fail" / "❌" → red error box, show "Try again" button

### App name substitution

Step 1 has a text input. On every `input` event, replace `{app_name}` in all rendered command blocks and table cells across the page.

### Completion screen

When step 6 is done, replace the card with:

```
🎉 Your app is live in Orca!

Open Orca and go to /orca/{app_name} to see it.

[ Start another guide ]
```

---

## Style spec

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh;
       display: flex; align-items: flex-start; justify-content: center; padding: 32px 16px; }
.page { width: 100%; max-width: 600px; }
h1 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin-bottom: 16px; }

/* progress dots */
.dots { display: flex; gap: 8px; margin-bottom: 24px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; transition: background 0.2s; }
.dot.done { background: #4f46e5; }
.dot.current { background: #4f46e5; box-shadow: 0 0 0 3px #c7d2fe; }

/* card */
.card { background: white; border-radius: 12px; padding: 32px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
.step-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;
              letter-spacing: 0.05em; margin-bottom: 8px; }
.step-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
.step-text { color: #475569; line-height: 1.65; margin-bottom: 20px; }

/* command block */
.cmd { background: #1e293b; color: #e2e8f0; font-family: monospace;
       padding: 16px 20px; border-radius: 8px; font-size: 0.875rem;
       white-space: pre-wrap; margin-bottom: 20px; }

/* table */
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem; }
td, th { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
th { background: #f8fafc; color: #64748b; font-weight: 600; }
td:last-child { font-family: monospace; color: #4f46e5; }

/* inputs */
input[type="text"], textarea {
  width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0;
  border-radius: 8px; font-size: 1rem; margin-bottom: 12px;
  font-family: inherit; transition: border-color 0.15s; }
input[type="text"]:focus, textarea:focus {
  outline: none; border-color: #4f46e5; }
textarea { resize: vertical; min-height: 80px; }
label { display: block; font-size: 0.875rem; font-weight: 500;
        color: #374151; margin-bottom: 6px; }

/* buttons */
.btn { display: block; width: 100%; padding: 14px; border-radius: 8px;
       font-size: 1rem; font-weight: 600; cursor: pointer; border: none;
       transition: background 0.15s; }
.btn-primary { background: #4f46e5; color: white; }
.btn-primary:hover { background: #4338ca; }
.btn-next { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0;
            margin-top: 10px; }
.btn-skip { background: none; border: none; color: #94a3b8; font-size: 0.875rem;
            cursor: pointer; margin-top: 12px; display: block; width: 100%;
            text-align: center; padding: 4px; }
.btn-skip:hover { color: #64748b; }

/* result states */
.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a;
           padding: 14px 16px; border-radius: 8px; margin-top: 16px; }
.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
         padding: 14px 16px; border-radius: 8px; margin-top: 16px; }

/* paste area */
details { margin-top: 16px; }
summary { font-size: 0.875rem; color: #94a3b8; cursor: pointer; user-select: none; }
summary:hover { color: #64748b; }
.paste-area { margin-top: 10px; }
.btn-mark { background: #f1f5f9; color: #475569; margin-top: 8px;
            padding: 8px 16px; border-radius: 6px; font-size: 0.875rem; }

/* toast */
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
         background: #1e293b; color: white; padding: 12px 20px; border-radius: 8px;
         font-size: 0.875rem; z-index: 999; transition: opacity 0.3s; }
.toast.hidden { opacity: 0; pointer-events: none; }

/* completion */
.complete { text-align: center; padding: 16px 0; }
.complete .emoji { font-size: 3rem; margin-bottom: 16px; }
.complete h2 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.complete p { color: #64748b; margin-bottom: 24px; }
```

### "Tell Claude to run this" button behavior

On click:
1. Copy to clipboard: `Please run step {N}: {command}`
2. Show toast for 2.5 seconds: _"Copied! Paste into the Claude chat and press Enter."_

---

## Notes

- Fully self-contained HTML — no external CSS, JS, or CDN links
- Never use "terminal", "CLI", "shell", "npm", "Node" in visible text
  - Use instead: "installer", "command", "package manager"
- Chat window is support only — the HTML page is the complete experience
