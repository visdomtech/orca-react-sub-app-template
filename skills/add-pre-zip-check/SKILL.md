---
name: add-pre-zip-check
description: Adds the automated code review gate to an Orca sub-app. Creates scripts/pre-zip-check.mjs and patches the postbuild hook into package.json. Safe to run on new or existing apps.
---

# Add Pre-Zip Check

Adds the code review gate that runs automatically after every `bun run build`. Blocking issues cause the build to fail with exit code 1, preventing zip creation until resolved. Supports `// review-allow: <reason>` comments to acknowledge intentional exceptions.

---

## Step 1 — Create the script

Create `scripts/pre-zip-check.mjs` in the app root:

```javascript
import { readFileSync, readdirSync, statSync } from "fs";
import { extname, join } from "path";

const SRC_DIR = "src";
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const ALLOW_MARKER = "review-allow:";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (CODE_EXTENSIONS.has(extname(full))) out.push(full);
  }
  return out;
}

// [category, regex, message]
const RULES = [
  ["F", /console\.log\s*\(/, "console.log left in source"],
  ["F", /@ts-ignore/, "@ts-ignore suppresses a real type error"],
  ["G", /dangerouslySetInnerHTML/, "dangerouslySetInnerHTML — XSS risk"],
  ["G", /\beval\s*\(/, "eval() — code injection risk"],
  ["D2", /:\s*any\b/, "explicit `any` type"],
  ["D2", /\bas\s+any\b/, "`as any` cast"],
  ["B", /\bBrowserRouter\b/, "BrowserRouter — sub-apps must not own the router"],
  ["B", /\bHashRouter\b/, "HashRouter — sub-apps must not own the router"],
  [
    "G",
    /\b(const|let)\s+\w*(password|secret|api[_-]?key|token)\w*\s*[:=][^=]*["'][^"']+["']/i,
    "hardcoded credential-looking value",
  ],
];

function isAllowed(lines, lineIdx) {
  const here = lines[lineIdx] ?? "";
  const above = lines[lineIdx - 1] ?? "";
  return here.includes(ALLOW_MARKER) || above.includes(ALLOW_MARKER);
}

let blocking = 0;
let acknowledged = 0;
const report = [];

for (const file of walk(SRC_DIR)) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const [category, regex, message] of RULES) {
      if (regex.test(line)) {
        const allowed = isAllowed(lines, idx);
        if (allowed) acknowledged++;
        else blocking++;
        report.push({
          file,
          line: idx + 1,
          category,
          message,
          allowed,
          text: line.trim(),
        });
      }
    }
  });
}

console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│  CODE REVIEW GATE                                                    │
└─────────────────────────────────────────────────────────────────────┘
`);

if (report.length === 0) {
  console.log("Automated checks (F, G, D2, B pattern rules): no issues found.\n");
} else {
  for (const r of report) {
    const tag = r.allowed ? "ACKNOWLEDGED" : "BLOCKING";
    console.log(`[${tag}] ${r.category} ${r.file}:${r.line} — ${r.message}`);
    console.log(`    ${r.text}`);
  }
  console.log("");
}

console.log(
  `Automated: ${blocking} blocking, ${acknowledged} acknowledged (via "${ALLOW_MARKER}" comment).\n`
);

console.log(`Still requires manual judgment before zipping — read the diff and check:
  A  – Module Federation (exposes ./OrcaApp, shared singletons, default export)
  B  – Routing (basename accepted and stripped, not just "no BrowserRouter")
  C  – Navigation (SubAppLink used for internal links, correct backHref hook)
  D  – API patterns (httpClient only, /orcaagents/* endpoints, realistic mock data)
  D2 – Domain-specific naming, intentional optional (?) fields
  E  – UX completeness (loading + error states actually rendered, not just present as strings)
`);

if (blocking > 0) {
  console.log(
    `🔴 ${blocking} blocking issue(s). Fix them, or add a "// ${ALLOW_MARKER} <reason>" comment ` +
      `on the same or preceding line if the flag is a deliberate, disclosed exception. Build fails until resolved.\n`
  );
  process.exit(1);
}

console.log("✅ No blocking automated findings. Complete the manual checklist above before creating the zip.\n");
```

---

## Step 2 — Patch package.json

Read the existing `package.json` and add `"postbuild": "node scripts/pre-zip-check.mjs"` to the `scripts` section. Do not overwrite any existing scripts — only insert the new entry. Write the file back.

---

## Step 3 — Confirm

Tell the user:

> "Code review gate added. `bun run build` will now run automated checks after every build — blocking issues fail the build and prevent zip creation. Use `// review-allow: <reason>` on the flagged line (or the line above) to acknowledge a deliberate exception."
