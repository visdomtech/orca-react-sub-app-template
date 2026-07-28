# Orca Styles Guide: "Liquid Metal" Design System

The durable rules for visual and redesign work in Orca frontend apps using the Liquid Metal aesthetic. Follow this file for any new page, any restyle, and any redesign cycle.

Goal: Any page in the app must look like it was designed by one person.
Mechanism: The liquid metal theme does the visual work, the kit provides structure (including glass and gradient primitives), and pages own only layout and behavior.

---

## 1. Design Principles & Dial Profile

### 1.1 Aesthetic Read & Dial Profile
* **Design Read**: B2B Fintech & Admin Console with a Liquid Metal visual language - cool platinum base, chrome/silver metallic accents, glassmorphism surfaces, and a single liquid blue-violet accent. Light theme only.
* **Dial Profile**:
  * `DESIGN_VARIANCE: 3` (Predictable: Symmetrical 12-column grid, structured table layouts, hairline borders, consistent paddings).
  * `MOTION_INTENSITY: 3` (Subtle motion: CSS sheen-sweep on buttons, ambient drifting gradients in background, hover border-color transitions. Reduced motion honored.)
  * `VISUAL_DENSITY: 7` (Cockpit/Data-Dense: 13px table body cells, 8px/16px cell padding, high data-to-chrome ratio, hairline dividers, tabular-nums for data).
* **Dual Profile**: The profile above governs data pages. Design-system showcases and docs pages may run the more expressive profile defined in section 10 - everything else in this file still applies unless section 10 explicitly relaxes it.

### 1.2 Core Disciplines
* **Liquid Metal**: Cool platinum canvas (`#f4f6fa`), glass surfaces (translucent white + `backdrop-filter: blur` + 1px inner highlight), chrome blue-violet accent (`#5b6cff`), chrome silver gradient text for display headlines, metallic hairline borders. Spacing and typography do the visual work; chrome stays quiet.
* **Tokens over Literals**: Components consume theme tokens (`divider`, `text.secondary`, `background.paper`, `action.hover`, palette paths). No raw hex values in component code. (Documented exception: domain color maps like label-color or category-color maps.)
* **Composition over Config**: Shared components expose slots (`actions`, `empty`, `footer`, `children`), never behavior config. Toolbars, filter bars, drag-and-drop zones, upload/polling UI, and dialogs stay page-local.
* **Frozen Backend Contract**: Endpoints called, debounce/polling timings, payload shapes, and query invalidation keys stay untouchable during visual work. See section 6.
* **Anti-Slop Discipline** (updated for liquid metal):
  * Zero AI-purple/lila glows or unauthorized gradient text (chrome gradient text via `GradientText` is allowed).
  * Zero pure-black shadows on light backgrounds.
  * Zero placeholder-as-label in forms.
  * Zero em-dashes or en-dashes as punctuation in UI text or documentation.
  * Glass surfaces and sheen-sweep effects ARE allowed (they are the signature of this design system).

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
| `CHROME_TEXT_GRADIENT` | `linear-gradient(135deg, #1e293b 0%, #64748b 50%, #94a3b8 100%)` | Chrome silver sweep for display headlines |
| `ACCENT_GRADIENT` | `linear-gradient(135deg, #5b6cff 0%, #7b8aff 100%)` | Liquid accent gradient for contained primary buttons |
| `SHEEN_GRADIENT` | `linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)` | Sheen sweep pseudo-element on button hover |
| `GLASS_HIGHLIGHT` | `inset 0 1px 0 rgba(255,255,255,0.7)` | Inner top highlight on glass surfaces (edge refraction) |

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
* **`MuiAppBar`**: Translucent white (`rgba(255,255,255,0.72)`) + `backdrop-filter: blur(12px)` + metallic gradient hairline (pseudo-element bottom border).
* **`MuiTableCell`**: 13px body, `fontVariantNumeric: "tabular-nums"`; uppercase 11px/600 micro-headers on platinum fill; hairline row borders; `sizeSmall` padding 8px/16px.
* **`MuiButton`**: `disableElevation` always. Contained primary = `ACCENT_GRADIENT` background + sheen-sweep `::after` on hover (transform-only) + `:active { transform: scale(0.98) }`. Outlined primary = neutral secondary action (slate text, INPUT_BORDER, HOVER_BG hover).
* **`MuiOutlinedInput`**: White background, INPUT_BORDER border, SLATE_FAINT hover, 1px ACCENT border + FOCUS_RING on focus; 13px input text.
* **`MuiDialog` / `MuiPopover`**: Glass overlays (`rgba(255,255,255,0.92)` + `backdrop-filter: blur(8px)`) + `OVERLAY_SHADOW` (accent-tinted) + hairline + 12px/10px radius.
* **`MuiMenu` / `MuiMenuItem`**: 4px list padding, 13px items with 6px radius.
* **`MuiTabs` / `MuiTab`**: Underline style (2px indicator, liquid accent color), sentence-case 13px tabs, ink text when selected with font weight 600.
* **`MuiListItemButton` / `MuiListItemIcon`**: 8px radius, slate text/icon, selected = ACCENT_SOFT wash + accent text/icon + 600 label.
* **`MuiSkeleton`**: Platinum shimmer `#eef1f6`.
* **`MuiTooltip`**: Dark slate micro-tooltip (`#0f172a`, 11px font, weight 500, 6px radius).

---

## 4. The Mercury UI Kit (`@doublefin/orca-ui`) v0.3+

Shared by the admin and sysadmin consoles. Install from the public npm registry via `bun add @doublefin/orca-ui@^0.3`. Import via the barrel.

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

### 4.1 Liquid Kit Components (new in v0.3)

| Component | Purpose / Contract |
|---|---|
| `GradientText` | Chrome gradient text for display headlines. Props: `children`, `gradient?` (CSS gradient string, defaults to chrome silver sweep), `component?` (element type, defaults to "span"), `sx?`. Uses `background-clip: text`. Use sparingly on h1-h2 only. |
| `GlassCard` | Glassmorphism surface wrapper. Props: `children`, `padding?` (default 2.5), `borderRadius?` (default 2 = 16px), `sx?`. Translucent white + `backdrop-filter: blur(12px)` + hairline border + inner top highlight. |
| `AmbientBackground` | Fixed ambient gradient layer. Renders behind content (`z-index: -1`, `pointer-events: none`, `aria-hidden`). Requires the liquid CSS file to be imported for animations. Uses CSS classes `lm-ambient`, `lm-ambient__blob`, `lm-ambient__noise`. |

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

* **Glass surfaces over flat cards**: Use `<GlassCard>` for hero bands, feature cards, and metric tiles. Glass = translucent white + backdrop-filter + inner highlight + hairline border.
* **Hover state**: `borderColor` transition to `primary.main` + subtle `translateY(-1px)`.
* **Sheen sweep**: Contained primary buttons get the sheen-sweep via theme override (no per-page edits needed).
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
* Ambient background: Pages that need the liquid ambient layer render `<AmbientBackground />` at the top level.

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
* **Dark Mode Infrastructure**: Liquid Metal is light-only. Dark mode is deferred.
* **Collapsible Sidebar Groups**: 4-10 nav items do not justify extra state machinery.
* **Em-Dash Usage**: Em-dash and en-dash punctuation are excluded from UI copy.
* **Violet/Purple Theme**: The single accent is chrome blue-violet (`#5b6cff`). No other violet/purple is allowed.
* **Forcing Chat Pages into Admin Kit**: Chat pages are exempt; only token cleanup and skeleton loading.
* **Flat Cards on Showcase Pages**: Glass surfaces (`GlassCard`) are the standard for cards on showcase/docs pages. Data pages may use flat hairline-bordered cards.
* **Gradient Text on Body Copy**: `GradientText` is for display headlines (h1-h2) only. Body text stays solid, high-contrast.

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
1. Replace flat card surfaces with `<GlassCard>` for hero bands, feature cards, metric tiles.
2. Add `<GradientText>` to display headlines on showcase/docs pages.
3. Add `<AmbientBackground>` to pages that need the liquid ambient layer.
4. Verify contained primary buttons show the gradient + sheen sweep (theme-level, no per-page edits).
5. Verify glass overlays on dialogs and popovers (theme-level).
6. Verify `fontVariantNumeric: "tabular-nums"` on table data cells (theme-level).

### 9.4 Anti-Slop Audit
1. Remove all unauthorized gradient backgrounds (background gradients are allowed only in `AmbientBackground` and theme-defined sheen effects).
2. Remove all unauthorized gradient text (only `GradientText` component is allowed).
3. Remove hover lifts beyond `translateY(-1px)`.
4. Remove card shadows (`boxShadow` on non-overlay surfaces).
5. Replace em-dashes with hyphens.
6. Remove violet/purple colors; replace with `primary.main` (chrome blue-violet).
7. Remove raw hex color maps; replace with theme palette paths.

---

## 10. Expressive Surfaces (Showcase & Docs Pages)

Data pages keep the quiet dial profile (section 1.1). Design-system showcases, docs pages, and marketing-style surfaces inside the console may run a more expressive profile. The canonical implementation is `src/features/showcase-liquid/` (page + `components/`): study it before building a new expressive surface.

### 10.1 Dial Profile for Expressive Surfaces

* `DESIGN_VARIANCE: 4-5` (glass hero band, stat tiles, swatch walls, varied section compositions; still grid-based).
* `MOTION_INTENSITY: 3` (CSS transitions + smooth-scroll anchors + ambient background drift; honor `prefers-reduced-motion`).
* `VISUAL_DENSITY: 5` (roomier section rhythm than data pages; all values stay token-driven).

### 10.2 Allowed Moves (expressive surfaces only)

* **Docs-page container**: Centered `maxWidth: 1200` (`mx: "auto"`) with responsive padding.
* **Glass hero band**: `<GlassCard>` with large border-radius (up to 24px), translucent white, backdrop-filter blur, chrome gradient headline via `<GradientText>`, solid translucent geometric shapes (`rgba(255,255,255,0.08-0.18)` circles/rings, `aria-hidden`). Alpha-white treatments are allowed inside glass bands.
* **Chrome gradient headlines**: `<GradientText>` on display text (h1-h2). Default gradient is chrome silver sweep. Never use on body text.
* **Glass metric tiles**: `<GlassCard>` + icon chip + display number + caption. Hover = `borderColor` transition + subtle `translateY(-1px)`.
* **Colored icon chips**: 36px tile, `borderRadius: 2`, background `alpha(theme.palette.<hue>.main, 0.1)`, icon color `<hue>.dark`.
* **Section header color cycle**: Section openers may cycle the five semantic hues across sections.
* **Token swatch walls**: Render palette values live from `useTheme()`.
* **Sticky section nav**: Glass-pill anchor chips with liquid accent hover.
* **Ambient background**: `<AmbientBackground>` from orca-ui for the drifting gradient layer.

### 10.3 Still Banned Everywhere (including expressive surfaces)

* Unauthorized gradients (only `GradientText`, theme sheen effects, and `AmbientBackground` are allowed).
* Violet/purple hues outside the theme palette.
* Hover lifts beyond `translateY(-1px)`.
* Card shadows on non-overlay surfaces.
* Em-dashes and en-dashes in UI copy and documentation.
* Raw hex colors in component code (exceptions: alpha-white inside glass bands, documented domain color maps).
* Gradient text on body copy (only display headlines via `GradientText`).
* Div-based fake product screenshots.
