import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Receipt, 
  MapPin, 
  Activity, 
  ShieldCheck,
  AlertCircle,
  Tag,
  Search,
  Calculator
} from 'lucide-react';
import { TestDefinition, PriorityLevel, LabTestRequisition, CivilStatus, PatientCategory } from '../../types/lims';
import { BirthdateAgePicker } from '../common/BirthdateAgePicker';
import { 
  EXAMINATION_CATALOG, 
  EXAMINATION_CATEGORIES, 
  CORPORATE_CATEGORIES,
  ExaminationCategory, 
  CorporateCategory,
  ExaminationItem, 
  formatCurrency,
  getExaminationPrice,
  getExaminationCode,
  getExaminationCategory,
  isCorporateSchemeExam,
  isStandardSchemeExam,
} from '../../data/examinationCatalog';

export type { LabTestRequisition };

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  testDefinitions: TestDefinition[];
  examinationCatalog?: ExaminationItem[];
  onSubmitRequisition: (req: LabTestRequisition) => Promise<any> | void;
}

export const NewRequisitionModal: React.FC<NewRequisitionModalProps> = ({
  isOpen,
  onClose,
  testDefinitions,
  examinationCatalog = EXAMINATION_CATALOG,
  onSubmitRequisition,
}) => {
  // Submission & Validation States
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Date
  const todayDate = new Date().toISOString().split('T')[0];
  const [requestDate, setRequestDate] = useState<string>(todayDate);

  // 2. Patient Demographics - All Upper Case
  const [patientCategory, setPatientCategory] = useState<PatientCategory>('OPD');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');

  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [civilStatus, setCivilStatus] = useState<CivilStatus>('Single');
  const [address, setAddress] = useState('');
  const [caseNo, setCaseNo] = useState('');

  // 3. Clinical & Billing Reference
  const [requestingPhysician, setRequestingPhysician] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [chargeSlipNumber, setChargeSlipNumber] = useState('');

  // 4. Kind of Examination & Test Offerings
  const [selectedExaminations, setSelectedExaminations] = useState<string[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [specimenType, setSpecimenType] = useState('WHOLE BLOOD (K2-EDTA)');
  const [tubeCount, setTubeCount] = useState(1);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Catalog search & department tab filter
  const [examSearch, setExamSearch] = useState('');
  const [selectedDeptTab, setSelectedDeptTab] = useState<string>('ALL');

  const isCorporate = patientCategory === 'Corporate';

  // Auto-calculate age whenever birthday changes
  useEffect(() => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(Math.max(0, calculatedAge));
    }
  }, [birthday]);

  // Reset category tab on patientCategory change
  useEffect(() => {
    setSelectedDeptTab('ALL');
  }, [patientCategory]);

  if (!isOpen) return null;

  // Active catalog: Corporate = official HIS sheet; others = OPD/PhilHealth/etc sheets
  const activeCatalog = examinationCatalog.filter((e) => {
    if (e.isActive === false) return false;
    if (isCorporate) return isCorporateSchemeExam(e);
    return isStandardSchemeExam(e);
  });

  const currentCategoryTabs = isCorporate ? CORPORATE_CATEGORIES : EXAMINATION_CATEGORIES;

  // Filtered exams
  const filteredExams = activeCatalog.filter((exam) => {
    const examCategory = getExaminationCategory(exam, patientCategory);
    const matchCategory = selectedDeptTab === 'ALL' || examCategory === selectedDeptTab;
    const q = examSearch.trim().toLowerCase();
    const codeToMatch = (isCorporate && exam.corporateCode) ? exam.corporateCode : exam.code;
    const matchSearch =
      !q ||
      exam.name.toLowerCase().includes(q) ||
      (codeToMatch && codeToMatch.toLowerCase().includes(q)) ||
      (exam.code && exam.code.toLowerCase().includes(q)) ||
      examCategory.toLowerCase().includes(q) ||
      exam.category.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const totalExaminationFee = selectedExaminations.reduce((sum, examName) => {
    const item = examinationCatalog.find((e) => e.name === examName);
    return sum + (item ? getExaminationPrice(item, patientCategory) : 0);
  }, 0);

  // Ensure Doctor Name has ", MD" suffix in uppercase
  const enforceDoctorMDSuffix = (name: string): string => {
    let clean = name.trim().toUpperCase();
    if (!clean) return '';
    clean = clean.replace(/,+$/, '').trim();
    if (!clean.endsWith(', MD') && !clean.endsWith(' MD') && !clean.endsWith(',MD')) {
      clean = `${clean}, MD`;
    }
    return clean;
  };

  const handlePhysicianBlur = () => {
    if (requestingPhysician.trim()) {
      setRequestingPhysician(enforceDoctorMDSuffix(requestingPhysician));
    }
  };

  const toggleExamination = (examName: string) => {
    setFormError(null);
    setSelectedExaminations((prev) => {
      const exists = prev.includes(examName);
      if (exists) {
        return prev.filter((item) => item !== examName);
      } else {
        return [...prev, examName];
      }
    });

    // Match with testDefinitions if possible
    const match = testDefinitions.find((t) => 
      examName.toLowerCase().includes(t.code.toLowerCase()) ||
      t.name.toLowerCase().includes(examName.toLowerCase().split(' ')[0])
    );
    if (match) {
      setSelectedTestIds((prev) => prev.includes(match.id) ? prev : [...prev, match.id]);
    }
  };

  // Compose full name in uppercase
  const composeFullName = (): string => {
    const parts = [
      firstName.trim().toUpperCase(),
      middleName.trim().toUpperCase(),
      lastName.trim().toUpperCase(),
      suffix.trim().toUpperCase()
    ].filter(Boolean);

    if (parts.length === 0) return 'ALEXANDER WRIGHT';
    return parts.join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Patient First Name and Last Name are required.');
      return;
    }

    if (!requestingPhysician.trim()) {
      setFormError('Requesting Physician is required.');
      return;
    }

    if (selectedExaminations.length === 0) {
      setFormError('Please select at least one Kind of Examination.');
      return;
    }

    const formattedPhysician = enforceDoctorMDSuffix(requestingPhysician);
    const reqNum = `REQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const effectiveCaseNo = caseNo.trim().toUpperCase() || `CASE-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const effectiveChargeSlip = chargeSlipNumber.trim().toUpperCase() || (patientCategory === 'OPD' ? `CS-${Math.floor(10000 + Math.random() * 90000)}` : 'N/A');
    const effectiveOrNumber = orNumber.trim().toUpperCase() || 'N/A';

    const tatHours = priority === 'STAT' ? 2 : priority === 'PRIORITY' ? 8 : 24;
    const deadline = new Date(Date.now() + tatHours * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const fullPatientName = composeFullName();
    const finalTestNames = selectedExaminations;

    const newReq: LabTestRequisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: reqNum,
      requestDate: requestDate || todayDate,
      patientOrSubjectName: fullPatientName,
      firstName: firstName.trim().toUpperCase(),
      middleName: middleName.trim().toUpperCase(),
      lastName: lastName.trim().toUpperCase(),
      suffix: suffix.trim().toUpperCase(),
      patientDob: birthday,
      patientAddress: address.trim().toUpperCase() || 'N/A',
      caseNo: effectiveCaseNo,
      patientAge: Number(age) || 0,
      patientGender: sex,
      civilStatus,
      patientCategory: patientCategory,
      kindOfExamination: finalTestNames,
      orderingPhysicianOrPI: formattedPhysician,
      orNumber: effectiveOrNumber,
      chargeSlipNumber: effectiveChargeSlip,
      
      // Workflow support
      organizationOrClient: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
      externalRef: effectiveCaseNo,
      priority,
      selectedTestIds: selectedTestIds.length > 0 ? selectedTestIds : ['test-cbc'],
      selectedTestNames: finalTestNames,
      specimenTypes: [specimenType.toUpperCase()],
      tubeCount,
      clinicalNotes: clinicalNotes.trim().toUpperCase(),
      status: 'SUBMITTED',
      tatDeadline: deadline,
    };

    setIsSubmitting(true);
    try {
      await onSubmitRequisition(newReq);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Error submitting requisition.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn">
      {/* Centered Constrained Container (Max 90vh, Flex Col, Header and Footer pinned) */}
      <div className="bg-white border border-[#d8dde6] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Fixed Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                LABORATORY TEST REQUEST INFORMATION
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">
                Electronic Test Requisition Form (eTRF) & Examination Intake
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

        {/* Scrollable Form Body */}
        <form id="requisition-form" onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
          
          {/* Validation Alert if Error */}
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          {/* SECTION 1: Date & Billing References */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1">
              <Receipt className="w-3.5 h-3.5 text-[#0176d3]" />
              <span>REQUEST DATE &amp; BILLING REFERENCES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Date */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  DATE *
                </label>
                <input
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs"
                />
              </div>

              {/* 2. Case No */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CASE NO
                </label>
                <input
                  type="text"
                  placeholder="E.G. CASE-2026-8812 (OPTIONAL)"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
              </div>

              {/* 3. OR# */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  OR# (OFFICIAL RECEIPT)
                </label>
                <input
                  type="text"
                  placeholder="E.G. OR-884192 (OPTIONAL)"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
              </div>

              {/* 4. Charge Slip# */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CHARGE SLIP#
                </label>
                <input
                  type="text"
                  placeholder="E.G. CS-90124 (OPTIONAL)"
                  value={chargeSlipNumber}
                  onChange={(e) => setChargeSlipNumber(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Requesting Physician (with , MD suffix) */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold flex items-center gap-1 text-[11px]">
                  <Stethoscope className="w-3.5 h-3.5 text-[#0176d3]" />
                  <span>REQUESTING PHYSICIAN *</span>
                </label>
                <span className="text-[10px] text-blue-700 font-mono font-medium">
                  (Auto-appends &ldquo;, MD&rdquo;)
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="E.G. DR. MARCUS VANCE, MD"
                value={requestingPhysician}
                onChange={(e) => setRequestingPhysician(e.target.value.toUpperCase())}
                onBlur={handlePhysicianBlur}
                className="w-full px-2.5 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-medium text-xs shadow-xs uppercase"
              />
            </div>
          </div>

          {/* SECTION 2: Patient Demographics with Separated Names */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1">
              <User className="w-3.5 h-3.5 text-[#0176d3]" />
              <span>PATIENT DEMOGRAPHICS (ALL CAPS)</span>
            </div>

            {/* Separated Name Fields: First Name, Middle Name, Last Name, Suffix */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5">
              {/* First Name (4 cols) */}
              <div className="sm:col-span-4">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  FIRST NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. ALEXANDER"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs font-semibold uppercase"
                />
              </div>

              {/* Middle Name (3 cols) */}
              <div className="sm:col-span-3">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  MIDDLE NAME
                </label>
                <input
                  type="text"
                  placeholder="E.G. DEL ROSARIO"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs uppercase"
                />
              </div>

              {/* Last Name (3 cols) */}
              <div className="sm:col-span-3">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  LAST NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. WRIGHT"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs font-semibold uppercase"
                />
              </div>

              {/* Suffix (2 cols) */}
              <div className="sm:col-span-2">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  SUFFIX
                </label>
                <select
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs uppercase bg-white font-medium cursor-pointer"
                >
                  <option value="">NONE</option>
                  <option value="JR.">JR.</option>
                  <option value="SR.">SR.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                  <option value="VI">VI</option>
                </select>
              </div>
            </div>

            {/* Patient Category & Demographics Details */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 pt-0.5">
              <div className="col-span-2 sm:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#0176d3]" />
                    <span>PATIENT CATEGORY *</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-mono font-semibold">(Classification)</span>
                </div>
                <select
                  value={patientCategory}
                  onChange={(e) => setPatientCategory(e.target.value as PatientCategory)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#0176d3] bg-blue-50/50 text-slate-900 font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-[#0176d3] cursor-pointer"
                >
                  <option value="OPD">OPD</option>
                  <option value="PhilHealth">PhilHealth</option>
                  <option value="Indigent">Indigent</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Pre-Employment / Employee">Pre-Employment / Employee</option>
                  <option value="Projects">Projects</option>
                </select>
              </div>

              {/* Smart Birthday & Age Entry */}
              <BirthdateAgePicker
                birthday={birthday}
                age={age}
                onBirthdayChange={setBirthday}
                onAgeChange={setAge}
                required
              />

              {/* Sex */}
              <div className="sm:col-span-2">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  SEX *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs font-medium uppercase"
                >
                  <option value="Male">MALE</option>
                  <option value="Female">FEMALE</option>
                  <option value="Other">OTHER</option>
                </select>
              </div>

              {/* Civil Status */}
              <div className="sm:col-span-2">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CIVIL STATUS *
                </label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as CivilStatus)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs font-medium uppercase"
                >
                  <option value="Single">SINGLE</option>
                  <option value="Married">MARRIED</option>
                  <option value="Widowed">WIDOWED</option>
                  <option value="Separated">SEPARATED</option>
                  <option value="Divorced">DIVORCED</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="pt-0.5">
              <label className="text-slate-700 font-semibold block mb-1 text-[11px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>ADDRESS (RESIDENCE / CITY / CONTACT LOCATION) *</span>
              </label>
              <input
                type="text"
                required
                placeholder="E.G. 142 RIZAL AVENUE, WEST TRIANGLE, QUEZON CITY"
                value={address}
                onChange={(e) => setAddress(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs uppercase"
              />
            </div>

            {/* OPD Patient Cashier Partial Receipt Notice Banner */}
            {patientCategory === 'OPD' && (
              <div className="p-3 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-2.5 shadow-2xs mt-2">
                <Receipt className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <span>OPD Cashier Settlement Workflow</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                      Required Step
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-900 mt-0.5 leading-tight">
                    An <strong>Order of Payment / Partial Receipt</strong> will be generated upon submission for the patient to settle at the cashier before specimen collection.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Kind of Examination (Categorized with Pricing) */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase">
                <Activity className="w-3.5 h-3.5 text-[#0176d3]" />
                <span>KIND OF EXAMINATION (CATEGORIZED LABORATORY ASSAYS) *</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedExaminations.length} SELECTED
                </span>
                <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-emerald-600" />
                  <span>Total: {formatCurrency(totalExaminationFee)}</span>
                </span>
              </div>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter test by code or assay name..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="w-full pl-7 pr-7 py-1 text-[11px] rounded border border-[#d8dde6] bg-white text-slate-800 focus:outline-none focus:border-[#0176d3]"
                />
                {examSearch && (
                  <button
                    type="button"
                    onClick={() => setExamSearch('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Department Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedDeptTab('ALL')}
                  className={`px-2 py-0.5 rounded font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDeptTab === 'ALL'
                      ? 'bg-[#0176d3] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ALL ({activeCatalog.length})
                </button>
                {currentCategoryTabs.map((cat) => {
                  const count = activeCatalog.filter((i) => getExaminationCategory(i, patientCategory) === cat).length;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedDeptTab(cat)}
                      className={`px-2 py-0.5 rounded font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedDeptTab === cat
                          ? 'bg-[#0176d3] text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categorized Test Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredExams.map((exam) => {
                const isSelected = selectedExaminations.includes(exam.name);
                const effectiveCode = getExaminationCode(exam, patientCategory);
                const effectivePrice = getExaminationPrice(exam, patientCategory);
                const effectiveCategory = getExaminationCategory(exam, patientCategory);
                const isCorporateTier = patientCategory === 'Corporate';

                return (
                  <button
                    type="button"
                    key={`${exam.code || ''}-${exam.name}`}
                    onClick={() => toggleExamination(exam.name)}
                    className={`p-2 rounded text-left text-[11px] transition-all flex items-center justify-between border uppercase cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-[#0176d3] text-[#0176d3] font-bold shadow-2xs'
                        : 'bg-white border-[#d8dde6] text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate pr-1 flex flex-col">
                      <span className="font-semibold text-slate-900 truncate">{exam.name}</span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                        <span>{effectiveCode ? `CODE: ${effectiveCode}` : ''}</span>
                        {isCorporateTier && exam.corporatePrice !== undefined && (
                          <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            CORP
                          </span>
                        )}
                        <span>· {effectiveCategory}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="font-mono font-bold text-[10px] text-emerald-700">
                        {formatCurrency(effectivePrice)}
                      </span>
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-[#0176d3] border-[#0176d3] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Fixed Footer with Action Buttons */}
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
            form="requisition-form"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#0176d3] hover:bg-[#0060b2] disabled:opacity-70 text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>SUBMITTING REQUEST...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{patientCategory === 'OPD' ? 'SUBMIT & GENERATE OPD PAYMENT SLIP' : 'SUBMIT LAB REQUEST & GENERATE SLIP'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
