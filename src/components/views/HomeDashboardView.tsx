import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  MoreVertical,
  PackageCheck,
  Printer,
  Receipt,
  ScrollText,
  Stethoscope,
  TestTubes,
  Hourglass,
  List,
  type LucideIcon,
} from 'lucide-react';
import { LabTestRequisition } from '../../types/lims';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../brand/LabTisBrand';
import { APP_ROLES, AppRole, canOpenTab, isAppRole, roleLabel } from '../../data/roleAccess';
import {
  onLabRequestDesk,
  onTestingDesk,
  readyForLaboratory,
  requiresCashier,
  submittedNextDeskLabel,
  waitingAtCashier,
} from '../../data/requestDesk';
import { matchesReleaseFilter } from '../../utils/resultsPickup';
import { DashboardCtaArtwork, DashboardHeroArtwork } from '../common/LimsDashboardArtwork';

interface HomeNavigateOptions {
  pipelineFilter?: string;
  releaseFilter?: string;
}

interface HomeDashboardViewProps {
  requisitions: LabTestRequisition[];
  onNavigate: (tab: string, options?: HomeNavigateOptions) => void;
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

const FIGURE_META: Record<
  string,
  { icon: LucideIcon; iconWrap: string; iconColor: string; valueColor?: string }
> = {
  'Requests today': {
    icon: FileText,
    iconWrap: 'bg-sky-50',
    iconColor: 'text-[#0878e8]',
  },
  'Waiting for receipt': {
    icon: Hourglass,
    iconWrap: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-600',
  },
  'Lab intake': {
    icon: List,
    iconWrap: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  'Ready to receive': {
    icon: PackageCheck,
    iconWrap: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  'Enter results': {
    icon: FlaskConical,
    iconWrap: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  'Ready to print': {
    icon: Printer,
    iconWrap: 'bg-sky-50',
    iconColor: 'text-[#0878e8]',
  },
  'Awaiting pickup': {
    icon: Clock,
    iconWrap: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  'Ready for pickup': {
    icon: ClipboardList,
    iconWrap: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
};

const REQUEST_PAGE_SIZE = 12;

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
  const [requestPage, setRequestPage] = useState(0);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);

  useEffect(() => {
    setRequestPage(0);
  }, [requestListTab]);

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
  const awaitingPickup = requisitions.filter((item) => matchesReleaseFilter(item, 'NOT_PICKED_UP')).length;
  const unpaid = requisitions.filter((item) => waitingAtCashier(item)).length;

  const open = (tab: string, options?: HomeNavigateOptions) => {
    if (canOpenTab(role || undefined, tab)) onNavigate(tab, options);
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
      title: 'Lab intake',
      detail: 'Select examinations, cashier, and receive the specimen.',
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

  const figures: {
    label: string;
    value: number;
    tab?: string;
    pipelineFilter?: string;
    releaseFilter?: string;
    hint: string;
  }[] = [
    { label: 'Requests today', value: todayCount, hint: 'Filed with today’s date' },
    { label: 'Waiting for receipt', value: unpaid, tab: 'payments', hint: 'OPD official receipt still open' },
    { label: 'Lab intake', value: labRequestPipeline, tab: 'lab-requests', hint: 'Select exams through receive' },
    { label: 'Ready to receive', value: readyToReceive, tab: 'lab-requests', hint: 'Paid or non-OPD — accession next' },
    { label: 'Enter results', value: inTesting, tab: 'testing-queue', hint: 'Type and finalize laboratory results' },
    {
      label: 'Ready to print',
      value: completed,
      tab: 'all-requests',
      pipelineFilter: 'COMPLETED',
      hint: 'Validated results — print and release',
    },
    {
      label: 'Ready for pickup',
      value: awaitingPickup,
      tab: 'pickup-management',
      releaseFilter: 'NOT_PICKED_UP',
      hint: 'Completed — notify, print, and record collection',
    },
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
      : figureCount === 6 || figureCount === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';
  const isLabStaffFigures = role === 'LAB_STAFF' && figureCount >= 6;

  const pagedRequests = activeRequestList.slice(
    requestPage * REQUEST_PAGE_SIZE,
    requestPage * REQUEST_PAGE_SIZE + REQUEST_PAGE_SIZE
  );
  const requestPageCount = Math.max(1, Math.ceil(activeRequestList.length / REQUEST_PAGE_SIZE));

  const renderRequestTable = (items: LabTestRequisition[]) => {
    if (items.length === 0) {
      return (
        <div className="px-5 py-10 text-center text-sm text-slate-500">No laboratory requests yet.</div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left">
          <thead>
            <tr className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-[var(--lims-border)]">
              <th className="px-5 py-3 font-semibold">Patient</th>
              <th className="px-3 py-3 font-semibold">Case</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              {!hideExaminations ? (
                <th className="px-3 py-3 font-semibold">Examinations</th>
              ) : null}
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 font-semibold text-right">Status</th>
              <th className="w-12 px-2 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const submittedNext =
                item.status === 'SUBMITTED' ? submittedNextDeskLabel(item) : null;
              const cells = (
                <>
                  <td
                    className="px-5 py-2.5 text-sm font-medium text-slate-900 truncate overflow-hidden max-w-0"
                    title={item.patientOrSubjectName || 'Patient'}
                  >
                    {item.patientOrSubjectName || 'Patient'}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs text-slate-600 tabular-nums truncate overflow-hidden max-w-0"
                    title={item.caseNo || item.requisitionNumber}
                  >
                    {item.caseNo || item.requisitionNumber}
                  </td>
                  <td
                    className="px-3 py-2.5 text-[11px] font-normal text-slate-600 uppercase truncate overflow-hidden max-w-0"
                    title={item.patientCategory || 'OPD'}
                  >
                    {item.patientCategory || 'OPD'}
                  </td>
                  {!hideExaminations ? (
                    <td
                      className="px-3 py-2.5 text-xs text-slate-600 truncate overflow-hidden max-w-0"
                      title={examSummary(item)}
                    >
                      {examSummary(item)}
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap overflow-hidden">
                    {formatRequestDate(item.requestDate)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {submittedNext ? (
                      <span
                        className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                          submittedNext === 'Cashier'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {submittedNext}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${STATUS_TONE[item.status] || STATUS_TONE.CANCELLED}`}
                      >
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right relative">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      aria-label="Row actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRowMenuId((id) => (id === item.id ? null : item.id));
                      }}
                    >
                      <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    {rowMenuId === item.id ? (
                      <div className="absolute right-2 top-full z-20 mt-1 w-40 rounded-lg border border-[var(--lims-border)] bg-white shadow-lg py-1 text-left">
                        {onOpenRequest ? (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRequest(item);
                              setRowMenuId(null);
                            }}
                          >
                            Open request
                          </button>
                        ) : null}
                        {queueTab ? (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              open(queueTab);
                              setRowMenuId(null);
                            }}
                          >
                            Open queue
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </>
              );
              const openThisRequest = onOpenRequest;
              return openThisRequest || queueTab ? (
                <tr
                  key={item.id}
                  onClick={() => (openThisRequest ? onOpenRequest(item) : open(queueTab))}
                  className="border-b border-[var(--lims-border)] hover:bg-[#f8fafc] cursor-pointer"
                >
                  {cells}
                </tr>
              ) : (
                <tr key={item.id} className="border-b border-[var(--lims-border)]">
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
    <div className="lims-page-shell space-y-4">
      <section className="lims-card relative overflow-hidden border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30">
        <DashboardHeroArtwork />
        <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0878e8] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-200/50">
            <FlaskConical className="w-7 h-7" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-white border border-[var(--lims-border)] px-2 py-0.5 rounded-full">
                {roleLabel(role || undefined)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{roleText}</p>
          </div>
          <div className="sm:text-right shrink-0 sm:pl-4 border-l border-[var(--lims-border)] sm:pl-6">
            <div className="text-2xl font-bold text-[var(--lims-navy)] tabular-nums leading-none">
              {formatClock(now)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{formatLongDate(now)}</div>
          </div>
        </div>
      </section>

      <section className={`grid grid-cols-1 ${figureCols} gap-3`}>
        {staffFigures.map((figure) => {
          const meta = FIGURE_META[figure.label] || FIGURE_META['Requests today'];
          const Icon = meta.icon;
          const clickable = Boolean(figure.tab && canOpenTab(role || undefined, figure.tab));
          const className =
            'lims-card h-full p-4 sm:px-5 sm:py-4 text-left transition-all shadow-sm hover:shadow-md hover:border-[#0878e8]/35';
          const valueClass = meta.valueColor ?? 'text-[var(--lims-navy)]';
          const body = (
            <div
              className={`flex items-center gap-3 sm:gap-4 w-full ${
                isLabStaffFigures ? 'min-h-[5.25rem]' : 'min-h-[4.5rem]'
              }`}
            >
              <span
                className={`rounded-2xl flex items-center justify-center shrink-0 ${meta.iconWrap} ${
                  isLabStaffFigures ? 'w-14 h-14' : 'w-12 h-12'
                }`}
              >
                <Icon
                  className={`${isLabStaffFigures ? 'w-7 h-7' : 'w-6 h-6'} ${meta.iconColor}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1 pr-2">
                <p
                  className={`font-bold uppercase tracking-wide text-[var(--lims-navy)] leading-snug ${
                    isLabStaffFigures ? 'text-xs sm:text-[13px]' : 'text-[11px] sm:text-xs'
                  }`}
                >
                  {figure.label}
                </p>
                <p
                  className={`text-slate-500 mt-1 leading-snug line-clamp-2 ${
                    isLabStaffFigures ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'
                  }`}
                >
                  {figure.hint}
                </p>
              </div>
              <span
                className={`font-bold tabular-nums leading-none shrink-0 ${valueClass} ${
                  isLabStaffFigures ? 'text-[1.75rem] sm:text-[1.875rem]' : 'text-3xl sm:text-[2rem]'
                }`}
              >
                {figure.value}
              </span>
            </div>
          );
          return clickable ? (
            <button
              key={figure.label}
              type="button"
              onClick={() =>
                open(figure.tab || '', {
                  pipelineFilter: figure.pipelineFilter,
                  releaseFilter: figure.releaseFilter,
                })
              }
              className={`${className} cursor-pointer`}
            >
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
          className="relative overflow-hidden w-full text-left rounded-xl bg-gradient-to-r from-[var(--lims-navy)] via-[#0c2d55] to-[#0a2240] hover:from-[#0c2d55] hover:to-[#081a33] text-white shadow-md px-5 py-4 flex items-center justify-between gap-4 cursor-pointer border border-[#0a2240]"
        >
          <DashboardCtaArtwork />
          <span className="relative z-[1] flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-sky-200" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold">Start a lab test request</span>
              <span className="block text-sm text-slate-300 mt-0.5">
                {hideExaminations
                  ? 'Patient details, then request date and physician.'
                  : 'Patient, then the request, then the examinations.'}
              </span>
            </span>
          </span>
          <span className="relative z-[1] inline-flex items-center gap-2 text-sm font-semibold bg-white text-[var(--lims-navy)] px-4 py-2 rounded-lg shrink-0 shadow-sm">
            Begin
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}

        {!canCreate && otherDesks[0] && (
          <section className="lims-card px-3 py-2.5 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-[#0878e8] flex items-center justify-center shrink-0">
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
              className="lims-btn-primary gap-1.5 px-3.5 py-2 text-xs rounded-lg shrink-0"
            >
              Open
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </section>
        )}

        <section className="lims-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--lims-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--lims-navy)]">Laboratory requests</h2>
              {role === 'STAFF' && (
                <p className="text-xs text-slate-500 mt-1">
                  Select a row to open request details. You can correct it there before the cashier or laboratory
                  takes it.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f4f7fb] border border-[var(--lims-border)]">
                {requestListTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRequestListTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      requestListTab === tab.key
                        ? 'bg-[#0878e8] text-white shadow-sm'
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0878e8] hover:underline cursor-pointer"
                >
                  {queueTab === 'payments' ? 'Open the payment desk' : 'Open the queue'}
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              ) : null}
            </div>
          </div>
          {renderRequestTable(pagedRequests)}
          {activeRequestList.length > REQUEST_PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--lims-border)] text-xs text-slate-600">
              <span>
                Page {requestPage + 1} of {requestPageCount} · {activeRequestList.length} requests
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={requestPage === 0}
                  onClick={() => setRequestPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border border-[var(--lims-border)] disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={requestPage >= requestPageCount - 1}
                  onClick={() => setRequestPage((p) => Math.min(requestPageCount - 1, p + 1))}
                  className="p-1.5 rounded-lg border border-[var(--lims-border)] disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {role !== 'LAB_STAFF' && otherDesks.length > (canCreate ? 0 : 1) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {otherDesks.slice(canCreate ? 0 : 1).map((action) => (
              <button
                key={action.tab}
                type="button"
                onClick={() => open(action.tab)}
                className="h-full text-left lims-card hover:border-[#0878e8]/60 px-4 py-3 flex items-center gap-3 cursor-pointer group"
              >
                <span className="w-10 h-10 rounded-xl bg-sky-50 text-[#0878e8] flex items-center justify-center shrink-0">
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{action.title}</span>
                  <span className="block text-xs text-slate-500 mt-0.5 leading-snug">{action.detail}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0878e8] shrink-0" />
              </button>
            ))}
          </section>
        )}
    </div>
  );
};
