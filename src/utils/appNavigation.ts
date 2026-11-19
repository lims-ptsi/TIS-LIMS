import { findSampleForRequisition } from '../data/patientDirectory';
import { LabTestRequisition } from '../types/lims';
import type { Sample } from '../types/lims';

const STORAGE_KEY = 'labtis_app_nav';

export type PersistedAppNav = {
  userId: string;
  tab: string;
  sampleId?: string;
  requisitionId?: string;
  requisitionNumber?: string;
  /** Tab to restore when leaving sample detail (Back). */
  returnTab?: string;
  submissionsPipelineFilter?: string;
  /** Completed-tab release sub-filter (awaiting notify / pickup / picked up). */
  submissionsReleaseFilter?: string;
};

export function readAppNav(): PersistedAppNav | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAppNav;
    if (!parsed?.userId || !parsed?.tab) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAppNav(state: PersistedAppNav): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAppNav(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore the specimen detail view from persisted navigation (stable across refresh). */
export function resolveSampleFromNav(
  samples: Sample[],
  requisitions: LabTestRequisition[],
  nav?: PersistedAppNav | null
): Sample | null {
  if (!nav) return null;

  if (nav.sampleId) {
    const byId = samples.find((s) => s.id === nav.sampleId);
    if (byId) return byId;
  }

  if (nav.requisitionId) {
    const req = requisitions.find((r) => r.id === nav.requisitionId);
    if (req) {
      const match = findSampleForRequisition(req, samples);
      if (match) return match;
    }
  }

  if (nav.requisitionNumber) {
    const num = nav.requisitionNumber.trim().toLowerCase();
    const req = requisitions.find(
      (r) => (r.requisitionNumber || '').trim().toLowerCase() === num
    );
    if (req) {
      const match = findSampleForRequisition(req, samples);
      if (match) return match;
    }
    const byExt = samples.find((s) => (s.externalId || '').trim().toLowerCase() === num);
    if (byExt) return byExt;
  }

  return null;
}
