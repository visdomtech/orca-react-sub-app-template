import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, useRoutes } from "react-router";
import { useMemo } from "react";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { ShowcasePage } from "./features/showcase/pages/ShowcasePage";
import { SlackNotificationPage } from "./features/notifications/pages/SlackNotificationPage";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

const routes = [
  { path: "/", element: <HelloPage /> },
  { path: "/showcase", element: <ShowcasePage /> },
  { path: "/notifications", element: <SlackNotificationPage /> },
];

interface OrcaAppProps {
  basename?: string;
}

export function OrcaApp({ basename }: OrcaAppProps) {
  // useRoutes hooks into the host's router context (no nested Router).
  // Strip the host's mount prefix so sub-app routes like "/" match correctly.
  const location = useLocation();
  const matchLocation = useMemo(() => {
    if (!basename || !location.pathname.startsWith(basename)) return location;
    const stripped = location.pathname.slice(basename.length) || "/";
    return { ...location, pathname: stripped };
  }, [location, basename]);
  const element = useRoutes(routes, matchLocation);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {element}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default OrcaApp;
