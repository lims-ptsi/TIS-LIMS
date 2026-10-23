import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  Receipt,
  ScrollText,
  Stethoscope,
  TestTubes,
} from 'lucide-react';
import { LabTestRequisition } from '../../types/lims';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, APP_TAGLINE } from '../brand/LabTisBrand';
import { APP_ROLES, AppRole, canOpenTab, isAppRole, roleLabel } from '../../data/roleAccess';
import {
  onLabRequestDesk,
  onTestingDesk,
  readyForLaboratory,
  requiresCashier,
  submittedNextDeskLabel,
  waitingAtCashier,
} from '../../data/requestDesk';
import { isAwaitingPatientPickup } from '../../utils/resultsPickup';

interface HomeDashboardViewProps {
  requisitions: LabTestRequisition[];
  onNavigate: (tab: string) => void;
  onOpenRequest?: (requisition: LabTestRequisition) => void;
}

interface DeskAction {
  tab: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  RECEIVED: 'Received',
  IN_TESTING: 'In testing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: 'bg-amber-50 text-amber-800 border-amber-200',
  RECEIVED: 'bg-sky-50 text-sky-800 border-sky-200',
  IN_TESTING: 'bg-blue-50 text-[#014486] border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const FIGURE_ACCENT: Record<string, string> = {
  'Requests today': 'bg-slate-300',
  'Waiting for receipt': 'bg-amber-400',
  'Waiting to receive': 'bg-sky-500',
  'In testing': 'bg-[#0176d3]',
  'Ready to print': 'bg-emerald-500',
  'Awaiting pickup': 'bg-violet-500',
};

function todayKey(date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function requestDayKey(value?: string): string {
  return (value || '').slice(0, 10);
}

/** Calendar week (Monday–Sunday) containing `ref`. */
function startOfWeek(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const weekday = d.getDay();
  const daysFromMonday = (weekday + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDateInSameWeek(dayKey: string, ref: Date): boolean {
  const [year, month, date] = dayKey.split('-').map(Number);
  if (!year || !month || !date) return false;
  const itemDate = new Date(year, month - 1, date);
  const weekStart = startOfWeek(ref);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return itemDate >= weekStart && itemDate <= weekEnd;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatRequestDate(value: string): string {
  const day = (value || '').slice(0, 10);
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return '—';
  return new Date(year, month - 1, date).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function examSummary(item: LabTestRequisition): string {
  const names = item.selectedTestNames?.length ? item.selectedTestNames : item.kindOfExamination || [];
  if (!names.length) return '—';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  requisitions,
  onNavigate,
  onOpenRequest,
}) => {
  const { user } = useAuth();
  const role: AppRole | null = isAppRole(user?.roleType) ? user.roleType : null;
  const [now, setNow] = useState(() => new Date());
  const [requestListTab, setRequestListTab] = useState<'all' | 'week' | 'today'>('all');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = (user?.name || 'there').trim();
  const roleText = APP_ROLES.find((item) => item.id === role)?.description || 'Choose the desk you need.';
  const hideExaminations = role === 'STAFF';
  const today = todayKey(now);

  const todayCount = requisitions.filter((item) => (item.requestDate || '').slice(0, 10) === today).length;
  const labRequestPipeline = requisitions.filter((item) => onLabRequestDesk(item)).length;
  const readyToReceive = requisitions.filter(
    (item) =>
      item.status === 'SUBMITTED' &&
      readyForLaboratory(item) &&
      requiresCashier(item.patientCategory)
  ).length;
  const inTesting = requisitions.filter(
    (item) => item.status === 'IN_TESTING' || item.status === 'RECEIVED'
  ).length;
  const completed = requisitions.filter((item) => item.status === 'COMPLETED').length;
  const awaitingPickup = requisitions.filter((item) => isAwaitingPatientPickup(item)).length;
  const unpaid = requisitions.filter((item) => waitingAtCashier(item)).length;

  const open = (tab: string) => {
    if (canOpenTab(role || undefined, tab)) onNavigate(tab);
  };

  const actions: DeskAction[] = [
    {
      tab: 'create-request',
      title: 'New lab test request',
      detail: 'Register the patient and the examinations.',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      tab: 'all-requests',
      title: 'All requests',
      detail: 'Track every request from intake to completion.',
      icon: <ScrollText className="w-4 h-4" />,
    },
    {
      tab: 'analytics-reports',
      title: 'Analytics & reports',
      detail: 'Pipeline KPIs, volume trends, and examination mix.',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      tab: 'payments',
      title: 'Payment desk',
      detail: 'Assign the official receipt.',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      tab: 'lab-requests',
      title: 'Request queue',
      detail: 'Intake, order tests, and receive specimens.',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      tab: 'samples',
      title: 'Specimen labels',
      detail: 'Print the QR code.',
      icon: <TestTubes className="w-4 h-4" />,
    },
    {
      tab: 'patient-records',
      title: 'Patient records',
      detail: 'Full visit history and linked specimens.',
      icon: <ScrollText className="w-4 h-4" />,
    },
    {
      tab: 'result-forms',
      title: 'Result forms',
      detail: 'Open the paper form for an examination.',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      tab: 'coa-reports',
      title: 'Print results',
      detail: 'Open a released laboratory report.',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      tab: 'examinations',
      title: 'Examinations',
      detail: 'Catalog and prices.',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      tab: 'result-templates',
      title: 'Result templates',
      detail: 'Fields used when a result is entered.',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      tab: 'audit-trail',
      title: 'Audit trail',
      detail: 'Who changed a request or a result.',
      icon: <ScrollText className="w-4 h-4" />,
    },
  ].filter((action) => canOpenTab(role || undefined, action.tab) && action.tab !== 'home');

  const recentSource = role === 'CASHIER'
    ? requisitions.filter((item) => requiresCashier(item.patientCategory))
    : role === 'LAB_STAFF'
      ? requisitions.filter((item) => onLabRequestDesk(item) || onTestingDesk(item))
      : requisitions;

  const sortedRequests = [...recentSource].sort((a, b) =>
    (b.requestDate || '').localeCompare(a.requestDate || '')
  );
  const allRequests = sortedRequests;
  const weekRequests = sortedRequests.filter((item) =>
    isDateInSameWeek(requestDayKey(item.requestDate), now)
  );
  const todayRequests = sortedRequests.filter(
    (item) => requestDayKey(item.requestDate) === today
  );

  const requestListTabs = [
    { key: 'all' as const, label: 'All requests', count: allRequests.length },
    { key: 'week' as const, label: 'This week', count: weekRequests.length },
    { key: 'today' as const, label: 'Today', count: todayRequests.length },
  ];

  const activeRequestList =
    requestListTab === 'today'
      ? todayRequests
      : requestListTab === 'week'
        ? weekRequests
        : allRequests;

  const figures: { label: string; value: number; tab?: string; hint: string }[] = [
    { label: 'Requests today', value: todayCount, hint: 'Filed with today’s date' },
    { label: 'Waiting for receipt', value: unpaid, tab: 'payments', hint: 'OPD official receipt still open' },
    { label: 'Request queue', value: labRequestPipeline, tab: 'lab-requests', hint: 'Intake through receive' },
    { label: 'Ready to receive', value: readyToReceive, tab: 'lab-requests', hint: 'Paid or non-OPD — accession next' },
    { label: 'In testing', value: inTesting, tab: 'testing-queue', hint: 'Results are being entered' },
    { label: 'Ready to print', value: completed, tab: 'coa-reports', hint: 'Released laboratory reports' },
    { label: 'Awaiting pickup', value: awaitingPickup, tab: 'coa-reports', hint: 'Completed — patient has not collected results' },
  ].filter((figure) => !figure.tab || canOpenTab(role || undefined, figure.tab) || role === 'STAFF');

  const staffFigures = role === 'STAFF'
    ? figures.filter((figure) => ['Requests today', 'Waiting for receipt'].includes(figure.label))
    : figures.filter((figure) => !figure.tab || canOpenTab(role || undefined, figure.tab));

  const otherDesks = actions.filter((action) => action.tab !== 'create-request');
  const canCreate = canOpenTab(role || undefined, 'create-request');
  const queueTab = canOpenTab(role || undefined, 'lab-requests')
    ? 'lab-requests'
    : canOpenTab(role || undefined, 'testing-queue')
      ? 'testing-queue'
      : canOpenTab(role || undefined, 'payments')
        ? 'payments'
        : '';

  const figureCount = staffFigures.length;
  const figureCols =
    figureCount <= 2
      ? 'sm:grid-cols-2'
      : figureCount === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : figureCount === 4
          ? 'sm:grid-cols-2 lg:grid-cols-4'
          : figureCount === 5
            ? 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'
            : figureCount === 6
              ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
              : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  const renderRequestTable = (items: LabTestRequisition[], scrollable = false) => {
    if (items.length === 0) {
      return (
        <div className="px-5 py-10 text-center text-sm text-slate-500">No laboratory requests yet.</div>
      );
    }
    return (
      <div className={scrollable ? 'overflow-x-auto max-h-[min(28rem,55vh)] overflow-y-auto' : 'overflow-x-auto'}>
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[min(14rem,22%)]" />
            <col className="w-[7.5rem]" />
            <col className="w-[5.5rem]" />
            {!hideExaminations ? <col /> : null}
            <col className="w-[6.5rem]" />
            <col className="w-[7.5rem]" />
          </colgroup>
          <thead className={scrollable ? 'sticky top-0 z-[1]' : undefined}>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-semibold">Patient</th>
              <th className="px-3 py-2 font-semibold">Case</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              {!hideExaminations ? (
                <th className="px-3 py-2 font-semibold">Examinations</th>
              ) : null}
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-5 py-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const submittedNext =
                item.status === 'SUBMITTED' ? submittedNextDeskLabel(item) : null;
              const cells = (
                <>
                  <td className="px-5 py-2.5 text-sm font-medium text-slate-900 truncate" title={item.patientOrSubjectName || 'Patient'}>
                    {item.patientOrSubjectName || 'Patient'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap tabular-nums">
                    {item.caseNo || item.requisitionNumber}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-normal text-slate-600 whitespace-nowrap uppercase">
                    {item.patientCategory || 'OPD'}
                  </td>
                  {!hideExaminations ? (
                    <td className="px-3 py-2.5 text-xs text-slate-600 truncate" title={examSummary(item)}>
                      {examSummary(item)}
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {formatRequestDate(item.requestDate)}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {submittedNext ? (
                      <span
                        className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${
                          submittedNext === 'Cashier'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        {submittedNext}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_TONE[item.status] || STATUS_TONE.CANCELLED}`}
                      >
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    )}
                  </td>
                </>
              );
              const openThisRequest = onOpenRequest;
              return openThisRequest || queueTab ? (
                <tr
                  key={item.id}
                  onClick={() => (openThisRequest ? onOpenRequest(item) : open(queueTab))}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  {cells}
                </tr>
              ) : (
                <tr key={item.id} className="border-t border-slate-100">
                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="lims-page-shell">
      <section className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0176d3]">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                  {roleLabel(role || undefined)}
                </span>
                <span className="text-[10px] text-slate-500 hidden md:inline">{APP_TAGLINE}</span>
              </div>
              <h1 className="text-lg leading-tight font-semibold text-slate-900 mt-1">
                {greeting}, {displayName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{roleText}</p>
            </div>
            <div className="sm:text-right shrink-0 sm:pl-4">
              <div className="text-base font-semibold text-slate-900 tabular-nums leading-none">{formatClock(now)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{formatLongDate(now)}</div>
            </div>
          </div>
        </section>

        <section className={`grid grid-cols-1 ${figureCols} gap-2`}>
          {staffFigures.map((figure) => {
            const clickable = Boolean(figure.tab && canOpenTab(role || undefined, figure.tab));
            const body = (
              <>
                <span className={`absolute inset-x-0 top-0 h-1 ${FIGURE_ACCENT[figure.label] || 'bg-slate-300'}`} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{figure.label}</span>
                  <span className="block text-xs text-slate-500 mt-1">{figure.hint}</span>
                </span>
                <span className="text-xl font-semibold text-slate-900 tabular-nums leading-none shrink-0 pt-0.5">
                  {figure.value}
                </span>
              </>
            );
            const className =
              'relative h-full overflow-hidden rounded-md border border-[#d8dde6] bg-white shadow-sm px-3 py-2.5 flex items-start justify-between gap-2 sm:gap-3 text-left min-h-[4.25rem]';
            return clickable ? (
              <button key={figure.label} type="button" onClick={() => open(figure.tab || '')} className={`${className} hover:border-[#0176d3] cursor-pointer`}>
                {body}
              </button>
            ) : (
              <div key={figure.label} className={className}>
                {body}
              </div>
            );
          })}
        </section>

        {canCreate && (
          <button
            type="button"
            onClick={() => open('create-request')}
            className="w-full text-left bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md shadow-sm px-3 py-2.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Start a lab test request</span>
              <span className="block text-xs text-white/80 mt-0.5">
                {hideExaminations
                  ? 'Patient details, then request date and physician.'
                  : 'Patient, then the request, then the examinations.'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0">
              Begin
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        )}

        {!canCreate && otherDesks[0] && (
          <section className="bg-white border border-[#d8dde6] rounded-md shadow-sm px-3 py-2.5 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-md bg-[#e8f3fc] text-[#0176d3] flex items-center justify-center shrink-0">
                {otherDesks[0].icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{otherDesks[0].title}</div>
                <p className="text-xs text-slate-500 mt-0.5">{otherDesks[0].detail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => open(otherDesks[0].tab)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-semibold rounded-md cursor-pointer shrink-0"
            >
              Open
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </section>
        )}

        <section className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
          <div className="px-3 py-2 sm:px-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">Laboratory requests</div>
              {role === 'STAFF' && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a row to open request details. You can correct it there before the cashier or laboratory takes it.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                {requestListTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRequestListTab(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      requestListTab === tab.key
                        ? 'bg-[#0176d3] text-white shadow-2xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        requestListTab === tab.key ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              {queueTab ? (
                <button
                  type="button"
                  onClick={() => open(queueTab)}
                  className="text-xs font-semibold text-[#0176d3] hover:underline cursor-pointer"
                >
                  {queueTab === 'payments' ? 'Open the payment desk' : 'Open the queue'}
                </button>
              ) : null}
            </div>
          </div>
          {renderRequestTable(activeRequestList, activeRequestList.length > 12)}
        </section>

        {otherDesks.length > (canCreate ? 0 : 1) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {otherDesks.slice(canCreate ? 0 : 1).map((action) => (
              <button
                key={action.tab}
                type="button"
                onClick={() => open(action.tab)}
                className="h-full text-left bg-white border border-[#d8dde6] hover:border-[#0176d3] rounded-md shadow-sm px-3 py-2.5 flex items-center gap-2.5 cursor-pointer group"
              >
                <span className="w-9 h-9 rounded-md bg-[#e8f3fc] text-[#0176d3] flex items-center justify-center shrink-0">
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-900">{action.title}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{action.detail}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0176d3] shrink-0" />
              </button>
            ))}
          </section>
        )}
    </div>
  );
};
