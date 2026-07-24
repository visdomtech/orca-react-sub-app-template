import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "react-router";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action buttons (Refresh, Create…). */
  actions?: ReactNode;
  /** When set, renders a back link above the title (react-router). */
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, actions, backHref, backLabel = "Back" }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {backHref && (
        <Button
          component={Link}
          to={backHref}
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, ml: -1, color: "text.secondary" }}
        >
          {backLabel}
        </Button>
      )}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
