import React from 'react';
import { OfficialResultLetterhead } from './OfficialResultLetterhead';

export interface ResultFormOrgBannerProps {
  /** e.g. RF-10 Laboratory Request */
  shortName: string;
  /** Centered title below the letterhead (Form 2a, URINALYSIS, etc.) */
  panelTitle?: string;
  /** @deprecated Case/req live in patient block; use shortName as form label only */
  rightMeta?: React.ReactNode;
  /** Verification QR — shown on every official result form. */
  verificationQr?: React.ReactNode;
}

/** Standard PTSI letterhead used on printable result forms. */
export function ResultFormOrgBanner({
  shortName,
  panelTitle,
  verificationQr,
}: ResultFormOrgBannerProps) {
  return (
    <>
      <OfficialResultLetterhead verificationQr={verificationQr} />

      {panelTitle ? (
        <h2 className="text-center text-sm sm:text-base font-bold tracking-wide text-slate-900 mb-3 mt-3 print:mt-2 uppercase">
          {panelTitle}
        </h2>
      ) : null}
    </>
  );
}
