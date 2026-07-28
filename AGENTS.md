# AGENTS.md — Orca React Sub-App Template

This guide is for AI agents and developers working in this repository. Always read `CLAUDE.md` first for project conventions.

## Routing Contract (Critical)

The Orca host loads this sub-app via **Module Federation** and renders `<OrcaApp basename={...} />` inside its own React Router context. Two rules **must** be followed to avoid broken routing:

### Rule 1: Never create a nested Router

**Do NOT** render `<BrowserRouter>`, `<HashRouter>`, or call `createBrowserRouter()` inside `OrcaApp.tsx` or any component it renders. The host already provides a router context — nesting a second router causes:

- Broken URL sync between host and sub-app
- React Router invariant errors
- Navigation state desynchronization

**Instead**, use `useRoutes()` or `<Routes>` which hook into the host's existing router context. Strip the host's mount prefix from the location so sub-app routes match:

```tsx
// ✅ Correct — hooks into host router, strips basename for matching
import { useLocation, useRoutes } from "react-router";
import { useMemo } from "react";

export function OrcaApp({ basename }: { basename?: string }) {
  const location = useLocation();
  const matchLocation = useMemo(() => {
    if (!basename || !location.pathname.startsWith(basename)) return location;
    const stripped = location.pathname.slice(basename.length) || "/";
    return { ...location, pathname: stripped };
  }, [location, basename]);
  const element = useRoutes(routes, matchLocation);
  return <>{element}</>;
}

// ❌ Wrong — creates a nested router
import { createBrowserRouter, RouterProvider } from "react-router";

export function OrcaApp({ basename }: { basename?: string }) {
  const [router] = useState(() => createBrowserRouter(routes, { basename }));
  return <RouterProvider router={router} />;
}
```

### Rule 2: Accept and use the `basename` prop

The host passes `basename` (e.g. `/ng/orca/apps/my-app`) so the sub-app knows its mount point. **Always** strip it from `useLocation().pathname` before passing to `useRoutes`. Without this, route matching fails because `useRoutes` tries to match the full URL path (e.g. `/orca/apps/my-app/settings`) against sub-app routes (e.g. `/settings`).

```tsx
// ✅ Correct — strips host prefix so routes match
const location = useLocation();
const matchLocation = useMemo(() => {
  if (!basename || !location.pathname.startsWith(basename)) return location;
  const stripped = location.pathname.slice(basename.length) || "/";
  return { ...location, pathname: stripped };
}, [location, basename]);
const element = useRoutes(routes, matchLocation);

// ❌ Wrong — ignores basename, routes never match in MF mode
const element = useRoutes(routes);
```

### Rule 3: Use `SubAppLink` for all internal navigation

The host's router has `basename="/ng"`, so a plain `<Link to="/showcase">` generates `/ng/showcase` — **not** `/ng/orca/apps/my-app/showcase`. Always use `<SubAppLink>` (from `src/shared/SubAppLink.tsx`) which automatically prefixes the `to` prop with the sub-app's mount point.

For `backHref` props on `PageHeader` / `DetailLayout` (from `@doublefin/orca-ui`), use `useSubAppRouterBasePath()` — NOT `useSubAppBasePath()`. These components use react-router's `<Link>` internally, which re-applies the router's basename, so the path must be router-relative (without `/ng`):

```tsx
import { SubAppLink, useSubAppRouterBasePath } from "../shared/SubAppLink";

// ✅ SubAppLink prefixes the to prop automatically
<SubAppLink to="/settings">Settings</SubAppLink>

// ✅ Router-relative prefix for orca-ui backHref props
const routerBase = useSubAppRouterBasePath();
<PageHeader backHref={`${routerBase}/`} />
<DetailLayout backHref={`${routerBase}/showcase`}>

// ❌ Wrong — plain Link generates host-relative URLs
import { Link } from "react-router";
<Link to="/showcase">Showcase</Link>  // → /ng/showcase (wrong!)

// ❌ Wrong — full path in backHref causes double-prefix
const basePath = useSubAppBasePath();  // = "/ng/orca/apps/hello"
<PageHeader backHref={`${basePath}/`} />  // → /ng/ng/orca/apps/hello/ (wrong!)
```

### Standalone dev mode

`main.tsx` provides its own `createBrowserRouter` wrapper so `useRoutes()` works during `bun run dev`. No `basename` is needed — routes mount at `/`.
