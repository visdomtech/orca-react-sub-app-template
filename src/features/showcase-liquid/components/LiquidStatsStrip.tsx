import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import TuneIcon from "@mui/icons-material/Tune";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { GlassCard } from "@doublefin/orca-ui";
import type { SectionColor } from "./LiquidSectionHeader";

interface Stat {
  icon: ReactNode;
  value: string;
  label: string;
  color: SectionColor;
}

const STATS: Stat[] = [
  { icon: <WidgetsIcon fontSize="small" />, value: "12", label: "Kit components", color: "info" },
  { icon: <TuneIcon fontSize="small" />, value: "17", label: "Theme overrides", color: "warning" },
  { icon: <StyleIcon fontSize="small" />, value: "5", label: "Status tones", color: "success" },
  { icon: <PaletteIcon fontSize="small" />, value: "1", label: "Liquid accent", color: "primary" },
];

/**
 * Glass metric tiles for the liquid metal showcase.
 * Uses GlassCard with metallic border + sheen-sweep hover effect.
 */
export function LiquidStatsStrip() {
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
        <GlassCard
          key={stat.label}
          padding={2}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            transition: "border-color 0.2s ease, transform 0.2s ease",
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-1px)",
            },
          }}
        >
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
        </GlassCard>
      ))}
    </Box>
  );
}
