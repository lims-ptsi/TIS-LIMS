import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { LabTestRequisition, Sample, AuditEntry } from '../types/lims';
import { ExaminationItem, AssignedFormType } from '../data/examinationCatalog';

function examinationToRow(item: ExaminationItem) {
  return {
    code: item.code,
    name: item.name,
    corporate_name: item.corporateName || null,
    category: item.category,
    corporate_category: item.corporateCategory || null,
    price: item.price,
    corporate_price: item.corporatePrice ?? null,
    corporate_code: item.corporateCode || null,
    specimen_type: item.specimenType || null,
    turnaround_hours: item.turnaroundHours ?? 4,
    methodology: item.methodology || null,
    notes: item.notes || null,
    is_active: item.isActive !== false,
    assigned_form: item.assignedForm || 'Form 1',
    send_out_platform:
      item.assignedForm === 'Send Out'
        ? (item.sendOutPlatform || 'Hi-Precision Diagnostics')
        : null,
    updated_at: new Date().toISOString(),
  };
}

function rowToExamination(row: Record<string, any>): ExaminationItem {
  const assignedForm = (row.assigned_form || 'Form 1') as AssignedFormType;
  return {
    code: row.code,
    name: row.name,
    corporateName: row.corporate_name || undefined,
    category: row.category,
    corporateCategory: row.corporate_category || undefined,
    price: Number(row.price) || 0,
    corporatePrice: row.corporate_price != null ? Number(row.corporate_price) : undefined,
    corporateCode: row.corporate_code || undefined,
    specimenType: row.specimen_type || undefined,
    turnaroundHours: row.turnaround_hours != null ? Number(row.turnaround_hours) : 4,
    methodology: row.methodology || undefined,
    notes: row.notes || undefined,
    isActive: row.is_active !== false,
    assignedForm,
    sendOutPlatform:
      assignedForm === 'Send Out'
        ? (row.send_out_platform || 'Hi-Precision Diagnostics')
        : undefined,
  };
}

export const limsService = {
  // Check if Supabase live sync is enabled
  isLive: isSupabaseConfigured && !!supabase,

  // 1. Requisitions
  async fetchRequisitions(): Promise<LabTestRequisition[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] fetchRequisitions warning:', error.message);
        return null;
      }

      // Map Supabase DB columns to frontend LabTestRequisition model
      return (data || []).map((row) => ({
        id: row.id,
        requisitionNumber: row.requisition_number,
        requestDate: row.request_date || new Date().toISOString().split('T')[0],
        patientOrSubjectName: row.patient_name,
        patientId: row.patient_record_id || undefined,
        firstName: row.first_name || undefined,
        middleName: row.middle_name || undefined,
        lastName: row.last_name || undefined,
        suffix: row.suffix || undefined,
        patientDob: row.birthday || '',
        patientAddress: row.address || '',
        caseNo: row.case_no || '',
        patientAge: Number(row.age) || 0,
        patientGender: row.sex || 'Male',
        civilStatus: row.civil_status || 'Single',
        kindOfExamination: Array.isArray(row.kind_of_examination) ? row.kind_of_examination : [],
        orderingPhysicianOrPI: row.requesting_physician,
        orNumber: row.or_number || '',
        chargeSlipNumber: row.charge_slip_number || '',
        organizationOrClient: row.organization_client || '',
        externalRef: row.case_no || row.requisition_number,
        priority: row.priority || 'ROUTINE',
        selectedTestIds: row.selected_test_ids || ['test-cbc'],
        selectedTestNames: Array.isArray(row.kind_of_examination) ? row.kind_of_examination : ['CBC'],
        specimenTypes: Array.isArray(row.specimen_types) ? row.specimen_types : ['Whole Blood (K2-EDTA)'],
        tubeCount: Number(row.tube_count) || 1,
        patientCategory: row.patient_category || undefined,
        clinicalNotes: row.clinical_notes || '',
        status: row.status || 'SUBMITTED',
        tatDeadline: row.tat_deadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }));
    } catch (err) {
      console.warn('[Supabase] Error connecting to requisitions:', err);
      return null;
    }
  },

  async createRequisition(req: LabTestRequisition): Promise<{ success: boolean; error?: string; isOffline?: boolean }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: true, isOffline: true };
    }
    try {
      const payload: Record<string, any> = {
        requisition_number: req.requisitionNumber,
        request_date: req.requestDate,
        patient_name: req.patientOrSubjectName,
        patient_record_id: req.patientId || null,
        first_name: req.firstName || null,
        middle_name: req.middleName || null,
        last_name: req.lastName || null,
        suffix: req.suffix || null,
        birthday: req.patientDob || null,
        age: req.patientAge,
        sex: req.patientGender,
        civil_status: req.civilStatus,
        address: req.patientAddress,
        case_no: req.caseNo,
        requesting_physician: req.orderingPhysicianOrPI,
        kind_of_examination: req.kindOfExamination,
        or_number: req.orNumber,
        charge_slip_number: req.chargeSlipNumber,
        organization_client: req.organizationOrClient,
        priority: req.priority,
        specimen_types: req.specimenTypes,
        tube_count: req.tubeCount,
        patient_category: req.patientCategory || 'OPD',
        clinical_notes: req.clinicalNotes,
        status: req.status,
      };

      const optionalColumns = [
        'patient_record_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'patient_category',
      ];
      let currentPayload = { ...payload };
      for (let attempt = 0; attempt < optionalColumns.length + 1; attempt += 1) {
        const { error } = await supabase.from('requisitions').insert([currentPayload]);
        if (!error) return { success: true };
        const missing = optionalColumns.find((column) => error.message.includes(column) && column in currentPayload);
        if (!missing) {
          console.error('[Supabase] createRequisition error:', error.message);
          return { success: false, error: error.message };
        }
        console.warn(`[Supabase] ${missing} column missing. Retrying insert without it...`);
        const nextPayload = { ...currentPayload };
        delete nextPayload[missing];
        currentPayload = nextPayload;
      }
      return { success: false, error: 'Could not save the requisition.' };
    } catch (err: any) {
      console.error('[Supabase] createRequisition exception:', err);
      return { success: false, error: err?.message || 'Database network error' };
    }
  },

  async updateRequisitionStatus(id: string, status: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('[Supabase] updateRequisitionStatus error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] updateRequisitionStatus exception:', err);
      return false;
    }
  },

  async updateRequisitionCategory(id: string, category: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ patient_category: category })
        .eq('id', id);

      if (error) {
        if (error.message.includes('patient_category') || error.message.includes('schema cache')) {
          console.warn('[Supabase] patient_category column not yet in DB schema. Category stored in frontend state.');
          return true;
        }
        console.error('[Supabase] updateRequisitionCategory error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] updateRequisitionCategory exception:', err);
      return false;
    }
  },

  async updateSampleCategory(externalIdOrBarcode: string, category: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('samples')
        .update({ patient_category: category })
        .or(`barcode.eq.${externalIdOrBarcode},external_id.eq.${externalIdOrBarcode}`);

      if (error) {
        if (error.message.includes('patient_category') || error.message.includes('schema cache')) {
          console.warn('[Supabase] patient_category column not yet in samples DB schema.');
          return true;
        }
        console.error('[Supabase] updateSampleCategory error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] updateSampleCategory exception:', err);
      return false;
    }
  },

  // 2. Samples
  async createSample(sample: Sample): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('samples').insert([
        {
          barcode: sample.barcode,
          external_id: sample.externalId,
          sample_type: sample.sampleType,
          patient_name: sample.patientOrSourceName,
          patient_category: sample.patientCategory || 'OPD',
          priority: sample.priority,
          status: sample.status,
          storage_facility: sample.storageLocation.facility,
          storage_room: sample.storageLocation.room,
          storage_unit: sample.storageLocation.unit,
          storage_rack: sample.storageLocation.rack,
          storage_box: sample.storageLocation.box,
          storage_well: sample.storageLocation.well,
          storage_temp: sample.storageLocation.temperature,
          volume_ml: sample.volumeMl,
        },
      ]);

      if (error) {
        console.error('[Supabase] createSample error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] createSample exception:', err);
      return false;
    }
  },

  // 3. Audit Logs (21 CFR Part 11)
  async createAuditLog(log: AuditEntry): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('audit_logs').insert([
        {
          table_name: log.tableName,
          record_id: log.recordId,
          action: log.action,
          user_name: log.user,
          user_role: log.userRole,
          ip_address: log.ipAddress,
          reason_for_change: log.reasonForChange,
          entry_hash: log.entryHash,
        },
      ]);

      if (error) {
        console.error('[Supabase] createAuditLog error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] createAuditLog exception:', err);
      return false;
    }
  },

  // 4. Examinations catalog (Forms 1–10 / Send Out)
  async fetchExaminations(): Promise<ExaminationItem[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('examinations')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.warn('[Supabase] fetchExaminations warning:', error.message);
        return null;
      }
      if (!data || data.length === 0) return [];
      return data.map(rowToExamination);
    } catch (err) {
      console.warn('[Supabase] fetchExaminations exception:', err);
      return null;
    }
  },

  async upsertExamination(item: ExaminationItem): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }
    try {
      const row = examinationToRow(item);
      const { error } = await supabase
        .from('examinations')
        .upsert([row], { onConflict: 'code' });

      if (error) {
        console.error('[Supabase] upsertExamination error:', error.message, {
          code: row.code,
          assigned_form: row.assigned_form,
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Supabase] upsertExamination exception:', err);
      return { success: false, error: err?.message || 'Database network error' };
    }
  },

  async upsertExaminations(items: ExaminationItem[]): Promise<{ success: boolean; error?: string; count?: number }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: true, count: 0 };
    }
    if (!items.length) return { success: true, count: 0 };

    try {
      // Upsert in chunks to avoid payload limits
      const chunkSize = 50;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize).map(examinationToRow);
        const { error } = await supabase
          .from('examinations')
          .upsert(chunk, { onConflict: 'code' });
        if (error) {
          console.error('[Supabase] upsertExaminations error:', error.message);
          return { success: false, error: error.message };
        }
      }
      return { success: true, count: items.length };
    } catch (err: any) {
      console.error('[Supabase] upsertExaminations exception:', err);
      return { success: false, error: err?.message || 'Database network error' };
    }
  },

  // 5. Examination result forms (all inputs on the assigned form)
  async fetchTestResults(): Promise<
    | {
        requisitionId: string;
        requisitionNumber: string | null;
        results: Record<string, any>;
        medtechInfo: Record<string, any>;
        status: string;
        updatedAt: string;
      }[]
    | null
  > {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('requisition_id, requisition_number, results, medtech_info, status, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] fetchTestResults warning:', error.message);
        return null;
      }

      return (data || []).map((row) => ({
        requisitionId: row.requisition_id,
        requisitionNumber: row.requisition_number || null,
        results: row.results && typeof row.results === 'object' ? row.results : {},
        medtechInfo: row.medtech_info && typeof row.medtech_info === 'object' ? row.medtech_info : {},
        status: row.status || 'IN_TESTING',
        updatedAt: row.updated_at || '',
      }));
    } catch (err) {
      console.warn('[Supabase] fetchTestResults exception:', err);
      return null;
    }
  },

  async upsertTestResults(payload: {
    requisitionId: string;
    requisitionNumber?: string | null;
    results: Record<string, any>;
    medtechInfo: Record<string, any>;
    status: string;
  }): Promise<{ success: boolean; error?: string; missingTable?: boolean }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.from('test_results').upsert(
        [
          {
            requisition_id: payload.requisitionId,
            requisition_number: payload.requisitionNumber || null,
            results: payload.results,
            medtech_info: payload.medtechInfo,
            status: payload.status,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'requisition_id' }
      );

      if (error) {
        const missing =
          error.message.includes('test_results') ||
          error.message.includes('schema cache') ||
          error.message.includes('relation');
        console.error('[Supabase] upsertTestResults error:', error.message);
        return { success: false, error: error.message, missingTable: missing };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Supabase] upsertTestResults exception:', err);
      return { success: false, error: err?.message || 'Database network error' };
    }
  },

  async deleteExamination(code: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('examinations').delete().eq('code', code);
      if (error) {
        console.error('[Supabase] deleteExamination error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] deleteExamination exception:', err);
      return false;
    }
  },
};
