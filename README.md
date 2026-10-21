# AegisLIMS

Enterprise clinical & analytical Laboratory Information Management System (LIMS) SPA for Philippine-style lab workflows: requisitions, accessioning, results entry, Certificate of Analysis (CoA), and audit trail.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Optional Supabase (Postgres) persistence
- Offline-capable via `localStorage` when Supabase is not configured

## Quick start

```bash
npm install
cp .env.example .env   # optional: add Supabase URL + anon key
npm run dev            # http://localhost:5173
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Supabase (optional)

1. Create a Supabase project and copy URL + anon key into `.env`.
2. Run `supabase_setup.sql` in the Supabase SQL Editor (creates `requisitions`, `samples`, `audit_logs`, `examinations`).
3. If your project already has the first three tables only, also run `supabase_examinations.sql`.
4. Restart the dev server.

Synced to Supabase: requisitions, samples, audit logs, **examination catalog** (including Form 1–10 / Send Out).  
Without env vars, the app runs fully on browser `localStorage`.

Connectivity smoke test (credentials from env only):

```bash
node --env-file=.env test-supabase.js
```

## Demo login

Use any mock persona from the login screen. Demo passwords include `demo`, `admin`, or `password`.

## Main workflow

1. **Create request** / New Requisition  
2. **Submissions** → receive & accession specimens  
3. Enter / finalize results  
4. Release **Certificate of Analysis**  
5. Review **Audit trail**

## Project layout

```
src/
  App.tsx                 # Shell, tabs, orchestration
  components/views/       # Primary screens
  components/modals/      # Requisition, payment, results, CoA
  data/                   # Catalogs + localStorage stores
  services/limsService.ts # Supabase sync layer
  context/AuthContext.tsx # Mock persona auth
supabase_setup.sql        # Tables for requisitions, samples, audit_logs
```
