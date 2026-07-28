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
 * Section opener for the liquid metal showcase: colored icon chip + title + description.
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
          width: 36,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette[color].main, 0.1),
          color: theme.palette[color].dark,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 640 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
