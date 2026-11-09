import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import {
  loadStoredRequisitions,
  loadStoredTestResults,
  lookupStoredRecord,
} from '../../data/limsDataStore';
import {
  resolveVerifiedExamGroup,
  summarizeVerifiedResultParameters,
  type ResolvedVerifyMatch,
} from '../../utils/officialResultVerification';
import { LabTestRequisition } from '../modals/NewRequisitionModal';
import { ExamResultGroup } from '../modals/ResultEntryModal';

function readVerifyParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('verify') !== '1') return null;
  return {
    rn: (p.get('rn') || '').trim(),
    cn: (p.get('cn') || '').trim(),
    ex: (p.get('ex') || '').trim(),
    form: (p.get('form') || '').trim(),
    label: (p.get('label') || '').trim(),
    tok: (p.get('tok') || '').trim().toUpperCase(),
  };
}

export function PublicVerifyResultView() {
  const params = useMemo(() => readVerifyParams(), []);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'missing'>('loading');
  const [req, setReq] = useState<LabTestRequisition | null>(null);
  const [group, setGroup] = useState<ExamResultGroup | undefined>();
  const [match, setMatch] = useState<ResolvedVerifyMatch | null>(null);

  useEffect(() => {
    if (!params?.rn || !params.tok) {
      setStatus('missing');
      return;
    }

    let cancelled = false;
    (async () => {
      const reqs = loadStoredRequisitions();
      const found =
        reqs.find((r) => r.requisitionNumber === params.rn) ||
        (params.cn
          ? reqs.find((r) => r.caseNo === params.cn || r.externalRef === params.cn)
          : undefined);

      const resultsStore = loadStoredTestResults().results;
      const resultMap =
        (found && lookupStoredRecord(resultsStore, found.id, found.requisitionNumber)) ||
        undefined;

      if (!found) {
        if (!cancelled) setStatus('invalid');
        return;
      }

      const resolved = await resolveVerifiedExamGroup(found, resultMap, params.tok, {
        examKey: params.ex || undefined,
        formId: params.form || undefined,
      });

      if (cancelled) return;
      setReq(found);
      setMatch(resolved);
      setGroup(resolved?.group);
      setStatus(resolved ? 'valid' : 'invalid');
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const resultLines = useMemo(
    () => (status === 'valid' ? summarizeVerifiedResultParameters(group, 14) : []),
    [status, group]
  );

  if (!params) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-slate-900">PTSI Laboratory Result Verification</h1>
          <p className="text-xs text-slate-600">
            Philippine Tuberculosis Society, Inc. · Laboratory Section
          </p>
        </div>

        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Verifying document…</span>
          </div>
        ) : null}

        {status === 'missing' ? (
          <div className="flex flex-col items-center gap-2 py-6 text-amber-800">
            <ShieldAlert className="w-10 h-10" />
            <p className="text-sm text-center">Invalid verification link. Scan the QR on the official printout.</p>
          </div>
        ) : null}

        {status === 'valid' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <ShieldCheck className="w-12 h-12 text-emerald-600" />
            <p className="text-base font-bold text-emerald-800">Authentic official result</p>
            <dl className="w-full text-sm space-y-1 border-t border-slate-200 pt-3">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Requisition</dt>
                <dd className="font-mono font-semibold text-slate-900">{params.rn}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Case no.</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {req?.caseNo || req?.externalRef || params.cn || '—'}
                </dd>
              </div>
              {match?.formId ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Result form</dt>
                  <dd className="font-mono font-semibold text-slate-900 text-right">{match.formId}</dd>
                </div>
              ) : null}
              {match?.formLabel || params.label ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Examination</dt>
                  <dd className="font-semibold text-slate-900 text-right">
                    {match?.formLabel || params.label}
                  </dd>
                </div>
              ) : null}
              {req?.patientOrSubjectName ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Patient</dt>
                  <dd className="font-semibold text-slate-900 text-right">{req.patientOrSubjectName}</dd>
                </div>
              ) : null}
              {group?.status ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Status on file</dt>
                  <dd className="font-semibold text-slate-900 text-right">{group.status}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Verify ID</dt>
                <dd className="font-mono text-[11px] text-slate-700">{params.tok}</dd>
              </div>
            </dl>
            {resultLines.length > 0 ? (
              <div className="w-full border-t border-slate-200 pt-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Results on file (legit check)
                </p>
                <ul className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
                  {resultLines.map((row) => (
                    <li key={row.key} className="flex justify-between gap-2 font-mono">
                      <span className="text-slate-500 truncate">{row.key}</span>
                      <span className="font-semibold text-slate-900 text-right truncate">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              This seal matches the result data on file for this requisition. Compare printed values with this
              record before clinical use.
            </p>
          </div>
        ) : null}

        {status === 'invalid' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <ShieldAlert className="w-12 h-12 text-rose-600" />
            <p className="text-base font-bold text-rose-800">Could not verify authenticity</p>
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              The QR code does not match current laboratory records, or the result may have been changed after
              printing. Contact the laboratory before relying on this document.
            </p>
            <dl className="w-full text-xs space-y-1 border-t border-slate-200 pt-3 font-mono text-slate-600">
              <div>Req: {params.rn}</div>
              <div>Token: {params.tok}</div>
              {group?.status ? <div>Status on file: {group.status}</div> : null}
            </dl>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.search = '';
            window.location.href = url.href;
          }}
          className="w-full py-2 text-sm font-semibold text-[#0176d3] hover:underline print:hidden"
        >
          Return to Lab-TIS
        </button>
      </div>
    </div>
  );
}

/** True when URL is a public result verification link (bypasses login). */
export function isPublicVerifyResultUrl(): boolean {
  return new URLSearchParams(window.location.search).get('verify') === '1';
}
