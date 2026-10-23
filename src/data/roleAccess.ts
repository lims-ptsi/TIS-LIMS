import type { AuthUser, UserRoleType } from '../types/auth';

export type AppRole = 'STAFF' | 'CASHIER' | 'LAB_STAFF' | 'ADMIN';

export const APP_ROLES: {
  id: AppRole;
  label: string;
  description: string;
}[] = [
  {
    id: 'STAFF',
    label: 'Staff',
    description: 'Information desk. Create a lab test request, and correct it before the cashier or the laboratory takes it.',
  },
  {
    id: 'CASHIER',
    label: 'Cashier',
    description: 'Payment desk for OPD. Assign the official receipt. Other categories go to the laboratory.',
  },
  {
    id: 'LAB_STAFF',
    label: 'Staff - Lab',
    description: 'Receive specimens, enter results, and print labels and result forms.',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    description: 'Full access to every screen.',
  },
];

export function isAppRole(value: string | undefined | null): value is AppRole {
  return value === 'STAFF' || value === 'CASHIER' || value === 'LAB_STAFF' || value === 'ADMIN';
}

export function roleLabel(role: string | undefined): string {
  return APP_ROLES.find((item) => item.id === role)?.label || 'Staff';
}

type Permissions = AuthUser['permissions'];

const NONE: Permissions = {
  canCreateRequest: false,
  canAssignOrNumber: false,
  canViewSamples: false,
  canPrintLabels: false,
  canPrintResults: false,
  canAccessionSamples: false,
  canEnterResults: false,
  canReleaseCoA: false,
  canModifyProtocols: false,
  canManageInstruments: false,
  canReviewAuditLogs: false,
  canSignOffCriticals: false,
};

export function permissionsForRole(role: AppRole): Permissions {
  if (role === 'ADMIN') {
    return {
      canCreateRequest: true,
      canAssignOrNumber: true,
      canViewSamples: true,
      canPrintLabels: true,
      canPrintResults: true,
      canAccessionSamples: true,
      canEnterResults: true,
      canReleaseCoA: true,
      canModifyProtocols: true,
      canManageInstruments: true,
      canReviewAuditLogs: true,
      canSignOffCriticals: true,
    };
  }
  if (role === 'LAB_STAFF') {
    return {
      ...NONE,
      canCreateRequest: true,
      canViewSamples: true,
      canPrintLabels: true,
      canPrintResults: true,
      canAccessionSamples: true,
      canEnterResults: true,
      canReleaseCoA: true,
    };
  }
  if (role === 'CASHIER') {
    return { ...NONE, canAssignOrNumber: true };
  }
  return { ...NONE, canCreateRequest: true };
}

export interface NavTab {
  id: string;
  label: string;
}

const NAV: { id: string; label: string; roles: AppRole[] }[] = [
  { id: 'home', label: 'Home', roles: ['STAFF', 'CASHIER', 'LAB_STAFF', 'ADMIN'] },
  { id: 'create-request', label: 'Create Lab Test Request', roles: ['STAFF', 'LAB_STAFF', 'ADMIN'] },
  { id: 'lab-requests', label: 'Request queue', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'testing-queue', label: 'Testing queue', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'all-requests', label: 'All requests', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'analytics-reports', label: 'Analytics & reports', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'payments', label: 'Payments', roles: ['CASHIER', 'ADMIN'] },
  { id: 'samples', label: 'Samples', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'patient-records', label: 'Patients', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'result-forms', label: 'Result Forms', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'coa-reports', label: 'Results', roles: ['LAB_STAFF', 'ADMIN'] },
  { id: 'examinations', label: 'Examinations', roles: ['ADMIN'] },
  { id: 'result-templates', label: 'Result Templates', roles: ['ADMIN'] },
  { id: 'audit-trail', label: 'Audit Trail', roles: ['ADMIN'] },
];

export function tabsForRole(role: UserRoleType | string | undefined): NavTab[] {
  if (!isAppRole(role)) return [];
  return NAV.filter((tab) => tab.roles.includes(role)).map(({ id, label }) => ({ id, label }));
}

export function defaultTabForRole(_role: UserRoleType | string | undefined): string {
  return 'home';
}

export function canOpenTab(role: UserRoleType | string | undefined, tab: string): boolean {
  if (!isAppRole(role)) return false;
  if (tab === 'sample-detail' || tab === 'boxes') return permissionsForRole(role).canViewSamples === true;
  if (tabsForRole(role).some((item) => item.id === tab)) return true;
  if ((role === 'ADMIN' || role === 'LAB_STAFF') && tab === 'submissions') return true;
  if (role === 'ADMIN' || role === 'LAB_STAFF') {
    return [
      'batches',
      'projects',
      'plates',
      'libraries',
      'boxes',
      'protocols',
      'qc-analytics',
      'inventory',
      'instruments',
    ].includes(tab);
  }
  return false;
}

const GRADIENTS = ['from-sky-600 to-blue-700', 'from-emerald-600 to-teal-700', 'from-amber-600 to-orange-700', 'from-violet-600 to-indigo-700'];

export function buildAccountUser(input: {
  name: string;
  username: string;
  role: AppRole;
}): AuthUser {
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || username.slice(0, 2).toUpperCase();
  const role = input.role;
  return {
    id: `usr-${username}`,
    name,
    title: roleLabel(role),
    email: `${username}@ptsi.lab`,
    username,
    role: roleLabel(role),
    roleType: role,
    department:
      role === 'CASHIER' ? 'Cashier' : role === 'LAB_STAFF' ? 'Clinical Laboratory' : role === 'ADMIN' ? 'Laboratory Administration' : 'Information Desk',
    facility: 'PTSI Central Laboratory',
    badgeNumber: username.toUpperCase(),
    avatarInitials: initials,
    avatarGradient: GRADIENTS[username.length % GRADIENTS.length],
    securityLevel: role === 'ADMIN' ? 'LEVEL_4_DIRECTOR_ADMIN' : role === 'LAB_STAFF' ? 'LEVEL_2_TESTING' : 'LEVEL_1_INTAKE',
    securityLevelLabel: roleLabel(role),
    electronicSignaturePin: '0000',
    signatureHash: `sig-${username}`,
    twoFactorEnabled: false,
    activeWorkstation: 'PTSI Central Laboratory',
    permissions: permissionsForRole(role),
  };
}
