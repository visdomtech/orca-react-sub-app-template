import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "react-router";

export interface DetailLayoutProps {
  title: string;
  subtitle?: string;
  /** Status slot next to the title — pass <StatusPill/>. */
  status?: ReactNode;
  /** Leading visual (e.g. a large Avatar on a user detail page). */
  avatar?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Sections, Tabs, panels — composition only; DetailLayout never owns tab state. */
  children: ReactNode;
}

export function DetailLayout({
  title,
  subtitle,
  status,
  avatar,
  actions,
  backHref,
  backLabel = "Back",
  children,
}: DetailLayoutProps) {
  return (
    <Box>
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        {avatar}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h5">{title}</Typography>
            {status}
          </Box>
          {subtitle && (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
}
