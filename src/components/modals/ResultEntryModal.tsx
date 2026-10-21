import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FlaskConical, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  User, 
  AlertTriangle, 
  FileCheck, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  Layers,
  Activity,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { LabTestRequisition } from './NewRequisitionModal';
import { 
  getTemplateForExamination, 
  ExaminationTemplate, 
  ParameterDef 
} from '../../data/testParametersCatalog';
import { getResultFormForExam, resolveEntryForm } from '../../data/resultFormsCatalog';
import { NtpLabRequestForm, NTP_FIELD_KEYS } from '../forms/NtpLabRequestForm';
import { determineResultFlag } from '../../utils/qcCalculations';

export interface ResultParamValue {
  paramId: string;
  paramCode: string;
  paramName: string;
  unit: string;
  value: string;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'REACTIVE' | 'NON-REACTIVE' | 'PENDING';
  isCalculated?: boolean;
}

/** Sign-off personnel for a single examination (not the whole request) */
export interface ExamExaminers {
  labTechName?: string;
  rmtName: string;
  rmtLicense: string;
  pathologistName: string;
  pathologistLicense?: string;
}

export interface ExamResultGroup {
  examCode: string;
  examName: string;
  category: string;
  methodology?: string;
  specimenType?: string;
  parameters: Record<string, ResultParamValue>;
  remarks?: string;
  /** Laboratory Technician / Med Tech / Pathologist for THIS examination only */
  examiners?: ExamExaminers;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export const DEFAULT_EXAMINERS = (pathologistName = 'Dr. Katherine Zhang, MD, FPSP'): ExamExaminers => ({
  labTechName: '',
  rmtName: 'Maria Santos, RMT',
  rmtLicense: 'PRC #0089124',
  pathologistName,
  pathologistLicense: 'PRC #0045189',
});

export type ResultSaveOptions = { silent?: boolean };

interface ResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: LabTestRequisition | null;
  /** Previously saved examination inputs for this request. */
  savedExamResults?: Record<string, ExamResultGroup>;
  savedRemarks?: string;
  onSaveResults: (
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
    options?: ResultSaveOptions
  ) => void;
  onViewCoA?: (req: LabTestRequisition) => void;
  currentUserName?: string;
}

export const ResultEntryModal: React.FC<ResultEntryModalProps> = ({
  isOpen,
  onClose,
  requisition,
  savedExamResults,
  savedRemarks,
  onSaveResults,
  onViewCoA,
  currentUserName = 'Dr. Katherine Zhang, MD',
}) => {
  const [activeExamIndex, setActiveExamIndex] = useState<number>(0);
  const [examResults, setExamResults] = useState<Record<string, ExamResultGroup>>({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const dirtyRef = useRef(false);
  const hydratedRef = useRef('');
  const onSaveRef = useRef(onSaveResults);
  onSaveRef.current = onSaveResults;

  // Initialize test templates and overlay every previously saved input
  useEffect(() => {
    if (!requisition) return;
    const token = requisition.id;
    if (!hydratedRef.current.startsWith(token)) dirtyRef.current = false;
    if (dirtyRef.current && hydratedRef.current.startsWith(token)) return;
    const hasSaved = !!(savedExamResults && Object.keys(savedExamResults).length > 0);
    if (hydratedRef.current === `${token}:saved`) return;
    if (!hasSaved && hydratedRef.current === token) return;
    hydratedRef.current = hasSaved ? `${token}:saved` : token;

    const examList = requisition.kindOfExamination && requisition.kindOfExamination.length > 0
      ? requisition.kindOfExamination
      : requisition.selectedTestNames || ['CBC WITH PLATELET COUNT'];

    const initialGroups: Record<string, ExamResultGroup> = {};

    examList.forEach((examName, idx) => {
      const template: ExaminationTemplate = getTemplateForExamination(examName);
      const paramMap: Record<string, ResultParamValue> = {};

      template.parameters.forEach((p) => {
        const val = p.defaultValue || '';
        const flag = calculateFlag(p, val);

        paramMap[p.id] = {
          paramId: p.id,
          paramCode: p.code,
          paramName: p.name,
          unit: p.unit || '',
          value: val,
          flag,
          isCalculated: p.dataType === 'CALCULATED',
        };
      });

      const examKey = template.examCode || `EXAM-${idx}`;
      const saved = savedExamResults?.[examKey];
      if (saved?.parameters) {
        Object.entries(saved.parameters).forEach(([id, val]) => {
          paramMap[id] = val;
        });
      }

      initialGroups[examKey] = {
        examCode: template.examCode,
        examName: template.examName,
        category: template.category,
        methodology: template.methodology,
        specimenType: template.specimenType,
        parameters: paramMap,
        remarks: saved?.remarks || 'Results verified and cross-referenced with daily internal QC run.',
        examiners: saved?.examiners || DEFAULT_EXAMINERS(currentUserName || 'Dr. Katherine Zhang, MD, FPSP'),
        status: requisition.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      };
    });

    // Keep saved exams that are no longer on the request list so their inputs are not dropped
    if (savedExamResults) {
      Object.entries(savedExamResults).forEach(([key, group]) => {
        if (!initialGroups[key]) initialGroups[key] = group;
      });
    }

    setExamResults(initialGroups);
    setGeneralRemarks(savedRemarks || '');
    setActiveExamIndex(0);
    setIsSavedSuccess(false);
  }, [requisition, savedExamResults, savedRemarks, currentUserName]);

  // Write every input shortly after it changes so a refresh does not drop the form
  useEffect(() => {
    if (!requisition || !dirtyRef.current) return;
    if (Object.keys(examResults).length === 0) return;
    const examKeys = Object.keys(examResults);
    const activeKey = examKeys[activeExamIndex] || examKeys[0];
    const active = examResults[activeKey]?.examiners || DEFAULT_EXAMINERS(currentUserName);
    const payload = {
      labTechName: active.labTechName,
      rmtName: active.rmtName,
      rmtLicense: active.rmtLicense,
      pathologistName: active.pathologistName,
      pathologistLicense: active.pathologistLicense,
      remarks: generalRemarks,
    };
    const timer = window.setTimeout(() => {
      onSaveRef.current(requisition.id, examResults, false, payload, { silent: true });
    }, 700);
    return () => {
      window.clearTimeout(timer);
      if (dirtyRef.current) {
        onSaveRef.current(requisition.id, examResults, false, payload, { silent: true });
      }
    };
  }, [examResults, generalRemarks, requisition, activeExamIndex, currentUserName]);

  if (!isOpen || !requisition) return null;

  const examKeys = Object.keys(examResults);
  const currentExamKey = examKeys[activeExamIndex] || examKeys[0];
  const currentGroup = examResults[currentExamKey];
  const currentTemplate = currentGroup ? getTemplateForExamination(currentGroup.examName) : null;

  // Helper function to calculate flag
  function calculateFlag(param: ParameterDef, valStr: string): ResultParamValue['flag'] {
    if (!valStr || valStr.trim() === '') return 'PENDING';

    const clean = valStr.toUpperCase();
    if (clean === 'NON-REACTIVE' || clean === 'NEGATIVE' || clean === 'NO OVA OR PARASITE SEEN' || clean === '0 / NEGATIVE') {
      return 'NON-REACTIVE';
    }
    if (clean.includes('REACTIVE') || clean.includes('POSITIVE') || clean.includes('+1') || clean.includes('+2') || clean.includes('+3')) {
      return 'REACTIVE';
    }

    if (param.dataType === 'NUMERIC' || param.dataType === 'CALCULATED') {
      const num = parseFloat(valStr);
      if (isNaN(num)) return 'NORMAL';
      const flag = determineResultFlag(num, param.specMin, param.specMax, param.criticalMin, param.criticalMax);
      return flag === 'OOS' ? 'CRITICAL' : flag;
    }

    return 'NORMAL';
  }

  // Handle single parameter change with dynamic dependent calculations
  const handleParamChange = (paramId: string, newValue: string) => {
    if (!currentGroup || !currentTemplate) return;
    dirtyRef.current = true;

    setExamResults((prev) => {
      const updatedGroup = { ...prev[currentExamKey] };
      const updatedParams = { ...updatedGroup.parameters };

      const paramDef = currentTemplate.parameters.find((p) => p.id === paramId);

      const existing = updatedParams[paramId];
      updatedParams[paramId] = {
        ...existing,
        paramId: existing?.paramId || paramDef?.id || paramId,
        paramCode: existing?.paramCode || paramDef?.code || paramId,
        paramName: existing?.paramName || paramDef?.name || paramId,
        unit: existing?.unit || paramDef?.unit || '',
        isCalculated: existing?.isCalculated ?? paramDef?.dataType === 'CALCULATED',
        value: newValue,
        flag: paramDef ? calculateFlag(paramDef, newValue) : 'NORMAL',
      };

      // Auto-recalculate dependent formulas in the same examination group
      // 1. CBC: Hematocrit = RBC * MCV / 10
      if (currentGroup.examCode === '1010' || currentGroup.examName.includes('CBC')) {
        const rbcVal = parseFloat(updatedParams['p_rbc']?.value || '0');
        const mcvVal = parseFloat(updatedParams['p_mcv']?.value || '0');
        if (rbcVal > 0 && mcvVal > 0 && updatedParams['p_hct']) {
          const calcHct = ((rbcVal * mcvVal) / 10).toFixed(2);
          const hctDef = currentTemplate.parameters.find((p) => p.id === 'p_hct');
          updatedParams['p_hct'] = {
            ...updatedParams['p_hct'],
            value: calcHct,
            flag: hctDef ? calculateFlag(hctDef, calcHct) : 'NORMAL',
          };
        }
      }

      // 2. Lipid Profile: LDL = Total - HDL - (Trig / 5)
      if (currentGroup.examCode === '1015' || currentGroup.examName.includes('LIPID')) {
        const tchol = parseFloat(updatedParams['p_tchol']?.value || '0');
        const hdl = parseFloat(updatedParams['p_hdl']?.value || '0');
        const trig = parseFloat(updatedParams['p_trig']?.value || '0');
        if (tchol > 0 && hdl > 0 && trig > 0 && updatedParams['p_ldl']) {
          const calcLdl = Math.max(0, tchol - hdl - (trig / 5)).toFixed(2);
          const calcVldl = (trig / 5).toFixed(2);
          const calcRatio = (tchol / hdl).toFixed(2);

          const ldlDef = currentTemplate.parameters.find((p) => p.id === 'p_ldl');
          const vldlDef = currentTemplate.parameters.find((p) => p.id === 'p_vldl');
          const ratioDef = currentTemplate.parameters.find((p) => p.id === 'p_chol_hdl_ratio');

          updatedParams['p_ldl'] = {
            ...updatedParams['p_ldl'],
            value: calcLdl,
            flag: ldlDef ? calculateFlag(ldlDef, calcLdl) : 'NORMAL',
          };
          if (updatedParams['p_vldl'] && vldlDef) {
            updatedParams['p_vldl'] = { ...updatedParams['p_vldl'], value: calcVldl, flag: calculateFlag(vldlDef, calcVldl) };
          }
          if (updatedParams['p_chol_hdl_ratio'] && ratioDef) {
            updatedParams['p_chol_hdl_ratio'] = { ...updatedParams['p_chol_hdl_ratio'], value: calcRatio, flag: calculateFlag(ratioDef, calcRatio) };
          }
        }
      }

      // 3. HbA1c eAG: (HbA1c * 28.7) - 46.7
      if (currentGroup.examCode === '1009' || currentGroup.examName.includes('HBA1C')) {
        const a1c = parseFloat(updatedParams['p_hba1c']?.value || '0');
        if (a1c > 0 && updatedParams['p_eag']) {
          const calcEag = ((a1c * 28.7) - 46.7).toFixed(1);
          const eagDef = currentTemplate.parameters.find((p) => p.id === 'p_eag');
          updatedParams['p_eag'] = {
            ...updatedParams['p_eag'],
            value: calcEag,
            flag: eagDef ? calculateFlag(eagDef, calcEag) : 'NORMAL',
          };
        }
      }

      updatedGroup.parameters = updatedParams;
      return { ...prev, [currentExamKey]: updatedGroup };
    });
  };

  // Quick Action: Fill Normal Physiological Baselines
  const handleFillNormalBaselines = () => {
    if (!currentGroup || !currentTemplate) return;
    dirtyRef.current = true;

    setExamResults((prev) => {
      const updatedGroup = { ...prev[currentExamKey] };
      const updatedParams = { ...updatedGroup.parameters };

      currentTemplate.parameters.forEach((p) => {
        const defaultVal = p.defaultValue || (p.specMin !== undefined && p.specMax !== undefined ? ((p.specMin + p.specMax) / 2).toFixed(2) : 'Normal');
        updatedParams[p.id] = {
          ...updatedParams[p.id],
          value: defaultVal,
          flag: calculateFlag(p, defaultVal),
        };
      });

      updatedGroup.parameters = updatedParams;
      return { ...prev, [currentExamKey]: updatedGroup };
    });
  };

  // Quick Action: Simulate Instrument Telemetry Feed
  const handleSimulateInstrumentTelemetry = () => {
    if (!currentGroup || !currentTemplate) return;
    dirtyRef.current = true;

    setExamResults((prev) => {
      const updatedGroup = { ...prev[currentExamKey] };
      const updatedParams = { ...updatedGroup.parameters };

      currentTemplate.parameters.forEach((p) => {
        if (p.dataType === 'NUMERIC' && p.specMin !== undefined && p.specMax !== undefined) {
          const mid = (p.specMin + p.specMax) / 2;
          const range = (p.specMax - p.specMin) * 0.4;
          const randomVal = (mid + (Math.random() - 0.5) * range).toFixed(2);
          updatedParams[p.id] = {
            ...updatedParams[p.id],
            value: randomVal,
            flag: calculateFlag(p, randomVal),
          };
        } else if (p.dataType === 'SELECT' && p.options && p.options.length > 0) {
          const defaultOpt = p.defaultValue || p.options[0];
          updatedParams[p.id] = {
            ...updatedParams[p.id],
            value: defaultOpt,
            flag: calculateFlag(p, defaultOpt),
          };
        }
      });

      updatedGroup.parameters = updatedParams;
      return { ...prev, [currentExamKey]: updatedGroup };
    });
  };

  const updateCurrentExaminers = (patch: Partial<ExamExaminers>) => {
    if (!currentExamKey) return;
    dirtyRef.current = true;
    setExamResults((prev) => {
      const group = prev[currentExamKey];
      if (!group) return prev;
      const base = group.examiners || DEFAULT_EXAMINERS(currentUserName);
      return {
        ...prev,
        [currentExamKey]: {
          ...group,
          examiners: { ...base, ...patch },
        },
      };
    });
  };

  const applyExaminersToAll = () => {
    if (!currentExamKey) return;
    dirtyRef.current = true;
    const source =
      examResults[currentExamKey]?.examiners || DEFAULT_EXAMINERS(currentUserName);
    setExamResults((prev) => {
      const next: Record<string, ExamResultGroup> = {};
      Object.keys(prev).forEach((key) => {
        next[key] = { ...prev[key], examiners: { ...source } };
      });
      return next;
    });
  };

  const buildMedTech = () => {
    const active =
      examResults[currentExamKey]?.examiners || DEFAULT_EXAMINERS(currentUserName);
    return {
      labTechName: active.labTechName,
      rmtName: active.rmtName,
      rmtLicense: active.rmtLicense,
      pathologistName: active.pathologistName,
      pathologistLicense: active.pathologistLicense,
      remarks: generalRemarks,
    };
  };

  // Save handler — medTechInfo is a request-level summary from the active exam
  const handleSave = (isFinalize: boolean) => {
    dirtyRef.current = true;
    onSaveResults(requisition.id, examResults, isFinalize, buildMedTech());
    setIsSavedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 font-sans animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. Modal Top Bar Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FlaskConical className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Laboratory Test Result Entry Engine
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold font-mono border ${
                  requisition.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  {requisition.status}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {requisition.patientOrSubjectName} · <span className="font-mono">{requisition.caseNo || requisition.requisitionNumber}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Patient Demographics Strip */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-5 py-2.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Patient Age / Gender</span>
            <span className="font-bold text-slate-800">{requisition.patientAge} Yrs · {requisition.patientGender}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Patient Category</span>
            <span className="font-bold text-slate-800">{requisition.patientCategory || 'OPD'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Requisition / Date</span>
            <span className="font-bold text-slate-800">{requisition.requisitionNumber} · {requisition.requestDate.split(' ')[0]}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Requesting Physician</span>
            <span className="font-bold text-slate-800 truncate block">{requisition.orderingPhysicianOrPI || 'Dr. PTSI Clinic, MD'}</span>
          </div>
        </div>

        {/* 3. Multi-Examination Tabs (if patient has multiple tests) */}
        {examKeys.length > 1 && (
          <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0 pt-2">
            {examKeys.map((key, idx) => {
              const grp = examResults[key];
              const isSelected = idx === activeExamIndex;
              return (
                <button
                  key={key}
                  onClick={() => setActiveExamIndex(idx)}
                  className={`py-2 px-3 text-xs font-bold rounded-t-md transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 text-slate-900 bg-slate-50 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-slate-600" />
                  <span>{grp.examName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 font-mono text-slate-700">
                    {grp.examCode}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Main Scrollable Examination Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {currentGroup && currentTemplate ? (
            <>
              {/* Examination Overview Banner */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      {currentGroup.examName}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-200 text-slate-800 border border-slate-300">
                      {currentGroup.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Methodology: <strong className="text-slate-700">{currentGroup.methodology || 'Automated Diagnostic Assay'}</strong> · Specimen: <strong className="text-slate-700">{currentGroup.specimenType || 'Venous Whole Blood'}</strong>
                  </p>
                </div>

                {/* Automation Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleFillNormalBaselines}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer active:scale-95"
                    title="Fill typical normal physiological reference values"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fill Normal Baseline</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateInstrumentTelemetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer active:scale-95"
                    title="Simulate live packet ingestion from laboratory analyzer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Simulate Instrument Stream</span>
                  </button>
                </div>
              </div>

              {/* Parameter Entry — PTSI forms use TEST | RESULT only */}
              {(() => {
                const resultForm = resolveEntryForm(
                  currentGroup.examName,
                  currentGroup.examCode,
                  requisition.patientGender
                );
                const useSimple =
                  Boolean(resultForm?.resultSections && resultForm.resultSections.length > 0);
                const isBloodTyping = resultForm?.layoutStyle === 'blood-typing';
                const isPregnancy = resultForm?.layoutStyle === 'pregnancy';
                const isNtpRequest = resultForm?.layoutStyle === 'ntp-request';
                const useFlatAnalytes =
                  Boolean(resultForm?.analytes && resultForm.analytes.length > 0) &&
                  !useSimple &&
                  !isBloodTyping &&
                  !isPregnancy;

                const formatParamRef = (param: ParameterDef) => {
                  if (param.normalText) return param.normalText;
                  if (param.specMin !== undefined && param.specMax !== undefined) {
                    return `${param.specMin} - ${param.specMax}`;
                  }
                  return '—';
                };

                if (isNtpRequest) {
                  const ntpValues = Object.fromEntries(
                    NTP_FIELD_KEYS.map((key) => [key, currentGroup.parameters[key]?.value || ''])
                  );
                  return (
                    <NtpLabRequestForm values={ntpValues} onChange={handleParamChange} />
                  );
                }

                if (isBloodTyping) {
                  return (
                    <div className="border border-slate-300 rounded-sm py-10 px-4 text-center space-y-4 bg-white">
                      <div className="text-[11px] font-semibold tracking-[0.35em] text-slate-400 uppercase">
                        {resultForm?.panelTitle || 'HEMATOLOGY'}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xl font-bold text-slate-900">
                        <span className="text-slate-400" aria-hidden>
                          &ldquo;
                        </span>
                        {currentTemplate.parameters.map((param, pIdx) => {
                          const currentValue = currentGroup.parameters[param.id]?.value || '';
                          const isRh = param.id === 'bt_rh' || param.code === 'RH';
                          return (
                            <React.Fragment key={param.id}>
                              {isRh ? (
                                <span className="font-bold tracking-wider">RH:</span>
                              ) : null}
                              <select
                                value={currentValue}
                                onChange={(e) => handleParamChange(param.id, e.target.value)}
                                className={`border-0 border-b-2 border-slate-700 bg-transparent px-2 py-1 text-center font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] ${
                                  isRh ? 'min-w-[11rem] text-lg' : 'min-w-[4.5rem] text-xl'
                                }`}
                                aria-label={param.name}
                              >
                                <option value="">—</option>
                                {(param.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              {!isRh && pIdx === 0 ? (
                                <span className="text-slate-400" aria-hidden>
                                  &rdquo;
                                </span>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (isPregnancy) {
                  const param = currentTemplate.parameters[0];
                  const currentValue = param
                    ? currentGroup.parameters[param.id]?.value || ''
                    : '';
                  return (
                    <div className="border border-slate-300 rounded-sm py-12 px-4 text-center bg-white">
                      <div className="text-xl font-bold tracking-wide text-slate-900">RESULT:</div>
                      <div className="text-base font-semibold text-slate-800 mt-1">(URINE)</div>
                      {param ? (
                        <div className="mt-8 flex justify-center">
                          <select
                            value={currentValue}
                            onChange={(e) => handleParamChange(param.id, e.target.value)}
                            className="min-w-[12rem] border-0 border-b-2 border-slate-700 bg-transparent px-3 py-1 text-center text-xl font-bold tracking-wide text-slate-900 focus:outline-none focus:border-[#0176d3]"
                            aria-label="Pregnancy test result"
                          >
                            <option value="">—</option>
                            {(param.options || ['POSITIVE', 'NEGATIVE']).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                if (useSimple && resultForm?.resultSections) {
                  const fourCol = resultForm.tableColumns === 'test-result-unit-ref';
                  return (
                    <div className="border border-slate-300 rounded-sm overflow-hidden">
                      {fourCol ? (
                        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                          <div className="col-span-4 px-4 py-2 border-r border-slate-300">Test</div>
                          <div className="col-span-3 px-4 py-2 border-r border-slate-300">Result</div>
                          <div className="col-span-2 px-4 py-2 border-r border-slate-300">Unit</div>
                          <div className="col-span-3 px-4 py-2">Ref. Range</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                          <div className="px-4 py-2 border-r border-slate-300">
                            {resultForm.testColumnLabel || 'Test'}
                          </div>
                          <div className="px-4 py-2">{resultForm.resultColumnLabel || 'Result'}</div>
                        </div>
                      )}
                      {resultForm.resultSections.map((section) => (
                        <div key={section.id}>
                          {section.title ? (
                            <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-800">
                              {section.title}
                            </div>
                          ) : null}
                          {section.rows.map((row) => {
                            const param = currentTemplate.parameters.find((p) => p.id === row.id);
                            const currentValue =
                              currentGroup.parameters[row.id]?.value ||
                              (param ? currentGroup.parameters[param.id]?.value : '') ||
                              '';
                            const inputType =
                              row.resultType === 'numeric' || param?.dataType === 'NUMERIC'
                                ? 'number'
                                : 'text';
                            if (fourCol) {
                              return (
                                <div
                                  key={row.id}
                                  className="grid grid-cols-12 border-b border-slate-100 last:border-b-0"
                                >
                                  <div className="col-span-4 px-4 py-2.5 border-r border-slate-100 text-sm text-slate-800">
                                    {row.label}
                                  </div>
                                  <div className="col-span-3 px-3 py-1.5 border-r border-slate-100">
                                    <input
                                      type={inputType}
                                      step={inputType === 'number' ? 'any' : undefined}
                                      value={currentValue}
                                      onChange={(e) =>
                                        handleParamChange(param?.id || row.id, e.target.value)
                                      }
                                      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                    />
                                  </div>
                                  <div className="col-span-2 px-4 py-2.5 border-r border-slate-100 text-xs font-mono text-slate-700">
                                    {row.unit || param?.unit || '—'}
                                  </div>
                                  <div className="col-span-3 px-4 py-2.5 text-xs font-mono text-slate-700">
                                    {row.refRange || param?.normalText || '—'}
                                  </div>
                                </div>
                              );
                            }
                            const methodKey = row.examChoiceId || `${row.id}_exam`;
                            const methodValue = row.examOptions
                              ? currentGroup.parameters[methodKey]?.value || ''
                              : '';
                            const resultChoices = row.resultOptionsByExam
                              ? row.resultOptionsByExam[methodValue] || []
                              : row.options || [];
                            return (
                              <div
                                key={row.id}
                                className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
                              >
                                <div className="px-4 py-2.5 border-r border-slate-100 text-sm text-slate-800">
                                  {row.examOptions ? (
                                    <select
                                      value={methodValue}
                                      onChange={(e) => {
                                        const next = e.target.value;
                                        handleParamChange(methodKey, next);
                                        const allowed = row.resultOptionsByExam?.[next] || [];
                                        if (currentValue && !allowed.includes(currentValue)) {
                                          handleParamChange(row.id, '');
                                        }
                                      }}
                                      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                      aria-label="Culture method"
                                    >
                                      <option value="">—</option>
                                      {row.examOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    row.label
                                  )}
                                </div>
                                <div className="px-3 py-1.5">
                                  {row.resultType === 'select' ? (
                                    <select
                                      value={currentValue}
                                      onChange={(e) =>
                                        handleParamChange(param?.id || row.id, e.target.value)
                                      }
                                      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                    >
                                      <option value="">—</option>
                                      {resultChoices.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={inputType}
                                      step={inputType === 'number' ? 'any' : undefined}
                                      value={currentValue}
                                      onChange={(e) =>
                                        handleParamChange(param?.id || row.id, e.target.value)
                                      }
                                      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                }

                if (useFlatAnalytes && resultForm?.analytes) {
                  return (
                    <div className="border border-slate-300 rounded-sm overflow-hidden">
                      <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                        <div className="px-4 py-2 border-r border-slate-300">Test</div>
                        <div className="px-4 py-2">Result</div>
                      </div>
                      {resultForm.analytes.map((row) => {
                        const param = currentTemplate.parameters.find((p) => p.id === row.id);
                        const currentValue =
                          currentGroup.parameters[row.id]?.value ||
                          (param ? currentGroup.parameters[param.id]?.value : '') ||
                          '';
                        const isSelect =
                          row.resultType === 'select' || param?.dataType === 'SELECT';
                        const isNumeric =
                          row.resultType === 'numeric' || param?.dataType === 'NUMERIC';
                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="px-4 py-2.5 border-r border-slate-100 text-sm text-slate-800">
                              {row.label}
                            </div>
                            <div className="px-3 py-1.5">
                              {isSelect ? (
                                <select
                                  value={currentValue}
                                  onChange={(e) =>
                                    handleParamChange(param?.id || row.id, e.target.value)
                                  }
                                  className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                >
                                  <option value="">—</option>
                                  {(row.options || param?.options || []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={isNumeric ? 'number' : 'text'}
                                  step={isNumeric ? 'any' : undefined}
                                  value={currentValue}
                                  onChange={(e) =>
                                    handleParamChange(param?.id || row.id, e.target.value)
                                  }
                                  className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
              <div className="border border-slate-300 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                  <div className="col-span-4 px-4 py-2 border-r border-slate-300">Test</div>
                  <div className="col-span-3 px-4 py-2 border-r border-slate-300">Result</div>
                  <div className="col-span-2 px-4 py-2 border-r border-slate-300">Unit</div>
                  <div className="col-span-3 px-4 py-2">Ref. Range</div>
                </div>
                {currentTemplate.parameters.map((param) => {
                  const currentValue = currentGroup.parameters[param.id]?.value || '';
                  return (
                    <div
                      key={param.id}
                      className="grid grid-cols-12 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="col-span-4 px-4 py-2.5 border-r border-slate-100 text-sm text-slate-800">
                        {param.name}
                      </div>
                      <div className="col-span-3 px-3 py-1.5 border-r border-slate-100">
                        {param.dataType === 'SELECT' && param.options ? (
                          <select
                            value={currentValue}
                            onChange={(e) => handleParamChange(param.id, e.target.value)}
                            className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                          >
                            <option value="">—</option>
                            {param.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={param.dataType === 'NUMERIC' ? 'number' : 'text'}
                            step={param.dataType === 'NUMERIC' ? 'any' : undefined}
                            value={currentValue}
                            onChange={(e) => handleParamChange(param.id, e.target.value)}
                            className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                          />
                        )}
                      </div>
                      <div className="col-span-2 px-4 py-2.5 border-r border-slate-100 text-xs font-mono text-slate-700">
                        {param.unit || '—'}
                      </div>
                      <div className="col-span-3 px-4 py-2.5 text-xs font-mono text-slate-700">
                        {formatParamRef(param)}
                      </div>
                    </div>
                  );
                })}
              </div>
                );
              })()}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No examination parameter template loaded.
            </div>
          )}

          {/* 5. Per-examination examiners (for the active exam tab) */}
          {currentGroup && (() => {
            const ex = currentGroup.examiners || DEFAULT_EXAMINERS(currentUserName);
            return (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    Examiners for this examination — {currentGroup.examName}
                  </h4>
                  {examKeys.length > 1 && (
                    <button
                      type="button"
                      onClick={applyExaminersToAll}
                      className="text-[10px] font-bold text-[#0176d3] hover:underline cursor-pointer"
                      title="Copy these examiners to every examination on this request"
                    >
                      Apply to all examinations
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Laboratory Technician
                    </label>
                    <input
                      type="text"
                      value={ex.labTechName || ''}
                      onChange={(e) => updateCurrentExaminers({ labTechName: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Medical Technologist *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ex.rmtName}
                        onChange={(e) => updateCurrentExaminers({ rmtName: e.target.value })}
                        placeholder="Full Name, RMT"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        value={ex.rmtLicense}
                        onChange={(e) => updateCurrentExaminers({ rmtLicense: e.target.value })}
                        placeholder="License No."
                        className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pathologist * (Name, License No.)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ex.pathologistName}
                        onChange={(e) => updateCurrentExaminers({ pathologistName: e.target.value })}
                        placeholder="Pathologist Name, MD, FPSP"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        value={ex.pathologistLicense || ''}
                        onChange={(e) =>
                          updateCurrentExaminers({ pathologistLicense: e.target.value })
                        }
                        placeholder="License No."
                        className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Clinical Remarks / Diagnostic Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={generalRemarks}
                    onChange={(e) => {
                      dirtyRef.current = true;
                      setGeneralRemarks(e.target.value);
                    }}
                    placeholder="e.g. Repeated test in duplicate. Specimen integrity verified."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900"
                  />
                </div>
              </div>
            );
          })()}

          {/* Success Banner if saved */}
          {isSavedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-emerald-900 text-xs font-semibold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Results successfully saved and validated. Requisition status updated.</span>
              </div>
              {onViewCoA && (
                <button
                  type="button"
                  onClick={() => onViewCoA(requisition)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Preview & Print CoA</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 6. Modal Footer Action Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>21 CFR Part 11 compliant audit trail timestamp recorded on save.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Save draft and mark testing in progress"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save Draft (In Testing)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98"
              title="Complete all parameters and validate official Certificate of Analysis"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Complete &amp; Finalize Results</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
