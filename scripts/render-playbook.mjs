#!/usr/bin/env node
/**
 * Renders skills/PLAYBOOK.md → docs/playbook.html
 * A self-contained, browser-ready HTML file with sidebar TOC navigation.
 *
 * Usage: bun run scripts/render-playbook.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MD_PATH = join(ROOT, "skills", "PLAYBOOK.md");
const OUT_DIR = join(ROOT, "docs");
const OUT_PATH = join(OUT_DIR, "playbook.html");

// --- Read markdown ---
const md = readFileSync(MD_PATH, "utf-8");

// --- Read browser-side search JS (inlined into HTML, no template-literal escaping issues) ---
const searchJs = readFileSync(join(__dirname, "playbook-search.js"), "utf-8");

// --- Extract TOC from headings ---
const tocEntries = [];
const headingRegex = /^(#{1,3})\s+(.+)$/gm;
let match;
while ((match = headingRegex.exec(md)) !== null) {
  const level = match[1].length;
  const text = match[2].replace(/[*_`~]/g, "").replace(/🚀|📋|📚|🎯/g, (e) => e).trim();
  const id = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  tocEntries.push({ level, text, id });
}

// --- Configure marked renderer with heading IDs ---
const renderer = new marked.Renderer();
let headingIndex = 0;
renderer.heading = function ({ text, depth }) {
  // Strip inline HTML for TOC id matching
  const cleanText = text.replace(/<[^>]*>/g, "").replace(/[*_`~]/g, "");
  const id = cleanText
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};

// --- Render markdown to HTML ---
const bodyHtml = marked(md, { renderer, gfm: true, breaks: false });

// --- Build sidebar TOC HTML ---
function buildToc(entries) {
  let html = '<div class="search-box">\n';
  html += '  <div class="search-wrap">\n';
  html += '    <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>\n';
  html += '    <input type="text" id="search" class="search-input" placeholder="Search playbook\u2026" autocomplete="off" spellcheck="false">\n';
  html += '    <button id="search-clear" class="search-clear" title="Clear">\u00d7</button>\n';
  html += '  </div>\n';
  html += '  <div id="search-count" class="search-count"></div>\n';
  html += '</div>\n';
  html += '<nav class="toc">\n<div class="toc-title">Contents</div>\n<ul>\n';
  for (const entry of entries) {
    const indent = entry.level === 1 ? "" : entry.level === 2 ? "  " : "    ";
    const cls =
      entry.level === 1
        ? ' class="toc-h1"'
        : entry.level === 2
          ? ' class="toc-h2"'
          : ' class="toc-h3"';
    html += `${indent}<li${cls}><a href="#${entry.id}">${entry.text}</a></li>\n`;
  }
  html += "</ul>\n</nav>";
  return html;
}

const tocHtml = buildToc(tocEntries);

// --- Full HTML document ---
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orca Sub-App Playbook</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --sidebar-w: 280px;
      --font-serif: 'Times New Roman', Times, Georgia, serif;
      --font-mono: Monaco, 'Courier New', monospace;
      --c-bg: #ffffff;
      --c-sidebar: #f8f9fa;
      --c-border: #e2e6ea;
      --c-text: #171717;
      --c-text-muted: #6b7280;
      --c-accent: #0369a1;
      --c-accent-hover: #0c4a6e;
      --c-accent-light: color-mix(in srgb, #0369a1 10%, #ffffff);
      --c-code-bg: #f5f5f5;
      --c-table-header: #e5e5e5;
      --c-table-border: #a3a3a3;
    }

    body {
      font-family: var(--font-serif);
      font-size: 16px;
      line-height: 1.7;
      color: var(--c-text);
      background: var(--c-bg);
      display: flex;
      min-height: 100vh;
    }

    /* --- Sidebar --- */
    .sidebar {
      width: var(--sidebar-w);
      min-width: var(--sidebar-w);
      background: var(--c-sidebar);
      border-right: 1px solid var(--c-border);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 24px 0;
      flex-shrink: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .sidebar::-webkit-scrollbar { width: 4px; }
    .sidebar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    /* --- Search box --- */
    .search-box {
      padding: 0 16px 12px;
      border-bottom: 1px solid var(--c-border);
      margin-bottom: 8px;
    }
    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      color: var(--c-text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 32px 8px 32px;
      border: 1px solid var(--c-border);
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: var(--c-text);
      background: #fff;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input::placeholder { color: #b0b7c0; }
    .search-input:focus {
      border-color: var(--c-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, #0369a1 12%, transparent);
    }
    .search-clear {
      position: absolute;
      right: 6px;
      width: 20px;
      height: 20px;
      border: none;
      background: var(--c-code-bg);
      color: var(--c-text-muted);
      border-radius: 50%;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .search-clear:hover { background: #e2e6ea; }
    .search-box.has-query .search-clear { display: flex; }
    .search-count {
      font-size: 11px;
      color: var(--c-text-muted);
      padding: 6px 4px 0;
      min-height: 22px;
    }

    /* --- TOC filter states --- */
    .toc li.toc-hidden { display: none; }
    .toc li.toc-match > a { color: var(--c-accent); font-weight: 500; }

    .toc-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--c-text-muted);
      padding: 0 20px 12px;
      border-bottom: 1px solid var(--c-border);
      margin-bottom: 8px;
    }

    .toc ul { list-style: none; padding: 0; margin: 0; }
    .toc li { margin: 0; }

    .toc a {
      display: block;
      padding: 5px 20px;
      color: var(--c-text-muted);
      text-decoration: none;
      font-size: 13px;
      line-height: 1.5;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
    }

    .toc a:hover {
      color: var(--c-accent);
      background: var(--c-accent-light);
    }

    .toc a.active {
      color: var(--c-accent);
      border-left-color: var(--c-accent);
      background: var(--c-accent-light);
      font-weight: 500;
    }

    .toc-h1 > a { font-weight: 600; color: var(--c-text); font-size: 13px; padding-top: 10px; }
    .toc-h2 > a { padding-left: 32px; }
    .toc-h3 > a { padding-left: 44px; font-size: 12px; }

    /* --- Main content --- */
    .content {
      flex: 1;
      max-width: 820px;
      padding: 40px 56px 80px;
      margin: 0 auto;
    }

    /* --- Typography --- */
    .content h1 {
      font-family: var(--font-serif);
      font-size: 34.67px;
      font-weight: bold;
      color: var(--c-text);
      text-align: center;
      margin: 0 0 18.67px;
      line-height: 1.3;
    }

    .content h2 {
      font-family: var(--font-serif);
      font-size: 28px;
      font-weight: bold;
      color: var(--c-text);
      margin: 26.67px 0 13.33px;
    }

    .content h3 {
      font-family: var(--font-serif);
      font-size: 22.67px;
      font-weight: bold;
      color: var(--c-text);
      margin: 21.33px 0 10.67px;
    }

    .content p {
      margin: 0 0 13.33px;
      text-indent: 2em;
    }

    .content li p { text-indent: 0; }
    .content blockquote p { text-indent: 0; }

    .content strong { font-weight: bold; }
    .content em { font-style: italic; }

    .content a {
      color: var(--c-accent);
      text-decoration: none;
    }
    .content a:hover { color: var(--c-accent-hover); }

    /* --- Blockquotes --- */
    .content blockquote {
      margin: 16px 0;
      padding: 2.67px 18.67px;
      border-left: 4px solid #a3a3a3;
      background-color: #f5f5f5;
    }

    /* --- Tables --- */
    .content table {
      border-collapse: collapse;
      width: fit-content;
      max-width: 100%;
      margin: 0 auto 16px;
      overflow-x: auto;
      display: block;
    }

    .content th,
    .content td {
      padding: 8pt;
      border: 1px solid var(--c-table-border);
    }

    .content th {
      background-color: var(--c-table-header);
      color: var(--c-text);
      font-weight: bold;
    }

    .content tr:nth-child(even) { background-color: #fafafa; }
    .content tr:nth-child(odd) { background-color: #ffffff; }

    /* --- Code --- */
    .content code {
      font-family: var(--font-mono);
      font-size: 0.9167em;
      background-color: var(--c-code-bg);
      padding: 1px 4px;
      border-radius: 3px;
    }

    .content pre {
      background-color: var(--c-code-bg);
      color: #24292e;
      padding: 16px 20px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0 0 16px;
      font-size: 14.67px;
      line-height: 1.6;
    }

    .content pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    /* --- Horizontal rules --- */
    .content hr {
      border: none;
      border-top: 1px solid #d1d5db;
      margin: 26.67px 0;
    }

    /* --- Lists --- */
    .content ul, .content ol {
      padding-left: 24px;
      margin: 0 0 16px;
    }
    .content li { margin: 0 0 4px; margin-left: 2em; }

    /* --- Content highlight marks --- */
    mark.search-hl {
      background: #fde68a;
      color: inherit;
      padding: 1px 2px;
      border-radius: 2px;
      box-shadow: 0 0 0 1px #fbbf24;
    }
    mark.search-hl.current {
      background: #f97316;
      color: #fff;
      box-shadow: 0 0 0 2px #f97316;
    }

    /* --- Mobile --- */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .content { padding: 24px 20px 60px; }
    }

    /* --- Print --- */
    @media print {
      .sidebar { display: none; }
      .content { max-width: 100%; padding: 20px; }
      .content h2 { break-before: auto; }
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    ${tocHtml}
  </aside>
  <main class="content">
    ${bodyHtml}
  </main>

  <script>
${searchJs}
  </script>
</body>
</html>`;

// --- Write output ---
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, html, "utf-8");
console.log(`✅ Rendered: ${OUT_PATH}`);
console.log(`   Open in browser: open ${OUT_PATH}`);
