export type SecurityClearanceLevel = 
  | 'LEVEL_1_INTAKE' 
  | 'LEVEL_2_TESTING' 
  | 'LEVEL_3_SUPERVISOR' 
  | 'LEVEL_4_DIRECTOR_ADMIN';

export type UserRoleType =
  | 'STAFF'
  | 'CASHIER'
  | 'LAB_STAFF'
  | 'ADMIN'
  | 'MEDICAL_DIRECTOR'
  | 'LEAD_CHEMIST'
  | 'CLINICAL_SCIENTIST'
  | 'ACCESSIONING_SPECIALIST'
  | 'ORDERING_PHYSICIAN'
  | 'QA_COMPLIANCE_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  title: string;
  email: string;
  username: string;
  role: string;
  roleType: UserRoleType;
  department: string;
  facility: string;
  badgeNumber: string;
  licenseNumber?: string;
  avatarInitials: string;
  avatarGradient: string;
  securityLevel: SecurityClearanceLevel;
  securityLevelLabel: string;
  electronicSignaturePin: string;
  signatureHash: string;
  twoFactorEnabled: boolean;
  activeWorkstation: string;
  permissions: {
    canCreateRequest?: boolean;
    canAssignOrNumber?: boolean;
    canViewSamples?: boolean;
    canPrintLabels?: boolean;
    canPrintResults?: boolean;
    canAccessionSamples: boolean;
    canEnterResults: boolean;
    canReleaseCoA: boolean;
    canModifyProtocols: boolean;
    canManageInstruments: boolean;
    canReviewAuditLogs: boolean;
    canSignOffCriticals: boolean;
  };
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  facility: string;
  workstation: string;
  rememberWorkstation: boolean;
  mfaCode?: string;
}

export interface LaboratoryFacility {
  id: string;
  name: string;
  code: string;
  address: string;
  cliaNumber: string;
  capNumber: string;
  status: 'OPERATIONAL' | 'RESTRICTED' | 'MAINTENANCE';
}
