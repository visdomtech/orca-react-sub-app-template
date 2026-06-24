import { useHelloStats } from "../hooks";

export function HelloPage() {
  const { data, isLoading, error } = useHelloStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 text-sm">Failed to load data.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
    >
      <h1 className="text-4xl font-bold text-slate-800 mb-3">
        {data?.greeting}
      </h1>
      <p className="text-lg text-slate-500 max-w-md leading-relaxed mb-8">
        This is a standalone micro-frontend loaded via Vite Module Federation.
        It lives in its own repository and ships independently of the host.
      </p>
      <div className="px-4 py-2 bg-slate-100 rounded-lg text-xs text-slate-500 font-mono">
        route: /orca/hello &nbsp;·&nbsp; loaded: {data?.loadedAt}
      </div>
    </div>
  );
}
