import React from 'react';

export interface OfficialResultLetterheadProps {
  /** @deprecated Form name is shown in the report title, not the letterhead */
  formLabel?: string;
  formIndex?: number;
  formTotal?: number;
  /** @deprecated Preview context belongs in the modal chrome, not the printable header */
  previewCaption?: string;
  verificationQr?: React.ReactNode;
}

const PTSI_ADDRESS =
  'Quezon Institute Compound, E. Rodriguez Sr. Avenue, Quezon City';
const PTSI_PHONE = 'Tel: (02) 0000 - 0000';

/** PTSI official letterhead — classic typography, address, verification QR. */
export function OfficialResultLetterhead({
  formIndex,
  formTotal,
  verificationQr,
}: OfficialResultLetterheadProps) {
  const sheetNote =
    formIndex != null && formTotal != null && formTotal > 1 ? (
      <span className="text-slate-500 font-normal normal-case tracking-normal">
        {' '}
        · Sheet {formIndex + 1} of {formTotal}
      </span>
    ) : null;

  return (
    <header className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-3 print:pb-2 print:mb-2">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <img
          src="/ptsilogo.png"
          alt=""
          aria-hidden
          className="h-14 sm:h-16 w-auto print:h-14 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="min-w-0 leading-snug">
          <h1 className="text-base sm:text-lg print:text-sm font-black tracking-tight text-slate-900 uppercase font-serif leading-tight">
            Philippine Tuberculosis Society, Inc.
          </h1>
          <h2 className="text-xs sm:text-sm print:text-[11px] font-bold text-slate-700 uppercase tracking-wide leading-snug mt-0.5">
            Laboratory Section
            {sheetNote}
          </h2>
          <p className="text-[10px] sm:text-[11px] print:text-[9px] text-slate-600 leading-snug mt-1">
            {PTSI_ADDRESS}
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">{PTSI_PHONE}</span>
          </p>
        </div>
      </div>
      {verificationQr ? (
        <div className="shrink-0 self-start max-w-[4.5rem]">{verificationQr}</div>
      ) : null}
    </header>
  );
}
