import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "react-router";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { ShowcasePage } from "./features/showcase/pages/ShowcasePage";
import { SlackNotificationPage } from "./features/notifications/pages/SlackNotificationPage";
import { AppBasenameProvider } from "./shared/AppLink";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

// useRoutes() inside the host sees the REMAINING pathname after the host's
// parent routes consume their segments (e.g. just "hello" at /orca/apps/hello,
// not the full URL). A root "/*" catch-all handles this: it matches any
// remaining segment, then child routes match the actual page paths.
// In standalone mode the remaining pathname IS the full URL (/ or /showcase),
// and the same /* structure works identically.
const routes = [
  {
    path: "/*",
    children: [
      { path: "/", element: <HelloPage /> },
      { path: "/showcase", element: <ShowcasePage /> },
      { path: "/notifications", element: <SlackNotificationPage /> },
    ],
  },
];

export function OrcaApp({ basename }: { basename?: string }) {
  const element = useRoutes(routes);

  return (
    <AppBasenameProvider basename={basename ?? ""}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          {element}
        </QueryClientProvider>
      </ThemeProvider>
    </AppBasenameProvider>
  );
}

export default OrcaApp;
