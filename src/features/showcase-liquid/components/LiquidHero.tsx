import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AmbientBackground, GlassCard, GradientText } from "@doublefin/orca-ui";
import { SubAppLink } from "../../../shared/SubAppLink";
import "../liquid.css";

const META_CHIPS = ["@doublefin/orca-ui v0.3", "MUI 9", "React 19"];

/**
 * Glass hero band for the liquid metal showcase.
 * Uses GlassCard + GradientText from orca-ui + AmbientBackground layer.
 */
export function LiquidHero() {
  return (
    <>
      <AmbientBackground />
      <GlassCard
        padding={0}
        borderRadius={3}
        sx={{
          position: "relative",
          overflow: "hidden",
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 },
          mb: 3,
          bgcolor: "rgba(255,255,255,0.48)",
          border: "1px solid",
          borderColor: "rgba(199,210,224,0.5)",
        }}
      >
        {/* Decorative geometry: solid translucent shapes (no gradients per base rules). */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "1px solid rgba(199,210,224,0.25)",
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
            bgcolor: "rgba(91,108,255,0.06)",
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
            bgcolor: "rgba(199,210,224,0.14)",
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
              color: "text.secondary",
              px: 0,
              mb: 2.5,
              "&:hover": { bgcolor: "transparent", color: "primary.main" },
            }}
          >
            Back to home
          </Button>
          <Typography
            variant="overline"
            sx={{ display: "block", color: "text.secondary", mb: 1 }}
          >
            Liquid Metal
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, mb: 1.5 }}
          >
            <GradientText component="span" sx={{ fontSize: "inherit", fontWeight: "inherit", letterSpacing: "inherit" }}>
              Design System Showcase
            </GradientText>
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              maxWidth: 560,
              mb: 3,
              fontSize: "0.9375rem",
              lineHeight: 1.6,
            }}
          >
            The complete reference for the Liquid Metal design system - every kit
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
                  bgcolor: "rgba(91,108,255,0.06)",
                  color: "primary.main",
                  borderColor: "rgba(91,108,255,0.24)",
                }}
              />
            ))}
          </Box>
        </Box>
      </GlassCard>
    </>
  );
}
