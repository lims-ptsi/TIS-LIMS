import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { LabTestRequisition, Sample } from '../../types/lims';
import {
  formatResultsPickupWhen,
  isResultsPickedUp,
  isResultsReleasedForPickup,
} from '../../utils/resultsPickup';

function CheckRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <li className="flex gap-2.5 text-sm">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
      )}
      <div>
        <span className={`font-medium ${ok ? 'text-slate-800' : 'text-amber-900'}`}>{label}</span>
        {detail ? <p className="text-xs text-slate-500 mt-0.5">{detail}</p> : null}
      </div>
    </li>
  );
}

export interface ResultsPickupDrawerProps {
  requisition: LabTestRequisition;
  samples?: Sample[];
  markAsPickedUp: boolean;
  canRecord: boolean;
  currentUserName: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  saving?: boolean;
}

export function ResultsPickupDrawer({
  requisition,
  samples,
  markAsPickedUp,
  canRecord,
  currentUserName,
  onClose,
  onConfirm,
  saving = false,
}: ResultsPickupDrawerProps) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const pickedUp = isResultsPickedUp(requisition);
  const resultsReady = isResultsReleasedForPickup(requisition, samples);
  const exams =
    (requisition.kindOfExamination?.length
      ? requisition.kindOfExamination
      : requisition.selectedTestNames) || [];

  const canConfirm =
    canRecord &&
    !saving &&
    (markAsPickedUp ? resultsReady && !pickedUp : pickedUp);

  const requestClose = () => {
    if (saving || closing) return;
    setClosing(true);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 280);
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, closing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-pickup-drawer-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close pickup panel"
        onClick={requestClose}
      />
      <div
        className={`relative w-full sm:w-[min(520px,100vw)] h-full bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] will-change-transform ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50/80 to-white flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-800/80">
              Results release desk
            </p>
            <h2
              id="results-pickup-drawer-title"
              className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5"
            >
              {markAsPickedUp ? 'Mark results picked up' : 'Clear pickup record'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {markAsPickedUp
                ? 'Record that the patient (or authorized representative) collected the official laboratory report.'
                : 'Remove the pickup timestamp if the record was entered in error.'}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Request</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Patient</dt>
                <dd className="font-semibold text-slate-900">{requisition.patientOrSubjectName}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-slate-500 text-xs">Case no.</dt>
                  <dd className="font-medium text-slate-800">{requisition.caseNo || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Requisition</dt>
                  <dd className="font-medium text-slate-800">{requisition.requisitionNumber}</dd>
                </div>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Examination(s)</dt>
                <dd className="font-medium text-slate-800 text-xs leading-relaxed">
                  {exams.length ? exams.join(', ') : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={`rounded-lg border p-4 ${
              pickedUp ? 'border-emerald-200 bg-emerald-50/50' : 'border-violet-200 bg-violet-50/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <PackageCheck className={`w-4 h-4 ${pickedUp ? 'text-emerald-700' : 'text-violet-700'}`} />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Pickup status
              </h3>
            </div>
            {pickedUp ? (
              <dl className="text-sm space-y-1.5">
                <div>
                  <dt className="text-slate-500 text-xs">Status</dt>
                  <dd className="font-semibold text-emerald-900">Picked up by patient</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Recorded at</dt>
                  <dd className="font-medium text-slate-800">
                    {formatResultsPickupWhen(requisition.resultsPickedUpAt) || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Recorded by</dt>
                  <dd className="font-medium text-slate-800">
                    {requisition.resultsPickedUpBy?.trim() || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-violet-900 font-medium">Awaiting patient pickup</p>
            )}
          </section>

          {markAsPickedUp ? (
            <>
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                  Before you confirm
                </h3>
                <ul className="space-y-2.5">
                  <CheckRow
                    ok={resultsReady}
                    label="Results completed and released"
                    detail={
                      resultsReady
                        ? 'Official report may be released to the patient.'
                        : 'Complete and validate results before recording pickup.'
                    }
                  />
                  <CheckRow
                    ok={canRecord}
                    label="Release desk authorization"
                    detail={
                      canRecord
                        ? 'Your role may record pickup on the audit trail.'
                        : 'Ask release desk or supervisor staff to record pickup.'
                    }
                  />
                  <CheckRow
                    ok={!pickedUp}
                    label="Not already marked picked up"
                    detail={
                      pickedUp
                        ? 'Clear the existing record first if you need to re-enter.'
                        : 'No prior pickup timestamp on this request.'
                    }
                  />
                </ul>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Release desk checklist
                  </h3>
                </div>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                  <li>Verify patient identity (valid ID) or authorized representative with letter.</li>
                  <li>Match case number and patient name to the printed result form / CoA.</li>
                  <li>Confirm official receipt (OR) or charge slip when required.</li>
                  <li>Hand over only completed, signed laboratory reports.</li>
                </ul>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Audit record (on confirm)
                  </h3>
                </div>
                <p className="text-sm text-slate-700">
                  Pickup will be stamped with the current date and time and attributed to{' '}
                  <span className="font-semibold text-slate-900">{currentUserName}</span>. An entry is
                  written to the audit trail and synced to Supabase when configured.
                </p>
                {(requisition.resultsReadySmsSentAt || requisition.resultsReadyEmailSentAt) && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    Patient was notified:{' '}
                    {[
                      requisition.resultsReadySmsSentAt
                        ? `SMS ${formatResultsPickupWhen(requisition.resultsReadySmsSentAt)}`
                        : '',
                      requisition.resultsReadyEmailSentAt
                        ? `Email ${formatResultsPickupWhen(requisition.resultsReadyEmailSentAt)}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Clear pickup record
              </h3>
              <p className="text-sm text-amber-950">
                This removes the pickup timestamp and staff name from this requisition. Use only when
                pickup was recorded by mistake. The patient will show as{' '}
                <span className="font-semibold">awaiting pickup</span> again in submissions and specimen
                views.
              </p>
              {!pickedUp ? (
                <p className="text-xs text-amber-800">There is no pickup record to clear.</p>
              ) : null}
            </section>
          )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => void onConfirm()}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              markAsPickedUp
                ? 'bg-violet-700 hover:bg-violet-800'
                : 'bg-slate-700 hover:bg-slate-800'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            {saving
              ? 'Saving…'
              : markAsPickedUp
                ? 'Confirm pickup'
                : 'Clear pickup record'}
          </button>
        </div>
      </div>
    </div>
  );
}
