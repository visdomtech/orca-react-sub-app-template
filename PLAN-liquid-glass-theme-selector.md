# Liquid Glass Theme Selector

## Visual Reference Analysis (10 video frames)

The reference frames reveal a spectrum of 5 liquid glass themes with these critical visual characteristics our current implementation lacks:

### Key Visual Gaps vs Reference
1. **Organic liquid wave overlays**: Reference shows large, flowing organic wave shapes (not just radial gradient blobs) that overlay the entire page, creating depth and movement. Current `liquid.css` only has 4 simple radial blobs.
2. **Stronger frosted glass**: Cards are clearly see-through with visible background behind them. `backdrop-filter: blur(24px)` + lower white opacity (~30-35%).
3. **Larger border-radius**: Cards use `border-radius: 24px` creating pillowy, organic containers.
4. **Minimal borders**: Depth achieved through layering, blur, and subtle shadows -- no hairline borders visible.
5. **Flowing wave animation**: Liquid shapes appear to flow and morph organically, not just drift linearly.
6. **Dark theme glass**: Charcoal/Deep Teal themes use dark translucent glass (`rgba(15,23,42,0.40)`), white text, glowing accent highlights, and colored liquid waves.

---

## Architecture

Two-layer theming:
1. **MUI Theme layer**: `createLiquidTheme(preset)` factory produces a MUI theme per palette. `ThemeProvider` re-renders on switch (acceptable for showcase page).
2. **CSS Variable layer**: `data-lm-theme` attribute on wrapper div activates CSS variable overrides for effects orca-ui hardcodes (glass surfaces, ambient waves, shadows). CSS variable fallbacks preserve backward compatibility.

Theme state lives in a `LiquidThemeContext` scoped to `ShowcaseLiquidPage`. Mercury showcase and OrcaApp are untouched.

---

## Phase A: Refined Glass + Wave Styles

### A1. Refine `orca-ui/src/GlassCard.tsx`
Update to match reference frames' organic, frosted glass quality:
- `borderRadius` default: `2 -> 3` (24px for pillowy containers)
- CSS variable fallbacks for all hardcoded values:
  ```tsx
  bgcolor: "var(--lm-glass-bg, rgba(255,255,255,0.30))",
  backdropFilter: "blur(24px)",
  borderColor: "var(--lm-glass-border, rgba(255,255,255,0.15))",
  boxShadow: "var(--lm-glass-shadow, 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5))",
  ```
- Key change: reduce white opacity from 0.45 to 0.30 (more see-through), increase blur from 20px to 24px
- Remove prismatic double-border (too busy); keep subtle inner highlight + soft outer shadow
Bump orca-ui to 0.5.0.

### A2. Overhaul `liquid.css` -- organic liquid waves + CSS variables
Replace simple radial blobs with organic flowing wave overlays:
- Add 2-3 large `SVG`-free wave shapes using CSS `clip-path: polygon(...)` or `border-radius` morphing with large blurred backgrounds
- Wave shapes: 1200-1600px wide, flowing organic forms with `border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%` (organic blob shapes)
- Increase blur to `blur(120px)` for softer, more atmospheric feel
- Wave animation: morphing border-radius + slow rotation + drift (not just translate)
- Add CSS variables for all wave colors, glass surfaces, canvas background:
  ```css
  :root {
    --lm-glass-bg: rgba(255,255,255,0.30);
    --lm-glass-border: rgba(255,255,255,0.15);
    --lm-glass-shadow: 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5);
    --lm-canvas-bg: #f4f6fa;
    --lm-wave-1: rgba(199,210,224,0.20);
    --lm-wave-2: rgba(91,108,255,0.12);
    --lm-wave-3: rgba(244,114,182,0.08);
    --lm-wave-4: rgba(199,210,224,0.14);
    --lm-accent-soft: rgba(91,108,255,0.08);
    --lm-nav-bg: rgba(255,255,255,0.40);
    --lm-text-primary: #0f172a;
    --lm-text-secondary: #475569;
  }
  ```
- Add morphing keyframe animation:
  ```css
  @keyframes lm-morph {
    0%   { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
    25%  { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%  { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    75%  { border-radius: 50% 40% 60% 50% / 40% 70% 40% 60%; }
    100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  }
  ```
- Smooth theme transition: `transition: background-color 0.5s ease, background 0.5s ease` on waves

---

## Phase B: Theme Token Presets + Factory

### B1. Create `src/theme/liquid-presets.ts` (new)
Define `LiquidPreset` interface and 5 preset objects:

```ts
export interface LiquidPreset {
  id: string;
  label: string;
  description: string;
  isDark: boolean;
  // Base palette
  canvas: string; ink: string; slate: string; slateSoft: string; slateFaint: string;
  hairline: string; inputBorder: string; hoverBg: string;
  // Accent
  accent: string; accentHover: string; accentSoft: string; accentSoftHover: string;
  // Effect constants
  focusRing: string; overlayShadow: string;
  chromeTextGradient: string; chromeTextGradientReadable: string;
  accentGradient: string; sheenGradient: string;
  glassHighlight: string; glassDepthShadow: string; accentGlow: string;
  // Glass surface CSS vars
  glassBg: string; glassBorder: string; glassShadow: string;
  // Wave CSS vars
  wave1: string; wave2: string; wave3: string; wave4: string;
  ambientBg: string;
  // Preview gradient for theme selector swatch
  previewGradient: string;
}
```

### Preset Definitions

**LIQUID_METAL** (current blue-violet, light):
- accent `#5b6cff`, canvas `#f4f6fa`
- glass: `rgba(255,255,255,0.30)`, border `rgba(255,255,255,0.15)`
- waves: silver, blue-violet, rose, silver

**SAGE_GREEN** (Reliability & Calm, light):
- accent `#5b8c5a`, canvas `#f0f4f0`
- glass: `rgba(255,255,255,0.30)`, border `rgba(255,255,255,0.18)`
- waves: sage green `rgba(139,180,130,0.22)`, accent `rgba(91,140,90,0.14)`, cream `rgba(212,197,160,0.12)`, mint `rgba(168,197,168,0.16)`
- chrome: green metallic sweep

**CORPORATE_BLUE** (Trust & Security, light):
- accent `#3b82f6`, canvas `#f0f4fa`
- glass: `rgba(255,255,255,0.30)`, border `rgba(255,255,255,0.18)`
- waves: steel blue `rgba(147,197,253,0.22)`, accent `rgba(59,130,246,0.14)`, cyan `rgba(6,182,212,0.10)`, silver `rgba(199,210,224,0.16)`
- chrome: blue metallic sweep

**NEUTRAL_CHARCOAL** (Seriousness & Precision, dark):
- accent `#14b8a6`, canvas `#1a1a2e`, ink `#e5e7eb`
- glass: `rgba(15,23,42,0.40)`, border `rgba(255,255,255,0.08)`
- waves: teal glow `rgba(20,184,166,0.15)`, dark `rgba(30,41,59,0.25)`, emerald `rgba(16,185,129,0.10)`, slate `rgba(71,85,105,0.20)`
- text: white on dark, chrome: light metallic sweep
- glassShadow: `0 8px 32px rgba(0,0,0,0.3)`

**DEEP_TEAL** (Innovation & Sophistication, dark):
- accent `#0d9488`, canvas `#0f172a`, ink `#e2e8f0`
- glass: `rgba(15,23,42,0.35)`, border `rgba(255,255,255,0.06)`
- waves: deep teal `rgba(13,148,136,0.18)`, slate `rgba(71,85,105,0.22)`, cyan `rgba(6,182,212,0.08)`, indigo `rgba(99,102,241,0.12)`
- text: white on dark, chrome: teal-silver metallic sweep
- glassShadow: `0 8px 32px rgba(0,0,0,0.25)`

### B2. Refactor `src/theme/theme-liquid.ts`
- Wrap existing `createTheme()` body in `export function createLiquidTheme(preset: LiquidPreset): Theme`
- Keep `export const theme = createLiquidTheme(LIQUID_METAL)` for backward compatibility
- All component overrides read from preset instead of hardcoded constants
- Dark theme presets: adjust MUI `palette.mode` to `"dark"`, invert text/background tokens
- Export `getEffectConstants(preset)` returning gradient/shadow strings

---

## Phase C: Theme Context + Selector UI

### C1. Create `src/features/showcase-liquid/LiquidThemeContext.tsx` (new)
- React context: `{ preset: LiquidPreset, setPresetId: (id: string) => void, presets: LiquidPreset[] }`
- `LiquidThemeProvider`: wraps children in `<Box data-lm-theme={presetId}>` + `<ThemeProvider theme={createLiquidTheme(preset)}>`
- `useEffect` syncs CSS variables to the wrapper element on theme change (wave colors, glass values, text colors)
- `useLiquidTheme()` hook for consumers
- Default: `LIQUID_METAL` (zero visual change on mount)
- Persist selection in `localStorage` with try/catch

### C2. Create `src/features/showcase-liquid/components/LiquidThemeSelector.tsx` (new)
- Horizontal row of 5 glass-pill buttons inside a GlassCard panel
- Each button: color preview swatch (gradient from `preset.previewGradient`) + label + description tooltip
- Uses `useLiquidTheme()` to read active preset and call `setPresetId()`
- Active theme gets accent glow border + subtle lift
- Dark theme swatches show dark preview
- Positioned after `LiquidStatsStrip`, before `LiquidSectionNav`

### C3. Wire into `ShowcaseLiquidPage.tsx`
- Replace `<ThemeProvider theme={liquidTheme}>` with `<LiquidThemeProvider>`
- Insert `<LiquidThemeSelector />` after `<LiquidStatsStrip />`

---

## Phase D: Refactor Showcase Components

### D1. Replace hardcoded accent rgba in components
- `LiquidHero.tsx`: `rgba(91,108,255,...)` -> `alpha(theme.palette.primary.main, opacity)` where possible, CSS vars for decorative shapes
- `LiquidSectionNav.tsx`: `rgba(244,246,250,0.6)` -> `var(--lm-nav-bg, rgba(255,255,255,0.40))`; accent rgba -> `primary.main` via theme
- `LiquidStatsStrip.tsx`: hardcoded accent in hover boxShadow -> `var(--lm-glass-shadow, ...)`
- `LiquidTokenSwatches.tsx`: hardcoded hover shadow -> theme palette paths
- All components: ensure text uses theme tokens (`text.primary`, `text.secondary`) so dark themes render white text

### D2. Update effect constant imports
- Replace direct imports of `CHROME_TEXT_GRADIENT` / `CHROME_TEXT_GRADIENT_READABLE` with values from `useLiquidTheme()` or from the new `getEffectConstants(preset)` function

---

## Phase E: Style Refinement Per Reference Frames

### E1. Glass refinement
- All glass surfaces: reduce opacity to 0.30, increase blur to 24px (matching reference translucency)
- Border-radius: 24px on hero cards, 20px on metric tiles, 16px on nav pills
- Shadows: softer, more diffuse (`0 8px 40px rgba(0,0,0,0.06)`)
- Remove visible borders; use inner highlight + outer shadow for depth

### E2. Wave layer refinement
- Replace 4 radial blobs with 4 organic wave shapes (morphing border-radius + large size)
- Wave sizes: 800-1400px (larger than current 450-700px blobs)
- Animation: morph (border-radius keyframes) + drift (translate3d) + slow rotation (5-8deg)
- Duration: 30-50s per cycle (slower, more organic)
- Blur: `blur(120px)` for atmospheric softness

### E3. Dark theme polish
- Neutral Charcoal: verify white text contrast on dark glass, accent glow on teal elements
- Deep Teal: verify glass visibility on dark canvas, wave colors don't disappear
- Both dark themes: glass highlight becomes `rgba(255,255,255,0.08)`, glass shadow becomes darker

---

## Phase F: Verification + Commit

### F1. Typecheck + build both repos
### F2. Publish orca-ui@0.5.0
### F3. Commit both repos

---

## Files Changed

### orca-ui (2 files)
- `src/GlassCard.tsx` — refined glass (lower opacity, more blur, CSS var fallbacks, larger radius)
- `package.json` — version bump to 0.5.0

### sub-app template (~12 files)
- `src/theme/liquid-presets.ts` (new) -- 5 preset objects with full token sets
- `src/theme/theme-liquid.ts` -- refactored to factory function
- `src/features/showcase-liquid/liquid.css` -- organic waves + morphing animations + CSS variables + theme overrides
- `src/features/showcase-liquid/LiquidThemeContext.tsx` (new) -- context + provider + CSS var sync
- `src/features/showcase-liquid/components/LiquidThemeSelector.tsx` (new) -- selector UI
- `src/features/showcase-liquid/pages/ShowcaseLiquidPage.tsx` -- wire provider + selector
- `src/features/showcase-liquid/components/LiquidHero.tsx` -- theme-aware values
- `src/features/showcase-liquid/components/LiquidSectionNav.tsx` -- CSS vars
- `src/features/showcase-liquid/components/LiquidStatsStrip.tsx` -- CSS vars
- `src/features/showcase-liquid/components/LiquidTokenSwatches.tsx` -- theme paths
- `src/features/showcase-liquid/components/LiquidSectionHeader.tsx` -- effect constants
- `skills/orca-fe-liquid/styles.md` -- document multi-theme system + refined glass rules

## Dependencies
```
A1 (GlassCard refine) + A2 (liquid.css waves) ─┐
B1 (presets) -> B2 (factory) ───────────────────┤
                                                 ├─> C1 (context) -> C2 (selector) -> C3 (wire page)
                                                 |                    \
                                                 |         D1-D2 (refactor components)
                                                 |                    |
                                                 └─────> E1-E3 (style refinement per reference)
                                                                  |
                                                              F1-F3
```

## Rejected Alternatives

1. **Pure CSS-only theme switching (no React re-render)**: Rejected because MUI's `createTheme` doesn't naturally support CSS variable strings for computed palette values like `alpha()`, `darken()`, or `palette.primary.dark`.

2. **CSS containment / GPU optimizations**: Rejected as premature for a showcase page. Morphing border-radius animations are GPU-cheap. Adding `contain` rules risks breaking absolute positioning.

3. **Separate CSS file per theme**: Rejected in favor of `[data-lm-theme]` attribute selectors in a single file. Fewer files, easier to compare themes.

4. **SVG-based wave overlays**: Rejected in favor of CSS morphing border-radius. SVGs are harder to theme dynamically and add file complexity. CSS `border-radius` morphing achieves similar organic shapes with pure CSS.

## Risks
| Risk | Mitigation |
|---|---|
| Dark theme glass invisible (dark glass on dark bg) | Preset defines distinct glass values per theme; visual QA on each |
| GlassCard CSS var fallback doesn't work in MUI sx | MUI sx accepts CSS variable strings natively; test single variable first |
| `createLiquidTheme` refactor changes default output | Snapshot test: `JSON.stringify(createLiquidTheme(LIQUID_METAL))` must equal current theme |
| Mercury showcase affected | Isolation boundary is `ShowcaseLiquidPage` line 182; no cross-imports |
| Morphing border-radius animation jank on mobile | `will-change: border-radius` on wave elements; `prefers-reduced-motion` disables morphing |
| 5 themes too many for selector UI | Use compact pill buttons with preview swatches; tooltip shows full description |
# Liquid Glass Theme Selector

## Architecture

Two-layer theming:
1. **MUI Theme layer**: `createLiquidTheme(preset)` factory produces a MUI theme per palette. `ThemeProvider` re-renders on switch (acceptable for showcase page).
2. **CSS Variable layer**: `data-lm-theme` attribute on wrapper div activates CSS variable overrides for effects orca-ui hardcodes (glass surfaces, ambient blobs, shadows). CSS variable fallbacks preserve backward compatibility.

Theme state lives in a `LiquidThemeContext` scoped to `ShowcaseLiquidPage`. Mercury showcase and OrcaApp are untouched.

## Phase A: Theme Token Presets + Factory

### A1. Create `src/theme/liquid-presets.ts` (new)
Define the `LiquidPreset` interface and 5 preset objects:

```ts
export interface LiquidPreset {
  id: string;
  label: string;
  description: string;
  // Base palette
  canvas: string; ink: string; slate: string; slateSoft: string; slateFaint: string;
  hairline: string; inputBorder: string; hoverBg: string;
  // Accent
  accent: string; accentHover: string; accentSoft: string; accentSoftHover: string;
  // Effect constants
  focusRing: string; overlayShadow: string;
  chromeTextGradient: string; chromeTextGradientReadable: string;
  accentGradient: string; sheenGradient: string;
  glassHighlight: string; glassDepthShadow: string; accentGlow: string;
  // Glass surface CSS vars
  glassBg: string; glassBorder: string; glassShadow: string;
  // Ambient blob CSS vars
  blobSilver: string; blobAccent: string; blobHighlight: string; blobRose: string;
  // Canvas bg for ambient layer
  ambientBg: string;
}
```

Presets: `LIQUID_METAL` (current values), `SAGE_GREEN`, `CORPORATE_BLUE`, `NEUTRAL_CHARCOAL`, `DEEP_TEAL`.

Each preset gets theme-appropriate values:
- **Sage Green**: accent `#5b8c5a`, canvas `#f0f4f0`, green-tinted blobs
- **Corporate Blue**: accent `#3b82f6`, canvas `#f0f4fa`, blue-tinted blobs
- **Neutral Charcoal**: accent `#14b8a6`, canvas `#1a1a2e` (dark theme), dark glass (`rgba(15,23,42,0.55)`), inverted text colors
- **Deep Teal**: accent `#0d9488`, canvas `#f1f5f9`, teal-tinted blobs

### A2. Refactor `src/theme/theme-liquid.ts`
- Wrap existing `createTheme()` body in `export function createLiquidTheme(preset: LiquidPreset): Theme`
- Keep `export const theme = createLiquidTheme(LIQUID_METAL)` for backward compatibility
- All component overrides read from preset instead of hardcoded constants
- Export `getEffectConstants(preset)` returning gradient/shadow strings

### A3. Update `orca-ui/src/GlassCard.tsx` (3-line change)
Replace hardcoded values with CSS variable fallbacks:
- `bgcolor` -> `"var(--lm-glass-bg, rgba(255,255,255,0.45))"`
- `borderColor` -> `"var(--lm-glass-border, rgba(255,255,255,0.6))"`
- `boxShadow` -> `"var(--lm-glass-shadow, inset 0 1px 0 rgba(255,255,255,0.8), ...)"`

Bump orca-ui to 0.5.0.

## Phase B: CSS Variable Infrastructure

### B1. Refactor `liquid.css` to use CSS variables
Replace hardcoded blob colors with `var(--lm-blob-silver)`, `var(--lm-blob-accent)`, etc.

Add new CSS custom properties to `:root`:
```css
:root {
  --lm-glass-bg: rgba(255,255,255,0.45);
  --lm-glass-border: rgba(255,255,255,0.6);
  --lm-glass-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(91,108,255,0.06);
  --lm-blob-silver: radial-gradient(circle, rgba(199,210,224,0.18) 0%, transparent 70%);
  --lm-blob-accent: radial-gradient(circle, rgba(91,108,255,0.14) 0%, transparent 70%);
  --lm-blob-highlight: radial-gradient(circle, rgba(199,210,224,0.12) 0%, transparent 65%);
  --lm-blob-rose: radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%);
  --lm-canvas-bg: #f4f6fa;
  --lm-accent-soft: rgba(91,108,255,0.08);
  --lm-nav-bg: rgba(244,246,250,0.6);
}
```

Add smooth theme transition:
```css
.lm-ambient, .lm-ambient__blob {
  transition: background-color 0.4s ease, background 0.4s ease;
}
```

## Phase C: Theme Context + Selector UI

### C1. Create `src/features/showcase-liquid/LiquidThemeContext.tsx` (new)
- React context: `{ preset: LiquidPreset, setPresetId: (id: string) => void, presets: LiquidPreset[] }`
- `LiquidThemeProvider`: wraps children in `<Box data-lm-theme={presetId}>` + `<ThemeProvider theme={createLiquidTheme(preset)}>`
- `useEffect` syncs CSS variables to the wrapper element on theme change
- `useLiquidTheme()` hook for consumers
- Default: `LIQUID_METAL` (zero visual change on mount)
- Persist selection in `localStorage` with try/catch

### C2. Create `src/features/showcase-liquid/components/LiquidThemeSelector.tsx` (new)
- Horizontal row of 5 glass-pill buttons inside a GlassCard
- Each button: color preview swatch (small gradient) + label + active indicator
- Uses `useLiquidTheme()` to read active preset and call `setPresetId()`
- Active theme gets accent glow border
- Positioned after `LiquidStatsStrip`, before `LiquidSectionNav`

### C3. Wire into `ShowcaseLiquidPage.tsx`
- Replace `<ThemeProvider theme={liquidTheme}>` with `<LiquidThemeProvider>`
- Insert `<LiquidThemeSelector />` after `<LiquidStatsStrip />`

## Phase D: Refactor Showcase Components

### D1. Replace hardcoded accent rgba in components
- `LiquidHero.tsx`: `rgba(91,108,255,...)` -> `alpha(theme.palette.primary.main, opacity)` where possible, CSS vars for decorative shapes
- `LiquidSectionNav.tsx`: `rgba(244,246,250,0.6)` -> `var(--lm-nav-bg, rgba(244,246,250,0.6))`; accent rgba -> `primary.main` via theme
- `LiquidStatsStrip.tsx`: hardcoded accent in hover boxShadow -> `var(--lm-glass-shadow, ...)`
- `LiquidTokenSwatches.tsx`: hardcoded hover shadow -> theme palette paths

### D2. Update effect constant imports
- Replace direct imports of `CHROME_TEXT_GRADIENT` / `CHROME_TEXT_GRADIENT_READABLE` with values from `useLiquidTheme()` or from the new `getEffectConstants(preset)` function

## Phase E: Style Refinement

### E1. Refine glass styles per Screenshot 1
- Ensure glass is visibly translucent on all 5 themes
- Add subtle `transition` on theme switch for smooth visual change
- Verify Neutral Charcoal dark theme: text contrast, glass visibility, blob colors

## Phase F: Verification + Commit

### F1. Typecheck + build both repos
### F2. Publish orca-ui@0.5.0
### F3. Commit both repos

## Files Changed

### orca-ui (1 file)
- `src/GlassCard.tsx` — CSS variable fallbacks (3 lines)
- `package.json` — version bump

### sub-app template (~12 files)
- `src/theme/liquid-presets.ts` (new) — 5 preset objects
- `src/theme/theme-liquid.ts` — refactored to factory function
- `src/features/showcase-liquid/liquid.css` — CSS variables for blobs + glass
- `src/features/showcase-liquid/LiquidThemeContext.tsx` (new) — context + provider
- `src/features/showcase-liquid/components/LiquidThemeSelector.tsx` (new) — selector UI
- `src/features/showcase-liquid/pages/ShowcaseLiquidPage.tsx` — wire provider + selector
- `src/features/showcase-liquid/components/LiquidHero.tsx` — theme-aware values
- `src/features/showcase-liquid/components/LiquidSectionNav.tsx` — CSS vars
- `src/features/showcase-liquid/components/LiquidStatsStrip.tsx` — CSS vars
- `src/features/showcase-liquid/components/LiquidTokenSwatches.tsx` — theme paths
- `src/features/showcase-liquid/components/LiquidSectionHeader.tsx` — effect constants
- `skills/orca-fe-liquid/styles.md` — document multi-theme system

## Rejected Alternatives

1. **Pure CSS-only theme switching (no React re-render)**: Rejected because MUI's `createTheme` doesn't naturally support CSS variable strings for computed palette values like `alpha()`, `darken()`, or `palette.primary.dark`. Would require extensive workarounds and lose type safety.

2. **CSS containment / GPU optimizations**: Rejected as premature for a showcase page. The `backdrop-filter: blur(20px)` and blob animations already run at 60fps on modern hardware. Adding `contain` rules risks breaking absolute positioning in glass cards.

3. **Separate CSS file per theme**: Rejected in favor of `[data-lm-theme]` attribute selectors in a single file. Fewer files to manage, easier to compare themes side-by-side, and the CSS bundle size difference is negligible.

## Dependencies
```
A1 (presets) -> A2 (factory) -> A3 (orca-ui) -> B1 (liquid.css)
                                        \              |
                                         -> C1 (context) -> C2 (selector) -> C3 (wire page)
                                                          \
                                               D1-D2 (refactor components) -> E1 (polish) -> F1-F3
```

## Risks
| Risk | Mitigation |
|---|---|
| Neutral Charcoal dark theme breaks glass (white glass on dark bg) | Preset defines dark glass (`rgba(15,23,42,0.55)`) + CSS variable overrides |
| GlassCard CSS var fallback doesn't work in MUI sx | MUI sx accepts CSS variable strings natively; test single variable first |
| `createLiquidTheme` refactor changes default theme output | Snapshot test: `JSON.stringify(createLiquidTheme(LIQUID_METAL))` must equal current theme |
| Mercury showcase affected | Isolation boundary is `ShowcaseLiquidPage` line 182; no cross-imports |
