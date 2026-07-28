import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import TuneIcon from "@mui/icons-material/Tune";
import WidgetsIcon from "@mui/icons-material/Widgets";
import type { SectionColor } from "./SectionHeader";

interface Stat {
  icon: ReactNode;
  value: string;
  label: string;
  color: SectionColor;
}

const STATS: Stat[] = [
  { icon: <WidgetsIcon fontSize="small" />, value: "9", label: "Kit components", color: "info" },
  { icon: <TuneIcon fontSize="small" />, value: "17", label: "Theme overrides", color: "warning" },
  { icon: <StyleIcon fontSize="small" />, value: "5", label: "Status tones", color: "success" },
  { icon: <PaletteIcon fontSize="small" />, value: "1", label: "Accent color", color: "primary" },
];

/**
 * Metric tiles summarizing the design system. Elevation-0 Papers (automatic
 * hairline border) + alpha-tinted icon chips. Docs/showcase surfaces only.
 */
export function StatsStrip() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 1.5,
        mb: 3,
      }}
    >
      {STATS.map((stat) => (
        <Paper key={stat.label} sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 36,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette[stat.color].main, 0.1),
              color: theme.palette[stat.color].dark,
            })}
          >
            {stat.icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
