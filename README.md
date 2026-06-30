# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Build it, host it, and Orca loads it automatically.

---

## Step 1 — Create your app

1. Open [Claude Desktop](https://claude.ai/download) (install it first if you haven't), click the **Code** tab, and start a new session
2. Copy and paste the line below, then send it:

   ```
   Fetch and follow the skill at: https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/SKILL.md
   ```

3. The agent will ask for your app name, then your app description — answer each question when prompted
4. Allow every permission Claude asks for. When it finishes, a file explorer will open with your zip file — save it somewhere you'll find it.

---

## Step 2 — Register with Orca

Go to **System Admin → Sub-App Registry** (`/orca/sysadmin/apps`) and follow these steps:

- Click **Add App**, fill in the fields Claude provides, and leave **Remote URL blank**
- Click the **Builds** icon on your app row → **New Build** → select the zip → **Start Build**
- Once the build succeeds, copy the Remote URL the system shows. Edit your app and paste it into the **Remote URL** field
- Press **Ctrl+Shift+R** to reload. Your app will appear under Extensions
