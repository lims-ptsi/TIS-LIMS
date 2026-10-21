import { CivilStatus, LabTestRequisition, PatientCategory } from '../types/lims';

export interface PatientVisit {
  id: string;
  requisitionNumber: string;
  requestDate: string;
  caseNo: string;
  status: string;
  examinations: string[];
  physician: string;
}

export interface PatientRecord {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  fullName: string;
  birthday: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  civilStatus: CivilStatus;
  address: string;
  category: PatientCategory;
  visits: PatientVisit[];
}

const CATEGORIES: PatientCategory[] = [
  'OPD',
  'PhilHealth',
  'Indigent',
  'Corporate',
  'Pre-Employment / Employee',
  'Employee',
  'Projects',
];

const CIVIL: CivilStatus[] = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'];

function normalizeSuffix(token: string): string | null {
  const bare = token.toUpperCase().replace(/\./g, '');
  if (bare === 'JR') return 'JR.';
  if (bare === 'SR') return 'SR.';
  if (['II', 'III', 'IV', 'V', 'VI'].includes(bare)) return bare;
  return null;
}

export function splitPatientName(full: string): {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
} {
  const parts = full.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '', suffix: '' };
  }
  let suffix = '';
  const suffixToken = normalizeSuffix(parts[parts.length - 1]);
  if (suffixToken && parts.length > 1) {
    suffix = suffixToken;
    parts.pop();
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '', suffix };
  }
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(' ');
  return { firstName, middleName, lastName, suffix };
}

function nameParts(req: LabTestRequisition) {
  const first = (req.firstName || '').trim().toUpperCase();
  const last = (req.lastName || '').trim().toUpperCase();
  if (first && last) {
    return {
      firstName: first,
      middleName: (req.middleName || '').trim().toUpperCase(),
      lastName: last,
      suffix: (req.suffix || '').trim().toUpperCase(),
    };
  }
  return splitPatientName(req.patientOrSubjectName || '');
}

function normalizeSex(value?: string): 'Male' | 'Female' | 'Other' {
  const v = (value || '').toLowerCase();
  if (v.startsWith('f')) return 'Female';
  if (v.startsWith('o')) return 'Other';
  return 'Male';
}

function normalizeCivil(value?: string): CivilStatus {
  const found = CIVIL.find((item) => item.toLowerCase() === (value || '').trim().toLowerCase());
  return found || 'Single';
}

function normalizeCategory(value?: string): PatientCategory {
  const found = CATEGORIES.find((item) => item.toLowerCase() === (value || '').trim().toLowerCase());
  return found || 'OPD';
}

export function patientNameKey(req: LabTestRequisition): string {
  const parts = nameParts(req);
  const dob = (req.patientDob || '').slice(0, 10);
  if (parts.lastName && parts.firstName) {
    return `pat:${parts.lastName}|${parts.firstName}|${parts.middleName}|${dob}`;
  }
  const name = (req.patientOrSubjectName || '').trim().toUpperCase().replace(/\s+/g, ' ');
  return `pat:${name}|${dob}`;
}

export function buildPatientDirectory(requisitions: LabTestRequisition[]): PatientRecord[] {
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    const current = parent.get(key);
    if (!current || current === key) {
      parent.set(key, key);
      return key;
    }
    const root = find(current);
    parent.set(key, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const left = find(a);
    const right = find(b);
    if (left !== right) parent.set(right, left);
  };

  const usable = requisitions.filter((req) => {
    const name = (req.patientOrSubjectName || req.lastName || req.firstName || '').trim();
    return Boolean(name) && name.toUpperCase() !== 'PATIENT NAME';
  });

  usable.forEach((req) => {
    const nameKey = patientNameKey(req);
    find(nameKey);
    const storedId = (req.patientId || '').trim();
    if (storedId) union(storedId, nameKey);
  });

  const groups = new Map<string, LabTestRequisition[]>();
  usable.forEach((req) => {
    const root = find(patientNameKey(req));
    const list = groups.get(root) || [];
    list.push(req);
    groups.set(root, list);
  });

  const records: PatientRecord[] = [];
  groups.forEach((list, id) => {
    const sorted = [...list].sort((a, b) => (b.requestDate || '').localeCompare(a.requestDate || ''));
    const latest = sorted[0];
    const parts = nameParts(latest);
    const fullName = [parts.firstName, parts.middleName, parts.lastName, parts.suffix].filter(Boolean).join(' ')
      || (latest.patientOrSubjectName || '').trim().toUpperCase();
    records.push({
      id,
      ...parts,
      fullName,
      birthday: (latest.patientDob || '').slice(0, 10),
      age: Number(latest.patientAge) || 0,
      sex: normalizeSex(latest.patientGender),
      civilStatus: normalizeCivil(latest.civilStatus),
      address: latest.patientAddress && latest.patientAddress !== 'N/A' ? latest.patientAddress.toUpperCase() : '',
      category: normalizeCategory(latest.patientCategory),
      visits: sorted.map((req) => ({
        id: req.id,
        requisitionNumber: req.requisitionNumber,
        requestDate: (req.requestDate || '').slice(0, 10),
        caseNo: req.caseNo || '',
        status: req.status || 'SUBMITTED',
        examinations: (req.kindOfExamination?.length ? req.kindOfExamination : req.selectedTestNames) || [],
        physician: req.orderingPhysicianOrPI || '',
      })),
    });
  });

  records.sort((a, b) => (b.visits[0]?.requestDate || '').localeCompare(a.visits[0]?.requestDate || ''));
  return records;
}

export function searchPatients(records: PatientRecord[], query: string): PatientRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records.slice(0, 5);
  return records
    .filter((record) => {
      const blob = [
        record.fullName,
        record.firstName,
        record.middleName,
        record.lastName,
        record.birthday,
        record.address,
        ...record.visits.flatMap((visit) => [visit.caseNo, visit.requisitionNumber, visit.physician]),
      ].join(' ').toLowerCase();
      return q.split(/\s+/).every((part) => blob.includes(part));
    })
    .slice(0, 8);
}

export function patientRecordIdFor(parts: {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
}): string {
  return `pat:${parts.lastName.trim().toUpperCase()}|${parts.firstName.trim().toUpperCase()}|${parts.middleName.trim().toUpperCase()}|${parts.birthday.slice(0, 10)}`;
}
