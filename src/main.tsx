import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import OrcaApp from "./OrcaApp";

// Standalone dev entry: provides a router so useRoutes() inside OrcaApp works.
// When loaded via Module Federation, the host provides the router context and
// passes a basename prop so OrcaApp prefixes its routes accordingly.
const router = createBrowserRouter([{ path: "/*", element: <OrcaApp /> }]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
