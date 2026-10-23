import React from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Receipt, 
  User, 
  Building2, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  FlaskConical
} from 'lucide-react';
import { LabTestRequisition } from '../../types/lims';
import { 
  EXAMINATION_CATALOG, 
  formatCurrency, 
  getExaminationPrice, 
  getExaminationCode,
  getExaminationCategory 
} from '../../data/examinationCatalog';

interface OrderOfPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: LabTestRequisition | null;
  onSettlePayment?: (reqId: string, orNumber: string, reqNumber?: string) => void;
  embedded?: boolean;
}

// Crisp Simulated Barcode Component for Payment Slips
const PaymentBarcode: React.FC<{ code: string }> = ({ code }) => {
  const bars = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-7 gap-[2px]">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className={`bg-slate-900 ${idx % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}
            style={{
              width: `${w * 1.3}px`,
              height: idx % 4 === 0 ? '100%' : '85%',
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

export const OrderOfPaymentModal: React.FC<OrderOfPaymentModalProps> = ({
  isOpen,
  onClose,
  requisition,
  onSettlePayment,
  embedded = false,
}) => {
  const [showOrInput, setShowOrInput] = React.useState(false);
  const [inputOr, setInputOr] = React.useState('');

  // Sync OR input when the open requisition changes
  React.useEffect(() => {
    if (!requisition) return;
    const paid = Boolean(
      requisition.orNumber &&
      requisition.orNumber !== 'N/A' &&
      requisition.orNumber.trim().length > 0
    );
    setShowOrInput(false);
    setInputOr(paid ? requisition.orNumber! : `OR-${Date.now().toString().slice(-6)}`);
  }, [requisition?.id, requisition?.orNumber, isOpen]);

  if (!requisition) return null;
  if (!isOpen && !embedded) return null;

  const isPaid = Boolean(requisition.orNumber && requisition.orNumber !== 'N/A' && requisition.orNumber.trim().length > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmPaid = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveOr = inputOr.trim().toUpperCase() || `OR-${Date.now().toString().slice(-6)}`;
    if (onSettlePayment) {
      onSettlePayment(requisition.id, effectiveOr, requisition.requisitionNumber);
    }
    setShowOrInput(false);
  };

  const rawExams = (requisition.kindOfExamination && requisition.kindOfExamination.length > 0 
    ? requisition.kindOfExamination 
    : (requisition.selectedTestNames || [])
  );

  const itemizedExams = rawExams.map((examName) => {
    const cleanName = examName.trim().toUpperCase();
    
    // Exact match first
    let item = EXAMINATION_CATALOG.find((e) => e.name.trim().toUpperCase() === cleanName);
    
    // Candidates by length
    if (!item) {
      const candidates = EXAMINATION_CATALOG.filter((e) => {
        const catName = e.name.trim().toUpperCase();
        return cleanName === catName || cleanName.includes(catName) || catName.includes(cleanName);
      }).sort((a, b) => b.name.length - a.name.length);
      item = candidates[0];
    }

    const code = item ? getExaminationCode(item, 'OPD') : '';
    const price = item ? getExaminationPrice(item, 'OPD') : 0;
    const category = item ? getExaminationCategory(item, 'OPD') : 'CLINICAL CHEMISTRY';

    return {
      name: item ? item.name : examName,
      code,
      price,
      category,
    };
  });

  const totalExaminationFee = itemizedExams.reduce((sum, item) => sum + item.price, 0);

  const panel = (
      <div
        className={`bg-white border-slate-200 w-full flex flex-col overflow-hidden text-slate-900 font-sans print-modal-container ${
          embedded
            ? 'h-full min-h-0 border-0 shadow-none rounded-none'
            : 'border rounded-2xl max-w-4xl max-h-[94vh] shadow-2xl'
        }`}
      >
        
        {/* Top Header Action Bar (Hidden in Print) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 print:hidden flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {requisition.chargeSlipNumber || `CS-${requisition.requisitionNumber.slice(-5)}`}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  OPD Order of Payment
                </span>
                {isPaid ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Paid (OR: {requisition.orNumber})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                    Pending Cashier Payment
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Official Cashier Billing Assessment &amp; Partial Receipt</p>
            </div>
          </div>

          {/* Action Buttons: Mark as Paid + Print + Close */}
          <div className="flex items-center gap-2">
            {showOrInput ? (
              <form onSubmit={handleConfirmPaid} className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-300">
                <input
                  type="text"
                  value={inputOr}
                  onChange={(e) => setInputOr(e.target.value.toUpperCase())}
                  placeholder="OR-2026-XXXXX"
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-700 w-36 uppercase"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Save OR#
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrInput(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : onSettlePayment ? (
              !isPaid ? (
                <button
                  type="button"
                  onClick={() => setShowOrInput(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Enter Official Receipt (OR#) and mark as paid"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Paid (Enter OR#)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOrInput(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Edit Official Receipt (OR#)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Edit OR#</span>
                </button>
              )
            ) : null}

            {!embedded ? (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payment Slip</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Document Body */}
        <div className="px-3 sm:px-6 py-4 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5 max-w-3xl mx-auto print-paper-sheet print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:space-y-2">
            
            {/* 1. Official Clinical Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-300 print:border-slate-300 print:pb-1.5 print-avoid-break">
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
                    <span>Cashier &amp; Billing Section</span>
                  </div>
                </div>
              </div>

              {/* Right: Payment Slip Badge & Barcode */}
              <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-1 bg-slate-50/80 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-none border-slate-200 shrink-0">
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[8.5px] print:text-[7.5px] font-bold tracking-wider uppercase mb-0.5">
                  ORDER OF PAYMENT (OPD)
                </span>
                <PaymentBarcode code={requisition.chargeSlipNumber || requisition.requisitionNumber} />
              </div>
            </div>

            {/* 2. Patient & Order Demographics Grid */}
            <div className="bg-slate-50/50 print:bg-white border border-slate-300 rounded-lg p-3 sm:p-3.5 print:p-2 print-avoid-break">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 divide-y md:divide-y-0 md:divide-x divide-slate-200 print:divide-slate-300">
                
                {/* Left: Patient Details */}
                <div className="md:col-span-6 space-y-2 md:pr-3 print:space-y-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 print:border-slate-300 print:pb-0.5">
                    <span className="text-[9.5px] print:text-[8px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-700" />
                      Patient Demographics
                    </span>
                    <span className="text-[9.5px] print:text-[8px] font-mono font-bold text-slate-700">
                      CASE: {requisition.caseNo || requisition.externalRef || 'CASE-2026-OPD'}
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

                {/* Right: Order & Billing Details */}
                <div className="md:col-span-6 space-y-2 pt-2 md:pt-0 md:pl-3 print:space-y-1 print:pt-0">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 print:border-slate-300 print:pb-0.5">
                    <span className="text-[9.5px] print:text-[8px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-slate-700" />
                      Billing Order Assessment
                    </span>
                    <span className="text-[9.5px] print:text-[8px] font-mono font-medium text-slate-500">
                      {requisition.requestDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs print:text-[8.5px]">
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Charge Slip Number</span>
                      <span className="font-mono font-bold text-slate-900 block">
                        {requisition.chargeSlipNumber || 'CS-PENDING'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Patient Tariff Scheme</span>
                      <span className="inline-flex items-center gap-1 text-[10px] print:text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300">
                        OPD / Standard Pay
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs print:text-[8.5px]">
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Requisition Ref</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {requisition.requisitionNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Requesting Physician</span>
                      <span className="font-bold text-slate-800 block truncate">
                        {requisition.orderingPhysicianOrPI || 'Dr. Marcus Vance, MD'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[9px] print:text-[7.5px] font-semibold text-slate-500 uppercase block">Payment Status</span>
                    {isPaid ? (
                      <span className="text-[10px] print:text-[8.5px] font-bold text-slate-900 bg-slate-100 px-2 py-0.2 rounded border border-slate-300 inline-flex items-center gap-1 mt-0.5 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Paid · Official Receipt: {requisition.orNumber}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] print:text-[8.5px] font-bold text-slate-800 bg-slate-100 px-2 py-0.2 rounded border border-slate-300 inline-block mt-0.5">
                        ● Unpaid / Pending Cashier Settlement
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Itemized OPD Tests & Pricing Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs print:shadow-none print:border-slate-300">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs print:text-[8.5px] print:py-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                  <span className="font-bold text-slate-800 text-[10.5px] print:text-[9px] uppercase tracking-wide">
                    Assessed Laboratory Diagnostic Examinations
                  </span>
                  <span className="text-[9.5px] print:text-[7.5px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                    {itemizedExams.length} {itemizedExams.length === 1 ? 'Test' : 'Tests'}
                  </span>
                </div>
                <span className="text-[9.5px] print:text-[8px] font-mono text-slate-500 uppercase">
                  Standard Out-Patient Diagnostic Tariff
                </span>
              </div>

              <table className="w-full text-left text-xs print:text-[8.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 print:border-slate-300 text-slate-600 font-bold text-[9px] print:text-[8px] uppercase tracking-wider">
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-8 text-center">#</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-20">HIS Code</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2">Examination / Test Description</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 min-w-[120px]">Section / Category</th>
                    <th className="py-1.5 px-3 print:py-1 print:px-2 w-24 text-right">Rate (₱)</th>
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

                {/* Summary Total Assessment Row */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900">
                    <td colSpan={3} className="py-2 px-3 print:py-1.5 print:px-2 text-left">
                      <span className="text-[10px] print:text-[8px] text-slate-600 font-medium">
                        Billing Category: <strong className="text-slate-800">OPD Standard Tariff Assessment</strong>
                      </span>
                    </td>
                    <td className="py-2 px-3 print:py-1.5 print:px-2 text-right font-bold text-[10.5px] print:text-[8.5px] text-slate-800 uppercase tracking-wide">
                      Total Amount Payable to Cashier:
                    </td>
                    <td className="py-2 px-3 print:py-1.5 print:px-2 font-mono font-black text-sm print:text-[10.5px] text-slate-900 text-right whitespace-nowrap border-l border-slate-300">
                      {formatCurrency(totalExaminationFee)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. Cashier Official Stamp & Phlebotomy Clearance Section */}
            <div className="pt-2.5 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2 print-avoid-break print:pt-2">
              
              {/* Cashier Validation Stamp Box */}
              <div className="border border-dashed border-slate-400 rounded-lg p-2.5 bg-slate-50/50 print:bg-white space-y-1.5 text-xs print:text-[8.5px] print:p-2">
                <span className="text-[9.5px] print:text-[8px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-0.5">
                  1. Cashier Official Settlement &amp; OR Stamp
                </span>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[9px] print:text-[7.5px] text-slate-500 block font-medium">Official Receipt (OR #)</span>
                    <div className="border-b border-slate-400 h-5 mt-0.5 font-mono font-bold text-slate-900 text-xs print:text-[9.5px]">
                      {requisition.orNumber && requisition.orNumber !== 'N/A' ? requisition.orNumber : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] print:text-[7.5px] text-slate-500 block font-medium">Amount Paid (₱)</span>
                    <div className="border-b border-slate-400 h-5 mt-0.5 font-mono font-bold text-slate-900 text-xs print:text-[9.5px]">
                      {requisition.orNumber && requisition.orNumber !== 'N/A' ? formatCurrency(totalExaminationFee) : ''}
                    </div>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between text-[9px] print:text-[7.5px] text-slate-500 font-mono">
                  <span>Cashier Signature / Stamp</span>
                  <span>Date: ___/___/2026</span>
                </div>
              </div>

              {/* Laboratory Extraction Clearance Box */}
              <div className="border border-dashed border-slate-400 rounded-lg p-2.5 bg-slate-50/50 print:bg-white space-y-1.5 text-xs print:text-[8.5px] print:p-2">
                <span className="text-[9.5px] print:text-[8px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-0.5">
                  2. Laboratory Phlebotomy Clearance
                </span>
                <div className="space-y-1 pt-0.5 text-xs print:text-[8.5px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-slate-400 shrink-0" />
                    <span className="text-slate-700 text-[10px] print:text-[8px]">Official Receipt (OR) Verified by Extraction Staff</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-slate-400 shrink-0" />
                    <span className="text-slate-700 text-[10px] print:text-[8px]">Specimen Successfully Collected &amp; Accessioned</span>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between text-[9px] print:text-[7.5px] text-slate-500 font-mono">
                  <span>Phlebotomist Signature</span>
                  <span>Time: ___:___</span>
                </div>
              </div>

            </div>

            {/* 6. Document Footer Tracking Note */}
            <div className="pt-1 text-center text-[8.5px] print:text-[7px] text-slate-400 print:text-slate-500 font-mono uppercase">
              Philippine Tuberculosis Society, Inc. • Computer-Generated Billing Assessment &amp; Official Laboratory Charge Slip
            </div>

          </div>
        </div>

      </div>
  );

  if (embedded) return panel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn print-modal-backdrop">
      {panel}
    </div>
  );
};
