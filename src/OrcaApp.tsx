import { useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { SlackNotificationPage } from "./features/notifications/pages/SlackNotificationPage";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

const routes = [
  { path: "/", element: <HelloPage /> },
  { path: "/notifications", element: <SlackNotificationPage /> },
];

interface OrcaAppProps {
  basename?: string;
}

export function OrcaApp({ basename }: OrcaAppProps) {
  const [router] = useState(() => createBrowserRouter(routes, { basename }));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default OrcaApp;
