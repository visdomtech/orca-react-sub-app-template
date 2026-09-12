# Orca React Sub-App Template

Mini-apps that plug into the Orca platform. Build it, host it, and Orca loads it automatically.

---

## Step 1 — Create your app

- Open [Claude Desktop](https://claude.ai/download) (install it first if you haven't), click the **Code** tab, and start a new session
- Copy and paste the line below, then send it:

  ```
  Create an Orca app using this skill: https://docs.doublefin.com/skills/guide-react-app/SKILL.md
  ```

- Answer Claude's questions when prompted, and allow every permission it asks for
- You'll receive a ready-to-deploy `.zip` file and registration details for the next step

---

## Step 2 — Register with Orca

Go to **System Admin → Sub-App Registry** and follow these steps:

- Click **Add App** and fill in the fields Claude provides (leave **Remote URL** blank)
- Click the **Builds** icon → **New Build** → select the zip → **Start Build**
- Once the build completes, open the sub-app and press **Ctrl+Shift+R** to load it

---

## Step 3 — Rebuild after changes

When you've made changes and need a new zip to upload, paste this into Claude Desktop:

```
Build my Orca sub-app using this skill: https://docs.doublefin.com/skills/build-orca-sub-app/SKILL.md
```

Claude will install dependencies, run tests, and produce an updated `.zip` file ready to upload.

---

## Code review

Claude automatically reviews your app before handing you the zip. To run the review manually at any time, paste this into Claude Desktop:

```
Review my Orca sub-app using this skill: https://docs.doublefin.com/skills/review-orca-sub-app/SKILL.md
```

<details>
<summary>What does the review check?</summary>

- Will it work inside Orca? (navigation, blank page issues)
- Is data saved and loaded correctly?
- Are loading and error messages shown to users?
- Are there any security issues?
- Is there leftover debug code?

Results come back as 🔴 Issues (fix before uploading) and ⚠️ Warnings (good to fix, not blocking).

</details>

---

## Adding features to your app

### 1. Approval workflows

Let users request sign-off from a manager or team before an action is processed.

```
Add an approval flow to my app using this skill: https://docs.doublefin.com/skills/orca-fe-components/approval-flow/SKILL.md
```

> Approvers and rules are set by admins in **Admin → Approval Flows** — no code changes needed.

---

### 2. Document upload

Let users upload files (PDF, Word, Excel, images, and more) directly from your app.

```
Add document upload to my app using this skill: https://docs.doublefin.com/skills/orca-fe-components/document-upload/SKILL.md
```

> Supports PDF, DOCX, XLSX, PNG, JPEG, ZIP, TXT, CSV — up to 100 MB per file.

---

### 3. Digital document signing

Let users send a document for digital signature and track when it's been signed.

```
Add digital signing to my app using this skill: https://docs.doublefin.com/skills/orca-fe-components/digital-sign/SKILL.md
```

> Claude will ask a few short questions about where to add signing in your app, then set everything up. Signing credentials (Dropbox Sign or Adobe Acrobat Sign) are configured once by your workspace admin — your app doesn't need any API keys.
