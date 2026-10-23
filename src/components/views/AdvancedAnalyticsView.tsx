import React, { useMemo } from 'react';
import {
  BarChart3,
  ClipboardList,
  FileDown,
  Layers,
  PieChart,
  Printer,
  TestTubes,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { LabTestRequisition, Sample } from '../../types/lims';
import { computeLabAnalytics, CountRow } from '../../utils/labAnalytics';

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
        <HorizontalBar key={row.key} label={row.label} count={row.count} max={max} tone="bg-[#0176d3]" />
      ))}
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-0.5">{value}</p>
          {hint ? <p className="text-[11px] text-slate-500 mt-1">{hint}</p> : null}
        </div>
        <div className={`p-2 rounded-lg ${accent}`}>{icon}</div>
      </div>
    </article>
  );
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  requisitions,
  samples,
  onNavigate,
}) => {
  const snapshot = useMemo(
    () => computeLabAnalytics(requisitions, samples),
    [requisitions, samples]
  );

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
    { key: 'info', label: 'Info desk — select exams', count: snapshot.pipeline.infoDeskIntake },
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

  return (
    <div className="lims-page-shell space-y-4 analytics-print-root">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-[#0176d3]">
            <BarChart3 className="w-5 h-5" />
            <h1 className="text-lg font-semibold text-slate-900">Advanced analytics &amp; reports</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Operational KPIs, request pipeline, examination mix, and volume trends from live desk data.
            Updated {generatedLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print report pack
          </button>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate('all-requests')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0176d3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#014486]"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Open all requests
            </button>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard
          title="Total requests"
          value={snapshot.totals.all}
          hint={`${snapshot.thisWeek} this week · ${snapshot.thisMonth} this month`}
          icon={<Layers className="w-4 h-4 text-slate-700" />}
          accent="bg-slate-100"
        />
        <KpiCard
          title="Completion rate"
          value={`${snapshot.completionRatePct}%`}
          hint={`${snapshot.totals.completed} completed of ${snapshot.totals.all}`}
          icon={<TrendingUp className="w-4 h-4 text-emerald-700" />}
          accent="bg-emerald-50"
        />
        <KpiCard
          title="Avg exams / request"
          value={snapshot.avgExamsPerRequest}
          hint="Selected examinations per case"
          icon={<PieChart className="w-4 h-4 text-violet-700" />}
          accent="bg-violet-50"
        />
        <KpiCard
          title="Specimens on file"
          value={snapshot.specimens.total}
          hint={`${snapshot.specimens.accessioned} accessioned · ${snapshot.specimens.inTestingStatus} active`}
          icon={<TestTubes className="w-4 h-4 text-sky-700" />}
          accent="bg-sky-50"
        />
      </section>

      <section className="grid lg:grid-cols-2 gap-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0176d3]" />
            Request pipeline
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">
            Where open work sits from intake through completion (includes completed for context).
          </p>
          <div className="space-y-2.5">
            {pipelineRows.map((row, index) => {
              const tones = [
                'bg-amber-400',
                'bg-orange-400',
                'bg-sky-500',
                'bg-[#0176d3]',
                'bg-emerald-500',
              ];
              return (
                <HorizontalBar
                  key={row.key}
                  label={row.label}
                  count={row.count}
                  max={pipelineMax}
                  tone={tones[index] || 'bg-slate-400'}
                />
              );
            })}
          </div>
          {snapshot.pipeline.other > 0 ? (
            <p className="text-[11px] text-slate-500 mt-3">
              Other / uncategorized: {snapshot.pipeline.other}
            </p>
          ) : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0176d3]" />
            Daily request volume (14 days)
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">New lab test requests by request date.</p>
          <div className="flex items-end gap-1 h-36 pt-2">
            {snapshot.dailyVolume.map((day) => {
              const h = day.count > 0 ? Math.max(8, (day.count / volumeMax) * 100) : 4;
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[9px] tabular-nums text-slate-500">{day.count || ''}</span>
                  <div
                    className={`w-full rounded-t ${day.count ? 'bg-[#0176d3]' : 'bg-slate-200'}`}
                    style={{ height: `${h}%` }}
                    title={`${day.label}: ${day.count}`}
                  />
                  <span className="text-[8px] text-slate-400 truncate w-full text-center">{day.label}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid lg:grid-cols-3 gap-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">By patient category</h2>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">Share of all requests.</p>
          <MiniTable rows={snapshot.byCategory} emptyLabel="No requests yet." />
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">By priority</h2>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">Routine vs stat workload.</p>
          <MiniTable rows={snapshot.byPriority} emptyLabel="No priority data." />
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            OPD payment desk
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">Official receipt coverage for OPD cases.</p>
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
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Top examinations ordered</h2>
        <p className="text-[11px] text-slate-500 mt-1 mb-3">
          Most frequently selected tests across all requests (line items, not unique patients).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-normal">Examination</th>
                <th className="py-2 pr-4 font-normal w-24">Count</th>
                <th className="py-2 font-normal">Share</th>
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
      </section>

      <section className="grid lg:grid-cols-2 gap-3 print:break-inside-avoid">
        <article className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-800">
            <FileDown className="w-4 h-4" />
            <h2 className="text-sm font-semibold">Operational summary report</h2>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
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
            <li>Use Request queue when info desk intake or receive is backing up.</li>
            <li>Use Payments when OPD awaiting cashier exceeds daily target.</li>
            <li>Testing queue depth should align with in-testing pipeline count.</li>
          </ul>
        </article>

        <article className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Status distribution</h2>
          <div className="mt-3 space-y-2">
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
                        ? 'bg-[#0176d3]'
                        : 'bg-amber-400'
                }
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};
