import { LabTestRequisition } from '../types/lims';
import { ExamResultGroup, ResultParamValue } from '../components/modals/ResultEntryModal';
import { ResultFormDefinition } from '../data/resultFormsCatalog';

function toResultParam(key: string, value: string): ResultParamValue {
  return {
    paramId: key,
    paramCode: key,
    paramName: key,
    unit: '',
    value: String(value ?? ''),
    flag: 'NORMAL',
  };
}

function normalizePreviewGender(raw: string): LabTestRequisition['patientGender'] {
  const g = raw.trim().toLowerCase();
  if (g.startsWith('f')) return 'Female';
  if (g.startsWith('m')) return 'Male';
  if (g === 'other') return 'Other';
  return 'Male';
}

export function valuesToExamResultGroup(values: Record<string, string>): ExamResultGroup {
  const parameters: Record<string, ResultParamValue> = {};
  for (const [key, value] of Object.entries(values)) {
    parameters[key] = toResultParam(key, value);
  }
  return {
    examCode: '',
    examName: '',
    category: '',
    parameters,
    status: 'COMPLETED',
  };
}

/** Build verify QR context from form preview values (Result Forms library) or official print. */
export function requisitionStubFromFormValues(
  values: Record<string, string>
): LabTestRequisition {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const val = (values[key] || '').trim();
      if (val) return val;
    }
    return '';
  };
  const today = new Date().toISOString();
  return {
    id: 'form-preview',
    requisitionNumber:
      pick('barcode', 'labNumber', 'labSerial', 'orNumber', 'tbCaseNo') || 'PREVIEW-REQ',
    requestDate: pick('dateOfRequest', 'collected', 'releaseDate') || today,
    patientOrSubjectName: pick('patientName', 'facilityName') || 'Preview patient',
    patientDob: pick('birthdate') || today.slice(0, 10),
    patientAddress: pick('hospitalClinic', 'provinceCity') || '—',
    caseNo: pick('patientId', 'tbCaseNo', 'labNumber', 'labSerial') || 'PREVIEW-CASE',
    patientAge: Number.parseInt(pick('age') || '0', 10) || 0,
    patientGender: normalizePreviewGender(pick('gender', 'sex') || 'Male'),
    civilStatus: 'Single',
    kindOfExamination: [],
    orderingPhysicianOrPI: pick('referringMd', 'requestingPhysician') || '—',
    orNumber: pick('orNumber') || '—',
    chargeSlipNumber: '—',
    organizationOrClient: pick('hospitalClinic', 'facilityName') || 'PTSI',
    externalRef: pick('patientId', 'tbCaseNo') || '',
    selectedTestIds: [],
    selectedTestNames: [],
    specimenTypes: [],
    tubeCount: 1,
    clinicalNotes: '',
    status: 'COMPLETED',
    tatDeadline: today,
    priority: 'ROUTINE',
  };
}

export function examKeyForResultForm(
  form: ResultFormDefinition,
  values: Record<string, string>
): string {
  return form.examCodes[0] || form.id;
}

/** Whether catalog entry allows verification QR (default on). */
export function resultFormShowsVerifyQr(form?: ResultFormDefinition | null): boolean {
  if (!form) return true;
  return form.orgHeader?.showQr !== false;
}
