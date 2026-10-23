import { LabTestRequisition, Sample } from '../types/lims';

export function isResultsPickedUp(req: Pick<LabTestRequisition, 'resultsPickedUpAt'>): boolean {
  return Boolean(String(req.resultsPickedUpAt || '').trim());
}

export function isAwaitingPatientPickup(req: LabTestRequisition): boolean {
  return req.status === 'COMPLETED' && !isResultsPickedUp(req);
}

/** True when results are completed/released and pickup alerts are allowed. */
export function isResultsReleasedForPickup(req: LabTestRequisition, samples?: Sample[]): boolean {
  if (req.status === 'COMPLETED') return true;
  if (!samples?.length) return false;
  const caseNo = req.caseNo?.trim();
  const reqNum = req.requisitionNumber?.trim();
  return samples.some((s) => {
    if (s.status !== 'APPROVED') return false;
    if (caseNo && s.externalId === caseNo) return true;
    if (reqNum && (s.barcode === reqNum || s.externalId === reqNum)) return true;
    return false;
  });
}

export function formatResultsPickupWhen(iso?: string | null): string {
  const raw = (iso || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
