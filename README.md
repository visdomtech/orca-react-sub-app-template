# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Each sub-app is a standalone React project — build it, host it, and Orca loads it automatically without any changes to the main platform.

---

## How it works

Orca fetches your app's built file (`dist/app.js`) from a URL you register in the admin panel, then renders it as a page at `/orca/your-app`.

---

## Create your app

1. Install [Claude Desktop](https://claude.ai/download) if you don't have it
2. Open Claude Desktop and select the **Code** tab at the top
3. Click **New Session** to start a fresh chat
4. Copy the block below and paste it as your first message

```
Please follow the skill at this URL to help me create an Orca sub-app:
https://raw.githubusercontent.com/visdomtech/orca-react-sub-app-template/main/skills/guide-react-app/SKILL.md
```

5. Click **Allow** whenever Claude asks for permission — it needs access to create files and run commands on your computer to build the app for you

Claude will open a visual guide in your browser and walk you through every step.
