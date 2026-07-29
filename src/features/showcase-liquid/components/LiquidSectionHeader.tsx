import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

// Semantic hues allowed for section icon chips on docs/showcase surfaces.
export type SectionColor = "primary" | "success" | "warning" | "error" | "info";

interface LiquidSectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  color?: SectionColor;
}

/**
 * Section opener for the liquid metal showcase: gradient icon chip + chrome title + description.
 * The chip tint is derived from theme tokens via alpha() - never raw hex.
 */
export function LiquidSectionHeader({
  icon,
  title,
  description,
  color = "primary",
}: LiquidSectionHeaderProps) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 2.5 }}>
      <Box
        sx={(theme) => ({
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.14)} 0%, ${alpha(theme.palette[color].main, 0.04)} 100%)`,
          color: theme.palette[color].dark,
          boxShadow: `0 2px 8px -2px ${alpha(theme.palette[color].main, 0.2)}`,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontSize: "1.125rem", color: "text.primary" }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 640 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
