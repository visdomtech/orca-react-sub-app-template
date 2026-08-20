---
name: approval-service-integration
description: "Integrate with the Orca Multi-Phase Approval Workflow Engine (`/orcaagents/approval`). Operations: createProcess, getProcess, startProcess, cancelProcess, addPhaseApprover, updatePhaseThreshold, removeApprover, approveStep, rejectStep, createItem, listItems, getObjectFields, evaluateDefinition, createDefinition, listDefinitions, getDefinition, updateDefinition, deleteDefinition."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Approval Engine Integration Guide

The **Approval Engine** provides generic multi-phase approval workflows for any business object (policies, requisitions, HR AI evaluations, headcount changes). It supports conditional rule evaluation via Yaegi scripts, dynamic approvers, and runtime threshold mutations on in-flight processes.

---

## 1. Endpoint Reference Table

| Method | Path | Operation ID | Request Body | Response | Status | Description |
|---|---|---|---|---|---|---|
| `POST` | `/orcaagents/approval/processes` | `createProcess` | `CreateProcessRequest` | `CreateProcessResponse` | 201 | Initializes a new multi-phase approval workflow instance |
| `GET` | `/orcaagents/approval/processes/{id}` | `getProcess` | — | `GetProcessResponse` | 200 | Returns instance + phases with approvers |
| `POST` | `/orcaagents/approval/processes/{id}/start` | `startProcess` | — | — | 204 | Starts process, notifies phase 1 approvers |
| `POST` | `/orcaagents/approval/processes/{id}/cancel` | `cancelProcess` | — | — | 204 | Cancels an in-flight approval process |
| `POST` | `/orcaagents/approval/processes/{id}/phases/{phaseId}/approvers` | `addPhaseApprover` | `AddApproverRequest` | `AddApproverResponse` | 201 | Dynamically adds an approver to a phase |
| `PATCH` | `/orcaagents/approval/processes/{id}/phases/{phaseId}` | `updatePhaseThreshold` | `UpdateThresholdRequest` | — | 204 | Updates minimum required approvers for a phase |
| `DELETE` | `/orcaagents/approval/processes/{id}/approvers/{approverId}` | `removeApprover` | — | — | 204 | Removes an approver from a phase |
| `POST` | `/orcaagents/approval/approvers/{id}/approve` | `approveStep` | — | `DecisionResult` | 200 | Records approval; advances phase if threshold met |
| `POST` | `/orcaagents/approval/approvers/{id}/reject` | `rejectStep` | — | `DecisionResult` | 200 | Records rejection; immediately rejects the process |
| `POST` | `/orcaagents/approval/items` | `createItem` | `AttachApprovalRequest` | `AttachApprovalResponse` | 201 | Registers an item-to-process link |
| `GET` | `/orcaagents/approval/items` | `listItems` | — | `ApprovalItem[]` or `GetProcessResponse` | 200 | Lists items by `objectTypes` or single-object by `type`+`id` |
| `GET` | `/orcaagents/approval/object-fields` | `getObjectFields` | — | `ObjectFieldsResponse` | 200 | Returns condition fields for a given object type |
| `POST` | `/orcaagents/approval/definitions/evaluate` | `evaluateDefinition` | `EvaluateRequest` | `ProcessSpec` | 200 | Evaluates definitions against input, returns process spec |
| `POST` | `/orcaagents/approval/definitions` | `createDefinition` | `CreateDefinitionRequest` | `CreateDefinitionResponse` | 201 | Creates a new approval definition |
| `GET` | `/orcaagents/approval/definitions` | `listDefinitions` | — | `Definition[]` | 200 | Lists all definitions in workspace |
| `GET` | `/orcaagents/approval/definitions/{id}` | `getDefinition` | — | `Definition` | 200 | Gets a specific approval definition |
| `PUT` | `/orcaagents/approval/definitions/{id}` | `updateDefinition` | `CreateDefinitionRequest` | `Definition` | 200 | Updates an approval definition, returns updated definition |
| `DELETE` | `/orcaagents/approval/definitions/{id}` | `deleteDefinition` | — | — | 204 | Deletes an approval definition |

---

## 2. Architecture

- **Route Prefix**: `/orcaagents/approval`
- **Auth & RBAC**: Requires valid JWT for all endpoints. Workspace scoping is enforced per tenant.
- **Services**: `approval.Service` (process lifecycle, definitions, evaluation), `audit.Service`
- **Key Concepts**:
  - **Definition**: A named blueprint with Yaegi condition scripts for automated approver assignment
  - **Process**: A runtime instance with sequential phases, each containing approver seats and a quorum threshold
  - **Blueprint Evaluation**: Yaegi-based condition scripts evaluate an `EvaluationInput` (flat `map[string]string`) against definition blueprints to dynamically produce phases and approvers
  - **Phase Advance**: When approvals for a phase reach `minRequiredApprovers`, the engine auto-advances to the next phase
  - **Rejection is Terminal**: Any `rejectStep` immediately rejects the entire process

---

## 3. TypeScript Interfaces & Enums

```typescript
// Status enum for instances, phases, and approvers
export type ApprovalStatus = 'FUTURE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

// Decision enum for approver seats and instances
export type ApproverDecision = 'UNDECIDED' | 'APPROVED' | 'REJECTED';

export interface CreateProcessPhase {
  approvers: string[];       // array of user IDs
  minRequiredApprovers: number;
}

export interface CreateProcessRequest {
  phases: CreateProcessPhase[];
}

export interface CreateProcessResponse {
  instanceId: number;
}

export interface ProcessInstance {
  instanceId: number;
  workspaceId: string;
  definitionId?: number;
  status: ApprovalStatus;
  decision: ApproverDecision;
  currentPhaseId?: number;
  createdBy: string;
  created: string;   // ISO-8601
  updated: string;   // ISO-8601
}

export interface Phase {
  phaseId: number;
  instanceId: number;
  previousPhaseId?: number;
  minRequiredApprovers: number;
  status: ApprovalStatus;
  startTime?: string;  // ISO-8601
  endTime?: string;    // ISO-8601
  approvers: Approver[];
}

export interface Approver {
  approverId: number;
  instanceId: number;
  phaseId: number;
  userId: string;
  status: ApprovalStatus;
  decision: ApproverDecision;
  decisionTime?: string;      // ISO-8601
  decisionTakenBy?: string;
}

export interface GetProcessResponse {
  instance: ProcessInstance;
  phases: Phase[];
}

export interface DecisionResult {
  instanceStatus: ApprovalStatus;
  newPhase: boolean;
  completed: boolean;
}

export interface AddApproverRequest {
  userId: string;
}

export interface AddApproverResponse {
  approverId: number;
}

export interface UpdateThresholdRequest {
  minRequiredApprovers: number;
}

export interface AttachApprovalRequest {
  objectType: string;
  objectId: string;
  instanceId: number;
}

export interface AttachApprovalResponse {
  itemId: number;
}

export interface ApprovalItem {
  itemId: number;
  workspaceId: string;
  objectType: string;
  objectId: string;
  instanceId: number;
}

export interface ObjectField {
  name: string;
  label: string;
}

export interface ObjectFieldsResponse {
  fields: ObjectField[];
}

// Blueprint types (stored as JSONB in definitions)
export interface UserDef {
  description?: string;
  condition_src?: string;
  user_id: string;
}

export interface PhaseDef {
  type?: string;                    // "manual" or "dynamic"
  description?: string;
  condition_src?: string;
  min_required_approvers?: number;
  approvers?: UserDef[];
  variant?: string;
  data?: any;
}

export interface FallbackStrategy {
  type?: 'approve' | 'reject' | 'manual';
  phases?: PhaseDef[];
}

export interface Blueprint {
  description?: string;
  condition_src?: string;
  phases?: PhaseDef[];
  fallback_strategy?: FallbackStrategy;
}

export interface Definition {
  definitionId: number;
  workspaceId: string;
  name: string;
  description: string;
  blueprint: Blueprint;
  created: string;   // ISO-8601
  updated: string;   // ISO-8601
}

export interface CreateDefinitionRequest {
  name: string;
  description: string;
  blueprint: Blueprint;
}

export interface CreateDefinitionResponse {
  definition_id: number;
}

// EvaluationInput is a flat property map: Record<string, string>
export interface EvaluateRequest {
  definitions: number[];           // definition IDs to evaluate
  input: Record<string, string>;   // flat property map for Yaegi conditions
}

export interface ProcessSpec {
  definitionId?: number;
  createdBy: string;
  phases: PhaseSpec[];
}

export interface PhaseSpec {
  approvers: string[];
  minRequiredApprovers: number;
}
```

---

## 4. Client Functions

```typescript
import { orcaFetch } from '../common';

export const approvalClient = {
  /** Create a new approval process with specified sequential phases. Returns 201. */
  async createProcess(req: CreateProcessRequest): Promise<CreateProcessResponse> {
    return orcaFetch<CreateProcessResponse>('/orcaagents/approval/processes', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** Get full process status including all phases and approvers. */
  async getProcess(processId: number): Promise<GetProcessResponse> {
    return orcaFetch<GetProcessResponse>(`/orcaagents/approval/processes/${processId}`, {
      method: 'GET',
    });
  },

  /** Start an approval process (notifies phase 1 approvers). Returns 204. */
  async startProcess(processId: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/approval/processes/${processId}/start`, {
      method: 'POST',
    });
  },

  /** Cancel an in-flight approval process. Returns 204. */
  async cancelProcess(processId: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/approval/processes/${processId}/cancel`, {
      method: 'POST',
    });
  },

  /** Add an approver to a specific phase. Returns 201. */
  async addPhaseApprover(processId: number, phaseId: number, userId: string): Promise<AddApproverResponse> {
    return orcaFetch<AddApproverResponse>(
      `/orcaagents/approval/processes/${processId}/phases/${phaseId}/approvers`,
      { method: 'POST', body: JSON.stringify({ userId }) },
    );
  },

  /** Update the minimum required approvers for a phase. Returns 204. */
  async updatePhaseThreshold(processId: number, phaseId: number, minRequiredApprovers: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/approval/processes/${processId}/phases/${phaseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ minRequiredApprovers }),
    });
  },

  /** Remove an approver from a process. Returns 204. */
  async removeApprover(processId: number, approverId: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/approval/processes/${processId}/approvers/${approverId}`, {
      method: 'DELETE',
    });
  },

  /** Record approval for an approver seat. Returns DecisionResult. */
  async approveStep(approverId: number): Promise<DecisionResult> {
    return orcaFetch<DecisionResult>(`/orcaagents/approval/approvers/${approverId}/approve`, {
      method: 'POST',
    });
  },

  /** Record rejection (immediately rejects the entire process). Returns DecisionResult. */
  async rejectStep(approverId: number): Promise<DecisionResult> {
    return orcaFetch<DecisionResult>(`/orcaagents/approval/approvers/${approverId}/reject`, {
      method: 'POST',
    });
  },

  /** Attach an approval process instance to a business entity. Returns 201. */
  async createItem(req: AttachApprovalRequest): Promise<AttachApprovalResponse> {
    return orcaFetch<AttachApprovalResponse>('/orcaagents/approval/items', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** List items by object types (comma-separated). Returns ApprovalItem[]. */
  async listItemsByObjectTypes(objectTypes: string, status?: string): Promise<ApprovalItem[]> {
    const params = new URLSearchParams({ objectTypes });
    if (status) params.set('status', status);
    return orcaFetch<ApprovalItem[]>(`/orcaagents/approval/items?${params.toString()}`, {
      method: 'GET',
    });
  },

  /** Get process for a single object. Returns GetProcessResponse. */
  async getProcessForObject(type: string, objectId: string): Promise<GetProcessResponse> {
    const params = new URLSearchParams({ type, id: objectId });
    return orcaFetch<GetProcessResponse>(`/orcaagents/approval/items?${params.toString()}`, {
      method: 'GET',
    });
  },

  /** Evaluate definitions against input to produce a ProcessSpec. */
  async evaluateDefinition(definitionIds: number[], input: Record<string, string>): Promise<ProcessSpec> {
    return orcaFetch<ProcessSpec>('/orcaagents/approval/definitions/evaluate', {
      method: 'POST',
      body: JSON.stringify({ definitions: definitionIds, input }),
    });
  },

  /** Create a new approval definition. Returns 201. */
  async createDefinition(req: CreateDefinitionRequest): Promise<CreateDefinitionResponse> {
    return orcaFetch<CreateDefinitionResponse>('/orcaagents/approval/definitions', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** List all definitions in workspace. */
  async listDefinitions(): Promise<Definition[]> {
    return orcaFetch<Definition[]>('/orcaagents/approval/definitions', { method: 'GET' });
  },

  /** Get a specific definition by ID. */
  async getDefinition(id: number): Promise<Definition> {
    return orcaFetch<Definition>(`/orcaagents/approval/definitions/${id}`, { method: 'GET' });
  },

  /** Update a definition. Returns the updated Definition. */
  async updateDefinition(id: number, req: CreateDefinitionRequest): Promise<Definition> {
    return orcaFetch<Definition>(`/orcaagents/approval/definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  /** Delete a definition. Returns 204. */
  async deleteDefinition(id: number): Promise<void> {
    return orcaFetch<void>(`/orcaagents/approval/definitions/${id}`, { method: 'DELETE' });
  },
};
```

---

## 5. Query & Path Parameters

| Operation | Path Params | Query Params | Notes |
|---|---|---|---|
| `getProcess` | `{id}` (int64, instance ID) | — | — |
| `startProcess` / `cancelProcess` | `{id}` (int64) | — | Returns 204 No Content |
| `addPhaseApprover` | `{id}` (int64), `{phaseId}` (int64) | — | Body: `{ userId: string }` |
| `updatePhaseThreshold` | `{id}` (int64), `{phaseId}` (int64) | — | Body: `{ minRequiredApprovers: number }` |
| `removeApprover` | `{id}` (int64), `{approverId}` (int64) | — | Returns 204 |
| `approveStep` / `rejectStep` | `{id}` (int64, approver ID) | — | Returns `DecisionResult` |
| `listItems` | — | `objectTypes` (comma-sep), `status` (default `PENDING`), `type`, `id` | List mode: `objectTypes` required → returns `ApprovalItem[]`. Single-object mode: `type`+`id` required → returns `GetProcessResponse` |
| `getObjectFields` | — | `type` (required) | e.g. `hr_evaluation`, `hr_vendor`, `hr_artifact` |
| `getDefinition` / `updateDefinition` / `deleteDefinition` | `{id}` (int64, definition ID) | — | — |

---

## 6. SSE / Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| Scenario | HTTP Status | Details |
|---|---|---|
| Unauthenticated | 401 | Missing or invalid JWT |
| Process/definition not found | 404 | `ErrNotFound` |
| Duplicate item | 409 | `ErrDuplicateItem` — object already has an approval item |
| Invalid state transition | 409 | `ErrInvalidState` — e.g. starting an already-started process |
| Missing required fields | 400 | `userId required`, `name required`, `type and id query params required` |
| evaluateDefinition with empty definitions | 400 | `definitions required` |
| getObjectFields with unknown type | 404 | `unknown object type` |
