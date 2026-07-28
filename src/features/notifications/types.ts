export interface NotificationStatus {
  connected: boolean;
  email?: string;
  provider: string;
}

export interface SendNotificationRequest {
  channel: string;
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  mrkdwn?: boolean;
  parse?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  link_names?: boolean;
}
