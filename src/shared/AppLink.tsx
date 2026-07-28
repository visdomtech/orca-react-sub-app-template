import { type ComponentProps, createContext, useContext } from "react";
import { Link } from "react-router";

const AppBasenameContext = createContext("");

/** Provides the host-supplied basename to all descendant routing helpers. */
export function AppBasenameProvider({
  basename,
  children,
}: {
  basename: string;
  children: React.ReactNode;
}) {
  return (
    <AppBasenameContext.Provider value={basename}>
      {children}
    </AppBasenameContext.Provider>
  );
}

/** Returns the current app basename (e.g. "/ng/orca/apps/hello" or "" in standalone). */
export function useAppBasename(): string {
  return useContext(AppBasenameContext);
}

/** Prefixes a path with the app basename. Use for orca-ui backHref props. */
export function useAppHref(path: string): string {
  const base = useAppBasename();
  if (!base) return path;
  return path === "/" ? base : `${base}${path}`;
}

/**
 * react-router Link that automatically prefixes `to` with the app basename.
 * Use this instead of importing Link from "react-router" directly in page
 * components so that navigation works in both standalone and MF-host modes.
 */
export function AppLink(props: ComponentProps<typeof Link>) {
  const base = useAppBasename();
  const to =
    typeof props.to === "string" && base ? `${base}${props.to}` : props.to;
  return <Link {...props} to={to} />;
}
