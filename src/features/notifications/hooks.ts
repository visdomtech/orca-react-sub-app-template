import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disconnectOAuth2,
  getOAuth2Status,
  sendNotification,
} from "./api";
import { notificationQueryKeys } from "./queryKeys";
import type { SendNotificationRequest } from "./types";

export function useOAuth2Status(provider: string) {
  return useQuery({
    queryKey: notificationQueryKeys.status(provider),
    queryFn: () => getOAuth2Status(provider),
    refetchOnWindowFocus: true,
  });
}

export function useDisconnectOAuth2(provider: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectOAuth2(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.status(provider),
      });
    },
  });
}

export function useSendNotification() {
  return useMutation({
    mutationFn: (msg: SendNotificationRequest) => sendNotification(msg),
  });
}
