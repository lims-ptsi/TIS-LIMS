import { LabTestRequisition, PatientCategory } from '../types/lims';

/** Only OPD pays at the cashier. Every other category goes to the laboratory. */
export function requiresCashier(category?: PatientCategory | string): boolean {
  return (category || 'OPD') === 'OPD';
}

export function hasOfficialReceipt(orNumber?: string): boolean {
  const value = (orNumber || '').trim();
  return value.length > 0 && value.toUpperCase() !== 'N/A';
}

/** Unpaid OPD stays with the cashier. Paid OPD and every other category are ready for the laboratory. */
export function readyForLaboratory(req: Pick<LabTestRequisition, 'patientCategory' | 'status' | 'orNumber'>): boolean {
  if (!requiresCashier(req.patientCategory)) return true;
  if (req.status && req.status !== 'SUBMITTED') return true;
  return hasOfficialReceipt(req.orNumber);
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
