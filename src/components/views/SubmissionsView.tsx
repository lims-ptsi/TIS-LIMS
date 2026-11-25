import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Receipt,
  PackageCheck,
  Bell,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import { RequisitionSlipModal } from '../modals/RequisitionSlipModal';
import { ReceiveAccessionModal } from '../modals/ReceiveAccessionModal';
import { OrderOfPaymentModal } from '../modals/OrderOfPaymentModal';
import { ResultEntryModal, ExamResultGroup } from '../modals/ResultEntryModal';
import { CoAReportModal } from '../modals/CoAReportModal';
import { paperKindForPreview, printScreenPreview } from '../../utils/printScreenPreview';
import { DocumentSideDrawer } from '../modals/DocumentSideDrawer';
import { PatientCategory, Sample, PriorityLevel } from '../../types/lims';
import type { AuthUser } from '../../types/auth';
import { EXAMINATION_CATALOG, formatCurrency, getExaminationPrice } from '../../data/examinationCatalog';
import {
  hasOfficialReceipt,
  needsLaboratoryExamSelection,
  onLabRequestDesk,
  onTestingDesk,
  readyForCashierSettlement,
  readyForLaboratory,
  readyForSpecimenReceive,
  requiresCashier,
  waitingAtCashier,
  requestTrackingPhase,
  requestTrackingLabel,
  type RequestTrackingPhase,
} from '../../data/requestDesk';
import { ExaminationItem } from '../../data/examinationCatalog';
import { LabExamSelectionModal } from '../modals/LabExamSelectionModal';
import { PageController } from '../common/PageController';
import { LimsWorkspace } from '../common/LimsWorkspace';
import { LimsHeroHeader } from '../common/LimsHeroHeader';
import { APP_NAME } from '../brand/LabTisBrand';
import { paginateSlice, usePagination } from '../../utils/pagination';
import { requisitionNumberKey } from '../../data/limsDataStore';
import {
  formatResultsPickupWhen,
  isAwaitingPatientNotify,
  isAwaitingPatientPickup,
  isResultsPickedUp,
  matchesReleaseFilter,
  patientWasNotified,
  requestReleaseLabel,
  type RequestReleaseFilter,
} from '../../utils/resultsPickup';
import { isPatientSmsConfigured } from '../../services/patientNotificationService';

interface SubmissionsViewProps {
  requisitions: LabTestRequisition[];
  onOpenNewRequisition?: () => void;
  onSelectRequisition?: (
    req: LabTestRequisition,
    context?: { statusFilter: string; releaseFilter?: RequestReleaseFilter }
  ) => void;
  onReceiveAndAccession: (
    req: LabTestRequisition,
    accessionData: {
      patientCategory: PatientCategory;
      sampleType: Sample['sampleType'];
      matrix: string;
      tubeCount: number;
      priority: PriorityLevel;
      storageFacility?: string;
      storageRoom?: string;
      storageTemp?: string;
      notes: string;
      orNumber?: string;
      sampleName?: string;
      boxId?: string;
      boxPosition?: string;
    }
  ) => void;
  onUpdatePatientCategory?: (reqId: string, category: PatientCategory) => void;
  onViewRequisitionSlip?: (req: LabTestRequisition) => void;
  onViewPaymentSlip?: (req: LabTestRequisition) => void;
  onSettlePayment?: (reqId: string, orNumber: string, reqNumber?: string) => void;
  onSaveResults?: (
    reqId: string, 
    resultsData: Record<string, ExamResultGroup>, 
    isFinalize: boolean,
    medTechInfo: {
      labTechName?: string;
      rmtName: string;
      rmtLicense: string;
      pathologistName: string;
      pathologistLicense?: string;
      remarks: string;
    },
    options?: { silent?: boolean }
  ) => void;
  storedResults?: Record<string, Record<string, ExamResultGroup>>;
  storedMedTechInfo?: Record<string, any>;
  resultUpdatedAt?: Record<string, string>;
  samples?: Sample[];
  currentUserName?: string;
  permissions?: AuthUser['permissions'];
  variant?:
    | 'lab-requests'
    | 'testing-queue'
    | 'payments'
    | 'all-requests'
    | 'pickup-management'
    | 'queue';
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
  onNotifyResultsReady?: (req: LabTestRequisition) => void;
  examinationCatalog?: ExaminationItem[];
  onAssignExaminations?: (req: LabTestRequisition, examNames: string[]) => void | Promise<void>;
  onOpenRequestDetails?: (req: LabTestRequisition) => void;
  pipelineFilter?: string | null;
  onPipelineFilterApplied?: () => void;
  releaseFilter?: string | null;
  onReleaseFilterApplied?: () => void;
  onOpenCompletedReport?: (req: LabTestRequisition) => void;
}

function examinationNames(req: LabTestRequisition): string[] {
  if (req.selectedTestNames?.length) return req.selectedTestNames;
  if (Array.isArray(req.kindOfExamination) && req.kindOfExamination.length) return req.kindOfExamination;
  return [];
}

function matchExamination(name: string) {
  const clean = name.trim().toUpperCase();
  const exact = EXAMINATION_CATALOG.find((item) => item.name.trim().toUpperCase() === clean);
  if (exact) return exact;
  return EXAMINATION_CATALOG
    .filter((item) => {
      const catalogName = item.name.trim().toUpperCase();
      return clean.includes(catalogName) || catalogName.includes(clean);
    })
    .sort((a, b) => b.name.length - a.name.length)[0];
}

function requestTotal(req: LabTestRequisition): number {
  return examinationNames(req).reduce((sum, name) => {
    const item = matchExamination(name);
    return sum + (item ? getExaminationPrice(item, req.patientCategory) : 0);
  }, 0);
}

function examinationSummary(req: LabTestRequisition): string {
  if (needsLaboratoryExamSelection(req)) return 'Pending laboratory order';
  const names = examinationNames(req);
  if (!names.length) return '—';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function examinationTooltip(req: LabTestRequisition): string {
  if (needsLaboratoryExamSelection(req)) return 'Examinations: pending laboratory order';
  const names = examinationNames(req);
  if (!names.length) return '';
  return `Examinations: ${names.join(', ')}`;
}

function examinationTableCell(req: LabTestRequisition, expanded: boolean): React.ReactNode {
  if (needsLaboratoryExamSelection(req)) {
    return <span className="italic text-slate-500">Pending laboratory order</span>;
  }
  const names = examinationNames(req);
  if (!names.length) return '—';
  const full = names.join(', ');
  if (!expanded) return examinationSummary(req);
  const preview =
    names.length <= 3 ? full : `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  return (
    <span className="block line-clamp-2 normal-case text-slate-600 leading-snug" title={full}>
      {preview}
    </span>
  );
}

function pipelineStatusBadgeClass(phase: RequestTrackingPhase): string {
  switch (phase) {
    case 'NEEDS_EXAMS':
      return 'bg-violet-50 text-violet-900 border-violet-200';
    case 'AT_CASHIER':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'READY_RECEIVE':
      return 'bg-orange-50 text-orange-900 border-orange-200';
    case 'IN_TESTING':
      return 'bg-sky-50 text-[#014486] border-sky-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function PipelineStatusBadge({
  label,
  phase,
  releaseHint,
}: {
  label: string;
  phase: RequestTrackingPhase;
  releaseHint?: string | null;
}) {
  return (
    <div className="flex flex-col items-start gap-1 max-w-[11rem]">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border normal-case leading-snug ${pipelineStatusBadgeClass(phase)}`}
      >
        {label}
      </span>
      {releaseHint ? (
        <span className="text-[10px] font-medium text-slate-500 normal-case leading-snug">{releaseHint}</span>
      ) : null}
    </div>
  );
}

function activityMillis(value?: string | null): number {
  const raw = (value || '').trim();
  if (!raw) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, date] = raw.split('-').map(Number);
    return new Date(year, month - 1, date).getTime();
  }
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const normalized = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}${hasZone ? '' : 'Z'}`;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function latestUpdateStamp(
  req: LabTestRequisition,
  resultUpdatedAt: Record<string, string> | undefined,
  receivedAt?: string,
  options?: { includeReleaseActivity?: boolean }
): string {
  const numberKey = requisitionNumberKey(req.requisitionNumber);
  const stamps = [
    req.updatedAt || '',
    resultUpdatedAt?.[req.id] || '',
    numberKey ? resultUpdatedAt?.[numberKey] || '' : '',
    receivedAt || '',
    ...(options?.includeReleaseActivity
      ? [
          req.resultsPickedUpAt || '',
          req.resultsReadySmsSentAt || '',
          req.resultsReadyEmailSentAt || '',
        ]
      : []),
  ].filter(Boolean);
  let best = '';
  let bestMs = 0;
  for (const stamp of stamps) {
    const ms = activityMillis(stamp);
    if (ms >= bestMs) {
      bestMs = ms;
      best = stamp;
    }
  }
  return best || req.requestDate || '';
}

function requestDay(value?: string): string {
  const day = (value || '').slice(0, 10);
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return day || '—';
  return new Date(year, month - 1, date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

type NextStepTone = 'muted' | 'primary' | 'receive' | 'print' | 'notify' | 'pickup';

function nextStepToneClass(tone: NextStepTone, disabled?: boolean): string {
  if (disabled) return 'text-slate-300 cursor-not-allowed no-underline hover:no-underline';
  switch (tone) {
    case 'primary':
      return 'text-[#0878e8] hover:text-[#065bb0]';
    case 'receive':
      return 'text-[#2e844a] hover:text-[#1b5e30]';
    case 'print':
      return 'text-emerald-800 hover:text-emerald-950';
    case 'notify':
      return 'text-sky-700 hover:text-sky-900';
    case 'pickup':
      return 'text-violet-700 hover:text-violet-900';
    default:
      return 'text-slate-700 hover:text-slate-900';
  }
}

function nextStepChipClass(tone: NextStepTone, disabled?: boolean): string {
  if (disabled) {
    return 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed';
  }
  switch (tone) {
    case 'primary':
      return 'border-sky-200 bg-sky-50 text-[#0878e8] hover:bg-sky-100';
    case 'receive':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
    case 'print':
      return 'border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100';
    case 'notify':
      return 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100';
    case 'pickup':
      return 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100';
    default:
      return 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  }
}

function NextStepLink({
  children,
  onClick,
  disabled,
  tone = 'muted',
  title,
  icon: Icon,
  variant = 'link',
  normalCase = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: NextStepTone;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'link' | 'chip';
  /** Pipeline-style text links (e.g. All requests), not uppercase pills. */
  normalCase?: boolean;
}) {
  const shared =
    'inline-flex items-center gap-1 leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0878e8] disabled:cursor-not-allowed';
  const linkClass = normalCase
    ? 'text-xs font-medium normal-case'
    : 'text-[11px] font-normal uppercase';
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={
        variant === 'chip'
          ? `${shared} m-0 cursor-pointer rounded-md border px-2 py-1 text-[10px] font-semibold normal-case transition-colors ${nextStepChipClass(tone, disabled)}`
          : `${shared} ${linkClass} bg-transparent border-0 p-0 m-0 cursor-pointer underline-offset-2 hover:underline ${nextStepToneClass(tone, disabled)}`
      }
    >
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden /> : null}
      <span className={variant === 'chip' || normalCase ? 'normal-case' : 'uppercase'}>{children}</span>
    </button>
  );
}

function NextStepDot() {
  return (
    <span className="text-slate-300 select-none px-0.5 text-xs font-semibold leading-none" aria-hidden>
      ·
    </span>
  );
}

function NextStepGap({ chips }: { chips?: boolean }) {
  return chips ? null : <NextStepDot />;
}

const RELEASE_QUEUE_TABS: { key: RequestReleaseFilter; label: string; shortLabel: string }[] = [
  { key: 'NOT_PICKED_UP', label: 'Not picked up', shortLabel: 'To release' },
  { key: 'AWAITING_NOTIFY', label: 'Awaiting notify', shortLabel: 'Needs notify' },
  { key: 'AWAITING_PICKUP', label: 'Awaiting pickup', shortLabel: 'Ready for pickup' },
  { key: 'PICKED_UP', label: 'Picked up', shortLabel: 'Picked up' },
  { key: 'ALL', label: 'All completed', shortLabel: 'All' },
];

function PickupReleaseBadge({ req }: { req: LabTestRequisition }) {
  if (isResultsPickedUp(req)) {
    return (
      <span className="inline-flex flex-col gap-0.5 items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
          Picked up
        </span>
        {formatResultsPickupWhen(req.resultsPickedUpAt) ? (
          <span className="text-[10px] text-slate-500 tabular-nums">{formatResultsPickupWhen(req.resultsPickedUpAt)}</span>
        ) : null}
      </span>
    );
  }
  if (isAwaitingPatientNotify(req)) {
    return (
      <span className="inline-flex flex-col gap-0.5 items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-950 border border-amber-200">
          Notify patient
        </span>
        <span className="text-[10px] text-slate-500">
          {isPatientSmsConfigured() ? 'SMS / email not sent yet' : 'Email not sent yet'}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col gap-0.5 items-start">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-900 border border-violet-200">
        Awaiting collection
      </span>
      <span className="text-[10px] text-slate-500">
        {patientWasNotified(req) ? 'Patient notified' : 'Print before release'}
      </span>
    </span>
  );
}

function PickupQueueFilters({
  releaseSubFilter,
  releaseCounts,
  onChange,
  compact,
}: {
  releaseSubFilter: RequestReleaseFilter;
  releaseCounts: {
    all: number;
    notPickedUp: number;
    awaitingNotify: number;
    awaitingPickup: number;
    pickedUp: number;
  };
  onChange: (key: RequestReleaseFilter) => void;
  compact?: boolean;
}) {
  const countFor = (key: RequestReleaseFilter) => {
    switch (key) {
      case 'ALL':
        return releaseCounts.all;
      case 'NOT_PICKED_UP':
        return releaseCounts.notPickedUp;
      case 'AWAITING_NOTIFY':
        return releaseCounts.awaitingNotify;
      case 'AWAITING_PICKUP':
        return releaseCounts.awaitingPickup;
      case 'PICKED_UP':
        return releaseCounts.pickedUp;
      default:
        return 0;
    }
  };
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto ${compact ? 'pb-0' : 'pb-0.5'}`}>
      {RELEASE_QUEUE_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            releaseSubFilter === tab.key
              ? compact
                ? 'bg-[#0878e8] text-white shadow-2xs'
                : 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>{compact ? tab.shortLabel : tab.label}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
              releaseSubFilter === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {countFor(tab.key)}
          </span>
        </button>
      ))}
    </div>
  );
}

function PickupRowActions({
  req,
  canReleaseDesk,
  onOpenSlip,
  onOpenRecord,
  onPrint,
  onNotify,
  onMarkPickup,
}: {
  req: LabTestRequisition;
  canReleaseDesk: boolean;
  onOpenSlip: () => void;
  onOpenRecord: () => void;
  onPrint?: () => void;
  onNotify?: () => void;
  onMarkPickup?: () => void;
}) {
  const pickedUp = isResultsPickedUp(req);
  const needsNotify = isAwaitingPatientNotify(req);

  return (
    <div className="flex flex-col items-stretch gap-2 min-w-[10.5rem] max-w-[14rem] ml-auto">
      {!pickedUp && needsNotify && onNotify && canReleaseDesk ? (
        <button
          type="button"
          onClick={onNotify}
          className="inline-flex items-center justify-center gap-1.5 w-full px-2.5 py-2 text-xs font-semibold rounded-lg bg-[#0878e8] hover:bg-[#0669c9] text-white shadow-sm cursor-pointer border-0"
        >
          <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Notify patient
        </button>
      ) : !pickedUp && onMarkPickup && canReleaseDesk ? (
        <button
          type="button"
          onClick={onMarkPickup}
          className="inline-flex items-center justify-center gap-1.5 w-full px-2.5 py-2 text-xs font-semibold rounded-lg bg-violet-700 hover:bg-violet-800 text-white shadow-sm cursor-pointer border-0"
        >
          <PackageCheck className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Record pickup
        </button>
      ) : pickedUp ? (
        <div className="text-right pr-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Release complete</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[10px] font-medium">
        {onPrint && canReleaseDesk ? (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 cursor-pointer bg-transparent border-0 p-0"
          >
            <Printer className="w-3 h-3" aria-hidden />
            Print
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenRecord}
          className="inline-flex items-center gap-1 text-[#0878e8] hover:text-[#065bb0] cursor-pointer bg-transparent border-0 p-0"
        >
          <ExternalLink className="w-3 h-3" aria-hidden />
          Open
        </button>
        <button
          type="button"
          onClick={onOpenSlip}
          className="text-slate-500 hover:text-slate-800 cursor-pointer bg-transparent border-0 p-0"
        >
          Slip
        </button>
        {pickedUp && onMarkPickup && canReleaseDesk ? (
          <button
            type="button"
            onClick={onMarkPickup}
            className="text-violet-700 hover:text-violet-900 cursor-pointer bg-transparent border-0 p-0"
          >
            Undo pickup
          </button>
        ) : null}
      </div>
    </div>
  );
}

function requestStatusTextClass(status: string): string {
  if (status === 'COMPLETED') return 'text-emerald-700';
  if (status === 'IN_TESTING') return 'text-[#014486]';
  if (status === 'RECEIVED') return 'text-sky-700';
  if (status === 'SUBMITTED') return 'text-amber-700';
  return 'text-slate-700';
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  requisitions,
  onOpenNewRequisition,
  onSelectRequisition,
  onReceiveAndAccession,
  onUpdatePatientCategory,
  onViewRequisitionSlip,
  onViewPaymentSlip,
  onSettlePayment,
  onSaveResults,
  storedResults = {},
  storedMedTechInfo = {},
  resultUpdatedAt = {},
  samples = [],
  currentUserName,
  permissions,
  variant = 'lab-requests',
  onMarkResultsPickedUp,
  onNotifyResultsReady,
  examinationCatalog,
  onAssignExaminations,
  onOpenRequestDetails,
  pipelineFilter,
  onPipelineFilterApplied,
  releaseFilter,
  onReleaseFilterApplied,
  onOpenCompletedReport,
}) => {
  const deskVariant =
    variant === 'all-requests'
      ? 'all-requests'
      : variant === 'pickup-management'
        ? 'pickup-management'
        : variant === 'queue' || variant === 'lab-requests'
          ? 'lab-requests'
          : variant === 'testing-queue'
            ? 'testing-queue'
            : 'payments';
  const isPayments = deskVariant === 'payments';
  const isLabRequests = deskVariant === 'lab-requests';
  const isTestingQueue = deskVariant === 'testing-queue';
  const isAllRequests = deskVariant === 'all-requests';
  const isPickupManagement = deskVariant === 'pickup-management';
  const isReleaseDesk = isAllRequests || isPickupManagement;
  const canAccession = !isPayments && permissions?.canAccessionSamples === true;
  const canAssignExams =
    !isPayments &&
    Boolean(onAssignExaminations && examinationCatalog?.length && canAccession);
  const canEnterResults = !isPayments && permissions?.canEnterResults === true;
  const canAssignOr = permissions?.canAssignOrNumber === true;
  const canCreate = !isPayments && Boolean(onOpenNewRequisition);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(isPayments ? 'UNPAID' : 'ALL');
  const [releaseSubFilter, setReleaseSubFilter] = useState<RequestReleaseFilter>('ALL');

  /** Pipeline pills differ per desk; reusing a filter from another tab hides every row while counts stay full. */
  useEffect(() => {
    if (isPayments) setStatusFilter('UNPAID');
    else if (isTestingQueue) setStatusFilter('ALL');
    else if (isPickupManagement) setStatusFilter('COMPLETED');
    else if (isLabRequests || isAllRequests) setStatusFilter('ALL');
  }, [deskVariant, isPayments, isTestingQueue, isPickupManagement, isLabRequests, isAllRequests]);

  useEffect(() => {
    if (isPickupManagement) {
      setReleaseSubFilter('NOT_PICKED_UP');
    }
  }, [isPickupManagement]);

  useEffect(() => {
    if (!pipelineFilter) return;
    setStatusFilter(pipelineFilter);
    onPipelineFilterApplied?.();
  }, [pipelineFilter, onPipelineFilterApplied]);

  useEffect(() => {
    if (!releaseFilter) return;
    const allowed = new Set<RequestReleaseFilter>([
      'ALL',
      'NOT_PICKED_UP',
      'AWAITING_NOTIFY',
      'AWAITING_PICKUP',
      'PICKED_UP',
    ]);
    if (allowed.has(releaseFilter as RequestReleaseFilter)) {
      setReleaseSubFilter(releaseFilter as RequestReleaseFilter);
    }
    onReleaseFilterApplied?.();
  }, [releaseFilter, onReleaseFilterApplied]);

  const allowedStatusFilters = isPayments
    ? new Set(['UNPAID', 'PAID', 'ALL'])
    : isPickupManagement
      ? new Set(['COMPLETED'])
      : isAllRequests
      ? new Set(['ALL', 'NEEDS_EXAMS', 'AT_CASHIER', 'READY_RECEIVE', 'IN_TESTING', 'COMPLETED'])
      : isLabRequests
        ? new Set(['ALL', 'NEEDS_EXAMS', 'AT_CASHIER', 'READY_RECEIVE'])
        : isTestingQueue
          ? new Set(['ALL', 'IN_TESTING'])
          : new Set(['ALL']);

  const activeStatusFilter = allowedStatusFilters.has(statusFilter) ? statusFilter : 'ALL';

  useEffect(() => {
    if (activeStatusFilter !== 'COMPLETED' && !isPickupManagement) setReleaseSubFilter('ALL');
  }, [activeStatusFilter, isPickupManagement]);

  const canReleaseDesk =
    Boolean(permissions?.canReleaseCoA) ||
    Boolean(permissions?.canPrintResults) ||
    Boolean(permissions?.canAccessionSamples) ||
    Boolean(permissions?.canAssignOrNumber);

  const selectRequisition = (req: LabTestRequisition) => {
    onSelectRequisition?.(req, {
      statusFilter: isPickupManagement ? 'COMPLETED' : activeStatusFilter,
      releaseFilter:
        activeStatusFilter === 'COMPLETED' || isPickupManagement ? releaseSubFilter : undefined,
    });
  };
  const [docPanel, setDocPanel] = useState<{
    kind: 'slip' | 'payment' | 'print';
    req: LabTestRequisition;
  } | null>(null);
  const [examSelectReq, setExamSelectReq] = useState<LabTestRequisition | null>(null);
  const [selectedReceiveReq, setSelectedReceiveReq] = useState<LabTestRequisition | null>(null);
  const [selectedResultReq, setSelectedResultReq] = useState<LabTestRequisition | null>(null);

  const latestReceivedAt = (req: LabTestRequisition): string => {
    const keys = new Set([req.caseNo, req.externalRef, req.requisitionNumber].map((value) => (value || '').trim()).filter(Boolean));
    let best = '';
    let bestMs = 0;
    for (const sample of samples) {
      const key = (sample.externalId || '').trim();
      if (!key || !keys.has(key) || !sample.receivedDate) continue;
      const ms = activityMillis(sample.receivedDate);
      if (ms >= bestMs) {
        bestMs = ms;
        best = sample.receivedDate;
      }
    }
    return best;
  };

  const sortDeskRequests = (list: LabTestRequisition[]) => {
    if (isTestingQueue || isPickupManagement) {
      const includeRelease = isPickupManagement;
      return [...list].sort(
        (a, b) =>
          activityMillis(
            latestUpdateStamp(b, resultUpdatedAt, latestReceivedAt(b), {
              includeReleaseActivity: includeRelease,
            })
          ) -
          activityMillis(
            latestUpdateStamp(a, resultUpdatedAt, latestReceivedAt(a), {
              includeReleaseActivity: includeRelease,
            })
          )
      );
    }
    if (!isLabRequests && !isAllRequests) {
      return [...list].sort((a, b) => (b.requestDate || '').localeCompare(a.requestDate || ''));
    }
    const rank = (r: LabTestRequisition) => {
      if (needsLaboratoryExamSelection(r)) return 0;
      if (waitingAtCashier(r)) return 2;
      if (r.status === 'SUBMITTED' && readyForLaboratory(r)) return 1;
      return 3;
    };
    return [...list].sort((a, b) => {
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return (b.requestDate || '').localeCompare(a.requestDate || '');
    });
  };

  const deskRequests = sortDeskRequests(
    isPickupManagement
      ? requisitions.filter((r) => r.status === 'COMPLETED')
      : isAllRequests
      ? requisitions
      : requisitions.filter((r) => {
          if (isPayments) return readyForCashierSettlement(r);
          if (isLabRequests) return onLabRequestDesk(r);
          if (isTestingQueue) return onTestingDesk(r);
          return onLabRequestDesk(r);
        })
  );

  const filtered = deskRequests.filter((r) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (r.requisitionNumber && r.requisitionNumber.toLowerCase().includes(query)) ||
      (r.patientOrSubjectName && r.patientOrSubjectName.toLowerCase().includes(query)) ||
      (r.caseNo && r.caseNo.toLowerCase().includes(query)) ||
      (r.orNumber && r.orNumber.toLowerCase().includes(query)) ||
      (r.chargeSlipNumber && r.chargeSlipNumber.toLowerCase().includes(query)) ||
      (r.orderingPhysicianOrPI && r.orderingPhysicianOrPI.toLowerCase().includes(query)) ||
      (r.kindOfExamination && Array.isArray(r.kindOfExamination) && r.kindOfExamination.some((k) => k && k.toLowerCase().includes(query)));

    const matchesStatus = isPayments
      ? activeStatusFilter === 'ALL' ||
        (activeStatusFilter === 'PAID' ? hasOfficialReceipt(r.orNumber) : !hasOfficialReceipt(r.orNumber))
      : isAllRequests
        ? activeStatusFilter === 'ALL' || requestTrackingPhase(r) === activeStatusFilter
        : isLabRequests
          ? activeStatusFilter === 'NEEDS_EXAMS'
            ? needsLaboratoryExamSelection(r)
            : activeStatusFilter === 'AT_CASHIER'
              ? waitingAtCashier(r)
              : activeStatusFilter === 'READY_RECEIVE'
                ? readyForSpecimenReceive(r)
                : activeStatusFilter === 'ALL' || r.status === activeStatusFilter
          : isTestingQueue
            ? activeStatusFilter === 'ALL' ||
              (activeStatusFilter === 'IN_TESTING' &&
                (r.status === 'IN_TESTING' || r.status === 'RECEIVED'))
            : activeStatusFilter === 'ALL' || r.status === activeStatusFilter;
    const matchesRelease = isPickupManagement
      ? matchesReleaseFilter(r, releaseSubFilter)
      : !isAllRequests ||
        activeStatusFilter !== 'COMPLETED' ||
        matchesReleaseFilter(r, releaseSubFilter);
    return matchesSearch && matchesStatus && matchesRelease;
  });

  const pagination = usePagination(
    filtered.length,
    [searchQuery, activeStatusFilter, releaseSubFilter, deskVariant],
    15
  );
  const pagedRequests = paginateSlice(filtered, pagination.page, pagination.pageSize);

  const openDocPanel = (kind: 'slip' | 'payment' | 'print', req: LabTestRequisition) => {
    setDocPanel({ kind, req });
  };

  const handleOpenSlip = (req: LabTestRequisition) => {
    openDocPanel('slip', req);
  };

  const counts = {
    all: deskRequests.length,
    needsExams: deskRequests.filter((r) => needsLaboratoryExamSelection(r)).length,
    atCashier: deskRequests.filter((r) => waitingAtCashier(r)).length,
    readyReceive: deskRequests.filter((r) => readyForSpecimenReceive(r)).length,
    inTesting: deskRequests.filter((r) => r.status === 'IN_TESTING' || r.status === 'RECEIVED').length,
    completed: deskRequests.filter((r) => r.status === 'COMPLETED').length,
    other: deskRequests.filter((r) => requestTrackingPhase(r) === 'OTHER').length,
  };

  const completedReqs = deskRequests.filter((r) => r.status === 'COMPLETED');
  const releaseCounts = {
    all: completedReqs.length,
    awaitingNotify: completedReqs.filter((r) => isAwaitingPatientNotify(r)).length,
    notPickedUp: completedReqs.filter((r) => isAwaitingPatientPickup(r)).length,
    awaitingPickup: completedReqs.filter(
      (r) => isAwaitingPatientPickup(r) && !isAwaitingPatientNotify(r)
    ).length,
    pickedUp: completedReqs.filter((r) => isResultsPickedUp(r)).length,
  };

  const handlePipelineRowClick = (req: LabTestRequisition) => {
    if (isPickupManagement) {
      selectRequisition(req);
      return;
    }
    if (isTestingQueue || (isAllRequests && (req.status === 'IN_TESTING' || req.status === 'RECEIVED' || req.status === 'COMPLETED'))) {
      selectRequisition(req);
      return;
    }
    if (req.status === 'SUBMITTED') {
      if (needsLaboratoryExamSelection(req) && canAssignExams) {
        setExamSelectReq(req);
        return;
      }
      if (waitingAtCashier(req)) return;
      if (canAccession && readyForSpecimenReceive(req)) {
        setSelectedReceiveReq(req);
        return;
      }
      if (onOpenRequestDetails) {
        onOpenRequestDetails(req);
        return;
      }
      handleOpenSlip(req);
      return;
    }
    selectRequisition(req);
  };

  return (
    <div className="lims-page-shell space-y-4">
      {/* Printable page background content wrapper (Hidden in Print Mode) */}
      <div className="print:hidden space-y-4">
        {/* 1. Chevron Pipeline Workflow */}
        {isLabRequests ? (
        <LifecycleChevronBar
          currentStage="Electronic Test Requisition & Intake"
          entityType="Sample"
          onCompleteStage={onOpenNewRequisition}
        />
        ) : null}
        {isTestingQueue ? (
        <LifecycleChevronBar
          currentStage="Analytical Testing & Result Entry"
          entityType="Sample"
          onCompleteStage={undefined}
        />
        ) : null}

      <LimsWorkspace
        header={
          <LimsHeroHeader
            icon={isPayments ? Receipt : isPickupManagement ? PackageCheck : FileText}
            title={
              isPayments
                ? 'Payment desk'
                : isTestingQueue
                  ? 'Enter results'
                  : isPickupManagement
                    ? 'Pickup management'
                    : isAllRequests
                      ? 'All requests'
                      : 'Lab intake'
            }
            description={
              isPayments
                ? 'OPD only. Assign the official receipt after the patient pays. Other categories go to the laboratory.'
                : isTestingQueue
                  ? 'Specimens already in the laboratory — enter and finalize the results here.'
                  : isPickupManagement
                    ? 'Every completed request ready for release — notify, print, and record when the patient collects results.'
                    : isAllRequests
                      ? 'Monitor every request from intake through testing and completion.'
                      : 'Select examinations, send OPD to the cashier, and receive the specimen. Corporate requests go straight to Enter results.'
            }
            badges={
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-white border border-[var(--lims-border)] px-2 py-0.5 rounded-full">
                  {isPickupManagement ? 'Results release' : 'Requisition & order'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0878e8] border border-sky-100">
                  {isPickupManagement ? releaseCounts.notPickedUp : deskRequests.length} total
                </span>
              </>
            }
            aside={
              <div className="text-right w-full">
                {isPickupManagement ? (
                  <>
                    <div className="text-2xl font-bold text-violet-800 tabular-nums leading-none">
                      {releaseCounts.notPickedUp}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-medium">Awaiting collection</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-[var(--lims-navy)] tabular-nums leading-none">
                      {deskRequests.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {isTestingQueue
                        ? 'In queue'
                        : isAllRequests
                          ? 'Tracked'
                          : isPayments
                            ? 'At desk'
                            : 'On desk'}
                    </div>
                  </>
                )}
              </div>
            }
            actions={
              canCreate && (isLabRequests || isAllRequests) ? (
                <button
                  type="button"
                  onClick={onOpenNewRequisition}
                  className="lims-btn-primary px-4 py-2 text-sm rounded-lg shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create lab test request</span>
                </button>
              ) : undefined
            }
          />
        }
        toolbar={
        <div className="p-3 sm:p-4 border-b border-[var(--lims-border)] flex flex-col gap-3 bg-[#f8fafc]/80">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                isPickupManagement
                  ? 'Search patient, case no., or exam…'
                  : 'Search case no, patient, physician, OR#, CS#...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lims-input pl-9 pr-3 py-2 text-xs"
            />
          </div>

          {!isPickupManagement ? (
          <div
            className={`grid gap-2 w-full ${
              isAllRequests
                ? 'grid-cols-2 md:grid-cols-3'
                : isPayments
                  ? 'grid-cols-3'
                  : isLabRequests
                    ? 'grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-2'
            }`}
            role="tablist"
            aria-label="Desk filters"
          >
            {(isPayments
              ? [
                  { key: 'UNPAID', label: 'Unpaid', count: deskRequests.filter((r) => !hasOfficialReceipt(r.orNumber)).length },
                  { key: 'PAID', label: 'Paid', count: deskRequests.filter((r) => hasOfficialReceipt(r.orNumber)).length },
                  { key: 'ALL', label: 'All', count: deskRequests.length },
                ]
              : isAllRequests
                ? [
                    { key: 'ALL', label: 'All', count: counts.all },
                    { key: 'NEEDS_EXAMS', label: 'Select examinations', count: counts.needsExams },
                    { key: 'AT_CASHIER', label: 'At cashier', count: counts.atCashier },
                    { key: 'READY_RECEIVE', label: 'Ready to receive', count: counts.readyReceive },
                    { key: 'IN_TESTING', label: 'In testing', count: counts.inTesting },
                    { key: 'COMPLETED', label: 'Completed', count: counts.completed },
                  ]
                : isLabRequests
                  ? [
                      { key: 'ALL', label: 'All', count: counts.all },
                      { key: 'NEEDS_EXAMS', label: 'Select examinations', count: counts.needsExams },
                      { key: 'AT_CASHIER', label: 'At cashier', count: counts.atCashier },
                      { key: 'READY_RECEIVE', label: 'Ready to receive', count: counts.readyReceive },
                    ]
                  : [
                    { key: 'ALL', label: 'All', count: counts.all },
                    { key: 'IN_TESTING', label: 'In testing', count: counts.inTesting },
                  ]
            ).map((tab) => {
              const selected = activeStatusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`min-w-0 rounded-xl border px-3 py-2 text-left cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[#0878e8] border-[#0878e8] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-[11px] font-semibold leading-tight truncate ${selected ? 'text-white/90' : 'text-slate-500'}`}>
                    {tab.label}
                  </div>
                  <div className="mt-0.5 text-lg font-bold tabular-nums leading-none">{tab.count}</div>
                </button>
              );
            })}
          </div>
          ) : null}
        </div>
        }
      >
        {isLabRequests && statusFilter === 'AT_CASHIER' && counts.atCashier > 0 ? (
          <div className="px-3 py-2 border-b border-amber-100 bg-amber-50/60">
            <p className="text-[11px] text-amber-950 leading-relaxed">
              These OPD requests already have examinations ordered. The patient must pay at the{' '}
              <strong>Cashier</strong> (official receipt) before the laboratory can receive the specimen.
            </p>
          </div>
        ) : null}

        {isPickupManagement ? (
          <div className="px-4 py-2.5 border-b border-sky-100 bg-gradient-to-r from-sky-50/80 to-white space-y-2">
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              <span className="font-semibold text-[var(--lims-navy)]">Completed results.</span>{' '}
              Notify when needed, print the official report, then tap{' '}
              <span className="font-semibold">Record pickup</span> when the patient collects.
            </p>
            {releaseCounts.all > 0 ? (
              <PickupQueueFilters
                releaseSubFilter={releaseSubFilter}
                releaseCounts={releaseCounts}
                onChange={setReleaseSubFilter}
              />
            ) : null}
          </div>
        ) : isAllRequests && activeStatusFilter === 'COMPLETED' && releaseCounts.all > 0 ? (
          <div className="px-3 py-2.5 border-b border-emerald-100 bg-emerald-50/50 space-y-2">
            <p className="text-[11px] text-emerald-950 leading-relaxed">
              <strong>Results release</strong> — notify the patient, print official forms, then record pickup.
            </p>
            <PickupQueueFilters
              releaseSubFilter={releaseSubFilter}
              releaseCounts={releaseCounts}
              onChange={setReleaseSubFilter}
            />
          </div>
        ) : null}

        {/* Table Container */}
        {isPayments ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse lims-table">
              <thead>
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Patient</th>
                  <th className="px-3 py-2.5 font-semibold">Case</th>
                  <th className="px-3 py-2.5 font-semibold">Examinations</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {statusFilter === 'UNPAID' ? 'No requests are waiting for a receipt.' : 'No requests in this list.'}
                      </p>
                      {statusFilter === 'UNPAID' && (
                        <p className="text-xs text-slate-500 mt-1">Only OPD requests are listed. Other categories go straight to the laboratory.</p>
                      )}
                    </td>
                  </tr>
                ) : pagedRequests.map((req) => {
                  const paid = hasOfficialReceipt(req.orNumber);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        openDocPanel('payment', req);
                      }}
                      className="cursor-pointer"
                    >
                      <td className="px-5 py-3 align-middle">
                        <div className="text-xs font-medium text-slate-900">{req.patientOrSubjectName || 'Patient'}</div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 tabular-nums">{req.caseNo || req.requisitionNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{requestDay(req.requestDate)}</div>
                      </td>
                      <td className="px-3 py-3 align-middle text-xs text-slate-600 max-w-[280px] truncate">{examinationSummary(req)}</td>
                      <td className="px-3 py-3 align-middle text-xs font-normal text-slate-600 whitespace-nowrap uppercase">{req.patientCategory || '—'}</td>
                      <td className="px-3 py-3 align-middle text-right text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">{formatCurrency(requestTotal(req))}</td>
                      <td className="px-5 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openDocPanel('payment', req)}
                          disabled={!canAssignOr}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md cursor-pointer disabled:opacity-60 ${
                            paid
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-[#0878e8] text-white hover:bg-[#0669c9]'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{paid ? req.orNumber : 'Assign receipt'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
        <div
          className={`overflow-x-auto ${isAllRequests ? 'lims-desk-table-scroll max-h-[min(70vh,52rem)] overflow-y-auto' : ''}`}
        >
          <table
            className={`w-full text-left border-collapse leading-snug lims-table ${
              isAllRequests ? 'lims-table--all-requests lims-table--all-requests-fixed text-xs table-fixed' : 'text-[11px]'
            }`}
          >
            <thead className={isAllRequests ? 'sticky top-0 z-[2] shadow-sm' : undefined}>
              <tr>
                <th
                  className={`font-semibold ${isAllRequests ? 'px-4 py-2.5 w-[28%]' : 'px-4 py-2 min-w-[9.5rem]'}`}
                >
                  Patient
                </th>
                {!isPickupManagement && !isAllRequests ? (
                  <th className="font-semibold px-2.5 py-2 min-w-[8.5rem]">Case</th>
                ) : null}
                <th
                  className={`font-semibold whitespace-nowrap ${
                    isAllRequests ? 'px-3 py-2.5 w-[12%]' : 'px-2.5 py-2'
                  }`}
                >
                  {isTestingQueue || isPickupManagement ? 'Updated' : 'Date'}
                </th>
                {!isAllRequests ? (
                  <th className={`font-semibold ${isPickupManagement ? 'px-2.5 py-2' : 'px-2.5 py-2 min-w-[12rem]'}`}>
                    Examinations
                  </th>
                ) : null}
                <th
                  className={`font-semibold ${isAllRequests ? 'px-3 py-2.5 w-[12%]' : 'px-2.5 py-2'}`}
                >
                  Category
                </th>
                <th
                  className={`font-semibold ${isAllRequests ? 'px-3 py-2.5 w-[16%]' : 'px-2.5 py-2 min-w-[8.5rem]'}`}
                >
                  {isPickupManagement ? 'Release status' : 'Status'}
                </th>
                <th
                  className={`font-semibold text-right ${
                    isAllRequests ? 'px-4 py-2.5 w-[32%]' : 'px-4 py-2 min-w-[15rem]'
                  }`}
                >
                  {isPickupManagement ? 'Actions' : 'Next step'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isPickupManagement ? 6 : isAllRequests ? 5 : 7}
                    className="px-5 py-14 text-center"
                  >
                    <p className="text-sm font-medium text-slate-700">No requests in this list.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {deskRequests.length === 0
                        ? isPickupManagement
                          ? 'No completed results yet. Enter and finalize results first.'
                          : isAllRequests
                            ? 'No lab test requests have been filed yet.'
                            : 'Requests appear here when they are ready for the laboratory.'
                        : 'Nothing matches this search or status.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedRequests.map((req) => {
                  const statusLabel = isPickupManagement
                    ? 'Completed'
                    : isAllRequests
                    ? requestTrackingLabel(req)
                    : needsLaboratoryExamSelection(req)
                      ? 'Select examinations'
                      : waitingAtCashier(req)
                        ? 'At cashier'
                        : isTestingQueue && (req.status === 'IN_TESTING' || req.status === 'RECEIVED')
                          ? 'In testing'
                          : req.status === 'IN_TESTING'
                            ? 'In testing'
                            : req.status === 'SUBMITTED'
                              ? readyForSpecimenReceive(req)
                                ? 'Ready to receive'
                                : waitingAtCashier(req)
                                  ? 'At cashier'
                                  : 'Submitted'
                              : req.status === 'RECEIVED'
                                ? 'In testing'
                                : req.status;
                  const actionChips = false;
                  const nextStepVariant = 'link' as const;
                  const nextStepNormalCase = isAllRequests;
                  const trackingPhase = isAllRequests ? requestTrackingPhase(req) : null;
                  const completedReleaseHint =
                    req.status === 'COMPLETED'
                      ? isResultsPickedUp(req)
                        ? `Picked up${formatResultsPickupWhen(req.resultsPickedUpAt) ? ` · ${formatResultsPickupWhen(req.resultsPickedUpAt)}` : ''}`
                        : requestReleaseLabel(req)
                      : null;
                  const examsTitle = isAllRequests ? examinationTooltip(req) : '';
                  const caseNo = (req.caseNo || req.requisitionNumber || '').trim();
                  const allRequestsRowTitle = isAllRequests
                    ? [
                        caseNo ? `Case: ${caseNo}` : '',
                        examsTitle,
                        'Use next step links or click the row',
                      ]
                        .filter(Boolean)
                        .join(' — ')
                    : '';
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        if (isPickupManagement || isTestingQueue) {
                          selectRequisition(req);
                          return;
                        }
                        if (isAllRequests) {
                          handlePipelineRowClick(req);
                          return;
                        }
                        if (req.status === 'SUBMITTED') {
                          if (needsLaboratoryExamSelection(req) && canAssignExams) {
                            setExamSelectReq(req);
                            return;
                          }
                          if (waitingAtCashier(req)) return;
                          if (canAccession && readyForSpecimenReceive(req)) {
                            setSelectedReceiveReq(req);
                            return;
                          }
                          handleOpenSlip(req);
                          return;
                        }
                        selectRequisition(req);
                      }}
                      title={
                        isPickupManagement
                          ? 'Open completed result — notify, print, or record pickup'
                          : isAllRequests
                          ? allRequestsRowTitle
                          : isTestingQueue
                          ? 'Open accessioned diagnostic specimen'
                          : req.status === 'SUBMITTED'
                            ? needsLaboratoryExamSelection(req)
                              ? 'Filed by Information Staff — click to select examinations'
                              : waitingAtCashier(req)
                                ? 'Patient at cashier — waiting for official receipt'
                                : canAccession && readyForSpecimenReceive(req)
                                  ? 'Click to receive & accession specimen'
                                  : 'View request slip'
                            : 'View request'
                      }
                      className={`cursor-pointer ${isPickupManagement || isAllRequests ? '' : 'whitespace-nowrap'}`}
                    >
                      <td className={`align-middle ${isAllRequests ? 'px-4 py-2.5' : 'px-4 py-2'}`}>
                        {(isTestingQueue || isReleaseDesk) && onSelectRequisition ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAllRequests && req.status === 'SUBMITTED') {
                                handlePipelineRowClick(req);
                              } else {
                                selectRequisition(req);
                              }
                            }}
                            className={`font-medium text-[#0878e8] hover:text-[#065bb0] underline-offset-2 hover:underline text-left cursor-pointer bg-transparent border-0 p-0 max-w-full truncate ${
                              isAllRequests ? 'text-xs' : 'text-[11px] font-normal'
                            }`}
                            title={
                              isPickupManagement
                                ? 'Open completed result'
                                : isAllRequests
                                  ? allRequestsRowTitle
                                  : 'Accessioned diagnostic specimen'
                            }
                          >
                            {req.patientOrSubjectName || 'Patient'}
                          </button>
                        ) : (
                          <span className="font-normal text-slate-900 truncate block">{req.patientOrSubjectName || 'Patient'}</span>
                        )}
                      </td>
                      {!isPickupManagement && !isAllRequests ? (
                        <td className="align-middle font-normal text-slate-800 tabular-nums truncate px-2.5 py-2">
                          {req.caseNo || req.requisitionNumber}
                        </td>
                      ) : null}
                      <td
                        className={`align-middle font-normal text-slate-600 tabular-nums whitespace-nowrap ${
                          isAllRequests ? 'px-3 py-2.5' : 'px-2.5 py-2 uppercase'
                        }`}
                      >
                        {requestDay(
                          isTestingQueue || isPickupManagement
                            ? latestUpdateStamp(req, resultUpdatedAt, latestReceivedAt(req), {
                                includeReleaseActivity: isPickupManagement,
                              })
                            : req.requestDate
                        )}
                      </td>
                      {!isAllRequests ? (
                        <td
                          className={`align-middle text-slate-600 px-2.5 py-2 truncate ${
                            isPickupManagement ? 'max-w-[min(22rem,42vw)]' : 'max-w-[220px]'
                          }`}
                        >
                          {examinationTableCell(req, false)}
                        </td>
                      ) : null}
                      <td
                        className={`align-middle font-normal text-slate-600 ${
                          isAllRequests
                            ? 'px-3 py-2.5 text-[11px] normal-case'
                            : 'px-2.5 py-2 uppercase'
                        }`}
                      >
                        {req.patientCategory || '—'}
                      </td>
                      <td className={`align-middle ${isAllRequests ? 'px-3 py-2.5' : 'px-2.5 py-2'}`}>
                        {isPickupManagement ? (
                          <PickupReleaseBadge req={req} />
                        ) : isAllRequests && trackingPhase ? (
                          <PipelineStatusBadge
                            label={statusLabel}
                            phase={trackingPhase}
                            releaseHint={completedReleaseHint}
                          />
                        ) : (
                          <>
                            <p
                              className={`font-normal uppercase ${
                                needsLaboratoryExamSelection(req)
                                  ? 'text-violet-800'
                                  : waitingAtCashier(req)
                                    ? 'text-amber-800'
                                    : req.status === 'IN_TESTING' || req.status === 'RECEIVED'
                                      ? 'text-[#014486]'
                                      : req.status === 'COMPLETED'
                                        ? 'text-emerald-700'
                                        : requestStatusTextClass(req.status)
                              }`}
                            >
                              {statusLabel}
                            </p>
                            {req.status === 'COMPLETED' ? (
                              <p
                                className={`text-[10px] font-medium mt-0.5 normal-case ${
                                  isResultsPickedUp(req)
                                    ? 'text-[#0878e8]'
                                    : isAwaitingPatientNotify(req)
                                      ? 'text-sky-700'
                                      : 'text-violet-800'
                                }`}
                              >
                                {isResultsPickedUp(req)
                                  ? `Picked up${formatResultsPickupWhen(req.resultsPickedUpAt) ? ` · ${formatResultsPickupWhen(req.resultsPickedUpAt)}` : ''}`
                                  : requestReleaseLabel(req)}
                              </p>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td
                        className={`align-middle text-right ${isAllRequests ? 'px-4 py-2.5' : 'px-4 py-2 uppercase'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPickupManagement ? (
                          <PickupRowActions
                            req={req}
                            canReleaseDesk={canReleaseDesk}
                            onOpenSlip={() => handleOpenSlip(req)}
                            onOpenRecord={() => selectRequisition(req)}
                            onPrint={
                              onOpenCompletedReport
                                ? () => {
                                    if (!canReleaseDesk) return;
                                    onOpenCompletedReport(req);
                                  }
                                : undefined
                            }
                            onNotify={
                              onNotifyResultsReady && !isResultsPickedUp(req)
                                ? () => onNotifyResultsReady(req)
                                : undefined
                            }
                            onMarkPickup={
                              onMarkResultsPickedUp
                                ? () => onMarkResultsPickedUp(req, !isResultsPickedUp(req))
                                : undefined
                            }
                          />
                        ) : (
                        <div
                          className={
                            isAllRequests
                              ? 'flex flex-wrap items-center justify-end gap-x-0.5 gap-y-1 max-w-full leading-snug'
                              : actionChips
                                ? 'flex flex-wrap items-center justify-end gap-1.5 max-w-full'
                                : 'inline-flex items-center justify-end flex-nowrap gap-0.5'
                          }
                        >
                          <NextStepLink
                            variant={nextStepVariant}
                            normalCase={nextStepNormalCase}
                            tone="muted"
                            title="Request slip"
                            onClick={() => handleOpenSlip(req)}
                          >
                            Slip
                          </NextStepLink>
                          {isAllRequests && onOpenRequestDetails && req.status === 'SUBMITTED' ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="primary"
                                title="Open request details"
                                onClick={() => onOpenRequestDetails(req)}
                              >
                                Details
                              </NextStepLink>
                            </>
                          ) : null}
                          {(isLabRequests || isAllRequests) && req.status === 'SUBMITTED' && needsLaboratoryExamSelection(req) && canAssignExams ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="primary"
                                title="Select examinations for this request"
                                onClick={() => setExamSelectReq(req)}
                              >
                                Select examinations
                              </NextStepLink>
                            </>
                          ) : null}
                          {(isLabRequests || isAllRequests) && waitingAtCashier(req) ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <span
                                className={
                                  actionChips
                                    ? 'inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold normal-case text-amber-900'
                                    : isAllRequests
                                      ? 'text-xs font-medium normal-case text-amber-800'
                                      : 'text-[11px] font-normal uppercase text-amber-800'
                                }
                                title="Cashier assigns OR on the Payments desk"
                              >
                                At cashier
                              </span>
                            </>
                          ) : null}
                          {(isLabRequests || isAllRequests) && readyForSpecimenReceive(req) ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="receive"
                                disabled={!canAccession}
                                title="Receive & accession"
                                onClick={() => {
                                  if (!canAccession) return;
                                  setSelectedReceiveReq(req);
                                }}
                              >
                                Receive
                              </NextStepLink>
                            </>
                          ) : null}
                          {(isTestingQueue ||
                            (isAllRequests && (req.status === 'RECEIVED' || req.status === 'IN_TESTING'))) &&
                          (req.status === 'RECEIVED' || req.status === 'IN_TESTING') ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="primary"
                                disabled={!canEnterResults}
                                title="Enter results"
                                onClick={() => {
                                  if (!canEnterResults) return;
                                  setSelectedResultReq(req);
                                }}
                              >
                                Enter results
                              </NextStepLink>
                            </>
                          ) : null}
                          {isReleaseDesk && req.status === 'COMPLETED' ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="primary"
                                title="Open specimen and results"
                                onClick={() => selectRequisition(req)}
                              >
                                Results
                              </NextStepLink>
                            </>
                          ) : null}
                          {isReleaseDesk && req.status === 'COMPLETED' && onOpenCompletedReport ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="print"
                                disabled={!canReleaseDesk}
                                title="Print official result forms"
                                onClick={() => {
                                  if (!canReleaseDesk) return;
                                  onOpenCompletedReport(req);
                                }}
                              >
                                Print
                              </NextStepLink>
                            </>
                          ) : null}
                          {isReleaseDesk &&
                          req.status === 'COMPLETED' &&
                          onNotifyResultsReady &&
                          canReleaseDesk &&
                          !isResultsPickedUp(req) ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="notify"
                                title="Send SMS or email that results are ready"
                                onClick={() => onNotifyResultsReady(req)}
                              >
                                Notify
                              </NextStepLink>
                            </>
                          ) : null}
                          {isReleaseDesk &&
                          req.status === 'COMPLETED' &&
                          onMarkResultsPickedUp &&
                          canReleaseDesk ? (
                            <>
                              <NextStepGap chips={actionChips} />
                              <NextStepLink
                                variant={nextStepVariant}
                                normalCase={nextStepNormalCase}
                                tone="pickup"
                                title={
                                  isResultsPickedUp(req)
                                    ? 'Clear pickup record'
                                    : 'Record that the patient collected results'
                                }
                                onClick={() =>
                                  onMarkResultsPickedUp(req, !isResultsPickedUp(req))
                                }
                              >
                                {isResultsPickedUp(req) ? 'Undo pickup' : 'Mark pickup'}
                              </NextStepLink>
                            </>
                          ) : null}
                        </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}

        <PageController
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={filtered.length}
          rangeLabel={pagination.rangeLabel}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </LimsWorkspace>
      {/* End of print:hidden page wrapper */}
      </div>

      {docPanel ? (
        <DocumentSideDrawer
          title={
            docPanel.kind === 'slip'
              ? 'Laboratory request slip'
              : docPanel.kind === 'payment'
                ? 'Order of payment'
                : 'Official Result Forms'
          }
          subtitle={docPanel.req.requisitionNumber}
          onClose={() => setDocPanel(null)}
          onPrint={() => {
            if (docPanel.kind === 'print') {
              const frame = document.querySelector('.coa-official-paper-frame');
              if (frame instanceof HTMLElement) {
                printScreenPreview(frame, paperKindForPreview(frame));
                return;
              }
            }
            window.print();
          }}
        >
          {docPanel.kind === 'slip' ? (
            <RequisitionSlipModal
              embedded
              isOpen
              requisition={docPanel.req}
              onClose={() => setDocPanel(null)}
            />
          ) : null}
          {docPanel.kind === 'payment' ? (
            <OrderOfPaymentModal
              embedded
              isOpen
              requisition={docPanel.req}
              onClose={() => setDocPanel(null)}
              onSettlePayment={onSettlePayment}
            />
          ) : null}
          {docPanel.kind === 'print' ? (
            <CoAReportModal
              embedded
              isOpen
              requisition={docPanel.req}
              onClose={() => setDocPanel(null)}
              examResults={
                storedResults[docPanel.req.id] ||
                storedResults[`rn:${docPanel.req.requisitionNumber}`]
              }
              medTechInfo={
                storedMedTechInfo[docPanel.req.id] ||
                storedMedTechInfo[`rn:${docPanel.req.requisitionNumber}`]
              }
            />
          ) : null}
        </DocumentSideDrawer>
      ) : null}

      {/* Step 2: Receive & Accession Modal with Patient Category Assignment */}
      <ReceiveAccessionModal
        isOpen={!!selectedReceiveReq}
        onClose={() => setSelectedReceiveReq(null)}
        requisition={selectedReceiveReq}
        onConfirmAccession={onReceiveAndAccession}
        currentUserName={currentUserName || 'Dr. Katherine Zhang, MD'}
      />

      {/* Step 3: Interactive Diagnostic Result Entry Modal */}
      <ResultEntryModal
        isOpen={!!selectedResultReq}
        onClose={() => setSelectedResultReq(null)}
        requisition={selectedResultReq}
        savedExamResults={
          selectedResultReq
            ? storedResults[selectedResultReq.id] ||
              storedResults[`rn:${selectedResultReq.requisitionNumber}`]
            : undefined
        }
        savedRemarks={
          selectedResultReq
            ? (
                storedMedTechInfo[selectedResultReq.id] ||
                storedMedTechInfo[`rn:${selectedResultReq.requisitionNumber}`]
              )?.remarks
            : undefined
        }
        onSaveResults={(reqId, resultsData, isFinalize, medTechInfo, options) => {
          if (onSaveResults) {
            onSaveResults(reqId, resultsData, isFinalize, medTechInfo, options);
          }
          if (isFinalize && selectedResultReq) {
            // Update modal requisition status
            setSelectedResultReq((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
          }
        }}
        onViewCoA={(req) => {
          setSelectedResultReq(null);
          openDocPanel('print', req);
        }}
        currentUserName={currentUserName}
      />

      {examinationCatalog && onAssignExaminations ? (
        <LabExamSelectionModal
          isOpen={Boolean(examSelectReq)}
          requisition={examSelectReq}
          examinationCatalog={examinationCatalog}
          onClose={() => setExamSelectReq(null)}
          onSave={onAssignExaminations}
        />
      ) : null}

    </div>
  );
};
