import { createTheme } from "@mui/material/styles";
import { LIQUID_METAL, type LiquidPreset } from "./liquid-presets";

// -- Color utilities --------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r - amount, g - amount, b - amount);
}

function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// -- Typography stacks -------------------------------------------------------

const FONT_STACK = [
  '"Inter Variable"',
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

const DISPLAY_STACK = [
  '"Space Grotesk Variable"',
  '"Inter Variable"',
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "sans-serif",
].join(",");

// -- Theme factory -----------------------------------------------------------

export function createLiquidTheme(preset: LiquidPreset) {
  const { accent, canvas, ink } = preset;

  // -- Derived palette (light themes only) -----------------------------------
  const accentHover = darkenHex(accent, 18);
  const accentLight = lightenHex(accent, 48);
  const accentSoft = hexToRgba(accent, 0.1);
  const accentSoftHover = hexToRgba(accent, 0.16);

  const slate = "#475569";
  const slateSoft = "#64748b";
  const slateFaint = "#94a3b8";
  const hairline = "#e3e8f0";
  const inputBorder = "#cbd5e1";
  const hoverBg = "rgba(30, 41, 59, 0.04)";
  const paperBg = "#ffffff";
  const dialogBg = "rgba(255,255,255,0.65)";
  const appBarBg = "rgba(255,255,255,0.55)";
  const tooltipBg = "#0f172a";
  const tooltipColor = "#ffffff";
  const skeletonBg = "#eef1f6";

  // -- Effect constants (derived from preset) --------------------------------
  const chromeSilver = "#c7d2e0";
  const chromeMid = "#94a3b8";
  const chromeLight = "#e2e8f0";
  const chromeDarkEdge = "#1e293b";

  const focusRing = `0 0 0 3px ${hexToRgba(accent, 0.14)}`;
  const overlayShadow = `0 12px 32px -8px rgba(30, 41, 59, 0.14), 0 4px 12px -4px ${hexToRgba(accent, 0.06)}`;
  const accentGlow = `0 0 20px ${hexToRgba(accent, 0.25)}`;
  const accentGradient = `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`;
  const sheenGradient =
    "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)";
  const glassHighlight = "inset 0 1px 0 rgba(255,255,255,0.8)";
  const glassDepthShadow = `0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px ${hexToRgba(accent, 0.06)}`;

  const chromeTextGradient = `linear-gradient(135deg, ${chromeDarkEdge} 0%, ${chromeMid} 20%, ${chromeSilver} 40%, ${chromeLight} 50%, ${chromeSilver} 60%, ${chromeMid} 80%, ${chromeDarkEdge} 100%)`;
  const chromeTextGradientReadable = `linear-gradient(135deg, ${chromeDarkEdge} 0%, #334155 20%, ${chromeMid} 40%, ${chromeSilver} 50%, ${chromeMid} 60%, #334155 80%, ${chromeDarkEdge} 100%)`;

  return createTheme({
    palette: {
      mode: "light",
      primary: {
        main: accent,
        light: accentLight,
        dark: accentHover,
        contrastText: "#ffffff",
      },
      secondary: {
        main: slateSoft,
        light: slateFaint,
        dark: slate,
        contrastText: "#ffffff",
      },
      error: { main: "#ef4444", light: "#f87171", dark: "#dc2626" },
      warning: { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" },
      success: { main: "#10b981", light: "#34d399", dark: "#059669" },
      info: { main: "#0ea5e9", light: "#38bdf8", dark: "#0284c7" },
      divider: hairline,
      background: { default: canvas, paper: paperBg },
      text: { primary: ink, secondary: slate, disabled: slateFaint },
      action: {
        hover: hoverBg,
        selected: accentSoft,
        focus: "rgba(30, 41, 59, 0.08)",
      },
    },
    typography: {
      fontFamily: FONT_STACK,
      h1: { fontFamily: DISPLAY_STACK, fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
      h2: { fontFamily: DISPLAY_STACK, fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.25 },
      h3: { fontFamily: DISPLAY_STACK, fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 },
      h4: { fontSize: "1.125rem", fontWeight: 600 },
      h5: { fontSize: "1rem", fontWeight: 600 },
      h6: { fontSize: "0.875rem", fontWeight: 600 },
      overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em" },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: appBarBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            color: ink,
            borderBottom: "none",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${chromeSilver}, ${accent}, ${chromeSilver}, transparent)`,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: "none" } },
        variants: [
          {
            props: { elevation: 0 },
            style: { border: `1px solid ${hairline}`, boxShadow: glassHighlight },
          },
        ],
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            "&:active": { transform: "scale(0.98)" },
          },
        },
        variants: [
          {
            props: { variant: "contained", color: "primary" },
            style: {
              background: accentGradient,
              boxShadow: accentGlow,
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background: sheenGradient,
                transition: "transform 0.5s ease",
              },
              "&:hover::after": { transform: "translateX(100%)" },
              "&:hover": {
                background: `linear-gradient(135deg, ${accentHover} 0%, ${accentLight} 100%)`,
                boxShadow: `0 0 28px ${hexToRgba(accent, 0.35)}`,
              },
            },
          },
          {
            props: { variant: "outlined", color: "primary" },
            style: {
              color: "#334155",
              borderColor: inputBorder,
              "&:hover": { borderColor: slateFaint, backgroundColor: hoverBg },
            },
          },
        ],
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            borderBottom: `1px solid ${hairline}`,
            fontVariantNumeric: "tabular-nums",
          },
          head: {
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: slate,
            backgroundColor: canvas,
            borderBottom: `1px solid ${hairline}`,
          },
          sizeSmall: { padding: "8px 16px" },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "#ffffff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: inputBorder },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: slateFaint },
            "&.Mui-focused": { boxShadow: `${focusRing}, ${accentGlow}` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: accent,
              borderWidth: 1,
            },
          },
          input: {
            fontSize: "0.8125rem",
            "&::placeholder": { color: slateFaint, opacity: 1 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontSize: "0.8125rem" } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${hairline}`,
            backgroundImage: "none",
            boxShadow: overlayShadow,
            backgroundColor: dialogBg,
            backdropFilter: "blur(16px)",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 10,
            border: `1px solid ${hairline}`,
            backgroundImage: "none",
            boxShadow: overlayShadow,
            backgroundColor: dialogBg,
            backdropFilter: "blur(16px)",
          },
        },
      },
      MuiMenu: { styleOverrides: { list: { padding: 4 } } },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontSize: "0.8125rem", borderRadius: 6, paddingTop: 6, paddingBottom: 6 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
          sizeSmall: { height: 22, fontSize: "0.6875rem" },
          outlined: { borderColor: inputBorder },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40, borderBottom: `1px solid ${hairline}` },
          indicator: { height: 2, backgroundColor: accent },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.8125rem",
            minHeight: 40,
            color: slate,
            "&.Mui-selected": { color: ink, fontWeight: 600 },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            color: slate,
            "&:hover": { backgroundColor: hoverBg },
            "&.Mui-selected": {
              backgroundColor: accentSoft,
              color: accent,
              "&:hover": { backgroundColor: accentSoftHover },
              "& .MuiListItemIcon-root": { color: accent },
              "& .MuiListItemText-primary": { color: accent, fontWeight: 600 },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: { root: { color: slateSoft, minWidth: 36 } },
      },
      MuiSkeleton: {
        styleOverrides: { root: { backgroundColor: skeletonBg } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: tooltipBg,
            color: tooltipColor,
            fontSize: "0.6875rem",
            fontWeight: 500,
            borderRadius: 6,
            padding: "6px 10px",
          },
          arrow: { color: tooltipBg },
        },
      },
    },
  });
}

// -- Backward-compatible exports --------------------------------------------

export const theme = createLiquidTheme(LIQUID_METAL);

// Re-export effect constants for the default (LIQUID_METAL) preset
const _accent = LIQUID_METAL.accent;
const _chromeSilver = "#c7d2e0";
const _chromeMid = "#94a3b8";
const _chromeLight = "#e2e8f0";
const _chromeDarkEdge = "#1e293b";

export const CHROME_TEXT_GRADIENT = `linear-gradient(135deg, ${_chromeDarkEdge} 0%, ${_chromeMid} 20%, ${_chromeSilver} 40%, ${_chromeLight} 50%, ${_chromeSilver} 60%, ${_chromeMid} 80%, ${_chromeDarkEdge} 100%)`;
export const CHROME_TEXT_GRADIENT_READABLE = `linear-gradient(135deg, ${_chromeDarkEdge} 0%, #334155 20%, ${_chromeMid} 40%, ${_chromeSilver} 50%, ${_chromeMid} 60%, #334155 80%, ${_chromeDarkEdge} 100%)`;
export const ACCENT_GRADIENT = `linear-gradient(135deg, ${_accent} 0%, ${lightenHex(_accent, 48)} 100%)`;
export const SHEEN_GRADIENT = "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)";
export const GLASS_HIGHLIGHT = "inset 0 1px 0 rgba(255,255,255,0.8)";
export const GLASS_DEPTH_SHADOW = `0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px ${hexToRgba(_accent, 0.06)}`;
export const ACCENT_GLOW = `0 0 20px ${hexToRgba(_accent, 0.25)}`;
export const OVERLAY_SHADOW = `0 12px 32px -8px rgba(30, 41, 59, 0.14), 0 4px 12px -4px ${hexToRgba(_accent, 0.06)}`;
