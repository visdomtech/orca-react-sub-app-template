import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { useHref, useNavigate } from "react-router";

/**
 * Provides the sub-app's mount-point basename (e.g. `/ng/orca/apps/hello`)
 * so that internal links can prefix it correctly.
 *
 * Without this, `<Link to="/showcase">` resolves against the host's
 * basename (`/ng`) and produces `/ng/showcase` instead of
 * `/ng/orca/apps/hello/showcase`.
 */
export const SubAppBasenameContext = createContext<string>("");

/**
 * Returns the full absolute sub-app basename (e.g. `/ng/orca/apps/hello`).
 * Includes the host router's basename prefix.
 */
export function useSubAppBasePath(): string {
  return useContext(SubAppBasenameContext);
}

/**
 * Returns the sub-app basename relative to the host router (e.g. `/orca/apps/hello`).
 * Strips the host router's own basename (e.g. `/ng`).
 *
 * Use this for `backHref` props on `PageHeader` / `DetailLayout` from
 * `@doublefin/orca-ui`, because those components use react-router's `<Link>`
 * internally, which re-applies the router's basename.
 */
export function useSubAppRouterBasePath(): string {
  const basename = useSubAppBasePath();
  const routerHrefRoot = useHref("/");
  const routerBasename = routerHrefRoot.endsWith("/")
    ? routerHrefRoot.slice(0, -1)
    : routerHrefRoot;
  return useMemo(() => {
    if (routerBasename && basename.startsWith(routerBasename)) {
      return basename.slice(routerBasename.length) || "/";
    }
    return basename;
  }, [basename, routerBasename]);
}

interface SubAppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children?: ReactNode;
}

/**
 * A drop-in replacement for react-router's `<Link>` that automatically
 * prefixes the `to` prop with the sub-app basename.
 *
 * Uses a plain `<a>` + `useNavigate()` instead of react-router's `<Link>`
 * because `<Link>` would re-apply the host router's basename on top,
 * causing double-prefixing (e.g. `/ng/ng/orca/apps/hello/showcase`).
 *
 * The `<a href>` uses the full absolute path for correct browser behavior
 * (right-click copy, open in new tab). The click handler uses
 * `useNavigate()` with a router-relative path (basename prefix stripped)
 * so the router doesn't double-apply its own basename.
 *
 * Use this instead of `<Link>` for all internal navigation inside a
 * remote sub-app loaded via Module Federation.
 */
export function SubAppLink({ to, children, onClick, ...rest }: SubAppLinkProps) {
  const basename = useSubAppBasePath();
  const navigate = useNavigate();
  // Derive the router's basename (e.g. "/ng") from useHref.
  // useHref("/") = routerBasename + "/" → strip trailing "/".
  const routerHrefRoot = useHref("/");
  const routerBasename = routerHrefRoot.endsWith("/")
    ? routerHrefRoot.slice(0, -1)
    : routerHrefRoot;

  // Full absolute path for the <a href> (e.g. /ng/orca/apps/hello/showcase).
  const href = `${basename}${to}`;
  // Router-relative path for navigate() (e.g. /orca/apps/hello/showcase).
  // navigate() internally applies the router's basename, so we must NOT
  // include it in the path.
  const navigatePath = useMemo(() => {
    if (routerBasename && href.startsWith(routerBasename)) {
      return href.slice(routerBasename.length) || "/";
    }
    return href;
  }, [href, routerBasename]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      // Skip for modifier-key clicks (open in new tab, etc.)
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      navigate(navigatePath);
    },
    [navigatePath, navigate, onClick],
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
