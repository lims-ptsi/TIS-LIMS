import { LabTestRequisition, Sample } from '../types/lims';

export type RequestReleaseFilter =
  | 'ALL'
  | 'NOT_PICKED_UP'
  | 'AWAITING_NOTIFY'
  | 'AWAITING_PICKUP'
  | 'PICKED_UP';

export type RequestReleasePhase = 'AWAITING_NOTIFY' | 'AWAITING_PICKUP' | 'PICKED_UP';

export function isResultsPickedUp(req: Pick<LabTestRequisition, 'resultsPickedUpAt'>): boolean {
  return Boolean(String(req.resultsPickedUpAt || '').trim());
}

export function patientWasNotified(
  req: Pick<LabTestRequisition, 'resultsReadySmsSentAt' | 'resultsReadyEmailSentAt'>
): boolean {
  return Boolean(
    String(req.resultsReadySmsSentAt || '').trim() || String(req.resultsReadyEmailSentAt || '').trim()
  );
}

export function isAwaitingPatientNotify(req: LabTestRequisition): boolean {
  return req.status === 'COMPLETED' && !patientWasNotified(req) && !isResultsPickedUp(req);
}

export function isAwaitingPatientPickup(req: LabTestRequisition): boolean {
  return req.status === 'COMPLETED' && !isResultsPickedUp(req);
}

export function requestReleasePhase(req: LabTestRequisition): RequestReleasePhase | null {
  if (req.status !== 'COMPLETED') return null;
  if (isResultsPickedUp(req)) return 'PICKED_UP';
  if (!patientWasNotified(req)) return 'AWAITING_NOTIFY';
  return 'AWAITING_PICKUP';
}

export function requestReleaseLabel(req: LabTestRequisition): string {
  const phase = requestReleasePhase(req);
  switch (phase) {
    case 'AWAITING_NOTIFY':
      return 'Awaiting notify';
    case 'AWAITING_PICKUP':
      return 'Awaiting pickup';
    case 'PICKED_UP':
      return 'Picked up';
    default:
      return '';
  }
}

export function matchesReleaseFilter(req: LabTestRequisition, filter: RequestReleaseFilter): boolean {
  if (req.status !== 'COMPLETED') return false;
  if (filter === 'ALL') return true;
  if (filter === 'NOT_PICKED_UP') return isAwaitingPatientPickup(req);
  if (filter === 'AWAITING_NOTIFY') return isAwaitingPatientNotify(req);
  if (filter === 'AWAITING_PICKUP') {
    return isAwaitingPatientPickup(req) && patientWasNotified(req);
  }
  if (filter === 'PICKED_UP') return isResultsPickedUp(req);
  return true;
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

/** Official Form 2a footer — human-readable print / release timestamp (not raw ISO). */
export function formatNtpOfficialDateTime(isoOrText?: string | null): string {
  const raw = (isoOrText || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw
      .replace('T', ', ')
      .replace(/\.\d{1,9}/, '')
      .replace(/Z$/, '')
      .replace(/[+-]\d{2}:\d{2}$/, '')
      .trim();
  }
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
