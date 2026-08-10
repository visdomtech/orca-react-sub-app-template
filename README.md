# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Build it, host it, and Orca loads it automatically.

---

## Step 1 — Create your app

- Open [Claude Desktop](https://claude.ai/download) (install it first if you haven't), click the **Code** tab, and start a new session
- Create an Orca app using this skill — copy and paste the line below, then send it:

  ```
  Create an Orca app using this skill: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/SKILL.md
  ```

- The agent will ask for your app name, then your app description — answer each question when prompted
- Allow every permission Claude asks for.
- You will end up with a ready-to-deploy `.zip` file, registration details to paste into Orca, and a local address where your app is already running for preview.

---

## Step 2 — Register with Orca

Go to **System Admin → Sub-App Registry** (`/orca/sysadmin/apps`) and follow these steps:

- Click **Add App**, fill in the fields Claude provides, and leave **Remote URL blank**
- Click the **Builds** icon on your app row → **New Build** → select the zip → **Start Build**

- Once the build completes, open the sub-app and press **Ctrl+Shift+R** to reload and fetch the latest build.

---

## Code review

When you create an app, Claude automatically checks it for common problems before handing you the zip file. You can also run this check at any time on an existing app — for example, after you've made changes.

### Check an existing app

Open Claude Desktop inside your app folder and paste this message:

```
Review my Orca sub-app using this skill: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/review-orca-sub-app/SKILL.md

APP_NAME: your-app-name
COMPONENT_NAME: YourAppName
FEATURE_NAME: yourAppName
```

Fill in your app's name in the three lines — Claude will do the rest.

### What the review looks for

Claude reads through your entire app and checks for things like:

- **Will it actually work in Orca?** Common setup mistakes that cause a blank page or broken navigation
- **Is data being saved and loaded correctly?** Checks that your app talks to Orca's database the right way
- **Does the app handle slow connections?** Makes sure loading and error messages are shown to users
- **Is it safe?** Looks for accidentally exposed passwords or other security issues
- **Is the code clean?** Flags leftover debug code and other things that should be tidied up before going live

### What happens with the results

Claude gives you a report with two types of findings:

- 🔴 **Issues** — things that will likely cause the app to break in production. Worth fixing before you upload.
- ⚠️ **Warnings** — things that are not ideal but won't stop the app from working. Good to fix before sharing with users.

The review never blocks your build — you always get the zip file regardless of what it finds.

---

## Adding features to your app

### Approval workflows

To add a human-approval flow to any record in your app (e.g. "needs manager sign-off before processing"), use the approval flow skill:

```
Add an approval flow to my app using this skill: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/orca-fe-components/approval-flow/SKILL.md
```

The skill covers the `ApprovalFlow` component that the host injects into every sub-app. You only need to pass your `objectType` and `objectId` — the approval definition (approvers, phases, thresholds) is configured by admins in **Admin → Approval Flows** (`/orca/admin/approval-flows`) without touching your code.
