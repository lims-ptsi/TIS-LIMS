import { LabTestRequisition } from '../types/lims';
import {
  PTSI_LAB_ADDRESS,
  PTSI_LAB_NAME,
  PTSI_LAB_PHONE,
} from '../data/labContact';

export const PICKUP_EMAIL_LAB_NAME = PTSI_LAB_NAME;
export const PICKUP_EMAIL_LAB_ADDRESS = PTSI_LAB_ADDRESS;
export const PICKUP_EMAIL_LAB_PHONE = PTSI_LAB_PHONE;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildResultsReadyEmailContent(req: LabTestRequisition): {
  subject: string;
  body: string;
  bodyHtml: string;
} {
  const name = (req.patientOrSubjectName || 'Patient').trim();
  const caseRef = (req.caseNo || req.requisitionNumber || '—').trim();
  const reqNo = (req.requisitionNumber || '—').trim();
  const exams =
    (req.kindOfExamination?.length ? req.kindOfExamination : req.selectedTestNames) || [];
  const examLine =
    exams.length > 0
      ? exams.slice(0, 5).join(', ') + (exams.length > 5 ? ` (+${exams.length - 5} more)` : '')
      : '';

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
    PICKUP_EMAIL_LAB_NAME,
    PICKUP_EMAIL_LAB_ADDRESS,
    `Mobile: ${PICKUP_EMAIL_LAB_PHONE}`,
    '',
    'Please bring a valid ID and your official receipt (OR) when collecting your results.',
    '',
    'This is an automated message. Do not reply to this email.',
  ]
    .filter(Boolean)
    .join('\n');

  const bodyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#0b1f3a 0%,#0c2d55 100%);padding:22px 28px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7eb8f2;">Lab-TIS</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">Results ready for pickup</h1>
              <p style="margin:10px 0 0;font-size:13px;color:#cbd5e1;line-height:1.45;">Clinical Diagnostic Laboratory</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#334155;">Dear <strong style="color:#0f172a;">${escapeHtml(name)}</strong>,</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
                Your laboratory examination results are <strong style="color:#047857;">completed</strong> and may be collected at the release desk during regular operating hours.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;line-height:1.5;">
                      <tr>
                        <td style="padding:4px 0;color:#64748b;width:38%;vertical-align:top;">Case number</td>
                        <td style="padding:4px 0;font-weight:600;color:#0f172a;font-family:Consolas,Monaco,monospace;">${escapeHtml(caseRef)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;vertical-align:top;">Requisition</td>
                        <td style="padding:4px 0;font-weight:600;color:#0f172a;font-family:Consolas,Monaco,monospace;">${escapeHtml(reqNo)}</td>
                      </tr>
                      ${
                        examLine
                          ? `<tr>
                        <td style="padding:4px 0;color:#64748b;vertical-align:top;">Examination(s)</td>
                        <td style="padding:4px 0;font-weight:500;color:#334155;">${escapeHtml(examLine)}</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px;border-left:4px solid #0878e8;background:#f0f9ff;border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0369a1;">Pickup location</p>
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;line-height:1.4;">${escapeHtml(PICKUP_EMAIL_LAB_NAME)}</p>
                    <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">${escapeHtml(PICKUP_EMAIL_LAB_ADDRESS)}<br />Mobile: ${escapeHtml(PICKUP_EMAIL_LAB_PHONE)}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;font-size:13px;line-height:1.55;color:#92400e;">
                    <strong style="color:#78350f;">Please bring:</strong> a valid ID and your official receipt (OR) when collecting your results.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">
                This is an automated message from Lab-TIS. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, body, bodyHtml };
}