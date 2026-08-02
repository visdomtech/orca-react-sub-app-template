import { createContext, useContext, type ComponentType } from "react";

export interface ApprovalPhaseSpec {
  approvers: string[];
  minRequiredApprovers: number;
  conditions?: string;
  description?: string;
}

export interface ApprovalFlowProps {
  objectType: string;
  objectId: string;
  definitionId?: number;
  phases?: ApprovalPhaseSpec[];
  currentUserId?: string;
  onApproved?: () => void;
  onRejected?: () => void;
  adminMode?: boolean;
  displayMode?: "full" | "compact";
}

export interface OrcaHostComponents {
  ApprovalFlow?: ComponentType<ApprovalFlowProps>;
}

const OrcaHostContext = createContext<OrcaHostComponents>({});

export const OrcaHostProvider = OrcaHostContext.Provider;

export function useOrcaHost(): OrcaHostComponents {
  return useContext(OrcaHostContext);
}
