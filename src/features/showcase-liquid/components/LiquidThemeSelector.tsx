import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import { GlassCard } from "@doublefin/orca-ui";
import { useLiquidTheme } from "../LiquidThemeContext";

/**
 * Horizontal glass-pill theme selector.
 * Each preset renders as a tappable pill with a color preview swatch,
 * label, and active indicator (check icon + accent glow border).
 */
export function LiquidThemeSelector() {
  const { preset, presets, setPresetId } = useLiquidTheme();
  const accent = preset.accent;

  return (
    <GlassCard padding={1.5} borderRadius={2} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", mr: 1, whiteSpace: "nowrap" }}
        >
          Theme
        </Typography>
        {presets.map((p) => {
          const isActive = p.id === preset.id;
          return (
            <Tooltip key={p.id} title={p.description} arrow placement="top">
              <Box
                component="button"
                onClick={() => setPresetId(p.id)}
                aria-label={`Switch to ${p.label} theme`}
                aria-pressed={isActive}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  border: "1.5px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  bgcolor: isActive
                    ? alpha(accent, 0.06)
                    : "transparent",
                  boxShadow: isActive
                    ? `0 0 12px ${alpha(accent, 0.18)}`
                    : "none",
                  cursor: "pointer",
                  transition:
                    "border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
                  outline: "none",
                  "&:hover": {
                    borderColor: "primary.light",
                    bgcolor: alpha(accent, 0.04),
                  },
                  "&:focus-visible": {
                    borderColor: "primary.main",
                    boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}33`,
                  },
                }}
              >
                {/* Color preview swatch */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: p.previewGradient,
                    border: "1.5px solid",
                    borderColor: isActive
                      ? "primary.main"
                      : "rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "text.primary" : "text.secondary",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {p.label}
                </Typography>
                {isActive && (
                  <CheckIcon
                    sx={{ fontSize: 14, color: "primary.main", ml: -0.25 }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </GlassCard>
  );
}
