# Orca Styles Guide: "Liquid Metal" Design System

The durable rules for visual and redesign work in Orca frontend apps using the Liquid Metal aesthetic. Follow this file for any new page, any restyle, and any redesign cycle.

Goal: Any page in the app must look like it was designed by one person.
Mechanism: The liquid metal theme does the visual work, the kit provides structure (including glass and ambient primitives), and pages own only layout and behavior.

---

## 1. Design Principles & Dial Profile

### 1.1 Aesthetic Read & Dial Profile
* **Design Read**: B2B Fintech & Admin Console with a Liquid Metal visual language - cool platinum base, chrome/silver metallic accents, dramatic glassmorphism surfaces, and a single liquid blue-violet accent. Light theme only. Glass must be visibly translucent, chrome must read as metallic, ambient gradients must create atmosphere.
* **Dial Profile (data pages)**:
  * `DESIGN_VARIANCE: 4` (Predictable: Symmetrical 12-column grid, structured table layouts, hairline borders, consistent paddings).
  * `MOTION_INTENSITY: 4` (Visible motion: CSS sheen-sweep on buttons, vivid ambient drifting gradients, hover glow + lift transitions, accent glow on focus. Reduced motion honored.)
  * `VISUAL_DENSITY: 7` (Cockpit/Data-Dense: 13px table body cells, 8px/16px cell padding, high data-to-chrome ratio, hairline dividers, tabular-nums for data).
* **Dual Profile**: The profile above governs data pages. Design-system showcases and docs pages run the more expressive profile defined in section 10 - everything else in this file still applies unless section 10 explicitly relaxes it.

### 1.2 Core Disciplines
* **Liquid Metal**: Cool platinum canvas (`#f4f6fa`), visibly translucent glass surfaces (45% white + `backdrop-filter: blur(20px)` + prismatic double-border + depth shadow), chrome blue-violet accent (`#5b6cff`) with glow effects, vivid ambient gradient atmosphere. Spacing and typography do the structural work; glass and chrome provide the visual impact.
* **Visual Impact Discipline**: Glass must be **visibly translucent** (opacity <= 0.55, blur >= 16px, prismatic border visible). Ambient gradients must **create atmosphere** (blob opacity >= 12%, visible color, perceptible drift). If a glass surface looks identical to plain white at arm's length, it has failed.
* **Text Readability**: All headings and body text use solid `text.primary` (ink) color for maximum readability. Gradient text is banned across the entire design system.
* **Tokens over Literals**: Components consume theme tokens (`divider`, `text.secondary`, `background.paper`, `action.hover`, palette paths). No raw hex values in component code. (Documented exception: domain color maps like label-color or category-color maps.)
* **Composition over Config**: Shared components expose slots (`actions`, `empty`, `footer`, `children`), never behavior config. Toolbars, filter bars, drag-and-drop zones, upload/polling UI, and dialogs stay page-local.
* **Frozen Backend Contract**: Endpoints called, debounce/polling timings, payload shapes, and query invalidation keys stay untouchable during visual work. See section 6.
* **Anti-Slop Discipline** (updated for liquid metal):
  * Zero AI-purple/lila glows or gradient text.
  * Zero pure-black shadows on light backgrounds.
  * Zero placeholder-as-label in forms.
  * Zero em-dashes or en-dashes as punctuation in UI text or documentation.
  * Glass surfaces, vivid ambient gradients, and accent glow on focused inputs ARE allowed (they are the signature of this design system).
  * Contained primary buttons use flat solid accent color (no sheen-sweep or glow).
  * **Banned**: "Invisible glass" (white opacity > 0.80 with no visible blur), "flat ambient" (blob opacity < 12%), gradient text on any element.

---

## 2. Theme Tokens (`src/theme/theme-liquid.ts`)

### 2.1 Token Reference

| Token | Hex / Value | Purpose |
|---|---|---|
| `INK` | `#0f172a` (slate-900) | Primary text, dark overlays (tooltip) |
| `SLATE` | `#475569` (slate-600) | Secondary text, table headers, icons |
| `SLATE_SOFT` | `#64748b` (slate-500) | Icons, secondary-button labels |
| `SLATE_FAINT` | `#94a3b8` (slate-400) | Disabled state, input placeholders |
| `HAIRLINE` | `#e3e8f0` (cool-tinted gray) | **Structural** borders: dividers, card/table/paper edges |
| `INPUT_BORDER` | `#cbd5e1` (slate-300) | **Interactive** borders: inputs, outlined buttons, chips |
| `CANVAS` | `#f4f6fa` (cool platinum) | App background, table header fill |
| `ACCENT` / `ACCENT_HOVER` | `#5b6cff` / `#4a5ae8` | The single liquid accent and its hover state |
| `ACCENT_SOFT` / `ACCENT_SOFT_HOVER` | `rgba(91,108,255,0.10)` / `rgba(91,108,255,0.16)` | Selected item backgrounds (nav items, avatar tint) |
| `FOCUS_RING` | `0 0 0 3px rgba(91, 108, 255, 0.14)` | Input focus ring, layered with 1px accent border |
| `OVERLAY_SHADOW` | `0 12px 32px -8px rgba(30, 41, 59, 0.14), 0 4px 12px -4px rgba(91, 108, 255, 0.06)` | Accent-tinted soft shadow reserved for dialogs, popovers, and menus |
| `HOVER_BG` | `rgba(30, 41, 59, 0.04)` | Neutral cool hover wash for rows, buttons, list items |
| `CHROME_TEXT_GRADIENT` | `linear-gradient(...)` | Static chrome sweep for the default LIQUID_METAL preset (exported for backward compat, not used in UI) |
| `ACCENT_GRADIENT` | `linear-gradient(135deg, #5b6cff 0%, #7b8aff 100%)` | Liquid accent gradient (exported for backward compat, not used on buttons) |
| `SHEEN_GRADIENT` | `linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)` | Sheen sweep pseudo-element (exported for backward compat, not used on buttons) |
| `GLASS_HIGHLIGHT` | `inset 0 1px 0 rgba(255,255,255,0.8)` | Inner top highlight on glass surfaces (edge refraction) |
| `GLASS_BG` | `rgba(255,255,255,0.45)` | Visibly translucent glass background (must look glassy, not white) |
| `GLASS_BLUR` | `20px` | Backdrop-filter blur for glass surfaces |
| `GLASS_BORDER_OUTER` | `rgba(255,255,255,0.6)` | Outer prismatic border on glass surfaces |
| `GLASS_DEPTH_SHADOW` | `0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(91,108,255,0.06)` | Depth shadow giving glass surfaces a floating appearance |
| `ACCENT_GLOW` | `0 0 20px rgba(91,108,255,0.25)` | Accent glow for buttons, active states, and focus emphasis |

Palette rules: `primary` is the only accent; `secondary` is neutral slate (do not reintroduce violet); `divider` = HAIRLINE; `background.default` = CANVAS (platinum); `background.paper` = `#ffffff`; `text` = INK/SLATE/SLATE_FAINT; `action.*` = neutral cool washes.

### 2.2 Typography

* **Body stack**: `"Inter Variable"` prepended to system font stack.
* **Display stack** (h1-h3): `"Space Grotesk Variable"` -> `"Inter Variable"` -> system fallbacks. Tight tracking (`-0.02em`/`-0.015em`/`-0.01em`), slightly reduced line-height for display.
* `fontVariantNumeric: "tabular-nums"` applied via `MuiTableCell` override for data tables.
* `overline` (11px, weight 600, letter-spacing `0.05em`) is the section-label style. MUI renders it uppercase automatically.

### 2.3 Deliberately Unthemed (Blast-Radius Lock)

| Decision | Reason (Blast Radius) |
|---|---|
| `theme.shadows` left at MUI defaults | Indexed by reference in various overlay components. Overlay styling comes from `MuiDialog`/`MuiPopover` overrides instead. |
| `shape.borderRadius` stays **8** | Base multiplier in `sx` (`borderRadius: 3` = 24px). Raising base inflates all card and dialog radii app-wide. |
| `palette.grey` not remapped to slate | MUI greys match slate closely at low indices. `background.default` + `divider` handle surface styling. |
| Global font sizes unchanged | Modifying global font sizes would cause reflows across all pages. |

---

## 3. The Override Contract

Future visual work must conform to these component overrides in `src/theme/theme-liquid.ts`:

* **`MuiPaper`**: `elevation` defaults to 0. Elevation-0 Papers receive the hairline border + `GLASS_HIGHLIGHT` inner top highlight. Raised overlays keep their shadow and stay borderless.
* **`MuiAppBar`**: Visibly translucent (`rgba(255,255,255,0.55)`) + `backdrop-filter: blur(20px)` + metallic gradient hairline (pseudo-element bottom border with stronger chrome sweep).
* **`MuiTableCell`**: 13px body, `fontVariantNumeric: "tabular-nums"`; uppercase 11px/600 micro-headers on platinum fill; hairline row borders; `sizeSmall` padding 8px/16px.
* **`MuiButton`**: `disableElevation` always. Contained primary = flat solid `accent` background, `accentHover` on hover, `:active { transform: scale(0.98) }`. No gradient, sheen, or glow shadow (readability over drama). Outlined primary = neutral secondary action (slate text, INPUT_BORDER, HOVER_BG hover).
* **`MuiOutlinedInput`**: White background, INPUT_BORDER border, SLATE_FAINT hover, 1px ACCENT border + FOCUS_RING + `ACCENT_GLOW` on focus; 13px input text.
* **`MuiDialog` / `MuiPopover`**: Solid white (`#ffffff`) background + `OVERLAY_SHADOW` (accent-tinted) + hairline + 12px/10px radius. No glass or backdrop blur (text readability over glassmorphism).
* **`MuiMenu` / `MuiMenuItem`**: 4px list padding, 13px items with 6px radius.
* **`MuiTabs` / `MuiTab`**: Underline style (2px indicator, liquid accent color), sentence-case 13px tabs, ink text when selected with font weight 600.
* **`MuiListItemButton` / `MuiListItemIcon`**: 8px radius, slate text/icon, selected = ACCENT_SOFT wash + accent text/icon + 600 label.
* **`MuiSkeleton`**: Platinum shimmer `#eef1f6`.
* **`MuiTooltip`**: Dark slate micro-tooltip (`#0f172a`, 11px font, weight 500, 6px radius).

---

## 4. The Mercury UI Kit (`@doublefin/orca-ui`) v0.5+

Shared by the admin and sysadmin consoles. Install from the public npm registry via `bun add @doublefin/orca-ui@^0.5`. Import via the barrel.

### 4.0 Existing Kit Components

| Component | Purpose / Contract |
|---|---|
| `PageHeader` | `title`, `subtitle?`, `actions?`, `backHref?`/`backLabel?` |
| `AdminTable<T>` | Data table with columns config, loading, empty, footer, row click |
| `DetailLayout` | Detail-page scaffold: back link, title + `status?` pill + `avatar?` + `actions?`, children |
| `DetailRow` | Label/value row with 160px label width |
| `FormSection` | `title` (overline) + `description?` + hairline divider + stacked children |
| `StatusPill` | `tone: success/warning/error/info/neutral` + `label` |
| `EmptyState` | `icon`, `title`, `description?`, `action?` |
| `TableSkeleton` / `DetailSkeleton` | Loading placeholders, `role="progressbar"` |

### 4.1 Liquid Kit Components (new in v0.5)

| Component | Purpose / Contract |
|---|---|
| `GlassCard` | Dramatic glassmorphism surface wrapper. Props: `children`, `padding?` (default 2.5), `borderRadius?` (default 2 = 16px), `sx?`. Uses CSS custom property fallbacks (`--lm-glass-bg`, `--lm-glass-border`, `--lm-glass-shadow`) so glass values update reactively when theme presets change via `LiquidThemeProvider`. Falls back to default Liquid Metal values when no CSS vars are set. Must look visibly glassy, not white. |
| `AmbientBackground` | Vivid ambient gradient layer. Renders behind content (`z-index: -1`, `pointer-events: none`, `aria-hidden`). Four gradient blobs (silver, accent, highlight, rose) at 12-18% opacity with `blur(100px)`, drifting via CSS keyframes. Blob colors update via CSS custom properties (`--lm-wave-1` through `--lm-wave-4`) set by `LiquidThemeProvider`. Requires the liquid CSS file to be imported for animations. Uses CSS classes `lm-ambient`, `lm-ambient__blob`, `lm-ambient__noise`. |

### 4.2 AdminTable Rules

* **Columns are config, behavior is composition**: `columns: AdminTableColumn<T>[]`.
* **`rowKey: keyof T` is required**.
* **`loading` keeps real headers mounted**: Renders skeleton body rows during load.
* **`empty` is required**: Always pass `<EmptyState>`.
* **`footer` slot**: Holds Load-more buttons or `TablePagination`.
* **Row click**: `onRowClick(row)` adds hover + pointer.

### 4.3 StatusPill Tone Conventions

Same as Mercury Console:

* **Audit Action**: create -> `success`, update -> `info`, delete -> `error`, import -> `warning`, default -> `neutral`
* **Review Status**: PENDING -> `warning`, RUNNING -> `info`, COMPLETED -> `success`, FAILED -> `error`
* **Review Score**: >= 80 `success`, >= 60 `warning`, default `error`
* **Finding Severity**: CRITICAL -> `error`, WARNING -> `warning`, INFO -> `info`
* **Resolution**: RESOLVED -> `success`, ACKNOWLEDGED -> `info`, DISMISSED -> `warning`, default -> `neutral`
* **Document Status**: INDEXED -> `success`, UPLOADING/UPLOADED -> `info`, PROCESSING/CHUNKING/INDEXING -> `warning`, FAILED -> `error`, default -> `neutral`
* **Active Flags**: true -> `success`, false -> `neutral`

### 4.4 Skeletons and States

* Tables: `AdminTable loading`. Detail pages: `DetailSkeleton`. Multi-table pages: standalone `TableSkeleton`.
* Every list page must have a designed `EmptyState`.
* Spinners survive only as 16px inline action states.

### 4.5 Card and Surface Styling (Liquid Metal)

* **Dramatic glass surfaces**: Use `<GlassCard>` for hero bands, feature cards, metric tiles, and section nav. Glass = visibly translucent (CSS var `--lm-glass-bg`, default `rgba(255,255,255,0.45)`) + `backdrop-filter: blur(20px)` + prismatic double-border + depth shadow. If it looks like plain white, the glass has failed.
* **Hover state**: `translateY(-2px)` + stronger depth shadow + `borderColor` transition to `primary.main`. The lift and glow must be visible.
* **Sheen sweep**: Removed from contained primary buttons for readability. Buttons use flat solid accent color via theme override (no per-page edits needed).
* **Icon color tokens**: Replace raw hex icon colors with theme palette paths.

---

## 5. Page Structure Rules

```tsx
<Box sx={{ p: 3 }}>
  <PageHeader title="..." actions={...} />
  {/* Page-local toolbar: search field / filter bar stays in the page */}
  <AdminTable ... />
  {/* Dialogs stay in the page */}
</Box>
```

* Pages own their padding (`p: 3`); kit components are padding-agnostic.
* Detail pages: `DetailLayout` with `backHref` (never a hand-rolled back button row).
* Breadcrumbs collapse to back link + title.
* Copy preservation: Redesigns keep existing user-facing strings verbatim.
* Ambient background: Pages that need the liquid ambient layer render `<AmbientBackground />` at the top level. When wrapped in `LiquidThemeProvider`, blob colors update reactively via CSS custom properties.

---

## 6. Visual Change Process & Discipline

* **Frozen Files During Visual Work**:
  * API files (`api.ts`, `accessApi.ts`, etc.)
  * Hooks (`hooks/**`, `hooks.ts`)
  * Query keys (`queryKeys.ts`)
  * HTTP client (`src/api/**`)
  * Verification gate: `git diff --name-only -- <paths>` must be empty at the end of any purely visual change.
* **Migration Rule**: The hooks/state/effects block above `return` stays verbatim; changes are JSX-only below it.
* **MUI-First Styling**: `sx` + theme tokens. No Tailwind classes in admin pages. No `styled()`. No `React.memo` or `useMemo` on rendered rows.
* **Verification Cycle**: Run `bun run lint:fix` -> `bun run typecheck` -> `bun run test`. Run `bun run build` before finalizing.

---

## 7. Testing Patterns for Visual and Behavior Work

Same as Mercury Console:

* **Kit Components**: Unit/render tests live in the `@doublefin/orca-ui` package repo.
* **Page Behavior Tests**: MSW-backed page tests lock the frozen contract.
* **Skeleton-Test Timing Contract**: Visual work never weakens existing tests.
* **Existing Tests Rule**: Existing tests must pass unmodified.

---

## 8. Rejected Options & Anti-Patterns

Do not relitigate these settled design and implementation decisions:

* **Tailwind for Admin Pages**: MUI `sx` is the single styling system for admin surfaces.
* **`styled()` Utility**: Zero existing usage; hoisted `sx` constants resolve identical needs.
* **Config-Mega-Table**: Composition won over built-in search/filter/pagination.
* **Border Radius 10 / Shadows Rebuild / Grey-to-Slate Remap**: High blast radius for minimal gain.
* **Dark Mode Infrastructure**: Liquid Metal is light-only. Dark themes (Neutral Charcoal, Deep Teal) were evaluated and removed due to incompatibility with the light-themed UI kit and element styles. Dark mode remains deferred.
* **Gradient Text**: Chrome gradient text (`GradientText`) was evaluated and removed because gradients reduce text readability, especially on section titles and smaller text. All headings now use solid `text.primary` (ink) color.
* **Collapsible Sidebar Groups**: 4-10 nav items do not justify extra state machinery.
* **Em-Dash Usage**: Em-dash and en-dash punctuation are excluded from UI copy.
* **Violet/Purple Theme**: The single accent is chrome blue-violet (`#5b6cff`). No other violet/purple is allowed.
* **Forcing Chat Pages into Admin Kit**: Chat pages are exempt; only token cleanup and skeleton loading.
* **Flat Cards on Showcase Pages**: Glass surfaces (`GlassCard`) are the standard for cards on showcase/docs pages. Data pages may use flat hairline-bordered cards.
* **Gradient Text on Any Element**: Gradient text was removed entirely for readability. All headings and body text use solid `text.primary` color. The `GradientText` component still exists in orca-ui for backward compatibility but should not be used.
* **Gradient + Sheen Buttons**: Contained primary buttons were changed from gradient + sheen-sweep + glow to flat solid accent color. The gradient looked too dark in practice and reduced button text contrast. `ACCENT_GRADIENT` and `SHEEN_GRADIENT` constants remain exported for backward compat.
* **Glass Dialogs and Popovers**: Dialog and popover surfaces were changed from glassmorphic (semi-transparent + backdrop blur) to solid white. Semi-transparent backgrounds reduced text readability in forms and data-dense overlays. `GlassCard` remains for hero bands and feature cards where readability is less critical.

---

## 8.5 Multi-Preset Theme Architecture

The liquid metal system supports runtime theme switching through a two-layer architecture:

1. **MUI ThemeProvider re-render**: `createLiquidTheme(preset: LiquidPreset)` factory produces a full MUI theme per preset, updating all palette tokens, component overrides, and effect constants.
2. **CSS variable sync**: `LiquidThemeProvider` sets CSS custom properties on a wrapper div (via `data-lm-theme` attribute), so non-MUI consumers (CSS animations in `AmbientBackground`, `GlassCard` fallbacks) update reactively.

### CSS Custom Properties

| Variable | Default (Liquid Metal) | Purpose |
|---|---|---|
| `--lm-glass-bg` | `rgba(255,255,255,0.45)` | Glass background color |
| `--lm-glass-border` | `rgba(255,255,255,0.6)` | Glass border color |
| `--lm-glass-shadow` | (multi-layer) | Glass depth + highlight shadow |
| `--lm-canvas-bg` | `#f4f6fa` | Canvas background |
| `--lm-wave-1` through `--lm-wave-4` | (preset waves) | Ambient blob colors |
| `--lm-text-primary` | `#0f172a` | Primary text color |
| `--lm-text-secondary` | `#475569` | Secondary text color |
| `--lm-nav-bg` | `rgba(244,246,250,0.6)` | Navigation background |
| `--lm-accent-soft` | `rgba(91,108,255,0.08)` | Soft accent background |

### Presets (`src/theme/liquid-presets.ts`)

`LiquidPreset` interface: `id`, `label`, `description`, `canvas`, `ink`, `accent`, `glass: { bg, border, shadow }`, `waves: [4]`, `previewGradient`.

Currently 3 light presets (dark themes removed):
- **Liquid Metal**: Chrome blue-violet (`#5b6cff`) on cool platinum (`#f4f6fa`)
- **Sage Green**: Organic green (`#5b8c5a`) on warm cream (`#f0f4f0`)
- **Corporate Blue**: Steel blue (`#3b82f6`) on cool white (`#f0f4fa`)

### Usage

```tsx
// Full app with theme switching:
<LiquidThemeProvider>
  <CssBaseline />
  {/* app content */}
</LiquidThemeProvider>

// Static single-theme page:
import { theme } from "./theme/theme-liquid";
<ThemeProvider theme={theme}>...</ThemeProvider>
```

---

## 9. Page Migration Checklist

When migrating any page to the Liquid Metal design system, apply these transforms in order:

### 9.1 Structural Migration
1. **Header**: Replace hand-rolled back button + `Typography` title with `<PageHeader>` or `<DetailLayout>`.
2. **Loading state**: Replace `if (isLoading) return <CircularProgress />` with inline skeletons.
3. **Tables**: Replace raw MUI `<Table>` with `<AdminTable>`.
4. **Forms**: Group related fields with `<FormSection>`.
5. **Status indicators**: Replace `<Chip>` status badges with `<StatusPill>` using tone mappings.
6. **Label/value pairs**: Replace custom row layouts with `<DetailRow>`.

### 9.2 Token Cleanup
1. Replace all raw hex colors with theme palette tokens.
2. Replace `grey.50` backgrounds with `background.default`.
3. Replace `boxShadow: <number>` with `OVERLAY_SHADOW` (overlays only) or remove.
4. Replace `borderColor: "grey.300"` with `divider`.
5. Replace `bgcolor: "white"` with `background.paper`.

### 9.3 Liquid Metal Upgrade
1. Replace flat card surfaces with `<GlassCard>` for hero bands, feature cards, metric tiles (glass must be visibly translucent - if it looks white, it has failed).
2. Add `<AmbientBackground>` to pages that need the vivid liquid ambient layer (blobs at 12-18% opacity, visible atmosphere).
3. Verify contained primary buttons use flat solid accent color (no gradient, sheen, or glow shadow; theme-level, no per-page edits).
4. Verify dialogs and popovers use solid white background (theme-level, no glass or backdrop blur for text readability).
5. Verify `fontVariantNumeric: "tabular-nums"` on table data cells (theme-level).
6. Verify all headings use solid `text.primary` color (no gradient text).

### 9.4 Anti-Slop Audit
1. Remove all unauthorized gradient backgrounds (background gradients are allowed only in `AmbientBackground` and theme-defined sheen/glow effects).
2. Remove all gradient text (all text must use solid `text.primary` color).
3. Remove hover lifts beyond `translateY(-2px)`.
4. Remove generic card shadows (`boxShadow` on non-overlay, non-glass surfaces). Glass depth shadows ARE allowed.
5. Replace em-dashes with hyphens.
6. Remove violet/purple colors; replace with `primary.main` (chrome blue-violet).
7. Remove raw hex color maps; replace with theme palette paths.
8. **Remove invisible glass**: Any glass surface with white opacity > 0.80 or blur < 16px is invisible and must be fixed.
9. **Remove flat ambient**: Any ambient blob with opacity < 12% must be increased to create visible atmosphere.

---

## 10. Expressive Surfaces (Showcase & Docs Pages)

Data pages keep the quiet dial profile (section 1.1). Design-system showcases, docs pages, and marketing-style surfaces inside the console may run a more expressive profile. The canonical implementation is `src/features/showcase-liquid/` (page + `components/`): study it before building a new expressive surface.

### 10.1 Dial Profile for Expressive Surfaces

* `DESIGN_VARIANCE: 6` (glass hero band with depth shadow, stat tiles with hover glow, swatch walls with glass cards, varied section compositions; still grid-based).
* `MOTION_INTENSITY: 5` (CSS transitions + smooth-scroll anchors + vivid ambient background drift + hover lift/glow on interactive elements; honor `prefers-reduced-motion`).
* `VISUAL_DENSITY: 5` (roomier section rhythm than data pages; all values stay token-driven).

### 10.2 Allowed Moves (expressive surfaces only)

* **Docs-page container**: Centered `maxWidth: 1200` (`mx: "auto"`) with responsive padding.
* **Dramatic glass hero band**: `<GlassCard>` with large border-radius (up to 24px), visibly translucent (CSS var `--lm-glass-bg`, default 45% white), `backdrop-filter: blur(20px)`, `GLASS_DEPTH_SHADOW`, prismatic double-border. Decorative gradient-filled translucent shapes (`rgba(91,108,255,0.08)` to `rgba(244,114,182,0.06)` filled circles/rings, `aria-hidden`). The hero must look dramatically different from a plain white card.
* **Solid readable headlines**: All headings use solid `text.primary` color for maximum readability. No gradient text.
* **Glass metric tiles**: `<GlassCard>` + icon chip + display number + caption. Hover = `translateY(-2px)` + `ACCENT_GLOW` border color + stronger depth shadow.
* **Colored icon chips**: 36px tile, `borderRadius: 2`, background with subtle gradient (`alpha(theme.palette.<hue>.main, 0.1)` to `alpha(theme.palette.<hue>.main, 0.05)`), icon color `<hue>.dark`.
* **Section header color cycle**: Section openers may cycle the five semantic hues across sections. Section titles use solid `text.primary` color.
* **Token swatch walls**: Render palette values live from `useTheme()`. Swatches backed by glass cards with hover lift.
* **Sticky section nav**: Glass-pill anchor chips with liquid accent hover + glow on active state.
* **Theme selector**: `<LiquidThemeSelector>` for multi-preset theme switching (glass pills with color preview swatches).
* **Vivid ambient background**: `<AmbientBackground>` from orca-ui for the atmospheric drifting gradient layer. Four blobs at 12-18% opacity must create visible color atmosphere. Blob colors update reactively via CSS custom properties when theme preset changes.

### 10.3 Still Banned Everywhere (including expressive surfaces)

* Unauthorized gradients (only theme sheen effects and `AmbientBackground` are allowed).
* Gradient text on any element (all text must be solid color for readability).
* Violet/purple hues outside the theme palette.
* Hover lifts beyond `translateY(-2px)`.
* Card shadows on non-overlay surfaces (glass depth shadows ARE allowed).
* Em-dashes and en-dashes in UI copy and documentation.
* Raw hex colors in component code (exceptions: alpha-white inside glass bands, documented domain color maps).
* Div-based fake product screenshots.
