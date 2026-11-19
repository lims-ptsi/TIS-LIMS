import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResultFormOrgBanner } from '../common/ResultFormOrgBanner';
import {
  NTP_REQ_TO_RESULT_CHECK,
  syncNtpResultChecksFromRequest,
} from '../../utils/ntpFormPrefill';
import { formatNtpOfficialDateTime } from '../../utils/resultsPickup';
import {
  findPersonnelById,
  personnelForRole,
  personnelIdForExaminer,
  type LabPersonnelRole,
} from '../../data/labPersonnelCatalog';

export const NTP_FIELD_KEYS = [
  'facilityName',
  'dateOfRequest',
  'facilityContact',
  'requestingPhysician',
  'patientName',
  'age',
  'sex',
  'provinceCity',
  'patientContact',
  'diagnosis',
  'treatmentPhase',
  'tbCaseNo',
  'monthOfTreatment',
  'req_xpert',
  'req_xpert_ultra',
  'req_truenat_plus',
  'req_truenat_rif',
  'req_tblamp',
  'req_smear',
  'req_xpert_xdr',
  'req_lpa',
  'req_culture',
  'req_pdst',
  'specimenType',
  'specimenOther',
  'repeatCollection',
  'repeatReason',
  'collectionDate',
  'spec1_collected',
  'spec1_dispatched',
  'spec2_collected',
  'spec2_dispatched',
  'request_spec2_active',
  'remarks',
  'preparedBy',
  'preparedDesignation',
  'labName',
  'specimenReceivedAt',
  'specimenReceivedBy',
  'specimenQuality',
  'specimenQualityReason',
  'spec2_quality',
  'spec2_qualityReason',
  'specimenVolumeQuality',
  'specimenVolumeQuality2',
  'labSerial',
  'dateExamined',
  'res_ck_xpert',
  'res_ck_xpert_ultra',
  'res_ck_truenat_plus',
  'res_ck_truenat_rif',
  'res_ck_tblamp',
  'res_ck_smear',
  'res_diagnostic_test',
  'res_result_reading1',
  'res_result_reading2',
  'res_result_diagnosis',
  'res_result_remarks',
  'res_xpert',
  'res_xpert_ultra',
  'res_truenat_plus',
  'res_truenat_rif',
  'res_xpert_r1',
  'res_xpert_r2',
  'res_xpert_r3',
  'res_xpert_ultra_r1',
  'res_xpert_ultra_r2',
  'res_xpert_ultra_r3',
  'res_truenat_plus_r1',
  'res_truenat_plus_r2',
  'res_truenat_plus_r3',
  'res_truenat_rif_r1',
  'res_truenat_rif_r2',
  'res_truenat_rif_r3',
  'res_tblamp',
  'smear_reading1',
  'smear_reading2',
  'smear2_reading1',
  'smear2_reading2',
  'smear_spec2_active',
  'smear_diagnosis',
  'performedBy',
  'verifiedBy',
  'notedBy',
  'dateReleased',
] as const;

/** Filled from requisition prefill — read-only in workflow; everything else stays editable */
export const NTP_PATIENT_AUTO_FIELD_KEYS = new Set<string>([
  'patientName',
  'age',
  'sex',
  'provinceCity',
  'patientContact',
  'tbCaseNo',
]);

type Values = Record<string, string>;

/** paper = official Form 2a / print; saas = lab workflow data entry (sample detail, result entry). */
type NtpUiMode = 'paper' | 'saas';
const NtpUiContext = React.createContext<NtpUiMode>('paper');
function useNtpUi(): NtpUiMode {
  return React.useContext(NtpUiContext);
}

const REQUESTED_TESTS: { id: string; label: string }[] = [
  { id: 'req_xpert', label: 'Xpert MTB/RIF' },
  { id: 'req_xpert_ultra', label: 'Xpert MTB/RIF Ultra' },
  { id: 'req_truenat_plus', label: 'Truenat MTB Plus' },
  { id: 'req_truenat_rif', label: 'Truenat MTB-RIF Dx' },
  { id: 'req_tblamp', label: 'TB LAMP' },
  { id: 'req_smear', label: 'Smear Microscopy' },
  { id: 'req_xpert_xdr', label: 'Xpert MTB/XDR' },
  { id: 'req_lpa', label: 'Line Probe Assay' },
  { id: 'req_culture', label: 'TB Culture' },
  { id: 'req_pdst', label: 'Phenotypic DST' },
];

/** Official Form 2a paper — test requested columns (top → bottom within each column). */
const NTP_REQUESTED_TESTS_PAPER_COLS: { id: string; label: string }[][] = [
  [
    { id: 'req_xpert', label: 'Xpert MTB/RIF' },
    { id: 'req_xpert_xdr', label: 'Xpert MTB/XDR' },
    { id: 'req_xpert_ultra', label: 'Xpert MTB/RIF Ultra' },
  ],
  [
    { id: 'req_truenat_plus', label: 'Truenat MTB Plus' },
    { id: 'req_lpa', label: 'Line Probe Assay' },
  ],
  [
    { id: 'req_truenat_rif', label: 'Truenat MTB-RIF' },
    { id: 'req_tblamp', label: 'TB LAMP' },
    { id: 'req_culture', label: 'TB Culture' },
  ],
  [
    { id: 'req_smear', label: 'Smear Microscopy' },
    { id: 'req_pdst', label: 'Phenotypic DST' },
  ],
];

const NTP_XPERT_MTB_RIF_RESULT_OPTIONS = [
  'MTB NOT DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE INDETERMINATE',
  'INVALID / ERROR',
] as const;

const NTP_XPERT_ULTRA_RESULT_OPTIONS = [
  'MTB NOT DETECTED',
  'MTB DETECTED TRACE; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED TRACE; RIFAMPICIN RESISTANCE DETECTED',
  'MTB DETECTED VERY LOW; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED LOW; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED MEDIUM; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED HIGH; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE INDETERMINATE',
  'INVALID / ERROR',
] as const;

const NTP_TRUENAT_PLUS_RESULT_OPTIONS = ['MTB NOT DETECTED', 'MTB DETECTED', 'INVALID / ERROR'] as const;

const NTP_TRUENAT_RIF_RESULT_OPTIONS = [
  'MTB NOT DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE NOT DETECTED',
  'MTB DETECTED; RIFAMPICIN RESISTANCE DETECTED',
  'INVALID / ERROR',
] as const;

const RESULT_TESTS: {
  id: string;
  chkId: string;
  label: string;
  clearKeys?: string[];
  options?: readonly string[];
}[] = [
  { id: 'res_xpert', chkId: 'res_ck_xpert', label: 'Xpert MTB/RIF', options: NTP_XPERT_MTB_RIF_RESULT_OPTIONS },
  {
    id: 'res_xpert_ultra',
    chkId: 'res_ck_xpert_ultra',
    label: 'Xpert MTB/RIF Ultra',
    options: NTP_XPERT_ULTRA_RESULT_OPTIONS,
  },
  {
    id: 'res_truenat_plus',
    chkId: 'res_ck_truenat_plus',
    label: 'Truenat MTB Plus',
    options: NTP_TRUENAT_PLUS_RESULT_OPTIONS,
  },
  {
    id: 'res_truenat_rif',
    chkId: 'res_ck_truenat_rif',
    label: 'Truenat MTB-RIF Dx',
    options: NTP_TRUENAT_RIF_RESULT_OPTIONS,
  },
];

const SMEAR_RESULT = {
  chkId: 'res_ck_smear',
  label: 'Smear Microscopy — Acid Fast Bacilli',
  clearKeys: [
    'smear_reading1',
    'smear_reading2',
    'smear2_reading1',
    'smear2_reading2',
    'smear_spec2_active',
    'smear_diagnosis',
  ],
} as const;

const SMEAR_SPEC2_KEYS = ['smear2_reading1', 'smear2_reading2', 'smear_spec2_active'] as const;

type DiagnosticResultRow = {
  id: string;
  chkId: string;
  label: string;
  clearKeys?: string[];
  options?: readonly string[];
  kind?: 'smear';
};

const DIAGNOSTIC_RESULT_ROWS: DiagnosticResultRow[] = [
  ...RESULT_TESTS,
  {
    id: 'smear',
    chkId: SMEAR_RESULT.chkId,
    label: SMEAR_RESULT.label,
    clearKeys: [...SMEAR_RESULT.clearKeys],
    kind: 'smear',
  },
];

const DIAGNOSTIC_TEST_PICKER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Select examination —' },
  ...DIAGNOSTIC_RESULT_ROWS.map((t) => ({ value: t.chkId, label: t.label })),
];

export const NTP_READING1_MTB_OPTIONS = [
  'MTB NOT DETECTED',
  'MTB DETECTED',
  'MTB TRACE DETECTED',
  'ERROR',
] as const;

const NTP_READING1_MTB_RED = new Set<string>(['MTB DETECTED', 'MTB TRACE DETECTED']);

export const NTP_READING2_MTB_LEVEL_OPTIONS = ['LOW', 'VERY LOW', 'MEDIUM', 'HIGH'] as const;

export const NTP_READING3_RIF_OPTIONS = [
  'RIF RESISTANCE NOT DETECTED',
  'RIF RESISTANCE DETECTED',
  'RIF RESISTANCE INDETERMINATE',
] as const;

const NTP_READING3_RIF_RED = new Set<string>([
  'RIF RESISTANCE DETECTED',
  'RIF RESISTANCE INDETERMINATE',
]);

function reading1ShowsRifDropdown(reading1: string): boolean {
  return reading1 === 'MTB DETECTED' || reading1 === 'MTB TRACE DETECTED';
}

export function needsNtpResultRemarks(reading1: string, rifReading3: string): boolean {
  return reading1 === 'MTB TRACE DETECTED' || rifReading3 === 'RIF RESISTANCE INDETERMINATE';
}

export const NTP_SMEAR_RESULT_OPTIONS = ['0', '+n', '1+', '2+', '3+'] as const;

const NTP_SMEAR_RESULT_RED = new Set<string>(['+n', '1+', '2+', '3+']);

export const NTP_SMEAR_LAB_DIAGNOSIS_OPTIONS = ['POSITIVE', 'NEGATIVE'] as const;

const NTP_SMEAR_LAB_DIAGNOSIS_RED = new Set<string>(['POSITIVE']);

/** POSITIVE if any specimen reading is +n, 1+, 2+, or 3+; otherwise NEGATIVE. */
export function deriveCombinedSmearLabDiagnosis(
  values: Record<string, string>,
  includeSecondSpecimen: boolean
): (typeof NTP_SMEAR_LAB_DIAGNOSIS_OPTIONS)[number] {
  const readings = [values.smear_reading1 || '0'];
  if (includeSecondSpecimen) readings.push(values.smear2_reading1 || '0');
  return readings.some((r) => NTP_SMEAR_RESULT_RED.has(r)) ? 'POSITIVE' : 'NEGATIVE';
}

export function resolveNtpSelectedDiagnosticChkId(values: Record<string, string>): string {
  const explicit = (values.res_diagnostic_test || '').trim();
  if (explicit) return explicit;
  const active = DIAGNOSTIC_RESULT_ROWS.filter((t) => values[t.chkId] === '1');
  return active.length ? active[0].chkId : '';
}

/** Workflow entry: one active row; official print / preview: every requested test. */
export function resolveNtpDiagnosticRowsForForm(
  values: Record<string, string>,
  opts: { workflowEntry: boolean }
): DiagnosticResultRow[] {
  const requested = DIAGNOSTIC_RESULT_ROWS.filter((t) => {
    const reqKey = Object.entries(NTP_REQ_TO_RESULT_CHECK).find(([, ck]) => ck === t.chkId)?.[0];
    return values[t.chkId] === '1' || (reqKey && values[reqKey] === '1');
  });
  if (opts.workflowEntry) {
    const selected = resolveNtpSelectedDiagnosticChkId(values);
    const one = DIAGNOSTIC_RESULT_ROWS.find((t) => t.chkId === selected);
    return one ? [one] : [];
  }
  return requested;
}

const NTP_MOLECULAR_RESULT_CHK_IDS = new Set([
  'res_ck_xpert',
  'res_ck_xpert_ultra',
  'res_ck_truenat_plus',
  'res_ck_truenat_rif',
]);

function molecularPerTestKeys(test: DiagnosticResultRow) {
  return {
    r1: `${test.id}_r1`,
    r2: `${test.id}_r2`,
    r3: `${test.id}_r3`,
  } as const;
}

function rifReadingToOfficialSemicolon(r3: string): string {
  return r3.replace(/^RIF RESISTANCE /, 'RIFAMPICIN RESISTANCE ');
}

/** Official one-line result for storage on res_xpert / res_truenat_* (matches pre-defined option text). */
export function formatNtpMolecularOfficialLine(r1: string, r2: string, r3: string): string {
  const reading1 = r1.trim();
  const reading2 = r2.trim();
  const rif = r3.trim();
  if (!reading1 && !reading2 && !rif) return '';
  if (reading1 === 'MTB NOT DETECTED' || reading1 === 'ERROR') return reading1;
  if (reading1 === 'MTB TRACE DETECTED') {
    return rif ? `MTB DETECTED TRACE; ${rifReadingToOfficialSemicolon(rif)}` : reading1;
  }
  if (reading1 === 'MTB DETECTED') {
    const level = reading2 ? ` ${reading2}` : '';
    const base = `MTB DETECTED${level}`;
    return rif ? `${base}; ${rifReadingToOfficialSemicolon(rif)}` : reading2 ? `MTB DETECTED ${reading2}` : reading1;
  }
  return [reading1, reading2, rif].filter(Boolean).join('; ');
}

/** Split stored res_xpert / preset option text into workflow Reading 1–3 values. */
export function parseNtpMolecularSplitFromText(line: string): { r1: string; r2: string; r3: string } {
  const t = line.trim();
  if (!t) return { r1: '', r2: '', r3: '' };
  if (t === 'MTB NOT DETECTED') return { r1: 'MTB NOT DETECTED', r2: '', r3: '' };
  if (t === 'ERROR' || t === 'INVALID / ERROR') return { r1: 'ERROR', r2: '', r3: '' };

  let r1 = '';
  let r2 = '';
  let r3 = '';

  if (/MTB DETECTED TRACE/i.test(t)) r1 = 'MTB TRACE DETECTED';
  else if (/MTB DETECTED/i.test(t)) r1 = 'MTB DETECTED';
  else if (/MTB NOT DETECTED/i.test(t)) r1 = 'MTB NOT DETECTED';

  const levelMatch = t.match(/MTB DETECTED (VERY LOW|LOW|MEDIUM|HIGH)\b/i);
  if (levelMatch) r2 = levelMatch[1].toUpperCase();

  const rifMatch = t.match(/RIF(?:AMPICIN)? RESISTANCE (NOT DETECTED|DETECTED|INDETERMINATE)/i);
  if (rifMatch) r3 = `RIF RESISTANCE ${rifMatch[1].toUpperCase()}`;

  if ((NTP_READING3_RIF_OPTIONS as readonly string[]).includes(t)) {
    return { r1: '', r2: '', r3: t };
  }

  return { r1, r2, r3 };
}

function mergeMolecularReadingParts(
  base: { r1: string; r2: string; r3: string },
  storedLine: string
): { r1: string; r2: string; r3: string } {
  const parsed = storedLine ? parseNtpMolecularSplitFromText(storedLine) : { r1: '', r2: '', r3: '' };
  return {
    r1: base.r1 || parsed.r1,
    r2: base.r2 || parsed.r2,
    r3: base.r3 || parsed.r3,
  };
}

function molecularCombinedLineIsAlert(line: string): boolean {
  const { r1, r3 } = parseNtpMolecularSplitFromText(line);
  if (NTP_READING1_MTB_RED.has(r1)) return true;
  if (NTP_READING3_RIF_RED.has(r3)) return true;
  return r1 === 'ERROR' || /INVALID/i.test(line);
}

function isNtpMolecularFullOption(test: DiagnosticResultRow, value: string): boolean {
  const v = value.trim();
  if (!v || !test.options?.length) return false;
  return (test.options as readonly string[]).includes(v);
}

function molecularRowReadings(test: DiagnosticResultRow, values: Record<string, string>) {
  const pk = molecularPerTestKeys(test);
  const storedLine = (values[test.id] || '').trim();
  let r1 = (values[pk.r1] || '').trim();
  let r2 = (values[pk.r2] || '').trim();
  let r3 = (values[pk.r3] || '').trim();

  if (r1 || r2 || r3) {
    const merged = mergeMolecularReadingParts({ r1, r2, r3 }, storedLine);
    return { ...merged, combined: false };
  }

  if (storedLine) {
    const fromLine = parseNtpMolecularSplitFromText(storedLine);
    if (fromLine.r1 || fromLine.r2 || fromLine.r3) {
      const activeChk = resolveNtpSelectedDiagnosticChkId(values);
      const shared =
        activeChk === test.chkId
          ? {
              r1: values.res_result_reading1 || '',
              r2: values.res_result_reading2 || '',
              r3: values.res_result_diagnosis || '',
            }
          : { r1: '', r2: '', r3: '' };
      const merged = mergeMolecularReadingParts(
        {
          r1: fromLine.r1 || shared.r1,
          r2: fromLine.r2 || shared.r2,
          r3: fromLine.r3 || shared.r3,
        },
        storedLine
      );
      return { ...merged, combined: false };
    }
    if (isNtpMolecularFullOption(test, storedLine)) {
      const parsed = parseNtpMolecularSplitFromText(storedLine);
      return { ...parsed, combined: false };
    }
  }

  if (NTP_MOLECULAR_RESULT_CHK_IDS.has(test.chkId)) {
    const activeChk = resolveNtpSelectedDiagnosticChkId(values);
    const sharedR1 = values.res_result_reading1 || '';
    const sharedR2 = values.res_result_reading2 || '';
    const sharedR3 = values.res_result_diagnosis || '';
    const anotherMolecularHasSnapshot = RESULT_TESTS.some((t) => {
      if (t.chkId === test.chkId) return false;
      const otherPk = molecularPerTestKeys(t);
      return (
        (values[otherPk.r1] || '').trim() ||
        (values[otherPk.r2] || '').trim() ||
        (values[otherPk.r3] || '').trim()
      );
    });
    if (
      (sharedR1.trim() || sharedR2.trim() || sharedR3.trim()) &&
      (activeChk === test.chkId || !anotherMolecularHasSnapshot)
    ) {
      const merged = mergeMolecularReadingParts(
        { r1: sharedR1, r2: sharedR2, r3: sharedR3 },
        storedLine
      );
      return { ...merged, combined: false };
    }
  }

  if (storedLine) {
    return { r1: storedLine, r2: '', r3: '', combined: true };
  }

  return { r1: '', r2: '', r3: '', combined: false };
}

const line =
  'lims-ntp-result-select w-full border-0 border-b border-slate-800 bg-transparent px-1 py-0.5 text-[11px] focus:outline-none focus:border-[#0878e8]';

/** Official results table cells — plain text, no faux field underline. */
const ntpPaperTableValueClass =
  'ntp-form-plain-value inline-block w-full px-1 py-0.5 text-[11px] font-semibold leading-snug';
const ntpPaperTableEmptyClass =
  'ntp-form-plain-value inline-block w-full px-1 py-0.5 text-[10px] text-slate-400';

function useNtpLineClass(): string {
  return useNtpUi() === 'saas'
    ? 'lims-input w-full text-sm py-2'
    : line;
}

function ntpResultSelectClass(isAlert: boolean, base?: string): string {
  const root = base ?? line;
  return `${root} cursor-pointer pr-6 font-semibold ${
    isAlert ? 'lims-ntp-result-select--alert text-red-600' : 'text-slate-900'
  }`;
}

function useNtpResultSelectClass(isAlert: boolean): string {
  const base = useNtpLineClass();
  return ntpResultSelectClass(isAlert, base);
}

function ntpResultOptionClass(isAlert: boolean): string {
  return isAlert ? 'lims-ntp-result-option--alert text-red-600 font-semibold' : 'text-slate-900';
}

function Line({
  value,
  onChange,
  readOnly,
  type = 'text',
  placeholder,
  plainPaper,
  inlineValue,
  paperFieldUnderline,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
  /** Official print — show value without faux underline (e.g. accession boxes). */
  plainPaper?: boolean;
  /** Read-only paper — sit inline after a label on the same row. */
  inlineValue?: boolean;
  /** Rare: show field underline on official read-only paper (default off). */
  paperFieldUnderline?: boolean;
}) {
  const ui = useNtpUi();
  const inputClass = useNtpLineClass();
  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 min-h-[2.375rem]">
          {value || '—'}
        </div>
      );
    }
    const showUnderline = paperFieldUnderline === true;
    const plain = plainPaper !== false && !showUnderline;
    const displayValue =
      type === 'datetime-local' && (value || '').trim()
        ? formatNtpOfficialDateTime(value)
        : value;
    return (
      <span
        className={`ntp-form-plain-value ${
          inlineValue ? 'inline' : 'block w-full'
        } min-h-[1.125rem] px-1 py-0.5 text-[11px] font-semibold break-words leading-snug ${
          plain ? '' : 'border-b border-slate-800'
        }`}
      >
        {displayValue || '\u00a0'}
      </span>
    );
  }
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

function SmearResultSelect({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const options = NTP_SMEAR_RESULT_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[0];
  const isRed = NTP_SMEAR_RESULT_RED.has(display);
  const selectClass = useNtpResultSelectClass(isRed);

  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div
          className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
            isRed ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          {display || '—'}
        </div>
      );
    }
    return (
      <span className={`${ntpPaperTableValueClass} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select value={display} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={ntpResultOptionClass(NTP_SMEAR_RESULT_RED.has(opt))}
        >
          {opt}
        </option>
      ))}
    </select>
  );
}

function SmearLabDiagnosisSelect({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const options = NTP_SMEAR_LAB_DIAGNOSIS_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[1];
  const isRed = NTP_SMEAR_LAB_DIAGNOSIS_RED.has(display);
  const selectClass = useNtpResultSelectClass(isRed);

  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div
          className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
            isRed ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          {display || '—'}
        </div>
      );
    }
    return (
      <span className={`${ntpPaperTableValueClass} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select value={display} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={ntpResultOptionClass(NTP_SMEAR_LAB_DIAGNOSIS_RED.has(opt))}
        >
          {opt}
        </option>
      ))}
    </select>
  );
}

function SmearSpecimenRow({
  specimenLabel,
  readingKey,
  afbKey,
  values,
  readOnly,
  onChange,
}: {
  specimenLabel: string;
  readingKey: string;
  afbKey: string;
  values: Values;
  readOnly?: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const ui = useNtpUi();
  const v = (key: string) => values[key] || '';
  const reading = v(readingKey);
  const paperCell = 'border border-slate-800 px-1 py-1 align-top';
  const specCell =
    ui === 'saas'
      ? 'align-top text-center text-sm font-semibold text-slate-700'
      : 'border border-slate-800 px-2 py-1 align-top text-center text-[11px] font-semibold';

  return (
    <>
      <td className={specCell}>{specimenLabel}</td>
      <td className={ui === 'saas' ? 'align-top' : paperCell}>
        <SmearResultSelect
          value={reading}
          onChange={(val) => {
            onChange(readingKey, val);
            if (val !== '+n') onChange(afbKey, '');
          }}
          readOnly={readOnly}
        />
      </td>
      <td className={ui === 'saas' ? 'align-top' : paperCell}>
        <SmearAfbCountField
          result={reading || NTP_SMEAR_RESULT_OPTIONS[0]}
          value={v(afbKey)}
          onChange={(val) => onChange(afbKey, val)}
          readOnly={readOnly}
        />
      </td>
    </>
  );
}

/** Workflow SaaS — specimen block (no paper table). */
function SmearSpecimenBlock({
  specimenLabel,
  readingKey,
  afbKey,
  values,
  readOnly,
  onChange,
}: {
  specimenLabel: string;
  readingKey: string;
  afbKey: string;
  values: Values;
  readOnly?: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const v = (key: string) => values[key] || '';
  const reading = v(readingKey);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Specimen {specimenLabel}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Field label="Acid-fast reading">
          <SmearResultSelect
            value={reading}
            onChange={(val) => {
              onChange(readingKey, val);
              if (val !== '+n') onChange(afbKey, '');
            }}
            readOnly={readOnly}
          />
        </Field>
        <Field label="Number of AFB (when reading is +n)">
          <SmearAfbCountField
            result={reading || NTP_SMEAR_RESULT_OPTIONS[0]}
            value={v(afbKey)}
            onChange={(val) => onChange(afbKey, val)}
            readOnly={readOnly}
          />
        </Field>
      </div>
    </div>
  );
}

function SmearAfbCountField({
  result,
  value,
  onChange,
  readOnly,
}: {
  result: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const active = result === '+n';

  if (!active) {
    return <span className={ntpPaperTableEmptyClass}>{'\u00a0'}</span>;
  }

  if (readOnly) {
    return <span className={`${ntpPaperTableValueClass} text-slate-900`}>{value.trim() || '\u00a0'}</span>;
  }

  return <Line value={value} onChange={onChange} readOnly={false} placeholder="Enter count" />;
}

function MtbReading1Select({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const options = NTP_READING1_MTB_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[0];
  const isRed = NTP_READING1_MTB_RED.has(display);
  const selectClass = useNtpResultSelectClass(isRed);

  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div
          className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
            isRed ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          {display || '—'}
        </div>
      );
    }
    return (
      <span className={`${ntpPaperTableValueClass} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select value={display} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={ntpResultOptionClass(NTP_READING1_MTB_RED.has(opt))}
        >
          {opt}
        </option>
      ))}
    </select>
  );
}

function MtbReading2LevelSelect({
  reading1,
  value,
  onChange,
  readOnly,
}: {
  reading1: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const inputClass = useNtpLineClass();
  const showLevels = reading1 === 'MTB DETECTED';
  const options = NTP_READING2_MTB_LEVEL_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];

  if (!showLevels) {
    if (ui === 'saas') {
      return (
        <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-400">
          Not applicable
        </div>
      );
    }
    return <span className={ntpPaperTableEmptyClass}>{'\u00a0'}</span>;
  }

  const display = value || choices[0];

  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
          {display || '—'}
        </div>
      );
    }
    return <span className={`${ntpPaperTableValueClass} text-slate-900`}>{display || '\u00a0'}</span>;
  }

  const selectClass = `${inputClass} cursor-pointer pr-6 font-semibold text-slate-900`;

  return (
    <select value={display} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {choices.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function MtbRifReading3Select({
  reading1,
  value,
  onChange,
  readOnly,
}: {
  reading1: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const showRif = reading1ShowsRifDropdown(reading1);
  const options = NTP_READING3_RIF_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const isRedPreview = NTP_READING3_RIF_RED.has(value || choices[0]);
  const selectClass = useNtpResultSelectClass(isRedPreview);

  if (!showRif) {
    if (ui === 'saas') {
      return (
        <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-400">
          Not applicable
        </div>
      );
    }
    return <span className={ntpPaperTableEmptyClass}>{'\u00a0'}</span>;
  }

  const display = value || choices[0];
  const isRed = NTP_READING3_RIF_RED.has(display);

  if (readOnly) {
    if (ui === 'saas') {
      return (
        <div
          className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
            isRed ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          {display || '—'}
        </div>
      );
    }
    return (
      <span className={`${ntpPaperTableValueClass} ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select value={display} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={ntpResultOptionClass(NTP_READING3_RIF_RED.has(opt))}
        >
          {opt}
        </option>
      ))}
    </select>
  );
}

/** Under Reading 3 when RIF is indeterminate or MTB trace is detected (Form 2a). */
function NtpMolecularResultRemarksInline({
  show,
  value,
  readOnly,
  uiMode,
  onChange,
  workflowAlignUnderReading3,
}: {
  show: boolean;
  value: string;
  readOnly?: boolean;
  uiMode: NtpUiMode;
  onChange: (val: string) => void;
  /** Workflow card: line up under Reading 3 column. */
  workflowAlignUnderReading3?: boolean;
}) {
  if (!show) return null;
  const text = value.trim();

  const saasBody =
    uiMode === 'saas' && !readOnly ? (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">Remarks:</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Required when RIF resistance is indeterminate or MTB trace is detected"
          className="lims-input w-full text-sm min-h-[3rem] resize-y"
        />
      </div>
    ) : uiMode === 'saas' ? (
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Remarks:</p>
        <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{text || '—'}</p>
      </div>
    ) : null;

  if (saasBody) {
    const inner = (
      <div className="mt-1 pt-3 border-t border-slate-200">{saasBody}</div>
    );
    if (workflowAlignUnderReading3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-2">
          <div className="hidden md:block" aria-hidden />
          <div className="hidden md:block" aria-hidden />
          {inner}
        </div>
      );
    }
    return inner;
  }

  return null;
}

/** Form 2a paper table — one full-width row under Reading 1–3. */
function NtpMolecularRemarksPaperTableRow({
  show,
  value,
  colSpan,
  readOnly,
  onChange,
}: {
  show: boolean;
  value: string;
  colSpan: number;
  readOnly?: boolean;
  onChange: (val: string) => void;
}) {
  if (!show) return null;
  const text = value.trim();
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-800 px-2 py-0.5 align-top">
        {readOnly ? (
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-[10px] leading-snug py-0.5">
            <span className="font-semibold text-slate-800 shrink-0">Remarks:</span>
            <span className="flex-1 min-w-[6rem] font-semibold text-slate-900 whitespace-pre-wrap">
              {text || '\u00a0'}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 py-0.5">
            <span className="text-[10px] font-semibold text-slate-800 pt-1 shrink-0">Remarks:</span>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={1}
              className="flex-1 min-w-[8rem] border border-slate-300 rounded px-1.5 py-0.5 text-[10px] resize-y"
            />
          </div>
        )}
      </td>
    </tr>
  );
}

function DiagnosticTestPicker({
  selectedChkId,
  readOnly,
  onPick,
  allowedChkIds,
}: {
  selectedChkId: string;
  readOnly?: boolean;
  onPick: (pickedChkId: string) => void;
  /** When set, only tests checked under Test Requested appear (plus empty option). */
  allowedChkIds?: Set<string>;
}) {
  const ui = useNtpUi();
  const inputClass = useNtpLineClass();
  const options = useMemo(() => {
    const base = DIAGNOSTIC_TEST_PICKER_OPTIONS.filter((opt) => {
      if (!opt.value) return true;
      if (!allowedChkIds || allowedChkIds.size === 0) return false;
      return allowedChkIds.has(opt.value);
    });
    if (allowedChkIds && allowedChkIds.size > 0 && selectedChkId && !allowedChkIds.has(selectedChkId)) {
      const cur = DIAGNOSTIC_TEST_PICKER_OPTIONS.find((o) => o.value === selectedChkId);
      if (cur) return [DIAGNOSTIC_TEST_PICKER_OPTIONS[0], cur, ...base.filter((o) => o.value && o.value !== selectedChkId)];
    }
    return base;
  }, [allowedChkIds, selectedChkId]);

  if (readOnly) {
    const label = options.find((o) => o.value === selectedChkId)?.label || '\u00a0';
    if (ui === 'saas') {
      return (
        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
          {label === '\u00a0' ? '—' : label}
        </div>
      );
    }
    return (
      <span className="ntp-form-plain-value inline-block w-full px-1 text-[11px] font-semibold">
        {label}
      </span>
    );
  }

  return (
    <select
      value={selectedChkId}
      onChange={(e) => onPick(e.target.value)}
      className={`${inputClass} cursor-pointer pr-6`}
    >
      {options.map((opt) => (
        <option key={opt.value || 'none'} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Box({
  checked,
  label,
  onChange,
  readOnly,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  if (ui === 'saas') {
    if (readOnly && !checked) return null;
    return (
      <button
        type="button"
        disabled={readOnly}
        aria-pressed={checked}
        onClick={() => !readOnly && onChange(!checked)}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
          checked
            ? 'border-[#0878e8] bg-[#0878e8]/10 text-[#0878e8] shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        } ${readOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${checked ? 'bg-[#0878e8]' : 'bg-slate-300'}`}
          aria-hidden
        />
        {label}
      </button>
    );
  }
  return (
    <label className="inline-flex items-center gap-1 text-[11px] text-slate-900">
      <input
        type="checkbox"
        checked={checked}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3 w-3"
      />
      <span>{label}</span>
    </label>
  );
}

function NtpPaperFormRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ntp-request-paper-row ${className}`.trim()}>{children}</div>;
}

/** Official Form 2a — facility + patient rows; shared 12-column grid for aligned vertical rules. */
function NtpPaperPatientRow({ children }: { children: React.ReactNode }) {
  return <div className="ntp-request-paper-row ntp-request-paper-patient-row">{children}</div>;
}

function NtpPaperPatientCell({
  label,
  children,
  colSpan,
  tone = 'default',
}: {
  label: string;
  children: React.ReactNode;
  /** 1–12; rows use 9+3 or 9+1+2 so the main vertical rule lines up at 75%. */
  colSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // grid uses 9+3 and 9+1+2 in practice
  tone?: 'default' | 'narrow' | 'date';
}) {
  const toneClass =
    tone === 'narrow'
      ? 'ntp-request-paper-patient-cell--narrow'
      : tone === 'date'
        ? 'ntp-request-paper-patient-cell--date'
        : '';
  const SPAN_CLASS: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    8: 'col-span-8',
    9: 'col-span-9',
    12: 'col-span-12',
  };
  const spanClass = SPAN_CLASS[colSpan] ?? 'col-span-12';
  return (
    <div
      className={`ntp-request-paper-patient-cell ntp-paper-field flex flex-col gap-0 min-h-0 ${spanClass} ${toneClass}`.trim()}
    >
      <span className="ntp-request-paper-patient-label text-[9px] font-normal text-slate-900 leading-tight">
        {label}
      </span>
      <div className="min-w-0 w-full flex-1 flex flex-col justify-end">{children}</div>
    </div>
  );
}

function NtpPaperInlineField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ntp-paper-inline-field flex flex-nowrap items-baseline gap-x-1 min-w-0 ${className}`.trim()}>
      <span className="text-[9px] font-semibold text-slate-900 shrink-0 leading-tight">{label}</span>
      <div className="min-w-0 shrink">{children}</div>
    </div>
  );
}

/** Official read-only footer — three signatories + printed timestamp (Form 2a). */
function signaturePrintedNameLine(full: string): string {
  const s = full.trim();
  if (!s) return '';
  const idx = s.indexOf(',');
  return idx > 0 ? s.slice(0, idx).trim() : s;
}

function NtpPaperPreparedSignoff({
  preparedBy,
  designation,
  readOnly,
  onPreparedBy,
  onDesignation,
}: {
  preparedBy: string;
  designation: string;
  readOnly?: boolean;
  onPreparedBy: (name: string) => void;
  onDesignation: (val: string) => void;
}) {
  return (
    <div className="ntp-paper-prepared-signoff grid grid-cols-2 gap-4 pt-1.5 mt-0.5">
      <div className="ntp-paper-prepared-signoff-col min-w-0">
        <div className="ntp-paper-prepared-signoff-label">Prepared by</div>
        {readOnly ? (
          <div className="ntp-paper-signature-name">{preparedBy.trim() || '\u00a0'}</div>
        ) : (
          <NtpPersonnelSelect
            role="performed"
            nameValue={preparedBy}
            onNameChange={onPreparedBy}
            designationValue={designation}
            onDesignationChange={onDesignation}
            readOnly={false}
          />
        )}
        <div className="ntp-paper-signature-caption">Signature over Printed Name</div>
      </div>
      <div className="ntp-paper-prepared-signoff-col min-w-0">
        <div className="ntp-paper-prepared-signoff-label">Designation</div>
        {readOnly ? (
          <div className="ntp-paper-signature-name">{designation || '\u00a0'}</div>
        ) : (
          <Line value={designation} onChange={onDesignation} readOnly={false} plainPaper />
        )}
        <div className="ntp-paper-signature-caption ntp-paper-signature-caption--spacer" aria-hidden>
          {'\u00a0'}
        </div>
      </div>
    </div>
  );
}

function NtpPaperSignatureFooter({
  performedBy,
  verifiedBy,
  notedBy,
  printedAt,
}: {
  performedBy: string;
  verifiedBy: string;
  notedBy: string;
  printedAt: string;
}) {
  const slots = [
    { label: 'Performed by', name: signaturePrintedNameLine(performedBy) },
    { label: 'Verified by', name: signaturePrintedNameLine(verifiedBy) },
    { label: 'Noted by', name: signaturePrintedNameLine(notedBy) },
  ];

  return (
    <div className="ntp-paper-signature-footer">
      <div className="ntp-paper-signature-grid">
        {slots.map((slot) => (
          <div key={slot.label} className="ntp-paper-signature-col">
            <div className="ntp-paper-signature-role">{slot.label}</div>
            <div className="ntp-paper-signature-name">{slot.name || '\u00a0'}</div>
            <div className="ntp-paper-signature-caption">Signature over Printed Name</div>
          </div>
        ))}
      </div>
      <div className="ntp-paper-signature-date">
        <span className="ntp-paper-signature-date-label">Date and Time Printed:</span>
        <span className="ntp-paper-signature-date-value">{printedAt || '\u00a0'}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const ui = useNtpUi();
  if (ui === 'saas') {
    return (
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <div className="min-w-0">{children}</div>
      </div>
    );
  }
  return (
    <div className="ntp-paper-field flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold text-slate-800 leading-snug">{label}</span>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}

function NtpFieldLegend({ children }: { children: React.ReactNode }) {
  const ui = useNtpUi();
  return (
    <div
      className={
        ui === 'saas'
          ? 'text-sm font-semibold text-slate-800'
          : 'font-semibold'
      }
    >
      {children}
    </div>
  );
}

function NtpPersonnelSelect({
  role,
  nameValue,
  onNameChange,
  designationValue,
  onDesignationChange,
  readOnly,
  placeholder = 'Select laboratory staff…',
  signatureLine,
}: {
  role: LabPersonnelRole;
  nameValue: string;
  onNameChange: (name: string) => void;
  designationValue?: string;
  onDesignationChange?: (designation: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** Official print footer — show signature underline even on read-only paper */
  signatureLine?: boolean;
}) {
  const ui = useNtpUi();
  const inputClass = useNtpLineClass();
  const options = personnelForRole(role);
  const selectedId = personnelIdForExaminer(role, nameValue, '');

  if (readOnly) {
    return (
      <Line
        value={nameValue}
        onChange={() => undefined}
        readOnly
        plainPaper={ui === 'paper'}
        paperFieldUnderline={Boolean(signatureLine && ui === 'paper')}
      />
    );
  }

  return (
  <>
    <select
      value={selectedId}
      onChange={(e) => {
        const id = e.target.value;
        if (!id) {
          onNameChange('');
          onDesignationChange?.('');
          return;
        }
        const person = findPersonnelById(id);
        if (!person) return;
        onNameChange(person.name);
        onDesignationChange?.(person.designation);
      }}
      className={`${inputClass} cursor-pointer`}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
      {nameValue.trim() && !selectedId ? (
        <option value="__custom__" disabled>
          Current: {nameValue}
        </option>
      ) : null}
    </select>
    {designationValue?.trim() ? (
      <p className="text-[10px] text-slate-500 mt-1">{designationValue}</p>
    ) : null}
  </>
  );
}

function NtpSpecimenAccessionBlock({
  title,
  volume,
  onVolumeChange,
  quality,
  onQualityChange,
  reason,
  onReasonChange,
  readOnly,
}: {
  title: string;
  volume: string;
  onVolumeChange: (val: string) => void;
  quality: string;
  onQualityChange: (status: 'Accepted' | 'Rejected') => void;
  reason: string;
  onReasonChange: (val: string) => void;
  readOnly?: boolean;
}) {
  const ui = useNtpUi();
  const saas = ui === 'saas';
  const rejected = quality === 'Rejected';
  const statusLegendClass = saas
    ? 'text-xs font-semibold text-slate-600 shrink-0'
    : 'text-[10px] font-semibold text-slate-800 shrink-0';

  return (
    <div
      className={
        saas
          ? 'rounded-xl border border-[var(--lims-border)] bg-slate-50/50 p-3 space-y-2.5'
          : 'ntp-paper-specimen-block border border-slate-800 p-1 space-y-0.5'
      }
    >
      <div
        className={
          saas
            ? 'text-xs font-bold uppercase tracking-wide text-[#0878e8]'
            : 'ntp-paper-specimen-block-title text-[9px] font-bold uppercase text-slate-900 leading-tight'
        }
      >
        {title}
      </div>
      {saas ? (
        <Field label="Specimen Volume and Quality:">
          <Line
            value={volume}
            onChange={onVolumeChange}
            readOnly={readOnly}
            placeholder="e.g. mucopurulent; adequate volume"
          />
        </Field>
      ) : (
        <NtpPaperInlineField label="Specimen Volume and Quality:" className="w-full !flex-nowrap">
          <Line
            value={volume}
            onChange={onVolumeChange}
            readOnly={readOnly}
            plainPaper
            inlineValue
            placeholder="e.g. mucopurulent; adequate volume"
          />
        </NtpPaperInlineField>
      )}
      <div className="ntp-paper-specimen-status flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={statusLegendClass}>Accepted / Rejected:</span>
        <Box checked={quality === 'Accepted'} label="Accepted" readOnly={readOnly} onChange={() => onQualityChange('Accepted')} />
        <Box checked={quality === 'Rejected'} label="Rejected" readOnly={readOnly} onChange={() => onQualityChange('Rejected')} />
      </div>
      {rejected ? (
        saas ? (
          <Field label="Reason:">
            <Line value={reason} onChange={onReasonChange} readOnly={readOnly} />
          </Field>
        ) : (
          <NtpPaperInlineField label="Reason:" className="w-full !flex-nowrap">
            <Line
              value={reason}
              onChange={onReasonChange}
              readOnly={readOnly}
              plainPaper
              inlineValue
            />
          </NtpPaperInlineField>
        )
      ) : null}
    </div>
  );
}

/** '' = infer from dates; '1' = show; '0' = user removed (ignore dates). */
function ntpRequestHasSecondSpecimen(values: Values): boolean {
  if (values.request_spec2_active === '0') return false;
  if (values.request_spec2_active === '1') return true;
  return (
    (values.spec2_collected || '').trim().length > 0 ||
    (values.spec2_dispatched || '').trim().length > 0
  );
}

function NtpSpecimenAccessionFields({
  values,
  onChange,
  readOnly,
  showSecondSpecimen = true,
}: {
  values: Values;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
  showSecondSpecimen?: boolean;
}) {
  const ui = useNtpUi();
  const setSpecimenQuality = (which: 1 | 2, status: 'Accepted' | 'Rejected') => {
    if (which === 1) {
      onChange('specimenQuality', status);
      if (status === 'Accepted') onChange('specimenQualityReason', '');
    } else {
      onChange('spec2_quality', status);
      if (status === 'Accepted') onChange('spec2_qualityReason', '');
    }
  };

  return (
    <div
      className={`grid ${
        ui === 'paper'
          ? `${showSecondSpecimen ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 mt-1`
          : `${showSecondSpecimen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-3`
      }`}
    >
      <NtpSpecimenAccessionBlock
        title="Specimen 1"
        volume={values.specimenVolumeQuality || ''}
        onVolumeChange={(val) => onChange('specimenVolumeQuality', val)}
        quality={values.specimenQuality || ''}
        onQualityChange={(status) => setSpecimenQuality(1, status)}
        reason={values.specimenQualityReason || ''}
        onReasonChange={(val) => onChange('specimenQualityReason', val)}
        readOnly={readOnly}
      />
      {showSecondSpecimen ? (
        <NtpSpecimenAccessionBlock
          title="Specimen 2"
          volume={values.specimenVolumeQuality2 || ''}
          onVolumeChange={(val) => onChange('specimenVolumeQuality2', val)}
          quality={values.spec2_quality || ''}
          onQualityChange={(status) => setSpecimenQuality(2, status)}
          reason={values.spec2_qualityReason || ''}
          onReasonChange={(val) => onChange('spec2_qualityReason', val)}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

/** full = paper-style (print / form library); workflow = collapsible steps on sample detail */
export type NtpLabRequestFormLayout = 'full' | 'workflow';

const NTP_WORKFLOW_SLIDES = [
  { id: 'request', title: 'Request', hint: 'Sending facility & tests' },
  { id: 'receive', title: 'Receive', hint: 'Laboratory accession' },
  { id: 'results', title: 'Results', hint: 'Diagnostics & release' },
] as const;

function NtpWorkflowProgress({
  slides,
  activeIndex,
  onSelect,
}: {
  slides: readonly { id: string; title: string; hint: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const active = slides[activeIndex];
  const progressPct = ((activeIndex + 1) / slides.length) * 100;

  return (
    <div className="print:hidden space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          Step <span className="font-semibold text-slate-800">{activeIndex + 1}</span> of{' '}
          {slides.length}
        </span>
        <span className="font-semibold text-[#0878e8]">{active?.hint}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden" aria-hidden>
        <div
          className="h-full bg-[#0878e8] transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="Form progress">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(index)}
              className={`flex-1 min-w-[5.5rem] rounded-lg border px-2 py-2 text-center transition ${
                isActive
                  ? 'border-[#0878e8] bg-[#0878e8]/10 shadow-sm'
                  : isComplete
                    ? 'border-emerald-200 bg-emerald-50/90'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? 'text-[#0878e8]' : isComplete ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {index + 1}
              </div>
              <div
                className={`text-[10px] sm:text-xs font-semibold truncate mt-0.5 ${
                  isActive ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {slide.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NtpFormSection({
  step,
  title,
  subtitle,
  summary,
  collapsible,
  defaultOpen,
  hidden,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  summary?: string;
  collapsible: boolean;
  defaultOpen: boolean;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const ui = useNtpUi();
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;
  const saas = ui === 'saas';

  if (hidden) return null;

  const headerInner = (
    <>
      <div className="min-w-0 text-left flex-1">
        <div
          className={
            saas
              ? 'flex flex-wrap items-center gap-2 font-bold text-sm text-[var(--lims-navy)]'
              : 'font-bold text-[11px] uppercase tracking-wide text-slate-800'
          }
        >
          {saas ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                {step}
              </span>
              <span>{title}</span>
            </>
          ) : step === 'Request' ? (
            <span>1. REQUEST</span>
          ) : (
            <>
              <span>{step}. </span>
              <span>{title}</span>
            </>
          )}
        </div>
        <div
          className={
            saas ? 'text-xs text-slate-500 mt-1' : 'font-semibold italic text-[9px] text-slate-600 leading-tight mt-0.5'
          }
        >
          {subtitle}
        </div>
        {collapsible && !isOpen && summary ? (
          <div className={`mt-1 truncate ${saas ? 'text-xs text-slate-600' : 'text-[10px] text-slate-700'}`}>
            {summary}
          </div>
        ) : null}
      </div>
      {collapsible ? (
        <span
          className={`shrink-0 print:hidden flex items-center gap-0.5 font-semibold ${
            saas ? 'text-xs text-[#0878e8]' : 'text-[10px] text-[#0176d3]'
          }`}
        >
          {isOpen ? 'Collapse' : 'Expand'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      ) : null}
    </>
  );

  const sectionClass = saas
    ? 'rounded-xl border border-[var(--lims-border)] bg-white shadow-sm overflow-hidden ntp-form-section'
    : 'border border-slate-800 ntp-form-section';

  const headerClass = saas
    ? 'w-full bg-gradient-to-r from-slate-50 to-sky-50/40 border-b border-[var(--lims-border)] px-4 py-3 flex items-start justify-between gap-2 text-left'
    : 'w-full bg-slate-100 border-b border-slate-800 px-2 py-1 flex items-start justify-between gap-1.5 text-left';

  const bodyClass = saas
    ? `ntp-section-body px-4 py-4 space-y-4 ${isOpen ? '' : 'hidden print:block'}`
    : `ntp-section-body p-1.5 space-y-1 ${isOpen ? '' : 'hidden print:block'}`;

  return (
    <section className={sectionClass}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`${headerClass} print:pointer-events-none cursor-pointer`}
          aria-expanded={isOpen}
        >
          {headerInner}
        </button>
      ) : (
        <div className={headerClass}>{headerInner}</div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export const NtpLabRequestForm: React.FC<{
  values: Values;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
  shortName?: string;
  panelTitle?: string;
  layout?: NtpLabRequestFormLayout;
  /** Catalog examinations on this result panel (lab staff workflow). */
  assignedExaminations?: string[];
  /** QR on letterhead (official print / verification). */
  verificationQr?: React.ReactNode;
}> = ({
  values,
  onChange,
  readOnly,
  shortName = 'RF-10 Laboratory Request',
  panelTitle = 'Form 2a. LABORATORY REQUEST AND RESULT FORM',
  layout = 'full',
  assignedExaminations,
  verificationQr,
}) => {
  const v = (key: string) => values[key] || '';
  const set = (key: string) => (val: string) => onChange(key, val);
  const checked = (key: string) => v(key) === '1';
  const toggle = (key: string, alsoClear?: string[]) => (on: boolean) => {
    onChange(key, on ? '1' : '');
    if (!on && alsoClear?.length) alsoClear.forEach((k) => onChange(k, ''));
  };
  const pick = (key: string, option: string) => onChange(key, v(key) === option ? '' : option);
  const repeatCollectionYes = v('repeatCollection') === 'Yes';
  const setRepeatCollection = (choice: 'No' | 'Yes') => {
    onChange('repeatCollection', choice);
    if (choice === 'No') onChange('repeatReason', '');
  };
  const genericResultKeys = [
    'res_result_reading1',
    'res_result_reading2',
    'res_result_diagnosis',
    'res_result_remarks',
  ] as const;

  const clearKeysForRow = (t: DiagnosticResultRow) => {
    if (t.kind === 'smear') return [...SMEAR_RESULT.clearKeys];
    const pk = molecularPerTestKeys(t);
    return [t.id, pk.r1, pk.r2, pk.r3, ...genericResultKeys];
  };

  const maybeClearResultRemarks = (reading1: string, rifReading3: string) => {
    if (!needsNtpResultRemarks(reading1, rifReading3)) onChange('res_result_remarks', '');
  };

  const syncMolecularPerTestFields = (
    test: DiagnosticResultRow,
    patch: Partial<Record<(typeof genericResultKeys)[number], string>>
  ) => {
    const merged = { ...values, ...patch };
    const r1 = merged.res_result_reading1 || '';
    const r2 = merged.res_result_reading2 || '';
    const r3 = merged.res_result_diagnosis || '';
    const pk = molecularPerTestKeys(test);
    onChange(pk.r1, r1);
    onChange(pk.r2, r2);
    onChange(pk.r3, r3);
    onChange(test.id, formatNtpMolecularOfficialLine(r1, r2, r3));
  };

  const setMolecularResult = (
    test: DiagnosticResultRow,
    key: (typeof genericResultKeys)[number],
    val: string
  ) => {
    onChange(key, val);
    syncMolecularPerTestFields(test, { [key]: val });
  };

  const visibleDiagnosticChkIds = new Set(DIAGNOSTIC_RESULT_ROWS.map((t) => t.chkId));
  const rawSelectedDiagnosticChkId = resolveNtpSelectedDiagnosticChkId(values);
  const selectedDiagnosticChkId = visibleDiagnosticChkIds.has(rawSelectedDiagnosticChkId)
    ? rawSelectedDiagnosticChkId
    : '';
  const selectedDiagnosticTest = DIAGNOSTIC_RESULT_ROWS.find(
    (t) => t.chkId === selectedDiagnosticChkId
  );
  const workflow = layout === 'workflow';

  const molecularReading1 = v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0];
  const molecularRifReading3 = v('res_result_diagnosis');

  const workflowEntryMode = workflow && !readOnly;
  const displayDiagnosticRows = useMemo(
    () => resolveNtpDiagnosticRowsForForm(values, { workflowEntry: workflowEntryMode }),
    [values, workflowEntryMode]
  );
  const isSmearResults = selectedDiagnosticTest?.kind === 'smear';
  const showSmearSpec2 =
    isSmearResults &&
    (v('smear_spec2_active') === '1' ||
      v('smear2_reading1').trim().length > 0 ||
      v('smear2_reading2').trim().length > 0);
  const smearSpecimenRowCount = showSmearSpec2 ? 2 : 1;
  const printSmearSpec2 =
    v('smear_spec2_active') === '1' ||
    v('smear2_reading1').trim().length > 0 ||
    v('smear2_reading2').trim().length > 0;

  const clearSmearSpec2 = () => {
    const next = { ...values };
    SMEAR_SPEC2_KEYS.forEach((key) => {
      next[key] = '';
      onChange(key, '');
    });
    onChange('smear_diagnosis', deriveCombinedSmearLabDiagnosis(next, false));
  };

  const syncCombinedSmearLabDiagnosis = (
    patch: Record<string, string>,
    includeSecondSpecimen: boolean
  ) => {
    onChange('smear_diagnosis', deriveCombinedSmearLabDiagnosis({ ...values, ...patch }, includeSecondSpecimen));
  };

  const handleSmearSpecimenChange = (key: string, val: string) => {
    onChange(key, val);
    syncCombinedSmearLabDiagnosis({ [key]: val }, showSmearSpec2);
  };

  const pushNtpState = (next: Values) => {
    for (const key of NTP_FIELD_KEYS) {
      const prev = values[key] || '';
      const cur = next[key] || '';
      if (prev !== cur) onChange(key, cur);
    }
  };

  const patchFromTestRequested = (patch: Record<string, string>) => {
    const next = { ...values, ...patch };
    syncNtpResultChecksFromRequest(next);
    pushNtpState(next);
  };

  const requestedResultChkIds = useMemo(() => {
    const ids = new Set<string>();
    Object.entries(NTP_REQ_TO_RESULT_CHECK).forEach(([reqKey, resCk]) => {
      if (values[reqKey] === '1') ids.add(resCk);
    });
    return ids;
  }, [values]);

  const requestedDiagnosticRows = useMemo(
    () => DIAGNOSTIC_RESULT_ROWS.filter((t) => requestedResultChkIds.has(t.chkId)),
    [requestedResultChkIds]
  );

  const handleSingleDiagnosticPick = (pickedChkId: string) => {
    if (
      pickedChkId &&
      requestedResultChkIds.size > 0 &&
      !requestedResultChkIds.has(pickedChkId)
    ) {
      return;
    }
    const currentChk = selectedDiagnosticChkId || resolveNtpSelectedDiagnosticChkId(values);
    const currentTest = DIAGNOSTIC_RESULT_ROWS.find((t) => t.chkId === currentChk);
    if (
      currentTest &&
      currentTest.kind !== 'smear' &&
      pickedChkId &&
      currentChk &&
      currentChk !== pickedChkId
    ) {
      syncMolecularPerTestFields(currentTest, {});
    }
    const pickedTest = DIAGNOSTIC_RESULT_ROWS.find((t) => t.chkId === pickedChkId);
    if (pickedTest && pickedTest.kind !== 'smear') {
      const pk = molecularPerTestKeys(pickedTest);
      onChange('res_result_reading1', values[pk.r1] || '');
      onChange('res_result_reading2', values[pk.r2] || '');
      onChange('res_result_diagnosis', values[pk.r3] || '');
    } else if (pickedTest?.kind === 'smear') {
      onChange('res_result_reading1', '');
      onChange('res_result_reading2', '');
      onChange('res_result_diagnosis', '');
    }
    const next: Values = { ...values, res_diagnostic_test: pickedChkId };
    syncNtpResultChecksFromRequest(next);
    pushNtpState(next);
  };

  const uiMode: NtpUiMode = workflow && !readOnly ? 'saas' : 'paper';
  const showRequestSpec2 = uiMode === 'paper' ? true : ntpRequestHasSecondSpecimen(values);
  const requestSpecimenRowNums = showRequestSpec2 ? ([1, 2] as const) : ([1] as const);
  const addRequestSpec2 = () => onChange('request_spec2_active', '1');
  const clearRequestSpec2 = () => {
    onChange('request_spec2_active', '0');
    onChange('spec2_collected', '');
    onChange('spec2_dispatched', '');
    onChange('spec2_quality', '');
    onChange('spec2_qualityReason', '');
    onChange('specimenVolumeQuality2', '');
  };
  const useSaasResultsPanel = workflowEntryMode && uiMode === 'saas';
  /** Smear and molecular (Xpert, etc.) use different column sets on Form 2a — split when both appear on print. */
  const splitDiagnosticTables =
    !useSaasResultsPanel &&
    displayDiagnosticRows.some((t) => t.kind === 'smear') &&
    displayDiagnosticRows.some((t) => t.kind !== 'smear');
  const useSmearColumnLayout =
    !useSaasResultsPanel &&
    !splitDiagnosticTables &&
    displayDiagnosticRows.length > 0 &&
    (workflowEntryMode
      ? displayDiagnosticRows[0]?.kind === 'smear'
      : displayDiagnosticRows.every((t) => t.kind === 'smear'));
  const diagnosticTableGroups = useMemo(() => {
    if (displayDiagnosticRows.length === 0) {
      return [{ rows: [] as DiagnosticResultRow[], smearLayout: false }];
    }
    if (splitDiagnosticTables) {
      const molecular = displayDiagnosticRows.filter((t) => t.kind !== 'smear');
      const smear = displayDiagnosticRows.filter((t) => t.kind === 'smear');
      const groups: { rows: DiagnosticResultRow[]; smearLayout: boolean }[] = [];
      if (molecular.length) groups.push({ rows: molecular, smearLayout: false });
      if (smear.length) groups.push({ rows: smear, smearLayout: true });
      return groups;
    }
    return [{ rows: displayDiagnosticRows, smearLayout: useSmearColumnLayout }];
  }, [displayDiagnosticRows, splitDiagnosticTables, useSmearColumnLayout]);
  const useWorkflowSlides = workflow && !readOnly;
  const [workflowSlide, setWorkflowSlide] = useState(0);
  const activeSlideId = NTP_WORKFLOW_SLIDES[workflowSlide]?.id;
  const slideVisible = (id: string) => !useWorkflowSlides || activeSlideId === id;
  const collapsible = workflow && !readOnly && !useWorkflowSlides;
  const tableClass =
    uiMode === 'saas' ? 'lims-table w-full text-sm' : 'w-full border border-slate-800 border-collapse';
  const formGridClass =
    uiMode === 'saas' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-2 gap-x-3 gap-y-1.5';
  const patientLocked = (fieldKey: string) =>
    Boolean(readOnly || (workflow && NTP_PATIENT_AUTO_FIELD_KEYS.has(fieldKey)));

  const requestSummary = [
    v('patientName') || 'Patient',
    v('tbCaseNo') ? `Case ${v('tbCaseNo')}` : '',
    REQUESTED_TESTS.filter((t) => checked(t.id))
      .map((t) => t.label)
      .slice(0, 2)
      .join(', '),
  ]
    .filter(Boolean)
    .join(' · ');

  const receiveSummary = [
    v('specimenReceivedBy') ? `Received by ${v('specimenReceivedBy')}` : '',
    v('specimenReceivedAt') ? v('specimenReceivedAt').replace('T', ' ') : '',
    v('specimenQuality') ? `Spec 1: ${v('specimenQuality')}` : '',
    v('spec2_quality') ? `Spec 2: ${v('spec2_quality')}` : '',
    v('specimenVolumeQuality') ? `S1 vol: ${v('specimenVolumeQuality')}` : '',
    v('specimenVolumeQuality2') ? `S2 vol: ${v('specimenVolumeQuality2')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const pickerInResultsTable = !workflow;

  return (
    <NtpUiContext.Provider value={uiMode}>
    <div
      className={
        uiMode === 'saas'
          ? 'ntp-form-root--saas text-slate-900 text-sm leading-normal space-y-4'
          : `text-slate-900 text-[11px] leading-tight space-y-2${readOnly ? ' ntp-official-result-form' : ''}`
      }
    >
      {workflow ? (
        <div className="print:hidden rounded-lg border border-[var(--lims-border)] bg-gradient-to-br from-white to-sky-50/40 px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8]">{shortName}</div>
            <div className="text-sm font-semibold text-[var(--lims-navy)] mt-0.5">{panelTitle}</div>
          </div>
          {verificationQr ? <div className="shrink-0">{verificationQr}</div> : null}
        </div>
      ) : (
        <ResultFormOrgBanner
          shortName={shortName}
          panelTitle={panelTitle}
          verificationQr={verificationQr}
        />
      )}

      {useWorkflowSlides ? (
        <NtpWorkflowProgress
          slides={NTP_WORKFLOW_SLIDES}
          activeIndex={workflowSlide}
          onSelect={setWorkflowSlide}
        />
      ) : workflow && !readOnly ? (
        <p className="print:hidden text-xs text-slate-600 bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2 leading-snug">
          Mark <span className="font-semibold text-slate-800">tests requested</span> on step 1, complete{' '}
          <span className="font-semibold text-slate-800">receive</span>, then enter{' '}
          <span className="font-semibold text-slate-800">results</span> (use the test tabs when multiple exams are on
          this form). Patient demographics come from the requisition.
        </p>
      ) : null}

      <NtpFormSection
        step="Request"
        title="Sending facility"
        subtitle={
          uiMode === 'paper'
            ? 'To be filled out by requesting facility Health Worker'
            : 'To be filled out by requesting facility health worker'
        }
        summary={requestSummary}
        collapsible={collapsible}
        defaultOpen={!workflow || useWorkflowSlides}
        hidden={!slideVisible('request')}
      >
        <div className={uiMode === 'paper' ? 'ntp-request-paper' : 'space-y-4'}>
          {uiMode === 'paper' ? (
            <>
              <div className="ntp-request-paper-patient border border-slate-800">
                <NtpPaperPatientRow>
                  <NtpPaperPatientCell colSpan={9} label="Name of Request Facility/Unit:">
                    <Line
                      value={v('facilityName')}
                      onChange={set('facilityName')}
                      readOnly={readOnly}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                  <NtpPaperPatientCell colSpan={3} label="Date of Request:" tone="date">
                    <Line
                      type="date"
                      value={v('dateOfRequest')}
                      onChange={set('dateOfRequest')}
                      readOnly={readOnly}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                </NtpPaperPatientRow>
                <NtpPaperPatientRow>
                  <NtpPaperPatientCell colSpan={9} label="Facility Contact Information:">
                    <Line
                      value={v('facilityContact')}
                      onChange={set('facilityContact')}
                      readOnly={readOnly}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                  <NtpPaperPatientCell colSpan={3} label="Requesting Physician:">
                    <Line
                      value={v('requestingPhysician')}
                      onChange={set('requestingPhysician')}
                      readOnly={readOnly}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                </NtpPaperPatientRow>
                <NtpPaperPatientRow>
                  <NtpPaperPatientCell colSpan={9} label="Patient's Full Name:">
                    <Line
                      value={v('patientName')}
                      onChange={set('patientName')}
                      readOnly={patientLocked('patientName')}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                  <NtpPaperPatientCell colSpan={1} label="Age:" tone="narrow">
                    <Line value={v('age')} onChange={set('age')} readOnly={patientLocked('age')} plainPaper />
                  </NtpPaperPatientCell>
                  <NtpPaperPatientCell colSpan={2} label="Sex:" tone="narrow">
                    <div className="ntp-request-paper-sex-row flex flex-wrap items-center justify-center gap-1 pt-0 min-h-[1rem]">
                      <Box checked={v('sex') === 'M'} label="M" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'M')} />
                      <Box checked={v('sex') === 'F'} label="F" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'F')} />
                    </div>
                  </NtpPaperPatientCell>
                </NtpPaperPatientRow>
                <NtpPaperPatientRow>
                  <NtpPaperPatientCell colSpan={9} label="Province/City:">
                    <Line
                      value={v('provinceCity')}
                      onChange={set('provinceCity')}
                      readOnly={patientLocked('provinceCity')}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                  <NtpPaperPatientCell colSpan={3} label="Patient's Contact Number:">
                    <Line
                      value={v('patientContact')}
                      onChange={set('patientContact')}
                      readOnly={patientLocked('patientContact')}
                      plainPaper
                    />
                  </NtpPaperPatientCell>
                </NtpPaperPatientRow>
              </div>
              <NtpPaperFormRow className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                <span className="text-[10px] font-semibold text-slate-900 shrink-0">Reason for Examination:</span>
                <Box
                  checked={v('treatmentPhase') === 'Diagnosis'}
                  label="Diagnosis"
                  readOnly={readOnly}
                  onChange={() => pick('treatmentPhase', 'Diagnosis')}
                />
                <Box
                  checked={v('treatmentPhase') === 'Baseline'}
                  label="Baseline"
                  readOnly={readOnly}
                  onChange={() => pick('treatmentPhase', 'Baseline')}
                />
                <Box
                  checked={v('treatmentPhase') === 'Follow-up'}
                  label="Follow-up"
                  readOnly={readOnly}
                  onChange={() => pick('treatmentPhase', 'Follow-up')}
                />
                <NtpPaperInlineField label="TB Case No.:" className="min-w-[10rem] flex-1">
                  <Line
                    value={v('tbCaseNo')}
                    onChange={set('tbCaseNo')}
                    readOnly={patientLocked('tbCaseNo')}
                    plainPaper
                  />
                </NtpPaperInlineField>
              </NtpPaperFormRow>
              <NtpPaperFormRow className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                <span className="text-[10px] font-semibold text-slate-900 shrink-0">History of Treatment:</span>
                <Box checked={v('diagnosis') === 'New'} label="New" readOnly={readOnly} onChange={() => pick('diagnosis', 'New')} />
                <Box
                  checked={v('diagnosis') === 'Retreatment'}
                  label="Retreatment"
                  readOnly={readOnly}
                  onChange={() => pick('diagnosis', 'Retreatment')}
                />
                <NtpPaperInlineField label="Month of Treatment:" className="min-w-[10rem] flex-1">
                  <Line
                    value={v('monthOfTreatment')}
                    onChange={set('monthOfTreatment')}
                    readOnly={readOnly}
                    plainPaper
                  />
                </NtpPaperInlineField>
              </NtpPaperFormRow>
              <NtpPaperFormRow>
                <div className="text-[10px] font-semibold text-slate-900 mb-1">Test Requested:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1">
                  {NTP_REQUESTED_TESTS_PAPER_COLS.map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-y-0.5 min-w-0">
                      {col.map((test) => (
                        <Box
                          key={test.id}
                          checked={checked(test.id)}
                          label={test.label}
                          readOnly={readOnly}
                          onChange={(on) => patchFromTestRequested({ [test.id]: on ? '1' : '' })}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </NtpPaperFormRow>
              <NtpPaperFormRow className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[10px] font-semibold text-slate-900 shrink-0">Type of Specimen:</span>
                <Box checked={v('specimenType') === 'Sputum'} label="Sputum" readOnly={readOnly} onChange={() => pick('specimenType', 'Sputum')} />
                <Box
                  checked={v('specimenType') === 'Other'}
                  label="Other (specify)"
                  readOnly={readOnly}
                  onChange={() => pick('specimenType', 'Other')}
                />
                {v('specimenType') === 'Other' ? (
                  <span className="min-w-[8rem] flex-1 max-w-xs">
                    <Line value={v('specimenOther')} onChange={set('specimenOther')} readOnly={readOnly} />
                  </span>
                ) : (
                  <span className="min-w-[8rem] flex-1 max-w-xs border-b border-slate-800 min-h-[1.125rem]" aria-hidden />
                )}
              </NtpPaperFormRow>
              <NtpPaperFormRow className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[10px] font-semibold text-slate-900 shrink-0">Repeat Collection?</span>
                <Box
                  checked={v('repeatCollection') === 'No'}
                  label="No"
                  readOnly={readOnly}
                  onChange={() => setRepeatCollection('No')}
                />
                <Box
                  checked={v('repeatCollection') === 'Yes'}
                  label="Yes"
                  readOnly={readOnly}
                  onChange={() => setRepeatCollection('Yes')}
                />
                {repeatCollectionYes ? (
                  <NtpPaperInlineField label="Reason:" className="min-w-[12rem] flex-1">
                    <Line value={v('repeatReason')} onChange={set('repeatReason')} readOnly={readOnly} />
                  </NtpPaperInlineField>
                ) : null}
              </NtpPaperFormRow>
            </>
          ) : (
            <>
              <div className={formGridClass}>
                <Field label="Name of Request Facility/Unit:">
                  <Line value={v('facilityName')} onChange={set('facilityName')} readOnly={readOnly} />
                </Field>
                <Field label="Date of Request:">
                  <Line type="date" value={v('dateOfRequest')} onChange={set('dateOfRequest')} readOnly={readOnly} />
                </Field>
                <Field label="Facility contact information:">
                  <Line value={v('facilityContact')} onChange={set('facilityContact')} readOnly={readOnly} />
                </Field>
                <Field label="Requesting Physician:">
                  <Line value={v('requestingPhysician')} onChange={set('requestingPhysician')} readOnly={readOnly} />
                </Field>
                <Field label="Patient's Full Name:">
                  <Line value={v('patientName')} onChange={set('patientName')} readOnly={patientLocked('patientName')} />
                </Field>
                {uiMode === 'saas' ? (
                  <div className="space-y-1.5">
                    <Field label="Age:">
                      <Line value={v('age')} onChange={set('age')} readOnly={patientLocked('age')} />
                    </Field>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">Sex</span>
                      <div className="flex flex-wrap gap-2">
                        <Box checked={v('sex') === 'M'} label="Male" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'M')} />
                        <Box checked={v('sex') === 'F'} label="Female" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'F')} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-3 sm:col-span-2">
                    <Field label="Age:">
                      <Line value={v('age')} onChange={set('age')} readOnly={patientLocked('age')} />
                    </Field>
                    <div className="ntp-paper-field flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] font-semibold text-slate-800">Sex:</span>
                      <div className="flex flex-wrap items-center gap-3 pt-0.5">
                        <Box checked={v('sex') === 'M'} label="M" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'M')} />
                        <Box checked={v('sex') === 'F'} label="F" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'F')} />
                      </div>
                    </div>
                  </div>
                )}
                <Field label="Province/City:">
                  <Line value={v('provinceCity')} onChange={set('provinceCity')} readOnly={patientLocked('provinceCity')} />
                </Field>
                <Field label="Patient's Contact Number:">
                  <Line
                    value={v('patientContact')}
                    onChange={set('patientContact')}
                    readOnly={patientLocked('patientContact')}
                  />
                </Field>
              </div>

              <div className={uiMode === 'saas' ? 'space-y-4' : 'pt-1 space-y-3'}>
                <div className={uiMode === 'saas' ? 'space-y-2' : 'space-y-1.5'}>
                  <NtpFieldLegend>Reason for Examination:</NtpFieldLegend>
                  <div className={`flex flex-wrap items-center ${uiMode === 'saas' ? 'gap-2' : 'gap-x-4 gap-y-2'}`}>
                    <Box
                      checked={v('treatmentPhase') === 'Diagnosis'}
                      label="Diagnosis"
                      readOnly={readOnly}
                      onChange={() => pick('treatmentPhase', 'Diagnosis')}
                    />
                    <Box
                      checked={v('treatmentPhase') === 'Baseline'}
                      label="Baseline"
                      readOnly={readOnly}
                      onChange={() => pick('treatmentPhase', 'Baseline')}
                    />
                    <Box
                      checked={v('treatmentPhase') === 'Follow-up'}
                      label="Follow-up"
                      readOnly={readOnly}
                      onChange={() => pick('treatmentPhase', 'Follow-up')}
                    />
                  </div>
                  <Field label="TB Case No.:">
                    <Line value={v('tbCaseNo')} onChange={set('tbCaseNo')} readOnly={patientLocked('tbCaseNo')} />
                  </Field>
                </div>
                <div className={uiMode === 'saas' ? 'space-y-2' : 'space-y-1.5'}>
                  <NtpFieldLegend>History of Treatment:</NtpFieldLegend>
                  <div className={`flex flex-wrap items-center ${uiMode === 'saas' ? 'gap-2' : 'gap-x-4 gap-y-2'}`}>
                    <Box checked={v('diagnosis') === 'New'} label="New" readOnly={readOnly} onChange={() => pick('diagnosis', 'New')} />
                    <Box
                      checked={v('diagnosis') === 'Retreatment'}
                      label="Retreatment"
                      readOnly={readOnly}
                      onChange={() => pick('diagnosis', 'Retreatment')}
                    />
                  </div>
                  <Field label="Month of Treatment:">
                    <Line value={v('monthOfTreatment')} onChange={set('monthOfTreatment')} readOnly={readOnly} />
                  </Field>
                </div>
              </div>

              <div className="space-y-1.5">
                <NtpFieldLegend>Test Requested:</NtpFieldLegend>
                <div
                  className={
                    uiMode === 'saas'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'
                      : 'mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1'
                  }
                >
                  {REQUESTED_TESTS.map((test) => (
                    <Box
                      key={test.id}
                      checked={checked(test.id)}
                      label={test.label}
                      readOnly={readOnly}
                      onChange={(on) => patchFromTestRequested({ [test.id]: on ? '1' : '' })}
                    />
                  ))}
                </div>
              </div>

              <div className={uiMode === 'saas' ? 'space-y-4' : 'space-y-3'}>
                <div className="space-y-2">
                  <NtpFieldLegend>Type of Specimen:</NtpFieldLegend>
                  <div className="flex flex-wrap items-center gap-2">
                    <Box
                      checked={v('specimenType') === 'Sputum'}
                      label="Sputum"
                      readOnly={readOnly}
                      onChange={() => pick('specimenType', 'Sputum')}
                    />
                    <Box
                      checked={v('specimenType') === 'Other'}
                      label="Other (specify)"
                      readOnly={readOnly}
                      onChange={() => pick('specimenType', 'Other')}
                    />
                    {uiMode === 'saas' && v('specimenType') !== 'Other' ? null : (
                      <div
                        className={`min-w-0 flex-1 basis-full sm:basis-[14rem] sm:max-w-md ${
                          uiMode === 'saas' ? 'sm:pl-1' : ''
                        }`}
                      >
                        <Line
                          value={v('specimenType') === 'Other' ? v('specimenOther') : ''}
                          onChange={set('specimenOther')}
                          readOnly={readOnly || v('specimenType') !== 'Other'}
                          placeholder={v('specimenType') === 'Other' ? 'Specify specimen type' : ''}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <NtpFieldLegend>Repeat Collection?</NtpFieldLegend>
                  <div className="flex flex-wrap items-center gap-2">
                    <Box
                      checked={v('repeatCollection') === 'No'}
                      label="No"
                      readOnly={readOnly}
                      onChange={() => setRepeatCollection('No')}
                    />
                    <Box
                      checked={v('repeatCollection') === 'Yes'}
                      label="Yes"
                      readOnly={readOnly}
                      onChange={() => setRepeatCollection('Yes')}
                    />
                    {repeatCollectionYes ? (
                      <>
                        <span
                          className={
                            uiMode === 'saas'
                              ? 'text-xs font-semibold text-slate-600 shrink-0 pl-0.5'
                              : 'text-[10px] font-semibold text-slate-800 shrink-0'
                          }
                        >
                          Reason:
                        </span>
                        <div className="min-w-[10rem] flex-1 basis-[14rem] max-w-md">
                          <Line
                            value={v('repeatReason')}
                            onChange={set('repeatReason')}
                            readOnly={readOnly}
                            placeholder="Reason for repeat collection"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}

          <table className={`${tableClass}${uiMode === 'paper' ? ' ntp-request-specimen-table' : ''}`}>
            <thead>
              <tr className={uiMode === 'saas' ? undefined : 'bg-slate-50'}>
                <th className={uiMode === 'saas' ? 'w-16' : 'border border-slate-800 px-1 py-1 text-left font-semibold w-16'}>
                  Specimen
                </th>
                <th className={uiMode === 'saas' ? undefined : 'border border-slate-800 px-1 py-1 text-left font-semibold'}>
                  Date Collected
                </th>
                <th className={uiMode === 'saas' ? undefined : 'border border-slate-800 px-1 py-1 text-left font-semibold'}>
                  Date Dispatched to Laboratory
                </th>
                {uiMode === 'saas' && !readOnly && showRequestSpec2 ? (
                  <th className="w-0 p-0" aria-hidden />
                ) : null}
              </tr>
            </thead>
            <tbody>
              {requestSpecimenRowNums.map((n) => (
                <tr key={n}>
                  <td className={uiMode === 'saas' ? 'font-semibold text-slate-700' : 'border border-slate-800 px-2 py-1'}>
                    {uiMode === 'saas' ? `Specimen ${n}` : n}
                  </td>
                  <td className={uiMode === 'saas' ? undefined : 'border border-slate-800 px-1 py-1'}>
                    <Line
                      type="date"
                      value={v(`spec${n}_collected`)}
                      onChange={set(`spec${n}_collected`)}
                      readOnly={readOnly}
                      plainPaper={uiMode === 'paper'}
                    />
                  </td>
                  <td className={uiMode === 'saas' ? undefined : 'border border-slate-800 px-1 py-1'}>
                    <Line
                      type="date"
                      value={v(`spec${n}_dispatched`)}
                      onChange={set(`spec${n}_dispatched`)}
                      readOnly={readOnly}
                      plainPaper={uiMode === 'paper'}
                    />
                  </td>
                  {uiMode === 'saas' && !readOnly && n === 2 ? (
                    <td className="w-0 p-0 align-middle">
                      <button
                        type="button"
                        onClick={clearRequestSpec2}
                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 whitespace-nowrap pl-2"
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {uiMode === 'saas' && !readOnly ? (
            <div className="flex flex-wrap items-center gap-3 print:hidden -mt-1">
              {!showRequestSpec2 ? (
                <button
                  type="button"
                  onClick={addRequestSpec2}
                  className="text-xs font-semibold text-[#0176d3] hover:underline"
                >
                  + Add specimen 2
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearRequestSpec2}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                >
                  Remove specimen 2
                </button>
              )}
            </div>
          ) : null}

          {uiMode === 'paper' ? (
            <div className="ntp-paper-remarks-block">
              <div className="ntp-paper-remarks-label">Remarks</div>
              {readOnly ? (
                <div className="ntp-paper-remarks-value">{v('remarks') || '—'}</div>
              ) : (
                <textarea
                  value={v('remarks')}
                  onChange={(e) => onChange('remarks', e.target.value)}
                  rows={2}
                  placeholder="Pre-collection details, existing medical conditions, medications taken prior to testing, or other known risk factors"
                  className="ntp-paper-remarks-input w-full border border-slate-400 px-1 py-0.5 text-[10px] focus:outline-none focus:border-[#0176d3] resize-y min-h-[1.75rem]"
                />
              )}
              <p className="ntp-paper-remarks-hint">
                (i.e. pre-collection details; existing medical conditions, medications taken prior to screening,
                and/or known risk factors)
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <NtpFieldLegend>Remarks</NtpFieldLegend>
              {readOnly ? (
                <div className="min-h-[3rem] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">
                  {v('remarks') || '—'}
                </div>
              ) : (
                <textarea
                  value={v('remarks')}
                  onChange={(e) => onChange('remarks', e.target.value)}
                  rows={3}
                  placeholder="Pre-collection details, existing medical conditions, medications taken prior to testing, or other known risk factors"
                  className="lims-input w-full min-h-[4.5rem] text-sm py-2 resize-y"
                />
              )}
            </div>
          )}

          {uiMode === 'paper' ? (
            <NtpPaperPreparedSignoff
              preparedBy={v('preparedBy')}
              designation={v('preparedDesignation')}
              readOnly={readOnly}
              onPreparedBy={set('preparedBy')}
              onDesignation={set('preparedDesignation')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Prepared by">
                <NtpPersonnelSelect
                  role="performed"
                  nameValue={v('preparedBy')}
                  onNameChange={set('preparedBy')}
                  designationValue={v('preparedDesignation')}
                  onDesignationChange={set('preparedDesignation')}
                  readOnly={readOnly}
                />
              </Field>
              <Field label="Designation">
                <Line
                  value={v('preparedDesignation')}
                  onChange={set('preparedDesignation')}
                  readOnly={readOnly}
                />
              </Field>
            </div>
          )}
        </div>
      </NtpFormSection>

      <NtpFormSection
        step="Receive"
        title="Laboratory accession"
        subtitle="Receiving laboratory technician / medical technologist"
        summary={receiveSummary}
        collapsible={collapsible}
        defaultOpen={useWorkflowSlides}
        hidden={!slideVisible('receive')}
      >
          {uiMode === 'paper' ? (
            <div className="ntp-paper-receive-header border border-slate-800 mb-1">
              <NtpPaperPatientRow>
                <NtpPaperPatientCell colSpan={9} label="Name of Laboratory:">
                  <Line
                    value={v('labName') || 'PTSI-Q CENTRAL LABORATORY'}
                    onChange={set('labName')}
                    readOnly={readOnly}
                    plainPaper
                  />
                </NtpPaperPatientCell>
                <NtpPaperPatientCell colSpan={3} label="Date and Time Specimen Received:" tone="date">
                  <Line
                    type="datetime-local"
                    value={v('specimenReceivedAt')}
                    onChange={set('specimenReceivedAt')}
                    readOnly={readOnly}
                    plainPaper
                  />
                </NtpPaperPatientCell>
              </NtpPaperPatientRow>
              <NtpPaperPatientRow>
                <NtpPaperPatientCell colSpan={12} label="Specimen Received by:">
                  <NtpPersonnelSelect
                    role="performed"
                    nameValue={v('specimenReceivedBy')}
                    onNameChange={set('specimenReceivedBy')}
                    readOnly={readOnly}
                    placeholder="Select receiving staff…"
                  />
                </NtpPaperPatientCell>
              </NtpPaperPatientRow>
            </div>
          ) : (
            <div className={`${formGridClass} items-start`}>
              <div className="space-y-1.5">
                <Field label="Name of Laboratory:">
                  <Line
                    value={v('labName') || 'PTSI-Q CENTRAL LABORATORY'}
                    onChange={set('labName')}
                    readOnly={readOnly}
                  />
                </Field>
                <Field label="Specimen Received by:">
                  <NtpPersonnelSelect
                    role="performed"
                    nameValue={v('specimenReceivedBy')}
                    onNameChange={set('specimenReceivedBy')}
                    readOnly={readOnly}
                    placeholder="Select receiving staff…"
                  />
                </Field>
              </div>
              <div className="space-y-1.5">
                <Field label="Date and Time Specimen Received:">
                  <Line
                    type="datetime-local"
                    value={v('specimenReceivedAt')}
                    onChange={set('specimenReceivedAt')}
                    readOnly={readOnly}
                  />
                </Field>
              </div>
            </div>
          )}
          <NtpSpecimenAccessionFields
            values={values}
            onChange={onChange}
            readOnly={readOnly}
            showSecondSpecimen={uiMode === 'paper' ? true : ntpRequestHasSecondSpecimen(values)}
          />
      </NtpFormSection>

      <NtpFormSection
        step="Results"
        title="Diagnostic results & release"
        subtitle="Microscopist / medical technologist — same Form 2a sheet"
        collapsible={collapsible}
        defaultOpen
        hidden={!slideVisible('results')}
      >
          {workflow && requestedResultChkIds.size === 0 && !readOnly ? (
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 print:hidden mb-3">
              Mark at least one test under <span className="font-semibold">Test Requested</span> (Request step) — e.g.
              Smear Microscopy or Xpert MTB/RIF.
            </p>
          ) : null}
          <div className={formGridClass}>
            <Field label="Laboratory Serial Number:">
              <Line
                value={v('labSerial')}
                onChange={set('labSerial')}
                readOnly={readOnly}
                plainPaper={uiMode === 'paper'}
              />
            </Field>
            <Field label="Date Specimen Examined:">
              <Line
                type="date"
                value={v('dateExamined')}
                onChange={set('dateExamined')}
                readOnly={readOnly}
                plainPaper={uiMode === 'paper'}
              />
            </Field>
          </div>

          {workflow && requestedDiagnosticRows.length > 1 ? (
            <div className="print:hidden space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                Enter results for each requested test ({requestedDiagnosticRows.length} on this form)
              </p>
              <div
                className="flex flex-col sm:flex-row gap-2 p-1 rounded-xl border border-[var(--lims-border)] bg-slate-50/80"
                role="tablist"
                aria-label="Requested diagnostic tests"
              >
                {requestedDiagnosticRows.map((test) => {
                  const active = test.chkId === selectedDiagnosticChkId;
                  return (
                    <button
                      key={test.chkId}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSingleDiagnosticPick(test.chkId)}
                      className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                        active
                          ? 'bg-white border border-[#0878e8]/40 text-[#0878e8] shadow-sm'
                          : 'border border-transparent text-slate-700 hover:bg-white/80'
                      }`}
                    >
                      <span className="block truncate leading-snug">{test.label}</span>
                      <span
                        className={`block text-[10px] font-medium mt-0.5 ${active ? 'text-[#0878e8]/80' : 'text-slate-500'}`}
                      >
                        {active ? 'Editing now' : 'Tap to switch'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : workflow && requestedDiagnosticRows.length === 1 && !readOnly ? (
            <p className="print:hidden text-xs text-slate-500">
              Result entry:{' '}
              <span className="font-semibold text-slate-800">{requestedDiagnosticRows[0].label}</span>
            </p>
          ) : null}

          {useSaasResultsPanel ? (
            <div className="mt-3 space-y-3 print:hidden">
              {displayDiagnosticRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-sm text-slate-500 text-center">
                  Mark tests under Request, then choose a tab above to enter results.
                </div>
              ) : (
                displayDiagnosticRows.map((test) => {
                  const showCardTitle = requestedDiagnosticRows.length <= 1;
                  if (test.kind === 'smear') {
                    return (
                      <div
                        key={test.chkId}
                        className="rounded-xl border border-[var(--lims-border)] bg-white p-4 sm:p-5 space-y-4 shadow-sm"
                      >
                        {showCardTitle ? (
                          <h4 className="text-sm font-semibold text-[var(--lims-navy)]">{test.label}</h4>
                        ) : null}
                        <div className="space-y-3">
                          <SmearSpecimenBlock
                            specimenLabel="1"
                            readingKey="smear_reading1"
                            afbKey="smear_reading2"
                            values={values}
                            readOnly={readOnly}
                            onChange={handleSmearSpecimenChange}
                          />
                          {showSmearSpec2 ? (
                            <SmearSpecimenBlock
                              specimenLabel="2"
                              readingKey="smear2_reading1"
                              afbKey="smear2_reading2"
                              values={values}
                              readOnly={readOnly}
                              onChange={handleSmearSpecimenChange}
                            />
                          ) : null}
                        </div>
                        <Field label="Laboratory diagnosis">
                          <p className="text-[10px] text-slate-500 mb-1.5 -mt-1">
                            Combined from specimens 1 and 2 (when present)
                          </p>
                          <SmearLabDiagnosisSelect
                            value={
                              v('smear_diagnosis') ||
                              deriveCombinedSmearLabDiagnosis(values, showSmearSpec2)
                            }
                            onChange={set('smear_diagnosis')}
                            readOnly={readOnly}
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {!showSmearSpec2 ? (
                            <button
                              type="button"
                              onClick={() => {
                                onChange('smear_spec2_active', '1');
                                syncCombinedSmearLabDiagnosis({}, true);
                              }}
                              className="lims-btn-primary text-xs px-3 py-1.5 rounded-lg"
                            >
                              Add specimen 2
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={clearSmearSpec2}
                              className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                            >
                              Remove specimen 2
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={test.chkId}
                      className="rounded-xl border border-[var(--lims-border)] bg-white p-4 sm:p-5 space-y-4 shadow-sm"
                    >
                      {showCardTitle ? (
                        <h4 className="text-sm font-semibold text-[var(--lims-navy)]">{test.label}</h4>
                      ) : null}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Reading 1 — Mycobacterium tuberculosis">
                          <MtbReading1Select
                            value={v('res_result_reading1')}
                            onChange={(val) => {
                              if ((values[test.id] || '').trim()) onChange(test.id, '');
                              setMolecularResult(test, 'res_result_reading1', val);
                              if (val !== 'MTB DETECTED') onChange('res_result_reading2', '');
                              const rifAfter =
                                !reading1ShowsRifDropdown(val) ? '' : molecularRifReading3;
                              if (!reading1ShowsRifDropdown(val)) {
                                onChange('res_result_diagnosis', '');
                                onChange(test.id, '');
                              }
                              maybeClearResultRemarks(val, rifAfter);
                            }}
                            readOnly={readOnly}
                          />
                        </Field>
                        <Field label="Reading 2 — Bacillary load">
                          <MtbReading2LevelSelect
                            reading1={v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0]}
                            value={v('res_result_reading2')}
                            onChange={(val) => setMolecularResult(test, 'res_result_reading2', val)}
                            readOnly={readOnly}
                          />
                        </Field>
                        <Field label="Reading 3 — Rifampicin resistance">
                          <MtbRifReading3Select
                            reading1={v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0]}
                            value={v('res_result_diagnosis') || v(test.id)}
                            onChange={(val) => {
                              setMolecularResult(test, 'res_result_diagnosis', val);
                              maybeClearResultRemarks(molecularReading1, val);
                            }}
                            readOnly={readOnly}
                          />
                        </Field>
                      </div>
                      <NtpMolecularResultRemarksInline
                        show={needsNtpResultRemarks(
                          v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0],
                          v('res_result_diagnosis')
                        )}
                        value={v('res_result_remarks')}
                        readOnly={readOnly}
                        uiMode={uiMode}
                        onChange={(val) => onChange('res_result_remarks', val)}
                        workflowAlignUnderReading3
                      />
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {!useSaasResultsPanel ? (
          <>
            {diagnosticTableGroups.map((group, groupIndex) => {
              const smearLayout = group.smearLayout;
              const tableRows = group.rows;
              return (
          <table
            key={splitDiagnosticTables ? (smearLayout ? 'smear' : 'molecular') : 'all'}
            className={`${tableClass} ntp-results-diagnostic-table ${
              uiMode === 'saas' ? 'mt-3' : groupIndex === 0 ? 'mt-2' : 'mt-2'
            }`}
          >
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-800 px-2 py-1 text-left font-semibold w-[28%]">
                  Diagnostic Tests
                </th>
                {smearLayout ? (
                  <>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold w-16">
                      Specimen
                    </th>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Reading</th>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold">
                      Number of AFB
                    </th>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold w-[22%]">
                      Laboratory Diagnosis
                    </th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Reading 1</th>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Reading 2</th>
                    <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Reading 3</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={smearLayout ? 5 : 4}
                    className="border border-slate-800 px-2 py-2 text-[10px] text-slate-400"
                  >
                    Select one examination to enter results
                  </td>
                </tr>
              ) : (
                tableRows.map((test) => {
                  if (test.kind === 'smear') {
                    const spec2 =
                      workflowEntryMode && test.chkId === selectedDiagnosticChkId
                        ? showSmearSpec2
                        : printSmearSpec2;
                    const rowSpan = spec2 ? 2 : 1;
                    return (
                      <React.Fragment key={test.chkId}>
                        <tr>
                          <td
                            rowSpan={rowSpan}
                            className="border border-slate-800 px-2 py-1 align-top"
                          >
                            {pickerInResultsTable && test.chkId === selectedDiagnosticChkId ? (
                              <DiagnosticTestPicker
                                selectedChkId={selectedDiagnosticChkId}
                                readOnly={readOnly}
                                allowedChkIds={requestedResultChkIds}
                                onPick={handleSingleDiagnosticPick}
                              />
                            ) : (
                              <span className={`${ntpPaperTableValueClass} text-slate-900`}>{test.label}</span>
                            )}
                          </td>
                          <SmearSpecimenRow
                            specimenLabel="1"
                            readingKey="smear_reading1"
                            afbKey="smear_reading2"
                            values={values}
                            readOnly={readOnly}
                            onChange={handleSmearSpecimenChange}
                          />
                          <td
                            rowSpan={rowSpan}
                            className="border border-slate-800 px-2 py-1 align-middle"
                          >
                            {!readOnly ? (
                              <p className="text-[9px] text-slate-500 mb-1 print:hidden">
                                Combined result (specimens 1–2)
                              </p>
                            ) : null}
                            <SmearLabDiagnosisSelect
                              value={
                                v('smear_diagnosis') ||
                                deriveCombinedSmearLabDiagnosis(values, spec2)
                              }
                              onChange={set('smear_diagnosis')}
                              readOnly={readOnly}
                            />
                          </td>
                        </tr>
                        {spec2 ? (
                          <tr>
                            <SmearSpecimenRow
                              specimenLabel="2"
                              readingKey="smear2_reading1"
                              afbKey="smear2_reading2"
                              values={values}
                              readOnly={readOnly}
                              onChange={handleSmearSpecimenChange}
                            />
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  }

                  const { r1, r2, r3, combined } = molecularRowReadings(test, values);
                  const canEditRow =
                    workflowEntryMode && !readOnly && test.chkId === selectedDiagnosticChkId;
                  const useCombinedDisplay = combined && !canEditRow;
                  const remarksReading1 = canEditRow
                    ? v('res_result_reading1')
                    : useCombinedDisplay
                      ? parseNtpMolecularSplitFromText(r1).r1
                      : r1;
                  const remarksRif = canEditRow
                    ? v('res_result_diagnosis')
                    : useCombinedDisplay
                      ? parseNtpMolecularSplitFromText(r1).r3
                      : r3;
                  const showMolecularRemarks = needsNtpResultRemarks(
                    remarksReading1 || NTP_READING1_MTB_OPTIONS[0],
                    remarksRif
                  );

                  return (
                    <React.Fragment key={test.chkId}>
                    <tr>
                      <td className="border border-slate-800 px-2 py-1 align-top">
                        {pickerInResultsTable && test.chkId === selectedDiagnosticChkId ? (
                          <DiagnosticTestPicker
                            selectedChkId={selectedDiagnosticChkId}
                            readOnly={readOnly}
                            allowedChkIds={requestedResultChkIds}
                            onPick={handleSingleDiagnosticPick}
                          />
                        ) : (
                          <span className={`${ntpPaperTableValueClass} text-slate-900`}>{test.label}</span>
                        )}
                      </td>
                      {useCombinedDisplay ? (
                        <td
                          colSpan={3}
                          className={`border border-slate-800 px-2 py-1 align-top text-[11px] font-semibold ${
                            molecularCombinedLineIsAlert(r1) ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {r1 || '\u00a0'}
                        </td>
                      ) : (
                        <>
                          <td className="border border-slate-800 px-1 py-1 align-top">
                            <MtbReading1Select
                              value={canEditRow ? v('res_result_reading1') : r1}
                              onChange={(val) => {
                                if (!canEditRow) return;
                                if ((values[test.id] || '').trim()) onChange(test.id, '');
                                setMolecularResult(test, 'res_result_reading1', val);
                                if (val !== 'MTB DETECTED') onChange('res_result_reading2', '');
                                const rifAfter =
                                  !reading1ShowsRifDropdown(val) ? '' : molecularRifReading3;
                                if (!reading1ShowsRifDropdown(val)) {
                                  onChange('res_result_diagnosis', '');
                                  onChange(test.id, '');
                                }
                                maybeClearResultRemarks(val, rifAfter);
                              }}
                              readOnly={readOnly || !canEditRow}
                            />
                          </td>
                          <td className="border border-slate-800 px-1 py-1 align-top">
                            <MtbReading2LevelSelect
                              reading1={
                                (canEditRow ? v('res_result_reading1') : r1) ||
                                NTP_READING1_MTB_OPTIONS[0]
                              }
                              value={canEditRow ? v('res_result_reading2') : r2}
                              onChange={(val) => {
                                if (canEditRow) setMolecularResult(test, 'res_result_reading2', val);
                              }}
                              readOnly={readOnly || !canEditRow}
                            />
                          </td>
                          <td className="border border-slate-800 px-1 py-1 align-top">
                            <MtbRifReading3Select
                              reading1={
                                (canEditRow ? v('res_result_reading1') : r1) ||
                                NTP_READING1_MTB_OPTIONS[0]
                              }
                              value={
                                canEditRow ? v('res_result_diagnosis') || v(test.id) : r3
                              }
                              onChange={(val) => {
                                if (!canEditRow) return;
                                setMolecularResult(test, 'res_result_diagnosis', val);
                                maybeClearResultRemarks(molecularReading1, val);
                              }}
                              readOnly={readOnly || !canEditRow}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                    <NtpMolecularRemarksPaperTableRow
                      show={showMolecularRemarks}
                      value={v('res_result_remarks')}
                      colSpan={4}
                      readOnly={readOnly || !canEditRow}
                      onChange={(val) => onChange('res_result_remarks', val)}
                    />
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
              );
            })}
          </>
          ) : null}

          {isSmearResults && !readOnly && !useSaasResultsPanel ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-3 print:hidden">
              {!showSmearSpec2 ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange('smear_spec2_active', '1');
                    syncCombinedSmearLabDiagnosis({}, true);
                  }}
                  className="text-[10px] font-semibold text-[#0176d3] hover:underline"
                >
                  + Add specimen (max 2)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearSmearSpec2}
                  className="text-[10px] font-semibold text-slate-500 hover:text-rose-600"
                >
                  Remove specimen 2
                </button>
              )}
            </div>
          ) : null}

          {!workflowEntryMode ? (
            readOnly && uiMode === 'paper' ? (
              <NtpPaperSignatureFooter
                performedBy={v('performedBy')}
                verifiedBy={v('verifiedBy')}
                notedBy={v('notedBy')}
                printedAt={formatNtpOfficialDateTime(v('dateReleased'))}
              />
            ) : (
              <div className={uiMode === 'paper' ? 'ntp-paper-signature-footer' : undefined}>
                <div
                  className={`grid gap-3 pt-3 ${
                    uiMode === 'paper' ? 'grid-cols-3' : `grid-cols-1 sm:grid-cols-3 ${uiMode === 'saas' ? 'pt-1' : ''}`
                  }`}
                >
                  <Field label="Performed by">
                    <NtpPersonnelSelect
                      role="performed"
                      nameValue={v('performedBy')}
                      onNameChange={set('performedBy')}
                      readOnly={readOnly}
                      signatureLine
                    />
                    {uiMode === 'paper' ? (
                      <div className="text-center text-[10px]">Signature over Printed Name</div>
                    ) : null}
                  </Field>
                  <Field label="Verified by">
                    <NtpPersonnelSelect
                      role="verified"
                      nameValue={v('verifiedBy')}
                      onNameChange={set('verifiedBy')}
                      readOnly={readOnly}
                      signatureLine
                    />
                    {uiMode === 'paper' ? (
                      <div className="text-center text-[10px]">Signature over Printed Name</div>
                    ) : null}
                  </Field>
                  <Field label="Noted by">
                    <NtpPersonnelSelect
                      role="pathologist"
                      nameValue={v('notedBy')}
                      onNameChange={set('notedBy')}
                      readOnly={readOnly}
                      signatureLine
                    />
                    {uiMode === 'paper' ? (
                      <div className="text-center text-[10px]">Signature over Printed Name</div>
                    ) : null}
                  </Field>
                </div>
                <Field label="Date and Time Printed:">
                  <Line
                    type="datetime-local"
                    value={v('dateReleased')}
                    onChange={set('dateReleased')}
                    readOnly={readOnly}
                    plainPaper={uiMode === 'paper'}
                    paperFieldUnderline={readOnly && uiMode === 'paper'}
                  />
                </Field>
              </div>
            )
          ) : null}
      </NtpFormSection>

      {useWorkflowSlides ? (
        <div className="print:hidden flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--lims-border)]">
          <button
            type="button"
            disabled={workflowSlide === 0}
            onClick={() => setWorkflowSlide((i) => Math.max(0, i - 1))}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Back
          </button>
          <p className="text-[10px] text-center text-slate-500 sm:order-none">
            {workflowSlide < NTP_WORKFLOW_SLIDES.length - 1
              ? 'Continue when this step is complete — official print shows all sections.'
              : 'Last step — save from the page toolbar when finished.'}
          </p>
          {workflowSlide < NTP_WORKFLOW_SLIDES.length - 1 ? (
            <button
              type="button"
              onClick={() => setWorkflowSlide((i) => Math.min(NTP_WORKFLOW_SLIDES.length - 1, i + 1))}
              className="lims-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg"
            >
              Continue
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setWorkflowSlide(0)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              Review from start
            </button>
          )}
        </div>
      ) : null}
    </div>
    </NtpUiContext.Provider>
  );
};
