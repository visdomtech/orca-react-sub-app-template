import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, useRoutes } from "react-router";
import { useMemo, type ComponentType } from "react";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { ShowcasePage } from "./features/showcase/pages/ShowcasePage";
import { ShowcaseLiquidPage } from "./features/showcase-liquid/pages/ShowcaseLiquidPage";
import { SlackNotificationPage } from "./features/notifications/pages/SlackNotificationPage";
import { SubAppBasenameContext } from "./shared/SubAppLink";
import { OrcaHostProvider, type ApprovalFlowProps } from "./shared/OrcaHostContext";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

const routes = [
  { path: "/", element: <HelloPage /> },
  { path: "/showcase", element: <ShowcasePage /> },
  { path: "/showcase-liquid", element: <ShowcaseLiquidPage /> },
  { path: "/notifications", element: <SlackNotificationPage /> },
];

interface OrcaAppProps {
  basename?: string;
  ApprovalFlow?: ComponentType<ApprovalFlowProps>;
}

export function OrcaApp({ basename, ApprovalFlow }: OrcaAppProps) {
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
    <OrcaHostProvider value={{ ApprovalFlow }}>
      <SubAppBasenameContext value={basename ?? ""}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            {element}
          </QueryClientProvider>
        </ThemeProvider>
      </SubAppBasenameContext>
    </OrcaHostProvider>
  );
}

export default OrcaApp;
