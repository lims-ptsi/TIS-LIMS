import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  BadgePercent,
  Barcode,
  Receipt,
  AlertCircle,
  FlaskConical,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { LabTestRequisition, PatientCategory, PriorityLevel, Sample } from '../../types/lims';
import { hasOfficialReceipt, readyForLaboratory, requiresCashier } from '../../data/requestDesk';
import { buildAccessionSpecimenPlan } from '../../utils/accessionSpecimen';
import { DocumentSideDrawer } from './DocumentSideDrawer';
import { OrderOfPaymentModal } from './OrderOfPaymentModal';

interface ReceiveAccessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: LabTestRequisition | null;
  onConfirmAccession: (
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
  currentUserName: string;
  existingSamples?: Sample[];
}

const CATEGORY_OPTIONS: { value: PatientCategory; label: string }[] = [
  { value: 'OPD', label: 'OPD — Outpatient walk-in' },
  { value: 'PhilHealth', label: 'PhilHealth — NHIP' },
  { value: 'Indigent', label: 'Indigent — subsidized care' },
  { value: 'Corporate', label: 'Corporate — company / HMO' },
  { value: 'Pre-Employment / Employee', label: 'Pre-employment / employee screening' },
  { value: 'Projects', label: 'Projects — studies & trials' },
];

function ModalSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5">
        <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">{title}</h3>
        {description ? <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p> : null}
      </div>
      <div className="rounded-lg border border-[#d8dde6] bg-white p-4 shadow-xs">{children}</div>
    </section>
  );
}

function HeaderFact({
  label,
  value,
  onClick,
  tone = 'default',
}: {
  label: string;
  value: string;
  onClick?: () => void;
  tone?: 'default' | 'receipt';
}) {
  const className =
    tone === 'receipt'
      ? 'rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-left cursor-pointer hover:bg-emerald-100 min-w-0'
      : 'rounded-md border border-slate-200 bg-white px-2 py-1 text-left min-w-0';
  const body = (
    <>
      <span className={`block text-[9px] font-medium uppercase tracking-wide leading-none ${tone === 'receipt' ? 'text-emerald-700' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className={`mt-0.5 block text-[11px] font-semibold tabular-nums truncate leading-tight ${tone === 'receipt' ? 'text-emerald-950' : 'text-slate-900'}`}>
        {value}
      </span>
    </>
  );
  if (!onClick) {
    return <div className={className}>{body}</div>;
  }
  return (
    <button type="button" onClick={onClick} title="View official receipt" className={className}>
      {body}
    </button>
  );
}

export const ReceiveAccessionModal: React.FC<ReceiveAccessionModalProps> = ({
  isOpen,
  onClose,
  requisition,
  onConfirmAccession,
  currentUserName: _currentUserName,
  existingSamples: _existingSamples = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PatientCategory>('OPD');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('Whole Blood');
  const [matrix, setMatrix] = useState<string>('K2-EDTA Anticoagulated Whole Blood');
  const [tubeCount, setTubeCount] = useState<number>(2);
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [storageRoom] = useState<string>('Clinical Lab');
  const [storageTemp] = useState<string>('+4°C');
  const [orNumber, setOrNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [closing, setClosing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const specimenPlan = requisition ? buildAccessionSpecimenPlan(requisition) : null;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
  };

  useEffect(() => {
    if (!requisition) return;

    const plan = buildAccessionSpecimenPlan(requisition);
    setSampleType(plan.primarySampleType);
    setMatrix(plan.primaryMatrix);
    setPriority(requisition.priority || 'ROUTINE');
    setTubeCount(plan.tubeCount);
    setNotes(requisition.clinicalNotes || '');
    setOrNumber(requisition.orNumber && requisition.orNumber !== 'N/A' ? requisition.orNumber : '');
    setSelectedCategory(requisition.patientCategory || 'OPD');
    setFormError('');
    setReceiptOpen(false);
  }, [requisition]);

  useEffect(() => {
    if (isOpen) setClosing(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 280);
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [closing, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || receiptOpen) return;
      requestClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closing, receiptOpen]);

  if (!isOpen || !requisition) return null;

  const billingCategory = requisition.patientCategory || 'OPD';
  const opdAwaitingCashier =
    requisition.status === 'SUBMITTED' &&
    requiresCashier(billingCategory) &&
    !readyForLaboratory(requisition);
  const editingCategoryOnly =
    requisition.status === 'RECEIVED' || requisition.status === 'IN_TESTING';
  const exams = requisition.kindOfExamination?.length
    ? requisition.kindOfExamination
    : requisition.selectedTestNames || [];
  const receiptDraft = orNumber.trim() || (requisition.orNumber || '').trim();
  const orVerified = requiresCashier(billingCategory) && hasOfficialReceipt(receiptDraft);
  const receiptLabel = hasOfficialReceipt(receiptDraft) ? receiptDraft.toUpperCase() : '—';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = orNumber.trim().toUpperCase();
    const mergedOr = receipt || (requisition.orNumber || '').trim();
    if (requiresCashier(billingCategory) && !hasOfficialReceipt(mergedOr)) {
      setFormError(
        'OPD requests need an official receipt (OR) from the cashier before the laboratory can receive the specimen.'
      );
      return;
    }
    if (requisition.status === 'SUBMITTED' && !readyForLaboratory(requisition)) {
      setFormError('This request is not ready for receiving yet.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    onConfirmAccession(requisition, {
      patientCategory: selectedCategory,
      sampleType,
      matrix,
      tubeCount: Number(tubeCount) || 1,
      priority,
      storageFacility: 'Central Laboratory',
      storageRoom,
      storageTemp,
      notes,
      orNumber: hasOfficialReceipt(mergedOr) ? mergedOr.toUpperCase() : requisition.orNumber,
    });

    setIsSubmitting(false);
    requestClose();
  };

  const canViewReceipt = hasOfficialReceipt(receiptDraft);
  const openReceipt = () => {
    if (canViewReceipt) setReceiptOpen(true);
  };
  const receiptRequisition: LabTestRequisition = {
    ...requisition,
    orNumber: canViewReceipt ? receiptDraft.toUpperCase() : requisition.orNumber,
  };

  return createPortal(
    <>
    <div
      className="fixed inset-0 z-[60] flex justify-end print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-accession-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close receive panel"
        onClick={requestClose}
      />
      <div
        className={`relative h-full w-full sm:w-[min(860px,94vw)] bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] overflow-hidden text-slate-900 will-change-transform ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eaf5ea] border border-[#b8ddb9] flex items-center justify-center text-[#2e844a] shrink-0">
                <Barcode className="w-[18px] h-[18px]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0176d3]">
                  Laboratory intake
                </p>
                <h2 id="receive-accession-title" className="text-lg font-semibold text-slate-900 leading-snug tracking-tight mt-0.5">
                  {editingCategoryOnly ? 'Update patient category' : 'Receive & accession specimen'}
                </h2>
                {!editingCategoryOnly ? (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Verify billing and assign specimen details before barcode generation.
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="p-2 -mr-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mx-6 mb-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white border border-[#c5d9f7] flex items-center justify-center text-[#0176d3] shrink-0">
                <UserRound className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate" title={requisition.patientOrSubjectName}>
                  {requisition.patientOrSubjectName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {requisition.patientAge} yrs · {requisition.patientGender}
                  {requisition.orderingPhysicianOrPI ? ` · ${requisition.orderingPhysicianOrPI}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <HeaderFact label="Case" value={requisition.caseNo || requisition.externalRef || '—'} />
              <HeaderFact
                label="Receipt"
                value={receiptLabel}
                tone={canViewReceipt ? 'receipt' : 'default'}
                onClick={canViewReceipt ? openReceipt : undefined}
              />
              <HeaderFact label="Request" value={requisition.requisitionNumber} />
            </div>
          </div>
        </div>

        <form id="accession-form" onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto flex-1 space-y-5 text-[13px]">
          <ModalSection title="Request summary" description="Demographics and ordered work from the lab request.">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-[11px] font-medium text-slate-500">Age & sex</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {requisition.patientAge} yrs · {requisition.patientGender}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-slate-500">Civil status</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{requisition.civilStatus || 'Single'}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-medium text-slate-500">Ordering physician</dt>
                <dd className="mt-0.5 font-medium text-slate-900 truncate" title={requisition.orderingPhysicianOrPI}>
                  {requisition.orderingPhysicianOrPI || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-slate-500">Official receipt</dt>
                <dd className="mt-0.5">
                  {canViewReceipt ? (
                    <button
                      type="button"
                      onClick={openReceipt}
                      className="font-semibold text-[#0176d3] tabular-nums underline-offset-2 hover:underline cursor-pointer"
                    >
                      {receiptLabel}
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-900 tabular-nums">{receiptLabel}</span>
                  )}
                </dd>
              </div>
            </dl>
            {exams.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-500 mb-2">Examinations</p>
                <ul className="flex flex-wrap gap-1.5">
                  {exams.map((t) => (
                    <li
                      key={t}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-800"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </ModalSection>

          {opdAwaitingCashier ? (
            <div className="flex gap-3 rounded-lg border border-amber-200/90 bg-amber-50 px-4 py-3 text-xs text-amber-950 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Payment is pending at the cashier. Once the OR is recorded, this request will show as{' '}
                <span className="font-semibold">Ready to receive</span> on Lab intake.
              </p>
            </div>
          ) : null}

          {formError ? (
            <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          ) : null}

          {requiresCashier(billingCategory) ? (
            <ModalSection
              title="Official receipt"
              description={
                canViewReceipt
                  ? 'Click the receipt number to open the cashier receipt.'
                  : 'Match this number with the printed receipt from the cashier.'
              }
            >
              <div className="space-y-3">
                <div>
                  {canViewReceipt ? (
                    <button
                      type="button"
                      onClick={openReceipt}
                      className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-left cursor-pointer hover:bg-emerald-100"
                    >
                      <p className="text-[11px] font-medium text-emerald-800">Official receipt</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-950 tabular-nums">{receiptLabel}</p>
                      <p className="mt-1 text-[11px] font-medium text-emerald-700">View receipt</p>
                    </button>
                  ) : (
                    <div className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] font-medium text-emerald-800">Official receipt</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-950 tabular-nums">{receiptLabel}</p>
                    </div>
                  )}
                </div>
                {orVerified ? (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      OR <span className="font-semibold tabular-nums">{receiptLabel}</span> is on file.
                      Confirm it matches the printed receipt.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-950">
                    <Receipt className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Enter or confirm the official receipt number from the cashier.</span>
                  </div>
                )}
                <div>
                  <label htmlFor="or-number" className="text-[11px] font-medium text-slate-600 block mb-1.5">
                    Official receipt (OR) number
                  </label>
                  <input
                    id="or-number"
                    type="text"
                    placeholder="e.g. OR-57772"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#d8dde6] text-[13px] text-slate-900 tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-[#0176d3]/20"
                  />
                </div>
              </div>
            </ModalSection>
          ) : null}

          <ModalSection
            title="Accession details"
            description="Category and specimen handling applied when the sample is received."
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="patient-category" className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1.5">
                  <BadgePercent className="w-3.5 h-3.5 text-[#0176d3]" />
                  Patient category
                </label>
                <select
                  id="patient-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as PatientCategory)}
                  required
                  disabled={opdAwaitingCashier}
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#d8dde6] text-[13px] text-slate-900 focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-[#0176d3]/20 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-shadow"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Intake classification: <span className="font-medium text-slate-700">{billingCategory}</span>
                </p>
              </div>

              <div className="rounded-lg bg-slate-50/90 border border-slate-100 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <FlaskConical className="w-3.5 h-3.5 text-[#0176d3]" />
                  Suggested specimen
                </div>
                {specimenPlan?.multipleContainers ? (
                  <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 leading-relaxed">
                    This order needs <strong>{specimenPlan.lines.length} different containers</strong>. Collect and
                    label each type below. The first accession record uses the primary blood/serum line when present.
                  </p>
                ) : null}
                <div className="space-y-2.5">
                  {(specimenPlan?.lines || []).map((line) => (
                    <div
                      key={`${line.sampleType}-${line.matrix}`}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs"
                    >
                      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                        {line.examinationNames.join(' · ')}
                      </div>
                      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <dt className="text-[10px] text-slate-500">Type</dt>
                          <dd className="font-semibold text-slate-900">{line.sampleType}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] text-slate-500">Matrix / container</dt>
                          <dd className="font-medium text-slate-900 leading-snug">{line.matrix}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Primary accession (barcode)
                    </dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">{sampleType}</dd>
                    <dd className="text-[11px] text-slate-600 leading-snug">{matrix}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Containers to collect
                    </dt>
                    <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">{tubeCount}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </ModalSection>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 leading-relaxed hidden sm:block max-w-[240px]">
            {editingCategoryOnly
              ? 'Updates billing category on this accession.'
              : 'Creates the accession record and specimen barcode.'}
          </p>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-[#d8dde6] rounded-lg text-slate-700 hover:bg-white text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="accession-form"
              disabled={isSubmitting || opdAwaitingCashier}
              className="inline-flex items-center justify-center gap-2 min-w-[200px] px-5 py-2.5 bg-[#2e844a] hover:bg-[#26713f] disabled:opacity-60 disabled:hover:bg-[#2e844a] text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.25} />
                  {editingCategoryOnly ? 'Save category' : 'Confirm accession & barcode'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    {receiptOpen ? (
      <DocumentSideDrawer
        title="Official receipt"
        subtitle={receiptRequisition.orNumber}
        layerClassName="z-[80]"
        onClose={() => setReceiptOpen(false)}
      >
        <OrderOfPaymentModal
          embedded
          isOpen
          requisition={receiptRequisition}
          onClose={() => setReceiptOpen(false)}
        />
      </DocumentSideDrawer>
    ) : null}
    </>,
    document.body
  );
};
