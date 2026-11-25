import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface SendInvitePayload {
  to: string;
  inviteUrl: string;
  roleLabel: string;
  recipientName?: string;
  invitedBy?: string;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as SendInvitePayload | undefined;
  if (!payload?.to?.trim() || !payload.inviteUrl?.trim() || !payload.roleLabel?.trim()) {
    return res.status(400).json({ error: 'Invalid invite payload' });
  }

  const transport = gmailTransport();
  if (!transport) {
    return res.status(503).json({
      error: 'Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD on the server.',
    });
  }

  const fromUser = process.env.GMAIL_USER!.trim();
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Lab-TIS Clinical Laboratory';
  const greetingName = payload.recipientName?.trim() || 'Team Member';
  const safeUrl = escapeHtml(payload.inviteUrl.trim());
  const safeRole = escapeHtml(payload.roleLabel.trim());

  const text = [
    `Hello ${greetingName},`,
    '',
    `TIS has invited you to create your Lab-TIS account with the desk role: ${payload.roleLabel}.`,
    '',
    'Open this link to set up your account (valid for 48 hours):',
    payload.inviteUrl.trim(),
    '',
    'You can complete setup with a password or link your Google account.',
    '',
    `— ${fromName}`,
  ].join('\n');

  const html = `
    <div style="margin: 0; padding: 32px 16px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dbe4f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);">
        <tr>
          <td style="background: linear-gradient(135deg, #0a2240 0%, #0176d3 100%); padding: 24px 28px; color: #ffffff;">
            <div style="font-size: 20px; font-weight: 700;">
              Lab-TIS Account Invitation
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px;">
            <p style="margin: 0 0 14px; font-size: 15px; font-weight: 600; color: #0f172a;">
              Hello ${escapeHtml(greetingName)},
            </p>
            <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
              <strong>TIS</strong> has invited you to create your Lab-TIS account with the desk role:
            </p>
            <div style="margin: 0 0 22px; padding: 12px 16px; background-color: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #0369a1; display: block;">
                Assigned Desk Role
              </span>
              <span style="font-size: 15px; font-weight: 700; color: #0a2240;">
                ${safeRole}
              </span>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 22px;">
              <tr>
                <td style="border-radius: 8px; background-color: #0176d3;">
                  <a href="${safeUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                    Accept Invite &amp; Create Account
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
              This one-time link is valid for <strong>48 hours</strong>. Sign in with your invited Google account to activate your access.
            </p>
            <div style="margin-top: 12px; padding: 10px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; word-break: break-all; color: #0176d3;">
              ${safeUrl}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            ${escapeHtml(fromName)} · Laboratory Information Management System
          </td>
        </tr>
      </table>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: payload.to.trim(),
      subject: `Lab-TIS Account Invitation (${payload.roleLabel})`,
      text,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send invite email';
    console.error('[send-invite]', message);
    return res.status(502).json({ error: message });
  }
}
