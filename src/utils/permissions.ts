import type { AuthUser } from '../types/auth';

export type PermissionKey = keyof AuthUser['permissions'];

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canCreateRequest: 'creating a lab test request',
  canAssignOrNumber: 'assigning an official receipt number',
  canViewSamples: 'specimen tracking',
  canPrintLabels: 'printing specimen labels',
  canPrintResults: 'printing results',
  canAccessionSamples: 'receiving a specimen',
  canEnterResults: 'result entry',
  canReleaseCoA: 'releasing a result',
  canModifyProtocols: 'catalog and template changes',
  canManageInstruments: 'instrument management',
  canReviewAuditLogs: 'the audit trail',
  canSignOffCriticals: 'critical value sign-off',
};

export function hasPermission(user: AuthUser | null | undefined, key: PermissionKey): boolean {
  return Boolean(user?.permissions?.[key]);
}

export function permissionDeniedMessage(user: AuthUser | null | undefined, key: PermissionKey): string {
  const action = PERMISSION_LABELS[key];
  const role = user?.role || 'your role';
  return `${role} cannot use ${action}. Ask an administrator if this desk needs that screen.`;
}
