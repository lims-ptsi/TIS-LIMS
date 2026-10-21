import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Receipt, 
  MapPin, 
  Activity, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Search, 
  Tag, 
  BadgePercent, 
  Calculator,
  X,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  History
} from 'lucide-react';
import { TestDefinition, PriorityLevel, LabTestRequisition, CivilStatus, PatientCategory } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
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
  getExaminationName,
  isCorporateSchemeExam,
  isStandardSchemeExam,
} from '../../data/examinationCatalog';
import { buildPatientDirectory, patientRecordIdFor, PatientRecord, searchPatients } from '../../data/patientDirectory';

const WIZARD_STEPS: { id: 1 | 2 | 3; label: string; detail: string }[] = [
  { id: 1, label: 'Patient', detail: 'Find a record, or enter a new patient' },
  { id: 2, label: 'Request', detail: 'Date, physician, and billing' },
  { id: 3, label: 'Examinations', detail: 'Choose the tests, then submit' },
];

interface CreateRequisitionViewProps {
  testDefinitions: TestDefinition[];
  examinationCatalog?: ExaminationItem[];
  onSubmitRequisition: (req: LabTestRequisition) => Promise<any> | void;
  onCancel: () => void;
  allowQueueLink?: boolean;
  priorRequisitions?: LabTestRequisition[];
}

export const CreateRequisitionView: React.FC<CreateRequisitionViewProps> = ({
  testDefinitions,
  examinationCatalog = EXAMINATION_CATALOG,
  onSubmitRequisition,
  onCancel,
  allowQueueLink = true,
  priorRequisitions = [],
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const formTopRef = useRef<HTMLDivElement>(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientRecordId, setPatientRecordId] = useState<string | null>(null);

  // Examination Selector Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);

  // 1. Date
  const todayDate = new Date().toISOString().split('T')[0];
  const [requestDate, setRequestDate] = useState<string>(todayDate);

  // 2. Patient Demographics - All Upper Case
  const [patientCategory, setPatientCategory] = useState<PatientCategory>('OPD');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const patientDirectory = useMemo(() => buildPatientDirectory(priorRequisitions), [priorRequisitions]);
  const patientMatches = useMemo(
    () => searchPatients(patientDirectory, patientQuery),
    [patientDirectory, patientQuery]
  );
  const selectedPatient = patientDirectory.find((record) => record.id === patientRecordId) || null;

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

  // 4. Kind of Examination & Categorized Test Selection
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');
  const [searchTestQuery, setSearchTestQuery] = useState<string>('');
  const [selectedExaminations, setSelectedExaminations] = useState<string[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [specimenType, setSpecimenType] = useState('WHOLE BLOOD (K2-EDTA)');
  const [tubeCount, setTubeCount] = useState(1);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Filtered examination items based on patientCategory
  const isCorporate = patientCategory === 'Corporate';

  const activeCatalog = useMemo(() => {
    return examinationCatalog.filter((item) => {
      if (item.isActive === false) return false;
      if (isCorporate) {
        return isCorporateSchemeExam(item);
      }
      return isStandardSchemeExam(item);
    });
  }, [examinationCatalog, isCorporate]);

  const currentCategoryTabs = useMemo(() => {
    return isCorporate ? CORPORATE_CATEGORIES : EXAMINATION_CATEGORIES;
  }, [isCorporate]);

  // If patient category changes and active tab is no longer valid, reset to 'ALL'
  useEffect(() => {
    setActiveCategoryTab('ALL');
  }, [patientCategory]);

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
      setAge(calculatedAge >= 0 ? calculatedAge : 0);
    }
  }, [birthday]);

  const filteredExaminations = useMemo(() => {
    return activeCatalog.filter((item) => {
      const itemCategory = getExaminationCategory(item, patientCategory);
      const matchesCategory = activeCategoryTab === 'ALL' || itemCategory === activeCategoryTab;
      const query = searchTestQuery.toLowerCase().trim();
      const codeToMatch = (isCorporate && item.corporateCode) ? item.corporateCode : item.code;
      const matchesQuery = 
        !query ||
        item.name.toLowerCase().includes(query) ||
        (codeToMatch && codeToMatch.toLowerCase().includes(query)) ||
        (item.code && item.code.toLowerCase().includes(query)) ||
        itemCategory.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [activeCatalog, activeCategoryTab, searchTestQuery, patientCategory, isCorporate]);

  // Calculate total price of selected examinations dynamically based on patientCategory
  const totalExaminationFee = useMemo(() => {
    return selectedExaminations.reduce((sum, examName) => {
      const found = examinationCatalog.find((item) => item.name === examName);
      return sum + (found ? getExaminationPrice(found, patientCategory) : 0);
    }, 0);
  }, [selectedExaminations, examinationCatalog, patientCategory]);

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

  const applyPatientRecord = (record: PatientRecord) => {
    setPatientRecordId(record.id);
    setPatientQuery('');
    setFormError(null);
    setFirstName(record.firstName);
    setMiddleName(record.middleName);
    setLastName(record.lastName);
    setSuffix(record.suffix);
    setBirthday(record.birthday);
    setAge(record.age);
    setSex(record.sex);
    setCivilStatus(record.civilStatus);
    setAddress(record.address);
    setPatientCategory(record.category);
  };

  const clearPatientRecord = () => {
    setPatientRecordId(null);
    setPatientQuery('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setSuffix('');
    setBirthday('');
    setAge('');
    setSex('Male');
    setCivilStatus('Single');
    setAddress('');
    setPatientCategory('OPD');
  };

  const handlePhysicianBlur = () => {
    if (requestingPhysician.trim()) {
      setRequestingPhysician(enforceDoctorMDSuffix(requestingPhysician));
    }
  };

  const validateStep = (current: 1 | 2 | 3): string | null => {
    if (current === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        return 'Enter the patient first name and last name.';
      }
      if (!birthday && age === '') {
        return 'Enter the birthday or the age.';
      }
      if (!address.trim()) {
        return 'Enter the patient address.';
      }
    }
    if (current === 2) {
      if (!requestDate) {
        return 'Enter the request date.';
      }
      if (!requestingPhysician.trim()) {
        return 'Enter the requesting physician.';
      }
    }
    if (current === 3 && selectedExaminations.length === 0) {
      return 'Select at least one examination.';
    }
    return null;
  };

  const goToStep = (target: 1 | 2 | 3) => {
    if (target === step) return;
    if (target < step) {
      setFormError(null);
      setStep(target);
      return;
    }
    for (let current = step; current < target; current += 1) {
      const message = validateStep(current as 1 | 2 | 3);
      if (message) {
        setFormError(message);
        setStep(current as 1 | 2 | 3);
        return;
      }
    }
    if (requestingPhysician.trim()) {
      setRequestingPhysician(enforceDoctorMDSuffix(requestingPhysician));
    }
    setFormError(null);
    setStep(target);
  };

  useEffect(() => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const toggleExamination = (examItem: ExaminationItem) => {
    setFormError(null);
    setSelectedExaminations((prev) => {
      const exists = prev.includes(examItem.name);
      if (exists) {
        return prev.filter((item) => item !== examItem.name);
      } else {
        return [...prev, examItem.name];
      }
    });

    const match = testDefinitions.find((t) => 
      examItem.name.toLowerCase().includes(t.code.toLowerCase()) ||
      t.name.toLowerCase().includes(examItem.name.toLowerCase().split(' ')[0])
    );
    if (match) {
      setSelectedTestIds((prev) => prev.includes(match.id) ? prev : [...prev, match.id]);
    }
  };

  const composeFullName = (): string => {
    const parts = [
      firstName.trim().toUpperCase(),
      middleName.trim().toUpperCase(),
      lastName.trim().toUpperCase(),
      suffix.trim().toUpperCase()
    ].filter(Boolean);

    if (parts.length === 0) return 'PATIENT NAME';
    return parts.join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      goToStep((step + 1) as 1 | 2 | 3);
      return;
    }
    setFormError(null);

    const patientError = validateStep(1);
    if (patientError) {
      setFormError(patientError);
      setStep(1);
      return;
    }

    const requestError = validateStep(2);
    if (requestError) {
      setFormError(requestError);
      setStep(2);
      return;
    }

    const examError = validateStep(3);
    if (examError) {
      setFormError(examError);
      setStep(3);
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

    const linkedPatientId = patientRecordId || patientRecordIdFor({
      firstName,
      middleName,
      lastName,
      birthday,
    });

    const newReq: LabTestRequisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: reqNum,
      requestDate: requestDate || todayDate,
      patientOrSubjectName: fullPatientName,
      patientId: linkedPatientId,
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
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Error submitting requisition.');
    }
  };

  const currentStep = WIZARD_STEPS[step - 1];

  return (
    <div ref={formTopRef} className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* 1. Chevron Stage Bar */}
      <LifecycleChevronBar
        currentStage="Electronic Test Requisition & Intake"
        entityType="Sample"
        onCompleteStage={onCancel}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Requisition &amp; Order Management</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Lab Test Request
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Step {step} of 3 — {currentStep.detail}
            </p>
          </div>
        </div>

        {allowQueueLink && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#d8dde6] text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Submissions Queue</span>
          </button>
        )}
      </div>

      {/* 3. Form Card Container */}
      <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center">
              {WIZARD_STEPS.map((item, index) => {
                const active = step === item.id;
                const done = step > item.id;
                return (
                  <React.Fragment key={item.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(item.id)}
                      className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                          active
                            ? 'bg-[#0176d3] border-[#0176d3] text-white'
                            : done
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-slate-500'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : item.id}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[10px] font-bold uppercase tracking-wide ${active ? 'text-[#0176d3]' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
                          Step {item.id}
                        </span>
                        <span className={`block text-xs font-semibold truncate ${active || done ? 'text-slate-900' : 'text-slate-500'}`}>
                          {item.label}
                        </span>
                      </span>
                    </button>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 rounded ${step > item.id ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 min-h-[420px]">
          {/* Validation Error Alert */}
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {step === 2 && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5 uppercase">
              <Receipt className="w-4 h-4 text-[#0176d3]" />
              <span>REQUEST DATE &amp; BILLING REFERENCES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  DATE *
                </label>
                <input
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs"
                />
              </div>

              {/* Case No */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CASE NO
                </label>
                <input
                  type="text"
                  placeholder="E.G. CASE-2026-8812 (OPTIONAL)"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
              </div>

              {/* OR# */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  OR# (OFFICIAL RECEIPT)
                </label>
                <input
                  type="text"
                  placeholder="LEAVE BLANK IF NOT YET PAID"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">The cashier assigns this after the patient pays.</p>
              </div>

              {/* Charge Slip# */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CHARGE SLIP#
                </label>
                <input
                  type="text"
                  placeholder="E.G. CS-90124 (OPTIONAL)"
                  value={chargeSlipNumber}
                  onChange={(e) => setChargeSlipNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Requesting Physician */}
            <div className="pt-1">
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
                className="w-full px-3 py-1.5 rounded bg-white border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] font-medium text-xs uppercase"
              />
            </div>
          </div>
          )}

          {step === 1 && (
          <>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <History className="w-4 h-4 text-[#0176d3]" />
                <span>Patient history</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {patientDirectory.length} saved {patientDirectory.length === 1 ? 'patient' : 'patients'}
              </span>
            </div>

            {selectedPatient ? (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Filing this request under</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedPatient.fullName}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {selectedPatient.category} · {selectedPatient.sex} · {selectedPatient.birthday || 'No birthday'} · {selectedPatient.visits.length} previous request{selectedPatient.visits.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearPatientRecord}
                    className="shrink-0 px-2.5 py-1 rounded border border-slate-300 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Use a different patient
                  </button>
                </div>
                <div className="space-y-1.5">
                  {selectedPatient.visits.slice(0, 4).map((visit) => {
                    const examLabel = visit.examinations.slice(0, 2).join(', ');
                    const extra = visit.examinations.length > 2 ? ` +${visit.examinations.length - 2}` : '';
                    return (
                      <div key={visit.id} className="flex items-start justify-between gap-3 rounded border border-emerald-200 bg-white px-2.5 py-1.5">
                        <div>
                          <div className="font-semibold text-slate-800">{visit.requestDate || 'No date'} · {visit.caseNo || visit.requisitionNumber}</div>
                          <div className="text-[11px] text-slate-500">{examLabel || 'No examinations listed'}{extra}</div>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">{visit.status.replace(/_/g, ' ')}</span>
                      </div>
                    );
                  })}
                  {selectedPatient.visits.length > 4 && (
                    <div className="text-[11px] text-slate-500">and {selectedPatient.visits.length - 4} earlier requests</div>
                  )}
                </div>
                <p className="text-[11px] text-emerald-900">A new case is created. You can still correct the details below before continuing.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value.toUpperCase())}
                    placeholder="SEARCH NAME, BIRTHDAY, OR CASE NUMBER"
                    className="w-full pl-9 pr-3 py-2 rounded border border-[#d8dde6] bg-white text-xs uppercase focus:outline-none focus:border-[#0176d3]"
                  />
                </div>
                {patientQuery.trim() && patientMatches.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No patient matches that search. Enter the details below to create a new record.</p>
                ) : patientQuery.trim() ? (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Matching patients
                    </div>
                    {patientMatches.map((record) => (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => applyPatientRecord(record)}
                        className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#0176d3] hover:bg-blue-50/40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-900">{record.fullName}</span>
                          <span className="text-[10px] font-bold text-[#0176d3]">{record.visits.length} request{record.visits.length === 1 ? '' : 's'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {record.sex} · {record.birthday || 'No birthday'} · last visit {record.visits[0]?.requestDate || '—'}
                          {record.visits[0]?.caseNo ? ` · ${record.visits[0].caseNo}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase">
              <User className="w-4 h-4 text-[#0176d3]" />
              <span>PATIENT DEMOGRAPHICS (ALL CAPS)</span>
            </div>

            {/* First Name, Middle Name, Last Name, Suffix */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
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
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs font-semibold uppercase"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  MIDDLE NAME
                </label>
                <input
                  type="text"
                  placeholder="E.G. DEL ROSARIO"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs uppercase"
                />
              </div>

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
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs font-semibold uppercase"
                />
              </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 pt-1">
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
                  className="w-full px-3 py-1.5 rounded border border-[#0176d3] bg-blue-50/50 text-slate-900 font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-[#0176d3] cursor-pointer"
                >
                  <option value="OPD">OPD</option>
                  <option value="PhilHealth">PhilHealth</option>
                  <option value="Indigent">Indigent</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Pre-Employment / Employee">Pre-Employment / Employee</option>
                  <option value="Projects">Projects</option>
                </select>
              </div>

              <BirthdateAgePicker
                birthday={birthday}
                age={age}
                onBirthdayChange={setBirthday}
                onAgeChange={setAge}
                required
              />

              <div className="sm:col-span-2">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  SEX *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs font-medium uppercase"
                >
                  <option value="Male">MALE</option>
                  <option value="Female">FEMALE</option>
                  <option value="Other">OTHER</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-700 font-semibold block mb-1 text-[11px]">
                  CIVIL STATUS *
                </label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as CivilStatus)}
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs font-medium uppercase"
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
            <div className="pt-1">
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
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3] text-xs uppercase"
              />
            </div>

            {/* OPD Patient Cashier Partial Receipt Notice Banner */}
            {patientCategory === 'OPD' && (
              <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-2xs mt-2">
                <Receipt className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <span>OPD Cashier Settlement Workflow</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                      Required Before Extraction
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                    This OPD request goes to the cashier. The cashier assigns the official receipt number after the patient pays, then the laboratory can receive the specimen.
                  </p>
                </div>
              </div>
            )}
          </div>
          </>
          )}

          {step === 3 && (
          <>
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">Review before you choose tests</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Patient</div>
                <div className="font-bold text-slate-900 mt-0.5">{composeFullName()}</div>
                <div className="text-slate-600 mt-0.5">{patientCategory} · {sex} · {age === '' ? '—' : `${age} yrs`}</div>
                {selectedPatient && (
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Existing record · {selectedPatient.visits.length} previous request{selectedPatient.visits.length === 1 ? '' : 's'}
                  </div>
                )}
                <button type="button" onClick={() => goToStep(1)} className="mt-1.5 text-[11px] font-bold text-[#0176d3] hover:underline cursor-pointer">Edit patient</button>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Request</div>
                <div className="font-bold text-slate-900 mt-0.5">{requestingPhysician || '—'}</div>
                <div className="text-slate-600 mt-0.5">{requestDate}{caseNo ? ` · ${caseNo}` : ''}</div>
                <button type="button" onClick={() => goToStep(2)} className="mt-1.5 text-[11px] font-bold text-[#0176d3] hover:underline cursor-pointer">Edit request</button>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Official receipt</div>
                <div className="font-bold text-slate-900 mt-0.5">{orNumber || 'Cashier assigns later'}</div>
                <div className="text-slate-600 mt-0.5">{chargeSlipNumber ? `Charge slip ${chargeSlipNumber}` : 'Charge slip optional'}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <Activity className="w-4 h-4 text-[#0176d3]" />
                <span>KIND OF EXAMINATION (CATEGORIZED LABORATORY ASSAYS) *</span>
                {patientCategory === 'Corporate' && (
                  <span className="text-[10px] font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    CORPORATE PRICELIST APPLIED
                  </span>
                )}
              </div>
              
              {/* Pricing & Selection Summary Pill */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedExaminations.length} Selected
                </span>
                <span className="text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-emerald-600" />
                  <span>Total: {formatCurrency(totalExaminationFee)}</span>
                </span>
              </div>
            </div>

            {/* Selected Examinations Display or Empty State */}
            {selectedExaminations.length === 0 ? (
              <div className="text-center py-7 px-4 bg-white rounded-lg border-2 border-dashed border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0176d3] flex items-center justify-center mx-auto">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">No Examinations Selected Yet</h4>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                    Click the button below to open the categorized catalog and choose diagnostic tests, panels, and special assays.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Select Examinations from Catalog</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Action Bar */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsExamModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Modify / Add Examinations ({selectedExaminations.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedExaminations([])}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline px-2 py-1 rounded bg-rose-50/70 border border-rose-200 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                {/* Selected Tests Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {selectedExaminations.map((examName) => {
                    const item = examinationCatalog.find((e) => e.name === examName);
                    const effectiveCode = item ? getExaminationCode(item, patientCategory) : '';
                    const effectivePrice = item ? getExaminationPrice(item, patientCategory) : 0;
                    const itemCategory = item ? getExaminationCategory(item, patientCategory) : 'DIAGNOSTIC';
                    const isCorporateTier = patientCategory === 'Corporate';

                    return (
                      <div
                        key={examName}
                        className={`p-2.5 bg-white border rounded-lg text-xs flex flex-col justify-between shadow-2xs relative group transition-all ${
                          isCorporateTier ? 'border-amber-200 hover:border-amber-400' : 'border-[#d8dde6] hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="flex flex-col pr-5">
                            {effectiveCode && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[9px] font-mono font-extrabold text-[#0176d3] bg-blue-50 px-1 py-0.2 rounded border border-blue-200 self-start">
                                  CODE: {effectiveCode}
                                </span>
                                {isCorporateTier && item?.corporatePrice !== undefined && (
                                  <span className="text-[8px] font-mono font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                    CORP
                                  </span>
                                )}
                              </div>
                            )}
                            <span className="font-bold text-[11px] text-slate-900 leading-tight">
                              {item ? getExaminationName(item, patientCategory) : examName}
                            </span>
                          </div>

                          {/* Quick Remove Button */}
                          <button
                            type="button"
                            onClick={() => toggleExamination(item || { name: examName, category: 'HEMATOLOGY', price: 0, code: '' })}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remove Test"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            {itemCategory}
                          </span>
                          <span className="font-mono font-extrabold text-xs text-emerald-700">
                            {formatCurrency(effectivePrice)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </>
          )}
          </div>

          <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-[#d8dde6] rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#d8dde6] rounded-md text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep((step + 1) as 1 | 2 | 3)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0176d3] hover:bg-[#0060b2] disabled:opacity-70 text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting request...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit lab test request</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ======================================================== */}
      {/* POP-UP MODAL: SELECT EXAMINATIONS CATALOG                */}
      {/* ======================================================== */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      SELECT EXAMINATIONS (CATEGORIZED LABORATORY ASSAYS)
                    </h2>
                    {patientCategory === 'Corporate' && (
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        Corporate Pricelist
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Choose diagnostic tests, panels, and special assays from official laboratory catalog.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total: {formatCurrency(totalExaminationFee)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body & Filter Controls */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs bg-slate-50/50">
              
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by product code (e.g. 1010 or 1260), test name, or specimen..."
                    value={searchTestQuery}
                    onChange={(e) => setSearchTestQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 focus:outline-none focus:border-[#0176d3]"
                  />
                  {searchTestQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchTestQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allInCurrent = filteredExaminations.map((e) => e.name);
                      setSelectedExaminations((prev) => Array.from(new Set([...prev, ...allInCurrent])));
                    }}
                    className="text-[11px] font-bold text-[#0176d3] hover:underline px-2.5 py-1 rounded bg-blue-50 border border-blue-200 cursor-pointer"
                  >
                    + Select All Filtered ({filteredExaminations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExaminations([])}
                    className="text-[11px] font-bold text-rose-600 hover:underline px-2.5 py-1 rounded bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Department Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategoryTab === 'ALL'
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
                      onClick={() => setActiveCategoryTab(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        activeCategoryTab === cat
                          ? 'bg-[#0176d3] text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Categorized Test Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredExaminations.map((exam) => {
                  const isSelected = selectedExaminations.includes(exam.name);
                  const effectiveCode = getExaminationCode(exam, patientCategory);
                  const effectivePrice = getExaminationPrice(exam, patientCategory);
                  const effectiveCategory = getExaminationCategory(exam, patientCategory);
                  const isCorporateTier = patientCategory === 'Corporate';

                  return (
                    <button
                      type="button"
                      key={`${exam.code || ''}-${exam.name}`}
                      onClick={() => toggleExamination(exam)}
                      className={`p-2.5 rounded-lg text-left text-xs transition-all flex flex-col justify-between border uppercase cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/90 border-[#0176d3] text-slate-900 shadow-2xs ring-1 ring-[#0176d3]'
                          : 'bg-white border-[#d8dde6] text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex flex-col">
                          {effectiveCode && (
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] font-mono font-extrabold text-[#0176d3] bg-blue-50 px-1 py-0.2 rounded border border-blue-200 self-start">
                                CODE: {effectiveCode}
                              </span>
                              {isCorporateTier && exam.corporatePrice !== undefined && (
                                <span className="text-[8px] font-mono font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  CORP
                                </span>
                              )}
                            </div>
                          )}
                          <span className="font-bold text-[11px] leading-tight text-slate-900">
                            {getExaminationName(exam, patientCategory)}
                          </span>
                        </div>

                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected ? 'bg-[#0176d3] border-[#0176d3] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">
                          {effectiveCategory}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-emerald-700">
                          {formatCurrency(effectivePrice)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredExaminations.length === 0 && (
                <div className="text-center py-8 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200 space-y-1">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No examinations found matching &ldquo;{searchTestQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTestQuery('');
                      setActiveCategoryTab('ALL');
                    }}
                    className="text-[11px] text-[#0176d3] font-bold hover:underline"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-600">
                <strong className="font-mono text-slate-900">{selectedExaminations.length}</strong> examinations selected (Fee: <strong className="font-mono text-emerald-700">{formatCurrency(totalExaminationFee)}</strong>)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-1.5 border border-[#d8dde6] rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Done / Apply Selection</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
