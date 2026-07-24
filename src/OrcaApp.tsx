import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelloPage } from "./features/hello/pages/HelloPage";
import { theme } from "./theme/theme";
import "./index.css";

const queryClient = new QueryClient();

export function OrcaApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <HelloPage />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default OrcaApp;
