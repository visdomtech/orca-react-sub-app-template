import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { GlassCard } from "@doublefin/orca-ui";

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

interface Swatch {
  name: string;
  value: string;
  usage: string;
  /** Light tokens need a hairline on the swatch block to stay visible. */
  border?: boolean;
}

/**
 * Palette wall rendered live from useTheme() - swatches backed by glass cards
 * with hover lift. Swatches can never drift from the real liquid metal token values.
 */
export function LiquidTokenSwatches() {
  const theme = useTheme();
  const p = theme.palette;

  const SWATCHES: Swatch[] = [
    { name: "primary.main", value: p.primary.main, usage: "Liquid accent, CTAs, links" },
    { name: "primary.dark", value: p.primary.dark, usage: "Accent hover" },
    { name: "primary.light", value: p.primary.light, usage: "Accent tint" },
    { name: "success.main", value: p.success.main, usage: "Completed, healthy" },
    { name: "warning.main", value: p.warning.main, usage: "Pending, attention" },
    { name: "error.main", value: p.error.main, usage: "Failed, destructive" },
    { name: "info.main", value: p.info.main, usage: "Running, neutral info" },
    { name: "text.primary", value: p.text.primary, usage: "Ink, headings" },
    { name: "text.secondary", value: p.text.secondary, usage: "Secondary text" },
    { name: "divider", value: p.divider, usage: "Hairline borders", border: true },
    { name: "background.default", value: p.background.default, usage: "Platinum canvas", border: true },
    { name: "background.paper", value: p.background.paper, usage: "Glass surfaces", border: true },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
        gap: 1.5,
      }}
    >
      {SWATCHES.map((swatch) => (
        <GlassCard
          key={swatch.name}
          padding={1.5}
          sx={{
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-2px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 40px -4px rgba(15,23,42,0.12), 0 0 20px rgba(91,108,255,0.12)",
            },
          }}
        >
          <Box
            sx={{
              height: 56,
              borderRadius: 1.5,
              bgcolor: swatch.value,
              border: swatch.border ? "1px solid" : "none",
              borderColor: "divider",
              mb: 1,
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            }}
          />
          <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
            {swatch.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", fontFamily: MONO_STACK }}
          >
            {swatch.value.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {swatch.usage}
          </Typography>
        </GlassCard>
      ))}
    </Box>
  );
}
