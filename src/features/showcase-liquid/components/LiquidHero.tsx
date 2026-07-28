import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AmbientBackground, GlassCard, GradientText } from "@doublefin/orca-ui";
import { CHROME_TEXT_GRADIENT } from "../../../theme/theme-liquid";
import { SubAppLink } from "../../../shared/SubAppLink";
import "../liquid.css";

const META_CHIPS = ["@doublefin/orca-ui v0.4", "MUI 9", "React 19"];

/**
 * Dramatic glass hero band for the liquid metal showcase.
 * Uses GlassCard (visibly translucent) + GradientText (specular chrome)
 * from orca-ui + AmbientBackground vivid layer.
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
          py: { xs: 5, md: 6 },
          mb: 3,
          bgcolor: "rgba(255,255,255,0.35)",
          border: "1px solid",
          borderColor: "rgba(255,255,255,0.5)",
        }}
      >
        {/* Decorative geometry: gradient-filled translucent shapes */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(91,108,255,0.10) 0%, rgba(199,210,224,0.06) 60%, transparent 80%)",
            top: -140,
            right: -90,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%)",
            bottom: -90,
            right: 160,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(91,108,255,0.12) 0%, transparent 70%)",
            top: 50,
            right: 300,
            display: { xs: "none", md: "block" },
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(199,210,224,0.10) 0%, transparent 70%)",
            bottom: 30,
            left: -40,
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
              mb: 3,
              "&:hover": { bgcolor: "transparent", color: "primary.main" },
            }}
          >
            Back to home
          </Button>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              color: "primary.main",
              mb: 1.5,
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            LIQUID METAL
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2rem", md: "2.75rem" },
              mb: 2,
              lineHeight: 1.15,
            }}
          >
            <GradientText
              gradient={CHROME_TEXT_GRADIENT}
              component="span"
              sx={{ fontSize: "inherit", fontWeight: "inherit", letterSpacing: "inherit" }}
            >
              Design System Showcase
            </GradientText>
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              maxWidth: 560,
              mb: 3,
              fontSize: "1rem",
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
                  bgcolor: "rgba(91,108,255,0.08)",
                  color: "primary.main",
                  borderColor: "rgba(91,108,255,0.3)",
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        </Box>
      </GlassCard>
    </>
  );
}
