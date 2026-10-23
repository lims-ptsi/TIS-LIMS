import { LabTestRequisition } from '../types/lims';
import { isValidPatientEmail, normalizePatientPhone } from '../utils/patientContact';

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
  sentAt: string;
}

export interface SendResultsReadyResult {
  smsSent: boolean;
  emailSent: boolean;
  smsError?: string;
  emailError?: string;
  skippedReason?: string;
}

const LAB_NAME = 'Philippine Tuberculosis Society, Inc. — Clinical Diagnostic Laboratory';
const LAB_ADDRESS = 'Quezon Institute Compound, E. Rodriguez Sr. Avenue, Quezon City';
const LAB_PHONE = '(02) 0000 - 0000';

export function buildResultsReadySmsBody(req: LabTestRequisition): string {
  const name = (req.patientOrSubjectName || 'Patient').trim();
  const caseRef = req.caseNo || req.requisitionNumber;
  return (
    `${LAB_NAME}: Dear ${name}, your laboratory results (Case ${caseRef}) are COMPLETED and ready for pickup. ` +
    `Visit ${LAB_ADDRESS}. Questions: ${LAB_PHONE}. Please bring ID and OR/receipt.`
  );
}

export function buildResultsReadyEmail(req: LabTestRequisition): {
  subject: string;
  body: string;
} {
  const name = (req.patientOrSubjectName || 'Patient').trim();
  const caseRef = req.caseNo || req.requisitionNumber;
  const reqNo = req.requisitionNumber;
  const exams =
    (req.kindOfExamination?.length ? req.kindOfExamination : req.selectedTestNames) || [];
  const examLine = exams.slice(0, 5).join(', ') + (exams.length > 5 ? ` (+${exams.length - 5} more)` : '');

  const subject = `Laboratory results ready for pickup — ${caseRef}`;
  const body = [
    `Dear ${name},`,
    '',
    'Your laboratory examination results have been completed and are ready for pickup at the laboratory release desk.',
    '',
    `Case number: ${caseRef}`,
    `Requisition: ${reqNo}`,
    examLine ? `Examination(s): ${examLine}` : '',
    '',
    'Pickup location:',
    LAB_NAME,
    LAB_ADDRESS,
    `Tel: ${LAB_PHONE}`,
    '',
    'Please bring a valid ID and your official receipt (OR) when collecting your results.',
    '',
    'This is an automated message. Do not reply to this email.',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, body };
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
  const webhook = import.meta.env.VITE_PATIENT_NOTIFY_WEBHOOK_URL as string | undefined;

  if (webhook?.trim()) {
    try {
      const res = await fetch(webhook.trim(), {
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

/** Send SMS and/or email when results are completed and ready for patient pickup. */
export async function sendResultsReadyPickupNotifications(
  req: LabTestRequisition
): Promise<SendResultsReadyResult> {
  const phone = normalizePatientPhone(req.patientPhone);
  const email = isValidPatientEmail(req.patientEmail) ? String(req.patientEmail).trim() : null;

  if (!phone && !email) {
    return {
      smsSent: false,
      emailSent: false,
      skippedReason: 'No mobile number or email on this request. Add contact info when creating the lab request.',
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
    const { subject, body } = buildResultsReadyEmail(req);
    const result = await dispatchChannel({
      requisitionId: req.id,
      requisitionNumber: req.requisitionNumber,
      caseNo: req.caseNo || req.requisitionNumber,
      patientName: req.patientOrSubjectName,
      channel: 'email',
      to: email,
      subject,
      body,
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

export function readPatientNotificationLog(): ResultsReadyNotificationPayload[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
