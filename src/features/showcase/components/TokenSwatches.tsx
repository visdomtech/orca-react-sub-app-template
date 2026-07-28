import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

interface Swatch {
  name: string;
  value: string;
  usage: string;
  /** Light tokens need a hairline on the swatch block to stay visible. */
  border?: boolean;
}

/**
 * Palette wall rendered live from useTheme() - swatches can never drift from
 * the real token values. The colorful centerpiece of the showcase page.
 */
export function TokenSwatches() {
  const theme = useTheme();
  const p = theme.palette;

  const SWATCHES: Swatch[] = [
    { name: "primary.main", value: p.primary.main, usage: "Accent, CTAs, links" },
    { name: "primary.dark", value: p.primary.dark, usage: "Accent hover" },
    { name: "primary.light", value: p.primary.light, usage: "Accent tint" },
    { name: "success.main", value: p.success.main, usage: "Completed, healthy" },
    { name: "warning.main", value: p.warning.main, usage: "Pending, attention" },
    { name: "error.main", value: p.error.main, usage: "Failed, destructive" },
    { name: "info.main", value: p.info.main, usage: "Running, neutral info" },
    { name: "text.primary", value: p.text.primary, usage: "Ink, headings" },
    { name: "text.secondary", value: p.text.secondary, usage: "Secondary text" },
    { name: "divider", value: p.divider, usage: "Hairline borders", border: true },
    { name: "background.default", value: p.background.default, usage: "App canvas", border: true },
    { name: "background.paper", value: p.background.paper, usage: "Cards, surfaces", border: true },
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
        <Paper key={swatch.name} sx={{ p: 1.5 }}>
          <Box
            sx={{
              height: 56,
              borderRadius: 1.5,
              bgcolor: swatch.value,
              border: swatch.border ? "1px solid" : "none",
              borderColor: "divider",
              mb: 1,
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
        </Paper>
      ))}
    </Box>
  );
}
