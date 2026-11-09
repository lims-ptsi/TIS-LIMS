export type LabPersonnelRole = 'performed' | 'verified' | 'pathologist';

export interface LabPersonnel {
  id: string;
  name: string;
  designation: string;
  licenseNo: string;
  role: LabPersonnelRole;
}

export const ROLE_DEFAULT_DESIGNATION: Record<LabPersonnelRole, string> = {
  performed: 'Laboratory Technician',
  verified: 'Medical Technologist',
  pathologist: 'Pathologist',
};

/** PTSI clinical laboratory signatory roster (Performed / Verified / Pathologist). */
export const LAB_PERSONNEL: LabPersonnel[] = [
  {
    id: 'path-onto',
    name: 'Marlene S. Onto, MD',
    designation: 'Pathologist',
    licenseNo: '0061864',
    role: 'pathologist',
  },
  {
    id: 'rmt-loresco',
    name: 'Citadel L. Loresco, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0031132',
    role: 'verified',
  },
  {
    id: 'rmt-isorena',
    name: 'Sanny M. Isorena, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0059354',
    role: 'verified',
  },
  {
    id: 'rmt-demesa',
    name: 'Harry S. De Mesa, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0054084',
    role: 'verified',
  },
  {
    id: 'rmt-samonte',
    name: 'Peter V. Samonte, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0061215',
    role: 'verified',
  },
  {
    id: 'rmt-indias',
    name: 'Elaine L. Indias, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0054463',
    role: 'verified',
  },
  {
    id: 'rmt-chua',
    name: 'Joan Hester D. Chua, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0061249',
    role: 'verified',
  },
  {
    id: 'rmt-valera',
    name: 'Abegail M. Valera, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0071968',
    role: 'verified',
  },
  {
    id: 'rmt-rosales',
    name: 'Jomairyn M. Rosales, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0062788',
    role: 'verified',
  },
  {
    id: 'rmt-palma',
    name: 'Victoria L. Palma, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0021328',
    role: 'verified',
  },
  {
    id: 'rmt-barretto',
    name: 'Roena Joyce J. Barretto, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0081428',
    role: 'verified',
  },
  {
    id: 'rmt-tion',
    name: 'Vincent John U. Tion, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0107240',
    role: 'verified',
  },
  {
    id: 'rmt-bandong',
    name: 'Maria Carmela Louisa A. Bandong, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0129060',
    role: 'verified',
  },
  {
    id: 'rmt-carillo',
    name: 'Eanna Maree O. Carillo, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0107284',
    role: 'verified',
  },
  {
    id: 'rmt-cuarentas',
    name: 'Ymmji P. Cuarentas, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0110489',
    role: 'verified',
  },
  {
    id: 'rmt-guerra',
    name: 'Mark Arvy A. Guerra, RMT',
    designation: 'Medical Technologist',
    licenseNo: '0126597',
    role: 'verified',
  },
  {
    id: 'lt-borlongan',
    name: 'Ma. Lirio S. Borlongan, RMLT',
    designation: 'Laboratory Technician',
    licenseNo: '0002705',
    role: 'performed',
  },
];

export function personnelForRole(role: LabPersonnelRole): LabPersonnel[] {
  return LAB_PERSONNEL.filter((p) => p.role === role);
}

export function findPersonnelById(id: string): LabPersonnel | undefined {
  return LAB_PERSONNEL.find((p) => p.id === id);
}

function normalizeLicense(value?: string): string {
  return String(value ?? '')
    .replace(/^prc\s*#?\s*/i, '')
    .replace(/\D/g, '')
    .trim();
}

/** Match saved name/license to roster entry for dropdown selection. */
export function matchPersonnel(role: LabPersonnelRole, name?: string, licenseNo?: string): LabPersonnel | undefined {
  const list = personnelForRole(role);
  const lic = normalizeLicense(licenseNo);
  if (lic) {
    const byLic = list.find((p) => normalizeLicense(p.licenseNo) === lic);
    if (byLic) return byLic;
  }
  const n = String(name ?? '').trim().toLowerCase();
  if (!n) return undefined;
  return list.find((p) => p.name.trim().toLowerCase() === n);
}

export function personnelIdForExaminer(
  role: LabPersonnelRole,
  name?: string,
  licenseNo?: string
): string {
  return matchPersonnel(role, name, licenseNo)?.id ?? '';
}
