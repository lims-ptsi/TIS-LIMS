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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), patientNotifyDevApi(env)],
    server: {
      port: 5173,
      host: true,
    },
  }
})