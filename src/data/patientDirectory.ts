import { CivilStatus, LabTestRequisition, PatientCategory, Sample } from '../types/lims';

export interface PatientVisit {
  id: string;
  requisitionNumber: string;
  requestDate: string;
  caseNo: string;
  status: string;
  examinations: string[];
  physician: string;
  patientCategory?: PatientCategory;
  orNumber?: string;
  chargeSlipNumber?: string;
  clinicalNotes?: string;
  sampleId?: string;
  sampleBarcode?: string;
  sampleStatus?: string;
  resultsPickedUpAt?: string | null;
  resultsPickedUpBy?: string | null;
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
  phone?: string;
  email?: string;
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

export function findSampleForRequisition(
  req: LabTestRequisition,
  samples: Sample[]
): Sample | undefined {
  const reqCase = (req.caseNo || req.externalRef || '').trim().toLowerCase();
  const reqNum = (req.requisitionNumber || '').trim().toLowerCase();
  const reqPatient = (req.patientOrSubjectName || '').trim().toLowerCase();
  return samples.find((s) => {
    const sExt = (s.externalId || '').trim().toLowerCase();
    const sPatient = (s.patientOrSourceName || '').trim().toLowerCase();
    return (
      (reqCase && sExt === reqCase) ||
      (reqNum && sExt === reqNum) ||
      (reqPatient &&
        sPatient &&
        (sPatient.includes(reqPatient) || reqPatient.includes(sPatient)))
    );
  });
}

export function buildPatientDirectory(
  requisitions: LabTestRequisition[],
  samples: Sample[] = []
): PatientRecord[] {
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
      phone: latest.patientPhone || undefined,
      email: latest.patientEmail || undefined,
      category: normalizeCategory(latest.patientCategory),
      visits: sorted.map((req) => {
        const matched = findSampleForRequisition(req, samples);
        return {
          id: req.id,
          requisitionNumber: req.requisitionNumber,
          requestDate: (req.requestDate || '').slice(0, 10),
          caseNo: req.caseNo || '',
          status: req.status || 'SUBMITTED',
          examinations:
            (req.kindOfExamination?.length ? req.kindOfExamination : req.selectedTestNames) || [],
          physician: req.orderingPhysicianOrPI || '',
          patientCategory: req.patientCategory,
          orNumber: req.orNumber,
          chargeSlipNumber: req.chargeSlipNumber,
          clinicalNotes: req.clinicalNotes,
          sampleId: matched?.id,
          sampleBarcode: matched?.barcode,
          sampleStatus: matched?.status,
          resultsPickedUpAt: req.resultsPickedUpAt ?? null,
          resultsPickedUpBy: req.resultsPickedUpBy ?? null,
        };
      }),
    });
  });

  records.sort((a, b) => (b.visits[0]?.requestDate || '').localeCompare(a.visits[0]?.requestDate || ''));
  return records;
}

function patientSearchBlob(record: PatientRecord): string {
  return [
    record.fullName,
    record.firstName,
    record.middleName,
    record.lastName,
    record.birthday,
    record.address,
    record.id,
    ...record.visits.flatMap((visit) => [
      visit.caseNo,
      visit.requisitionNumber,
      visit.physician,
      visit.sampleBarcode,
      visit.orNumber,
      visit.chargeSlipNumber,
      ...visit.examinations,
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

export function searchPatients(records: PatientRecord[], query: string): PatientRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records.slice(0, 5);
  return records
    .filter((record) => {
      const blob = patientSearchBlob(record);
      return q.split(/\s+/).every((part) => blob.includes(part));
    })
    .slice(0, 8);
}

export type PatientRecordSort = 'recent' | 'name' | 'visits';

export function filterPatientRecords(
  records: PatientRecord[],
  opts: {
    query?: string;
    category?: PatientCategory | 'ALL';
    sex?: 'ALL' | 'Male' | 'Female' | 'Other';
    sortBy?: PatientRecordSort;
  }
): PatientRecord[] {
  const q = (opts.query || '').trim().toLowerCase();
  let list = records.filter((record) => {
    if (opts.category && opts.category !== 'ALL' && record.category !== opts.category) {
      return false;
    }
    if (opts.sex && opts.sex !== 'ALL' && record.sex !== opts.sex) {
      return false;
    }
    if (!q) return true;
    const blob = patientSearchBlob(record);
    return q.split(/\s+/).every((part) => blob.includes(part));
  });

  const sortBy = opts.sortBy || 'recent';
  list = [...list].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'visits') return b.visits.length - a.visits.length;
    return (b.visits[0]?.requestDate || '').localeCompare(a.visits[0]?.requestDate || '');
  });
  return list;
}

export function patientRecordStats(record: PatientRecord) {
  const completed = record.visits.filter((v) => v.status === 'COMPLETED').length;
  const inFlight = record.visits.filter((v) =>
    ['SUBMITTED', 'RECEIVED', 'IN_TESTING'].includes(v.status)
  ).length;
  const examSet = new Set<string>();
  record.visits.forEach((v) => v.examinations.forEach((e) => examSet.add(e)));
  const categories = new Set(
    record.visits.map((v) => v.patientCategory).filter(Boolean) as PatientCategory[]
  );
  return {
    totalVisits: record.visits.length,
    completed,
    inFlight,
    uniqueExams: examSet.size,
    categories: [...categories],
    lastVisit: record.visits[0]?.requestDate || '',
    firstVisit: record.visits[record.visits.length - 1]?.requestDate || '',
  };
}

export function patientRecordIdFor(parts: {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
}): string {
  return `pat:${parts.lastName.trim().toUpperCase()}|${parts.firstName.trim().toUpperCase()}|${parts.middleName.trim().toUpperCase()}|${parts.birthday.slice(0, 10)}`;
}
