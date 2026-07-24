---
name: orca-fe
description: Enforce the Mercury Console design system on Orca frontend pages. Audits and migrates pages to use the shared UI kit (AdminTable, PageHeader, DetailLayout, StatusPill), theme tokens, and anti-slop discipline. Use when applying visual design to any page in an Orca frontend app, when restyling components, or when the user asks to make pages look consistent with the Mercury Console.
---

# Orca FE - Mercury Console Design System Enforcer

Goal: Any page in the app must look like it was designed by one person. The theme does the visual work, the kit provides structure, and pages own only layout and behavior.

## Prerequisites

The app must have MUI and react-router installed and configured with the Mercury Console theme. If not yet set up:

```bash
bun add @mui/material@^6 @emotion/react @emotion/styled @mui/icons-material@^6 react-router
```

Then copy the theme and UI kit from this repo's reference files:
- Theme: `src/theme/theme.ts` - copy to your app's `src/theme/theme.ts`
- UI Kit: `src/shared/ui/` - copy to your app's `src/shared/ui/`
- Wrap `OrcaApp` with the ThemeProvider:

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme/theme";

export function OrcaApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* ... app content ... */}
    </ThemeProvider>
  );
}
```

## First Step: Read the Design Spec

Before any changes, read the design spec in this repo:

```
Read: styles.md
```

This file is the single source of truth for all visual rules, token values, kit contracts, and migration checklists (section 9). Internalize it fully before touching any page.

## Audit Phase

For each target page, scan for violations in three categories:

### Structural Violations
- Hand-rolled back buttons (should use `PageHeader` with `backHref`)
- `if (isLoading) return <CircularProgress />` early-returns (should use inline skeletons)
- Raw MUI `<Table>` (should use `AdminTable` with columns config)
- Hand-rolled `<Chip>` status badges (should use `StatusPill` via badge wrapper)
- Custom label/value rows (should use `DetailRow`)
- Ungrouped form fields (should use `FormSection`)

### Token Violations
- Raw hex colors (`#4f46e5`, `#e2e8f0`, etc.) instead of theme tokens
- `grey.50` instead of `background.default`
- `bgcolor: "white"` instead of `background.paper`
- `borderColor: "grey.300"` instead of `divider`
- `boxShadow: <number>` instead of `OVERLAY_SHADOW` or removed

### Anti-Slop Violations
- Gradient backgrounds (`linear-gradient`, `radial-gradient`)
- Gradient text (`-webkit-background-clip: text`)
- Hover lifts (`translateY(-2px)`, `transform: scale`)
- Card shadows (`boxShadow` on non-overlay surfaces)
- Em-dashes (`---`) instead of hyphens (`-`)
- Violet/purple colors (`#7c3aed`, `#6d28d9`, `#a78bfa`, `#8b5cf6`)

## Migration Execution

Apply transforms in this order (from styles.md section 9):

### Step 1: Structural Migration

1. **Header** -> `<PageHeader title="..." backHref="..." />` or `<DetailLayout>`
2. **Loading** -> `<DetailSkeleton />` or `AdminTable loading={...}` (headers stay mounted)
3. **Tables** -> `<AdminTable columns={...} rows={...} rowKey={...} loading={...} empty={<EmptyState .../>} />`
4. **Forms** -> `<FormSection title="...">` groups
5. **Status** -> `<StatusPill tone="..." label="..." />` (use badge wrapper pattern)
6. **Label/value** -> `<DetailRow label="...">{value}</DetailRow>`

### Step 2: Token Cleanup

Replace all raw values with theme tokens:
- Hex colors -> `primary.main`, `text.secondary`, `divider`, `background.paper`, `success.dark`, etc.
- `grey.50` -> `background.default`
- `boxShadow: <n>` -> `OVERLAY_SHADOW` (overlays only) or remove
- `grey.300` borders -> `divider`
- `"white"` -> `background.paper`

### Step 3: Anti-Slop Audit

Remove all violations found in the audit phase. Replace with flat, quiet, hairline-bordered surfaces.

## Critical Rules

### Frozen Files
During visual work, these are untouchable:
- API files (`api.ts`)
- Hooks (`hooks.ts`, `hooks/`)
- Query keys (`queryKeys.ts`)
- HTTP client (`src/api/`)

Migration rule: hooks/state/effects block above `return` stays verbatim; only JSX below `return` changes.

### Test Preservation
Existing tests must pass unmodified. Key patterns:

**Skeleton-Test Timing**: If a test does `findByText("Title")` then sync `getByText("data")`, the title must not appear before data loads.
- List pages: Use `AdminTable loading={isLoading}`. If needed, conditionally render PageHeader: `{!isLoading && <PageHeader ... />}`
- Detail pages: `{isLoading ? <DetailSkeleton /> : <DetailLayout>...</DetailLayout>}`
- Dynamic titles: Move `PageHeader` inside the non-loading branch.

### Kit Import
Always import from the barrel:
```tsx
import { AdminTable, PageHeader, DetailLayout, DetailRow, FormSection, StatusPill, EmptyState, TableSkeleton, DetailSkeleton, type AdminTableColumn, type StatusPillTone } from "~/shared/ui";
```

### Badge Wrapper Pattern
```tsx
import { StatusPill, type StatusPillTone } from "~/shared/ui";
import type { SomeEnum } from "...";

const TONE_MAP: Record<SomeEnum, StatusPillTone> = { A: "success", B: "warning" };
const LABEL_MAP: Record<SomeEnum, string> = { A: "Alpha", B: "Beta" };

export function SomeBadge({ value }: { value: SomeEnum }) {
  return <StatusPill tone={TONE_MAP[value]} label={LABEL_MAP[value]} />;
}
```

## Reference Files

All reference implementations are in this repo:

| File | Purpose |
|------|---------|
| `styles.md` | Full design system specification |
| `src/theme/theme.ts` | MUI theme with Mercury Console tokens and overrides |
| `src/shared/ui/AdminTable.tsx` | Data table with columns config, loading, empty, footer |
| `src/shared/ui/PageHeader.tsx` | Page header with title, subtitle, actions, back link |
| `src/shared/ui/DetailLayout.tsx` | Detail page scaffold with back link, title, status, actions |
| `src/shared/ui/DetailRow.tsx` | Label/value row (160px label width) |
| `src/shared/ui/DetailSkeleton.tsx` | Loading placeholder for detail pages |
| `src/shared/ui/TableSkeleton.tsx` | Loading placeholder for standalone tables |
| `src/shared/ui/EmptyState.tsx` | Designed empty state with icon, title, description |
| `src/shared/ui/FormSection.tsx` | Form field grouping with overline title and divider |
| `src/shared/ui/StatusPill.tsx` | Status badge with tone-based coloring |
| `src/shared/ui/index.ts` | Barrel export for all kit components |

## Verification

After each page migration:
```bash
bun run lint:fix       # auto-fix import ordering, dot-notation, etc.
bun run typecheck      # TypeScript type check
bun run test           # run test suite (if configured)
bun run build          # production build
```

All four steps must pass. Do not skip lint:fix - it catches auto-fixable issues.

## Tone Mapping Reference

| Domain | Values -> Tones |
|--------|----------------|
| Audit Action | create->success, update->info, delete->error, import->warning, default->neutral |
| Review Status | PENDING->warning, RUNNING->info, COMPLETED->success, FAILED->error |
| Review Score | >=80 success, >=60 warning, default error |
| Severity | CRITICAL->error, WARNING->warning, INFO->info |
| Resolution | RESOLVED->success, ACKNOWLEDGED->info, DISMISSED->warning, default->neutral |
| Document Status | INDEXED->success, UPLOADING/UPLOADED->info, PROCESSING->warning, FAILED->error |
| Active Flags | true->success, false->neutral |

## Exemptions

- **Chat pages**: Chat/conversational pages have different UX. Exempt from kit; only apply token cleanup and skeleton loading.
- **Domain color maps**: Entity-type or category color maps (e.g. regulation categories) stay as MUI `Chip` with palette-based `sx` colors. These are tags, not statuses.
