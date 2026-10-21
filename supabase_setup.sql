-- =========================================================================
-- AEGIS LIMS - SUPABASE DATABASE CONFIGURATION & RLS POLICIES
-- Run this SQL in your Supabase Project -> SQL Editor (Untitled query)
-- =========================================================================

-- 1. Create Requisitions Table (if not already created)
CREATE TABLE IF NOT EXISTS public.requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_number TEXT UNIQUE NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    patient_name TEXT NOT NULL,
    patient_category TEXT DEFAULT 'OPD',
    birthday DATE,
    age INTEGER,
    sex TEXT,
    civil_status TEXT,
    address TEXT,
    case_no TEXT,
    requesting_physician TEXT NOT NULL,
    kind_of_examination JSONB DEFAULT '[]'::jsonb,
    or_number TEXT,
    charge_slip_number TEXT,
    organization_client TEXT DEFAULT 'CLINICAL LABORATORY',
    priority TEXT DEFAULT 'ROUTINE',
    specimen_types JSONB DEFAULT '["WHOLE BLOOD (K2-EDTA)"]'::jsonb,
    tube_count INTEGER DEFAULT 1,
    clinical_notes TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    tat_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure patient_category column exists if table was already created
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS patient_category TEXT DEFAULT 'OPD';
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS patient_record_id TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS suffix TEXT;
CREATE INDEX IF NOT EXISTS requisitions_patient_record_id_idx
  ON public.requisitions (patient_record_id);

-- 2. Create Samples Table (if not already created)
CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode TEXT UNIQUE NOT NULL,
    external_id TEXT,
    sample_type TEXT,
    patient_name TEXT,
    patient_category TEXT DEFAULT 'OPD',
    priority TEXT DEFAULT 'ROUTINE',
    status TEXT DEFAULT 'ACCESSIONED',
    storage_facility TEXT,
    storage_room TEXT,
    storage_unit TEXT,
    storage_rack TEXT,
    storage_box TEXT,
    storage_well TEXT,
    storage_temp TEXT,
    volume_ml NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure patient_category column exists if table was already created
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS patient_category TEXT DEFAULT 'OPD';

-- 3. Create Audit Logs Table (if not already created)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    ip_address TEXT,
    reason_for_change TEXT,
    entry_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Examinations Catalog Table (Forms 1–10 / Send Out + pricing)
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

-- 4b. Examination result forms (every input on the assigned paper form)
-- requisition_id is the app id (req-… or uuid). requisition_number is the stable case key.
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id TEXT NOT NULL UNIQUE,
    requisition_number TEXT,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    medtech_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'IN_TESTING',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS test_results_requisition_number_idx
  ON public.test_results (requisition_number);

-- =========================================================================
-- 5. ENABLE ACCESS POLICIES (Fix Row Level Security 42501 error)
-- You can either disable RLS or add public/anon policies.
-- =========================================================================

-- Option A: Disable RLS for full client app direct sync
ALTER TABLE public.requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results DISABLE ROW LEVEL SECURITY;

-- Option B: Grant full permissions to anon & authenticated roles
GRANT ALL ON public.requisitions TO anon, authenticated, service_role;
GRANT ALL ON public.samples TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;
GRANT ALL ON public.examinations TO anon, authenticated, service_role;
GRANT ALL ON public.test_results TO anon, authenticated, service_role;

-- Notify completion
SELECT 'Supabase LIMS Tables & Permissions Configured Successfully!' AS status;
