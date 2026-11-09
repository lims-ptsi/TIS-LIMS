import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { LabTestRequisition } from '../components/modals/NewRequisitionModal';

export type ResultsRecordStatus = 'IN_TESTING' | 'COMPLETED' | string | null | undefined;

/** Human-readable workflow status for the public verify page. */
export function resolveVerifyStatusOnFile(input: {
  requisition?: LabTestRequisition | null;
  resultsRecordStatus?: ResultsRecordStatus;
  examGroup?: ExamResultGroup | null;
}): string {
  const record = (input.resultsRecordStatus || '').trim().toUpperCase();
  const reqStatus = (input.requisition?.status || '').trim().toUpperCase();
  const groupStatus = (input.examGroup?.status || '').trim().toUpperCase();

  if (record === 'COMPLETED' || reqStatus === 'COMPLETED' || groupStatus === 'COMPLETED') {
    return 'Completed';
  }
  if (record === 'IN_TESTING' || reqStatus === 'IN_TESTING') {
    return 'In testing';
  }
  if (reqStatus === 'RECEIVED') return 'Received';
  if (reqStatus === 'SUBMITTED') return 'Submitted';
  if (groupStatus === 'IN_PROGRESS') return 'In progress';
  if (groupStatus === 'PENDING') return 'Pending';
  return 'In testing';
}

export function syncExamResultsWorkflowStatus(
  results: Record<string, ExamResultGroup>,
  recordStatus: 'IN_TESTING' | 'COMPLETED'
): Record<string, ExamResultGroup> {
  const examStatus: ExamResultGroup['status'] =
    recordStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
  const next: Record<string, ExamResultGroup> = {};
  for (const [key, group] of Object.entries(results)) {
    if (!group) continue;
    const keepCompleted = group.status === 'COMPLETED' && recordStatus === 'IN_TESTING';
    next[key] = {
      ...group,
      status: keepCompleted ? 'COMPLETED' : examStatus,
    };
  }
  return next;
}
