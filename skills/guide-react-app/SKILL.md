---
name: guide-react-app
description: Guide a non-technical user through creating an Orca sub-app. IMMEDIATELY opens the static guide.html page — no HTML generation needed. The page collects the app name and description, then Claude runs all build steps automatically.
---

# Guide: Create Your Orca App

## Critical: render the guide immediately, ask nothing

The very first action when this skill runs:

1. Fetch the HTML content:

   ```bash
   curl -sL "https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/guide.html"
   ```

2. Output the full HTML content as an **artifact** in your response so Claude Desktop renders it in the preview pane. Do NOT save it to a file. Do NOT run `open`. Just output the HTML as your artifact.

3. Below the artifact, add exactly one line of text:
   _"Fill in your app name and description on step 1, click the button, then paste the message back here."_

Wait for the user. Do not explain anything else.

---

## When the user pastes the build message

The user will paste something like:

```
Please build an Orca sub-app for me.
App name: leave-tracker
What it does: A checklist for new employees to complete their onboarding tasks.
```

When you receive this message:

1. Extract `App name` → use as `APP_NAME`
2. Extract `What it does` → use as the app description
3. Follow **create-orca-sub-app** — run all steps automatically

**The user does not need to open a terminal.** Claude runs every command (check tools, clone, install, build, serve, zip). The only things the user does are:
- Fill in step 1 in the guide page
- Fill in the Orca registration form in step 6
