# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Build it, host it, and Orca loads it automatically.

---

## Step 1 — Create your app

Open **Claude Desktop**, click **Code**, and paste this:

```
Fetch and follow the skill at: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/SKILL.md

App name: YOUR-APP-NAME
What it does: YOUR-APP-DESCRIPTION
```

Allow every permission Claude asks for. When it finishes, a file explorer will open with your zip file — save it somewhere you'll find it.

---

## Step 2 — Register with Orca

Go to **System Admin → Sub-App Registry** (`/orca/sysadmin/apps`) and follow these steps:

**2a — Create the app entry**
Click **Add App**, fill in the fields Claude provides, and leave **Remote URL blank**.

**2b — Upload and build**
Click the **Builds** icon on your app row → **New Build** → select the zip → **Start Build**.

**2c — Set the Remote URL**
Once the build succeeds, copy the Remote URL the system shows. Edit your app and paste it into the **Remote URL** field.

**2d — Reload Orca**
Press **Ctrl+Shift+R**. Your app will appear under Extensions.
