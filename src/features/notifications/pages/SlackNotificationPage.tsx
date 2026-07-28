import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ChatIcon from "@mui/icons-material/Chat";
import {
  FormSection,
  PageHeader,
  StatusPill,
} from "@doublefin/orca-ui";
import { buildAuthorizeUrl } from "../api";
import {
  useDisconnectOAuth2,
  useOAuth2Status,
  useSendNotification,
} from "../hooks";

const PROVIDER = "SLACK";

export function SlackNotificationPage() {
  const { data: status, isLoading, refetch } = useOAuth2Status(PROVIDER);
  const disconnect = useDisconnectOAuth2(PROVIDER);
  const sendNotif = useSendNotification();

  const [messageText, setMessageText] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  // Listen for OAuth2 popup postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "oauth2-success") {
        popupRef.current?.close();
        popupRef.current = null;
        setInfoMessage("Slack connected successfully.");
        refetch();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch]);

  const handleConnect = useCallback(() => {
    setInfoMessage(null);
    const url = buildAuthorizeUrl(PROVIDER);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    popupRef.current = window.open(
      url,
      "oauth2-popup",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
  }, []);

  const handleDisconnect = useCallback(() => {
    setInfoMessage(null);
    disconnect.mutate(undefined, {
      onSuccess: () => setInfoMessage("Slack disconnected."),
    });
  }, [disconnect]);

  const handleSend = useCallback(() => {
    setInfoMessage(null);
    const payload = messageText.trim()
      ? { channel: "slack" as const, text: messageText.trim() }
      : { channel: "slack" as const };
    sendNotif.mutate(payload, {
      onSuccess: () => {
        setInfoMessage("Test message sent to your Slack DM.");
        setMessageText("");
      },
    });
  }, [messageText, sendNotif]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading connection status...
          </Typography>
        </Box>
      </Box>
    );
  }

  const isConnected = status?.connected === true;
  const errorMessage =
    disconnect.error?.message ?? sendNotif.error?.message ?? null;

  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <PageHeader title="Slack Notifications" backHref="/" />

      {infoMessage && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setInfoMessage(null)}>
          {infoMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <FormSection title="Connection">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <ChatIcon sx={{ color: "text.secondary" }} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            Slack
          </Typography>
          <StatusPill
            tone={isConnected ? "success" : "neutral"}
            label={isConnected ? "Connected" : "Disconnected"}
          />
        </Box>

        {isConnected && status?.email && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 2, display: "block" }}
          >
            Account: {status.email}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          {!isConnected ? (
            <Button
              variant="contained"
              size="small"
              onClick={handleConnect}
              disabled={disconnect.isPending}
            >
              Connect Slack
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? "Disconnecting..." : "Disconnect"}
            </Button>
          )}
        </Box>
      </FormSection>

      <FormSection title="Send Test Message">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send a message to your own Slack DM. Leave the field empty to send
          the default test notification.
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          placeholder="Optional custom message text..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={!isConnected || sendNotif.isPending}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!isConnected || sendNotif.isPending}
        >
          {sendNotif.isPending ? "Sending..." : "Send Test Message"}
        </Button>
      </FormSection>
    </Box>
  );
}
