import React from 'react';
import type { ExamExaminers } from '../modals/ResultEntryModal';
import {
  findPersonnelById,
  personnelForRole,
  personnelIdForExaminer,
  ROLE_DEFAULT_DESIGNATION,
  type LabPersonnelRole,
} from '../../data/labPersonnelCatalog';

const ROLE_CONFIG: {
  role: LabPersonnelRole;
  label: string;
  required?: boolean;
  nameKey: keyof ExamExaminers;
  designationKey: keyof ExamExaminers;
  licenseKey: keyof ExamExaminers;
}[] = [
  {
    role: 'performed',
    label: 'Performed by',
    nameKey: 'labTechName',
    designationKey: 'labTechDesignation',
    licenseKey: 'labTechLicense',
  },
  {
    role: 'verified',
    label: 'Verified by',
    required: true,
    nameKey: 'rmtName',
    designationKey: 'rmtDesignation',
    licenseKey: 'rmtLicense',
  },
  {
    role: 'pathologist',
    label: 'Pathologist',
    required: true,
    nameKey: 'pathologistName',
    designationKey: 'pathologistDesignation',
    licenseKey: 'pathologistLicense',
  },
];

function readString(ex: ExamExaminers, key: keyof ExamExaminers): string {
  const v = ex[key];
  return typeof v === 'string' ? v : '';
}

interface ExaminerSignoffFieldsProps {
  examiners: ExamExaminers;
  onChange: (patch: Partial<ExamExaminers>) => void;
  compact?: boolean;
}

export const ExaminerSignoffFields: React.FC<ExaminerSignoffFieldsProps> = ({
  examiners,
  onChange,
  compact = false,
}) => {
  const selectClass =
    'w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 text-xs focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]';

  const handleSelect = (cfg: (typeof ROLE_CONFIG)[number], personnelId: string) => {
    if (!personnelId) {
      onChange({ [cfg.nameKey]: '', [cfg.designationKey]: '', [cfg.licenseKey]: '' });
      return;
    }
    const person = findPersonnelById(personnelId);
    if (!person) return;
    onChange({
      [cfg.nameKey]: person.name,
      [cfg.designationKey]: person.designation,
      [cfg.licenseKey]: person.licenseNo,
    });
  };

  return (
    <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3'} gap-3 text-xs`}>
      {ROLE_CONFIG.map((cfg) => {
        const name = readString(examiners, cfg.nameKey);
        const designation =
          readString(examiners, cfg.designationKey) || ROLE_DEFAULT_DESIGNATION[cfg.role];
        const license = readString(examiners, cfg.licenseKey);
        const selectedId = personnelIdForExaminer(cfg.role, name, license);
        const options = personnelForRole(cfg.role);

        return (
          <div key={cfg.role} className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {cfg.label}
              {cfg.required ? ' *' : ''}
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleSelect(cfg, e.target.value)}
              className={selectClass}
              aria-label={cfg.label}
            >
              <option value="">Select personnel…</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="mt-2 space-y-0.5 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">{designation || '—'}</p>
              <p className="tabular-nums">
                License No.{' '}
                <span className="font-semibold text-slate-800">{license || '—'}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
