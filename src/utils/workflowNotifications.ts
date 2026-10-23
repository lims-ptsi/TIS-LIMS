import { AppRole } from '../data/roleAccess';
import { requestTrackingPhase } from '../data/requestDesk';
import { LabTestRequisition, LimsNotification, NotificationType } from '../types/lims';

const MAX_STORED = 120;

export function workflowKeyForRequisition(req: LabTestRequisition): string | null {
  const ref = req.requisitionNumber || req.id;
  if (!ref) return null;
  if (req.status === 'COMPLETED') return `${ref}:COMPLETED`;
  if (req.status === 'IN_TESTING' || req.status === 'RECEIVED') return `${ref}:IN_TESTING`;
  if (req.status !== 'SUBMITTED') return null;

  const phase = requestTrackingPhase(req);
  if (phase === 'NEEDS_EXAMS') return `${ref}:NEEDS_EXAMS`;
  if (phase === 'AT_CASHIER') return `${ref}:AT_CASHIER`;
  if (phase === 'READY_RECEIVE') return `${ref}:READY_RECEIVE`;
  return null;
}

export function audienceForWorkflowKey(key: string): AppRole[] {
  if (key.endsWith(':NEEDS_EXAMS')) return ['LAB_STAFF', 'ADMIN'];
  if (key.endsWith(':AT_CASHIER')) return ['CASHIER', 'ADMIN', 'LAB_STAFF'];
  if (key.endsWith(':READY_RECEIVE')) return ['LAB_STAFF', 'ADMIN'];
  if (key.endsWith(':IN_TESTING')) return ['LAB_STAFF', 'ADMIN'];
  if (key.endsWith(':COMPLETED')) return ['LAB_STAFF', 'ADMIN', 'STAFF', 'CASHIER'];
  return ['STAFF', 'CASHIER', 'LAB_STAFF', 'ADMIN'];
}

function pipelineFilterForKey(key: string): string | undefined {
  if (key.endsWith(':NEEDS_EXAMS')) return 'NEEDS_EXAMS';
  if (key.endsWith(':AT_CASHIER')) return 'AT_CASHIER';
  if (key.endsWith(':READY_RECEIVE')) return 'READY_RECEIVE';
  if (key.endsWith(':IN_TESTING')) return 'IN_TESTING';
  return undefined;
}

function targetTabForKey(key: string): string {
  if (key.endsWith(':NEEDS_EXAMS') || key.endsWith(':READY_RECEIVE')) return 'lab-requests';
  if (key.endsWith(':AT_CASHIER')) return 'payments';
  if (key.endsWith(':IN_TESTING')) return 'testing-queue';
  if (key.endsWith(':COMPLETED')) return 'coa-reports';
  return 'lab-requests';
}

function typeForKey(key: string): NotificationType {
  if (key.endsWith(':NEEDS_EXAMS')) return 'NEW_REQUEST';
  if (key.endsWith(':AT_CASHIER')) return 'NEW_REQUEST';
  if (key.endsWith(':READY_RECEIVE')) return 'PAYMENT_SETTLED';
  if (key.endsWith(':IN_TESTING')) return 'ACCESSIONED';
  if (key.endsWith(':COMPLETED')) return 'RESULTS_READY';
  return 'NEW_REQUEST';
}

export function buildPipelineNotification(
  req: LabTestRequisition,
  workflowKey: string
): Omit<LimsNotification, 'id' | 'timestamp' | 'read'> {
  const patient = req.patientOrSubjectName || 'Patient';
  const caseLabel = req.caseNo || req.requisitionNumber || '—';
  const category = req.patientCategory || 'OPD';

  let title = 'Request update';
  let message = `${patient} (${caseLabel})`;

  if (workflowKey.endsWith(':NEEDS_EXAMS')) {
    title = 'Info desk intake — select examinations';
    message = `${patient} · ${caseLabel} · ${category} — filed by Information Staff. Laboratory must order examinations.`;
  } else if (workflowKey.endsWith(':AT_CASHIER')) {
    title = 'OPD waiting at cashier';
    message = `${patient} · ${caseLabel} — examinations ordered. Patient needs official receipt (OR) at cashier.`;
  } else if (workflowKey.endsWith(':READY_RECEIVE')) {
    title = 'Ready to receive specimen';
    message = `${patient} · ${caseLabel} — O.R. recorded. Laboratory can receive and accession.`;
  } else if (workflowKey.endsWith(':IN_TESTING')) {
    title = 'Specimen in testing';
    message = `${patient} · ${caseLabel} — received in laboratory. Enter or finalize results on Testing queue.`;
  } else if (workflowKey.endsWith(':COMPLETED')) {
    title = 'Results completed';
    message = `${patient} · ${caseLabel} — analytical results released. Report available for print/pickup.`;
  }

  return {
    type: typeForKey(workflowKey),
    title,
    message,
    priority: req.priority || 'ROUTINE',
    reqId: req.id,
    caseNo: req.caseNo || req.requisitionNumber,
    patientName: patient,
    targetTab: targetTabForKey(workflowKey),
    pipelineFilter: pipelineFilterForKey(workflowKey),
    workflowKey,
    audience: audienceForWorkflowKey(workflowKey),
  };
}

export function notificationVisibleToRole(notif: LimsNotification, role: AppRole | null): boolean {
  if (!role) return true;
  if (!notif.audience?.length) return true;
  return notif.audience.includes(role);
}

export function filterNotificationsForRole(
  list: LimsNotification[],
  role: AppRole | null
): LimsNotification[] {
  return list.filter((n) => notificationVisibleToRole(n, role));
}

/** Add pipeline alerts for open work not yet announced (shared browser / new lab session). */
export function reconcilePipelineNotifications(
  requisitions: LabTestRequisition[],
  existing: LimsNotification[]
): LimsNotification[] {
  const knownKeys = new Set(
    existing.map((n) => n.workflowKey).filter(Boolean) as string[]
  );
  const additions: LimsNotification[] = [];
  const now = Date.now();

  for (const req of requisitions) {
    const key = workflowKeyForRequisition(req);
    if (!key || knownKeys.has(key)) continue;
    knownKeys.add(key);
    const payload = buildPipelineNotification(req, key);
    const isCompleted = key.endsWith(':COMPLETED');
    additions.push({
      ...payload,
      id: `notif-sync-${now}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: 'Synced',
      read: isCompleted,
    });
  }

  if (!additions.length) return existing;
  return trimNotificationList([...additions, ...existing]);
}

export function trimNotificationList(list: LimsNotification[]): LimsNotification[] {
  if (list.length <= MAX_STORED) return list;
  const read = list.filter((n) => n.read);
  const unread = list.filter((n) => !n.read);
  const trimmed = [...unread, ...read].slice(0, MAX_STORED);
  return trimmed;
}

export function dedupeByWorkflowKey(
  incoming: Omit<LimsNotification, 'id' | 'timestamp' | 'read'>,
  existing: LimsNotification[]
): boolean {
  if (!incoming.workflowKey) return false;
  return existing.some((n) => n.workflowKey === incoming.workflowKey);
}
