import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { PersistedTestResults, requisitionNumberKey } from '../data/limsDataStore';
import { examinationList } from '../data/requestDesk';
import { limsService } from '../services/limsService';

const WORKFLOW_STATUS_RANK: Record<string, number> = {
  SUBMITTED: 1,
  RECEIVED: 2,
  IN_TESTING: 3,
  COMPLETED: 4,
};

function pickMergedStatus(
  local?: LabTestRequisition['status'],
  remote?: LabTestRequisition['status']
): LabTestRequisition['status'] {
  const l = local || 'SUBMITTED';
  const r = remote || 'SUBMITTED';
  const lr = WORKFLOW_STATUS_RANK[l] ?? 0;
  const rr = WORKFLOW_STATUS_RANK[r] ?? 0;
  if (lr > rr) return l;
  if (rr > lr) return r;
  if (l !== 'SUBMITTED' && r === 'SUBMITTED') return l;
  return r;
}

function pickMergedExamFields(local: LabTestRequisition, remote: LabTestRequisition) {
  const localExams = examinationList(local);
  const remoteExams = examinationList(remote);
  if (localExams.length > 0 && localExams.length >= remoteExams.length) {
    return {
      kindOfExamination: local.kindOfExamination?.length ? local.kindOfExamination : remote.kindOfExamination,
      selectedTestNames: local.selectedTestNames?.length ? local.selectedTestNames : remote.selectedTestNames,
      selectedTestIds: local.selectedTestIds?.length ? local.selectedTestIds : remote.selectedTestIds,
    };
  }
  return {
    kindOfExamination: remote.kindOfExamination,
    selectedTestNames: remote.selectedTestNames,
    selectedTestIds: remote.selectedTestIds,
  };
}

/** Minimum time between background Supabase pulls when switching tabs (keeps UI snappy). */
export const TAB_DATA_REFRESH_MS = 10_000;

const SKIP_REQUISITION_PULL_TABS = new Set([
  'examinations',
  'result-templates',
  'audit-trail',
  'protocols',
  'instruments',
  'inventory',
  'qc-analytics',
  'plates',
  'libraries',
  'batches',
  'projects',
  'boxes',
]);

const TEST_RESULTS_PULL_TABS = new Set([
  'testing-queue',
  'result-forms',
  'coa-reports',
  'sample-detail',
]);

export type RemoteTestResultRow = NonNullable<Awaited<ReturnType<typeof limsService.fetchTestResults>>>[number];

export function tabShouldPullRequisitions(tab: string, force?: boolean): boolean {
  if (force) return true;
  return !SKIP_REQUISITION_PULL_TABS.has(tab);
}

export function tabShouldPullTestResults(tab: string, includeForBootstrap?: boolean): boolean {
  if (includeForBootstrap) return true;
  return TEST_RESULTS_PULL_TABS.has(tab);
}

/** Merge remote requisition rows with in-memory / localStorage state (OR # and workflow status rules). */
export function mergeRemoteRequisitions(
  prev: LabTestRequisition[],
  data: LabTestRequisition[]
): LabTestRequisition[] {
  const prevMap = new Map(prev.map((r) => [r.id, r]));
  const prevByNum = new Map(prev.map((r) => [r.requisitionNumber, r]));

  const merged = data.map((remote) => {
    const local = prevMap.get(remote.id) || prevByNum.get(remote.requisitionNumber);
    if (!local) return remote;

    const localOr = (local.orNumber || '').trim();
    const hasLocalOr = localOr.length > 0 && localOr.toUpperCase() !== 'N/A';
    const remoteOr = (remote.orNumber || '').trim();
    const hasRemoteOr = remoteOr.length > 0 && remoteOr.toUpperCase() !== 'N/A';

    const exams = pickMergedExamFields(local, remote);
    return {
      ...remote,
      ...exams,
      patientCategory: remote.patientCategory || local.patientCategory || 'OPD',
      orNumber: hasLocalOr && !hasRemoteOr ? local.orNumber : hasRemoteOr ? remote.orNumber : local.orNumber || remote.orNumber,
      status: pickMergedStatus(local.status, remote.status),
    };
  });

  const remoteIds = new Set(data.map((r) => r.id));
  const remoteNums = new Set(data.map((r) => r.requisitionNumber));
  const localOnly = prev.filter((r) => !remoteIds.has(r.id) && !remoteNums.has(r.requisitionNumber));

  return [...localOnly, ...merged];
}

function applyRowMap<T>(
  prev: Record<string, T>,
  rows: RemoteTestResultRow[],
  localUpdatedAt: Record<string, string>,
  pick: (row: RemoteTestResultRow) => T
): Record<string, T> {
  const next = { ...prev };
  rows.forEach((row) => {
    const localStamp = localUpdatedAt[row.requisitionId] || '';
    if (localStamp && row.updatedAt && localStamp > row.updatedAt) return;
    next[row.requisitionId] = pick(row);
    const numberKey = requisitionNumberKey(row.requisitionNumber);
    if (numberKey) next[numberKey] = pick(row);
  });
  return next;
}

export function mergePullTestResults(
  local: PersistedTestResults,
  rows: RemoteTestResultRow[]
): Pick<PersistedTestResults, 'results' | 'medtech' | 'updatedAt'> {
  const results = applyRowMap(
    local.results,
    rows,
    local.updatedAt,
    (row) => row.results as Record<string, ExamResultGroup>
  );
  const medtech = applyRowMap(local.medtech, rows, local.updatedAt, (row) => row.medtechInfo);
  const updatedAt = { ...local.updatedAt };
  rows.forEach((row) => {
    const localStamp = local.updatedAt[row.requisitionId] || '';
    if (!row.updatedAt) return;
    if (localStamp && localStamp > row.updatedAt) return;
    updatedAt[row.requisitionId] = row.updatedAt;
    const numberKey = requisitionNumberKey(row.requisitionNumber);
    if (numberKey) updatedAt[numberKey] = row.updatedAt;
  });
  return { results, medtech, updatedAt };
}

/** One-time after login: push browser-newer result drafts to Supabase. */
export async function pushNewerLocalTestResultsToRemote(
  local: PersistedTestResults,
  rows: RemoteTestResultRow[] | null
): Promise<void> {
  if (!rows) return;
  const dbById = new Map(rows.map((row) => [row.requisitionId, row]));

  await Promise.all(
    Object.entries(local.results).map(async ([id, results]) => {
      if (!id || id.startsWith('rn:')) return;
      if (!results || Object.keys(results).length === 0) return;
      const db = dbById.get(id);
      const localStamp = local.updatedAt[id] || '';
      if (db?.updatedAt && localStamp && localStamp <= db.updatedAt) return;
      await limsService.upsertTestResults({
        requisitionId: id,
        requisitionNumber: db?.requisitionNumber || null,
        results,
        medtechInfo: local.medtech[id] || {},
        status: db?.status || 'IN_TESTING',
      });
    })
  );
}
