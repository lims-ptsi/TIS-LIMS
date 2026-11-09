import React from 'react';
import { PtsiLogo } from '../brand/PtsiLogo';

/** PTSI branding for the public QR verification screen (matches official result letterhead). */
export function PtsiVerifyPageHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-4 text-center">
      <PtsiLogo className="h-16 w-auto max-w-[12rem] object-contain" />
      <div className="space-y-1">
        <h1 className="text-base font-black tracking-tight text-slate-900 uppercase font-serif leading-tight">
          Philippine Tuberculosis Society, Inc.
        </h1>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Laboratory Section</p>
        <p className="text-sm font-semibold text-[#0176d3] pt-1">
          {subtitle || 'Laboratory Result Verification'}
        </p>
      </div>
    </div>
  );
}
