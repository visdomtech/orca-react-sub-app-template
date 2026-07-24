import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Required — a designed empty state always has a visual anchor. */
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, textAlign: "center" }}>
      <Box sx={{ color: "text.disabled", mb: 1.5, "& svg": { fontSize: 40 } }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
