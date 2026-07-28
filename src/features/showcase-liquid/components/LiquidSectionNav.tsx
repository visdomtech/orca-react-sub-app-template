import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const SECTIONS = [
  { id: "colors", label: "Colors" },
  { id: "table", label: "Data table" },
  { id: "status", label: "Status & badges" },
  { id: "detail", label: "Detail layout" },
  { id: "forms", label: "Forms" },
  { id: "components", label: "MUI components" },
  { id: "states", label: "Loading & empty" },
];

function scrollToSection(id: string) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

/**
 * Sticky glass-pill anchor navigation for the liquid metal showcase.
 * Stronger glass background + accent glow on hover.
 * Jump links only - no scroll listeners, no active-state tracking.
 */
export function LiquidSectionNav() {
  return (
    <Box
      component="nav"
      aria-label="Showcase sections"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        bgcolor: "rgba(244,246,250,0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        py: 1.25,
        mb: 4,
        borderBottom: "1px solid",
        borderColor: "rgba(255,255,255,0.4)",
        display: "flex",
        gap: 1,
        overflowX: "auto",
      }}
    >
      {SECTIONS.map((section) => (
        <Chip
          key={section.id}
          label={section.label}
          size="small"
          variant="outlined"
          onClick={() => scrollToSection(section.id)}
          sx={{
            flexShrink: 0,
            cursor: "pointer",
            bgcolor: "rgba(255,255,255,0.5)",
            borderColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "rgba(91,108,255,0.10)",
              boxShadow: "0 0 12px rgba(91,108,255,0.2)",
              transform: "translateY(-1px)",
            },
          }}
        />
      ))}
    </Box>
  );
}
