import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  User, 
  BadgePercent, 
  Barcode,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { LabTestRequisition, PatientCategory, PriorityLevel, Sample } from '../../types/lims';

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

export const ReceiveAccessionModal: React.FC<ReceiveAccessionModalProps> = ({
  isOpen,
  onClose,
  requisition,
  onConfirmAccession,
  currentUserName,
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

  // Auto-detect intelligent specimen type based on test panel selections
  useEffect(() => {
    if (!requisition) return;

    const tests = (requisition.kindOfExamination || requisition.selectedTestNames || []).join(' ').toLowerCase();
    
    if (tests.includes('urinalysis') || tests.includes('urine')) {
      setSampleType('Urine');
      setMatrix('Clean Catch Midstream Urine');
    } else if (tests.includes('metabolic') || tests.includes('lipid') || tests.includes('glucose') || tests.includes('sugar') || tests.includes('liver') || tests.includes('renal') || tests.includes('thyroid')) {
      setSampleType('Serum');
      setMatrix('Clotted Serum (SST Gel Separator)');
    } else if (tests.includes('heavy metals') || tests.includes('water')) {
      setSampleType('Drinking Water');
      setMatrix('Nitric Acid (HNO3) Preserved Water');
    } else {
      setSampleType('Whole Blood');
      setMatrix('K2-EDTA Anticoagulated Whole Blood');
    }

    setPriority(requisition.priority || 'ROUTINE');
    setTubeCount(requisition.tubeCount || 2);
    setNotes(requisition.clinicalNotes || '');
    setOrNumber(requisition.orNumber && requisition.orNumber !== 'N/A' ? requisition.orNumber : '');
    setSelectedCategory(requisition.patientCategory || 'OPD');
    setFormError('');
  }, [requisition]);

  if (!isOpen || !requisition) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = orNumber.trim().toUpperCase();
    if (selectedCategory === 'OPD' && (!receipt || receipt === 'N/A')) {
      setFormError('OPD goes to the cashier first. The laboratory can receive this request after the official receipt is assigned.');
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
      orNumber: orNumber.trim().toUpperCase() || (requisition.orNumber !== 'N/A' ? requisition.orNumber : ''),
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn">
      {/* Constrained Modal Container */}
      <div className="bg-white border border-[#d8dde6] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-sans">
        
        {/* Fixed Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a] shadow-xs shrink-0">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {requisition.status === 'RECEIVED' ? 'ASSIGN PATIENT CATEGORY' : 'RECEIVE & ACCESSION SPECIMEN'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#0176d3] border border-blue-200">
                  {requisition.requisitionNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {requisition.status === 'RECEIVED' 
                  ? 'Update Patient Category Classification & Physical Specimen Details' 
                  : 'Step 2: Assign Patient Category & Validate Physical Specimen Intake'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form id="accession-form" onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* 1. Patient & Requisition Summary Info Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase">
                <User className="w-3.5 h-3.5 text-[#0176d3]" />
                <span>Patient: <strong className="text-slate-900">{requisition.patientOrSubjectName}</strong></span>
              </div>
              <div className="font-mono text-slate-600 font-semibold">
                CASE#: <span className="text-slate-900">{requisition.caseNo || requisition.externalRef}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Demographics:</span>
                <span className="font-semibold text-slate-800">{requisition.patientAge} yrs · {requisition.patientGender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Civil Status:</span>
                <span className="font-semibold text-slate-800">{requisition.civilStatus || 'Single'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Billing (OR# / CS#):</span>
                <span className="font-mono font-semibold text-slate-800">{requisition.orNumber || 'N/A'} / {requisition.chargeSlipNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Physician:</span>
                <span className="font-semibold text-[#0176d3] truncate block" title={requisition.orderingPhysicianOrPI}>
                  {requisition.orderingPhysicianOrPI}
                </span>
              </div>
            </div>

            {/* Test Examination Tags */}
            <div className="pt-1 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Tests Requested:</span>
              {(requisition.kindOfExamination || requisition.selectedTestNames || ['CBC']).map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-800">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* 2. REQUIRED: PATIENT CATEGORY ASSIGNMENT AS DROPDOWN LIST */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                <BadgePercent className="w-4 h-4 text-[#0176d3]" />
                <span>SELECT PATIENT CATEGORY *</span>
              </label>
              <span className="text-[11px] font-semibold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Current: [{selectedCategory}]
              </span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PatientCategory)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#d8dde6] text-slate-900 text-xs font-bold font-mono focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] cursor-pointer uppercase shadow-2xs"
            >
              <option value="OPD">OPD — Outpatient Department Walk-in</option>
              <option value="PhilHealth">PhilHealth — National Health Insurance (NHIP)</option>
              <option value="Indigent">Indigent — Social Welfare &amp; Subsidized Care</option>
              <option value="Corporate">Corporate — Company Account / HMO Coverage</option>
              <option value="Pre-Employment / Employee">Pre-Employment / Employee — Staff Screening &amp; Personnel</option>
              <option value="Projects">Projects — Special Clinical Studies &amp; Trials</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Assign the billing classification and medical program coverage for this patient request.
            </p>
          </div>

          {/* 3. OPD CASHIER OFFICIAL RECEIPT (OR#) VERIFICATION */}
          {selectedCategory === 'OPD' && (
            <div className="p-4 rounded-lg bg-amber-50/90 border border-amber-300 space-y-3 shadow-2xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                <span className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>OPD Cashier Official Receipt (OR#) Verification</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  Verify Cashier Payment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-amber-950 block mb-1">
                    OFFICIAL RECEIPT (OR#) NUMBER *
                  </label>
                  <input
                    type="text"
                    placeholder="E.G. OR-2026-90412"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-md bg-white border border-amber-300 text-slate-900 font-mono text-xs font-bold uppercase focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]"
                  />
                </div>
                <div className="text-[11px] text-amber-900 flex items-center pt-2 sm:pt-4">
                  <span>Verify cashier stamp on physical payment slip prior to drawing specimen.</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Fixed Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-[#d8dde6] rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          
          <button
            type="submit"
            form="accession-form"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#2e844a] hover:bg-[#26713f] disabled:opacity-70 text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>SAVING CHANGES...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{requisition.status === 'RECEIVED' ? 'SAVE & ASSIGN PATIENT CATEGORY' : 'CONFIRM ACCESSION & GENERATE BARCODE'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
