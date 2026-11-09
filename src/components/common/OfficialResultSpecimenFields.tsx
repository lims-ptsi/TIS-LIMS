import React from 'react';
import { ResultFormSpecimenField } from '../../data/resultFormsCatalog';

const inputClass =
  'w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]';

type Props = {
  fields: ResultFormSpecimenField[];
  readValue: (paramId: string) => string;
  writeValue: (paramId: string, value: string) => void;
  /** When true, only fields with workflowEntry !== false (default true). */
  workflowOnly?: boolean;
};

export function formatSpecimenSampleDisplay(sampleType: string, otherText: string): string {
  const type = (sampleType || '').trim();
  if (!type) return '—';
  if (type.toLowerCase() === 'other') {
    const other = (otherText || '').trim();
    return other || 'Other';
  }
  return type;
}

/** Specimen meta row(s) above analyte tables (Sample type, etc.). */
export function OfficialResultSpecimenFields({
  fields,
  readValue,
  writeValue,
  workflowOnly = true,
}: Props) {
  const visible = fields.filter((f) => !workflowOnly || f.workflowEntry !== false);
  if (visible.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-white space-y-3">
      {visible.map((field) => {
        const value = readValue(field.id);
        const otherValue = readValue(`${field.id}_other`);
        const showOther =
          Boolean(field.otherSpecifyOption) && value === field.otherSpecifyOption;

        return (
          <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 max-w-xl">
            <label className="text-sm font-medium text-slate-800 sm:w-28 shrink-0 pt-1.5">
              {field.label}:
            </label>
            <div className="flex-1 min-w-0 space-y-2">
              {field.type === 'select' ? (
                <select
                  value={value || field.options?.[0] || ''}
                  onChange={(e) => writeValue(field.id, e.target.value)}
                  className={inputClass}
                  aria-label={field.label}
                >
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  value={value || ''}
                  onChange={(e) => writeValue(field.id, e.target.value)}
                  className={inputClass}
                />
              ) : (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => writeValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
              {showOther ? (
                <input
                  type="text"
                  value={otherValue || ''}
                  onChange={(e) => writeValue(`${field.id}_other`, e.target.value)}
                  placeholder={field.placeholder || 'Please specify'}
                  className={inputClass}
                  aria-label={`${field.label} — specify other`}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
