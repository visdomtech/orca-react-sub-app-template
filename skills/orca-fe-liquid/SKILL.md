---
name: orca-fe-liquid
description: Enforce the Liquid Metal design system on Orca frontend pages. Audits and migrates pages to use the shared UI kit (AdminTable, PageHeader, DetailLayout, StatusPill, GlassCard, GradientText, AmbientBackground), liquid metal theme tokens, and glassmorphism discipline. Use when applying visual design to any page in an Orca frontend app using the Liquid Metal aesthetic, when restyling components, or when the user asks to make pages look consistent with the Liquid Metal design system.
---

# Orca FE Liquid - Liquid Metal Design System Enforcer

Goal: Any page in the app must look like it was designed by one person. The liquid metal theme does the visual work, the kit provides structure (including glass and gradient primitives), and pages own only layout and behavior.

## Prerequisites

The app must have MUI, react-router, and React Query installed and configured with the Liquid Metal theme. If not yet set up:

```bash
bun add @mui/material@^9 @emotion/react @emotion/styled @mui/icons-material@^9 react-router@^8 @tanstack/react-query @doublefin/orca-ui@^0.3 @fontsource-variable/inter @fontsource-variable/space-grotesk
```

All packages are available on the public npm registry (npmjs.com). No private registry or `.npmrc` configuration is needed for `@doublefin/orca-ui`.

Then copy the theme from this repo's reference files:
- Theme: `src/theme/theme-liquid.ts` - copy to your app's `src/theme/theme-liquid.ts`
- UI Kit: provided by `@doublefin/orca-ui` (installed above, includes GlassCard, GradientText, AmbientBackground)
- Import fonts once in your app's entry file (e.g. `src/main.tsx`):

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
```

- Wrap `OrcaApp` with the liquid ThemeProvider and QueryClientProvider:

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "./theme/theme-liquid";

const queryClient = new QueryClient();

export function OrcaApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* ... app content ... */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

## First Step: Read the Design Spec

Before any changes, read the design spec in this repo:

```
Read: skills/orca-fe-liquid/styles.md
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
- Raw hex colors instead of theme tokens
- `grey.50` instead of `background.default`
- `bgcolor: "white"` instead of `background.paper`
- `borderColor: "grey.300"` instead of `divider`
- `boxShadow: <number>` instead of `OVERLAY_SHADOW` or removed

### Liquid Metal Violations
- Solid opaque card backgrounds where glass (`GlassCard`) should be used
- Missing chrome gradient text on display headlines (should use `GradientText`)
- Missing ambient background on pages (should use `AmbientBackground`)
- Flat buttons where gradient + sheen sweep should apply (contained primary)
- Non-liquid accent colors (`#4f46e5` indigo instead of `#5b6cff` chrome blue-violet)

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

Replace all raw values with liquid metal theme tokens:
- Hex colors -> `primary.main`, `text.secondary`, `divider`, `background.paper`, `success.dark`, etc.
- `grey.50` -> `background.default`
- `boxShadow: <n>` -> `OVERLAY_SHADOW` (overlays only) or remove
- `grey.300` borders -> `divider`
- `"white"` -> `background.paper`

### Step 3: Liquid Metal Upgrade

1. Replace flat card surfaces with `<GlassCard>` where appropriate (hero bands, feature cards, metric tiles).
2. Add `<GradientText>` to display headlines (h1-h2) on showcase/docs pages.
3. Add `<AmbientBackground>` to pages that need the liquid ambient layer.
4. Verify contained primary buttons show the gradient + sheen sweep.
5. Verify glass overlays on dialogs and popovers.

## Critical Rules

### Frozen Files
During visual work, these are untouchable:
- API files (`api.ts`)
- Hooks (`hooks.ts`, `hooks/`)
- Query keys (`queryKeys.ts`)
- HTTP client (`src/api/`)

Full contract in styles.md section 6.

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
import {
  AdminTable, PageHeader, DetailLayout, DetailRow, FormSection,
  StatusPill, EmptyState, TableSkeleton, DetailSkeleton,
  GlassCard, GradientText, AmbientBackground,
  type AdminTableColumn, type StatusPillTone,
  type GlassCardProps, type GradientTextProps, type AmbientBackgroundProps,
} from "@doublefin/orca-ui";
```

### Badge Wrapper Pattern
```tsx
import { StatusPill, type StatusPillTone } from "@doublefin/orca-ui";
import type { SomeEnum } from "...";

const TONE_MAP: Record<SomeEnum, StatusPillTone> = { A: "success", B: "warning" };
const LABEL_MAP: Record<SomeEnum, string> = { A: "Alpha", B: "Beta" };

export function SomeBadge({ value }: { value: SomeEnum }) {
  return <StatusPill tone={TONE_MAP[value]} label={LABEL_MAP[value]} />;
}
```

### Docs & Showcase Surfaces
Design-system showcases and docs pages (e.g. `src/features/showcase-liquid/`) may use the expressive patterns in styles.md section 10: glass hero bands, chrome gradient headlines, glass metric tiles, token swatch walls, and sticky section nav. These patterns are showcase-only; never port them to data pages, which keep the quiet `PageHeader` + `FormSection` + `AdminTable` structure.

## Reference Files

All reference implementations are in this repo:

| File | Purpose |
|------|---------|
| `skills/orca-fe-liquid/styles.md` | Full liquid metal design system specification |
| `src/theme/theme-liquid.ts` | MUI theme with Liquid Metal tokens and overrides |
| `@doublefin/orca-ui` | Public npm package (npmjs.com) providing all kit components including liquid kit (GlassCard, GradientText, AmbientBackground) |
| `src/shared/ui/index.ts` | Re-export shim: `export * from "@doublefin/orca-ui"` |
| `src/features/showcase-liquid/` | Canonical liquid metal showcase: kit usage on a docs surface with glass hero, gradient text, ambient background, metric tiles, token swatches, section nav |

## Verification

After each page migration:
```bash
bun run lint:fix       # auto-fix import ordering, dot-notation, etc.
bun run typecheck      # TypeScript type check
bun run test           # run test suite (if configured)
bun run build          # production build
```

All configured steps must pass.

## Tone Mapping Reference

Full conventions documented in styles.md section 4.2.

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
- **Docs & showcase surfaces**: Design-system showcase and docs pages may use the expressive patterns in styles.md section 10 (glass hero band, chrome gradient headlines, glass metric tiles, token swatches, sticky section nav). Data pages never do.
