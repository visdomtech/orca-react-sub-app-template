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
 * Sticky anchor navigation for the showcase page. Jump links only - no scroll
 * listeners, no active-state tracking (scroll listeners are banned).
 */
export function SectionNav() {
  return (
    <Box
      component="nav"
      aria-label="Showcase sections"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        bgcolor: "background.default",
        py: 1.25,
        mb: 4,
        borderBottom: "1px solid",
        borderColor: "divider",
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
          sx={{ flexShrink: 0, cursor: "pointer", bgcolor: "background.paper" }}
        />
      ))}
    </Box>
  );
}
