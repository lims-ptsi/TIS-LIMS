import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import nodemailer from 'nodemailer'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'

type PatientNotifyPayload = {
  channel?: 'sms' | 'email'
  to?: string
  subject?: string
  body?: string
  bodyHtml?: string
}

/** Local `/api/patient-notify` — uses Gmail from `.env` when configured (same handler as Vercel). */
function patientNotifyDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'patient-notify-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/patient-notify', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
        })
        req.on('end', () => {
          void (async () => {
            res.setHeader('Content-Type', 'application/json')
            let parsed: PatientNotifyPayload = {}
            try {
              parsed = raw ? (JSON.parse(raw) as PatientNotifyPayload) : {}
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }

            if (!parsed.channel || !parsed.to?.trim() || !parsed.body?.trim()) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid notification payload' }))
              return
            }

            if (parsed.channel === 'sms') {
              res.statusCode = 501
              res.end(
                JSON.stringify({
                  error: 'SMS is not configured on this server.',
                })
              )
              return
            }

            if (parsed.channel !== 'email') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Unsupported channel' }))
              return
            }

            const user = env.GMAIL_USER?.trim()
            const pass = env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')
            if (!user || !pass) {
              console.info('[dev patient-notify]', parsed.channel, parsed.to)
              res.statusCode = 200
              res.end(
                JSON.stringify({
                  ok: true,
                  demo: true,
                  message:
                    'GMAIL_USER / GMAIL_APP_PASSWORD missing in .env — logged only, not sent.',
                })
              )
              return
            }

            const fromName = env.GMAIL_FROM_NAME?.trim() || 'Lab-TIS Clinical Laboratory'
            try {
              const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass },
              })
              await transport.sendMail({
                from: `"${fromName}" <${user}>`,
                to: parsed.to.trim(),
                subject: parsed.subject?.trim() || 'Laboratory results ready for pickup',
                text: parsed.body,
                html: parsed.bodyHtml?.trim() || undefined,
              })
              console.info('[dev patient-notify] email sent to', parsed.to.trim())
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to send email'
              console.error('[dev patient-notify]', message)
              res.statusCode = 502
              res.end(JSON.stringify({ error: message }))
            }
          })()
        })
      })
    },
  }
}

// https://vite.dev/config/
function sendInviteDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'send-invite-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/send-invite', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
        })
        req.on('end', () => {
          void (async () => {
            res.setHeader('Content-Type', 'application/json')
            let parsed: {
              to?: string
              inviteUrl?: string
              roleLabel?: string
              recipientName?: string
              invitedBy?: string
            } = {}
            try {
              parsed = raw ? (JSON.parse(raw) as typeof parsed) : {}
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }

            if (!parsed.to?.trim() || !parsed.inviteUrl?.trim() || !parsed.roleLabel?.trim()) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid invite payload' }))
              return
            }

            const user = env.GMAIL_USER?.trim()
            const pass = env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')
            if (!user || !pass) {
              res.statusCode = 503
              res.end(
                JSON.stringify({
                  error: 'GMAIL_USER / GMAIL_APP_PASSWORD missing in .env — copy and share the invite link below.',
                })
              )
              return
            }

            const fromName = env.GMAIL_FROM_NAME?.trim() || 'Lab-TIS Clinical Laboratory'
            const greetingName = parsed.recipientName?.trim() || 'Team Member'
            const escapeHtml = (value: string) =>
              value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
            const safeUrl = escapeHtml(parsed.inviteUrl.trim())
            const safeRole = escapeHtml(parsed.roleLabel.trim())
            const text = [
              `Hello ${greetingName},`,
              '',
              `TIS has invited you to create your Lab-TIS account with the desk role: ${parsed.roleLabel}.`,
              '',
              'Open this link to set up your account (valid for 48 hours):',
              parsed.inviteUrl.trim(),
              '',
              'You can complete setup with a password or link your Google account.',
              '',
              `— ${fromName}`,
            ].join('\n')
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
            `

            try {
              const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass },
              })
              await transport.sendMail({
                from: `"${fromName}" <${user}>`,
                to: parsed.to.trim(),
                subject: `Lab-TIS Account Invitation (${parsed.roleLabel})`,
                text,
                html,
              })
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to send invite email'
              res.statusCode = 502
              res.end(JSON.stringify({ error: message }))
            }
          })()
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), patientNotifyDevApi(env), sendInviteDevApi(env)],
    server: {
      port: 5173,
      host: true,
    },
  }
})