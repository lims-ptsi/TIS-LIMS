import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ResultFormOrgBanner } from '../common/ResultFormOrgBanner';
import {
  NTP_REQ_TO_RESULT_CHECK,
  syncNtpResultChecksFromRequest,
} from '../../utils/ntpFormPrefill';

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
  'remarks',
  'preparedBy',
  'preparedDesignation',
  'labName',
  'specimenReceivedAt',
  'specimenReceivedBy',
  'specimenQuality',
  'specimenQualityReason',
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

const REQUESTED_TESTS: { id: string; label: string }[] = [
  { id: 'req_xpert', label: 'Xpert MTB/RIF' },
  { id: 'req_xpert_ultra', label: 'Xpert MTB/RIF Ultra' },
  { id: 'req_truenat_plus', label: 'Truenat MTB Plus' },
  { id: 'req_truenat_rif', label: 'Truenat MTB-RIF Dx' },
  { id: 'req_smear', label: 'Smear Microscopy' },
  { id: 'req_xpert_xdr', label: 'Xpert MTB/XDR' },
  { id: 'req_lpa', label: 'Line Probe Assay' },
  { id: 'req_culture', label: 'TB Culture' },
  { id: 'req_pdst', label: 'Phenotypic DST' },
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

const line =
  'w-full border-0 border-b border-slate-800 bg-transparent px-1 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:border-[#0176d3]';

function Line({
  value,
  onChange,
  readOnly,
  type = 'text',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}) {
  if (readOnly) {
    return <span className="inline-block min-w-[4rem] border-b border-slate-800 px-1 text-[11px] font-semibold">{value || '\u00a0'}</span>;
  }
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={line}
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
  const options = NTP_SMEAR_RESULT_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[0];
  const isRed = NTP_SMEAR_RESULT_RED.has(display);

  if (readOnly) {
    return (
      <span
        className={`inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold ${
          isRed ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value)}
      className={`${line} cursor-pointer pr-6 font-semibold ${isRed ? 'text-red-600' : 'text-slate-900'}`}
    >
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={NTP_SMEAR_RESULT_RED.has(opt) ? 'text-red-600 font-semibold' : 'text-slate-900'}
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
  const options = NTP_SMEAR_LAB_DIAGNOSIS_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[1];
  const isRed = NTP_SMEAR_LAB_DIAGNOSIS_RED.has(display);

  if (readOnly) {
    return (
      <span
        className={`inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold ${
          isRed ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value)}
      className={`${line} cursor-pointer pr-6 font-semibold ${isRed ? 'text-red-600' : 'text-slate-900'}`}
    >
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={NTP_SMEAR_LAB_DIAGNOSIS_RED.has(opt) ? 'text-red-600 font-semibold' : 'text-slate-900'}
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
  const v = (key: string) => values[key] || '';
  const reading = v(readingKey);

  return (
    <>
      <td className="border border-slate-800 px-2 py-1 align-top text-center text-[11px] font-semibold">
        {specimenLabel}
      </td>
      <td className="border border-slate-800 px-1 py-1 align-top">
        <SmearResultSelect
          value={reading}
          onChange={(val) => {
            onChange(readingKey, val);
            if (val !== '+n') onChange(afbKey, '');
          }}
          readOnly={readOnly}
        />
      </td>
      <td className="border border-slate-800 px-1 py-1 align-top">
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
    return (
      <span className="inline-block w-full border-b border-slate-300 px-1 text-[10px] text-slate-400">
        {'\u00a0'}
      </span>
    );
  }

  return (
    <Line
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder="Enter count"
    />
  );
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
  const options = NTP_READING1_MTB_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];
  const display = value || choices[0];
  const isRed = NTP_READING1_MTB_RED.has(display);

  if (readOnly) {
    return (
      <span
        className={`inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold ${
          isRed ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value)}
      className={`${line} cursor-pointer pr-6 font-semibold ${isRed ? 'text-red-600' : 'text-slate-900'}`}
    >
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={NTP_READING1_MTB_RED.has(opt) ? 'text-red-600 font-semibold' : 'text-slate-900'}
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
  const showLevels = reading1 === 'MTB DETECTED';
  const options = NTP_READING2_MTB_LEVEL_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];

  if (!showLevels) {
    return (
      <span className="inline-block w-full border-b border-slate-300 px-1 text-[10px] text-slate-400">
        {'\u00a0'}
      </span>
    );
  }

  const display = value || choices[0];

  if (readOnly) {
    return (
      <span className="inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold text-slate-900">
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value)}
      className={`${line} cursor-pointer pr-6 font-semibold text-slate-900`}
    >
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
  const showRif = reading1ShowsRifDropdown(reading1);
  const options = NTP_READING3_RIF_OPTIONS;
  const choices =
    value.trim() && !options.includes(value as (typeof options)[number])
      ? [value, ...options]
      : [...options];

  if (!showRif) {
    return (
      <span className="inline-block w-full border-b border-slate-300 px-1 text-[10px] text-slate-400">
        {'\u00a0'}
      </span>
    );
  }

  const display = value || choices[0];
  const isRed = NTP_READING3_RIF_RED.has(display);

  if (readOnly) {
    return (
      <span
        className={`inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold ${
          isRed ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {display || '\u00a0'}
      </span>
    );
  }

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value)}
      className={`${line} cursor-pointer pr-6 font-semibold ${isRed ? 'text-red-600' : 'text-slate-900'}`}
    >
      {choices.map((opt) => (
        <option
          key={opt}
          value={opt}
          className={NTP_READING3_RIF_RED.has(opt) ? 'text-red-600 font-semibold' : 'text-slate-900'}
        >
          {opt}
        </option>
      ))}
    </select>
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
    return (
      <span className="inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold">
        {label}
      </span>
    );
  }

  return (
    <select
      value={selectedChkId}
      onChange={(e) => onPick(e.target.value)}
      className={`${line} cursor-pointer pr-6`}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-1 min-w-0">
      <span className="shrink-0 text-[11px] text-slate-800">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/** Up to two underline rows for volume/quality notes (second row via “Add line”). */
function SpecimenVolumeQualityFields({
  line1,
  line2,
  onChange,
  readOnly,
}: {
  line1: string;
  line2: string;
  onChange: (key: 'specimenVolumeQuality' | 'specimenVolumeQuality2', val: string) => void;
  readOnly?: boolean;
}) {
  const [extraOpen, setExtraOpen] = useState(() => line2.trim().length > 0);
  const showSecond = extraOpen || line2.trim().length > 0;

  if (readOnly) {
    return (
      <div className="space-y-1">
        <Field label="Specimen Volume and Quality:">
          <Line value={line1} onChange={() => undefined} readOnly />
        </Field>
        {line2.trim() ? (
          <div className="pl-[11rem] sm:pl-[12.5rem]">
            <Line value={line2} onChange={() => undefined} readOnly />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Field label="Specimen Volume and Quality:">
        <Line
          value={line1}
          onChange={(val) => onChange('specimenVolumeQuality', val)}
          placeholder="e.g. 2 sputum containers; mucopurulent; adequate volume"
        />
      </Field>
      {showSecond ? (
        <div className="flex items-end gap-2 pl-[11rem] sm:pl-[12.5rem]">
          <div className="flex-1 min-w-0">
            <Line
              value={line2}
              onChange={(val) => onChange('specimenVolumeQuality2', val)}
              placeholder="Additional volume / quality note (optional)"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('specimenVolumeQuality2', '');
              setExtraOpen(false);
            }}
            className="shrink-0 text-[10px] font-semibold text-slate-500 hover:text-rose-600 print:hidden"
          >
            Remove line
          </button>
        </div>
      ) : (
        <div className="pl-[11rem] sm:pl-[12.5rem] print:hidden">
          <button
            type="button"
            onClick={() => setExtraOpen(true)}
            className="text-[10px] font-semibold text-[#0176d3] hover:underline"
          >
            + Add line
          </button>
        </div>
      )}
    </div>
  );
}

/** full = paper-style (print / form library); workflow = collapsible steps on sample detail */
export type NtpLabRequestFormLayout = 'full' | 'workflow';

function NtpFormSection({
  step,
  title,
  subtitle,
  summary,
  collapsible,
  defaultOpen,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  summary?: string;
  collapsible: boolean;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;

  const headerInner = (
    <>
      <div className="min-w-0 text-left flex-1">
        <div className="font-bold text-[11px] uppercase tracking-wide text-slate-800">
          {step}. {title}
        </div>
        <div className="font-semibold italic text-[10px] text-slate-600">{subtitle}</div>
        {collapsible && !isOpen && summary ? (
          <div className="mt-1 text-[10px] text-slate-700 truncate">{summary}</div>
        ) : null}
      </div>
      {collapsible ? (
        <span className="shrink-0 print:hidden flex items-center gap-0.5 text-[10px] font-semibold text-[#0176d3]">
          {isOpen ? 'Collapse' : 'Expand'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      ) : null}
    </>
  );

  return (
    <section className="border border-slate-800 ntp-form-section">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full bg-slate-100 border-b border-slate-800 px-2 py-1.5 flex items-start justify-between gap-2 text-left print:pointer-events-none cursor-pointer"
          aria-expanded={isOpen}
        >
          {headerInner}
        </button>
      ) : (
        <div className="bg-slate-100 border-b border-slate-800 px-2 py-1.5 flex items-start justify-between gap-2">
          {headerInner}
        </div>
      )}
      <div
        className={`ntp-section-body p-2 space-y-1.5 ${isOpen ? '' : 'hidden print:block'}`}
      >
        {children}
      </div>
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

  const genericResultKeys = [
    'res_result_reading1',
    'res_result_reading2',
    'res_result_diagnosis',
    'res_result_remarks',
  ] as const;

  const clearKeysForRow = (t: DiagnosticResultRow) =>
    t.kind === 'smear'
      ? [...SMEAR_RESULT.clearKeys]
      : [t.id, ...genericResultKeys];

  const maybeClearResultRemarks = (reading1: string, rifReading3: string) => {
    if (!needsNtpResultRemarks(reading1, rifReading3)) onChange('res_result_remarks', '');
  };

  const setMolecularResult = (test: DiagnosticResultRow, key: (typeof genericResultKeys)[number], val: string) => {
    onChange(key, val);
    if (key === 'res_result_diagnosis') onChange(test.id, val);
  };

  const visibleDiagnosticChkIds = new Set(DIAGNOSTIC_RESULT_ROWS.map((t) => t.chkId));
  const rawSelectedDiagnosticChkId = resolveNtpSelectedDiagnosticChkId(values);
  const selectedDiagnosticChkId = visibleDiagnosticChkIds.has(rawSelectedDiagnosticChkId)
    ? rawSelectedDiagnosticChkId
    : '';
  const selectedDiagnosticTest = DIAGNOSTIC_RESULT_ROWS.find(
    (t) => t.chkId === selectedDiagnosticChkId
  );

  const molecularReading1 = v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0];
  const molecularRifReading3 = v('res_result_diagnosis');
  const showResultRemarks =
    Boolean(selectedDiagnosticTest && selectedDiagnosticTest.kind !== 'smear') &&
    needsNtpResultRemarks(molecularReading1, molecularRifReading3);

  const isSmearResults = selectedDiagnosticTest?.kind === 'smear';
  const showSmearSpec2 =
    isSmearResults &&
    (v('smear_spec2_active') === '1' ||
      v('smear2_reading1').trim().length > 0 ||
      v('smear2_reading2').trim().length > 0);
  const smearSpecimenRowCount = showSmearSpec2 ? 2 : 1;

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

  const handleSingleDiagnosticPick = (pickedChkId: string) => {
    if (
      pickedChkId &&
      requestedResultChkIds.size > 0 &&
      !requestedResultChkIds.has(pickedChkId)
    ) {
      return;
    }
    const next: Values = { ...values, res_diagnostic_test: pickedChkId };
    syncNtpResultChecksFromRequest(next);
    DIAGNOSTIC_RESULT_ROWS.forEach((t) => {
      const on = Boolean(pickedChkId && t.chkId === pickedChkId);
      if (!on && clearKeysForRow(t).length) {
        clearKeysForRow(t).forEach((k) => {
          next[k] = '';
        });
      }
    });
    pushNtpState(next);
  };

  const workflow = layout === 'workflow';
  const collapsible = workflow && !readOnly;
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
    v('specimenQuality') || '',
    v('specimenReceivedAt') ? v('specimenReceivedAt').replace('T', ' ') : '',
    v('specimenVolumeQuality') || '',
    v('specimenVolumeQuality2') || '',
  ]
    .filter(Boolean)
    .join(' · ');

  const selectedDiagnosticLabel =
    DIAGNOSTIC_TEST_PICKER_OPTIONS.find((o) => o.value === selectedDiagnosticChkId)?.label || '';

  const assignmentSummary = [
    assignedExaminations?.length ? assignedExaminations.join(', ') : '',
    selectedDiagnosticLabel && selectedDiagnosticLabel !== '— Select examination —'
      ? `Entry: ${selectedDiagnosticLabel}`
      : 'Pick one examination for results',
  ]
    .filter(Boolean)
    .join(' · ');

  const pickerInResultsTable = !workflow;

  return (
    <div className="text-slate-900 text-[11px] leading-tight space-y-3">
      <ResultFormOrgBanner
        shortName={shortName}
        panelTitle={panelTitle}
        verificationQr={verificationQr}
      />

      {workflow && !readOnly ? (
        <p className="print:hidden text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
          Lab workflow: check <span className="font-semibold text-slate-800">Test Requested</span> under
          Request first — Results and examination assignment follow those checks. Expand Receive as needed.
          Patient demographics on Request come from the requisition (read-only). Print uses paper order.
        </p>
      ) : null}

      {workflow ? (
        <NtpFormSection
          step="Assign"
          title="Examination assignment"
          subtitle="Pick one checked Test Requested examination to enter on this sheet"
          summary={assignmentSummary}
          collapsible={collapsible}
          defaultOpen
        >
          {assignedExaminations && assignedExaminations.length > 0 ? (
            <div className="mb-2 print:hidden">
              <div className="text-[10px] font-semibold text-slate-700">Assigned on this request:</div>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {assignedExaminations.map((name) => (
                  <li
                    key={name}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0176d3]/10 text-[#014486] border border-[#0176d3]/25"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {requestedResultChkIds.size === 0 && !readOnly ? (
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 print:hidden">
              Mark at least one test under <span className="font-semibold">Test Requested</span> (Request
              step) that appears on Form 2a results — e.g. Smear Microscopy or Xpert MTB/RIF.
            </p>
          ) : null}
          <Field label="Diagnostic test for result entry:">
            <DiagnosticTestPicker
              selectedChkId={selectedDiagnosticChkId}
              readOnly={readOnly || requestedResultChkIds.size <= 1}
              allowedChkIds={requestedResultChkIds}
              onPick={handleSingleDiagnosticPick}
            />
          </Field>
        </NtpFormSection>
      ) : null}

      <NtpFormSection
        step="Request"
        title="Sending facility"
        subtitle="To be filled out by requesting facility health worker"
        summary={requestSummary}
        collapsible={collapsible}
        defaultOpen={!workflow}
      >
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
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
            <div className="flex items-end gap-3">
              <Field label="Age:">
                <Line value={v('age')} onChange={set('age')} readOnly={patientLocked('age')} />
              </Field>
              <span className="shrink-0">Sex:</span>
              <Box checked={v('sex') === 'M'} label="M" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'M')} />
              <Box checked={v('sex') === 'F'} label="F" readOnly={patientLocked('sex')} onChange={() => pick('sex', 'F')} />
            </div>
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

          <div className="pt-1">
            <div className="font-semibold">Reason for Examination / History of Treatment:</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Diagnosis</span>
              <Box checked={v('diagnosis') === 'New'} label="New" readOnly={readOnly} onChange={() => pick('diagnosis', 'New')} />
              <Box checked={v('diagnosis') === 'Retreatment'} label="Retreatment" readOnly={readOnly} onChange={() => pick('diagnosis', 'Retreatment')} />
              <Box checked={v('treatmentPhase') === 'Baseline'} label="Baseline" readOnly={readOnly} onChange={() => pick('treatmentPhase', 'Baseline')} />
              <Box checked={v('treatmentPhase') === 'Follow-up'} label="Follow-up" readOnly={readOnly} onChange={() => pick('treatmentPhase', 'Follow-up')} />
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-3">
              <Field label="TB Case No.:">
                <Line value={v('tbCaseNo')} onChange={set('tbCaseNo')} readOnly={patientLocked('tbCaseNo')} />
              </Field>
              <Field label="Month of Treatment:">
                <Line value={v('monthOfTreatment')} onChange={set('monthOfTreatment')} readOnly={readOnly} />
              </Field>
            </div>
          </div>

          <div>
            <div className="font-semibold">Test Requested:</div>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
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

          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="font-semibold">Type of Specimen:</span>
            <Box checked={v('specimenType') === 'Sputum'} label="Sputum" readOnly={readOnly} onChange={() => pick('specimenType', 'Sputum')} />
            <Box checked={v('specimenType') === 'Other'} label="Other (specify)" readOnly={readOnly} onChange={() => pick('specimenType', 'Other')} />
            {v('specimenType') === 'Other' ? (
              <div className="min-w-[8rem] flex-1">
                <Line value={v('specimenOther')} onChange={set('specimenOther')} readOnly={readOnly} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span>Repeat Collection?</span>
            <Box checked={v('repeatCollection') === 'No'} label="No" readOnly={readOnly} onChange={() => pick('repeatCollection', 'No')} />
            <Box checked={v('repeatCollection') === 'Yes'} label="Yes" readOnly={readOnly} onChange={() => pick('repeatCollection', 'Yes')} />
            <span>Reason:</span>
            <div className="min-w-[8rem] flex-1">
              <Line value={v('repeatReason')} onChange={set('repeatReason')} readOnly={readOnly} />
            </div>
          </div>

          <Field label="Date:">
            <Line type="date" value={v('collectionDate')} onChange={set('collectionDate')} readOnly={readOnly} />
          </Field>
          <table className="w-full border border-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold w-16">Specimen</th>
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold">Date Collected</th>
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold">Date Dispatched to Laboratory</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((n) => (
                <tr key={n}>
                  <td className="border border-slate-800 px-2 py-1">{n}</td>
                  <td className="border border-slate-800 px-1 py-1">
                    <Line type="date" value={v(`spec${n}_collected`)} onChange={set(`spec${n}_collected`)} readOnly={readOnly} />
                  </td>
                  <td className="border border-slate-800 px-1 py-1">
                    <Line type="date" value={v(`spec${n}_dispatched`)} onChange={set(`spec${n}_dispatched`)} readOnly={readOnly} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <div>Remarks:</div>
            {readOnly ? (
              <div className="min-h-[2rem] border-b border-slate-800 whitespace-pre-wrap">{v('remarks')}</div>
            ) : (
              <textarea
                value={v('remarks')}
                onChange={(e) => onChange('remarks', e.target.value)}
                rows={2}
                placeholder="Pre-collection details, existing medical conditions, medications taken prior to testing, or other known risk factors"
                className="mt-0.5 w-full border border-slate-400 px-1 py-1 text-[11px] focus:outline-none focus:border-[#0176d3]"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="text-[10px] text-center">Prepared by</div>
              <Line value={v('preparedBy')} onChange={set('preparedBy')} readOnly={readOnly} />
              <div className="text-center text-[10px]">Signature over Printed Name</div>
            </div>
            <div>
              <div className="text-[10px] text-center">Designation:</div>
              <Line value={v('preparedDesignation')} onChange={set('preparedDesignation')} readOnly={readOnly} />
            </div>
          </div>
      </NtpFormSection>

      <NtpFormSection
        step="Receive"
        title="Laboratory accession"
        subtitle="Receiving laboratory technician / medical technologist"
        summary={receiveSummary}
        collapsible={collapsible}
        defaultOpen={false}
      >
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 items-start">
            <div className="space-y-1.5">
              <Field label="Name of Laboratory:">
                <Line
                  value={v('labName') || 'PTSI-Q CENTRAL LABORATORY'}
                  onChange={set('labName')}
                  readOnly={readOnly}
                />
              </Field>
              <Field label="Specimen Received by:">
                <Line value={v('specimenReceivedBy')} onChange={set('specimenReceivedBy')} readOnly={readOnly} />
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-0.5">
                <Box
                  checked={v('specimenQuality') === 'Accepted'}
                  label="Accepted"
                  readOnly={readOnly}
                  onChange={() => pick('specimenQuality', 'Accepted')}
                />
                <Box
                  checked={v('specimenQuality') === 'Rejected'}
                  label="Rejected"
                  readOnly={readOnly}
                  onChange={() => pick('specimenQuality', 'Rejected')}
                />
              </div>
              <Field label="Reason:">
                <Line value={v('specimenQualityReason')} onChange={set('specimenQualityReason')} readOnly={readOnly} />
              </Field>
            </div>
          </div>
          <SpecimenVolumeQualityFields
            line1={v('specimenVolumeQuality')}
            line2={v('specimenVolumeQuality2')}
            readOnly={readOnly}
            onChange={(key, val) => onChange(key, val)}
          />
      </NtpFormSection>

      <NtpFormSection
        step="Results"
        title="Diagnostic results & release"
        subtitle="Microscopist / medical technologist — same Form 2a sheet"
        collapsible={collapsible}
        defaultOpen
      >
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Field label="Laboratory Serial Number:">
              <Line value={v('labSerial')} onChange={set('labSerial')} readOnly={readOnly} />
            </Field>
            <Field label="Date Specimen Examined:">
              <Line type="date" value={v('dateExamined')} onChange={set('dateExamined')} readOnly={readOnly} />
            </Field>
          </div>
          <table className="w-full border border-slate-800 border-collapse mt-2">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-800 px-2 py-1 text-left font-semibold w-[28%]">
                  Diagnostic Tests
                </th>
                {isSmearResults ? (
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
              {selectedDiagnosticTest?.kind === 'smear' ? (
                <>
                  <tr>
                    <td
                      rowSpan={smearSpecimenRowCount}
                      className="border border-slate-800 px-2 py-1 align-top"
                    >
                      {pickerInResultsTable ? (
                        <DiagnosticTestPicker
                          selectedChkId={selectedDiagnosticChkId}
                          readOnly={readOnly}
                          allowedChkIds={requestedResultChkIds}
                          onPick={handleSingleDiagnosticPick}
                        />
                      ) : (
                        <span className="inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold">
                          {selectedDiagnosticTest?.label || selectedDiagnosticLabel || '\u00a0'}
                        </span>
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
                      rowSpan={smearSpecimenRowCount}
                      className="border border-slate-800 px-2 py-1 align-middle"
                    >
                      <p className="text-[9px] text-slate-500 mb-1 print:hidden">
                        Combined result (specimens 1–2)
                      </p>
                      <SmearLabDiagnosisSelect
                        value={
                          v('smear_diagnosis') ||
                          deriveCombinedSmearLabDiagnosis(values, showSmearSpec2)
                        }
                        onChange={set('smear_diagnosis')}
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                  {showSmearSpec2 ? (
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
                </>
              ) : (
                <tr>
                  <td className="border border-slate-800 px-2 py-1 align-top">
                    {pickerInResultsTable ? (
                      <DiagnosticTestPicker
                        selectedChkId={selectedDiagnosticChkId}
                        readOnly={readOnly}
                        allowedChkIds={requestedResultChkIds}
                        onPick={handleSingleDiagnosticPick}
                      />
                    ) : (
                      <span className="inline-block w-full border-b border-slate-800 px-1 text-[11px] font-semibold">
                        {selectedDiagnosticTest?.label || selectedDiagnosticLabel || '\u00a0'}
                      </span>
                    )}
                  </td>
                  {selectedDiagnosticTest ? (
                    <>
                      <td className="border border-slate-800 px-1 py-1 align-top">
                        <MtbReading1Select
                          value={v('res_result_reading1')}
                          onChange={(val) => {
                            setMolecularResult(selectedDiagnosticTest, 'res_result_reading1', val);
                            if (val !== 'MTB DETECTED') onChange('res_result_reading2', '');
                            const rifAfter =
                              !reading1ShowsRifDropdown(val) ? '' : molecularRifReading3;
                            if (!reading1ShowsRifDropdown(val)) {
                              onChange('res_result_diagnosis', '');
                              onChange(selectedDiagnosticTest.id, '');
                            }
                            maybeClearResultRemarks(val, rifAfter);
                          }}
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="border border-slate-800 px-1 py-1 align-top">
                        <MtbReading2LevelSelect
                          reading1={v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0]}
                          value={v('res_result_reading2')}
                          onChange={(val) =>
                            setMolecularResult(selectedDiagnosticTest, 'res_result_reading2', val)
                          }
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="border border-slate-800 px-1 py-1 align-top">
                        <MtbRifReading3Select
                          reading1={v('res_result_reading1') || NTP_READING1_MTB_OPTIONS[0]}
                          value={v('res_result_diagnosis') || v(selectedDiagnosticTest.id)}
                          onChange={(val) => {
                            setMolecularResult(selectedDiagnosticTest, 'res_result_diagnosis', val);
                            maybeClearResultRemarks(molecularReading1, val);
                          }}
                          readOnly={readOnly}
                        />
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="border border-slate-800 px-2 py-2 text-[10px] text-slate-400">
                      Select one examination to enter results
                    </td>
                  )}
                </tr>
              )}
            </tbody>
          </table>

          {isSmearResults && !readOnly ? (
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

          {showResultRemarks ? (
            <div className="mt-2 space-y-0.5">
              <div className="text-[11px] font-semibold text-slate-800">Remarks:</div>
              {readOnly ? (
                <div className="min-h-[1.5rem] border-b border-slate-800 whitespace-pre-wrap text-[11px] font-semibold px-1">
                  {v('res_result_remarks') || '\u00a0'}
                </div>
              ) : (
                <textarea
                  value={v('res_result_remarks')}
                  onChange={(e) => onChange('res_result_remarks', e.target.value)}
                  rows={2}
                  placeholder="Required for MTB trace detected or indeterminate RIF resistance"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-0 print:border-b print:border-slate-800 print:rounded-none"
                />
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3 pt-3">
            {[
              ['performedBy', 'Performed by'],
              ['verifiedBy', 'Verified by'],
              ['notedBy', 'Noted by'],
            ].map(([key, label]) => (
              <div key={key}>
                <div className="text-[10px]">{label}</div>
                <Line value={v(key)} onChange={set(key)} readOnly={readOnly} />
                <div className="text-center text-[10px]">Signature over Printed Name</div>
              </div>
            ))}
          </div>
          <Field label="Date and Time Released:">
            <Line type="datetime-local" value={v('dateReleased')} onChange={set('dateReleased')} readOnly={readOnly} />
          </Field>
      </NtpFormSection>

      <p className="text-[10px] text-center text-slate-700">
        A separate result form for LPA, Culture and DST will be issued
      </p>
    </div>
  );
};
