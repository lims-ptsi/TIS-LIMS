import { LabTestRequisition, PatientCategory } from '../types/lims';

/** Only OPD pays at the cashier. Every other category goes to the laboratory. */
export function requiresCashier(category?: PatientCategory | string): boolean {
  return (category || 'OPD') === 'OPD';
}

export function examinationList(
  req: Pick<LabTestRequisition, 'kindOfExamination' | 'selectedTestNames'>
): string[] {
  if (req.kindOfExamination?.length) return req.kindOfExamination;
  if (req.selectedTestNames?.length) return req.selectedTestNames;
  return [];
}

export function hasExaminationOrder(
  req: Pick<LabTestRequisition, 'kindOfExamination' | 'selectedTestNames'>
): boolean {
  return examinationList(req).length > 0;
}

/** Information desk submitted patient/request only — laboratory must order examinations. */
export function needsLaboratoryExamSelection(
  req: Pick<LabTestRequisition, 'status' | 'kindOfExamination' | 'selectedTestNames'>
): boolean {
  return req.status === 'SUBMITTED' && !hasExaminationOrder(req);
}

/** OPD with tests ordered by lab, awaiting official receipt at cashier. */
export function readyForCashierSettlement(
  req: Pick<LabTestRequisition, 'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'>
): boolean {
  if (!requiresCashier(req.patientCategory)) return false;
  if (req.status !== 'SUBMITTED') return false;
  if (!hasExaminationOrder(req)) return false;
  return !hasOfficialReceipt(req.orNumber);
}

export function hasOfficialReceipt(orNumber?: string): boolean {
  const value = (orNumber || '').trim();
  return value.length > 0 && value.toUpperCase() !== 'N/A';
}

/** Unpaid OPD stays with the cashier. Paid OPD and every other category are ready for the laboratory. */
export function readyForLaboratory(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): boolean {
  if (!hasExaminationOrder(req)) return false;
  if (!requiresCashier(req.patientCategory)) return true;
  if (req.status && req.status !== 'SUBMITTED') return true;
  return hasOfficialReceipt(req.orNumber);
}

/** Requests the laboratory desk should see (order tests and/or receive specimen). */
export function onLaboratoryDesk(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): boolean {
  return needsLaboratoryExamSelection(req) || readyForLaboratory(req);
}

/** Request queue tab: intake, OPD at cashier, and OPD ready to receive (manual receive). Non-OPD leaves after exams are ordered. */
export function onLabRequestDesk(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): boolean {
  if (req.status !== 'SUBMITTED') return false;
  if (needsLaboratoryExamSelection(req)) return true;
  if (readyForCashierSettlement(req)) return true;
  if (requiresCashier(req.patientCategory) && readyForLaboratory(req)) return true;
  return false;
}

/** OPD with tests ordered; patient is at the cashier for OR. */
export type RequestTrackingPhase =
  | 'NEEDS_EXAMS'
  | 'AT_CASHIER'
  | 'READY_RECEIVE'
  | 'IN_TESTING'
  | 'COMPLETED'
  | 'OTHER';

/** Pipeline phase for All requests tracking filters and labels. */
export function requestTrackingPhase(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): RequestTrackingPhase {
  if (req.status === 'COMPLETED') return 'COMPLETED';
  if (req.status === 'IN_TESTING' || req.status === 'RECEIVED') return 'IN_TESTING';
  if (req.status !== 'SUBMITTED') return 'OTHER';
  if (needsLaboratoryExamSelection(req)) return 'NEEDS_EXAMS';
  if (waitingAtCashier(req)) return 'AT_CASHIER';
  if (readyForLaboratory(req) && requiresCashier(req.patientCategory)) return 'READY_RECEIVE';
  return 'OTHER';
}

export function requestTrackingLabel(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): string {
  const phase = requestTrackingPhase(req);
  switch (phase) {
    case 'NEEDS_EXAMS':
      return 'Info desk intake';
    case 'AT_CASHIER':
      return 'At cashier';
    case 'READY_RECEIVE':
      return 'Ready to receive';
    case 'IN_TESTING':
      return 'In testing';
    case 'COMPLETED':
      return 'Completed';
    default:
      if (req.status === 'SUBMITTED') return 'Submitted';
      return String(req.status || '—').replace(/_/g, ' ');
  }
}

export function waitingAtCashier(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): boolean {
  return readyForCashierSettlement(req);
}

/** Next desk for SUBMITTED requests (home list badge: Cashier vs Laboratory). */
export function submittedNextDeskLabel(
  req: Pick<
    LabTestRequisition,
    'patientCategory' | 'status' | 'orNumber' | 'kindOfExamination' | 'selectedTestNames'
  >
): 'Cashier' | 'Laboratory' {
  if (waitingAtCashier(req)) return 'Cashier';
  return 'Laboratory';
}

/** Testing queue tab: specimen received, results in progress. */
export function onTestingDesk(
  req: Pick<LabTestRequisition, 'status'>
): boolean {
  return req.status === 'RECEIVED' || req.status === 'IN_TESTING';
}

/**
 * Information desk can correct a request until the next desk has taken it.
 * OPD locks when the cashier assigns a receipt. Every other category locks when the laboratory receives it.
 */
export function canReviseRequest(req: Pick<LabTestRequisition, 'patientCategory' | 'status' | 'orNumber'>): boolean {
  if (req.status !== 'SUBMITTED') return false;
  if (requiresCashier(req.patientCategory) && hasOfficialReceipt(req.orNumber)) return false;
  return true;
}

export function reviseLockReason(req: Pick<LabTestRequisition, 'patientCategory' | 'status' | 'orNumber'>): string {
  if (requiresCashier(req.patientCategory) && hasOfficialReceipt(req.orNumber)) {
    return 'The cashier already assigned the official receipt, so this request can no longer be changed.';
  }
  if (req.status !== 'SUBMITTED') {
    return 'The laboratory already received this request, so the information desk can no longer change it.';
  }
  return '';
}
