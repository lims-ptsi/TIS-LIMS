import { LabTestRequisition } from '../types/lims';
import { isValidPatientEmail, normalizePatientPhone } from '../utils/patientContact';
import {
  buildResultsReadyEmailContent,
  PICKUP_EMAIL_LAB_ADDRESS,
  PICKUP_EMAIL_LAB_NAME,
  PICKUP_EMAIL_LAB_PHONE,
} from './patientPickupEmailTemplate';

const NOTIFICATION_LOG_KEY = 'lims_patient_notifications_v1';

export interface ResultsReadyNotificationPayload {
  requisitionId: string;
  requisitionNumber: string;
  caseNo: string;
  patientName: string;
  channel: 'sms' | 'email';
  to: string;
  subject?: string;
  body: string;
  bodyHtml?: string;
  sentAt: string;
}

export interface SendResultsReadyResult {
  smsSent: boolean;
  emailSent: boolean;
  smsError?: string;
  emailError?: string;
  skippedReason?: string;
}

export function buildResultsReadySmsBody(req: LabTestRequisition): string {
  const name = (req.patientOrSubjectName || 'Patient').trim();
  const caseRef = req.caseNo || req.requisitionNumber;
  return (
    `${PICKUP_EMAIL_LAB_NAME}: Dear ${name}, your laboratory results (Case ${caseRef}) are COMPLETED and ready for pickup. ` +
    `Visit ${PICKUP_EMAIL_LAB_ADDRESS}. Questions: ${PICKUP_EMAIL_LAB_PHONE}. Please bring ID and OR/receipt.`
  );
}

export function buildResultsReadyEmail(req: LabTestRequisition): {
  subject: string;
  body: string;
  bodyHtml: string;
} {
  return buildResultsReadyEmailContent(req);
}

function resolvePatientNotifyWebhookUrl(): string | undefined {
  const raw = import.meta.env.VITE_PATIENT_NOTIFY_WEBHOOK_URL as string | undefined;
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window !== 'undefined') {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return new URL(path, window.location.origin).href;
  }
  return trimmed;
}

function appendNotificationLog(entry: ResultsReadyNotificationPayload): void {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    const list: ResultsReadyNotificationPayload[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* ignore storage errors */
  }
}

async function dispatchChannel(payload: ResultsReadyNotificationPayload): Promise<{ ok: boolean; error?: string }> {
  const webhook = resolvePatientNotifyWebhookUrl();

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: text || `Webhook returned ${res.status}` };
      }
      appendNotificationLog(payload);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  // Demo / local mode: log intended delivery (wire webhook in production for Twilio, SendGrid, etc.)
  console.info('[Patient notify]', payload.channel, payload.to, payload.body.slice(0, 120));
  appendNotificationLog(payload);
  return { ok: true };
}

/** Send SMS and/or email when staff explicitly trigger a pickup alert (not on result finalize). */
export async function sendResultsReadyPickupNotifications(
  req: LabTestRequisition
): Promise<SendResultsReadyResult> {
  const smsEnabled = isPatientSmsConfigured();
  const phone = smsEnabled ? normalizePatientPhone(req.patientPhone) : null;
  const email = isValidPatientEmail(req.patientEmail) ? String(req.patientEmail).trim() : null;

  if (!email && !phone) {
    return {
      smsSent: false,
      emailSent: false,
      skippedReason: smsEnabled
        ? 'No mobile number or email on this request. Add contact info when creating the lab request.'
        : 'No email on this request. SMS is optional and not set up yet — add a patient email on the lab request.',
    };
  }

  const sentAt = new Date().toISOString();
  let smsSent = false;
  let emailSent = false;
  let smsError: string | undefined;
  let emailError: string | undefined;

  if (phone) {
    const body = buildResultsReadySmsBody(req);
    const result = await dispatchChannel({
      requisitionId: req.id,
      requisitionNumber: req.requisitionNumber,
      caseNo: req.caseNo || req.requisitionNumber,
      patientName: req.patientOrSubjectName,
      channel: 'sms',
      to: phone,
      body,
      sentAt,
    });
    if (result.ok) smsSent = true;
    else smsError = result.error;
  }

  if (email) {
    const { subject, body, bodyHtml } = buildResultsReadyEmail(req);
    const result = await dispatchChannel({
      requisitionId: req.id,
      requisitionNumber: req.requisitionNumber,
      caseNo: req.caseNo || req.requisitionNumber,
      patientName: req.patientOrSubjectName,
      channel: 'email',
      to: email,
      subject,
      body,
      bodyHtml,
      sentAt,
    });
    if (result.ok) emailSent = true;
    else emailError = result.error;
  }

  return { smsSent, emailSent, smsError, emailError };
}

export function isPatientNotifyWebhookConfigured(): boolean {
  const webhook = import.meta.env.VITE_PATIENT_NOTIFY_WEBHOOK_URL as string | undefined;
  return Boolean(webhook?.trim());
}

/** Lab-wide SMS gateway (Twilio, etc.). Off by default — email-only pickup alerts. */
export function isPatientSmsConfigured(): boolean {
  const raw = import.meta.env.VITE_PATIENT_SMS_ENABLED as string | undefined;
  return raw === 'true' || raw === '1';
}

export function readPatientNotificationLog(): ResultsReadyNotificationPayload[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
