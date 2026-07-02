// ─── Orca host API types ──────────────────────────────────────────────────────

export interface Response<T> {
  success: true;
  data: T;
}

export type ListResponse<T> = Response<{ items: T[]; pageKey?: string }>;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ResponseError {
  response?: { code?: string; errors?: ValidationError[] };
}

export interface Pageable {
  pageKey?: string;
  size?: number | "all";
}

// ─── OrcaAgents DB types ──────────────────────────────────────────────────────

export type DocData = Record<string, unknown>;

// ─── OrcaAgents Auth types ────────────────────────────────────────────────────

export interface UserInfo {
  workspaceId: string;
  email: string;
  subject: string;
}

// ─── OrcaAgents Workflow types ────────────────────────────────────────────────

export interface WorkflowAttachment {
  filename: string;
  contentType: string;
  data: string; // base64-encoded
  inline?: boolean;
}

export interface WorkflowSendEmailRequest {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: WorkflowAttachment[];
}

export interface WorkflowSendEmailResponse {
  sent: boolean;
  messageId: string;
}

// ─── OrcaAgents Approval types ────────────────────────────────────────────────

export type ApprovalStatus = "FUTURE" | "PENDING" | "COMPLETED" | "CANCELLED";
export type ApprovalDecision = "UNDECIDED" | "APPROVED" | "REJECTED";

export interface ApprovalInstance {
  instanceId: number;
  workspaceId: string;
  definitionId?: number;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  currentPhaseId?: number;
  createdBy: string;
  created: string; // ISO 8601
  updated: string;
}

export interface ApprovalApprover {
  approverId: number;
  instanceId: number;
  phaseId: number;
  userId: string;
  status: ApprovalStatus;
  decision: ApprovalDecision;
  decisionTime?: string;
  decisionTakenBy?: string;
}

export interface ApprovalPhase {
  phaseId: number;
  instanceId: number;
  previousPhaseId?: number;
  minRequiredApprovers: number;
  status: ApprovalStatus;
  startTime?: string;
  endTime?: string;
  approvers: ApprovalApprover[];
}

export interface ApprovalDecisionResult {
  instance: ApprovalInstance;
  phases: ApprovalPhase[];
}

export interface ApprovalProcessSpec {
  definitionId?: number;
  createdBy: string;
  phases: {
    approvers: string[];
    minRequiredApprovers: number;
  }[];
}

export interface ApprovalUserDef {
  description?: string;
  conditionSrc?: string;
  userId: string;
}

export interface ApprovalPhaseDef {
  type: "manual" | "dynamic";
  description?: string;
  conditionSrc?: string;
  minRequiredApprovers: number;
  approvers?: ApprovalUserDef[];
  variant?: string;
  data?: unknown;
}

export interface ApprovalFallbackStrategy {
  type: "approve" | "reject" | "manual";
  phases?: ApprovalPhaseDef[];
}

export interface ApprovalBlueprint {
  description?: string;
  conditionSrc?: string;
  phases: ApprovalPhaseDef[];
  fallbackStrategy: ApprovalFallbackStrategy;
}

export interface ApprovalDefinition {
  definitionId: number;
  workspaceId: string;
  name: string;
  description: string;
  blueprint: ApprovalBlueprint;
  created: string;
  updated: string;
}
