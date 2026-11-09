import React from 'react';
import { ExamExaminers } from '../modals/ResultEntryModal';
import { ROLE_DEFAULT_DESIGNATION } from '../../data/labPersonnelCatalog';

export const OFFICIAL_RESULT_SIGNATURE_LABELS = [
  'Performed by',
  'Verified by',
  'Pathologist',
] as const;

export function buildOfficialResultSignatureSlots(examiners: ExamExaminers) {
  return [
    {
      title: OFFICIAL_RESULT_SIGNATURE_LABELS[0],
      name: examiners.labTechName || examiners.rmtName,
      designation: examiners.labTechDesignation || ROLE_DEFAULT_DESIGNATION.performed,
      license: examiners.labTechLicense || examiners.rmtLicense,
    },
    {
      title: OFFICIAL_RESULT_SIGNATURE_LABELS[1],
      name: examiners.rmtName,
      designation: examiners.rmtDesignation || ROLE_DEFAULT_DESIGNATION.verified,
      license: examiners.rmtLicense,
    },
    {
      title: OFFICIAL_RESULT_SIGNATURE_LABELS[2],
      name: examiners.pathologistName,
      designation: examiners.pathologistDesignation || ROLE_DEFAULT_DESIGNATION.pathologist,
      license: examiners.pathologistLicense,
    },
  ];
}

/** PTSI official result footer — three signatories with role, designation, and license. */
export function OfficialResultSignatureFooter({ examiners }: { examiners: ExamExaminers }) {
  const slots = buildOfficialResultSignatureSlots(examiners);

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5 print:gap-4 pt-2 sm:pt-3 print:pt-0 items-end">
      {slots.map((sig, index) => (
        <div key={index} className="text-center space-y-1">
          <div className="text-[10px] print:text-[8px] font-semibold text-slate-500 uppercase tracking-wide">
            {sig.title}
          </div>
          <div className="border-b border-slate-700 min-h-[2rem] flex items-end justify-center pb-1">
            <span className="font-serif italic text-sm print:text-xs text-slate-900">
              {sig.name || ''}
            </span>
          </div>
          <div className="text-[11px] print:text-[9px] font-bold text-slate-800">
            {sig.designation}
          </div>
          <div className="text-[10px] print:text-[8px] text-slate-600">
            Lic. No. {sig.license || '____________'}
          </div>
        </div>
      ))}
    </div>
  );
}
