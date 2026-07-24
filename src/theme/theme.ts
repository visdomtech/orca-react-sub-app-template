import { createTheme } from "@mui/material/styles";

// ── Design tokens ("Mercury Console") ──────────────────────────────────────────
// Quiet fintech aesthetic: soft neutrals, hairline borders instead of elevation,
// a slate ink hierarchy, and a single indigo accent.

const INK = "#0f172a"; // slate-900 — primary text, dark overlays (tooltip)
const SLATE = "#475569"; // slate-600 — secondary text
const SLATE_SOFT = "#64748b"; // slate-500 — icons, secondary-button text
const SLATE_FAINT = "#94a3b8"; // slate-400 — disabled / placeholder
const HAIRLINE = "#e2e8f0"; // slate-200 — dividers, surface borders
const INPUT_BORDER = "#cbd5e1"; // slate-300 — interactive borders (inputs, outlined buttons, chips)
const CANVAS = "#f8fafc"; // slate-50 — app background, table header fill
const ACCENT = "#4f46e5"; // indigo-600 — the single accent
const ACCENT_HOVER = "#4338ca"; // indigo-700
const ACCENT_SOFT = "#eef2ff"; // indigo-50 — selected backgrounds
const ACCENT_SOFT_HOVER = "#e0e7ff"; // indigo-100

const FOCUS_RING = "0 0 0 3px rgba(79, 70, 229, 0.12)";
const OVERLAY_SHADOW = "0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.06)";
export { OVERLAY_SHADOW };
const HOVER_BG = "rgba(15, 23, 42, 0.04)"; // neutral hover wash for buttons, list items, rows

// INTER SLOT: if the Inter dependency is approved, `bun add @fontsource-variable/inter`,
// import it once in your app's entry file (e.g. src/main.tsx, next to ./index.css),
// and prepend '"Inter Variable"' to this array. Nothing else changes.
const FONT_STACK = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

const theme = createTheme({
  palette: {
    primary: {
      main: ACCENT,
      light: "#818cf8", // indigo-400
      dark: ACCENT_HOVER,
      contrastText: "#ffffff",
    },
    // Violet secondary demoted to neutral slate — indigo is the only accent.
    secondary: {
      main: SLATE_SOFT,
      light: SLATE_FAINT,
      dark: SLATE,
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444", // red-500
      light: "#f87171", // red-400
      dark: "#dc2626", // red-600
    },
    warning: {
      main: "#f59e0b", // amber-500
      light: "#fbbf24", // amber-400
      dark: "#d97706", // amber-600
    },
    success: {
      main: "#10b981", // emerald-500
      light: "#34d399", // emerald-400
      dark: "#059669", // emerald-600
    },
    info: {
      main: "#0ea5e9", // sky-500
      light: "#38bdf8", // sky-400
      dark: "#0284c7", // sky-600
    },
    divider: HAIRLINE,
    background: {
      default: CANVAS,
      paper: "#ffffff",
    },
    text: {
      primary: INK,
      secondary: SLATE,
      disabled: SLATE_FAINT,
    },
    action: {
      hover: HOVER_BG,
      selected: "rgba(15, 23, 42, 0.06)",
      focus: "rgba(15, 23, 42, 0.08)",
    },
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.015em" },
    h3: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.125rem", fontWeight: 600 },
    h5: { fontSize: "1rem", fontWeight: 600 },
    h6: { fontSize: "0.875rem", fontWeight: 600 },
    overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em" },
  },
  shape: {
    borderRadius: 8,
  },
  // NOTE: theme.shadows intentionally left at MUI defaults — overlay components
  // may index it by reference. The flat-overlay look comes from the MuiDialog /
  // MuiPopover overrides below instead.
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: INK,
          borderBottom: `1px solid ${HAIRLINE}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
      // Flat surfaces get a hairline border; raised overlays (elevation > 0) keep
      // their shadow and stay borderless.
      variants: [{ props: { elevation: 0 }, style: { border: `1px solid ${HAIRLINE}` } }],
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontSize: "0.8125rem" },
        // Outlined buttons read as neutral "secondary" actions (Mercury pattern).
        outlinedPrimary: {
          color: "#334155", // slate-700
          borderColor: INPUT_BORDER,
          "&:hover": { borderColor: SLATE_FAINT, backgroundColor: HOVER_BG },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          borderBottom: `1px solid ${HAIRLINE}`,
        },
        head: {
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: SLATE,
          backgroundColor: CANVAS,
          borderBottom: `1px solid ${HAIRLINE}`,
        },
        sizeSmall: { padding: "8px 16px" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: INPUT_BORDER },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: SLATE_FAINT },
          "&.Mui-focused": { boxShadow: FOCUS_RING },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT, borderWidth: 1 },
        },
        input: {
          fontSize: "0.8125rem",
          "&::placeholder": { color: SLATE_FAINT, opacity: 1 },
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
          border: `1px solid ${HAIRLINE}`,
          backgroundImage: "none",
          boxShadow: OVERLAY_SHADOW,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: `1px solid ${HAIRLINE}`,
          backgroundImage: "none",
          boxShadow: OVERLAY_SHADOW,
        },
      },
    },
    MuiMenu: {
      styleOverrides: { list: { padding: 4 } },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: "0.8125rem", borderRadius: 6, paddingTop: 6, paddingBottom: 6 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        sizeSmall: { height: 22, fontSize: "0.6875rem" },
        outlined: { borderColor: INPUT_BORDER },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: `1px solid ${HAIRLINE}` },
        indicator: { height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.8125rem",
          minHeight: 40,
          color: SLATE,
          "&.Mui-selected": { color: INK, fontWeight: 600 },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: SLATE,
          "&:hover": { backgroundColor: HOVER_BG },
          "&.Mui-selected": {
            backgroundColor: ACCENT_SOFT,
            color: ACCENT,
            "&:hover": { backgroundColor: ACCENT_SOFT_HOVER },
            "& .MuiListItemIcon-root": { color: ACCENT },
            "& .MuiListItemText-primary": { color: ACCENT, fontWeight: 600 },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { color: SLATE_SOFT, minWidth: 36 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: "#f1f5f9" } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: INK,
          fontSize: "0.6875rem",
          fontWeight: 500,
          borderRadius: 6,
          padding: "6px 10px",
        },
        arrow: { color: INK },
      },
    },
  },
});

export { theme };
