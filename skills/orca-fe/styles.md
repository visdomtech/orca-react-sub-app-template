# Orca Styles Guide: "Mercury Console" Design System

The durable rules for visual and redesign work in Orca frontend apps. Follow this file for any new page, any restyle, and any redesign cycle.

Goal: Any page in the app must look like it was designed by one person.
Mechanism: The theme does the visual work, the kit provides structure, and pages own only layout and behavior.

---

## 1. Design Principles & Dial Profile

### 1.1 Aesthetic Read & Dial Profile
* **Design Read**: B2B Fintech & Admin Console for technical users and enterprise compliance operators, with a quiet Mercury/Stripe visual language, leaning toward MUI 9 theme tokens + structured Mercury UI kit (`@doublefin/orca-ui`).
* **Dial Profile**:
  * `DESIGN_VARIANCE: 3` (Predictable: Symmetrical 12-column grid, structured table layouts, hairline borders, consistent paddings).
  * `MOTION_INTENSITY: 2` (Static/Fluid CSS: Subtle hover/active states, 16px inline action spinners, reduced motion honored by default).
  * `VISUAL_DENSITY: 7` (Cockpit/Data-Dense: 13px table body cells, 8px/16px cell padding, high data-to-chrome ratio, hairline dividers instead of elevated cards).

### 1.2 Core Disciplines
* **Quiet Fintech**: White surfaces, hairline borders (`#e2e8f0`) instead of drop shadows, slate ink hierarchy (`#0f172a` primary, `#475569` secondary), and exactly one accent color (indigo `#4f46e5`). Spacing and typography do the visual work; chrome stays silent.
* **Tokens over Literals**: Components consume theme tokens (`divider`, `text.secondary`, `background.paper`, `action.hover`, palette paths). No raw hex values in component code. (Documented exception: domain color maps like label-color or category-color maps.)
* **Composition over Config**: Shared components expose slots (`actions`, `empty`, `footer`, `children`), never behavior config. Toolbars, filter bars, drag-and-drop zones, upload/polling UI, and dialogs stay page-local.
* **Frozen Backend Contract**: Endpoints called, debounce/polling timings, payload shapes, and query invalidation keys stay untouchable during visual work. See §6.
* **Anti-Slop Discipline**:
  * Zero AI-purple/lila glows or gradient text.
  * Zero pure-black shadows on light backgrounds.
  * Zero placeholder-as-label in forms.
  * Zero em-dashes (`—`) or en-dashes (`–`) as punctuation in UI text or documentation.

---

## 2. Theme Tokens (`src/theme/theme.ts`)

### 2.1 Token Reference

| Token | Hex / Value | Purpose |
|---|---|---|
| `INK` | `#0f172a` (slate-900) | Primary text, dark overlays (tooltips) |
| `SLATE` | `#475569` (slate-600) | Secondary text, table headers, icons |
| `SLATE_SOFT` | `#64748b` (slate-500) | Icons, secondary-button labels |
| `SLATE_FAINT` | `#94a3b8` (slate-400) | Disabled state, input placeholders |
| `HAIRLINE` | `#e2e8f0` (slate-200) | **Structural** borders: dividers, card/table/paper edges |
| `INPUT_BORDER` | `#cbd5e1` (slate-300) | **Interactive** borders: inputs, outlined buttons, chips |
| `CANVAS` | `#f8fafc` (slate-50) | App background, table header fill |
| `ACCENT` / `ACCENT_HOVER` | `#4f46e5` / `#4338ca` | The single indigo accent and its hover state |
| `ACCENT_SOFT` / `ACCENT_SOFT_HOVER` | `#eef2ff` / `#e0e7ff` | Selected item backgrounds (nav items, avatar tint) |
| `FOCUS_RING` | `0 0 0 3px rgba(79, 70, 229, 0.12)` | Input focus ring, layered with 1px accent border |
| `OVERLAY_SHADOW` | `0 12px 32px -8px rgba(15,23,42,0.12)` | Soft slate shadow reserved for dialogs, popovers, and menus |
| `HOVER_BG` | `rgba(15, 23, 42, 0.04)` | Neutral slate hover wash for rows, buttons, list items |

Palette rules: `primary` is the only accent; `secondary` is demoted to neutral slate (do not reintroduce violet); `divider` = HAIRLINE; `background.default` = CANVAS; `background.paper` = `#ffffff`; `text` = INK/SLATE/SLATE_FAINT; `action.*` = neutral slate washes.

### 2.2 Typography

* System font stack (`system-ui`-first).
* **Inter Slot**: If the Inter dependency is approved, `bun add @fontsource-variable/inter`, import once in your app's entry file (e.g. `src/main.tsx`) next to `./index.css`, and prepend `'"Inter Variable"'` to `FONT_STACK`. Two lines.
* Tight tracking only on h1–h3 (`-0.02em`/`-0.015em`/`-0.01em`). Heading sizes and weights remain unchanged from the theme.
* Data density comes from the `MuiTableCell` override (13px table body), **not** from shrinking global `body2` (which would reflow chat and other non-admin pages).
* `overline` (11px, weight 600, letter-spacing `0.05em`) is the section-label style (sidebar groups, form sections). MUI renders it uppercase automatically.

### 2.3 Deliberately Unthemed (Blast-Radius Lock)

| Decision | Reason (Blast Radius) |
|---|---|
| `theme.shadows` left at MUI defaults | Indexed by reference in various overlay components. Overlay styling comes from `MuiDialog`/`MuiPopover` overrides instead. |
| `shape.borderRadius` stays **8** | Base multiplier in `sx` (`borderRadius: 3` = 24px). Raising base inflates all card and dialog radii app-wide. Larger radii are applied surgically (`MuiDialog.paper` 12px, `MuiPopover.paper` 10px). |
| `palette.grey` not remapped to slate | MUI greys match slate closely at low indices. `background.default` + `divider` handle surface styling. |
| Global font sizes unchanged | Modifying global font sizes would cause reflows across all pages. |

---

## 3. The Override Contract

Future visual work must conform to these component overrides in `src/theme/theme.ts`:

* **`MuiPaper`**: `elevation` defaults to 0. Elevation-0 Papers receive the hairline border; raised overlays (high-elevation menus, popovers) keep their shadow and stay borderless. (Surface = Paper, border = automatic.)
* **`MuiAppBar`**: White, ink text, hairline bottom border. AppBar is used only by the navbar.
* **`MuiTableCell`**: 13px body; uppercase 11px/600 micro-headers on slate-50 fill; hairline row borders; `sizeSmall` padding 8px/16px. Never add `sx={{ fontWeight: 600 }}` or header colors on header cells in pages; the theme owns table chrome.
* **`MuiButton`**: `disableElevation` always. The `outlined`+`primary` variant override is the neutral "secondary action" (slate text, INPUT_BORDER, HOVER_BG hover). Contained primary keeps the accent.
* **`MuiOutlinedInput`**: White background, INPUT_BORDER border, SLATE_FAINT hover, 1px ACCENT border + FOCUS_RING on focus; 13px input text. `MuiInputLabel` matches at 13px.
* **`MuiDialog` / `MuiPopover`**: OVERLAY_SHADOW + hairline + 12px/10px radius. These are the only places a shadow recipe appears outside `theme.shadows`.
* **`MuiMenu` / `MuiMenuItem`**: 4px list padding, 13px items with 6px radius.
* **`MuiTabs` / `MuiTab`**: Underline style (2px indicator), sentence-case 13px tabs, ink text when selected with font weight 600.
* **`MuiListItemButton` / `MuiListItemIcon`**: 8px radius, slate text/icon, selected = ACCENT_SOFT wash + accent text/icon + 600 label. All nav selection styling comes from this override; never hand-style selected nav items.
* **`MuiSkeleton`**: Softened base color `#f1f5f9`. Loading content uses Skeleton, not spinners.
* **`MuiTooltip`**: Dark slate micro-tooltip (`#0f172a`, 11px font, weight 500, 6px radius).

---

## 4. The Mercury UI Kit (`@doublefin/orca-ui`)

Shared by the admin and sysadmin consoles. Install via `bun add @doublefin/orca-ui`. Import via the barrel: `import { AdminTable, PageHeader, ... } from "@doublefin/orca-ui"`.

| Component | Purpose / Contract |
|---|---|
| `PageHeader` | `title`, `subtitle?`, `actions?` (right-aligned), `backHref?`/`backLabel?` (react-router back link) |
| `AdminTable<T>` | Data table component. See AdminTable rules below. |
| `DetailLayout` | Detail-page scaffold: back link, title + `status?` pill + `avatar?` + `actions?`, followed by children (Tabs/sections; never owns tab state). |
| `DetailRow` | Label/value row with 160px label width. The standard way to render label/value pairs. |
| `FormSection` | `title` (overline) + `description?` + hairline divider + stacked children. |
| `StatusPill` | `tone: success/warning/error/info/neutral` + `label`. The standard status visual. |
| `EmptyState` | `icon` (required), `title`, `description?`, `action?`. The standard empty state visual. |
| `TableSkeleton` / `DetailSkeleton` | Loading placeholders. Both expose `role="progressbar"`. |

### 4.1 AdminTable Rules

* **Columns are config, behavior is composition**: `columns: AdminTableColumn<T>[]` (`key`, `label?`, `align?`, `width?`, `render(row)`). Define at module level when columns do not close over handlers; inside component when they do (e.g. action columns).
* **`rowKey: keyof T` is required**: Index keys break under infinite-scroll or reorder. Composite uniqueness (e.g. CultureOptions) must key by a field unique within that table instance (`code`).
* **`loading` keeps real headers mounted**: Renders skeleton body rows during load. Pass `skeletonRows={pageSize}` when page size is known (e.g. 25). Page-level early-return spinners are banned; headers and toolbars remain visible during load.
* **`empty` is required**: Always pass `<EmptyState icon={...} title="..." />` preserving original page copy. Rendered in a full-width row when `!loading && rows.length === 0`. Loading state takes precedence over empty state.
* **`footer` slot**: Holds Load-more buttons or `TablePagination`. `TablePagination` requires `sx={{ flexGrow: 1 }}` to fill the footer and right-align controls.
* **Row click**: `onRowClick(row)` adds hover + pointer. For action cells inside a clickable row, wrap cell content in a `stopPropagation` Box.
* **Column width**: Applied via standard `style` attribute; row chrome uses hoisted `CLICKABLE_ROW_SX`.

### 4.2 StatusPill Tone Conventions

Statuses use `StatusPill`. Enum tags (entity types, categories, event names) use outlined `Chip` components (they are tags, not statuses). Established mappings:

* **Audit Action**: create -> `success`, update -> `info`, delete -> `error`, import -> `warning`, default -> `neutral`
* **Review Status**: PENDING -> `warning`, RUNNING -> `info`, COMPLETED -> `success`, FAILED -> `error`
* **Review Score**: >= 80 `success`, >= 60 `warning`, default `error`
* **Finding Severity**: CRITICAL -> `error`, WARNING -> `warning`, INFO -> `info`
* **Resolution**: RESOLVED -> `success`, ACKNOWLEDGED -> `info`, DISMISSED -> `warning`, default -> `neutral`
* **Document Status**: INDEXED -> `success`, UPLOADING/UPLOADED -> `info`, PROCESSING/CHUNKING/INDEXING -> `warning`, FAILED -> `error`, default -> `neutral`
* **Active Flags**: true -> `success`, false -> `neutral`

### 4.3 Skeletons and States

* Tables: `AdminTable loading`. Detail pages: `DetailSkeleton` (`tabs` when tabbed). Multi-table or accordion pages: standalone `TableSkeleton`.
* Every list page must have a designed `EmptyState` (icon + title, description when original copy had it, action when there is an obvious next step).
* Spinners survive only as 16px inline action states (Save/Delete/Load-more buttons).

### 4.4 Badge Wrapper Pattern

Local badge components (e.g. `ReviewStatusBadge`, `FindingSeverityBadge`) are thin wrappers around `StatusPill`. Each file defines a `Record<EnumType, StatusPillTone>` tone map and a `Record<EnumType, string>` label map, then returns `<StatusPill tone={...} label={...} />`. Call sites import the badge, never `StatusPill` directly. Domain-specific tag chips (categories, entity types) stay as MUI `Chip` with palette-based `sx` colors.

### 4.5 Card and Surface Styling

* **Hairline borders over shadows**: Cards use `border: 1px solid` with `divider` token, not `boxShadow`. No hover lifts (`translateY`); hover state is a `borderColor` transition to `primary.main`.
* **Flat surfaces**: Remove all `boxShadow` from cards, dashboard tiles, and feature cards. The only shadows in the app are `OVERLAY_SHADOW` on dialogs, popovers, and dropdown menus.
* **Icon color tokens**: Replace raw hex icon colors with theme palette paths (`primary.main`, `success.dark`, `warning.dark`, `info.main`, etc.).
* **Gradient prohibition**: No `linear-gradient` backgrounds, no radial glows, no gradient text (`-webkit-background-clip: text`). All surfaces use `background.default` or `background.paper`.

---

## 5. Page Structure Rules

```tsx
<Box sx={{ p: 3 }}>
  <PageHeader title="..." actions={...} />
  {/* Page-local toolbar: search field / filter bar stays in the page */}
  <AdminTable ... /> {/* Or DetailLayout / FormSection composition */}
  {/* Dialogs stay in the page */}
</Box>
```

* Pages own their padding (`p: 3`); kit components are padding-agnostic.
* Detail pages: `DetailLayout` with `backHref` (never a hand-rolled back button row).
* Breadcrumbs collapse to back link + title; do not rebuild breadcrumb chains.
* Copy preservation: Redesigns keep existing user-facing strings verbatim. If copy appears bugged (for instance, a page titled "Audit Log" that is actually the changelog), flag it instead of silently changing it in a visual edit.
* Hidden routes: If the app uses route-based nav visibility, keep routes registered; only toggle nav display.

---

## 6. Visual Change Process & Discipline

* **Frozen Files During Visual Work**:
  * API files (`api.ts`, `accessApi.ts`, etc.)
  * Hooks (`hooks/**`, `hooks.ts`)
  * Query keys (`queryKeys.ts`)
  * HTTP client (`src/api/**`)
  * Verification gate: `git diff --name-only -- <paths>` must be empty at the end of any purely visual change.
* **Migration Rule**: The hooks/state/effects block above `return` stays verbatim; changes are JSX-only below it. Debounce timings, polling intervals, pagination mechanics, dialog flows, invalidation keys, and navigation targets are untouchable.
* **MUI-First Styling**: `sx` + theme tokens. No Tailwind classes in admin pages (the codebase uses MUI `sx` across admin surfaces; mixing systems is discouraged). No `styled()` (zero existing usage). No `React.memo` or `useMemo` on rendered rows (measured non-issue at admin scale, <= 25 rows).
* **Verification Cycle**: Run `bun run lint:fix` -> `bun run typecheck` -> `bun run test`. Run `bun run build` before finalizing a cycle.

---

## 7. Testing Patterns for Visual and Behavior Work

* **Kit Components**: Unit/render tests live in the `@doublefin/orca-ui` package repo (slots, tones, skeleton `role="progressbar"`, row-click callbacks).
* **Page Behavior Tests**: MSW-backed page tests lock the frozen contract (debounce timing + payload shape, pagination tokens, row navigation, mutation + invalidation refetch, lazy-mounted panels, save-payload mapping).
* **Passthrough Client Setup**: Real fetch through MSW with real `SEARCH_DEBOUNCE`:

  ```tsx
  vi.mock("~/api/httpClient", async (importOriginal) => {
    const actual = await importOriginal<typeof import("~/api/httpClient")>();
    const passthrough = actual.createHttpClient(<T,>(fn: () => Promise<T>) => fn());
    return { ...actual, useHttpClient: () => passthrough };
  });
  ```

* **jsdom / undici AbortSignal Realm Workaround**: `rawHttpRequest` and react-router's `navigate()` hand undici AbortSignals from the jsdom realm, which undici rejects (`Expected signal to be an instance of AbortSignal`). Install both wrappers in `beforeAll` (since `server.listen()` in setup.ts patches globals in `beforeAll` and clobbers module-level installs):

  ```tsx
  beforeAll(() => {
    const interceptedFetch = globalThis.fetch;
    globalThis.fetch = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
      interceptedFetch(input, { ...init, signal: undefined });
    const NativeRequest = globalThis.Request;
    globalThis.Request = class extends NativeRequest {
      constructor(input: ConstructorParameters<typeof Request>[0], init?: ConstructorParameters<typeof Request>[1]) {
        super(input, { ...init, signal: undefined });
      }
    };
  });
  ```

* **Unhandled-Request Collector**: MSW runs `onUnhandledRequest: "bypass"`, which lets a missing handler masquerade as a false-green empty state. Every MSW page test collects and asserts empty in `afterEach`:

  ```tsx
  const unhandled: string[] = [];
  server.events.on("request:unhandled", ({ request }) => { unhandled.push(`${request.method} ${request.url}`); });
  afterEach(() => { expect(unhandled).toEqual([]); });
  ```

* **Assertions**: Assert on captured request payloads (method + URL + exact body via handler closures); use positive assertions only (never absence-only assertions for data paths).
* **Debounce Testing**: Use real timers + `waitFor` (300ms << timeout). Fake timers with React Query + userEvent produce test flakiness.
* **`renderWithProviders` Extras**: `path` option gives pages real `useParams` (e.g. `path: "/users/:userId"`); returned `router` enables pathname assertions (`router.state.location.pathname`).
* **Existing Tests Rule**: Existing tests must pass unmodified; visual work never weakens a test.
* **Skeleton-Test Timing Contract**: When a test uses `findByText("Page Title")` followed by synchronous `getByText("data")`, the title must not appear until data is loaded. If `PageHeader` is always visible, `findByText` resolves immediately and the sync assertion fails on skeleton content. Solutions:
  * List pages: Use `AdminTable loading={isLoading}` (keeps table mounted with skeleton rows). If the test pattern requires the title to gate data visibility, conditionally render: `{!isLoading && <PageHeader title="..." />}`.
  * Detail pages: Use `{isLoading ? <DetailSkeleton /> : <DetailLayout>...</DetailLayout>}` so the title only appears after loading.
  * Pages where the PageHeader title depends on loaded data (e.g. `profile ? "Edit" : "Set Up"`): Move `PageHeader` inside the non-loading branch.

---

## 8. Rejected Options & Anti-Patterns

Do not relitigate these settled design and implementation decisions:

* **Tailwind for Admin Pages**: Codebase uses MUI `sx` on admin surfaces; one system wins.
* **`styled()` Utility**: Zero existing usage; hoisted `sx` constants resolve identical needs.
* **Config-Mega-Table**: Built-in search/filter/pagination inside `AdminTable` was rejected because the real tables differ too much (infinite scroll vs pagination vs drag-and-drop); composition won.
* **Border Radius 10 / Shadows Rebuild / Grey-to-Slate Remap**: High app-wide blast radius for minimal visual gain (see §2.3).
* **Dark Mode Infrastructure**: Currently single-mode light console (`#f8fafc` canvas, `#ffffff` paper); dark mode infrastructure is deferred to a future architecture chapter.
* **Collapsible Sidebar Groups**: 4 to 10 nav items do not justify extra state machinery.
* **CSS `invert()` Logo**: Imprecise visual result; using the dark SVG asset is the official fix.
* **Em-Dash Usage**: Em-dash (`—`) and en-dash (`–`) punctuation marks are completely excluded from UI copy and documentation.
* **Violet/Purple Theme**: HR AI Governance pages historically used violet (`#7c3aed`, `#6d28d9`, `#a78bfa`, `#8b5cf6`). This is explicitly banned; the single accent is indigo (`primary.main`). Replace all violet with `primary.main` / `primary.dark` / `primary.light`.
* **Forcing Chat Pages into Admin Kit**: Chat/conversational pages have fundamentally different UX. Chat pages are exempt from the kit; only apply token cleanup and skeleton loading.

---

## 9. Page Migration Checklist

When migrating any page to the Mercury Console design system, apply these transforms in order:

### 9.1 Structural Migration
1. **Header**: Replace hand-rolled back button + `Typography` title with `<PageHeader title="..." backHref="..." />`. For detail pages, use `<DetailLayout>`.
2. **Loading state**: Replace `if (isLoading) return <CircularProgress />` early-returns with inline skeletons (`<DetailSkeleton />` or `AdminTable loading`). Headers and toolbars stay mounted during load.
3. **Tables**: Replace raw MUI `<Table>` with `<AdminTable>` (columns config, `rowKey`, `loading`, `empty`, optional `footer`).
4. **Forms**: Group related fields with `<FormSection title="...">`.
5. **Status indicators**: Replace `<Chip>` status badges with `<StatusPill tone="..." label="..." />` using the tone mappings from §4.2.
6. **Label/value pairs**: Replace custom row layouts with `<DetailRow label="...">{value}</DetailRow>`.

### 9.2 Token Cleanup
1. Replace all raw hex colors with theme palette tokens (`primary.main`, `text.secondary`, `divider`, `background.paper`, `success.dark`, etc.).
2. Replace `grey.50` backgrounds with `background.default`.
3. Replace `boxShadow: <number>` with `OVERLAY_SHADOW` (overlays only) or remove entirely (cards).
4. Replace `borderColor: "grey.300"` with `divider` or `action.disabled`.
5. Replace `bgcolor: "white"` with `background.paper`.

### 9.3 Anti-Slop Audit
1. Remove all gradient backgrounds (`linear-gradient`, `radial-gradient`).
2. Remove all gradient text (`background-clip: text`, `-webkit-text-fill-color: transparent`).
3. Remove hover lifts (`translateY`, `transform: scale`).
4. Remove card shadows (`boxShadow` on non-overlay surfaces).
5. Replace em-dashes (`—`) with hyphens (`-`).
6. Remove violet/purple colors; replace with `primary.main` (indigo).
7. Remove raw hex color maps (e.g. `TAILWIND_BG_COLORS`); replace with theme palette paths.
