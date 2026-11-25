import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  FileDown,
  Filter,
  Layers,
  PieChart,
  Printer,
  TestTubes,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LabTestRequisition, Sample } from '../../types/lims';
import { formatCurrency } from '../../data/examinationCatalog';
import { LimsWorkspace } from '../common/LimsWorkspace';
import { DashboardHeroArtwork } from '../common/LimsDashboardArtwork';
import {
  computeLabAnalytics,
  computeRevenueAnalytics,
  CountRow,
  DEFAULT_ANALYTICS_FILTERS,
  filterRequisitionsForAnalytics,
  REVENUE_DAILY_DEFAULT_DAYS,
  RevenueGranularity,
  type AnalyticsFilters,
} from '../../utils/labAnalytics';

interface AdvancedAnalyticsViewProps {
  requisitions: LabTestRequisition[];
  samples: Sample[];
  onNavigate?: (tab: string) => void;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function HorizontalBar({
  label,
  count,
  max,
  tone,
}: {
  label: string;
  count: number;
  max: number;
  tone: string;
}) {
  const width = max > 0 ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
        <span className="uppercase tracking-wide truncate">{label}</span>
        <span className="tabular-nums font-medium text-slate-800 shrink-0">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniTable({ rows, emptyLabel }: { rows: CountRow[]; emptyLabel: string }) {
  if (!rows.length) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }
  const max = rows[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <HorizontalBar key={row.key} label={row.label} count={row.count} max={max} tone="bg-[#0878e8]" />
      ))}
    </div>
  );
}

/** Same metric tile pattern as Home dashboard figures. */
function HomeMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconWrap,
  iconColor,
  valueClass = 'text-[var(--lims-navy)]',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  valueClass?: string;
}) {
  return (
    <article className="lims-card h-full p-4 sm:px-5 sm:py-4 shadow-sm transition-all hover:shadow-md hover:border-[#0878e8]/35">
      <div className="flex items-center gap-3 sm:gap-4 w-full min-h-[4.5rem]">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconWrap}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[var(--lims-navy)] leading-snug">
            {label}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{hint}</p>
        </div>
        <span className={`text-2xl sm:text-[1.75rem] font-bold tabular-nums leading-none shrink-0 ${valueClass}`}>
          {value}
        </span>
      </div>
    </article>
  );
}

function HomeSectionCard({
  title,
  description,
  children,
  toolbar,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <section className="lims-card overflow-hidden shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[var(--lims-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--lims-navy)]">{title}</h2>
          {description ? <p className="text-xs text-slate-500 mt-1">{description}</p> : null}
        </div>
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </div>
      <div className="p-5 flex-1 min-h-0">{children}</div>
    </section>
  );
}

function PipelineStageStrip({
  rows,
  max,
}: {
  rows: { key: string; label: string; count: number; tone: string }[];
  max: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
      {rows.map((row) => (
        <div
          key={row.key}
          className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-center"
        >
          <p className="text-lg font-bold tabular-nums text-slate-900">{row.count}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5 leading-tight">
            {PIPELINE_SHORT_LABELS[row.key] ?? row.label}
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${row.tone}`}
              style={{ width: `${max > 0 ? Math.max(6, (row.count / max) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type AnalyticsMainTab = 'operations' | 'revenue';

const MAIN_TABS: { id: AnalyticsMainTab; label: string }[] = [
  { id: 'operations', label: 'Operations' },
  { id: 'revenue', label: 'Revenue' },
];

const PIPELINE_SHORT_LABELS: Record<string, string> = {
  info: 'Lab intake',
  cashier: 'Cashier',
  ready: 'Ready',
  testing: 'Testing',
  done: 'Completed',
};

const REVENUE_PERIODS: { id: RevenueGranularity; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  requisitions,
  samples,
  onNavigate,
}) => {
  const [mainTab, setMainTab] = useState<AnalyticsMainTab>('operations');
  const [revenuePeriod, setRevenuePeriod] = useState<RevenueGranularity>('daily');
  const [filters, setFilters] = useState<AnalyticsFilters>(() => DEFAULT_ANALYTICS_FILTERS());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredRequisitions = useMemo(
    () => filterRequisitionsForAnalytics(requisitions, filters),
    [requisitions, filters]
  );

  const snapshot = useMemo(
    () => computeLabAnalytics(filteredRequisitions, samples),
    [filteredRequisitions, samples]
  );

  const revenueSnapshot = useMemo(() => {
    if (mainTab !== 'revenue') return null;
    return computeRevenueAnalytics(requisitions, revenuePeriod, filters);
  }, [requisitions, mainTab, revenuePeriod, filters]);

  const activeFilterCount = useMemo(() => {
    const defaults = DEFAULT_ANALYTICS_FILTERS();
    let n = 0;
    if (filters.category) n += 1;
    if (filters.status) n += 1;
    if (filters.priority) n += 1;
    if (filters.opdWithOrOnly) n += 1;
    if (filters.query.trim()) n += 1;
    if (filters.dateFrom !== defaults.dateFrom || filters.dateTo !== defaults.dateTo) n += 1;
    return n;
  }, [filters]);

  const generatedLabel = useMemo(() => {
    const d = new Date(snapshot.generatedAt);
    return d.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [snapshot.generatedAt]);

  const pipelineRows: CountRow[] = [
    { key: 'info', label: 'Select examinations', count: snapshot.pipeline.infoDeskIntake },
    { key: 'cashier', label: 'At cashier (OPD)', count: snapshot.pipeline.atCashier },
    { key: 'ready', label: 'Ready to receive', count: snapshot.pipeline.readyToReceive },
    { key: 'testing', label: 'In testing', count: snapshot.pipeline.inTesting },
    { key: 'done', label: 'Completed', count: snapshot.pipeline.completed },
  ].filter((r) => r.count > 0 || snapshot.totals.all > 0);

  const pipelineMax = Math.max(...pipelineRows.map((r) => r.count), 1);
  const volumeMax = Math.max(...snapshot.dailyVolume.map((d) => d.count), 1);

  const statusRows: CountRow[] = [
    { key: 'SUBMITTED', label: 'Submitted', count: snapshot.totals.submitted },
    { key: 'IN_TESTING', label: 'In testing / received', count: snapshot.totals.inTesting },
    { key: 'COMPLETED', label: 'Completed', count: snapshot.totals.completed },
    { key: 'CANCELLED', label: 'Cancelled', count: snapshot.totals.cancelled },
  ];

  const handlePrint = () => window.print();

  const pipelineStrip = pipelineRows.map((row, index) => {
    const tones = ['bg-amber-400', 'bg-orange-400', 'bg-sky-500', 'bg-[#0878e8]', 'bg-emerald-500'];
    return { ...row, tone: tones[index] || 'bg-slate-400' };
  });

  return (
    <div className="lims-page-shell space-y-4 analytics-print-root">
      <section className="lims-card relative overflow-hidden border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30 print:hidden">
        <DashboardHeroArtwork />
        <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0878e8] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-200/50">
            <BarChart3 className="w-7 h-7" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              Laboratory reporting
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">
              Advanced analytics &amp; reports
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Operational KPIs, pipeline, examination mix, and volume trends from live desk data.
            </p>
          </div>
          <div className="sm:text-right shrink-0 sm:pl-6 border-l border-[var(--lims-border)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last updated</p>
            <p className="text-sm font-semibold text-[var(--lims-navy)] mt-1">{generatedLabel}</p>
            {onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate('all-requests')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0878e8] hover:underline cursor-pointer"
              >
                Open all requests
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="print:hidden">
        <LimsWorkspace className="overflow-visible">
          <div className="px-5 py-4 border-b border-[var(--lims-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--lims-navy)]">Report scope</h2>
              <p className="text-xs text-slate-500 mt-1">
                {filteredRequisitions.length} of {requisitions.length} requests match filters
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f4f7fb] border border-[var(--lims-border)]">
                {MAIN_TABS.map((tab) => {
                  const active = mainTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMainTab(tab.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#0878e8] text-white shadow-sm'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        <div className="lims-card border-0 shadow-none rounded-none overflow-hidden border-t-0">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Filter className="w-4 h-4 text-[#0878e8]" />
              Advanced filters
              {activeFilterCount > 0 ? (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#0878e8] text-white px-1.5 py-0.5 rounded">
                  {activeFilterCount} active
                </span>
              ) : null}
            </span>
            <span className="text-[11px] text-slate-500">
              {filters.dateFrom} → {filters.dateTo}
              {filteredRequisitions.length !== requisitions.length
                ? ` · ${filteredRequisitions.length} of ${requisitions.length} requests`
                : ''}
            </span>
          </button>
          {filtersOpen ? (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 text-[11px]">
                <span className="font-semibold text-slate-600 uppercase">From date</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px]">
                <span className="font-semibold text-slate-600 uppercase">To date</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px]">
                <span className="font-semibold text-slate-600 uppercase">Patient category</span>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">All categories</option>
                  <option value="OPD">OPD</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Indigent">Indigent</option>
                  <option value="PhilHealth">PhilHealth</option>
                  <option value="Pre-Employment / Employee">Pre-Employment / Employee</option>
                  <option value="Projects">Projects</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px]">
                <span className="font-semibold text-slate-600 uppercase">Request status</span>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="RECEIVED">Received</option>
                  <option value="IN_TESTING">In testing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px]">
                <span className="font-semibold text-slate-600 uppercase">Priority</span>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">All priorities</option>
                  <option value="ROUTINE">Routine</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="STAT">Stat</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] sm:col-span-2">
                <span className="font-semibold text-slate-600 uppercase">Search</span>
                <input
                  type="search"
                  value={filters.query}
                  placeholder="Patient, case, OR, requisition no., facility…"
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-[11px] sm:col-span-2 lg:col-span-1 self-end pb-2">
                <input
                  type="checkbox"
                  checked={filters.opdWithOrOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, opdWithOrOnly: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span className="text-slate-700">OPD with official receipt only (paid)</span>
              </label>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_ANALYTICS_FILTERS())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset filters
                </button>
              </div>
            </div>
          ) : null}
        </div>
        </LimsWorkspace>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="relative overflow-hidden w-full text-left rounded-xl bg-gradient-to-r from-[var(--lims-navy)] via-[#0c2d55] to-[#0a2240] hover:from-[#0c2d55] hover:to-[#081a33] text-white shadow-md px-5 py-4 flex items-center justify-between gap-4 cursor-pointer border border-[#0a2240] print:hidden"
      >
        <span className="relative z-[1] flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-sky-200" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold">Print report pack</span>
            <span className="block text-sm text-slate-300 mt-0.5">
              Management summary of KPIs, pipeline, and examination mix for the current filter.
            </span>
          </span>
        </span>
        <span className="relative z-[1] inline-flex items-center gap-2 text-sm font-semibold bg-white text-[var(--lims-navy)] px-4 py-2 rounded-lg shrink-0 shadow-sm">
          Print
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>

      {revenueSnapshot ? (
        <section className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <HomeMetricCard
              label="Gross revenue"
              value={formatCurrency(revenueSnapshot.totalAmount)}
              hint={`${revenueSnapshot.totalRequests} billable request(s) in range`}
              icon={Wallet}
              iconWrap="bg-emerald-50"
              iconColor="text-emerald-600"
              valueClass="text-emerald-700"
            />
            <HomeMetricCard
              label="Avg revenue / request"
              value={
                revenueSnapshot.totalRequests > 0
                  ? formatCurrency(revenueSnapshot.totalAmount / revenueSnapshot.totalRequests)
                  : formatCurrency(0)
              }
              hint="Examination tariff by patient category"
              icon={TrendingUp}
              iconWrap="bg-sky-50"
              iconColor="text-[#0878e8]"
            />
            <HomeMetricCard
              label="Requests in filter"
              value={filteredRequisitions.length}
              hint={`Of ${requisitions.length} total in system`}
              icon={Layers}
              iconWrap="bg-slate-100"
              iconColor="text-slate-700"
            />
          </div>
          <HomeSectionCard
            title={
              revenuePeriod === 'daily'
                ? `Daily revenue (last ${REVENUE_DAILY_DEFAULT_DAYS} days)`
                : revenuePeriod === 'weekly'
                  ? 'Weekly revenue'
                  : revenuePeriod === 'monthly'
                    ? 'Monthly revenue'
                    : 'Annual revenue'
            }
            description={`${filters.dateFrom} → ${filters.dateTo}. Catalog fees by request date.`}
            toolbar={
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f4f7fb] border border-[var(--lims-border)]">
                {REVENUE_PERIODS.map((p) => {
                  const active = revenuePeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRevenuePeriod(p.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            }
          >
            <p className="text-[11px] text-emerald-800 font-medium mb-4 tabular-nums -mt-1">
              {revenuePeriod === 'daily' ? (
                <>
                  Last {REVENUE_DAILY_DEFAULT_DAYS} days in chart:{' '}
                  {formatCurrency(revenueSnapshot.buckets.reduce((s, b) => s + b.amount, 0))} · Full filter
                  gross: {formatCurrency(revenueSnapshot.totalAmount)}
                </>
              ) : (
                <>
                  Chart &amp; table total:{' '}
                  {formatCurrency(revenueSnapshot.buckets.reduce((s, b) => s + b.amount, 0))} (matches gross
                  revenue above)
                </>
              )}
            </p>
            {revenueSnapshot.buckets.every((b) => b.amount === 0) ? (
              <p className="text-sm text-slate-500 py-8 text-center">No billable revenue in this period.</p>
            ) : (
              <>
                <div className="flex items-end gap-1 h-44 pt-2">
                  {(() => {
                    const max = Math.max(...revenueSnapshot.buckets.map((b) => b.amount), 1);
                    return revenueSnapshot.buckets.map((bucket) => {
                      const h = bucket.amount > 0 ? Math.max(8, (bucket.amount / max) * 100) : 4;
                      return (
                        <div key={bucket.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <span className="text-[8px] tabular-nums text-slate-500 truncate w-full text-center">
                            {bucket.amount > 0 ? formatCurrency(bucket.amount) : ''}
                          </span>
                          <div
                            className={`w-full rounded-t ${bucket.amount ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            style={{ height: `${h}%` }}
                            title={`${bucket.label}: ${formatCurrency(bucket.amount)} (${bucket.requestCount} req.)`}
                          />
                          <span className="text-[8px] text-slate-400 truncate w-full text-center">
                            {bucket.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-4 font-normal">Period</th>
                        <th className="py-2 pr-4 font-normal w-28">Requests</th>
                        <th className="py-2 font-normal text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...revenueSnapshot.buckets].reverse().map((bucket) => (
                        <tr key={bucket.key} className="border-b border-slate-50">
                          <td className="py-2 pr-4 text-slate-800">{bucket.label}</td>
                          <td className="py-2 pr-4 tabular-nums">{bucket.requestCount}</td>
                          <td className="py-2 text-right tabular-nums font-medium text-emerald-800">
                            {formatCurrency(bucket.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </HomeSectionCard>
        </section>
      ) : null}

      {mainTab === 'operations' ? (
      <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <HomeMetricCard
          label="Total requests"
          value={snapshot.totals.all}
          hint={`${snapshot.thisWeek} this week · ${snapshot.thisMonth} this month`}
          icon={Layers}
          iconWrap="bg-slate-100"
          iconColor="text-slate-700"
        />
        <HomeMetricCard
          label="Completion rate"
          value={`${snapshot.completionRatePct}%`}
          hint={`${snapshot.totals.completed} completed of ${snapshot.totals.all}`}
          icon={TrendingUp}
          iconWrap="bg-emerald-50"
          iconColor="text-emerald-600"
          valueClass="text-emerald-600"
        />
        <HomeMetricCard
          label="Avg exams / request"
          value={snapshot.avgExamsPerRequest}
          hint="Selected examinations per case"
          icon={PieChart}
          iconWrap="bg-violet-50"
          iconColor="text-violet-600"
        />
        <HomeMetricCard
          label="Specimens on file"
          value={snapshot.specimens.total}
          hint={`${snapshot.specimens.accessioned} accessioned · ${snapshot.specimens.inTestingStatus} active`}
          icon={TestTubes}
          iconWrap="bg-sky-50"
          iconColor="text-sky-600"
        />
      </section>

      <section className="grid xl:grid-cols-12 gap-3 items-stretch">
        <div className="xl:col-span-7">
          <HomeSectionCard title="Request pipeline" description="Open work from intake through completion.">
            <PipelineStageStrip rows={pipelineStrip} max={pipelineMax} />
            <div className="space-y-2.5">
              {pipelineRows.map((row, index) => (
                <HorizontalBar
                  key={row.key}
                  label={row.label}
                  count={row.count}
                  max={pipelineMax}
                  tone={pipelineStrip[index]?.tone || 'bg-slate-400'}
                />
              ))}
            </div>
            {snapshot.pipeline.other > 0 ? (
              <p className="text-[11px] text-slate-500 mt-3">Other / uncategorized: {snapshot.pipeline.other}</p>
            ) : null}
          </HomeSectionCard>
        </div>
        <div className="xl:col-span-5">
          <HomeSectionCard title="Daily request volume" description="New requests by date — last 14 days.">
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex items-end gap-1.5 h-40 pt-2 min-w-[360px]">
                {snapshot.dailyVolume.map((day) => {
                  const h = day.count > 0 ? Math.max(10, (day.count / volumeMax) * 100) : 6;
                  return (
                    <div key={day.day} className="flex flex-col items-center gap-1 w-9 shrink-0">
                      <span className="text-[9px] tabular-nums font-medium text-slate-600 min-h-[12px]">
                        {day.count || ''}
                      </span>
                      <div className="w-full h-28 flex items-end">
                        <div
                          className={`w-full rounded-t-md ${day.count ? 'bg-[#0878e8]' : 'bg-slate-200'}`}
                          style={{ height: `${h}%` }}
                          title={`${day.label}: ${day.count}`}
                        />
                      </div>
                      <span
                        className="text-[8px] font-medium text-slate-500 text-center leading-tight w-full"
                        title={day.label}
                      >
                        {day.label.replace(/^\d{4}-/, '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </HomeSectionCard>
        </div>
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        <HomeSectionCard title="By patient category" description="Share of filtered requests.">
          <MiniTable rows={snapshot.byCategory} emptyLabel="No requests yet." />
        </HomeSectionCard>
        <HomeSectionCard title="By priority" description="Routine vs stat workload.">
          <MiniTable rows={snapshot.byPriority} emptyLabel="No priority data." />
        </HomeSectionCard>
        <HomeSectionCard
          title="OPD payment desk"
          description="Official receipt coverage for OPD cases."
        >
          <ul className="space-y-2 text-[11px]">
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="uppercase text-slate-600">OPD requests</span>
              <span className="font-semibold tabular-nums">{snapshot.opd.total}</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="uppercase text-slate-600">With O.R. number</span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {snapshot.opd.withOr} ({pct(snapshot.opd.withOr, snapshot.opd.total)}%)
              </span>
            </li>
            <li className="flex justify-between">
              <span className="uppercase text-slate-600">Awaiting cashier</span>
              <span className="font-semibold tabular-nums text-amber-700">{snapshot.opd.awaitingOr}</span>
            </li>
          </ul>
        </HomeSectionCard>
      </section>

      <HomeSectionCard
        title="Top examinations ordered"
        description="Most frequently selected tests (line items, not unique patients)."
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[28rem] text-left text-[11px]">
            <thead>
              <tr className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-[var(--lims-border)]">
                <th className="px-3 py-3 font-semibold">Examination</th>
                <th className="px-3 py-3 font-semibold w-24">Count</th>
                <th className="px-3 py-3 font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.topExaminations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-500">
                    No examinations recorded on requests yet.
                  </td>
                </tr>
              ) : (
                snapshot.topExaminations.map((row) => {
                  const examTotal = snapshot.topExaminations.reduce((s, r) => s + r.count, 0);
                  return (
                    <tr key={row.key} className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-slate-800 uppercase">{row.label}</td>
                      <td className="py-2 pr-4 tabular-nums font-medium">{row.count}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-[120px]">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${pct(row.count, examTotal)}%` }}
                            />
                          </div>
                          <span className="text-slate-500 tabular-nums">{pct(row.count, examTotal)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </HomeSectionCard>

      <section className="grid lg:grid-cols-2 gap-3 print:break-inside-avoid">
        <article className="lims-card border-dashed border-[var(--lims-border)] bg-gradient-to-br from-slate-50 to-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--lims-border)] bg-white/80">
            <h2 className="text-base font-semibold text-[var(--lims-navy)]">Operational summary</h2>
          </div>
          <div className="p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            <div>
              <dt className="uppercase text-slate-500">Active pipeline</dt>
              <dd className="font-semibold text-slate-900">
                {snapshot.pipeline.infoDeskIntake +
                  snapshot.pipeline.atCashier +
                  snapshot.pipeline.readyToReceive +
                  snapshot.pipeline.inTesting}
              </dd>
            </div>
            <div>
              <dt className="uppercase text-slate-500">Completed</dt>
              <dd className="font-semibold text-slate-900">{snapshot.totals.completed}</dd>
            </div>
            <div>
              <dt className="uppercase text-slate-500">Submitted (open)</dt>
              <dd className="font-semibold text-slate-900">{snapshot.totals.submitted}</dd>
            </div>
            <div>
              <dt className="uppercase text-slate-500">Cancelled</dt>
              <dd className="font-semibold text-slate-900">{snapshot.totals.cancelled}</dd>
            </div>
          </dl>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-600 list-disc pl-4">
            <li>Use Lab intake when filing or receiving is backing up.</li>
            <li>Use Payments when OPD awaiting cashier exceeds daily target.</li>
            <li>Enter results should match the in-testing count.</li>
          </ul>
          </div>
        </article>

        <HomeSectionCard title="Status distribution" description="Submitted through completed.">
          <div className="space-y-2 -mt-1">
            {statusRows.map((row) => (
              <HorizontalBar
                key={row.key}
                label={row.label}
                count={row.count}
                max={snapshot.totals.all || 1}
                tone={
                  row.key === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : row.key === 'CANCELLED'
                      ? 'bg-slate-400'
                      : row.key === 'IN_TESTING'
                        ? 'bg-[#0878e8]'
                        : 'bg-amber-400'
                }
              />
            ))}
          </div>
        </HomeSectionCard>
      </section>
      </>
      ) : null}
    </div>
  );
};
