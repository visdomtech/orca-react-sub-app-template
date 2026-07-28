import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import TuneIcon from "@mui/icons-material/Tune";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { GlassCard, GradientText } from "@doublefin/orca-ui";
import { CHROME_TEXT_GRADIENT } from "../../../theme/theme-liquid";
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
 * Uses GlassCard (visibly translucent) with hover lift + glow + gradient stat values.
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
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-2px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 40px -4px rgba(15,23,42,0.12), 0 0 20px rgba(91,108,255,0.15)",
            },
          }}
        >
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.12)} 0%, ${alpha(theme.palette[stat.color].main, 0.04)} 100%)`,
              color: theme.palette[stat.color].dark,
            })}
          >
            {stat.icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              <GradientText
                gradient={CHROME_TEXT_GRADIENT}
                component="span"
                sx={{ fontSize: "inherit", fontWeight: "inherit", letterSpacing: "inherit" }}
              >
                {stat.value}
              </GradientText>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {stat.label}
            </Typography>
          </Box>
        </GlassCard>
      ))}
    </Box>
  );
}
