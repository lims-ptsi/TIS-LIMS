import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import {
  loadStoredRequisitions,
  loadStoredTestResults,
  lookupStoredRecord,
} from '../data/limsDataStore';
import { limsService } from '../services/limsService';

export type VerifyDataSource = 'supabase' | 'local';

export type VerifyLoadedRecord = {
  requisition: LabTestRequisition;
  resultMap: Record<string, ExamResultGroup> | undefined;
  resultsRecordStatus?: string | null;
  source: VerifyDataSource;
};

function findLocalRequisition(rn: string, cn?: string): LabTestRequisition | undefined {
  const reqs = loadStoredRequisitions();
  const found =
    reqs.find((r) => r.requisitionNumber === rn) ||
    (cn
      ? reqs.find((r) => r.caseNo === cn || r.externalRef === cn)
      : undefined);
  return found;
}

function loadLocalResultMap(req: LabTestRequisition): Record<string, ExamResultGroup> | undefined {
  const resultsStore = loadStoredTestResults().results as Record<string, Record<string, ExamResultGroup>>;
  return lookupStoredRecord(resultsStore, req.id, req.requisitionNumber) || undefined;
}

/** Load requisition + examination results for public QR verify (server first, then this browser). */
export async function loadVerifyRequisitionRecord(
  rn: string,
  cn?: string
): Promise<VerifyLoadedRecord | null> {
  const trimmedRn = rn.trim();
  if (!trimmedRn) return null;

  if (limsService.isLive) {
    const remoteReq = await limsService.fetchRequisitionByNumber(trimmedRn);
    if (remoteReq) {
      const resultRow = await limsService.fetchTestResultsByRequisitionNumber(trimmedRn);
      return {
        requisition: remoteReq,
        resultMap: resultRow?.results || undefined,
        resultsRecordStatus: resultRow?.recordStatus ?? null,
        source: 'supabase',
      };
    }
  }

  const localReq = findLocalRequisition(trimmedRn, cn);
  if (!localReq) return null;

  return {
    requisition: localReq,
    resultMap: loadLocalResultMap(localReq),
    source: 'local',
  };
}
