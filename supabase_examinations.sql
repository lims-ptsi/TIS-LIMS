-- =========================================================================
-- AEGIS LIMS — Examinations catalog table (run in SQL Editor if missing)
-- Project already has requisitions / samples / audit_logs.
-- This adds Forms 1–10 + Send Out persistence.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.examinations (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    corporate_name TEXT,
    category TEXT NOT NULL DEFAULT 'OTHERS',
    corporate_category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    corporate_price NUMERIC,
    corporate_code TEXT,
    specimen_type TEXT,
    turnaround_hours INTEGER DEFAULT 4,
    methodology TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_form TEXT DEFAULT 'Form 1',
    send_out_platform TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS examinations_assigned_form_idx
  ON public.examinations (assigned_form);

ALTER TABLE public.examinations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.examinations TO anon, authenticated, service_role;

SELECT 'examinations table ready' AS status;
