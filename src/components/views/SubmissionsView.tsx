import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Receipt,
  FlaskConical,
  FileCheck
} from 'lucide-react';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import { RequisitionSlipModal } from '../modals/RequisitionSlipModal';
import { ReceiveAccessionModal } from '../modals/ReceiveAccessionModal';
import { OrderOfPaymentModal } from '../modals/OrderOfPaymentModal';
import { ResultEntryModal, ExamResultGroup } from '../modals/ResultEntryModal';
import { CoAReportModal } from '../modals/CoAReportModal';
import { PatientCategory, Sample, PriorityLevel } from '../../types/lims';
import type { AuthUser } from '../../types/auth';
import { EXAMINATION_CATALOG, formatCurrency, getExaminationPrice } from '../../data/examinationCatalog';
import { hasOfficialReceipt, readyForLaboratory, requiresCashier } from '../../data/requestDesk';

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
  variant?: 'queue' | 'payments';
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
  variant = 'queue',
}) => {
  const isPayments = variant === 'payments';
  const canAccession = !isPayments && permissions?.canAccessionSamples === true;
  const canEnterResults = !isPayments && permissions?.canEnterResults === true;
  const canViewCoA = !isPayments && (permissions?.canPrintResults === true || permissions?.canReleaseCoA === true);
  const canAssignOr = permissions?.canAssignOrNumber === true;
  const canCreate = !isPayments && Boolean(onOpenNewRequisition);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(isPayments ? 'UNPAID' : 'ALL');
  const [selectedSlipReq, setSelectedSlipReq] = useState<LabTestRequisition | null>(null);
  const [selectedPaymentSlipReq, setSelectedPaymentSlipReq] = useState<LabTestRequisition | null>(null);
  const [selectedReceiveReq, setSelectedReceiveReq] = useState<LabTestRequisition | null>(null);
  const [selectedResultReq, setSelectedResultReq] = useState<LabTestRequisition | null>(null);
  const [selectedCoAReq, setSelectedCoAReq] = useState<LabTestRequisition | null>(null);

  const deskRequests = requisitions.filter((r) =>
    isPayments ? requiresCashier(r.patientCategory) : readyForLaboratory(r)
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
      : statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenSlip = (req: LabTestRequisition) => {
    setSelectedSlipReq(req);
    if (onViewRequisitionSlip) {
      onViewRequisitionSlip(req);
    }
  };

  const counts = {
    all: deskRequests.length,
    submitted: deskRequests.filter(r => r.status === 'SUBMITTED').length,
    received: deskRequests.filter(r => r.status === 'RECEIVED').length,
    inTesting: deskRequests.filter(r => r.status === 'IN_TESTING').length,
    completed: deskRequests.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <div className="lims-page-shell">
      {/* Printable page background content wrapper (Hidden in Print Mode) */}
      <div className="print:hidden space-y-2">
        {/* 1. Chevron Pipeline Workflow */}
        {!isPayments && (
        <LifecycleChevronBar
          currentStage="Electronic Test Requisition & Intake"
          entityType="Sample"
          onCompleteStage={onOpenNewRequisition}
        />
        )}

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
              {isPayments ? 'Payment Desk' : 'Lab Test Requests & Submissions'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPayments
                ? 'OPD only. Assign the official receipt after the patient pays. Other categories go to the laboratory.'
                : 'PhilHealth, Indigent, Corporate, Employee, and Projects arrive here. OPD arrives after the cashier assigns the receipt.'}
            </p>
          </div>
        </div>

        {/* Action Button: Create New Request */}
        {canCreate && (
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
              : [
                  { key: 'ALL', label: 'All', count: counts.all },
                  { key: 'SUBMITTED', label: 'Submitted', count: counts.submitted },
                  { key: 'RECEIVED', label: 'Received', count: counts.received },
                  { key: 'IN_TESTING', label: 'In Testing', count: counts.inTesting },
                  { key: 'COMPLETED', label: 'Completed', count: counts.completed },
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
                ) : filtered.map((req) => {
                  const paid = hasOfficialReceipt(req.orNumber);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        if (onViewPaymentSlip) onViewPaymentSlip(req);
                        else setSelectedPaymentSlipReq(req);
                      }}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-5 py-3 align-middle">
                        <div className="text-xs font-medium text-slate-900">{req.patientOrSubjectName || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {req.patientAge || 0} yrs · {req.patientGender || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 tabular-nums">{req.caseNo || req.requisitionNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{requestDay(req.requestDate)}</div>
                      </td>
                      <td className="px-3 py-3 align-middle text-xs text-slate-600 max-w-[280px] truncate">{examinationSummary(req)}</td>
                      <td className="px-3 py-3 align-middle text-xs text-slate-600 whitespace-nowrap">{req.patientCategory || '—'}</td>
                      <td className="px-3 py-3 align-middle text-right text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">{formatCurrency(requestTotal(req))}</td>
                      <td className="px-5 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onViewPaymentSlip) onViewPaymentSlip(req);
                            else setSelectedPaymentSlipReq(req);
                          }}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-semibold">Patient</th>
                <th className="px-3 py-2.5 font-semibold">Case</th>
                <th className="px-3 py-2.5 font-semibold">Examinations</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold text-right">Next step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-slate-700">No requests in this list.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {deskRequests.length === 0
                        ? 'Requests appear here when they are ready for the laboratory.'
                        : 'Nothing matches this search or status.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const statusLabel = req.status === 'IN_TESTING' ? 'In testing' : req.status === 'SUBMITTED' ? 'Submitted' : req.status === 'RECEIVED' ? 'Received' : req.status === 'COMPLETED' ? 'Completed' : req.status;
                  const statusTone = req.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : req.status === 'IN_TESTING'
                    ? 'bg-blue-50 text-[#014486] border-blue-200'
                    : req.status === 'RECEIVED'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200';
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        if (req.status === 'SUBMITTED') {
                          if (canAccession) {
                            setSelectedReceiveReq(req);
                          } else {
                            handleOpenSlip(req);
                          }
                          return;
                        }
                        if (onSelectRequisition) onSelectRequisition(req);
                      }}
                      title={
                        req.status === 'SUBMITTED'
                          ? canAccession
                            ? 'Specimen not yet received — click to receive & accession'
                            : 'Specimen pending laboratory receiving — click to view request slip'
                          : 'Click to view specimen details & enter analytical results'
                      }
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-5 py-3 align-middle">
                        <div className="text-xs font-medium text-slate-900">{req.patientOrSubjectName || 'Patient'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {req.patientAge || 0} yrs · {req.patientGender || '—'}{req.civilStatus ? ` · ${req.civilStatus}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 tabular-nums">{req.caseNo || req.requisitionNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{requestDay(req.requestDate)}</div>
                      </td>
                      <td className="px-3 py-3 align-middle text-xs text-slate-600 max-w-[280px] truncate">{examinationSummary(req)}</td>
                      <td className="px-3 py-3 align-middle text-xs text-slate-600 whitespace-nowrap">{req.patientCategory || '—'}</td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${statusTone}`}>
                            {statusLabel}
                          </span>
                          {req.priority && req.priority !== 'ROUTINE' && (
                            <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${
                              req.priority === 'STAT' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {req.priority === 'STAT' ? 'Stat' : 'Priority'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenSlip(req)}
                            className="inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Print the laboratory request slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Slip</span>
                          </button>
                          {requiresCashier(req.patientCategory) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewPaymentSlip) onViewPaymentSlip(req);
                                else setSelectedPaymentSlipReq(req);
                              }}
                              className="inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                              title="Print the OPD order of payment"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Payment</span>
                            </button>
                          )}
                          {req.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              disabled={!canAccession}
                              onClick={() => {
                                if (!canAccession) return;
                                setSelectedReceiveReq(req);
                              }}
                              className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold rounded-md text-white ${
                                canAccession ? 'bg-[#2e844a] hover:bg-[#26713f] cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Receive</span>
                            </button>
                          )}
                          {(req.status === 'RECEIVED' || req.status === 'IN_TESTING') && (
                            <button
                              type="button"
                              disabled={!canEnterResults}
                              onClick={() => {
                                if (!canEnterResults) return;
                                setSelectedResultReq(req);
                              }}
                              className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold rounded-md text-white ${
                                canEnterResults ? 'bg-[#0176d3] hover:bg-[#0060b2] cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <FlaskConical className="w-3.5 h-3.5" />
                              <span>Enter results</span>
                            </button>
                          )}
                          {req.status === 'COMPLETED' && (
                            <button
                              type="button"
                              disabled={!canViewCoA}
                              onClick={() => {
                                if (!canViewCoA) return;
                                setSelectedCoAReq(req);
                              }}
                              className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold rounded-md text-white ${
                                canViewCoA ? 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Print results</span>
                            </button>
                          )}
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

      </div>
      {/* End of print:hidden page wrapper */}
      </div>

      {/* Official Requisition Slip Modal */}
      <RequisitionSlipModal
        isOpen={!!selectedSlipReq}
        onClose={() => setSelectedSlipReq(null)}
        requisition={selectedSlipReq}
      />

      {/* Official OPD Order of Payment / Partial Receipt Modal */}
      <OrderOfPaymentModal
        isOpen={!!selectedPaymentSlipReq}
        onClose={() => setSelectedPaymentSlipReq(null)}
        requisition={selectedPaymentSlipReq}
        onSettlePayment={onSettlePayment}
      />

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
          setSelectedCoAReq(req);
        }}
        currentUserName={currentUserName}
      />

      {/* Step 4: Official Certificate of Analysis (CoA) Diagnostic Report Modal */}
      <CoAReportModal
        isOpen={!!selectedCoAReq}
        onClose={() => setSelectedCoAReq(null)}
        requisition={selectedCoAReq}
        examResults={
          selectedCoAReq
            ? storedResults[selectedCoAReq.id] ||
              storedResults[`rn:${selectedCoAReq.requisitionNumber}`]
            : undefined
        }
        medTechInfo={
          selectedCoAReq
            ? storedMedTechInfo[selectedCoAReq.id] ||
              storedMedTechInfo[`rn:${selectedCoAReq.requisitionNumber}`]
            : undefined
        }
      />
    </div>
  );
};
