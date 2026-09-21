export type ApprovalAction =
  | 'vault:write'
  | 'syndication:publish'
  | 'admin:override';

export interface Approval {
  readonly action: ApprovalAction;
  readonly approvedBy: string;
  readonly approvedAt: string;
}

export class ApprovalRequiredError extends Error {
  public readonly code = 'APPROVAL_REQUIRED' as const;
}

export const assertApproved = (action: ApprovalAction, approvals: readonly Approval[]): void => {
  const found = approvals.some((approval) => approval.action === action);
  if (!found) {
    throw new ApprovalRequiredError(`Missing required approval for action: ${action}`);
  }
};

