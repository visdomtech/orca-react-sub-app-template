# Agent Runtime (App) Service

> Run registered agents with SSE streaming, list agents and sessions.

**Route prefix:** `/orcaagents/app`
**Handler:** `handler/web/app_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/orcaagents/app/agents` | `listAgents` | List all registered agents (name, output key, schema) |
| `GET` | `/orcaagents/app/sessions/{app_name}` | `listAppSessions` | List sessions for an app |
| `PATCH` | `/orcaagents/app/session/friendly-id` | `setSessionFriendlyId` | Set human-friendly alias for a session |
| `POST` | `/orcaagents/app/run` | `runAppAgent` | Run an agent with SSE streaming response |

---

## Run Agent (SSE Streaming)

The core endpoint. Sends a message to a registered agent and streams back Server-Sent Events.

```http
POST /orcaagents/app/run
Content-Type: application/json

{
  "agentName": "rag-coordinator",
  "message": "What are the compliance requirements for GDPR?",
  "sessionID": "optional-existing-session-id"
}
```

### Request

```ts
interface AppRunRequest {
  agentName: string;  // required — registered agent name
  message: string;    // required — user message
  sessionID?: string; // optional — omit to auto-create
}
```

### SSE Response Format

```
Content-Type: text/event-stream

data: {"content":{...}}

data: {"content":{...}}

event: error
data: {"error":"agent error message"}

data: [DONE]
```

### TypeScript

```ts
async function runAgent(
  agentName: string,
  message: string,
  sessionID?: string
): AsyncGenerator<any> {
  const res = await orcaFetch("/orcaagents/app/run", {
    method: "POST",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify({ agentName, message, sessionID }),
  });
  if (!res.ok) throw new Error((await res.json()).error);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        yield JSON.parse(data);
      }
    }
  }
}
```

## List Agents

```ts
interface AgentInfo {
  name: string;
  outputKey: string;
  schema: unknown;
}

async function listAgents(): Promise<AgentInfo[]> {
  const res = await orcaFetch("/orcaagents/app/agents", {
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

## Set Session Friendly ID

```ts
interface SetFriendlyIdRequest {
  appName: string;
  sessionID: string;
  friendlyID: string;
}

async function setFriendlyId(req: SetFriendlyIdRequest): Promise<void> {
  const res = await orcaFetch("/orcaagents/app/session/friendly-id", {
    method: "PATCH",
    headers: headers(),
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Missing `agentName` or `message` |
| `401` | Not authenticated |
| `404` | Agent not found, or session not found when resuming |
