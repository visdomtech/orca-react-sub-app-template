import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { SubAppLink } from "../../../shared/SubAppLink";

const META_CHIPS = ["@doublefin/orca-ui v0.2", "MUI 9", "React 19"];

/**
 * Accent hero band for the showcase page. Solid primary.main surface with
 * white text and translucent solid shapes - no gradients, per anti-slop rules.
 * Docs/showcase surfaces only; data pages keep the quiet PageHeader.
 */
export function ShowcaseHero() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        px: { xs: 3, md: 5 },
        py: { xs: 4, md: 5 },
        mb: 3,
      }}
    >
      {/* Decorative geometry: solid translucent shapes only (gradients are banned). */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
          top: -110,
          right: -70,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
          bottom: -70,
          right: 130,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.14)",
          top: 40,
          right: 260,
          display: { xs: "none", md: "block" },
        }}
      />

      <Box sx={{ position: "relative" }}>
        <Button
          component={SubAppLink}
          to="/"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{
            color: "rgba(255,255,255,0.85)",
            px: 0,
            mb: 2.5,
            "&:hover": { bgcolor: "transparent", color: "#ffffff" },
          }}
        >
          Back to home
        </Button>
        <Typography
          variant="overline"
          sx={{ display: "block", color: "rgba(255,255,255,0.72)", mb: 1 }}
        >
          Mercury Console
        </Typography>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, mb: 1.5 }}
        >
          Design System Showcase
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.85)",
            maxWidth: 560,
            mb: 3,
            fontSize: "0.9375rem",
            lineHeight: 1.6,
          }}
        >
          The complete reference for Orca business consoles - every kit
          component, theme token, and status language on one page.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {META_CHIPS.map((label) => (
            <Chip
              key={label}
              label={label}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.32)",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
