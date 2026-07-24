import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="overline" sx={{ display: "block", color: "text.secondary" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
          {description}
        </Typography>
      )}
      <Divider sx={{ my: 2 }} />
      <Stack spacing={2.5}>{children}</Stack>
    </Box>
  );
}
