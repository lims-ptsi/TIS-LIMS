/**
 * Manual connectivity check against Supabase.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment
 * (or a local .env loaded by your shell). Never commit real keys.
 *
 * Usage:
 *   node --env-file=.env test-supabase.js
 *   # or set env vars manually, then: node test-supabase.js
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Missing credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. node --env-file=.env test-supabase.js).'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection...');

  const testReq = {
    requisition_number: 'REQ-2026-TEST-' + Math.floor(1000 + Math.random() * 9000),
    request_date: '2026-10-07',
    patient_name: 'TEST PATIENT DELA CRUZ',
    birthday: '1990-06-15',
    age: 36,
    sex: 'Male',
    civil_status: 'Single',
    address: '142 RIZAL AVENUE, QUEZON CITY',
    case_no: 'CASE-2026-TEST',
    requesting_physician: 'DR. MARCUS VANCE, MD',
    kind_of_examination: ['COMPLETE BLOOD COUNT WITH PLATELET (CBC)'],
    or_number: 'OR-999999',
    charge_slip_number: 'CS-99999',
    organization_client: 'CLINICAL LABORATORY',
    priority: 'ROUTINE',
    specimen_types: ['WHOLE BLOOD (K2-EDTA)'],
    tube_count: 2,
    clinical_notes: 'TEST CLINICAL NOTES',
    status: 'SUBMITTED',
  };

  const res1 = await supabase.from('requisitions').insert([testReq]).select();
  console.log('Requisitions insert:', res1.error ? res1.error : 'SUCCESS');

  const res2 = await supabase.from('samples').insert([{
    barcode: 'SMP-TEST-001',
    external_id: 'EXT-001',
    sample_type: 'Whole Blood',
    patient_name: 'TEST PATIENT',
    priority: 'ROUTINE',
    status: 'ACCESSIONED'
  }]).select();
  console.log('Samples insert:', res2.error ? res2.error : 'SUCCESS');

  const res3 = await supabase.from('audit_logs').insert([{
    table_name: 'requisitions',
    record_id: 'req-001',
    action: 'INSERT',
    user_name: 'TEST USER',
    reason_for_change: 'Testing audit log insert'
  }]).select();
  console.log('Audit logs insert:', res3.error ? res3.error : 'SUCCESS');
}

test();
