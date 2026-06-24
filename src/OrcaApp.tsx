import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelloPage } from "./features/hello/pages/HelloPage";
import "./index.css";

const queryClient = new QueryClient();

export function OrcaApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelloPage />
    </QueryClientProvider>
  );
}

export default OrcaApp;
