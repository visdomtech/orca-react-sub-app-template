# Approval Engine Service

> Multi-phase human-approval workflows, definitions, approver management, and item attachments.

**Route prefix:** `/orcaagents/approval`
**Handler:** `handler/web/approval_handler.go`
**Auth required:** Yes

> **Prerequisites:** All examples use the shared [`orcaFetch`](../SKILL.md#fetch-wrapper-orcafetch) wrapper and [`headers()`](../SKILL.md#fetch-wrapper-orcafetch) helper from the [root skill](../SKILL.md). Import or define them once before using any endpoint below.

---

## Endpoints

### Processes

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/approval/processes` | `createProcess` | Create an approval process with phases |
| `GET` | `/orcaagents/approval/processes/{id}` | `getProcess` | Get process + phases |
| `POST` | `/orcaagents/approval/processes/{id}/start` | `startProcess` | Start process (FUTURE → PENDING) |
| `POST` | `/orcaagents/approval/processes/{id}/cancel` | `cancelProcess` | Cancel a process |

### Approver Management

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/approval/processes/{id}/phases/{phaseId}/approvers` | `addApprover` | Add approver to a phase |
| `DELETE` | `/orcaagents/approval/processes/{id}/approvers/{approverId}` | `removeApprover` | Remove an approver |
| `PATCH` | `/orcaagents/approval/processes/{id}/phases/{phaseId}` | `changeRequired` | Change min required approvers for a phase |

### Decisions

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/approval/approvers/{id}/approve` | `approve` | Record approval decision |
| `POST` | `/orcaagents/approval/approvers/{id}/reject` | `reject` | Record rejection decision |

### Items (link processes to business objects)

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/approval/items` | `attachApproval` | Attach process to a business object |
| `GET` | `/orcaagents/approval/items?type=X&id=Y` | `getApprovalForObject` | Get process attached to an object |

### Definitions (reusable blueprints)

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `POST` | `/orcaagents/approval/definitions` | `createDefinition` | Create an approval blueprint |
| `GET` | `/orcaagents/approval/definitions` | `listDefinitions` | List all definitions |
| `GET` | `/orcaagents/approval/definitions/{id}` | `getDefinition` | Get a definition |
| `PUT` | `/orcaagents/approval/definitions/{id}` | `updateDefinition` | Update a definition |
| `DELETE` | `/orcaagents/approval/definitions/{id}` | `deleteDefinition` | Delete a definition |
| `POST` | `/orcaagents/approval/definitions/evaluate` | `evaluateDefinitions` | Evaluate definitions to produce a process spec |

---

## Key Concepts

- **Process**: An instance of an approval workflow with ordered phases
- **Phase**: A step with approvers and a minimum required approval count
- **Approver**: A user assigned to approve/reject in a phase
- **Item**: Links a process to a business object (`objectType` + `objectId`)
- **Definition**: A reusable blueprint describing phase structure with optional Yaegi conditions

### Process Lifecycle

```
FUTURE → PENDING → COMPLETED
                 → CANCELLED
```

---

## TypeScript Types

```ts
type ApprovalStatus = "FUTURE" | "PENDING" | "COMPLETED" | "CANCELLED";
type ApprovalDecision = "UNDECIDED" | "APPROVED" | "REJECTED";

interface ApprovalInstance {
  instanceId: number;
  workspaceId: string;
  definitionId?: number;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  currentPhaseId?: number;
  createdBy: string;
  created: string;
  updated: string;
}

interface ApprovalPhase {
  phaseId: number;
  instanceId: number;
  previousPhaseId?: number;
  minRequiredApprovers: number;
  status: ApprovalStatus;
  approvers: ApprovalApprover[];
}

interface ApprovalApprover {
  approverId: number;
  instanceId: number;
  phaseId: number;
  userId: string;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  decisionTime?: string;
}

interface ApprovalDecisionResult {
  instance: ApprovalInstance;
  phases: ApprovalPhase[];
}
```

---

## TypeScript Examples

### Create and Start a Process

```ts
async function createApprovalProcess(phases: {
  approvers: string[];
  minRequiredApprovers: number;
}[]): Promise<{ instanceId: number }> {
  const res = await fetch("/orcaagents/approval/processes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phases }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function startProcess(id: number): Promise<void> {
  const res = await fetch(`/orcaagents/approval/processes/${id}/start`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
}
```

### Approve / Reject

```ts
async function approve(approverId: number): Promise<ApprovalDecisionResult> {
  const res = await fetch(`/orcaagents/approval/approvers/${approverId}/approve`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```

---

## Error Scenarios

| Status | Condition |
|--------|-----------|
| `400` | Malformed request, invalid phase config |
| `401` | Not authenticated |
| `404` | Process/approver/definition not found |
| `409` | Invalid state transition (e.g., approving a cancelled process) |
