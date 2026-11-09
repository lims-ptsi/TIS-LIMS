import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { ResultFormDefinition } from '../data/resultFormsCatalog';

export function valuesToExamResultGroup(values: Record<string, string>): ExamResultGroup {
  return {
    examCode: '',
    examName: '',
    parameters: Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        { value: String(value ?? ''), flag: 'NORMAL' as const },
      ])
    ),
    status: 'APPROVED',
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
  return {
    id: 'form-preview',
    requisitionNumber:
      pick('barcode', 'labNumber', 'labSerial', 'orNumber', 'tbCaseNo') || 'PREVIEW-REQ',
    caseNo: pick('patientId', 'tbCaseNo', 'labNumber', 'labSerial') || 'PREVIEW-CASE',
    patientOrSubjectName: pick('patientName', 'facilityName') || 'Preview patient',
    patientGender: pick('gender', 'sex') || 'Male',
    patientAge: Number.parseInt(pick('age') || '0', 10) || 0,
    requestDate: pick('dateOfRequest', 'collected', 'releaseDate') || new Date().toISOString(),
    status: 'COMPLETED',
    organizationOrClient: pick('hospitalClinic', 'facilityName') || 'PTSI',
    kindOfExamination: [],
    selectedTestNames: [],
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
