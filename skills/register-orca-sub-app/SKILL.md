---
name: register-orca-sub-app
description: Show the Orca registration table with all field values filled in for a sub-app. Called by create-orca-sub-app after the build step. Also usable standalone when a user needs the registration values for an existing app.
---

# Register Orca Sub-App

**REQUIRED — always show the full table. Never skip it, abbreviate it, or say "fill in the usual fields". The user cannot register the app without these exact values.**

---

## Instructions to show the user

Tell the user:

> "To add your app to Orca, go to **System Admin → Sub-App Registry** (`/orca/sysadmin/apps`), click **Add App**, and fill in every field using the values below:"

Then show this table with all placeholders substituted:

| Field | Value |
|---|---|
| ID | `{{APP_NAME}}` |
| Route | `{{ROUTE}}` |
| Title | `{{DISPLAY_NAME}}` |
| Description | *(one sentence describing what the app does — derive from the user's original description)* |
| Icon ID | *(pick the best fit: `assignment`, `checklist`, `groups`, `star`, `security`, `apps`, `inventory`, `person`, `work`)* |
| Icon Background | `bg-indigo-500` |
| Badge | *(leave empty)* |
| Display Order | `0` |
| Admin Only | unchecked |
| Remote URL | *(leave blank — you will fill this in after uploading and building)* |
| Exposed Module | `./OrcaApp` |

Then tell the user:

> "After clicking **Create**, click the **Builds** icon (hammer) on your app row. Click **New Build**, upload the zip file you just downloaded, and click **Start Build**. Once the build succeeds, copy the Remote URL the system shows you, then edit your app and paste it into the **Remote URL** field. Finally, press **Ctrl+Shift+R** to reload Orca — your app card will appear under Extensions."
