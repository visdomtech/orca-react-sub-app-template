export const helloQueryKeys = {
  root: ["hello"] as const,
  stats: () => [...helloQueryKeys.root, "stats"] as const,
};
