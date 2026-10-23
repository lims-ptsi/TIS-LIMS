import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface PatientNotifyPayload {
  channel: 'sms' | 'email';
  to: string;
  subject?: string;
  body: string;
  requisitionId?: string;
  requisitionNumber?: string;
  caseNo?: string;
  patientName?: string;
  sentAt?: string;
}

function gmailTransport() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as PatientNotifyPayload | undefined;
  if (!payload?.channel || !payload.to?.trim() || !payload.body?.trim()) {
    return res.status(400).json({ error: 'Invalid notification payload' });
  }

  if (payload.channel === 'sms') {
    return res.status(501).json({
      error: 'SMS is not configured on this server. Use an SMS provider webhook or add Twilio env vars later.',
    });
  }

  if (payload.channel !== 'email') {
    return res.status(400).json({ error: 'Unsupported channel' });
  }

  const transport = gmailTransport();
  if (!transport) {
    return res.status(503).json({
      error: 'Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD on the server.',
    });
  }

  const fromUser = process.env.GMAIL_USER!.trim();
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Lab-TIS Clinical Laboratory';

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: payload.to.trim(),
      subject: payload.subject?.trim() || 'Laboratory results ready for pickup',
      text: payload.body,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[patient-notify]', message);
    return res.status(502).json({ error: message });
  }
}
