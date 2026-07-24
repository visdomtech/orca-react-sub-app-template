import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface DetailRowProps {
  label: string;
  children: ReactNode;
}

/** Label/value row for detail pages. */
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <Box sx={{ display: "flex", py: 1.5 }}>
      <Typography variant="body2" sx={{ width: 160, flexShrink: 0, fontWeight: 500, color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
