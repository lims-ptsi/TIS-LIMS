import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { ExamResultGroup } from '../modals/ResultEntryModal';
import { buildOfficialResultVerifyUrl } from '../../utils/officialResultVerification';

/** Letterhead QR footprint (px) — matches logo block height */
export const VERIFY_QR_DISPLAY_PX = { compact: 64, full: 80 } as const;

export function OfficialResultVerificationQr({
  requisition,
  examKey,
  formId,
  formLabel,
  resultGroup,
  compact,
  minimal,
}: {
  requisition: LabTestRequisition;
  examKey: string;
  formId?: string;
  formLabel?: string;
  resultGroup?: ExamResultGroup;
  compact?: boolean;
  minimal?: boolean;
}) {
  const [dataUrl, setDataUrl] = useState('');
  const [token, setToken] = useState('');
  const [failed, setFailed] = useState(false);

  const displayPx = compact ? VERIFY_QR_DISPLAY_PX.compact : VERIFY_QR_DISPLAY_PX.full;
  const useMinimal = minimal ?? compact;

  useEffect(() => {
    let cancelled = false;
    setDataUrl('');
    setFailed(false);

    (async () => {
      try {
        const origin =
          typeof window !== 'undefined' ? window.location.origin : 'https://lab-tis.local';
        const url = await buildOfficialResultVerifyUrl({
          origin,
          requisition,
          examKey,
          formId,
          formLabel,
          resultGroup,
        });
        if (cancelled) return;

        const tok = new URL(url).searchParams.get('tok') || '';
        setToken(tok);

        const png = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: displayPx * 3,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (!cancelled) setDataUrl(png);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requisition, examKey, formId, formLabel, resultGroup, displayPx]);

  const sizeClass = compact ? 'lims-verify-qr--compact' : 'lims-verify-qr--full';

  const qrImage =
    dataUrl && !failed ? (
      <img
        src={dataUrl}
        alt="Scan to verify this official result"
        width={displayPx}
        height={displayPx}
        className="lims-verify-qr__img"
        title={token ? `Verify ID ${token}` : 'Scan to verify'}
      />
    ) : failed ? (
      <div
        className="lims-verify-qr__img lims-verify-qr__fallback flex items-center justify-center text-[8px] text-slate-500 text-center px-1 border border-dashed border-slate-300 rounded-sm bg-slate-50"
        title="Could not generate verification QR"
      >
        QR n/a
      </div>
    ) : (
      <div
        className="lims-verify-qr__img lims-verify-qr__fallback animate-pulse bg-slate-100 border border-slate-200 rounded-sm print:hidden"
        aria-hidden
      />
    );

  if (useMinimal) {
    return (
      <div className={`lims-verify-qr ${sizeClass} bg-white p-1 border border-slate-300 rounded-sm shrink-0`}>
        {qrImage}
      </div>
    );
  }

  return (
    <div className={`lims-verify-qr ${sizeClass} flex flex-col items-end gap-0.5 shrink-0`}>
      <div className="bg-white p-1 border border-slate-300 rounded-sm">{qrImage}</div>
      <div
        className="text-[8px] print:text-[7px] text-slate-500 font-mono text-right max-w-[9rem] truncate"
        title={token || undefined}
      >
        {token ? `ID ${token.slice(0, 10)}` : 'Lab-TIS'}
      </div>
    </div>
  );
}
