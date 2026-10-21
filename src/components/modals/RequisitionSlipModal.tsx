import React from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Stethoscope, 
  Calendar, 
  Receipt, 
  User, 
  MapPin, 
  Activity, 
  ShieldCheck,
  Calculator,
  Tag,
  Sparkles,
  ClipboardList,
  FlaskConical,
  Clock,
  Phone,
  Check
} from 'lucide-react';
import { LabTestRequisition } from '../../types/lims';
import { 
  EXAMINATION_CATALOG, 
  formatCurrency, 
  getExaminationPrice, 
  getExaminationCode,
  getExaminationCategory 
} from '../../data/examinationCatalog';

interface RequisitionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: LabTestRequisition | null;
}

// Crisp Simulated Barcode Component for Medical Requisitions
const RequisitionBarcode: React.FC<{ code: string }> = ({ code }) => {
  // Deterministic bar widths based on code characters
  const bars = React.useMemo(() => {
    const pattern = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2];
    return pattern;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-7 gap-[2px]">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className={`bg-slate-900 ${idx % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}
            style={{
              width: `${w * 1.3}px`,
              height: idx % 5 === 0 ? '100%' : idx % 3 === 0 ? '85%' : '90%',
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] font-semibold tracking-widest text-slate-500 uppercase mt-0.5">
        *{code}*
      </span>
    </div>
  );
};

export const RequisitionSlipModal: React.FC<RequisitionSlipModalProps> = ({
  isOpen,
  onClose,
  requisition,
}) => {
  if (!isOpen || !requisition) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCorp = requisition.patientCategory === 'Corporate';

  const rawExams = (requisition.kindOfExamination && requisition.kindOfExamination.length > 0 
    ? requisition.kindOfExamination 
    : (requisition.selectedTestNames || [])
  );

  const itemizedExams = rawExams.map((examName) => {
    const cleanName = examName.trim().toUpperCase();
    
    // 1. Priority 1: Exact match on name
    let item = EXAMINATION_CATALOG.find((e) => e.name.trim().toUpperCase() === cleanName);
    
    // 2. Priority 2: Candidates sorted by length (longer exact names take priority)
    if (!item) {
      const candidates = EXAMINATION_CATALOG.filter((e) => {
        const catName = e.name.trim().toUpperCase();
        return cleanName === catName || cleanName.includes(catName) || catName.includes(cleanName);
      }).sort((a, b) => b.name.length - a.name.length);
      item = candidates[0];
    }

    const code = item ? getExaminationCode(item, requisition.patientCategory) : '';
    const price = item ? getExaminationPrice(item, requisition.patientCategory) : 0;
    const category = item ? getExaminationCategory(item, requisition.patientCategory) : (isCorp ? 'BLOOD CHEMISTRY' : 'DIAGNOSTIC');

    return {
      name: item ? item.name : examName,
      code,
      price,
      category,
    };
  });

  const totalExaminationFee = itemizedExams.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn print-modal-backdrop">
      {/* Modal Container */}
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-sans print-modal-container">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {requisition.requisitionNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  {requisition.patientCategory || 'OPD'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Official Laboratory Examination Request Slip</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slip Document Body */}
        <div className="px-3 sm:px-6 py-4 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5 max-w-3xl mx-auto print-paper-sheet print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:space-y-2">
            
            {/* 1. Official Clinical Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-300 print:border-slate-300 print:pb-1.5 print-avoid-break">
              {/* Left: Brand & Address */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <img 
                  src="/ptsilogo.png" 
                  alt="PTSI Logo" 
                  className="w-14 h-14 sm:w-16 sm:h-16 print:w-12 print:h-12 object-contain shrink-0" 
                />
                <div className="space-y-0.5">
                  <h1 className="text-sm sm:text-base print:text-[12px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                    Philippine Tuberculosis Society, Inc.
                  </h1>
                  <p className="text-[11px] print:text-[8.5px] font-medium text-slate-600">
                    Quezon Institute Compound, E Rodriguez Sr. Ave, Quezon City, Metro Manila
                  </p>
                  <div className="text-[9.5px] print:text-[7.5px] text-slate-500 font-medium pt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>Clinical &amp; Diagnostic Laboratory Services</span>
                    <span>•</span>
                    <span>ISO 15189:2022 Accredited</span>
                    <span>•</span>
                    <span>DOH-LTO License No. 13-0092-26</span>
                  </div>
                </div>
              </div>

              {/* Right: Barcode & Requisition Identification */}
              <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-1 bg-slate-50/80 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-none border-slate-200 shrink-0">
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[8.5px] print:text-[7.5px] font-bold tracking-wider uppercase mb-0.5">
                  OFFICIAL REQUEST SLIP
                </span>
                <RequisitionBarcode code={requisition.requisitionNumber} />
              </div>
            </div>

            {/* 2. Cohesive Patient & Billing Information Grid */}
            <div className="bg-slate-50/50 print:bg-white border border-slate-300 rounded-lg p-3 sm:p-3.5 print:p-2 print-avoid-break">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 divide-y md:divide-y-0 md:divide-x divide-slate-200 print:divide-slate-300">
                
                {/* Left Section: Patient Demographics */}
                <div className="md:col-span-6 space-y-2 md:pr-3 print:space-y-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 print:border-slate-300 print:pb-0.5">
                    <span className="text-[9.5px] print:text-[8px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-700" />
                      Patient Demographics
                    </span>
                    <span className="text-[9.5px] print:text-[8px] font-mono font-bold text-slate-700">
                      ID: {requisition.id ? requisition.id.slice(0, 8).toUpperCase() : 'ACC-REQ'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block leading-tight">Patient Full Name</span>
                    <span className="text-sm print:text-[11px] font-black text-slate-900 uppercase tracking-tight block">
                      {requisition.patientOrSubjectName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5 text-xs print:text-[8.5px]">
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Age / Sex</span>
                      <span className="font-bold text-slate-800">
                        {requisition.patientAge} Yrs · {requisition.patientGender}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Date of Birth</span>
                      <span className="font-mono font-medium text-slate-700">
                        {requisition.patientDob || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Civil Status</span>
                      <span className="font-semibold text-slate-700 uppercase">
                        {requisition.civilStatus || 'Single'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Residential Address</span>
                    <span className="text-[11px] print:text-[8.5px] font-medium text-slate-700 uppercase block truncate">
                      {requisition.patientAddress || 'Quezon City / Metro Manila'}
                    </span>
                  </div>
                </div>

                {/* Right Section: Order & Billing Details */}
                <div className="md:col-span-6 space-y-2 pt-2 md:pt-0 md:pl-3 print:space-y-1 print:pt-0">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 print:border-slate-300 print:pb-0.5">
                    <span className="text-[9.5px] print:text-[8px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-slate-700" />
                      Requisition &amp; Billing
                    </span>
                    <span className="text-[9.5px] print:text-[8px] font-mono font-medium text-slate-500">
                      {requisition.requestDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs print:text-[8.5px]">
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Case Number</span>
                      <span className="font-mono font-bold text-slate-900 block">
                        {requisition.caseNo || requisition.externalRef || 'CASE-2026-AUTO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Patient Tariff</span>
                      <span className="inline-flex items-center gap-1 text-[10px] print:text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300">
                        {requisition.patientCategory || 'OPD'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs print:text-[8.5px]">
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">OR Number</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {requisition.orNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Charge Slip No.</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {requisition.chargeSlipNumber || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Affiliated Account / Client</span>
                    <span className="text-[11px] print:text-[8.5px] font-bold text-slate-800 block truncate">
                      {requisition.organizationOrClient || 'Philippine Tuberculosis Society, Inc.'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Itemized Requested Examinations Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs print:shadow-none print:border-slate-300">
              {/* Section Subheader */}
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs print:text-[8.5px] print:py-1">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-700" />
                  <span className="font-bold text-slate-800 text-[10.5px] print:text-[9px] uppercase tracking-wide">
                    Kind of Examination Requested
                  </span>
                  <span className="text-[9.5px] print:text-[7.5px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                    {itemizedExams.length} {itemizedExams.length === 1 ? 'Test' : 'Tests'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] print:text-[8px] font-semibold text-slate-500 uppercase">
                    Urgency: <strong className="text-slate-700">{requisition.priority}</strong>
                  </span>
                </div>
              </div>

              {/* Table Body */}
              <table className="w-full text-left text-xs print:text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 print:border-slate-300 text-slate-600 font-bold text-[9px] print:text-[8px] uppercase tracking-wider">
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-8 text-center">#</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-20">HIS Code</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2">Examination / Test Description</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 min-w-[120px]">Section / Category</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-24 text-right">Fee (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {itemizedExams.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-1.5 px-3 print:py-1 print:px-2 text-center font-mono text-[10px] print:text-[8px] text-slate-400 print:text-slate-600">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-1.5 px-3 print:py-1 print:px-2 whitespace-nowrap">
                        <span className="font-mono font-bold text-[10px] print:text-[8px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 print:border-slate-300">
                          {item.code || '-'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 print:py-1 print:px-2">
                        <div className="font-bold text-slate-900 text-[11px] print:text-[9px]">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 print:py-1 print:px-2 whitespace-nowrap">
                        <span className="text-[9px] print:text-[7.5px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 print:py-1 print:px-2 font-mono font-bold text-[11px] print:text-[9px] text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Summary Total Row */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900">
                    <td colSpan={3} className="py-2 px-3 print:py-1.5 print:px-2 text-left">
                      <span className="text-[10px] print:text-[8px] text-slate-600 font-medium">
                        Schedule: <strong className="text-slate-800">{isCorp ? 'PTSI Corporate Diagnostic Tariff' : 'Standard Laboratory Schedule'}</strong>
                      </span>
                    </td>
                    <td className="py-2 px-3 print:py-1.5 print:px-2 text-right font-bold text-[10.5px] print:text-[8.5px] text-slate-800 uppercase tracking-wide">
                      Total Amount Due:
                    </td>
                    <td className="py-2 px-3 print:py-1.5 print:px-2 font-mono font-black text-sm print:text-[10.5px] text-slate-900 text-right whitespace-nowrap border-l border-slate-300">
                      {formatCurrency(totalExaminationFee)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {requisition.clinicalNotes && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-xs print:text-[8px] text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-slate-800 shrink-0 text-[10px] print:text-[8px] uppercase">Clinical Notes:</span>
                  <span className="text-[10.5px] print:text-[8px] text-slate-600">{requisition.clinicalNotes}</span>
                </div>
              )}
            </div>

            {/* 4. Official Signatures & Verification Section */}
            <div className="pt-2.5 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end print:grid-cols-2 print-avoid-break print:pt-2">
              {/* Left: Facility & Compliance */}
              <div className="space-y-0.5 text-slate-600">
                <div className="flex items-center gap-1.5 text-xs print:text-[9px] font-bold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>{requisition.organizationOrClient || 'Philippine Tuberculosis Society, Inc.'}</span>
                </div>
                <p className="text-[9.5px] print:text-[8px] text-slate-500 font-medium">
                  Laboratory Specimen Accessioning &amp; Clinical Diagnostics Division
                </p>
                <div className="pt-0.5 text-[8.5px] print:text-[7.5px] font-mono text-slate-400">
                  Electronic TRF · 21 CFR Part 11 &amp; ISO 15189:2022 Certified
                </div>
              </div>

              {/* Right: Requesting Physician Authorization */}
              <div className="text-center sm:text-right space-y-1">
                <div className="inline-block text-center border-t-2 border-slate-800 pt-1 px-4 min-w-[200px]">
                  <div className="font-bold text-xs print:text-[10px] text-slate-900 uppercase tracking-tight">
                    {requisition.orderingPhysicianOrPI || 'DR. MARCUS VANCE, MD'}
                  </div>
                  <span className="text-[9.5px] print:text-[7.5px] text-slate-500 font-semibold block uppercase tracking-wider mt-0.5">
                    Requesting Physician / PRC Lic. No.
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Document Footer Tracking Note */}
            <div className="pt-1 text-center text-[8.5px] print:text-[7px] text-slate-400 print:text-slate-500 font-mono uppercase">
              Philippine Tuberculosis Society, Inc. • Official Electronic Test Requisition Form (eTRF)
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
