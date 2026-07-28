import { httpClient } from "../../api/httpClient";
import type { NotificationStatus, SendNotificationRequest } from "./types";

export async function getOAuth2Status(
  provider: string
): Promise<NotificationStatus> {
  return httpClient.get<NotificationStatus>(
    `/orcaagents/notification/oauth2/status?provider=${encodeURIComponent(provider)}`
  );
}

export async function disconnectOAuth2(provider: string): Promise<void> {
  return httpClient.delete<void>(
    `/orcaagents/notification/oauth2/disconnect?provider=${encodeURIComponent(provider)}`
  );
}

export async function sendNotification(
  msg: SendNotificationRequest
): Promise<void> {
  return httpClient.post<void>("/orcaagents/notification/send", msg);
}

/**
 * Build the OAuth2 authorize URL for opening in a popup window.
 *
 * In production the URL is same-origin (JWT in the `s` cookie).
 * In development the URL points to the dev API with the API key query param
 * so that the popup can authenticate without same-origin cookies.
 */
export function buildAuthorizeUrl(provider: string): string {
  const isProd = window.location.host.endsWith(".doublefin.com");
  const base = isProd
    ? ""
    : "https://devorcaapi.doublefin.com";
  const params = new URLSearchParams({ provider });
  // In dev, pass the API key as a query param so the GET request authenticates
  // without the `s` cookie (which the popup won't have cross-origin).
  if (!isProd) {
    params.set("x-doublefin-api-key", "mgyyywu3ntetnzizms00yjfkltkwmwetmwrlmduzzjzmztmw");
  }
  return `${base}/orcaagents/notification/oauth2/authorize?${params}`;
}
