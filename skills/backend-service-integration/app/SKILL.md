---
name: app-service-integration
description: "Integrate with the Orca App & Agent Execution API (`/orcaagents/app`). Operations: listAgents, listAppSessions, setSessionFriendlyId, runAgent."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant, SSE streaming)"
---

# App & Agent Execution Service Integration Guide

The **App Service** provides the entrypoint for inspecting registered AI agents, retrieving conversation sessions, assigning session aliases, and executing single-turn / multi-turn agent workflows with real-time Server-Sent Events (SSE) streaming.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/app`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/app`
- **Auth & RBAC**: Requires valid JWT token for all endpoints. User identity (`claims.Email`) is automatically scoped for session ownership.
- **Key Responsibilities**:
  - Listing all registered agents with their expected output keys and JSON schemas
  - Listing and managing persistent conversation sessions in Firestore
  - Executing conversational and graph workflows via `POST /run` with chunked SSE streaming

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/app/agents` | `listAgents` | `void` | `AgentInfoResponse[]` | Returns metadata for all registered agents, including name, output key, and schema |
| `GET` | `/orcaagents/app/sessions/{app_name}` | `listAppSessions` | `ListAppSessionsInput` | `Session[]` | Returns all sessions belonging to the specified application/agent name |
| `PATCH` | `/orcaagents/app/session/friendly-id` | `setSessionFriendlyId` | `SetFriendlyIdRequest` | `OkResponse` | Sets or updates a human-friendly identifier (alias) for a session |
| `POST` | `/orcaagents/app/run` | `runAgent` | `AppRunRequest` | `AsyncIterable<SSEEvent>` | Executes an agent run with Server-Sent Events (SSE) streaming output |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface AgentInfoResponse {
  name: string;
  output_key?: string;
  schema?: Record<string, any>;
}

export interface Session {
  id: string;
  appName: string;
  userId: string;
  friendlyId?: string;
  state?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetFriendlyIdRequest {
  appName: string;
  sessionID: string;
  friendlyID: string;
}

export interface AppRunRequest {
  agentName: string;
  message: string;
  sessionID?: string; // If omitted, a new UUID session is created automatically
}

export interface AgentEvent {
  author?: string;
  content?: {
    parts?: Array<{
      text?: string;
      thought?: boolean;
    }>;
  };
  actions?: Array<{
    name: string;
    params?: Record<string, any>;
    result?: Record<string, any>;
  }>;
  customData?: Record<string, any>;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch, orcaEventStream } from '../common';

export const appClient = {
  /**
   * List all available agents registered in the engine.
   */
  async listAgents(): Promise<AgentInfoResponse[]> {
    return orcaFetch<AgentInfoResponse[]>('/orcaagents/app/agents', {
      method: 'GET',
    });
  },

  /**
   * List past conversation sessions for a given agent/app.
   */
  async listSessions(appName: string): Promise<Session[]> {
    return orcaFetch<Session[]>(`/orcaagents/app/sessions/${encodeURIComponent(appName)}`, {
      method: 'GET',
    });
  },

  /**
   * Assign a friendly alias to a session.
   */
  async setSessionFriendlyId(req: SetFriendlyIdRequest): Promise<{ status: string }> {
    return orcaFetch<{ status: string }>('/orcaagents/app/session/friendly-id', {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  },

  /**
   * Run an agent workflow and stream events in real time via SSE.
   */
  runAgentStream(req: AppRunRequest, signal?: AbortSignal): AsyncIterable<AgentEvent> {
    return orcaEventStream<AgentEvent>('/orcaagents/app/run', req, signal);
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Interactive Chat Session with Real-Time Streaming
```typescript
import { appClient, AgentEvent } from './appClient';

async function chatWithAgent(agentName: string, prompt: string, sessionId?: string) {
  const stream = appClient.runAgentStream({
    agentName,
    message: prompt,
    sessionId,
  });

  let fullResponse = '';

  for await (const event of stream) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          process.stdout.write(part.text);
          fullResponse += part.text;
        }
      }
    }
  }

  console.log('\n[Stream Complete]');
  return fullResponse;
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Auto-Created Sessions**: If `sessionId` is omitted from `AppRunRequest`, the server generates a new UUID v4 and creates the session automatically. To resume conversations, store and pass the `sessionId`.
2. **Pre-Check 404 on Missing Resumed Sessions**: When passing an existing `sessionId`, if it does not exist in Firestore, the endpoint returns a `404 Not Found` JSON error *before* committing the SSE `text/event-stream` headers.
3. **SSE Terminal Event**: The event stream ends with `data: [DONE]\n\n`. The `orcaEventStream` helper handles this automatically and terminates the async generator.
4. **State Variable Scoping**: Agent state variables with `temp:` prefix are memory scratchpads during execution and are stripped before saving to Firestore.
