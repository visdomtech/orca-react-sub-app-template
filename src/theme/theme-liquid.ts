import { createTheme } from "@mui/material/styles";

// -- Design tokens ("Liquid Metal") -------------------------------------------
// Cool platinum base, chrome/silver metallic accents, glassmorphism surfaces,
// and a single liquid blue-violet accent. Light theme only.

const INK = "#0f172a"; // slate-900 - primary text
const SLATE = "#475569"; // slate-600 - secondary text
const SLATE_SOFT = "#64748b"; // slate-500 - icons, secondary-button text
const SLATE_FAINT = "#94a3b8"; // slate-400 - disabled / placeholder
const HAIRLINE = "#e3e8f0"; // cool-tinted gray - dividers, surface borders
const INPUT_BORDER = "#cbd5e1"; // slate-300 - interactive borders
const CANVAS = "#f4f6fa"; // cool platinum - app background
const ACCENT = "#5b6cff"; // chrome blue-violet - the single liquid accent
const ACCENT_HOVER = "#4a5ae8"; // deepened on hover
const ACCENT_SOFT = "rgba(91,108,255,0.10)"; // liquid accent tint
const ACCENT_SOFT_HOVER = "rgba(91,108,255,0.16)";

const FOCUS_RING = "0 0 0 3px rgba(91, 108, 255, 0.14)";
const OVERLAY_SHADOW =
  "0 12px 32px -8px rgba(30, 41, 59, 0.14), 0 4px 12px -4px rgba(91, 108, 255, 0.06)";
export { OVERLAY_SHADOW };
const HOVER_BG = "rgba(30, 41, 59, 0.04)"; // neutral cool hover wash

// -- Liquid Metal signature effect constants ---------------------------------
export const CHROME_TEXT_GRADIENT =
  "linear-gradient(135deg, #1e293b 0%, #64748b 50%, #94a3b8 100%)";
export const ACCENT_GRADIENT =
  "linear-gradient(135deg, #5b6cff 0%, #7b8aff 100%)";
export const SHEEN_GRADIENT =
  "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)";
export const GLASS_HIGHLIGHT = "inset 0 1px 0 rgba(255,255,255,0.7)";

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

const theme = createTheme({
  palette: {
    primary: {
      main: ACCENT,
      light: "#8b9aff",
      dark: ACCENT_HOVER,
      contrastText: "#ffffff",
    },
    secondary: {
      main: SLATE_SOFT,
      light: SLATE_FAINT,
      dark: SLATE,
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    info: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
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
      selected: ACCENT_SOFT,
      focus: "rgba(30, 41, 59, 0.08)",
    },
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: {
      fontFamily: DISPLAY_STACK,
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: DISPLAY_STACK,
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.25,
    },
    h3: {
      fontFamily: DISPLAY_STACK,
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
    },
    h4: { fontSize: "1.125rem", fontWeight: 600 },
    h5: { fontSize: "1rem", fontWeight: 600 },
    h6: { fontSize: "0.875rem", fontWeight: 600 },
    overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // -- AppBar: translucent glass with metallic gradient hairline ------------
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: INK,
          borderBottom: "none",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #e3e8f0, #c7d2fe, #e3e8f0, transparent)",
          },
        },
      },
    },

    // -- Paper: glass effect with inner highlight -----------------------------
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
      variants: [
        {
          props: { elevation: 0 },
          style: {
            border: `1px solid ${HAIRLINE}`,
            boxShadow: GLASS_HIGHLIGHT,
          },
        },
      ],
    },

    // -- Button: accent gradient + sheen sweep on hover -----------------------
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
            background: ACCENT_GRADIENT,
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: SHEEN_GRADIENT,
              transition: "transform 0.5s ease",
            },
            "&:hover::after": {
              transform: "translateX(100%)",
            },
            "&:hover": {
              background: `linear-gradient(135deg, ${ACCENT_HOVER} 0%, #6b7cff 100%)`,
            },
          },
        },
        {
          props: { variant: "outlined", color: "primary" },
          style: {
            color: "#334155",
            borderColor: INPUT_BORDER,
            "&:hover": { borderColor: SLATE_FAINT, backgroundColor: HOVER_BG },
          },
        },
      ],
    },

    // -- TableCell: platinum header fill + tabular nums -----------------------
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          borderBottom: `1px solid ${HAIRLINE}`,
          fontVariantNumeric: "tabular-nums",
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

    // -- OutlinedInput: metallic focus ring -----------------------------------
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: INPUT_BORDER },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: SLATE_FAINT },
          "&.Mui-focused": { boxShadow: FOCUS_RING },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: ACCENT,
            borderWidth: 1,
          },
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

    // -- Dialog / Popover: glass overlays + accent-tinted shadow --------------
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${HAIRLINE}`,
          backgroundImage: "none",
          boxShadow: OVERLAY_SHADOW,
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
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
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
        },
      },
    },

    // -- Menu -----------------------------------------------------------------
    MuiMenu: {
      styleOverrides: { list: { padding: 4 } },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: "0.8125rem", borderRadius: 6, paddingTop: 6, paddingBottom: 6 },
      },
    },

    // -- Chip -----------------------------------------------------------------
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        sizeSmall: { height: 22, fontSize: "0.6875rem" },
        outlined: { borderColor: INPUT_BORDER },
      },
    },

    // -- Tabs / Tab: liquid accent selected state -----------------------------
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: `1px solid ${HAIRLINE}` },
        indicator: { height: 2, backgroundColor: ACCENT },
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

    // -- ListItemButton: liquid accent selected -------------------------------
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

    // -- Skeleton: platinum shimmer -------------------------------------------
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: "#eef1f6" } },
    },

    // -- Tooltip: dark slate (correct on light) -------------------------------
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
