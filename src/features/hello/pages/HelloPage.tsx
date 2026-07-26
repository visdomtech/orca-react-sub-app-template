import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DetailSkeleton, PageHeader } from "@doublefin/orca-ui";
import { useHelloStats } from "../hooks";

export function HelloPage() {
  const { data, isLoading, error } = useHelloStats();

  if (isLoading) {
    return <DetailSkeleton />;
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
    </Box>
  );
}
