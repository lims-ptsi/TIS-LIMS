import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Server,
  X,
} from 'lucide-react';
import { LabTestRequisition, Sample } from '../../types/lims';
import {
  buildResultsReadyEmail,
  buildResultsReadySmsBody,
  isPatientNotifyWebhookConfigured,
  readPatientNotificationLog,
} from '../../services/patientNotificationService';
import { isValidPatientEmail, normalizePatientPhone } from '../../utils/patientContact';
import { formatResultsPickupWhen, isResultsReleasedForPickup } from '../../utils/resultsPickup';

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

export interface PatientNotifyDrawerProps {
  requisition: LabTestRequisition;
  samples?: Sample[];
  canSend: boolean;
  onClose: () => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
}

export function PatientNotifyDrawer({
  requisition,
  samples,
  canSend,
  onClose,
  onSend,
  sending = false,
}: PatientNotifyDrawerProps) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const phoneRaw = requisition.patientPhone?.trim() || '';
  const emailRaw = requisition.patientEmail?.trim() || '';
  const phoneNorm = normalizePatientPhone(requisition.patientPhone);
  const emailOk = isValidPatientEmail(requisition.patientEmail);
  const smsBody = buildResultsReadySmsBody(requisition);
  const emailPreview = buildResultsReadyEmail(requisition);
  const webhookLive = isPatientNotifyWebhookConfigured();
  const resultsReady = isResultsReleasedForPickup(requisition, samples);

  const exams =
    (requisition.kindOfExamination?.length
      ? requisition.kindOfExamination
      : requisition.selectedTestNames) || [];

  const recentLog = useMemo(
    () =>
      readPatientNotificationLog().filter((e) => e.requisitionId === requisition.id).slice(0, 6),
    [requisition.id, requisition.resultsReadySmsSentAt, requisition.resultsReadyEmailSentAt]
  );

  const canDispatch =
    canSend && resultsReady && (phoneNorm || emailOk) && !sending;

  const requestClose = () => {
    if (sending || closing) return;
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
  }, [sending, closing]);

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
      aria-labelledby="patient-notify-drawer-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close notify patient panel"
        onClick={requestClose}
      />
      <div
        className={`relative w-full sm:w-[min(520px,100vw)] h-full bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] will-change-transform ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-sky-50/80 to-white flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-800/80">
              Patient pickup alert
            </p>
            <h2
              id="patient-notify-drawer-title"
              className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5"
            >
              Notify patient — results ready
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              SMS and/or email when the laboratory report is completed and released for pickup.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={sending}
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
              <div>
                <dt className="text-slate-500 text-xs">Request status</dt>
                <dd className="font-medium text-slate-800">{requisition.status.replace(/_/g, ' ')}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
              Readiness
            </h3>
            <ul className="space-y-2.5">
              <CheckRow
                ok={resultsReady}
                label="Results completed and released"
                detail={
                  resultsReady
                    ? 'Pickup alerts may be sent for this request.'
                    : 'Complete and validate results before notifying the patient.'
                }
              />
              <CheckRow
                ok={Boolean(phoneNorm)}
                label="Mobile number (SMS)"
                detail={
                  phoneRaw
                    ? phoneNorm
                      ? `Will send to ${phoneNorm}`
                      : 'Number on file is too short — use at least 10 digits (PH mobile).'
                    : 'No mobile on this request. Add it when creating the lab test request.'
                }
              />
              <CheckRow
                ok={emailOk}
                label="Email address"
                detail={
                  emailRaw
                    ? emailOk
                      ? `Will send to ${emailRaw}`
                      : 'Email format looks invalid.'
                    : 'No email on this request.'
                }
              />
              <CheckRow
                ok={canSend}
                label="Your role can send alerts"
                detail={
                  canSend
                    ? 'Release desk / accessioning staff may send pickup notifications.'
                    : 'Ask a supervisor or release desk staff to send this alert.'
                }
              />
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Delivery mode
              </h3>
            </div>
            {webhookLive ? (
              <p className="text-sm text-slate-700">
                Production webhook (<code className="text-xs bg-slate-100 px-1 rounded">VITE_PATIENT_NOTIFY_WEBHOOK_URL</code>
                ) will receive JSON for each channel (SMS / email) for your Twilio, SendGrid, or hospital gateway.
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                <span className="font-medium text-amber-900">Demo / local mode:</span> messages are logged to this browser
                (and the developer console). Set <code className="text-xs bg-slate-100 px-1 rounded">VITE_PATIENT_NOTIFY_WEBHOOK_URL</code> in{' '}
                <code className="text-xs bg-slate-100 px-1 rounded">.env</code> to deliver through your SMS/email provider.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-900">
              <MessageSquare className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">SMS preview</h3>
            </div>
            <p className="text-[11px] text-slate-600">
              To: {phoneNorm || '(no valid mobile)'}
            </p>
            <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-white/80 border border-sky-100 rounded-md p-3 max-h-40 overflow-y-auto">
              {smsBody}
            </pre>
          </section>

          <section className="rounded-lg border border-violet-200 bg-violet-50/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-violet-900">
              <Mail className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">Email preview</h3>
            </div>
            <p className="text-[11px] text-slate-600">
              To: {emailOk ? emailRaw : '(no valid email)'}
            </p>
            <p className="text-xs font-semibold text-slate-800">Subject: {emailPreview.subject}</p>
            <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-white/80 border border-violet-100 rounded-md p-3 max-h-48 overflow-y-auto">
              {emailPreview.body}
            </pre>
          </section>

          <section className="rounded-lg border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Last sent (this request)
              </h3>
            </div>
            <ul className="text-sm space-y-1 text-slate-700">
              <li>
                SMS:{' '}
                {requisition.resultsReadySmsSentAt
                  ? formatResultsPickupWhen(requisition.resultsReadySmsSentAt)
                  : 'Not sent yet'}
              </li>
              <li>
                Email:{' '}
                {requisition.resultsReadyEmailSentAt
                  ? formatResultsPickupWhen(requisition.resultsReadyEmailSentAt)
                  : 'Not sent yet'}
              </li>
            </ul>
            {recentLog.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-semibold uppercase text-slate-500 mb-2">
                  Recent log (this browser)
                </p>
                <ul className="space-y-2">
                  {recentLog.map((entry, i) => (
                    <li key={`${entry.sentAt}-${entry.channel}-${i}`} className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800 uppercase">{entry.channel}</span>{' '}
                      → {entry.to} · {formatResultsPickupWhen(entry.sentAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={requestClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canDispatch}
            onClick={() => void onSend()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-[#0176d3] hover:bg-[#0060b2] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : 'Send pickup alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
