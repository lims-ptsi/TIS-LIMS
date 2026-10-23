import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Receipt,
} from 'lucide-react';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import { RequisitionSlipModal } from '../modals/RequisitionSlipModal';
import { ReceiveAccessionModal } from '../modals/ReceiveAccessionModal';
import { OrderOfPaymentModal } from '../modals/OrderOfPaymentModal';
import { ResultEntryModal, ExamResultGroup } from '../modals/ResultEntryModal';
import { CoAReportModal } from '../modals/CoAReportModal';
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
  requiresCashier,
  waitingAtCashier,
  requestTrackingPhase,
  requestTrackingLabel,
} from '../../data/requestDesk';
import { ExaminationItem } from '../../data/examinationCatalog';
import { LabExamSelectionModal } from '../modals/LabExamSelectionModal';
import { PageController } from '../common/PageController';
import { paginateSlice, usePagination } from '../../utils/pagination';

interface SubmissionsViewProps {
  requisitions: LabTestRequisition[];
  onOpenNewRequisition?: () => void;
  onSelectRequisition?: (req: LabTestRequisition) => void;
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
  currentUserName?: string;
  permissions?: AuthUser['permissions'];
  variant?: 'lab-requests' | 'testing-queue' | 'payments' | 'all-requests' | 'queue';
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
  onNotifyResultsReady?: (req: LabTestRequisition) => void;
  examinationCatalog?: ExaminationItem[];
  onAssignExaminations?: (req: LabTestRequisition, examNames: string[]) => void | Promise<void>;
  onOpenRequestDetails?: (req: LabTestRequisition) => void;
  pipelineFilter?: string | null;
  onPipelineFilterApplied?: () => void;
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
      return 'text-[#0176d3] hover:text-[#014486]';
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

function NextStepLink({
  children,
  onClick,
  disabled,
  tone = 'muted',
  title,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: NextStepTone;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-normal uppercase leading-none bg-transparent border-0 p-0 m-0 cursor-pointer underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0176d3] disabled:cursor-not-allowed ${nextStepToneClass(tone, disabled)}`}
    >
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden /> : null}
      <span className="uppercase">{children}</span>
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
}) => {
  const deskVariant =
    variant === 'all-requests'
      ? 'all-requests'
      : variant === 'queue' || variant === 'lab-requests'
        ? 'lab-requests'
        : variant === 'testing-queue'
          ? 'testing-queue'
          : 'payments';
  const isPayments = deskVariant === 'payments';
  const isLabRequests = deskVariant === 'lab-requests';
  const isTestingQueue = deskVariant === 'testing-queue';
  const isAllRequests = deskVariant === 'all-requests';
  const canAccession = !isPayments && permissions?.canAccessionSamples === true;
  const canAssignExams =
    !isPayments &&
    Boolean(onAssignExaminations && examinationCatalog?.length && canAccession);
  const canEnterResults = !isPayments && permissions?.canEnterResults === true;
  const canAssignOr = permissions?.canAssignOrNumber === true;
  const canCreate = !isPayments && Boolean(onOpenNewRequisition);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(isPayments ? 'UNPAID' : 'ALL');

  useEffect(() => {
    if (!pipelineFilter) return;
    setStatusFilter(pipelineFilter);
    onPipelineFilterApplied?.();
  }, [pipelineFilter, onPipelineFilterApplied]);
  const [docPanel, setDocPanel] = useState<{
    kind: 'slip' | 'payment' | 'print';
    req: LabTestRequisition;
  } | null>(null);
  const [examSelectReq, setExamSelectReq] = useState<LabTestRequisition | null>(null);
  const [selectedReceiveReq, setSelectedReceiveReq] = useState<LabTestRequisition | null>(null);
  const [selectedResultReq, setSelectedResultReq] = useState<LabTestRequisition | null>(null);

  const sortDeskRequests = (list: LabTestRequisition[]) => {
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
    isAllRequests
      ? requisitions
      : requisitions.filter((r) => {
          if (isPayments) return readyForCashierSettlement(r);
          if (isLabRequests) return onLabRequestDesk(r);
          if (isTestingQueue) return onTestingDesk(r);
          return onLabRequestDesk(r);
        })
  );

  const filtered = deskRequests.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (r.requisitionNumber && r.requisitionNumber.toLowerCase().includes(query)) ||
      (r.patientOrSubjectName && r.patientOrSubjectName.toLowerCase().includes(query)) ||
      (r.caseNo && r.caseNo.toLowerCase().includes(query)) ||
      (r.orNumber && r.orNumber.toLowerCase().includes(query)) ||
      (r.chargeSlipNumber && r.chargeSlipNumber.toLowerCase().includes(query)) ||
      (r.orderingPhysicianOrPI && r.orderingPhysicianOrPI.toLowerCase().includes(query)) ||
      (r.kindOfExamination && Array.isArray(r.kindOfExamination) && r.kindOfExamination.some((k) => k && k.toLowerCase().includes(query)));

    const matchesStatus = isPayments
      ? statusFilter === 'ALL' || (statusFilter === 'PAID' ? hasOfficialReceipt(r.orNumber) : !hasOfficialReceipt(r.orNumber))
      : isAllRequests
        ? statusFilter === 'ALL' || requestTrackingPhase(r) === statusFilter
        : isLabRequests
          ? statusFilter === 'NEEDS_EXAMS'
            ? needsLaboratoryExamSelection(r)
            : statusFilter === 'AT_CASHIER'
              ? waitingAtCashier(r)
              : statusFilter === 'READY_RECEIVE'
                ? readyForLaboratory(r) &&
                  r.status === 'SUBMITTED' &&
                  requiresCashier(r.patientCategory)
                : statusFilter === 'ALL' || r.status === statusFilter
          : isTestingQueue
            ? statusFilter === 'ALL' ||
              (statusFilter === 'IN_TESTING' &&
                (r.status === 'IN_TESTING' || r.status === 'RECEIVED'))
            : statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination(filtered.length, [searchQuery, statusFilter, deskVariant], 15);
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
    readyReceive: deskRequests.filter(
      (r) =>
        r.status === 'SUBMITTED' &&
        readyForLaboratory(r) &&
        !needsLaboratoryExamSelection(r) &&
        requiresCashier(r.patientCategory)
    ).length,
    inTesting: deskRequests.filter((r) => r.status === 'IN_TESTING' || r.status === 'RECEIVED').length,
    completed: deskRequests.filter((r) => r.status === 'COMPLETED').length,
    other: deskRequests.filter((r) => requestTrackingPhase(r) === 'OTHER').length,
  };

  const handlePipelineRowClick = (req: LabTestRequisition) => {
    if (isTestingQueue || (isAllRequests && (req.status === 'IN_TESTING' || req.status === 'RECEIVED' || req.status === 'COMPLETED'))) {
      onSelectRequisition?.(req);
      return;
    }
    if (req.status === 'SUBMITTED') {
      if (needsLaboratoryExamSelection(req) && canAssignExams) {
        setExamSelectReq(req);
        return;
      }
      if (waitingAtCashier(req)) return;
      if (requiresCashier(req.patientCategory) && canAccession && readyForLaboratory(req)) {
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
    if (onSelectRequisition) onSelectRequisition(req);
  };

  return (
    <div className="lims-page-shell">
      {/* Printable page background content wrapper (Hidden in Print Mode) */}
      <div className="print:hidden space-y-2">
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

      {/* 2. Record Header Card */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0176d3] shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Requisition &amp; Order Management
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0176d3] border border-blue-200">
                {deskRequests.length} Total
              </span>
            </div>
            <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
              {isPayments
                ? 'Payment Desk'
                : isTestingQueue
                  ? 'Testing queue'
                  : isAllRequests
                    ? 'All requests'
                    : 'Request queue'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPayments
                ? 'OPD only. Assign the official receipt after the patient pays. Other categories go to the laboratory.'
                : isTestingQueue
                  ? 'Specimens already received — enter and finalize analytical results here.'
                  : isAllRequests
                    ? 'Monitor every request from intake through testing and completion. Open a row to view details or the next action.'
                    : 'Start with Info desk intake (select examinations). OPD then goes to the cashier for OR before receive. Non-OPD advances to the Testing queue after exams are ordered.'}
            </p>
          </div>
        </div>

        {/* Action Button: Create New Request */}
        {canCreate && (isLabRequests || isAllRequests) && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewRequisition}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-[11px] font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lab Test Request</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Requisitions Table Card */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        
        {/* Search & Filter Bar */}
        <div className="p-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search case no, patient, physician, OR#, CS#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(isPayments
              ? [
                  { key: 'UNPAID', label: 'Unpaid', count: deskRequests.filter((r) => !hasOfficialReceipt(r.orNumber)).length },
                  { key: 'PAID', label: 'Paid', count: deskRequests.filter((r) => hasOfficialReceipt(r.orNumber)).length },
                  { key: 'ALL', label: 'All', count: deskRequests.length },
                ]
              : isAllRequests
                ? [
                    { key: 'ALL', label: 'All', count: counts.all },
                    { key: 'NEEDS_EXAMS', label: 'Info desk intake', count: counts.needsExams },
                    { key: 'AT_CASHIER', label: 'At cashier', count: counts.atCashier },
                    { key: 'READY_RECEIVE', label: 'Ready to receive', count: counts.readyReceive },
                    { key: 'IN_TESTING', label: 'In testing', count: counts.inTesting },
                    { key: 'COMPLETED', label: 'Completed', count: counts.completed },
                  ]
                : isLabRequests
                  ? [
                      { key: 'ALL', label: 'All', count: counts.all },
                      { key: 'NEEDS_EXAMS', label: 'Info desk intake', count: counts.needsExams },
                      { key: 'AT_CASHIER', label: 'At cashier', count: counts.atCashier },
                      { key: 'READY_RECEIVE', label: 'Ready to receive', count: counts.readyReceive },
                    ]
                  : [
                    { key: 'ALL', label: 'All', count: counts.all },
                    { key: 'IN_TESTING', label: 'In testing', count: counts.inTesting },
                  ]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-[#0176d3] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLabRequests && statusFilter === 'AT_CASHIER' && counts.atCashier > 0 ? (
          <div className="px-3 py-2 border-b border-amber-100 bg-amber-50/60">
            <p className="text-[11px] text-amber-950 leading-relaxed">
              These OPD requests already have examinations ordered. The patient must pay at the{' '}
              <strong>Cashier</strong> (official receipt) before the laboratory can receive the specimen.
            </p>
          </div>
        ) : null}

        {/* Table Container */}
        {isPayments ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
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
                              : 'bg-[#0176d3] text-white hover:bg-[#0060b2]'
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] leading-snug">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-semibold">Patient</th>
                <th className="px-2.5 py-2 font-semibold">Case</th>
                <th className="px-2.5 py-2 font-semibold">Date</th>
                <th className="px-2.5 py-2 font-semibold">Examinations</th>
                <th className="px-2.5 py-2 font-semibold">Category</th>
                <th className="px-2.5 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold text-right">Next step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-slate-700">No requests in this list.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {deskRequests.length === 0
                        ? isAllRequests
                          ? 'No lab test requests have been filed yet.'
                          : 'Requests appear here when they are ready for the laboratory.'
                        : 'Nothing matches this search or status.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedRequests.map((req) => {
                  const statusLabel = isAllRequests
                    ? requestTrackingLabel(req)
                    : needsLaboratoryExamSelection(req)
                      ? 'Info desk intake'
                      : waitingAtCashier(req)
                        ? 'At cashier'
                        : isTestingQueue && (req.status === 'IN_TESTING' || req.status === 'RECEIVED')
                          ? 'In testing'
                          : req.status === 'IN_TESTING'
                            ? 'In testing'
                            : req.status === 'SUBMITTED'
                              ? readyForLaboratory(req) && requiresCashier(req.patientCategory)
                                ? 'Ready to receive'
                                : waitingAtCashier(req)
                                  ? 'At cashier'
                                  : 'Submitted'
                              : req.status === 'RECEIVED'
                                ? 'In testing'
                                : req.status;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        if (isTestingQueue) {
                          onSelectRequisition?.(req);
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
                          if (
                            requiresCashier(req.patientCategory) &&
                            canAccession &&
                            readyForLaboratory(req)
                          ) {
                            setSelectedReceiveReq(req);
                            return;
                          }
                          handleOpenSlip(req);
                          return;
                        }
                        if (onSelectRequisition) onSelectRequisition(req);
                      }}
                      title={
                        isAllRequests
                          ? 'Open request or next action'
                          : isTestingQueue
                          ? 'Open accessioned diagnostic specimen'
                          : req.status === 'SUBMITTED'
                            ? needsLaboratoryExamSelection(req)
                              ? 'Filed by Information Staff — click to select examinations'
                              : waitingAtCashier(req)
                                ? 'Patient at cashier — waiting for official receipt'
                                : requiresCashier(req.patientCategory) &&
                                    canAccession &&
                                    readyForLaboratory(req)
                                  ? 'Click to receive & accession (OPD after OR)'
                                  : 'View request slip'
                            : 'View request'
                      }
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      <td className="px-4 py-2 align-middle">
                        {(isTestingQueue || isAllRequests) && onSelectRequisition ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAllRequests && req.status === 'SUBMITTED') {
                                handlePipelineRowClick(req);
                              } else {
                                onSelectRequisition(req);
                              }
                            }}
                            className="text-[11px] font-normal text-[#0176d3] hover:text-[#014486] underline-offset-2 hover:underline text-left cursor-pointer bg-transparent border-0 p-0"
                            title={isAllRequests ? 'Open request' : 'Accessioned diagnostic specimen'}
                          >
                            {req.patientOrSubjectName || 'Patient'}
                          </button>
                        ) : (
                          <span className="font-normal text-slate-900">{req.patientOrSubjectName || 'Patient'}</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 align-middle font-normal text-slate-800 tabular-nums">
                        {req.caseNo || req.requisitionNumber}
                      </td>
                      <td className="px-2.5 py-2 align-middle font-normal text-slate-600 tabular-nums whitespace-nowrap uppercase">
                        {requestDay(req.requestDate)}
                      </td>
                      <td className="px-2.5 py-2 align-middle text-slate-600 max-w-[220px] truncate">
                        {examinationSummary(req)}
                      </td>
                      <td className="px-2.5 py-2 align-middle font-normal text-slate-600 uppercase">{req.patientCategory || '—'}</td>
                      <td className="px-2.5 py-2 align-middle">
                        <span
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
                        </span>
                      </td>
                      <td className="px-4 py-2 align-middle text-right uppercase" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end flex-nowrap gap-0.5">
                          <NextStepLink tone="muted" title="Request slip" onClick={() => handleOpenSlip(req)}>
                            Slip
                          </NextStepLink>
                          {isAllRequests && onOpenRequestDetails && req.status === 'SUBMITTED' ? (
                            <>
                              <NextStepDot />
                              <NextStepLink
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
                              <NextStepDot />
                              <NextStepLink
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
                              <NextStepDot />
                              <span className="text-[11px] font-normal uppercase text-amber-800" title="Cashier assigns OR on the Payments desk">
                                At cashier
                              </span>
                            </>
                          ) : null}
                          {(isLabRequests || isAllRequests) &&
                          req.status === 'SUBMITTED' &&
                          !needsLaboratoryExamSelection(req) &&
                          !waitingAtCashier(req) &&
                          requiresCashier(req.patientCategory) ? (
                            <>
                              <NextStepDot />
                              <NextStepLink
                                tone="receive"
                                disabled={!canAccession || !readyForLaboratory(req)}
                                title="Receive & accession"
                                onClick={() => {
                                  if (!canAccession || !readyForLaboratory(req)) return;
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
                              <NextStepDot />
                              <NextStepLink
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
                        </div>
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
      </div>
      {/* End of print:hidden page wrapper */}
      </div>

      {docPanel ? (
        <DocumentSideDrawer
          title={
            docPanel.kind === 'slip'
              ? 'Laboratory request slip'
              : docPanel.kind === 'payment'
                ? 'Order of payment'
                : 'Print results'
          }
          subtitle={docPanel.req.requisitionNumber}
          onClose={() => setDocPanel(null)}
          onPrint={() => window.print()}
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
