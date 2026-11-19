import type { LabTestRequisition, Sample } from '../types/lims';
import type { ExamExaminers } from '../components/modals/ResultEntryModal';
import { formatNtpOfficialDateTime } from './resultsPickup';
import {
  NTP_FIELD_KEYS,
  resolveNtpSelectedDiagnosticChkId,
} from '../components/forms/NtpLabRequestForm';

function normSex(gender?: string | null): string {
  const g = String(gender || '').trim().toLowerCase();
  if (g.startsWith('f')) return 'F';
  if (g.startsWith('m')) return 'M';
  return '';
}

function dateOnly(value?: string | null): string {
  if (!value) return '';
  const part = value.split(/[ T]/)[0];
  return part || '';
}

/** Default Form 2a (RF-10) field values from accession + requisition. */
export function buildNtpFormDefaults(
  requisition?: LabTestRequisition | null,
  sample?: Sample | null
): Record<string, string> {
  const values: Record<string, string> = {};
  if (!requisition && !sample) return values;

  const req = requisition;

  const patientName =
    req?.patientOrSubjectName ||
    sample?.patientOrSourceName?.replace(/\s*\([^)]*\)/g, '').trim() ||
    '';
  const age =
    req?.patientAge != null && !Number.isNaN(req.patientAge) ? String(req.patientAge) : '';
  const sex = normSex(req?.patientGender);
  const provinceCity = (req?.patientAddress || '').trim();
  const patientContact = (req?.patientPhone || req?.patientEmail || '').trim();
  const dateOfRequest = dateOnly(req?.requestDate);
  const requestingPhysician = (req?.orderingPhysicianOrPI || '').trim();
  const facilityName = (req?.organizationOrClient || '').trim();
  const tbCaseNo = (req?.caseNo || req?.externalRef || sample?.externalId || '').trim();
  const collectionDate = dateOnly(sample?.collectionDate || req?.requestDate);
  const specimenReceivedAt = dateOnly(sample?.receivedDate);
  const remarks = (req?.clinicalNotes || sample?.notes || '').trim();

  if (patientName) values.patientName = patientName.toUpperCase();
  if (age) values.age = age;
  if (sex) values.sex = sex;
  if (provinceCity) values.provinceCity = provinceCity.toUpperCase();
  if (patientContact) values.patientContact = patientContact;
  if (dateOfRequest) values.dateOfRequest = dateOfRequest;
  if (requestingPhysician) values.requestingPhysician = requestingPhysician.toUpperCase();
  if (facilityName && facilityName !== 'N/A') values.facilityName = facilityName.toUpperCase();
  if (tbCaseNo) values.tbCaseNo = tbCaseNo.toUpperCase();
  if (collectionDate) {
    values.collectionDate = collectionDate;
    values.spec1_collected = collectionDate;
  }
  if (specimenReceivedAt) values.specimenReceivedAt = specimenReceivedAt;
  if (remarks) values.remarks = remarks.toUpperCase();

  values.labName = 'PHILIPPINE TUBERCULOSIS SOCIETY, INC. — CENTRAL LABORATORY';

  return values;
}

/** Form 2a “Test requested” checkboxes that have a row on the results table. */
export const NTP_REQ_TO_RESULT_CHECK: Record<string, string> = {
  req_xpert: 'res_ck_xpert',
  req_xpert_ultra: 'res_ck_xpert_ultra',
  req_truenat_plus: 'res_ck_truenat_plus',
  req_truenat_rif: 'res_ck_truenat_rif',
  req_tblamp: 'res_ck_tblamp',
  req_smear: 'res_ck_smear',
};

/** Map catalog examination to Form 2a “Test requested” checkbox id. */
export function ntpRequestKeyForExam(examCode: string, examName: string): string | undefined {
  const code = (examCode || '').trim();
  const name = (examName || '').toUpperCase();
  if (code === '1086' || name.includes('XPERT') || name.includes('GENEXPERT')) return 'req_xpert';
  if (code === '1017' || code === '1001' || name.includes('DSSM') || name.includes('SMEAR MICROSCOPY')) {
    return 'req_smear';
  }
  if (name.includes('TRUENAT') && name.includes('PLUS')) return 'req_truenat_plus';
  if (name.includes('TRUENAT')) return 'req_truenat_rif';
  if (name.includes('TB LAMP') || name.includes('TBLAMP')) return 'req_tblamp';
  if (name.includes('XDR')) return 'req_xpert_xdr';
  if (name.includes('ULTRA')) return 'req_xpert_ultra';
  return undefined;
}

export function ntpResultCheckForExam(examCode: string, examName: string): string | undefined {
  const req = ntpRequestKeyForExam(examCode, examName);
  return req ? NTP_REQ_TO_RESULT_CHECK[req] : undefined;
}

/** Turn on Test requested checks for examinations on this RF-10 panel (does not turn off manual picks). */
export function syncNtpRequestChecksFromPanel(
  values: Record<string, string>,
  members: { examCode: string; examName: string }[]
): void {
  for (const m of members) {
    const reqKey = ntpRequestKeyForExam(m.examCode, m.examName);
    if (reqKey) values[reqKey] = '1';
  }
}

/**
 * Results row checks follow Test requested. All requested tests stay checked for print;
 * res_diagnostic_test is only the active row in workflow entry.
 */
export function syncNtpResultChecksFromRequest(values: Record<string, string>): void {
  const resChecks = Object.values(NTP_REQ_TO_RESULT_CHECK);
  const requestedResCks = Object.entries(NTP_REQ_TO_RESULT_CHECK)
    .filter(([reqKey]) => values[reqKey] === '1')
    .map(([, resCk]) => resCk);

  if (requestedResCks.length === 0) {
    resChecks.forEach((ck) => {
      values[ck] = '';
    });
    values.res_diagnostic_test = '';
    return;
  }

  const explicit = (values.res_diagnostic_test || '').trim();
  const focus =
    explicit && requestedResCks.includes(explicit) ? explicit : requestedResCks[0];

  resChecks.forEach((ck) => {
    values[ck] = requestedResCks.includes(ck) ? '1' : '';
  });
  values.res_diagnostic_test = focus;
}

export function resolveNtpWorkflowDiagnosticFocus(
  values: Record<string, string>,
  members: { examCode: string; examName: string }[]
): string {
  const requestedResCks = Object.entries(NTP_REQ_TO_RESULT_CHECK)
    .filter(([reqKey]) => values[reqKey] === '1')
    .map(([, resCk]) => resCk);
  if (requestedResCks.length === 0) return '';

  const explicit = (values.res_diagnostic_test || '').trim();
  if (explicit && requestedResCks.includes(explicit)) return explicit;

  for (const m of members) {
    const chk = ntpResultCheckForExam(m.examCode, m.examName);
    if (chk && requestedResCks.includes(chk)) return chk;
  }
  return requestedResCks[0];
}

export function mergeNtpFormDefaults(
  stored: Record<string, string>,
  requisition?: LabTestRequisition | null,
  sample?: Sample | null,
  panelMembers?: { examCode: string; examName: string }[]
): Record<string, string> {
  const defaults = buildNtpFormDefaults(requisition, sample);
  const merged = { ...stored };
  for (const key of NTP_FIELD_KEYS) {
    const cur = (merged[key] || '').trim();
    if (!cur && defaults[key]) merged[key] = defaults[key];
  }
  if (panelMembers?.length) {
    const anyReqChecked = Object.keys(NTP_REQ_TO_RESULT_CHECK).some((k) => merged[k] === '1');
    if (!anyReqChecked) syncNtpRequestChecksFromPanel(merged, panelMembers);
    if (!(merged.res_diagnostic_test || '').trim()) {
      merged.res_diagnostic_test = resolveNtpWorkflowDiagnosticFocus(merged, panelMembers);
    }
  }
  syncNtpResultChecksFromRequest(merged);
  return merged;
}

/** Apply requisition/sample defaults into a parameter map when values are still empty. */
/** Map per-examination sign-off roster into Form 2a footer fields (official print / CoA). */
export function applyNtpExaminerSignoff(
  values: Record<string, string>,
  examiners?: ExamExaminers | null,
  dateReleased?: string | null
): Record<string, string> {
  const next = { ...values };
  if (!examiners) return next;
  const performed = (examiners.labTechName || '').trim();
  const verified = (examiners.rmtName || '').trim();
  const noted = (examiners.pathologistName || '').trim();
  if (performed && !(next.performedBy || '').trim()) next.performedBy = performed;
  if (verified && !(next.verifiedBy || '').trim()) next.verifiedBy = verified;
  if (noted && !(next.notedBy || '').trim()) next.notedBy = noted;
  const released = (dateReleased || '').trim();
  if (released && !(next.dateReleased || '').trim()) {
    next.dateReleased = formatNtpOfficialDateTime(released);
  }
  return next;
}

export function applyNtpFormDefaultsToParamMap(
  paramMap: Record<string, { value?: string } | undefined>,
  requisition: LabTestRequisition | null | undefined,
  sample: Sample | null | undefined,
  onSet: (key: string, value: string) => void
): void {
  const defaults = buildNtpFormDefaults(requisition, sample);
  for (const key of NTP_FIELD_KEYS) {
    const val = defaults[key];
    if (!val) continue;
    const cur = paramMap[key]?.value;
    if (cur != null && String(cur).trim() !== '') continue;
    onSet(key, val);
  }
}
