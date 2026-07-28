import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link } from "react-router";
import { DetailSkeleton, PageHeader } from "@doublefin/orca-ui";
import { useHelloStats } from "../hooks";

export function HelloPage() {
  const { data, isLoading, error } = useHelloStats();

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <DetailSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title="Hello" />
        <Typography variant="body2" color="error">
          Failed to load data.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title={data?.greeting ?? "Hello"} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 480, lineHeight: 1.6, mb: 3 }}
      >
        This is a standalone micro-frontend loaded via Vite Module Federation.
        It lives in its own repository and ships independently of the host.
      </Typography>
      <Box
        sx={{
          display: "inline-block",
          px: 2,
          py: 1,
          bgcolor: "background.default",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: "monospace" }}
        >
          route: /orca/hello &middot; loaded: {data?.loadedAt}
        </Typography>
      </Box>

      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiLink
          component={Link}
          to="/showcase"
          variant="body2"
          underline="hover"
        >
          Design System Showcase
        </MuiLink>
        <MuiLink
          component={Link}
          to="/notifications"
          variant="body2"
          underline="hover"
        >
          Slack Notifications
        </MuiLink>
      </Box>
    </Box>
  );
}
