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
import { findCatalogExamination, getExaminationPrice } from '../data/examinationCatalog';

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

export type RevenueGranularity = 'daily' | 'weekly' | 'monthly' | 'annual';

/** Default number of day columns on Revenue → Daily (within advanced filter range). */
export const REVENUE_DAILY_DEFAULT_DAYS = 10;

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
  priority: string;
  opdWithOrOnly: boolean;
  query: string;
}

export interface RevenueBucket {
  key: string;
  label: string;
  amount: number;
  requestCount: number;
}

export interface RevenueSnapshot {
  buckets: RevenueBucket[];
  totalAmount: number;
  totalRequests: number;
  granularity: RevenueGranularity;
}

export const DEFAULT_ANALYTICS_FILTERS = (): AnalyticsFilters => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    category: '',
    status: '',
    priority: '',
    opdWithOrOnly: false,
    query: '',
  };
};

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
  return (value || '').trim().slice(0, 10);
}

function parseLocalDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatLocalDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysToKey(day: string, delta: number): string {
  const d = parseLocalDay(day);
  d.setDate(d.getDate() + delta);
  return formatLocalDay(d);
}

function eachDayInRange(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const days: string[] = [];
  let cur = from;
  while (cur <= to) {
    days.push(cur);
    cur = addDaysToKey(cur, 1);
  }
  return days;
}

function clampRange(from: string, to: string): { from: string; to: string } {
  const today = formatLocalDay(new Date());
  const f = from || addDaysToKey(today, -89);
  const t = to || today;
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

function formatDayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day || '—';
  return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function startOfWeekLocal(day: string): string {
  const d = parseLocalDay(day);
  const dow = d.getDay();
  const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
  d.setDate(diff);
  return formatLocalDay(d);
}

function startOfWeek(date: Date): string {
  return startOfWeekLocal(formatLocalDay(date));
}

function startOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthKey(day: string): string {
  return day.slice(0, 7);
}

function yearKey(day: string): string {
  return day.slice(0, 4);
}

/** Monday of ISO week — stable bucket id for weekly revenue */
function weekKey(day: string): string {
  return startOfWeekLocal(day);
}

function formatWeekLabel(weekStart: string): string {
  const start = parseLocalDay(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const a = start.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const b = end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${a} – ${b}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: 'short', year: 'numeric' });
}

export function requisitionBillableTotal(req: LabTestRequisition): number {
  return examinationList(req).reduce((sum, name) => {
    const item = findCatalogExamination(name);
    return sum + (item ? getExaminationPrice(item, req.patientCategory) : 0);
  }, 0);
}

export function isRevenueEligible(req: LabTestRequisition, opdWithOrOnly: boolean): boolean {
  if (req.status === 'CANCELLED') return false;
  if (!examinationList(req).length) return false;
  if (opdWithOrOnly && requiresCashier(req.patientCategory) && !hasOfficialReceipt(req.orNumber)) {
    return false;
  }
  return true;
}

export function filterRequisitionsForAnalytics(
  requisitions: LabTestRequisition[],
  filters: AnalyticsFilters
): LabTestRequisition[] {
  const q = filters.query.trim().toLowerCase();
  const { from, to } = clampRange(filters.dateFrom, filters.dateTo);
  return requisitions.filter((req) => {
    const dk = dayKey(req.requestDate);
    if (!dk) return false;
    if (dk < from) return false;
    if (dk > to) return false;
    if (filters.category && (req.patientCategory || '') !== filters.category) return false;
    if (filters.status && req.status !== filters.status) return false;
    if (filters.priority && (req.priority || 'ROUTINE') !== filters.priority) return false;
    if (filters.opdWithOrOnly && !isRevenueEligible(req, true)) return false;
    if (q) {
      const hay = [
        req.patientOrSubjectName,
        req.caseNo,
        req.requisitionNumber,
        req.orNumber,
        req.organizationOrClient,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function periodKeysInRange(
  from: string,
  to: string,
  granularity: RevenueGranularity
): string[] {
  const days = eachDayInRange(from, to);
  if (!days.length) return [];

  if (granularity === 'daily') return days;

  const ordered = new Set<string>();
  for (const day of days) {
    if (granularity === 'weekly') ordered.add(weekKey(day));
    else if (granularity === 'monthly') ordered.add(monthKey(day));
    else ordered.add(yearKey(day));
  }
  return [...ordered].sort();
}

function bucketKeyForDay(day: string, granularity: RevenueGranularity): string {
  if (granularity === 'daily') return day;
  if (granularity === 'weekly') return weekKey(day);
  if (granularity === 'monthly') return monthKey(day);
  return yearKey(day);
}

export function computeRevenueAnalytics(
  requisitions: LabTestRequisition[],
  granularity: RevenueGranularity,
  filters: AnalyticsFilters
): RevenueSnapshot {
  const { from, to } = clampRange(filters.dateFrom, filters.dateTo);
  const eligible = filterRequisitionsForAnalytics(requisitions, filters).filter((req) =>
    isRevenueEligible(req, filters.opdWithOrOnly)
  );

  const bucketMap = new Map<string, { amount: number; requestCount: number }>();
  let totalAmount = 0;

  for (const req of eligible) {
    const dk = dayKey(req.requestDate);
    if (!dk) continue;
    const amount = requisitionBillableTotal(req);
    totalAmount += amount;
    const key = bucketKeyForDay(dk, granularity);

    const cur = bucketMap.get(key) || { amount: 0, requestCount: 0 };
    cur.amount += amount;
    cur.requestCount += 1;
    bucketMap.set(key, cur);
  }

  let windowKeys = periodKeysInRange(from, to, granularity);
  if (granularity === 'daily') {
    const allDays = windowKeys;
    windowKeys = allDays.length > REVENUE_DAILY_DEFAULT_DAYS ? allDays.slice(-REVENUE_DAILY_DEFAULT_DAYS) : allDays;
  }

  const buckets: RevenueBucket[] = windowKeys.map((key) => {
    const row = bucketMap.get(key) || { amount: 0, requestCount: 0 };
    let label = formatDayLabel(key);
    if (granularity === 'weekly') label = formatWeekLabel(key);
    else if (granularity === 'monthly') label = formatMonthLabel(key);
    else if (granularity === 'annual') label = key;
    return {
      key,
      label,
      amount: Math.round(row.amount * 100) / 100,
      requestCount: row.requestCount,
    };
  });

  return {
    buckets,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalRequests: eligible.length,
    granularity,
  };
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
    const key = formatLocalDay(d);
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
