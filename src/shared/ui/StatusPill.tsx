import Box from "@mui/material/Box";
import { alpha, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";

export type StatusPillTone = "success" | "warning" | "error" | "info" | "neutral";

export interface StatusPillProps {
  tone: StatusPillTone;
  label: string;
}

const BASE_SX: SystemStyleObject<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  height: 22,
  px: 1,
  borderRadius: 999,
  fontSize: "0.6875rem",
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

// Hoisted per-tone styles: serialized once per theme, never per render.
const TONE_SX: Record<StatusPillTone, (theme: Theme) => SystemStyleObject<Theme>> = {
  success: (t) => ({ color: t.palette.success.dark, bgcolor: alpha(t.palette.success.main, 0.12) }),
  warning: (t) => ({ color: t.palette.warning.dark, bgcolor: alpha(t.palette.warning.main, 0.14) }),
  error: (t) => ({ color: t.palette.error.dark, bgcolor: alpha(t.palette.error.main, 0.12) }),
  info: (t) => ({ color: t.palette.info.dark, bgcolor: alpha(t.palette.info.main, 0.12) }),
  neutral: (t) => ({ color: t.palette.text.secondary, bgcolor: t.palette.action.selected }),
};

export function StatusPill({ tone, label }: StatusPillProps) {
  return (
    <Box component="span" sx={[BASE_SX, TONE_SX[tone]]}>
      {label}
    </Box>
  );
}
