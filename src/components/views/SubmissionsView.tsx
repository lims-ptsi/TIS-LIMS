import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  ChevronDown, 
  BadgePercent,
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
      storageFacility: string;
      storageRoom: string;
      storageTemp: string;
      notes: string;
      orNumber?: string;
    }
  ) => void;
  onUpdatePatientCategory?: (reqId: string, category: PatientCategory) => void;
  onViewRequisitionSlip?: (req: LabTestRequisition) => void;
  onViewPaymentSlip?: (req: LabTestRequisition) => void;
  onSettlePayment?: (reqId: string, orNumber: string) => void;
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

  const filtered = requisitions.filter((r) => {
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
      ? statusFilter === 'ALL' || (statusFilter === 'PAID' ? Boolean(r.orNumber) : !r.orNumber)
      : statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenSlip = (req: LabTestRequisition) => {
    setSelectedSlipReq(req);
    if (onViewRequisitionSlip) {
      onViewRequisitionSlip(req);
    }
  };

  const handleInlineCategoryChange = (reqId: string, category: PatientCategory) => {
    if (onUpdatePatientCategory) {
      onUpdatePatientCategory(reqId, category);
    }
  };

  const counts = {
    all: requisitions.length,
    submitted: requisitions.filter(r => r.status === 'SUBMITTED').length,
    received: requisitions.filter(r => r.status === 'RECEIVED').length,
    inTesting: requisitions.filter(r => r.status === 'IN_TESTING').length,
    completed: requisitions.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Printable page background content wrapper (Hidden in Print Mode) */}
      <div className="print:hidden space-y-4">
        {/* 1. Chevron Pipeline Workflow */}
        <LifecycleChevronBar
          currentStage="Electronic Test Requisition & Intake"
          entityType="Sample"
          onCompleteStage={onOpenNewRequisition}
        />

      {/* 2. Record Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0176d3] shadow-2xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Requisition &amp; Order Management
              </span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-[#0176d3] border border-blue-200">
                {requisitions.length} Total
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {isPayments ? 'Payment Desk' : 'Lab Test Requests & Submissions'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPayments
                ? 'Assign the official receipt number after the patient pays.'
                : 'Receive specimens, enter results, and print the laboratory report.'}
            </p>
          </div>
        </div>

        {/* Action Button: Create New Request */}
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewRequisition}
              className="flex items-center gap-2 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lab Test Request</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Requisitions Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        
        {/* Search & Filter Bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
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
                  { key: 'UNPAID', label: 'Unpaid', count: requisitions.filter((r) => !r.orNumber).length },
                  { key: 'PAID', label: 'Paid', count: requisitions.filter((r) => Boolean(r.orNumber)).length },
                  { key: 'ALL', label: 'All', count: requisitions.length },
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-6 w-[22%] whitespace-nowrap text-left align-middle">Case &amp; Requisition</th>
                <th className="py-3 px-6 w-[32%] text-left align-middle">Patient &amp; Demographics</th>
                <th className="py-3 px-6 w-[18%] whitespace-nowrap text-left align-middle">Patient Category</th>
                <th className="py-3 px-6 w-[14%] whitespace-nowrap text-center align-middle">Status</th>
                <th className="py-3 px-6 w-[14%] text-right whitespace-nowrap align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No Lab Test Requests Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {requisitions.length === 0 
                        ? 'No active patient test submissions in the queue. Click the button below to register a new laboratory requisition.'
                        : 'No records matched your search or status filter criteria.'}
                    </p>
                    {requisitions.length === 0 && canCreate && (
                      <button
                        onClick={onOpenNewRequisition}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Create Lab Test Request
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr 
                    key={req.id} 
                    onClick={() => {
                      if (isPayments) {
                        if (onViewPaymentSlip) onViewPaymentSlip(req);
                        else setSelectedPaymentSlipReq(req);
                        return;
                      }
                      if (onSelectRequisition) {
                        onSelectRequisition(req);
                      } else if (canAccession) {
                        setSelectedReceiveReq(req);
                      }
                    }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    title="Click row to open details page"
                  >
                    
                    {/* 1. Case No & Requisition / Date */}
                    <td className="py-4 px-6 whitespace-nowrap align-middle">
                      <div className="font-mono font-bold text-xs text-slate-900 group-hover:text-[#0176d3] transition-colors">
                        {req.caseNo || req.externalRef || 'CASE-2026-AUTO'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="text-slate-400">{req.requisitionNumber}</span>
                        <span>•</span>
                        <span>{req.requestDate ? req.requestDate.split(' ')[0] : ''}</span>
                      </div>
                    </td>

                    {/* 2. Patient Details & Demographics */}
                    <td className="py-4 px-6 align-middle">
                      <div className="font-bold text-slate-900 text-xs uppercase tracking-tight group-hover:text-[#0176d3] transition-colors">
                        {req.patientOrSubjectName || 'Unknown Patient'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{req.patientAge || 0} Yrs · {req.patientGender || 'N/A'}</span>
                        <span>•</span>
                        <span>{req.civilStatus || 'Single'}</span>
                        {req.patientAddress && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-[200px]">{req.patientAddress}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Patient Category Pill / Inline Quick Selector */}
                    <td className="py-4 px-6 whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block w-40">
                        <select
                          value={req.patientCategory || ''}
                          onChange={(e) => {
                            const newCat = e.target.value as PatientCategory;
                            if (newCat) {
                              handleInlineCategoryChange(req.id, newCat);
                            }
                          }}
                          className={`w-full h-8 text-xs font-bold font-mono px-3 rounded-full border cursor-pointer transition-all shadow-2xs appearance-none pr-7 focus:outline-none focus:ring-1 focus:ring-[#0176d3] ${
                            req.patientCategory === 'Corporate' ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' :
                            req.patientCategory === 'PhilHealth' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' :
                            req.patientCategory === 'Indigent' ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100' :
                            req.patientCategory === 'Pre-Employment / Employee' || req.patientCategory === 'Employee' ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100' :
                            req.patientCategory === 'Projects' ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100' :
                            req.patientCategory === 'OPD' ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100' :
                            'bg-amber-50 text-amber-900 border-amber-400 font-semibold animate-pulse'
                          }`}
                          title="Click to switch patient category"
                        >
                          <option value="" disabled>Select Category</option>
                          <option value="OPD">OPD</option>
                          <option value="PhilHealth">PhilHealth</option>
                          <option value="Indigent">Indigent</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Pre-Employment / Employee">Pre-Employment / Employee</option>
                          <option value="Projects">Projects</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </td>

                    {/* 4. Status & Priority Flag */}
                    <td className="py-4 px-6 whitespace-nowrap text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-2xs ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : req.status === 'IN_TESTING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-300'
                              : req.status === 'RECEIVED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-500 ring-2 ring-emerald-200'
                              : req.status === 'IN_TESTING'
                              ? 'bg-blue-500 ring-2 ring-blue-200 animate-pulse'
                              : req.status === 'RECEIVED'
                              ? 'bg-indigo-500 ring-2 ring-indigo-200'
                              : 'bg-amber-500 ring-2 ring-amber-200'
                          }`} />
                          <span>{req.status.replace('_', ' ')}</span>
                        </span>

                        {req.priority && req.priority !== 'ROUTINE' && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                              req.priority === 'STAT'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {req.priority}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Action Buttons (Payment Slip + Requisition Slip + Receive / Accession) */}
                    <td className="py-4 px-6 text-right whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {isPayments ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewPaymentSlip) onViewPaymentSlip(req);
                              else setSelectedPaymentSlipReq(req);
                            }}
                            disabled={!canAssignOr}
                            className={`h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60 ${
                              req.orNumber
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-[#0176d3] text-white hover:bg-[#0060b2]'
                            }`}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{req.orNumber ? req.orNumber : 'Assign OR'}</span>
                          </button>
                        ) : null}
                        {!isPayments && req.patientCategory === 'OPD' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewPaymentSlip) {
                                onViewPaymentSlip(req);
                              } else {
                                setSelectedPaymentSlipReq(req);
                              }
                            }}
                            className="h-8 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Generate & Print OPD Cashier Partial Receipt / Order of Payment"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-700" />
                            <span>Payment Slip</span>
                          </button>
                        )}

                        {!isPayments && (
                        <button
                          type="button"
                          onClick={() => handleOpenSlip(req)}
                          className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="View & Print Official Laboratory Request Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0176d3]" />
                          <span>Slip</span>
                        </button>
                        )}

                        {!isPayments && req.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            disabled={!canAccession}
                            onClick={() => {
                              if (!canAccession) return;
                              setSelectedReceiveReq(req);
                            }}
                            className={`h-8 px-3.5 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 min-w-[84px] justify-center ${
                              canAccession
                                ? 'bg-[#2e844a] hover:bg-[#26713f] cursor-pointer active:scale-95'
                                : 'bg-slate-300 cursor-not-allowed opacity-70'
                            }`}
                            title={canAccession ? 'Physical reception & accessioning of specimen' : 'Your role cannot accession specimens'}
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
                            className={`h-8 px-3.5 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 min-w-[105px] justify-center ${
                              canEnterResults
                                ? 'bg-slate-900 hover:bg-black cursor-pointer active:scale-95'
                                : 'bg-slate-300 cursor-not-allowed opacity-70'
                            }`}
                            title={canEnterResults ? 'Enter laboratory analyte results and clinical flags' : 'Your role cannot enter results'}
                          >
                            <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Input Results</span>
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
                            className={`h-8 px-3.5 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 min-w-[105px] justify-center ${
                              canViewCoA
                                ? 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer active:scale-95'
                                : 'bg-slate-300 cursor-not-allowed opacity-70'
                            }`}
                            title={canViewCoA ? 'View & print official validated Certificate of Analysis' : 'Your role cannot view CoA releases'}
                          >
                            <FileCheck className="w-3.5 h-3.5 text-white" />
                            <span>CoA / Results</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
