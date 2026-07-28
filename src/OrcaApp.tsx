import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "react-router";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { SlackNotificationPage } from "./features/notifications/pages/SlackNotificationPage";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

const routes = [
  { path: "/", element: <HelloPage /> },
  { path: "/notifications", element: <SlackNotificationPage /> },
];

export function OrcaApp() {
  // useRoutes hooks into the host's router context instead of creating
  // a new one, avoiding the nested Router error.
  const element = useRoutes(routes);

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
