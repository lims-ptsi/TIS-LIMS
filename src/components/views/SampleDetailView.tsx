import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Printer, 
  Info, 
  Layers, 
  ShieldCheck,
  FileSpreadsheet, 
  Sparkles, 
  ArrowLeft,
  FlaskConical,
  Activity,
  Copy,
  CheckCircle2,
  Save,
  Clock,
  Edit,
  X,
  Check,
  ExternalLink,
  AlertCircle,
  PackageCheck,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Sample } from '../../types/lims';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import {
  ExamResultGroup,
  ExamExaminers,
  ResultParamValue,
  DEFAULT_EXAMINERS,
} from '../modals/ResultEntryModal';
import { getTemplateForExamination, ExaminationTemplate, ParameterDef } from '../../data/testParametersCatalog';
import { getResultFormForExam, resolveEntryForm } from '../../data/resultFormsCatalog';
import { findCatalogExamination, isSendOutExamination } from '../../data/examinationCatalog';
import { NtpLabRequestForm, NTP_FIELD_KEYS } from '../forms/NtpLabRequestForm';
import { determineResultFlag } from '../../utils/qcCalculations';
import { baselineParameterValue, simulateParameterValue } from '../../utils/resultSimulate';
import {
  hasEnteredResult,
  isResultFormRowExamined,
  resultFormRowAppliesToExamCodes,
} from '../../utils/resultDisplay';
import { Barcode } from '../common/Barcode';
import { formatResultsPickupWhen, isResultsPickedUp } from '../../utils/resultsPickup';
import { DocumentSideDrawer } from '../modals/DocumentSideDrawer';

function DetailField({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: 'accent' | 'default';
}) {
  return (
    <div className="space-y-1 pb-3 border-b border-slate-100 min-w-0">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className={`text-sm font-semibold text-slate-900 break-words ${
          emphasize === 'accent' ? 'text-[#0176d3]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function isInHouseResultExam(examName: string, examCode?: string | null): boolean {
  return !isSendOutExamination(examName, examCode);
}

function sendOutPartnerLabel(examName: string, examCode?: string | null): string {
  const item =
    findCatalogExamination(examName) ||
    findCatalogExamination(examCode || undefined);
  return item?.sendOutPlatform?.trim() || 'Referral laboratory';
}

function PanelSection({
  title,
  icon,
  expanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#d8dde6] rounded-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 min-w-0">
          {icon}
          <span className="truncate">
            {title}
            {count != null ? ` (${count})` : ''}
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {expanded ? children : null}
    </div>
  );
}

interface SampleDetailViewProps {
  sample?: Sample | null;
  requisition?: LabTestRequisition | null;
  storedResults?: Record<string, ExamResultGroup>;
  storedMedTech?: {
    labTechName?: string;
    rmtName?: string;
    rmtLicense?: string;
    pathologistName?: string;
    pathologistLicense?: string;
    remarks?: string;
  };
  onBack?: () => void;
  onEditSample?: (sample: Sample) => void;
  onDeleteSample?: (sampleId: string) => void;
  onSelectProtocol?: (sample: Sample) => void;
  onNavigateToBox?: (boxId: string, well?: string) => void;
  allSamples?: Sample[];
  onNavigateToSample?: (sampleId: string) => void;
  onPrintLabel?: (sample: Sample) => void;
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
  onOpenCoA?: (sample: Sample) => void;
  currentUserName?: string;
  onReceiveSpecimen?: (req: LabTestRequisition) => void;
  onViewSlip?: (req: LabTestRequisition) => void;
  canAccession?: boolean;
  canRecordResultsPickup?: boolean;
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
  canNotifyPatient?: boolean;
  onNotifyResultsReady?: (req: LabTestRequisition) => void;
}

export function getExamAbbreviation(name: string): string {
  if (!name) return 'LAB';
  const clean = name.toUpperCase();
  if (clean.includes('CBC') || clean.includes('COMPLETE BLOOD')) return 'CBC';
  if (clean.includes('URIN') || clean.includes('URINALYSIS')) return 'URINE';
  if (clean.includes('FECA') || clean.includes('STOOL')) return 'STOOL';
  if (clean.includes('DSSM') || clean.includes('SPUTUM')) return 'DSSM';
  if (clean.includes('AFB')) return 'AFB';
  if (clean.includes('FBS') || clean.includes('FASTING BLOOD')) return 'FBS';
  if (clean.includes('LIPID') || clean.includes('CHOLESTEROL')) return 'LIPID';
  if (clean.includes('URIC') || clean.includes('BUA')) return 'BUA';
  if (clean.includes('BUN') || clean.includes('UREA')) return 'BUN';
  if (clean.includes('CREAT')) return 'CREAT';
  if (clean.includes('SGPT') || clean.includes('ALT')) return 'SGPT';
  if (clean.includes('SGOT') || clean.includes('AST')) return 'SGOT';
  if (clean.includes('HBSAG') || clean.includes('HEPATITIS B')) return 'HBsAg';
  if (clean.includes('DENGUE')) return 'DENGUE';
  if (clean.includes('HIV')) return 'HIV';
  if (clean.includes('SYPHILIS') || clean.includes('VDRL') || clean.includes('RPR')) return 'VDRL';
  if (clean.includes('PREGNANCY') || clean.includes('HCG')) return 'HCG';
  if (clean.includes('TSH')) return 'TSH';
  if (clean.includes('PTT')) return 'PTT';
  if (clean.includes('PT')) return 'PT';
  if (clean.includes('CMP')) return 'CMP';
  return clean.split(' ').slice(0, 2).join(' ').substring(0, 10);
}

export interface SpecimenContainerItem {
  id: string; // 'T1', 'T2', etc.
  tubeNumber: number;
  tubeBarcode: string;
  containerName: string;
  shortContainer: string;
  matrix: string;
  categoryName: string;
  exams: string[];
  examAbbrs: string[];
  primaryAbbr: string;
  temp: string;
  capColor: string;
  dotBg: string;
  badgeColor: string;
}

export function getExamContainerInfo(examName: string) {
  const clean = (examName || '').toUpperCase();
  if (clean.includes('CBC') || clean.includes('HEMATOLOGY') || clean.includes('PLATELET') || clean.includes('BLOOD TYPING') || clean.includes('ESR')) {
    return { container: 'Lavender Top (K2-EDTA)', matrix: 'Whole Blood (EDTA)', abbr: 'CBC', temp: '+4°C', color: 'bg-purple-50 text-purple-800 border-purple-300' };
  }
  if (clean.includes('URIN') || clean.includes('PREGNANCY') || clean.includes('HCG')) {
    return { container: 'Sterile Urine Cup', matrix: 'Clean Catch Urine', abbr: clean.includes('HCG') ? 'HCG' : 'URINE', temp: '+4°C', color: 'bg-amber-50 text-amber-800 border-amber-300' };
  }
  if (clean.includes('FECA') || clean.includes('STOOL') || clean.includes('FOBT') || clean.includes('OCCULT')) {
    return { container: 'Clean Stool Container', matrix: 'Fecal Specimen', abbr: 'STOOL', temp: '+4°C', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' };
  }
  if (clean.includes('SPUTUM') || clean.includes('DSSM') || clean.includes('AFB') || clean.includes('TB')) {
    return { container: 'Sputum Specimen Jar', matrix: 'Early Morning Sputum', abbr: 'AFB', temp: '+4°C', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
  }
  if (clean.includes('PTT') || clean.includes('PROTHROMBIN') || clean.includes('COAGULATION') || clean.includes('CITRATE')) {
    return { container: 'Light Blue Top (3.2% Citrate)', matrix: 'Citrated Plasma', abbr: 'COAG', temp: '+4°C', color: 'bg-sky-50 text-sky-800 border-sky-300' };
  }
  if (clean.includes('CHEM') || clean.includes('GLUCOSE') || clean.includes('FBS') || clean.includes('LIPID') || clean.includes('CHOLESTEROL') || clean.includes('LIVER') || clean.includes('SGPT') || clean.includes('SGOT') || clean.includes('BUN') || clean.includes('CREAT') || clean.includes('URIC') || clean.includes('CMP')) {
    return { container: 'Gold / Red SST Gel Tube', matrix: 'Separated Serum', abbr: getExamAbbreviation(examName), temp: '+4°C', color: 'bg-rose-50 text-rose-800 border-rose-300' };
  }
  return { container: 'Primary Specimen Container', matrix: 'Biological Specimen', abbr: getExamAbbreviation(examName), temp: '+4°C', color: 'bg-slate-50 text-slate-800 border-slate-300' };
}

export function getSpecimenContainersForRequisition(exams: string[], sampleBarcode: string): SpecimenContainerItem[] {
  const safeBarcode = sampleBarcode || 'SMP-2026-AUTO';
  if (!exams || exams.length === 0) {
    return [{
      id: 'T1',
      tubeNumber: 1,
      tubeBarcode: `${safeBarcode}-T1`,
      containerName: 'Lavender Top Vacutainer (K2-EDTA)',
      shortContainer: 'Lavender Top',
      matrix: 'Whole Blood (EDTA)',
      categoryName: 'Hematology',
      exams: ['CBC WITH PLATELET COUNT'],
      examAbbrs: ['CBC'],
      primaryAbbr: 'CBC',
      temp: '+4°C',
      capColor: '#8b5cf6',
      dotBg: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
    }];
  }

  const hematologyExams: string[] = [];
  const urinalysisExams: string[] = [];
  const fecalysisExams: string[] = [];
  const sputumExams: string[] = [];
  const coagExams: string[] = [];
  const chemistryExams: string[] = [];
  const microExams: string[] = [];
  const otherExams: string[] = [];

  exams.forEach((exam) => {
    const clean = (exam || '').toUpperCase();
    if (
      clean.includes('CBC') ||
      clean.includes('HEMATOLOGY') ||
      clean.includes('PLATELET') ||
      clean.includes('BLOOD TYPING') ||
      clean.includes('ESR') ||
      clean.includes('RETICULOCYTE') ||
      clean.includes('MICROTAINER') ||
      clean.includes('CT/BT') ||
      clean.includes('PERIPHERAL BLOOD')
    ) {
      hematologyExams.push(exam);
    } else if (
      clean.includes('URIN') ||
      clean.includes('PREGNANCY TEST (URINE)') ||
      (clean.includes('PREGNANCY') && !clean.includes('SERUM')) ||
      clean.includes('HCG (URINE)')
    ) {
      urinalysisExams.push(exam);
    } else if (
      clean.includes('FECA') ||
      clean.includes('STOOL') ||
      clean.includes('FOBT') ||
      clean.includes('OCCULT') ||
      clean.includes('PARASITE') ||
      clean.includes('AMOEBA')
    ) {
      fecalysisExams.push(exam);
    } else if (
      clean.includes('SPUTUM') ||
      clean.includes('DSSM') ||
      clean.includes('AFB') ||
      clean.includes('TB CULTURE') ||
      clean.includes('DST') ||
      clean.includes('GENEXPERT') ||
      clean.includes('MYCOBACTER')
    ) {
      sputumExams.push(exam);
    } else if (
      clean.includes('PTT') ||
      clean.includes('PROTHROMBIN') ||
      clean.includes('COAGULATION') ||
      clean.includes('CITRATE') ||
      clean.includes('INR') ||
      clean.includes('D-DIMER') ||
      clean.includes('FIBRINOGEN')
    ) {
      coagExams.push(exam);
    } else if (
      clean.includes('CHEM') ||
      clean.includes('GLUCOSE') ||
      clean.includes('FBS') ||
      clean.includes('RBS') ||
      clean.includes('LIPID') ||
      clean.includes('CHOLESTEROL') ||
      clean.includes('LIVER') ||
      clean.includes('SGPT') ||
      clean.includes('ALT') ||
      clean.includes('SGOT') ||
      clean.includes('AST') ||
      clean.includes('BUN') ||
      clean.includes('UREA') ||
      clean.includes('CREAT') ||
      clean.includes('URIC') ||
      clean.includes('BUA') ||
      clean.includes('ELECTROLYTES') ||
      clean.includes('SODIUM') ||
      clean.includes('POTASSIUM') ||
      clean.includes('CHLORIDE') ||
      clean.includes('CALCIUM') ||
      clean.includes('MAGNESIUM') ||
      clean.includes('PROTEIN') ||
      clean.includes('ALBUMIN') ||
      clean.includes('BILIRUBIN') ||
      clean.includes('HBA1C') ||
      clean.includes('HGT') ||
      clean.includes('TSH') ||
      clean.includes('FT3') ||
      clean.includes('FT4') ||
      clean.includes('T3') ||
      clean.includes('T4') ||
      clean.includes('PSA') ||
      clean.includes('AFP') ||
      clean.includes('CEA') ||
      clean.includes('CA 125') ||
      clean.includes('CA 15-3') ||
      clean.includes('CA 19-9') ||
      clean.includes('HBSAG') ||
      clean.includes('HEPATITIS') ||
      clean.includes('ANTI-HBS') ||
      clean.includes('HBEAG') ||
      clean.includes('ANTI-HBE') ||
      clean.includes('ANTI-HBC') ||
      clean.includes('ANTI-HAV') ||
      clean.includes('ANTI-HCV') ||
      clean.includes('HIV') ||
      clean.includes('VDRL') ||
      clean.includes('RPR') ||
      clean.includes('SYPHILIS') ||
      clean.includes('DENGUE') ||
      clean.includes('PREGNANCY TEST (SERUM)')
    ) {
      chemistryExams.push(exam);
    } else if (
      clean.includes('KOH') ||
      clean.includes('GRAM STAIN') ||
      clean.includes('C/S') ||
      clean.includes('CULTURE & SENSITIVITY') ||
      clean.includes('CELL BLOCK') ||
      clean.includes('CYTOLOGY')
    ) {
      microExams.push(exam);
    } else {
      otherExams.push(exam);
    }
  });

  const containers: SpecimenContainerItem[] = [];
  let tubeIdx = 1;

  if (hematologyExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Lavender Top Tube (K2-EDTA)',
      shortContainer: 'Lavender Top',
      matrix: 'Whole Blood (EDTA)',
      categoryName: 'Hematology',
      exams: hematologyExams,
      examAbbrs: hematologyExams.map(getExamAbbreviation),
      primaryAbbr: 'CBC',
      temp: '+4°C',
      capColor: '#8b5cf6',
      dotBg: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
    });
    tubeIdx++;
  }

  if (chemistryExams.length > 0) {
    const abbrs = chemistryExams.map(getExamAbbreviation);
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Gold SST / Red Top Tube (Gel Separator)',
      shortContainer: 'Gold SST Gel',
      matrix: 'Separated Serum',
      categoryName: 'Clinical Chemistry & Serology',
      exams: chemistryExams,
      examAbbrs: abbrs,
      primaryAbbr: abbrs.length === 1 ? abbrs[0] : 'CHEM',
      temp: '+4°C',
      capColor: '#ef4444',
      dotBg: 'bg-rose-600',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
    });
    tubeIdx++;
  }

  if (coagExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Light Blue Top Tube (3.2% Sodium Citrate)',
      shortContainer: 'Blue Top Citrate',
      matrix: 'Citrated Plasma',
      categoryName: 'Coagulation',
      exams: coagExams,
      examAbbrs: coagExams.map(getExamAbbreviation),
      primaryAbbr: 'COAG',
      temp: '+4°C',
      capColor: '#0ea5e9',
      dotBg: 'bg-sky-600',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
    });
    tubeIdx++;
  }

  if (urinalysisExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Sterile Urine Specimen Cup (60mL)',
      shortContainer: 'Sterile Urine Cup',
      matrix: 'Clean Catch Urine',
      categoryName: 'Clinical Microscopy / Urinalysis',
      exams: urinalysisExams,
      examAbbrs: urinalysisExams.map(getExamAbbreviation),
      primaryAbbr: 'URINE',
      temp: '+4°C',
      capColor: '#f59e0b',
      dotBg: 'bg-amber-600',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    });
    tubeIdx++;
  }

  if (fecalysisExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Clean Stool Specimen Container',
      shortContainer: 'Stool Container',
      matrix: 'Fresh Feces Specimen',
      categoryName: 'Parasitology / Fecalysis',
      exams: fecalysisExams,
      examAbbrs: fecalysisExams.map(getExamAbbreviation),
      primaryAbbr: 'STOOL',
      temp: '+4°C',
      capColor: '#84cc16',
      dotBg: 'bg-lime-700',
      badgeColor: 'bg-lime-50 text-lime-800 border-lime-300',
    });
    tubeIdx++;
  }

  if (sputumExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Sterile Wide-Mouth Sputum Jar',
      shortContainer: 'Sputum Jar',
      matrix: 'Early Morning Sputum',
      categoryName: 'Mycobacteriology / TB Diagnostics',
      exams: sputumExams,
      examAbbrs: sputumExams.map(getExamAbbreviation),
      primaryAbbr: 'DSSM',
      temp: '+4°C',
      capColor: '#10b981',
      dotBg: 'bg-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    });
    tubeIdx++;
  }

  if (microExams.length > 0) {
    containers.push({
      id: `T${tubeIdx}`,
      tubeNumber: tubeIdx,
      tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
      containerName: 'Sterile Transport Medium / Swab Vial',
      shortContainer: 'Micro Vial / Swab',
      matrix: 'Clinical Swab / Aspirate',
      categoryName: 'Microbiology & Cytology',
      exams: microExams,
      examAbbrs: microExams.map(getExamAbbreviation),
      primaryAbbr: 'MICRO',
      temp: '+4°C',
      capColor: '#14b8a6',
      dotBg: 'bg-teal-600',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
    });
    tubeIdx++;
  }

  if (otherExams.length > 0) {
    otherExams.forEach((exam) => {
      const abbr = getExamAbbreviation(exam);
      containers.push({
        id: `T${tubeIdx}`,
        tubeNumber: tubeIdx,
        tubeBarcode: `${safeBarcode}-T${tubeIdx}`,
        containerName: 'Primary Specimen Container',
        shortContainer: 'Specimen Vial',
        matrix: 'Biological Specimen',
        categoryName: 'Diagnostic Laboratory',
        exams: [exam],
        examAbbrs: [abbr],
        primaryAbbr: abbr,
        temp: '+4°C',
        capColor: '#64748b',
        dotBg: 'bg-slate-600',
        badgeColor: 'bg-slate-50 text-slate-800 border-slate-300',
      });
      tubeIdx++;
    });
  }

  return containers.length > 0 ? containers : [{
    id: 'T1',
    tubeNumber: 1,
    tubeBarcode: `${safeBarcode}-T1`,
    containerName: 'Lavender Top Vacutainer (K2-EDTA)',
    shortContainer: 'Lavender Top',
    matrix: 'Whole Blood (EDTA)',
    categoryName: 'Hematology',
    exams: ['CBC WITH PLATELET COUNT'],
    examAbbrs: ['CBC'],
    primaryAbbr: 'CBC',
    temp: '+4°C',
    capColor: '#8b5cf6',
    dotBg: 'bg-purple-600',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
  }];
}

export function getIndividualTestContainers(exams: string[], sampleBarcode: string): SpecimenContainerItem[] {
  const safeBarcode = sampleBarcode || 'SMP-2026-AUTO';
  if (!exams || exams.length === 0) return getSpecimenContainersForRequisition([], safeBarcode);
  return exams.map((exam, idx) => {
    const info = getExamContainerInfo(exam);
    const abbr = getExamAbbreviation(exam);
    return {
      id: `T${idx + 1}`,
      tubeNumber: idx + 1,
      tubeBarcode: `${safeBarcode}-T${idx + 1}`,
      containerName: info.container,
      shortContainer: info.container.split(' ')[0],
      matrix: info.matrix,
      categoryName: 'Clinical Laboratory',
      exams: [exam],
      examAbbrs: [abbr],
      primaryAbbr: abbr,
      temp: info.temp,
      capColor: info.color.includes('purple') ? '#8b5cf6' : info.color.includes('amber') ? '#f59e0b' : info.color.includes('rose') ? '#ef4444' : info.color.includes('emerald') ? '#10b981' : info.color.includes('sky') ? '#0ea5e9' : '#64748b',
      dotBg: info.color.includes('purple') ? 'bg-purple-600' : info.color.includes('amber') ? 'bg-amber-600' : info.color.includes('rose') ? 'bg-rose-600' : info.color.includes('emerald') ? 'bg-emerald-600' : 'bg-slate-600',
      badgeColor: info.color,
    };
  });
}

export function formatExamListForSticker(exams: string[], abbrs: string[]): string {
  if (!exams || exams.length === 0) return 'GENERAL EXAMINATION';
  if (exams.length === 1) return exams[0];
  if (abbrs && abbrs.length > 0) {
    if (abbrs.length <= 4) return abbrs.join(', ');
    return `${abbrs.slice(0, 5).join(', ')} (+${exams.length - 5} more)`;
  }
  return exams.slice(0, 3).join(', ') + ` (+${exams.length - 3} more)`;
}

export const SampleDetailView: React.FC<SampleDetailViewProps> = ({
  sample,
  requisition,
  storedResults,
  storedMedTech,
  onBack,
  onEditSample,
  onDeleteSample: _onDeleteSample,
  onSelectProtocol: _onSelectProtocol,
  onNavigateToBox,
  allSamples = [],
  onNavigateToSample: _onNavigateToSample,
  onPrintLabel,
  onSaveResults,
  onOpenCoA,
  currentUserName = 'Dr. Katherine Zhang, MD',
  onReceiveSpecimen,
  onViewSlip,
  canAccession = true,
  canRecordResultsPickup = false,
  onMarkResultsPickedUp,
  canNotifyPatient = false,
  onNotifyResultsReady,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'results'>('details');
  const [cryoLabelOpen, setCryoLabelOpen] = useState(false);
  const [selectedContainerIndex, setSelectedContainerIndex] = useState<number>(0);
  const [labelGroupingMode, setLabelGroupingMode] = useState<'container' | 'individual'>('container');
  const [printAllMode, setPrintAllMode] = useState<boolean>(false);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [orderExpanded, setOrderExpanded] = useState(true);
  const [aliquotsExpanded, setAliquotsExpanded] = useState(true);

  const [generalRemarks, setGeneralRemarks] = useState('Results verified and cross-referenced with daily internal QC run.');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  // Must be declared before any conditional return (rules-of-hooks)
  const [localExamResults, setLocalExamResults] = useState<Record<string, ExamResultGroup>>({});
  /** When true, hide test rows with no entered result (show examined tests only). */
  const [examinedResultsOnly, setExaminedResultsOnly] = useState(false);
  const dirtyRef = useRef(false);
  const hydratedFor = useRef('');
  const onSaveRef = useRef(onSaveResults);
  onSaveRef.current = onSaveResults;

  // Helper function to calculate flag (hoisted for useEffect)
  function calculateFlag(param?: ParameterDef, valStr?: string): ResultParamValue['flag'] {
    if (!param) return 'NORMAL';
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

  // Initialize local results from the database copy once. Later saves must not wipe what is being typed.
  useEffect(() => {
    if (!sample) {
      setLocalExamResults({});
      hydratedFor.current = '';
      dirtyRef.current = false;
      return;
    }

    const token = `${sample.id}|${requisition?.id || ''}`;
    if (!hydratedFor.current.startsWith(token)) dirtyRef.current = false;
    if (dirtyRef.current && hydratedFor.current.startsWith(token)) return;

    const hasStored = !!(storedResults && Object.keys(storedResults).length > 0);
    if (hydratedFor.current === `${token}:stored`) return;
    if (!hasStored && hydratedFor.current === token) return;
    hydratedFor.current = hasStored ? `${token}:stored` : token;

    if (storedMedTech?.remarks) setGeneralRemarks(storedMedTech.remarks);

    if (hasStored && storedResults) {
      const withExaminers: Record<string, ExamResultGroup> = {};
      Object.entries(storedResults).forEach(([key, group]) => {
        const template = getTemplateForExamination(group.examName || key);
        const paramsList = Array.isArray(template?.parameters) ? template.parameters : [];
        const mergedParams = { ...group.parameters };
        paramsList.forEach((p) => {
          if (!p || mergedParams[p.id]) return;
          mergedParams[p.id] = {
            paramId: p.id,
            paramCode: p.code || 'PARAM',
            paramName: p.name || 'Parameter',
            unit: p.unit || '',
            value: p.defaultValue || '',
            flag: calculateFlag(p, p.defaultValue || ''),
            isCalculated: p.dataType === 'CALCULATED',
          };
        });
        withExaminers[key] = {
          ...group,
          parameters: mergedParams,
          examiners:
            group.examiners ||
            DEFAULT_EXAMINERS(currentUserName || 'Dr. Katherine Zhang, MD, FPSP'),
        };
      });

      const rawExamsForStore = requisition?.kindOfExamination && requisition.kindOfExamination.length > 0
        ? requisition.kindOfExamination
        : requisition?.selectedTestNames && requisition.selectedTestNames.length > 0
        ? requisition.selectedTestNames
        : sample.assignedTests && sample.assignedTests.length > 0
        ? sample.assignedTests
        : [];
      rawExamsForStore.filter(Boolean).forEach((examName, idx) => {
        const template = getTemplateForExamination(examName);
        if (!template) return;
        const examKey = template.examCode || `EXAM-${idx}`;
        if (!isInHouseResultExam(examName, examKey)) return;
        if (withExaminers[examKey]) return;
        const paramMap: Record<string, ResultParamValue> = {};
        (template.parameters || []).forEach((p) => {
          if (!p) return;
          const val = p.defaultValue || '';
          paramMap[p.id] = {
            paramId: p.id,
            paramCode: p.code || 'PARAM',
            paramName: p.name || 'Parameter',
            unit: p.unit || '',
            value: val,
            flag: calculateFlag(p, val),
            isCalculated: p.dataType === 'CALCULATED',
          };
        });
        withExaminers[examKey] = {
          examCode: examKey,
          examName: template.examName || examName,
          category: template.category || 'CLINICAL LABORATORY',
          methodology: template.methodology || 'Standard Clinical Assay',
          specimenType: template.specimenType || 'Biological Specimen',
          parameters: paramMap,
          remarks: '',
          examiners: DEFAULT_EXAMINERS(currentUserName || 'Dr. Katherine Zhang, MD, FPSP'),
          status: sample.status === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS',
        };
      });
      setLocalExamResults(withExaminers);
      return;
    }

    const rawExams = requisition?.kindOfExamination && requisition.kindOfExamination.length > 0
      ? requisition.kindOfExamination
      : requisition?.selectedTestNames && requisition.selectedTestNames.length > 0
      ? requisition.selectedTestNames
      : sample.assignedTests && sample.assignedTests.length > 0
      ? sample.assignedTests
      : ['CBC WITH PLATELET COUNT'];

    const requestedExams = rawExams.filter(Boolean);
    const initialGroups: Record<string, ExamResultGroup> = {};

    requestedExams.forEach((examName, idx) => {
      const template: ExaminationTemplate = getTemplateForExamination(examName);
      if (!template) return;
      const examKey = template.examCode || `EXAM-${idx}`;
      if (!isInHouseResultExam(examName, examKey)) return;
      const paramMap: Record<string, ResultParamValue> = {};
      const paramsList = Array.isArray(template.parameters) ? template.parameters : [];

      paramsList.forEach((p) => {
        if (!p) return;
        const val = p.defaultValue || '';
        const flag = calculateFlag(p, val);
        paramMap[p.id] = {
          paramId: p.id,
          paramCode: p.code || 'PARAM',
          paramName: p.name || 'Parameter',
          unit: p.unit || '',
          value: val,
          flag,
          isCalculated: p.dataType === 'CALCULATED',
        };
      });
      const storedGroup = storedResults?.[examKey];
      initialGroups[examKey] = {
        examCode: template.examCode || `EXAM-${idx}`,
        examName: template.examName || examName,
        category: template.category || 'CLINICAL LABORATORY',
        methodology: template.methodology || 'Standard Clinical Assay',
        specimenType: template.specimenType || 'Biological Specimen',
        parameters: storedGroup?.parameters || paramMap,
        remarks: storedGroup?.remarks || 'Direct on-page analytical verification.',
        examiners:
          storedGroup?.examiners ||
          DEFAULT_EXAMINERS(currentUserName || 'Dr. Katherine Zhang, MD, FPSP'),
        status: sample.status === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS',
      };
    });

    setLocalExamResults(initialGroups);
  }, [sample, requisition, storedResults, storedMedTech, currentUserName]);

  useEffect(() => {
    if (!sample || !dirtyRef.current) return;
    if (Object.keys(localExamResults).length === 0) return;
    const effectiveReqId = requisition?.id || sample.id;
    const groups = Object.values(localExamResults);
    const summaryEx =
      groups.find((g) => g.examiners?.pathologistName)?.examiners ||
      groups[0]?.examiners ||
      DEFAULT_EXAMINERS(currentUserName);
    const payload = {
      labTechName: summaryEx.labTechName,
      rmtName: summaryEx.rmtName,
      rmtLicense: summaryEx.rmtLicense,
      pathologistName: summaryEx.pathologistName,
      pathologistLicense: summaryEx.pathologistLicense,
      remarks: generalRemarks,
    };
    const timer = window.setTimeout(() => {
      onSaveRef.current?.(effectiveReqId, localExamResults, false, payload, { silent: true });
    }, 700);
    return () => {
      window.clearTimeout(timer);
      if (dirtyRef.current) {
        onSaveRef.current?.(effectiveReqId, localExamResults, false, payload, { silent: true });
      }
    };
  }, [localExamResults, generalRemarks, sample, requisition, currentUserName]);

  if (!sample) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <FlaskConical className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">No Sample Selected</h2>
        <p className="text-xs text-slate-500">Please select a case or specimen from the Submissions queue.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#0176d3] text-white font-bold text-xs rounded-lg hover:bg-[#0060b2] transition-colors cursor-pointer"
          >
            Return to Submissions
          </button>
        )}
      </div>
    );
  }

  // Guard: If requisition has not yet been received and accessioned by laboratory staff
  const isUnreceived = requisition?.status === 'SUBMITTED' || (sample as any)?.status === 'SUBMITTED';
  if (isUnreceived) {
    const rawPatient = requisition?.patientOrSubjectName || sample.patientOrSourceName || 'Unknown Patient';
    const patientName = rawPatient.replace(/\s*\([^)]*\)/g, '');
    const caseNo = requisition?.caseNo || requisition?.externalRef || sample.externalId || 'CASE-PENDING';
    const reqNo = requisition?.requisitionNumber || 'REQ-PENDING';
    const exams = requisition?.kindOfExamination || requisition?.selectedTestNames || sample.assignedTests || [];

    return (
      <div className="lims-page-shell text-slate-900">
        {/* Pipeline Chevron Bar showing Stage 2 is pending */}
        <div className="print:hidden">
          <LifecycleChevronBar
            currentStage="Specimen Accessioning"
            entityType="Sample"
          />
        </div>

        {/* Accession Guard Card */}
        <div className="bg-white border border-amber-200 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Stage 2 · Pending Laboratory Receiving
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Specimen not yet received by laboratory
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Requisition <span className="font-semibold tabular-nums text-slate-900">{reqNo}</span> for{' '}
              <strong className="text-slate-900">{patientName}</strong> (
              <span className="font-semibold tabular-nums text-slate-800">{caseNo}</span>) has been submitted, but the physical specimen has{' '}
              <strong className="text-amber-800">not yet been received and accessioned</strong> into the laboratory.
            </p>
          </div>

          {/* Requisition Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Patient Category:</span>
              <span className="font-bold text-slate-800">[{requisition?.patientCategory || sample.patientCategory || 'OPD'}]</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Priority:</span>
              <span className="font-bold text-slate-800">{requisition?.priority || sample.priority || 'ROUTINE'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Requested Examinations:</span>
              <span className="font-bold text-slate-800 text-right max-w-[260px] truncate">
                {exams.join(', ') || 'None specified'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 italic">
              Specimen container verification, cryo-label generation, and analytical result entry are locked until laboratory personnel receive and verify the specimen.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onReceiveSpecimen && requisition && canAccession !== false && (
              <button
                type="button"
                onClick={() => onReceiveSpecimen(requisition)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2e844a] hover:bg-[#26713f] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Receive & Accession Specimen Now</span>
              </button>
            )}

            {onViewSlip && requisition && (
              <button
                type="button"
                onClick={() => onViewSlip(requisition)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>View Requisition Slip</span>
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Submissions Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Derive clean patient name and category safely
  const rawPatientName = sample.patientOrSourceName || 'Unknown Patient';
  const patientDisplayName = requisition?.patientOrSubjectName || rawPatientName.replace(/\s*\([^)]*\)/g, '');
  const patientCategory = requisition?.patientCategory || sample.patientCategory || 'OPD';
  const caseNumber = requisition?.caseNo || requisition?.externalRef || sample.externalId || 'CASE-2026-AUTO';
  const reqNumber = requisition?.requisitionNumber || sample.barcode || 'REQ-AUTO';
  const physician = requisition?.orderingPhysicianOrPI || 'Dr. PTSI Clinic, MD';

  // Calculate days since collection accurately
  const collectionDateStr = sample.collectionDate?.split(' ')?.[0] || requisition?.requestDate || new Date().toISOString().split('T')[0];
  const collectionTime = new Date(collectionDateStr).getTime();
  const nowTime = new Date().getTime();
  const diffDays = Math.max(0, Math.floor((nowTime - (isNaN(collectionTime) ? nowTime : collectionTime)) / (1000 * 3600 * 24)));
  const daysSinceCollectionText = diffDays === 0 ? '0 (Collected Today)' : `${diffDays} day${diffDays > 1 ? 's' : ''}`;

  // Get requested examinations list safely
  const rawExams = requisition?.kindOfExamination && requisition.kindOfExamination.length > 0
    ? requisition.kindOfExamination
    : requisition?.selectedTestNames && requisition.selectedTestNames.length > 0
    ? requisition.selectedTestNames
    : sample.assignedTests && sample.assignedTests.length > 0
    ? sample.assignedTests
    : ['CBC WITH PLATELET COUNT'];
  
  const requestedExams = rawExams.filter(Boolean);

  const sendOutExams = requestedExams.filter((examName) => {
    const template = getTemplateForExamination(examName);
    const code = template?.examCode;
    return !isInHouseResultExam(examName, code);
  });

  const inHouseExams = requestedExams.filter((examName) => {
    const template = getTemplateForExamination(examName);
    const code = template?.examCode;
    return isInHouseResultExam(examName, code);
  });

  /** One panel per assigned result form. Exams that share a form (e.g. CBC + CBC Microtainer → RF-06) are entered once. */
  const resultPanels = (() => {
    type Member = { examName: string; examCode: string; template: ExaminationTemplate };
    type Panel = {
      panelKey: string;
      form: ReturnType<typeof getResultFormForExam>;
      members: Member[];
    };
    const panels: Panel[] = [];
    const byForm = new Map<string, Panel>();
    requestedExams.forEach((examName, idx) => {
      const template = getTemplateForExamination(examName);
      if (!template) return;
      const examCode = template.examCode || `EXAM-${idx}`;
      if (!isInHouseResultExam(examName, examCode)) return;
      const form = resolveEntryForm(examName, examCode, requisition?.patientGender);
      const member: Member = { examName, examCode, template };
      if (form) {
        const existing = byForm.get(form.id);
        if (existing) {
          if (!existing.members.some((m) => m.examCode === examCode)) {
            existing.members.push(member);
          }
          return;
        }
        const panel: Panel = { panelKey: form.id, form, members: [member] };
        byForm.set(form.id, panel);
        panels.push(panel);
        return;
      }
      panels.push({
        panelKey: `${examCode}-${idx}`,
        form: undefined,
        members: [member],
      });
    });
    return panels;
  })();

  // Current lifecycle stage based on status
  const currentStage = sample.status === 'APPROVED' || requisition?.status === 'COMPLETED'
    ? 'Certificate of Analysis Release'
    : sample.status === 'TESTING' || requisition?.status === 'IN_TESTING'
    ? 'Testing Completed'
    : 'Physical Sample Intake';

  const isCompleted =
    sample.status === 'APPROVED' || requisition?.status === 'COMPLETED';
  const isInTesting =
    sample.status === 'TESTING' || requisition?.status === 'IN_TESTING';
  const workflowStatusLabel = isCompleted
    ? 'Completed'
    : isInTesting
      ? 'In testing'
      : requisition?.status === 'RECEIVED'
        ? 'Received'
        : requisition?.status === 'SUBMITTED'
          ? 'Submitted'
          : String(sample.status || 'Accessioned').replace(/_/g, ' ');
  const workflowStatusTone = isCompleted
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : isInTesting
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : requisition?.status === 'RECEIVED'
        ? 'bg-violet-50 text-violet-800 border-violet-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';
  const workflowAccent = isCompleted
    ? 'bg-emerald-600'
    : isInTesting
      ? 'bg-[#0176d3]'
      : requisition?.status === 'RECEIVED'
        ? 'bg-violet-600'
        : 'bg-slate-400';

  // Handle direct inline parameter change on the page
  const handleInlineParamChange = (examKey: string, paramId: string, newValue: string) => {
    dirtyRef.current = true;
    setLocalExamResults((prev) => {
      const group = prev[examKey];
      if (!group) return prev;

      const template = getTemplateForExamination(group.examName || examKey);
      const paramsList = Array.isArray(template?.parameters) ? template.parameters : [];
      const paramDef = paramsList.find((p) => p.id === paramId);

      const updatedParams = { ...group.parameters };
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

      // Auto-calculate formulas
      // 1. CBC: HCT = RBC * MCV / 10
      if (group.examCode === '1010' || group.examName?.includes('CBC')) {
        const rbcVal = parseFloat(updatedParams['p_rbc']?.value || '0');
        const mcvVal = parseFloat(updatedParams['p_mcv']?.value || '0');
        if (rbcVal > 0 && mcvVal > 0 && updatedParams['p_hct']) {
          const calcHct = ((rbcVal * mcvVal) / 10).toFixed(2);
          const hctDef = paramsList.find((p) => p.id === 'p_hct');
          updatedParams['p_hct'] = {
            ...updatedParams['p_hct'],
            value: calcHct,
            flag: hctDef ? calculateFlag(hctDef, calcHct) : 'NORMAL',
          };
        }
      }

      // 2. Lipid Profile: LDL = Total - HDL - (Trig / 5)
      if (group.examCode === '1015' || group.examName?.includes('LIPID')) {
        const tchol = parseFloat(updatedParams['p_tchol']?.value || '0');
        const hdl = parseFloat(updatedParams['p_hdl']?.value || '0');
        const trig = parseFloat(updatedParams['p_trig']?.value || '0');
        if (tchol > 0 && hdl > 0 && trig > 0 && updatedParams['p_ldl']) {
          const calcLdl = Math.max(0, tchol - hdl - (trig / 5)).toFixed(2);
          const ldlDef = paramsList.find((p) => p.id === 'p_ldl');
          updatedParams['p_ldl'] = {
            ...updatedParams['p_ldl'],
            value: calcLdl,
            flag: ldlDef ? calculateFlag(ldlDef, calcLdl) : 'NORMAL',
          };
        }
      }

      return {
        ...prev,
        [examKey]: {
          ...group,
          parameters: updatedParams,
        },
      };
    });
  };

  // Quick Action: Fill Normal Baseline on this page
  const handleFillNormalBaseline = () => {
    dirtyRef.current = true;
    setLocalExamResults((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const group = updated[key];
        if (!group) return;
        const template = getTemplateForExamination(group.examName || key);
        if (!template) return;
        const paramsList = Array.isArray(template.parameters) ? template.parameters : [];
        const params = { ...group.parameters };

        paramsList.forEach((p) => {
          if (!p) return;
          const defaultVal = baselineParameterValue(p);
          params[p.id] = {
            paramId: p.id,
            paramCode: p.code || 'PARAM',
            paramName: p.name || 'Parameter',
            unit: p.unit || '',
            value: defaultVal,
            flag: calculateFlag(p, defaultVal),
            isCalculated: p.dataType === 'CALCULATED',
          };
        });

        updated[key] = { ...group, parameters: params };
      });
      return updated;
    });

    setSaveToast('Populated normal reference baselines across all tests.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Quick Action: Simulate Live Instrument Ingestion on this page
  const handleSimulateLiveIngestion = () => {
    dirtyRef.current = true;
    setLocalExamResults((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const group = updated[key];
        if (!group) return;
        const template = getTemplateForExamination(group.examName || key);
        if (!template) return;
        const paramsList = Array.isArray(template.parameters) ? template.parameters : [];
        const params = { ...group.parameters };

        paramsList.forEach((p) => {
          if (!p) return;
          if (p.dataType === 'CALCULATED') return;
          const simulated = simulateParameterValue(p);
          if (!simulated) return;
          params[p.id] = {
            paramId: p.id,
            paramCode: p.code || 'PARAM',
            paramName: p.name || 'Parameter',
            unit: p.unit || '',
            value: simulated,
            flag: calculateFlag(p, simulated),
            isCalculated: false,
          };
        });

        updated[key] = { ...group, parameters: params };
      });
      return updated;
    });

    setSaveToast('Ingested live telemetry packets from Sysmex XN-1000 & Cobas 6000.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const updateExamExaminers = (examKey: string, patch: Partial<ExamExaminers>) => {
    dirtyRef.current = true;
    setLocalExamResults((prev) => {
      const group = prev[examKey];
      if (!group) return prev;
      const base = group.examiners || DEFAULT_EXAMINERS(currentUserName);
      return {
        ...prev,
        [examKey]: { ...group, examiners: { ...base, ...patch } },
      };
    });
  };

  const applyExaminersToAllExams = (sourceKey: string) => {
    dirtyRef.current = true;
    const source =
      localExamResults[sourceKey]?.examiners || DEFAULT_EXAMINERS(currentUserName);
    setLocalExamResults((prev) => {
      const next: Record<string, ExamResultGroup> = {};
      Object.keys(prev).forEach((key) => {
        next[key] = { ...prev[key], examiners: { ...source } };
      });
      return next;
    });
  };

  // Save Direct On-Page Handler — request summary uses first exam with a pathologist name
  const handleDirectSave = (isFinalize: boolean) => {
    const effectiveReqId = requisition?.id || sample.id;
    const groups = Object.values(localExamResults);
    const summaryEx =
      groups.find((g) => g.examiners?.pathologistName)?.examiners ||
      groups[0]?.examiners ||
      DEFAULT_EXAMINERS(currentUserName);

    if (onSaveResults) {
      onSaveResults(effectiveReqId, localExamResults, isFinalize, {
        labTechName: summaryEx.labTechName,
        rmtName: summaryEx.rmtName,
        rmtLicense: summaryEx.rmtLicense,
        pathologistName: summaryEx.pathologistName,
        pathologistLicense: summaryEx.pathologistLicense,
        remarks: generalRemarks,
      });
    }

    setSaveToast(
      isFinalize
        ? '✓ Results officially completed & validated on this page!'
        : '✓ Saved draft results in-testing on this page.'
    );
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="lims-page-shell text-slate-900">
      
      {/* 1. Lifecycle Chevron Stage Bar */}
      <div className="print:hidden">
        <LifecycleChevronBar
          currentStage={currentStage}
          entityType="Sample"
          onCompleteStage={() => setActiveTab('results')}
        />
      </div>

      {/* 2. Record Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden print:hidden">
        <div className={`h-1 ${workflowAccent}`} aria-hidden />
        <div className="px-4 sm:px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-200 transition-colors cursor-pointer shrink-0"
                title="Back to Submissions Portal"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#c5daf8] flex items-center justify-center text-[#0176d3] shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Accessioned diagnostic specimen
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${workflowStatusTone}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden />
                  {workflowStatusLabel}
                </span>
                {isCompleted && requisition ? (
                  isResultsPickedUp(requisition) ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-slate-100 text-slate-700 border-slate-200"
                      title={
                        requisition.resultsPickedUpBy
                          ? `Picked up by ${requisition.resultsPickedUpBy}${formatResultsPickupWhen(requisition.resultsPickedUpAt) ? ` · ${formatResultsPickupWhen(requisition.resultsPickedUpAt)}` : ''}`
                          : formatResultsPickupWhen(requisition.resultsPickedUpAt) || 'Picked up'
                      }
                    >
                      Picked up
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-violet-50 text-violet-900 border-violet-200">
                      Awaiting pickup
                    </span>
                  )
                ) : null}
                {isCompleted && requisition?.resultsReadySmsSentAt ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-sky-50 text-sky-800 border-sky-200"
                    title={`SMS sent ${formatResultsPickupWhen(requisition.resultsReadySmsSentAt) || ''}`}
                  >
                    SMS sent
                  </span>
                ) : null}
                {isCompleted && requisition?.resultsReadyEmailSentAt ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-sky-50 text-sky-800 border-sky-200"
                    title={`Email sent ${formatResultsPickupWhen(requisition.resultsReadyEmailSentAt) || ''}`}
                  >
                    Email sent
                  </span>
                ) : null}
              </div>

              <h1 className="text-xl sm:text-[1.35rem] font-semibold text-slate-900 tracking-tight mt-1 leading-tight">
                {patientDisplayName}
              </h1>

              <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <dt className="text-slate-500 shrink-0">Case</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums truncate">{caseNumber}</dd>
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <dt className="text-slate-500 shrink-0">Requisition</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums truncate">{reqNumber}</dd>
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <dt className="text-slate-500 shrink-0">Barcode</dt>
                  <dd className="font-semibold text-[#0176d3] tabular-nums truncate">{sample.barcode}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-slate-500 shrink-0">Category</dt>
                  <dd className="font-semibold text-slate-900">{patientCategory}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:pl-5 lg:border-l lg:border-slate-100">
            {activeTab !== 'results' ? (
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                title="Edit analytical results directly on this page"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Enter results</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleDirectSave(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  title="Save draft results directly on this page"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectSave(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  title="Complete and validate results directly on this page"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Complete</span>
                </button>
              </>
            )}

            {isCompleted && onOpenCoA && (
              <button
                type="button"
                onClick={() => onOpenCoA(sample)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                title="View and print official result forms"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print results</span>
              </button>
            )}

            {isCompleted &&
              requisition &&
              canNotifyPatient &&
              onNotifyResultsReady && (
                <button
                  type="button"
                  onClick={() => onNotifyResultsReady(requisition)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100 transition-colors cursor-pointer"
                  title="Review SMS/email preview and send pickup alert"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <Mail className="w-3.5 h-3.5 opacity-70" />
                  <span>Notify patient</span>
                </button>
              )}

            {isCompleted &&
              requisition &&
              canRecordResultsPickup &&
              onMarkResultsPickedUp && (
                <button
                  type="button"
                  onClick={() =>
                    onMarkResultsPickedUp(requisition, !isResultsPickedUp(requisition))
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    isResultsPickedUp(requisition)
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100'
                  }`}
                  title={
                    isResultsPickedUp(requisition)
                      ? 'Review and clear pickup record'
                      : 'Review release checklist and record patient pickup'
                  }
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>{isResultsPickedUp(requisition) ? 'Undo pickup' : 'Mark picked up'}</span>
                </button>
              )}

            <button
              type="button"
              onClick={() => {
                setCryoLabelOpen(true);
                onPrintLabel?.(sample);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cryo label</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 3. Main workspace panel */}
      <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden print:hidden">
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-2 sm:px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'text-[#0176d3] border-[#0176d3] bg-white'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Patient &amp; specimen details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`py-3 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'results'
                ? 'text-[#0176d3] border-[#0176d3] bg-white'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Analytical results
            {inHouseExams.length > 0 ? (
              <span className="ml-1.5 text-[11px] font-semibold text-slate-400 tabular-nums">
                ({inHouseExams.length})
              </span>
            ) : null}
          </button>
        </div>

      {/* 4. Tab 1: DETAILS */}
      {activeTab === 'details' && (
        <div className="p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 print:hidden">
          
          {/* Left Column (8 of 12 = 66%) */}
          <div className="lg:col-span-8 space-y-4">
            
            <PanelSection
              title="Patient demographics & specimen verification"
              icon={<Info className="w-4 h-4 text-[#0176d3] shrink-0" />}
              expanded={infoExpanded}
              onToggle={() => setInfoExpanded(!infoExpanded)}
            >
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <DetailField label="Patient full name" value={patientDisplayName} />
                <DetailField label="Patient category" value={patientCategory} />
                <DetailField label="Case number" value={caseNumber} />
                <DetailField label="Requisition number" value={reqNumber} />
                <DetailField
                  label="Age and gender"
                  value={`${requisition?.patientAge || 35} yrs · ${requisition?.patientGender || 'Male'}`}
                />
                <DetailField label="Civil status" value={requisition?.civilStatus || 'Single'} />
                <DetailField
                  label="Mobile (SMS)"
                  value={requisition?.patientPhone?.trim() || '—'}
                />
                <DetailField
                  label="Email"
                  value={requisition?.patientEmail?.trim() || '—'}
                />
                <DetailField label="Sample barcode" value={sample.barcode} emphasize="accent" />
                <DetailField label="Specimen type" value={sample.sampleType} />
                <DetailField label="Matrix / preservative" value={sample.matrix} />
                <DetailField
                  label="Tubes / aliquots"
                  value={`${sample.aliquotCount || 1} tube${(sample.aliquotCount || 1) === 1 ? '' : 's'}`}
                />
                <DetailField label="Date of collection" value={collectionDateStr} />
                <DetailField label="Days since collection" value={daysSinceCollectionText} />
              </div>
            </PanelSection>



          </div>

          {/* Right Column (4 of 12 = 34%) */}
          <div className="lg:col-span-4 space-y-4">
            
            <PanelSection
              title="Requested examinations"
              icon={<FileText className="w-4 h-4 text-[#0176d3] shrink-0" />}
              expanded={orderExpanded}
              onToggle={() => setOrderExpanded(!orderExpanded)}
              count={requestedExams.length}
            >
              <div className="p-4 space-y-3">
                <ul className="space-y-2">
                  {requestedExams.map((exam, idx) => {
                    const tmpl = getTemplateForExamination(exam);
                    const code = tmpl?.examCode;
                    const sendOut = !isInHouseResultExam(exam, code);
                    return (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-md border border-slate-200 bg-slate-50/80"
                    >
                      <span className="text-sm font-medium text-slate-800 leading-snug">{exam}</span>
                      {sendOut ? (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0 text-right max-w-[48%]"
                          title={`Referred to ${sendOutPartnerLabel(exam, code)}`}
                        >
                          Send out
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef4ff] text-[#0176d3] border border-[#c5daf8] shrink-0">
                          In-house
                        </span>
                      )}
                    </li>
                    );
                  })}
                </ul>

                <dl className="pt-3 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Requesting physician</dt>
                    <dd className="font-semibold text-slate-900 text-right">{physician}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Official receipt</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums text-right">
                      {requisition?.orNumber || 'N/A'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Charge slip</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums text-right">
                      {requisition?.chargeSlipNumber || 'N/A'}
                    </dd>
                  </div>
                </dl>
                {requisition?.clinicalNotes ? (
                  <p className="text-xs text-slate-600 italic border-t border-slate-100 pt-3 leading-relaxed">
                    {requisition.clinicalNotes}
                  </p>
                ) : null}
              </div>
            </PanelSection>

            {/* Widget 2: Specimen Aliquots & Containers */}
            {(() => {
              const specimenContainers = getSpecimenContainersForRequisition(requestedExams, sample.barcode);
              return (
                <PanelSection
                  title="Accessioned specimen containers"
                  icon={<Layers className="w-4 h-4 text-emerald-600 shrink-0" />}
                  expanded={aliquotsExpanded}
                  onToggle={() => setAliquotsExpanded(!aliquotsExpanded)}
                  count={specimenContainers.length}
                >
                    <div className="p-3 space-y-2">
                      {specimenContainers.map((container, idx) => (
                        <div
                          key={idx}
                          className="rounded-md border border-slate-200 bg-white overflow-hidden"
                        >
                          <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80">
                            <span className="font-semibold text-[#0176d3] tabular-nums flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                                style={{ backgroundColor: container.capColor }}
                                aria-hidden
                              />
                              <span className="truncate">{container.tubeBarcode}</span>
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              {container.temp}
                            </span>
                          </div>
                          <div className="px-3 py-2.5 space-y-1.5">
                            <p className="text-xs font-medium text-slate-800 leading-snug">
                              {container.containerName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <div>
                                <span className="text-slate-500">Matrix</span>
                                <p className="font-medium text-slate-800 truncate">{container.matrix}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Container</span>
                                <p className="font-medium text-slate-800 truncate">{container.shortContainer}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </PanelSection>
              );
            })()}

          </div>

        </div>
      )}

      {/* 5. Tab 2: ANALYTICAL RESULTS & DIRECT ON-PAGE EDITOR */}
      {activeTab === 'results' && (
        <div className="p-4 lg:p-5 space-y-6 print:hidden">
          
          {/* Action & Automation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  Analytical results
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${workflowStatusTone}`}
                >
                  {workflowStatusLabel}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {resultPanels.length > 0 ? (
                  <>
                    In-house parameters for {patientDisplayName}
                    {inHouseExams.length > 0 ? (
                      <>
                        {' '}
                        (<span className="text-slate-800">{inHouseExams.join(', ')}</span>)
                      </>
                    ) : null}
                    . Edit values in the tables below.
                  </>
                ) : (
                  <>
                    No in-house result entry is required for {patientDisplayName}. Send-out examinations are
                    referred to an external laboratory.
                  </>
                )}
              </p>
            </div>

            {resultPanels.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setExaminedResultsOnly((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-2xs transition-all cursor-pointer ${
                  examinedResultsOnly
                    ? 'bg-[#0176d3]/10 border-[#0176d3]/40 text-[#014486]'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
                title={
                  examinedResultsOnly
                    ? 'Showing tests with results only — click to show all parameters'
                    : 'Showing all parameters — click to show examined tests only'
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{examinedResultsOnly ? 'Examined only' : 'Show all tests'}</span>
              </button>
              <button
                type="button"
                onClick={handleFillNormalBaseline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Fill normal physiological baselines directly on this page"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fill Normal Baseline</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateLiveIngestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Simulate telemetry packet stream from analyzer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Simulate Ingestion</span>
              </button>
            </div>
            ) : null}
          </div>

          {sendOutExams.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                Send-out examinations ({sendOutExams.length})
              </p>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                These tests are performed at a referral partner. Specimens are transferred externally; Lab-TIS
                does not capture analytical results here.
              </p>
              <ul className="text-xs space-y-1.5">
                {sendOutExams.map((exam) => {
                  const tmpl = getTemplateForExamination(exam);
                  const code = tmpl?.examCode;
                  return (
                    <li key={exam} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                      <span className="font-medium">{exam}</span>
                      <span className="text-amber-800">{sendOutPartnerLabel(exam, code)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* Render Direct On-Page Editable Examination Tables */}
          <div className="space-y-6">
            {resultPanels.length === 0 && sendOutExams.length === 0 ? (
              <p className="text-sm text-slate-600 py-6 text-center">No examinations are linked to this specimen.</p>
            ) : null}
            {resultPanels.map((panel) => {
              const primary = panel.members[0];
              if (!primary) return null;
              const tmpl = primary.template;
              const examKey = primary.examCode;
              const group =
                panel.members
                  .map((m) => localExamResults[m.examCode])
                  .find((g) => g) || localExamResults[examKey];
              const paramsList = Array.isArray(tmpl.parameters) ? tmpl.parameters : [];
              const resultForm = panel.form;
              const writeParam = (paramId: string, value: string) => {
                panel.members.forEach((m) =>
                  handleInlineParamChange(m.examCode, paramId, value)
                );
              };
              const readParam = (paramId: string) => {
                for (const m of panel.members) {
                  const value = localExamResults[m.examCode]?.parameters?.[paramId]?.value;
                  if (value != null && String(value).trim() !== '') return value;
                }
                return (
                  localExamResults[examKey]?.parameters?.[paramId]?.value ?? ''
                );
              };
              const useSimpleTestResult =
                Boolean(resultForm?.resultSections && resultForm.resultSections.length > 0);
              const isBloodTyping = resultForm?.layoutStyle === 'blood-typing';
              const isPregnancy = resultForm?.layoutStyle === 'pregnancy';
              const isNtpRequest = resultForm?.layoutStyle === 'ntp-request';
              const useFlatAnalytes =
                Boolean(resultForm?.analytes && resultForm.analytes.length > 0) &&
                !useSimpleTestResult &&
                !isBloodTyping &&
                !isPregnancy;
              const panelExamCodes = panel.members.map((m) => m.examCode);
              const filterFormRow = (row: { id: string; examCode?: string; examOptions?: string[]; examChoiceId?: string }) => {
                if (!resultFormRowAppliesToExamCodes(row, panelExamCodes)) return false;
                if (!examinedResultsOnly) return true;
                return isResultFormRowExamined(row, readParam);
              };

              const renderResultInput = (param: ParameterDef, currentValue: string) => {
                if (param.dataType === 'SELECT' && param.options) {
                  return (
                    <select
                      value={currentValue}
                      onChange={(e) => writeParam(param.id, e.target.value)}
                      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                    >
                      <option value="">—</option>
                      {param.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  );
                }
                return (
                  <input
                    type={param.dataType === 'NUMERIC' ? 'number' : 'text'}
                    step={param.dataType === 'NUMERIC' ? 'any' : undefined}
                    value={currentValue}
                    onChange={(e) => writeParam(param.id, e.target.value)}
                    placeholder=""
                    className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                  />
                );
              };

              return (
                <div key={panel.panelKey} className="border border-[#d8dde6] rounded-md overflow-hidden space-y-0">
                  <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {resultForm?.panelTitle || tmpl.examName}
                      </h4>
                      {resultForm ? (
                        <span className="px-2 py-0.5 rounded bg-[#0176d3]/10 text-[#0176d3] text-[10px] font-semibold tabular-nums border border-[#0176d3]/30">
                          {resultForm.shortName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-semibold tabular-nums border border-slate-300">
                          {tmpl.category}
                        </span>
                      )}
                      {resultForm?.genderVariant ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Ref: {resultForm.genderVariant}
                        </span>
                      ) : null}
                      {panel.members.length > 1 ? (
                        <span className="text-[10px] text-slate-500 truncate">
                          {panel.members.map((m) => m.examName).join(' · ')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isNtpRequest ? (
                    <div className="p-4 bg-white">
                      <NtpLabRequestForm
                        values={Object.fromEntries(NTP_FIELD_KEYS.map((key) => [key, readParam(key)]))}
                        onChange={writeParam}
                      />
                    </div>
                  ) : isBloodTyping ? (
                    <div className="py-8 px-4 text-center space-y-4 bg-white">
                      <div className="text-[11px] font-semibold tracking-[0.35em] text-slate-400 uppercase">
                        {resultForm?.panelTitle || 'HEMATOLOGY'}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xl font-bold text-slate-900">
                        <span className="text-slate-400" aria-hidden>&ldquo;</span>
                        {paramsList.map((param, pIdx) => {
                          const resItem = ({ value: readParam(param.id) });
                          const currentValue = resItem?.value ?? '';
                          const isRh = param.id === 'bt_rh' || param.code === 'RH';
                          return (
                            <React.Fragment key={param.id}>
                              {isRh ? (
                                <span className="font-bold tracking-wider">RH:</span>
                              ) : null}
                              <select
                                value={currentValue}
                                onChange={(e) => writeParam(param.id, e.target.value)}
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
                                <span className="text-slate-400" aria-hidden>&rdquo;</span>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ) : isPregnancy ? (
                    <div className="py-12 px-4 text-center bg-white">
                      <div className="text-xl font-bold tracking-wide text-slate-900">RESULT:</div>
                      <div className="text-base font-semibold text-slate-800 mt-1">(URINE)</div>
                      <div className="mt-8 flex justify-center">
                        {(paramsList[0] ? [paramsList[0]] : []).map((param) => {
                          const currentValue = readParam(param.id);
                          return (
                            <select
                              key={param.id}
                              value={currentValue}
                              onChange={(e) => writeParam(param.id, e.target.value)}
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
                          );
                        })}
                      </div>
                    </div>
                  ) : useSimpleTestResult && resultForm?.resultSections ? (
                    /* PTSI Form 3/4: TEST|RESULT · Form 6: TEST|RESULT|UNIT|REF */
                    (() => {
                      const visibleSectionRows = resultForm.resultSections.map((section) => ({
                        section,
                        rows: section.rows.filter(filterFormRow),
                      }));
                      const anyVisible = visibleSectionRows.some((s) => s.rows.length > 0);
                      if (examinedResultsOnly && !anyVisible) {
                        return (
                          <p className="px-4 py-6 text-sm text-slate-500 text-center bg-white border-t border-slate-200">
                            No examined tests on this form yet. Turn off{' '}
                            <span className="font-semibold">Examined only</span> to enter results, or fill
                            values on another examination tab.
                          </p>
                        );
                      }
                      return (
                    <div className="lims-result-form-table">
                      {anyVisible ? (
                      resultForm.tableColumns === 'test-result-unit-ref' ? (
                        <div className="lims-rf-grid-head grid grid-cols-12 bg-slate-100 text-xs font-semibold text-slate-600">
                          <div className="col-span-4 px-4 py-2">Test</div>
                          <div className="col-span-3 px-4 py-2">Result</div>
                          <div className="col-span-2 px-4 py-2">Unit</div>
                          <div className="col-span-3 px-4 py-2">Ref. Range</div>
                        </div>
                      ) : (
                        <div className="lims-rf-grid-head grid grid-cols-2 bg-slate-100 text-xs font-semibold text-slate-600">
                          <div className="px-4 py-2">
                            {resultForm.testColumnLabel || 'Test'}
                          </div>
                          <div className="px-4 py-2">{resultForm.resultColumnLabel || 'Result'}</div>
                        </div>
                      )
                      ) : null}
                      {visibleSectionRows.map(({ section, rows: sectionRows }) => {
                        if (sectionRows.length === 0) return null;
                        return (
                        <div key={section.id}>
                          {section.title ? (
                            <div className="lims-rf-section-label px-4 py-1.5 bg-slate-50 text-[11px] font-bold uppercase text-slate-800 tracking-wide">
                              {section.title}
                            </div>
                          ) : null}
                          {sectionRows.map((row) => {
                            const fromTemplate = paramsList.find((p) => p.id === row.id);
                            const param = (
                              fromTemplate
                                ? row.resultType === 'select'
                                  ? {
                                      ...fromTemplate,
                                      dataType: 'SELECT' as const,
                                      options: row.options || fromTemplate.options,
                                    }
                                  : fromTemplate
                                : {
                                    id: row.id,
                                    code: row.id.toUpperCase(),
                                    name: row.label,
                                    dataType: (row.resultType === 'numeric'
                                      ? 'NUMERIC'
                                      : row.resultType === 'select'
                                        ? 'SELECT'
                                        : 'TEXT') as ParameterDef['dataType'],
                                    options: row.options,
                                  }
                            ) as ParameterDef;
                            const resItem = ({ value: readParam(param.id) });
                            const currentValue = resItem?.value ?? '';
                            if (resultForm.tableColumns === 'test-result-unit-ref') {
                              return (
                                <div
                                  key={row.id}
                                  className="lims-rf-grid-row grid grid-cols-12 hover:bg-slate-50/50"
                                >
                                  <div className="col-span-4 px-4 py-2.5 text-sm text-slate-800">
                                    {row.label}
                                  </div>
                                  <div className="col-span-3 px-3 py-1.5">
                                    {renderResultInput(param, currentValue)}
                                  </div>
                                  <div className="col-span-2 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                                    {row.unit || param.unit || '—'}
                                  </div>
                                  <div className="col-span-3 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                                    {row.refRange || param.normalText || '—'}
                                  </div>
                                </div>
                              );
                            }
                            const methodKey = row.examChoiceId || `${row.id}_exam`;
                            const methodValue = row.examOptions ? readParam(methodKey) : '';
                            const resultChoices = row.resultOptionsByExam
                              ? row.resultOptionsByExam[methodValue] || []
                              : row.options || param.options || [];
                            const resultParam = (
                              row.resultType === 'select'
                                ? { ...param, dataType: 'SELECT' as const, options: resultChoices }
                                : param
                            ) as ParameterDef;
                            return (
                              <div
                                key={row.id}
                                className="lims-rf-grid-row grid grid-cols-2 hover:bg-slate-50/50"
                              >
                                <div className="px-4 py-2.5 text-sm text-slate-800">
                                  {row.examOptions ? (
                                    <select
                                      value={methodValue}
                                      onChange={(e) => {
                                        const next = e.target.value;
                                        writeParam(methodKey, next);
                                        const allowed = row.resultOptionsByExam?.[next] || [];
                                        if (currentValue && !allowed.includes(currentValue)) {
                                          writeParam(row.id, '');
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
                                  {renderResultInput(resultParam, currentValue)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        );
                      })}
                      {panel.members.map((member) => {
                        const covered = new Set(
                          (resultForm.resultSections || []).flatMap((section) =>
                            section.rows.flatMap((row) =>
                              row.examChoiceId ? [row.id, row.examChoiceId] : [row.id]
                            )
                          )
                        );
                        const extra = (member.template.parameters || []).filter(
                          (param) => param && !covered.has(param.id)
                        );
                        if (extra.length === 0) return null;
                        const fourCol = resultForm.tableColumns === 'test-result-unit-ref';
                        return (
                          <div key={`extra-${member.examCode}`}>
                            <div className="lims-rf-section-label px-4 py-1.5 bg-slate-50 text-[11px] font-bold uppercase text-slate-800 tracking-wide">
                              {member.template.examName || member.examName}
                            </div>
                            {extra.map((param) => {
                              const currentValue = readParam(param.id);
                              if (examinedResultsOnly && !hasEnteredResult(currentValue)) return null;
                              const refText =
                                param.normalText ||
                                (param.specMin !== undefined && param.specMax !== undefined
                                  ? `${param.specMin} - ${param.specMax}`
                                  : '—');
                              if (fourCol) {
                                return (
                                  <div
                                    key={param.id}
                                    className="lims-rf-grid-row grid grid-cols-12 hover:bg-slate-50/50"
                                  >
                                    <div className="col-span-4 px-4 py-2.5 text-sm text-slate-800">
                                      {param.name}
                                    </div>
                                    <div className="col-span-3 px-3 py-1.5">
                                      {renderResultInput(param, currentValue)}
                                    </div>
                                    <div className="col-span-2 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                                      {param.unit || '—'}
                                    </div>
                                    <div className="col-span-3 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                                      {refText}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={param.id}
                                  className="lims-rf-grid-row grid grid-cols-2 hover:bg-slate-50/50"
                                >
                                  <div className="px-4 py-2.5 text-sm text-slate-800">
                                    {param.name}
                                  </div>
                                  <div className="px-3 py-1.5">
                                    {renderResultInput(param, currentValue)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                      );
                    })()
                  ) : useFlatAnalytes && resultForm?.analytes ? (
                    <div className="lims-result-form-table">
                      <div className="lims-rf-grid-head grid grid-cols-2 bg-slate-100 text-xs font-semibold text-slate-600">
                        <div className="px-4 py-2">Test</div>
                        <div className="px-4 py-2">Result</div>
                      </div>
                      {resultForm.analytes.map((row) => {
                        const param =
                          paramsList.find((p) => p.id === row.id) ||
                          ({
                            id: row.id,
                            code: row.id.toUpperCase(),
                            name: row.label,
                            dataType: (row.resultType === 'select'
                              ? 'SELECT'
                              : row.resultType === 'numeric'
                                ? 'NUMERIC'
                                : 'TEXT') as ParameterDef['dataType'],
                            options: row.options,
                          } as ParameterDef);
                        const resItem = ({ value: readParam(param.id) });
                        const currentValue = resItem?.value ?? '';
                        if (examinedResultsOnly && !hasEnteredResult(currentValue)) return null;
                        return (
                          <div
                            key={row.id}
                            className="lims-rf-grid-row grid grid-cols-2 hover:bg-slate-50/50"
                          >
                            <div className="px-4 py-2.5 text-sm text-slate-800">
                              {row.label}
                            </div>
                            <div className="px-3 py-1.5">
                              {renderResultInput(param, currentValue)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                  /* Same TEST | RESULT | UNIT | REF. RANGE layout as the assigned result forms */
                  <div className="lims-result-form-table">
                    <div className="lims-rf-grid-head grid grid-cols-12 bg-slate-100 text-xs font-semibold text-slate-600">
                      <div className="col-span-4 px-4 py-2">Test</div>
                      <div className="col-span-3 px-4 py-2">Result</div>
                      <div className="col-span-2 px-4 py-2">Unit</div>
                      <div className="col-span-3 px-4 py-2">Ref. Range</div>
                    </div>
                    {paramsList.map((param) => {
                      if (!param) return null;
                      const currentValue = readParam(param.id);
                      if (examinedResultsOnly && !hasEnteredResult(currentValue)) return null;
                      const refText =
                        param.normalText ||
                        (param.specMin !== undefined && param.specMax !== undefined
                          ? `${param.specMin} - ${param.specMax}`
                          : '—');
                      return (
                        <div
                          key={param.id}
                          className="lims-rf-grid-row grid grid-cols-12 hover:bg-slate-50/50"
                        >
                          <div className="col-span-4 px-4 py-2.5 text-sm text-slate-800">
                            {param.name}
                          </div>
                          <div className="col-span-3 px-3 py-1.5">
                            {renderResultInput(param, currentValue)}
                          </div>
                          <div className="col-span-2 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                            {param.unit || '—'}
                          </div>
                          <div className="col-span-3 px-4 py-2.5 text-sm tabular-nums text-slate-800">
                            {refText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}

                  {examinedResultsOnly &&
                  useSimpleTestResult &&
                  resultForm?.resultSections &&
                  !resultForm.resultSections.some((section) =>
                    section.rows.some((row) => hasEnteredResult(readParam(row.id)))
                  ) &&
                  !paramsList.some((p) => p && hasEnteredResult(readParam(p.id))) ? (
                    <p className="px-4 py-6 text-sm text-slate-500 text-center border-t border-slate-200">
                      No examined tests yet. Turn off <span className="font-semibold">Examined only</span> to enter
                      results.
                    </p>
                  ) : null}

                  {/* Per-examination examiners */}
                  {(() => {
                    const ex =
                      group?.examiners ||
                      DEFAULT_EXAMINERS(currentUserName || 'Dr. Katherine Zhang, MD, FPSP');
                    const examCount = resultPanels.length;
                    const patchExaminers = (patch: Partial<ExamExaminers>) => {
                      panel.members.forEach((m) => updateExamExaminers(m.examCode, patch));
                    };
                    return (
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                            Examiners for this examination
                          </h5>
                          {examCount > 1 && (
                            <button
                              type="button"
                              onClick={() => applyExaminersToAllExams(examKey)}
                              className="text-[10px] font-bold text-[#0176d3] hover:underline cursor-pointer"
                            >
                              Apply to all examinations
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Laboratory Technician
                            </label>
                            <input
                              type="text"
                              value={ex.labTechName || ''}
                              onChange={(e) =>
                                patchExaminers( { labTechName: e.target.value })
                              }
                              placeholder="Full name"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Medical Technologist *
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ex.rmtName}
                                onChange={(e) =>
                                  patchExaminers( { rmtName: e.target.value })
                                }
                                placeholder="Full Name, RMT"
                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 shadow-2xs"
                              />
                              <input
                                type="text"
                                value={ex.rmtLicense}
                                onChange={(e) =>
                                  patchExaminers( { rmtLicense: e.target.value })
                                }
                                placeholder="License No."
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md tabular-nums text-slate-800 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Pathologist * (Name, License No.)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ex.pathologistName}
                                onChange={(e) =>
                                  patchExaminers( {
                                    pathologistName: e.target.value,
                                  })
                                }
                                placeholder="Pathologist Name, MD, FPSP"
                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 shadow-2xs"
                              />
                              <input
                                type="text"
                                value={ex.pathologistLicense || ''}
                                onChange={(e) =>
                                  patchExaminers( {
                                    pathologistLicense: e.target.value,
                                  })
                                }
                                placeholder="License No."
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md tabular-nums text-slate-800 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {resultPanels.length > 0 ? (
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Clinical Remarks / Diagnostic Interpretation (Optional)
              </label>
              <textarea
                rows={2}
                value={generalRemarks}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setGeneralRemarks(e.target.value);
                }}
                placeholder="e.g. Repeated test in duplicate. Specimen integrity verified."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs"
              />
            </div>

            {/* Direct Bottom Save Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 tabular-nums">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Edits save to the database automatically. Save Draft still records the audit entry.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectSave(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  title="Save draft on this page"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Save Draft (In Testing)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectSave(true)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98"
                  title="Complete all parameters directly on this page"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Complete &amp; Finalize Results</span>
                </button>

                {(requisition?.status === 'COMPLETED' || sample.status === 'APPROVED') && onOpenCoA && (
                  <button
                    type="button"
                    onClick={() => onOpenCoA(sample)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                    title="Open Certificate of Analysis to print"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print CoA Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          ) : null}

        </div>
      )}

      </div>

      {cryoLabelOpen && (() => {
        const safeExams = requestedExams.length > 0 ? requestedExams : ['CBC WITH PLATELET COUNT'];
        const containers = labelGroupingMode === 'container'
          ? getSpecimenContainersForRequisition(safeExams, sample.barcode)
          : getIndividualTestContainers(safeExams, sample.barcode);

        const safeContainerIndex = Math.min(Math.max(0, selectedContainerIndex), containers.length - 1);
        const activeContainer = containers[safeContainerIndex] || containers[0];
        const activeExamList = activeContainer.exams.join(', ');

        return (
          <DocumentSideDrawer
            title="Zebra cryo label"
            subtitle={`${patientDisplayName} · ${sample.barcode} · Case ${caseNumber}`}
            onClose={() => setCryoLabelOpen(false)}
            onPrint={() => window.print()}
            panelClassName="sm:w-[min(100%,480px)]"
            compactHeader
          >
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 print:p-0 print-paper-sheet">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 print:hidden">
              <p className="text-xs text-slate-600 leading-relaxed">
                Preview tube and cap-dot labels before printing to Zebra.
              </p>

              {/* View & Grouping Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Grouping Mode Pill Toggle */}
                <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLabelGroupingMode('container');
                      setSelectedContainerIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      labelGroupingMode === 'container'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Group tests by specimen tube / container (Clinical standard)"
                  >
                    By Container ({getSpecimenContainersForRequisition(safeExams, sample.barcode).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLabelGroupingMode('individual');
                      setSelectedContainerIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      labelGroupingMode === 'individual'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="1 sticker for each individual test ordered"
                  >
                    1 Per Test ({safeExams.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPrintAllMode(!printAllMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    printAllMode 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {printAllMode ? '✓ Showing All' : `Show All (${containers.length})`}
                </button>
              </div>
            </div>

            {/* Specimen Container Navigation Tabs (Select Specific Tube / Container) */}
            {!printAllMode && containers.length > 1 && (
              <div className="space-y-1.5 print:hidden bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
                  <span>Select specimen container</span>
                  <span className="text-[11px] font-medium text-slate-500 tabular-nums text-right">
                    {safeContainerIndex + 1} of {containers.length} · {activeContainer.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {containers.map((c, idx) => {
                    const isSelected = safeContainerIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedContainerIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                          isSelected
                            ? 'bg-[#0176d3] text-white border-[#0176d3] shadow-2xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: c.capColor }}
                        />
                        <span className="font-mono">T{c.tubeNumber}</span>
                        <span>{c.primaryAbbr}</span>
                        <span className="text-[10px] opacity-80 hidden sm:inline font-normal">
                          ({c.shortContainer})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Display Mode A: Single Selected Specimen Container Sticker */}
            {!printAllMode && (
              <div className="space-y-3">
                
                {/* 1. Main 2" x 1" Wrap-Around Test Tube Sticker Mockup */}
                <div className="p-3 print:p-0 bg-slate-100 print:bg-white rounded-lg border border-slate-200 print:border-none flex items-center justify-center print-avoid-break">
                  <div className="bg-white border-2 border-dashed border-slate-400 print:border-slate-600 rounded-lg p-3 shadow-sm w-full max-w-[320px] space-y-1.5 text-slate-900 font-mono">
                    
                    {/* Header on tube sticker */}
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-300 pb-1">
                      <span className="font-bold uppercase font-sans">PHILIPPINE TUBERCULOSIS SOCIETY</span>
                      <span className="font-bold">[{patientCategory}]</span>
                    </div>

                    {/* Container Type & Specimen Matrix Banner */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold font-sans text-slate-800 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: activeContainer.capColor }}
                        />
                        <span className="truncate uppercase">{activeContainer.containerName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-600 font-bold shrink-0 ml-1">
                        {activeContainer.matrix}
                      </span>
                    </div>

                    {/* Single Specific Examination Ribbon */}
                    <div className="bg-slate-900 text-white text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center justify-between leading-tight">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-cyan-300 shrink-0">EXAM:</span>
                        <span className="truncate font-sans font-bold tracking-tight" title={activeExamList}>
                          {formatExamListForSticker(activeContainer.exams, activeContainer.examAbbrs)}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.2 rounded shrink-0 ml-1.5">
                        {activeContainer.primaryAbbr}
                      </span>
                    </div>

                    {/* Real Vector Code 128 Barcode with Tube Specific ID */}
                    <div className="flex flex-col items-center justify-center bg-white py-0.5">
                      <Barcode
                        value={activeContainer.tubeBarcode}
                        format="CODE128"
                        width={1.6}
                        height={38}
                        fontSize={10}
                        font="monospace"
                        margin={2}
                        className="w-full max-w-[260px] h-auto mx-auto"
                      />
                    </div>

                    {/* Patient, Container & Label Metadata Grid on Tube Sticker */}
                    <div className="grid grid-cols-2 gap-x-2 text-[10px] border-t border-slate-300 pt-1.5 leading-tight">
                      <div>
                        <div className="font-bold uppercase font-sans truncate">{patientDisplayName}</div>
                        <div className="text-slate-600">Case: {caseNumber}</div>
                        <div className="text-slate-800 font-bold truncate">{activeContainer.shortContainer}</div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold">{collectionDateStr}</div>
                        <div className="text-slate-600">Tag: {activeContainer.tubeBarcode}</div>
                        <div className="text-emerald-700 font-bold">{activeContainer.temp}</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Single 11mm Circular Cap Dot Label */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs print:hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 bg-white rounded-full border-2 border-slate-800 flex flex-col items-center justify-center font-mono font-bold text-[7px] text-slate-900 shrink-0 shadow-2xs leading-none">
                      <span className="text-[10px] font-black">T{activeContainer.tubeNumber}</span>
                      <span className="text-[7px] text-[#0176d3] font-bold mt-0.5">{activeContainer.primaryAbbr}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-[11px] leading-snug">
                        Cap dot (11mm)
                        <span className="ml-1 px-1 py-0.5 bg-blue-50 text-[#0176d3] rounded text-[9px] font-bold border border-blue-200">
                          {activeContainer.primaryAbbr}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        {activeContainer.tubeBarcode} · T{activeContainer.tubeNumber}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0">
                    Ready
                  </span>
                </div>

              </div>
            )}

            {/* Display Mode B: All Specimen Tube Stickers (1 Per Tube / Container Sheet) */}
            {printAllMode && (
              <div className="space-y-6">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between print:hidden">
                  <span className="font-semibold">
                    Printing All {containers.length} Individual Specimen Stickers ({labelGroupingMode === 'container' ? 'Grouped by Container' : '1 Per Test'})
                  </span>
                  <span className="font-mono text-[11px]">Ready for Thermal Roll</span>
                </div>

                <div className="space-y-6">
                  {containers.map((c, idx) => {
                    const cExamList = c.exams.join(', ');
                    return (
                      <div key={idx} className="p-4 bg-slate-100 print:bg-white rounded-xl border border-slate-300 print:border-none print-avoid-break space-y-3">
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 print:hidden">
                          <span className="flex items-center gap-1.5 font-mono">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: c.capColor }}
                            />
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-mono">
                              {c.tubeNumber}
                            </span>
                            <span className="font-sans font-bold">{c.containerName}</span>
                          </span>
                          <span className="font-mono text-slate-500">{c.tubeBarcode}</span>
                        </div>

                        {/* Tube Sticker */}
                        <div className="bg-white border-2 border-dashed border-slate-400 print:border-slate-600 rounded-lg p-4 shadow-sm w-full max-w-md mx-auto space-y-2 text-slate-900 font-mono">
                          <div className="flex items-center justify-between text-[10px] border-b border-slate-300 pb-1">
                            <span className="font-bold uppercase font-sans">PHILIPPINE TUBERCULOSIS SOCIETY</span>
                            <span className="font-bold">[{patientCategory}]</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <div className="flex items-center gap-1.5 font-bold font-sans text-slate-800 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: c.capColor }}
                              />
                              <span className="truncate uppercase">{c.containerName}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 font-bold shrink-0 ml-1">
                              {c.matrix}
                            </span>
                          </div>

                          <div className="bg-slate-900 text-white text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center justify-between leading-tight">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-cyan-300 shrink-0">EXAM:</span>
                              <span className="truncate font-sans font-bold tracking-tight" title={cExamList}>
                                {formatExamListForSticker(c.exams, c.examAbbrs)}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.2 rounded shrink-0 ml-1.5">
                              {c.primaryAbbr}
                            </span>
                          </div>

                          <div className="flex flex-col items-center justify-center bg-white py-1">
                            <Barcode
                              value={c.tubeBarcode}
                              format="CODE128"
                              width={1.9}
                              height={46}
                              fontSize={12}
                              font="monospace"
                              margin={4}
                              className="w-full max-w-[280px] h-auto mx-auto"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 text-[10px] border-t border-slate-300 pt-1.5 leading-tight">
                            <div>
                              <div className="font-bold uppercase font-sans truncate">{patientDisplayName}</div>
                              <div className="text-slate-600">Case: {caseNumber}</div>
                              <div className="text-slate-800 font-bold truncate">{c.shortContainer}</div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold">{collectionDateStr}</div>
                              <div className="text-slate-600">Tag: {c.tubeBarcode}</div>
                              <div className="text-emerald-700 font-bold">{c.temp}</div>
                            </div>
                          </div>
                        </div>

                        {/* Matching Cap Dot */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200 max-w-md mx-auto flex items-center gap-3 text-xs">
                          <div className="w-10 h-10 bg-white rounded-full border-2 border-slate-800 flex flex-col items-center justify-center font-mono font-bold text-[8px] text-slate-900 shrink-0 leading-none">
                            <span className="text-[9px] font-black">T{c.tubeNumber}</span>
                            <span className="text-[7px] text-[#0176d3] font-bold mt-0.5">{c.primaryAbbr}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            Cap Dot: <strong>{c.tubeBarcode}</strong> · Tube #{c.tubeNumber} · [{c.primaryAbbr}] · <span className="font-sans font-medium">{c.shortContainer}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 print:hidden">
              <button
                type="button"
                onClick={() => {
                  const zpl = `^XA\n^FO50,25^ADN,18,10^FDPHILIPPINE TUBERCULOSIS SOCIETY [${patientCategory}]^FS\n^FO50,45^ADN,18,10^FDEXAM: ${activeExamList.substring(0, 30)}^FS\n^FO50,70^BY2^BCN,50,Y,N,N^FD${activeContainer.tubeBarcode}^FS\n^FO50,140^ADN,18,10^FD${patientDisplayName} - ${caseNumber}^FS\n^FO50,165^ADN,18,10^FD${activeContainer.containerName} | Tag: ${activeContainer.tubeBarcode}^FS\n^XZ`;
                  navigator.clipboard.writeText(zpl);
                  alert(`Copied Zebra ZPL thermal code for ${activeContainer.tubeBarcode} (${activeContainer.containerName}) to clipboard!`);
                }}
                className="w-full px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold rounded-md shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Copy Zebra Programming Language (ZPL) direct thermal code"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy ZPL (tube {activeContainer.tubeNumber})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-md shadow-2xs cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-300" />
                <span>{printAllMode ? `Print all (${containers.length})` : `Print tube ${activeContainer.tubeNumber}`}</span>
              </button>
            </div>

            </div>
          </DocumentSideDrawer>
        );
      })()}

    </div>
  );
};
