---
name: guide-react-app
description: Triggered automatically from the Orca Desktop guide UI. Receives app name and description, then runs all build steps automatically.
---

# Build an Orca Sub-App

The guide UI sends this message when the user clicks Next:

```
/guide-react-app
App name: leave-tracker
What it does: A checklist for new employees to complete their onboarding tasks.
```

When invoked:

1. Extract `App name` → use as `APP_NAME`
2. Extract `What it does` → use as the app description
3. Follow **create-orca-sub-app** — run all steps automatically

**The user does not need to open a terminal.** Claude runs every command. The only thing the user does after clicking Next is fill in the Orca registration form in step 6.
