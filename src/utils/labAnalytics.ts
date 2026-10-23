import { LabTestRequisition, Sample } from '../types/lims';
import {
  examinationList,
  hasOfficialReceipt,
  needsLaboratoryExamSelection,
  readyForCashierSettlement,
  readyForLaboratory,
  requestTrackingPhase,
  requiresCashier,
} from '../data/requestDesk';

export interface CountRow {
  key: string;
  label: string;
  count: number;
}

export interface DailyVolumeRow {
  day: string;
  label: string;
  count: number;
}

export interface LabAnalyticsSnapshot {
  generatedAt: string;
  totals: {
    all: number;
    submitted: number;
    inTesting: number;
    completed: number;
    cancelled: number;
  };
  pipeline: {
    infoDeskIntake: number;
    atCashier: number;
    readyToReceive: number;
    inTesting: number;
    completed: number;
    other: number;
  };
  byCategory: CountRow[];
  byPriority: CountRow[];
  topExaminations: CountRow[];
  dailyVolume: DailyVolumeRow[];
  specimens: {
    total: number;
    accessioned: number;
    inTestingStatus: number;
  };
  opd: {
    total: number;
    withOr: number;
    awaitingOr: number;
  };
  completionRatePct: number;
  avgExamsPerRequest: number;
  thisWeek: number;
  thisMonth: number;
}

function dayKey(value?: string): string {
  return (value || '').slice(0, 10);
}

function formatDayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day || '—';
  return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function computeLabAnalytics(
  requisitions: LabTestRequisition[],
  samples: Sample[]
): LabAnalyticsSnapshot {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const totals = {
    all: requisitions.length,
    submitted: 0,
    inTesting: 0,
    completed: 0,
    cancelled: 0,
  };

  const pipeline = {
    infoDeskIntake: 0,
    atCashier: 0,
    readyToReceive: 0,
    inTesting: 0,
    completed: 0,
    other: 0,
  };

  let examCount = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  const categoryMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();
  const examMap = new Map<string, number>();
  const dailyMap = new Map<string, number>();

  let opdTotal = 0;
  let opdWithOr = 0;
  let opdAwaiting = 0;

  for (const req of requisitions) {
    const dk = dayKey(req.requestDate);
    if (dk) dailyMap.set(dk, (dailyMap.get(dk) || 0) + 1);
    if (dk >= weekStart) thisWeek += 1;
    if (dk >= monthStart) thisMonth += 1;

    const cat = req.patientCategory || 'Unspecified';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    const pri = req.priority || 'ROUTINE';
    priorityMap.set(pri, (priorityMap.get(pri) || 0) + 1);

    for (const name of examinationList(req)) {
      examCount += 1;
      const key = name.trim();
      if (key) examMap.set(key, (examMap.get(key) || 0) + 1);
    }

    if (req.status === 'SUBMITTED') totals.submitted += 1;
    else if (req.status === 'IN_TESTING' || req.status === 'RECEIVED') totals.inTesting += 1;
    else if (req.status === 'COMPLETED') totals.completed += 1;
    else if (req.status === 'CANCELLED') totals.cancelled += 1;

    const phase = requestTrackingPhase(req);
    if (phase === 'NEEDS_EXAMS') pipeline.infoDeskIntake += 1;
    else if (phase === 'AT_CASHIER') pipeline.atCashier += 1;
    else if (phase === 'READY_RECEIVE') pipeline.readyToReceive += 1;
    else if (phase === 'IN_TESTING') pipeline.inTesting += 1;
    else if (phase === 'COMPLETED') pipeline.completed += 1;
    else pipeline.other += 1;

    if (requiresCashier(req.patientCategory)) {
      opdTotal += 1;
      if (hasOfficialReceipt(req.orNumber)) opdWithOr += 1;
      if (readyForCashierSettlement(req)) opdAwaiting += 1;
    }
  }

  const last14: DailyVolumeRow[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last14.push({
      day: key,
      label: formatDayLabel(key),
      count: dailyMap.get(key) || 0,
    });
  }

  const sortRows = (map: Map<string, number>): CountRow[] =>
    [...map.entries()]
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);

  const topExaminations = sortRows(examMap).slice(0, 12);
  const finished = totals.completed;
  const completionRatePct =
    requisitions.length > 0 ? Math.round((finished / requisitions.length) * 1000) / 10 : 0;

  const specimenTesting = samples.filter(
    (s) => s.status === 'TESTING' || s.status === 'ACCESSIONED' || s.status === 'RECEIVED'
  ).length;

  return {
    generatedAt: now.toISOString(),
    totals,
    pipeline,
    byCategory: sortRows(categoryMap),
    byPriority: sortRows(priorityMap),
    topExaminations,
    dailyVolume: last14,
    specimens: {
      total: samples.length,
      accessioned: samples.filter((s) => s.status === 'ACCESSIONED' || s.status === 'RECEIVED').length,
      inTestingStatus: specimenTesting,
    },
    opd: {
      total: opdTotal,
      withOr: opdWithOr,
      awaitingOr: opdAwaiting,
    },
    completionRatePct,
    avgExamsPerRequest:
      requisitions.length > 0 ? Math.round((examCount / requisitions.length) * 10) / 10 : 0,
    thisWeek,
    thisMonth,
  };
}

/** Requests still on the lab desk before testing completes. */
export function activePipelineCount(requisitions: LabTestRequisition[]): number {
  return requisitions.filter(
    (r) =>
      r.status === 'SUBMITTED' ||
      r.status === 'RECEIVED' ||
      r.status === 'IN_TESTING' ||
      needsLaboratoryExamSelection(r) ||
      readyForLaboratory(r)
  ).length;
}
