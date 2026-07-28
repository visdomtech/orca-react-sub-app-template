import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import OrcaApp from "./OrcaApp";

// Standalone dev entry: provides a router so useRoutes() inside OrcaApp works.
// The host provides its own router when loaded via Module Federation.
const router = createBrowserRouter([{ path: "/*", element: <OrcaApp /> }]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
