export const notificationQueryKeys = {
  root: ["notifications"] as const,
  status: (provider: string) =>
    [...notificationQueryKeys.root, "status", provider] as const,
};
