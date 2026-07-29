---
name: orca-fe-liquid
description: Enforce the Liquid Metal design system on Orca frontend pages. Audits and migrates pages to use the shared UI kit (AdminTable, PageHeader, DetailLayout, StatusPill, GlassCard, AmbientBackground), liquid metal theme tokens, multi-preset theme switching, dramatic glassmorphism discipline, and vivid ambient atmosphere. Use when applying visual design to any page in an Orca frontend app using the Liquid Metal aesthetic, when restyling components, or when the user asks to make pages look consistent with the Liquid Metal design system.
---

# Orca FE Liquid - Liquid Metal Design System Enforcer

Goal: Any page in the app must look like it was designed by one person. The liquid metal theme does the visual work, the kit provides structure (including glass and ambient primitives), and pages own only layout and behavior.

## Prerequisites

The app must have MUI, react-router, and React Query installed and configured with the Liquid Metal theme. If not yet set up:

```bash
bun add @mui/material@^9 @emotion/react @emotion/styled @mui/icons-material@^9 react-router@^8 @tanstack/react-query @doublefin/orca-ui@^0.5 @fontsource-variable/inter @fontsource-variable/space-grotesk
```

All packages are available on the public npm registry (npmjs.com). No private registry or `.npmrc` configuration is needed for `@doublefin/orca-ui`.

Then copy the theme from this repo's reference files:
- Theme: `src/theme/theme-liquid.ts` - copy to your app's `src/theme/theme-liquid.ts`
- Presets: `src/theme/liquid-presets.ts` - copy to your app's `src/theme/liquid-presets.ts`
- UI Kit: provided by `@doublefin/orca-ui` (installed above, includes GlassCard, AmbientBackground)
- Import fonts once in your app's entry file (e.g. `src/main.tsx`):

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
```

- Wrap `OrcaApp` with the `LiquidThemeProvider` and QueryClientProvider. The provider wraps MUI `ThemeProvider` internally and supports multi-preset theme switching:

```tsx
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LiquidThemeProvider } from "./features/showcase-liquid/LiquidThemeContext";

const queryClient = new QueryClient();

export function OrcaApp() {
  return (
    <LiquidThemeProvider>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* ... app content ... */}
      </QueryClientProvider>
    </LiquidThemeProvider>
  );
}
```

For simple pages that don't need runtime theme switching, you can use the static theme directly:

```tsx
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme/theme-liquid";

<ThemeProvider theme={theme}>...</ThemeProvider>
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
- **Invisible glass**: glass surfaces with white opacity > 0.80 or blur < 16px (should use `GlassCard` with visibly translucent glass)
- **Flat ambient**: ambient blobs with opacity < 12% (should use `AmbientBackground` with vivid 12-18% opacity blobs)
- Non-flat contained primary buttons (should use solid accent color, no gradient/sheen/glow)
- Non-liquid accent colors (`#4f46e5` indigo instead of `#5b6cff` chrome blue-violet)
- Missing accent glow on focused inputs or active interactive elements
- **Gradient text on headings**: headings and body text must use solid `text.primary` color for readability. No gradient text.

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

1. Replace flat card surfaces with `<GlassCard>` where appropriate (hero bands, feature cards, metric tiles). Glass must be visibly translucent - if it looks white, it has failed.
2. Add `<AmbientBackground>` to pages that need the vivid liquid ambient layer (12-18% opacity blobs, visible atmosphere).
3. Verify contained primary buttons use a flat solid accent color (no gradient, sheen, or glow shadow).
4. Verify dialogs and popovers use a solid white background for text readability (no glass or backdrop blur).
5. Verify input focus rings include accent glow.
6. Verify all headings use solid `text.primary` color (no gradient text).

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
  GlassCard, AmbientBackground,
  type AdminTableColumn, type StatusPillTone,
  type GlassCardProps, type AmbientBackgroundProps,
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
Design-system showcases and docs pages (e.g. `src/features/showcase-liquid/`) may use the expressive patterns in styles.md section 10: glass hero bands, glass metric tiles, token swatch walls, sticky section nav, and the `LiquidThemeSelector` for multi-preset theme switching. These patterns are showcase-only; never port them to data pages, which keep the quiet `PageHeader` + `FormSection` + `AdminTable` structure.

### Multi-Preset Theme Architecture
The liquid metal system supports runtime theme switching via a two-layer architecture:
1. **MUI ThemeProvider re-render**: `createLiquidTheme(preset)` factory produces a full MUI theme per preset.
2. **CSS variable sync**: `LiquidThemeProvider` sets CSS custom properties (`--lm-glass-bg`, `--lm-wave-1`, etc.) on a wrapper div via `data-lm-theme` attribute, so non-MUI consumers (CSS animations, `AmbientBackground`) update reactively.

Presets are defined in `src/theme/liquid-presets.ts` (`LiquidPreset` interface). Currently 3 light presets: Liquid Metal, Sage Green, Corporate Blue. Dark themes are not supported.

## Reference Files

All reference implementations are in this repo:

| File | Purpose |
|------|---------|
| `skills/orca-fe-liquid/styles.md` | Full liquid metal design system specification |
| `src/theme/theme-liquid.ts` | MUI theme factory with `createLiquidTheme(preset)` and static effect constants |
| `src/theme/liquid-presets.ts` | `LiquidPreset` interface and 3 light presets (Liquid Metal, Sage Green, Corporate Blue) |
| `src/features/showcase-liquid/LiquidThemeContext.tsx` | `LiquidThemeProvider` + `useLiquidTheme()` hook for runtime theme switching |
| `@doublefin/orca-ui` | Public npm package (npmjs.com) providing all kit components including liquid kit (GlassCard v0.5 with CSS var fallbacks, AmbientBackground v0.5) |
| `src/shared/ui/index.ts` | Re-export shim: `export * from "@doublefin/orca-ui"` |
| `src/features/showcase-liquid/` | Canonical liquid metal showcase: kit usage on a docs surface with glass hero, ambient background, metric tiles, token swatches, section nav, and theme selector |

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
- **Docs & showcase surfaces**: Design-system showcase and docs pages may use the expressive patterns in styles.md section 10 (glass hero band, glass metric tiles, token swatches, sticky section nav, theme selector). Data pages never do.
