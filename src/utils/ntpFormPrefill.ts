import type { LabTestRequisition, Sample } from '../types/lims';
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

/** Results “Diagnostic tests” follow Test Requested — not the catalog assignment. */
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
  const keep =
    explicit && requestedResCks.includes(explicit) ? explicit : requestedResCks[0];

  resChecks.forEach((ck) => {
    values[ck] = ck === keep ? '1' : '';
  });
  values.res_diagnostic_test = keep;
}

export function mergeNtpFormDefaults(
  stored: Record<string, string>,
  requisition?: LabTestRequisition | null,
  sample?: Sample | null
): Record<string, string> {
  const defaults = buildNtpFormDefaults(requisition, sample);
  const merged = { ...stored };
  for (const key of NTP_FIELD_KEYS) {
    const cur = (merged[key] || '').trim();
    if (!cur && defaults[key]) merged[key] = defaults[key];
  }
  syncNtpResultChecksFromRequest(merged);
  return merged;
}

/** Apply requisition/sample defaults into a parameter map when values are still empty. */
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
