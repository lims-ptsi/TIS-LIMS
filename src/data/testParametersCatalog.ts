export interface ParameterDef {
  id: string;
  code: string;
  name: string;
  unit?: string;
  dataType: 'NUMERIC' | 'TEXT' | 'SELECT' | 'CALCULATED';
  options?: string[]; // For SELECT
  specMin?: number;
  specMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  normalText?: string;
  calculationFormula?: string;
  defaultValue?: string;
}

export interface ExaminationTemplate {
  examCode: string;
  examName: string;
  category: string;
  methodology?: string;
  specimenType?: string;
  parameters: ParameterDef[];
}

export const DEFAULT_EXAMINATION_TEMPLATES: Record<string, ExaminationTemplate> = {
  // 1. HEMATOLOGY
  // Result Form 6 — CBC (Male SI ranges; female ranges arrive with RF-06F)
  '1010': {
    examCode: '1010',
    examName: 'COMPLETE BLOOD COUNT W/ PLATELET COUNT (CBC)',
    category: 'HEMATOLOGY',
    methodology: 'Automated 5-Part Cell Counter & Flow Cytometry',
    specimenType: 'Whole Blood (K2-EDTA)',
    parameters: [
      { id: 'p_hgb', code: 'HGB', name: 'Hemoglobin', unit: 'g/L', dataType: 'NUMERIC', specMin: 140.0, specMax: 180.0, criticalMin: 70.0, criticalMax: 200.0, defaultValue: '', normalText: '140 - 180' },
      { id: 'p_hct', code: 'HCT', name: 'Hematocrit', unit: '% VOLUME', dataType: 'NUMERIC', specMin: 42.0, specMax: 54.0, criticalMin: 21.0, criticalMax: 60.0, defaultValue: '', normalText: '42 - 54' },
      { id: 'p_rbc', code: 'RBC', name: 'RBC Count', unit: 'x10¹²/L', dataType: 'NUMERIC', specMin: 5.0, specMax: 6.2, criticalMin: 2.5, criticalMax: 7.0, defaultValue: '', normalText: '5 - 6.2' },
      { id: 'p_plt', code: 'PLT', name: 'Platelets', unit: 'x10⁹/L', dataType: 'NUMERIC', specMin: 150.0, specMax: 450.0, criticalMin: 40.0, criticalMax: 900.0, defaultValue: '', normalText: '150 - 450' },
      { id: 'p_wbc', code: 'WBC', name: 'WBC Count', unit: 'x10⁹/L', dataType: 'NUMERIC', specMin: 4.0, specMax: 10.0, criticalMin: 2.0, criticalMax: 30.0, defaultValue: '', normalText: '4 - 10' },
      { id: 'p_mcv', code: 'MCV', name: 'MCV', unit: 'fL', dataType: 'NUMERIC', specMin: 80.0, specMax: 100.0, defaultValue: '', normalText: '80 - 100' },
      { id: 'p_mch', code: 'MCH', name: 'MCH', unit: 'pg', dataType: 'NUMERIC', specMin: 27.0, specMax: 34.0, defaultValue: '', normalText: '27 - 34' },
      { id: 'p_mchc', code: 'MCHC', name: 'MCHC', unit: 'g/L', dataType: 'NUMERIC', specMin: 310.0, specMax: 370.0, defaultValue: '', normalText: '310 - 370' },
      { id: 'p_seg', code: 'NEUT', name: 'Neutrophils', unit: '%', dataType: 'NUMERIC', specMin: 50.0, specMax: 70.0, defaultValue: '', normalText: '50 - 70' },
      { id: 'p_lym', code: 'LYMPH', name: 'Lymphocytes', unit: '%', dataType: 'NUMERIC', specMin: 20.0, specMax: 40.0, defaultValue: '', normalText: '20 - 40' },
      { id: 'p_mon', code: 'MONO', name: 'Monocytes', unit: '%', dataType: 'NUMERIC', specMin: 3.0, specMax: 12.0, defaultValue: '', normalText: '3 - 12' },
      { id: 'p_eos', code: 'EOS', name: 'Eosinophils', unit: '%', dataType: 'NUMERIC', specMin: 0.5, specMax: 5.0, defaultValue: '', normalText: '0.5 - 5' },
      { id: 'p_bas', code: 'BASO', name: 'Basophils', unit: '%', dataType: 'NUMERIC', specMin: 0.0, specMax: 1.0, defaultValue: '', normalText: '0 - 1' },
    ],
  },
  '1029': {
    examCode: '1029',
    examName: 'PLATELET COUNT',
    category: 'HEMATOLOGY',
    methodology: 'Automated / Phase-Contrast Microscopy',
    specimenType: 'Whole Blood (K2-EDTA)',
    parameters: [
      { id: 'p_plt_only', code: 'PLT', name: 'Platelet Count', unit: 'x10⁹/L', dataType: 'NUMERIC', specMin: 150.0, specMax: 450.0, criticalMin: 40.0, criticalMax: 900.0, defaultValue: '', normalText: '150 - 450' },
      { id: 'p_plt_morph', code: 'MORPH', name: 'Platelet Morphology / Aggregation', dataType: 'SELECT', options: ['Adequate, Normal Granulation', 'Giant Platelets Seen', 'Platelet Clumping / Satellite', 'Hypogranular'], defaultValue: '', normalText: '—' },
    ],
  },
  '1014': {
    examCode: '1014',
    examName: 'CT/BT (CLOTTING TIME / BLEEDING TIME)',
    category: 'HEMATOLOGY',
    methodology: 'Duke / Lee-White Manual Method',
    specimenType: 'Capillary / Venous Blood',
    parameters: [
      { id: 'p_bt', code: 'BT', name: 'Bleeding Time (Duke)', unit: 'mins', dataType: 'NUMERIC', specMin: 1.0, specMax: 4.0, defaultValue: '2.5' },
      { id: 'p_ct', code: 'CT', name: 'Clotting Time (Lee-White)', unit: 'mins', dataType: 'NUMERIC', specMin: 4.0, specMax: 10.0, defaultValue: '6.0' },
    ],
  },
  '1017': {
    examCode: '1017',
    examName: 'ESR (ERYTHROCYTE SEDIMENTATION RATE)',
    category: 'HEMATOLOGY',
    methodology: 'Westergren Method',
    specimenType: 'Whole Blood (Sodium Citrate)',
    parameters: [
      { id: 'p_esr', code: 'ESR', name: 'Erythrocyte Sedimentation Rate', unit: 'mm/hr', dataType: 'NUMERIC', specMin: 0.0, specMax: 20.0, defaultValue: '12.0' },
    ],
  },
  // Result Form 5 — Blood Typing (catalog code 1006; legacy template key 1030)
  '1006': {
    examCode: '1006',
    examName: 'BLOOD TYPING (ABO & RH)',
    category: 'HEMATOLOGY',
    methodology: 'Forward & Reverse Tube Agglutination',
    specimenType: 'Whole Blood (EDTA or Plain)',
    parameters: [
      {
        id: 'bt_abo',
        code: 'ABO',
        name: 'Blood Type (ABO)',
        dataType: 'SELECT',
        options: ['A', 'B', 'AB', 'O'],
        defaultValue: '',
      },
      {
        id: 'bt_rh',
        code: 'RH',
        name: 'Rh Factor',
        dataType: 'SELECT',
        options: ['RH POSITIVE', 'RH NEGATIVE'],
        defaultValue: '',
      },
    ],
  },
  '1030': {
    examCode: '1030',
    examName: 'BLOOD TYPING (ABO & RH)',
    category: 'HEMATOLOGY',
    methodology: 'Forward & Reverse Tube Agglutination',
    specimenType: 'Whole Blood (EDTA or Plain)',
    parameters: [
      {
        id: 'bt_abo',
        code: 'ABO',
        name: 'Blood Type (ABO)',
        dataType: 'SELECT',
        options: ['A', 'B', 'AB', 'O'],
        defaultValue: '',
      },
      {
        id: 'bt_rh',
        code: 'RH',
        name: 'Rh Factor',
        dataType: 'SELECT',
        options: ['RH POSITIVE', 'RH NEGATIVE'],
        defaultValue: '',
      },
    ],
  },
  '1031': {
    examCode: '1031',
    examName: 'PROTHROMBIN TIME (PT)',
    category: 'HEMATOLOGY',
    methodology: 'Electromechanical Clot Detection / Optical Coagulometer',
    specimenType: 'Citrated Plasma (3.2% Sodium Citrate)',
    parameters: [
      { id: 'p_pt_patient', code: 'PT_PATIENT', name: 'Patient Clotting Time', unit: 'secs', dataType: 'NUMERIC', specMin: 11.0, specMax: 14.0, criticalMax: 30.0, defaultValue: '12.4' },
      { id: 'p_pt_control', code: 'PT_CONTROL', name: 'Control Time', unit: 'secs', dataType: 'NUMERIC', specMin: 11.5, specMax: 13.5, defaultValue: '12.0' },
      { id: 'p_pt_activity', code: 'PT_ACT', name: '% Activity', unit: '%', dataType: 'NUMERIC', specMin: 70.0, specMax: 100.0, defaultValue: '85.0' },
      { id: 'p_pt_inr', code: 'INR', name: 'International Normalized Ratio (INR)', unit: '', dataType: 'NUMERIC', specMin: 0.8, specMax: 1.2, criticalMax: 4.5, defaultValue: '1.02' },
    ],
  },
  '1032': {
    examCode: '1032',
    examName: 'PARTIAL THROMBOPLASTIN TIME (PTT)',
    category: 'HEMATOLOGY',
    methodology: 'Electromechanical Clot Detection / Optical Coagulometer',
    specimenType: 'Citrated Plasma (3.2% Sodium Citrate)',
    parameters: [
      { id: 'p_ptt_patient', code: 'PTT_PATIENT', name: 'Patient Clotting Time', unit: 'secs', dataType: 'NUMERIC', specMin: 25.0, specMax: 38.0, criticalMax: 70.0, defaultValue: '30.5' },
      { id: 'p_ptt_control', code: 'PTT_CONTROL', name: 'Control Time', unit: 'secs', dataType: 'NUMERIC', specMin: 28.0, specMax: 32.0, defaultValue: '29.8' },
      { id: 'p_ptt_ratio', code: 'PTT_RATIO', name: 'PTT Ratio', unit: '', dataType: 'NUMERIC', specMin: 0.8, specMax: 1.2, defaultValue: '1.02' },
    ],
  },

  // 2. CLINICAL MICROSCOPY — Result Form 3 (PTSI Urinalysis) parameters
  '1041': {
    examCode: '1041',
    examName: 'URINALYSIS',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Automated Test Strip Reader & Sediment Microscopy',
    specimenType: 'Clean-Catch Midstream Urine',
    parameters: [
      // MACROSCOPIC
      { id: 'ua_color', code: 'COLOR', name: 'Color', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_transparency', code: 'TRANSPARENCY', name: 'Transparency', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_ph', code: 'PH', name: 'PH', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_sg', code: 'SPGR', name: 'Specific Gravity', dataType: 'TEXT', defaultValue: '' },
      // CHEMICAL
      { id: 'ua_protein', code: 'PROT', name: 'Protein', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_glucose', code: 'GLU', name: 'Glucose', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_ketone', code: 'KET', name: 'Ketone', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_nitrite', code: 'NIT', name: 'Nitrite', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_urobilinogen', code: 'URO', name: 'Urobilinogen', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_bilirubin', code: 'BILI', name: 'Bilirubin', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_leukocytes', code: 'LEU', name: 'Leukocytes', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_blood', code: 'BLD', name: 'Blood', dataType: 'TEXT', defaultValue: '' },
      // MICROSCOPIC
      { id: 'ua_wbc', code: 'WBC', name: 'WBC', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_rbc', code: 'RBC', name: 'RBC', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_epithelial', code: 'EPITH', name: 'Epithelial Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_bacteria', code: 'BACT', name: 'Bacteria', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_mucus', code: 'MUCUS', name: 'Mucus Threads', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_amorphous', code: 'AMORPH', name: 'Amorphous Urates/ Phosphates', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_crystals', code: 'CRYST', name: 'Crystals', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_casts', code: 'CASTS', name: 'Casts', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_others', code: 'OTHERS', name: 'Others', dataType: 'TEXT', defaultValue: '' },
    ],
  },
  // Alias for legacy template key
  '1011': {
    examCode: '1011',
    examName: 'ROUTINE URINALYSIS',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Automated Test Strip Reader & Sediment Microscopy',
    specimenType: 'Clean-Catch Midstream Urine',
    parameters: [
      { id: 'ua_color', code: 'COLOR', name: 'Color', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_transparency', code: 'TRANSPARENCY', name: 'Transparency', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_ph', code: 'PH', name: 'PH', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_sg', code: 'SPGR', name: 'Specific Gravity', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_protein', code: 'PROT', name: 'Protein', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_glucose', code: 'GLU', name: 'Glucose', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_ketone', code: 'KET', name: 'Ketone', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_nitrite', code: 'NIT', name: 'Nitrite', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_urobilinogen', code: 'URO', name: 'Urobilinogen', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_bilirubin', code: 'BILI', name: 'Bilirubin', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_leukocytes', code: 'LEU', name: 'Leukocytes', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_blood', code: 'BLD', name: 'Blood', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_wbc', code: 'WBC', name: 'WBC', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_rbc', code: 'RBC', name: 'RBC', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_epithelial', code: 'EPITH', name: 'Epithelial Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_bacteria', code: 'BACT', name: 'Bacteria', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_mucus', code: 'MUCUS', name: 'Mucus Threads', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_amorphous', code: 'AMORPH', name: 'Amorphous Urates/ Phosphates', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_crystals', code: 'CRYST', name: 'Crystals', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_casts', code: 'CASTS', name: 'Casts', dataType: 'TEXT', defaultValue: '' },
      { id: 'ua_others', code: 'OTHERS', name: 'Others', dataType: 'TEXT', defaultValue: '' },
    ],
  },
  // Result Form 4 (PTSI Fecalysis) — catalog product code 1019
  '1019': {
    examCode: '1019',
    examName: 'FECALYSIS',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Direct Wet Mount & Concentration Microscopy',
    specimenType: 'Fresh Stool Specimen',
    parameters: [
      // MACROSCOPIC
      { id: 'fec_color', code: 'COLOR', name: 'Color', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_consistency', code: 'CONSISTENCY', name: 'Consistency', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_mucus', code: 'MUCUS', name: 'Mucus', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_blood', code: 'BLOOD', name: 'Blood', dataType: 'TEXT', defaultValue: '' },
      // MICROSCOPIC
      { id: 'fec_wbc', code: 'WBC', name: 'White blood cell', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_ova', code: 'OVA', name: 'OVA / Parasites', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_rbc', code: 'RBC', name: 'Red blood cell', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_pus', code: 'PUS', name: 'Pus Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_bacteria', code: 'BACT', name: 'Bacteria', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_yeast', code: 'YEAST', name: 'Yeast Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_fat', code: 'FAT', name: 'Fat Globules', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_amoeba', code: 'AMOEBA', name: 'Amoeba', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_others', code: 'OTHERS', name: 'Others', dataType: 'TEXT', defaultValue: '' },
      // OCCULT BLOOD
      { id: 'fec_fobt', code: 'FOBT', name: 'Fecal Occult Blood Test', dataType: 'TEXT', defaultValue: '' },
    ],
  },
  // Legacy alias — keyword / older templates still resolve via 1012 for fecalysis names
  '1012': {
    examCode: '1012',
    examName: 'FECALYSIS',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Direct Wet Mount & Concentration Microscopy',
    specimenType: 'Fresh Stool Specimen',
    parameters: [
      { id: 'fec_color', code: 'COLOR', name: 'Color', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_consistency', code: 'CONSISTENCY', name: 'Consistency', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_mucus', code: 'MUCUS', name: 'Mucus', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_blood', code: 'BLOOD', name: 'Blood', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_wbc', code: 'WBC', name: 'White blood cell', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_ova', code: 'OVA', name: 'OVA / Parasites', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_rbc', code: 'RBC', name: 'Red blood cell', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_pus', code: 'PUS', name: 'Pus Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_bacteria', code: 'BACT', name: 'Bacteria', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_yeast', code: 'YEAST', name: 'Yeast Cells', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_fat', code: 'FAT', name: 'Fat Globules', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_amoeba', code: 'AMOEBA', name: 'Amoeba', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_others', code: 'OTHERS', name: 'Others', dataType: 'TEXT', defaultValue: '' },
      { id: 'fec_fobt', code: 'FOBT', name: 'Fecal Occult Blood Test', dataType: 'TEXT', defaultValue: '' },
    ],
  },
  // Result Form 7 — Pregnancy Test (Urine), catalog code 1042
  '1042': {
    examCode: '1042',
    examName: 'PREGNANCY TEST (URINE)',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Qualitative hCG Immunochromatography',
    specimenType: 'First Morning Urine Specimen',
    parameters: [
      { id: 'preg_urine', code: 'HCG', name: 'Result', dataType: 'SELECT', options: ['POSITIVE', 'NEGATIVE'], defaultValue: '' },
    ],
  },
  '1013': {
    examCode: '1013',
    examName: 'PREGNANCY TEST (URINE HCG)',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Immunochromatographic Rapid Assay',
    specimenType: 'Urine Specimen',
    parameters: [
      { id: 'preg_urine', code: 'HCG', name: 'Result', dataType: 'SELECT', options: ['POSITIVE', 'NEGATIVE'], defaultValue: '' },
    ],
  },
  '1024': {
    examCode: '1024',
    examName: 'FECAL OCCULT BLOOD TEST (FOBT)',
    category: 'CLINICAL MICROSCOPY',
    methodology: 'Immunochemical Fecal Occult Blood Test (iFOBT)',
    specimenType: 'Stool Specimen',
    parameters: [
      { id: 'p_fobt_res', code: 'FOBT', name: 'Fecal Occult Blood Test', dataType: 'TEXT', defaultValue: '' },
    ],
  },

  // 3. DSSM / BACTERIOLOGY (TB SPECIALTY)
  '1001': {
    examCode: '1001',
    examName: 'DIRECT SPUTUM SMEAR MICROSCOPY (DSSM)',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Ziehl-Neelsen (ZN) Acid Fast Staining',
    specimenType: 'Early Morning / Spot Sputum',
    parameters: [
      { id: 'p_sputum_vis', code: 'VISUAL', name: 'Specimen Gross Appearance', dataType: 'SELECT', options: ['Mucopurulent', 'Purulent', 'Salivary / Watery', 'Blood-Stained'], defaultValue: 'Mucopurulent' },
      { id: 'p_afb_spec1', code: 'SPEC1_AFB', name: 'Specimen 1 Result (Spot / Early Morning)', dataType: 'SELECT', options: ['0 / Negative (No AFB in 300 visual fields)', 'Scanty (1 - 9 AFB / 100 fields)', '+1 (10 - 99 AFB / 100 fields)', '+2 (1 - 10 AFB / field in at least 50 fields)', '+3 (>10 AFB / field in at least 20 fields)'], defaultValue: '0 / Negative (No AFB in 300 visual fields)' },
      { id: 'p_afb_spec2', code: 'SPEC2_AFB', name: 'Specimen 2 Result (Repeat / Follow-up)', dataType: 'SELECT', options: ['0 / Negative (No AFB in 300 visual fields)', 'Scanty (1 - 9 AFB / 100 fields)', '+1 (10 - 99 AFB / 100 fields)', '+2 (1 - 10 AFB / field in at least 50 fields)', '+3 (>10 AFB / field in at least 20 fields)'], defaultValue: '0 / Negative (No AFB in 300 visual fields)' },
      { id: 'p_afb_diag', code: 'DIAGNOSIS', name: 'Diagnostic Impression / Scale', dataType: 'SELECT', options: ['NEGATIVE FOR ACID FAST BACILLI', 'POSITIVE FOR ACID FAST BACILLI (+1)', 'POSITIVE FOR ACID FAST BACILLI (+2)', 'POSITIVE FOR ACID FAST BACILLI (+3)', 'SCANTY POSITIVE (REPEAT RECOMMENDED)'], defaultValue: 'NEGATIVE FOR ACID FAST BACILLI' },
    ],
  },
  '1003': {
    examCode: '1003',
    examName: 'AFB STAINING',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Ziehl-Neelsen Acid Fast Staining',
    specimenType: 'Sputum / Biological Smear',
    parameters: [
      { id: 'p_afb_single', code: 'AFB_RES', name: 'Acid Fast Bacilli (AFB) Result', dataType: 'SELECT', options: ['0 / Negative (No AFB seen in 300 fields)', '+1 (10-99 AFB / 100 fields)', '+2 (1-10 AFB / field)', '+3 (>10 AFB / field)'], defaultValue: '0 / Negative (No AFB seen in 300 fields)' },
    ],
  },
  '1002': {
    examCode: '1002',
    examName: 'GRAM STAINING',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Differential Gram Staining Technique',
    specimenType: 'Discharge / Exudate / Sputum',
    parameters: [
      { id: 'p_gram_pos', code: 'GRAM_POS', name: 'Gram-Positive Organisms', dataType: 'TEXT', normalText: 'None seen', defaultValue: 'None seen' },
      { id: 'p_gram_neg', code: 'GRAM_NEG', name: 'Gram-Negative Organisms', dataType: 'TEXT', normalText: 'None seen', defaultValue: 'None seen' },
      { id: 'p_gram_pus', code: 'PUS_CELLS', name: 'Pus Cells / PMNs', unit: '/oif', dataType: 'TEXT', defaultValue: '0 - 2 / oif' },
      { id: 'p_gram_epith', code: 'EPITH_CELLS', name: 'Epithelial Cells', unit: '/oif', dataType: 'TEXT', defaultValue: 'Few / oif' },
    ],
  },

  // 4. CLINICAL CHEMISTRY
  '1021': {
    examCode: '1021',
    examName: 'FASTING BLOOD SUGAR (FBS)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Hexokinase / Glucose Oxidase Photometry',
    specimenType: 'Serum (SST Gel Separator)',
    parameters: [
      { id: 'p_fbs', code: 'FBS', name: 'FBS (Fasting Blood Sugar)', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 3.9, specMax: 6.4, criticalMin: 2.5, criticalMax: 22.2, defaultValue: '', normalText: '3.9 - 6.4' },
    ],
  },

  '1066': {
    examCode: '1066',
    examName: 'HEMOGLOBIN A1C (HBA1C)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'HPLC / Boronate Affinity Chromatography',
    specimenType: 'Whole Blood (K2-EDTA)',
    parameters: [
      { id: 'p_hba1c', code: 'HBA1C', name: 'HbA1c (Glycated Hemoglobin)', unit: '%', dataType: 'NUMERIC', specMin: 4.0, specMax: 5.6, criticalMax: 14.0, defaultValue: '5.20' },
      { id: 'p_eag', code: 'EAG', name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', dataType: 'CALCULATED', calculationFormula: '(HBA1C * 28.7) - 46.7', specMin: 68.0, specMax: 114.0, defaultValue: '102.50' },
    ],
  },
  '1047': {
    examCode: '1047',
    examName: 'LIPID PROFILE',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Enzymatic Colorimetric / Direct Clearance',
    specimenType: 'Serum (10-12 Hrs Fasting)',
    parameters: [
      { id: 'p_tchol', code: 'TCHOL', name: 'Total Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.0, specMax: 200.0, criticalMax: 400.0, defaultValue: '175.00' },
      { id: 'p_trig', code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.0, specMax: 150.0, criticalMax: 500.0, defaultValue: '110.00' },
      { id: 'p_hdl', code: 'HDL', name: 'HDL Cholesterol (Good)', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 40.0, specMax: 60.0, defaultValue: '52.00' },
      { id: 'p_ldl', code: 'LDL', name: 'LDL Cholesterol (Calculated)', unit: 'mg/dL', dataType: 'CALCULATED', calculationFormula: 'TCHOL - HDL - (TRIG / 5)', specMin: 0.0, specMax: 100.0, criticalMax: 190.0, defaultValue: '101.00' },
      { id: 'p_vldl', code: 'VLDL', name: 'VLDL Cholesterol', unit: 'mg/dL', dataType: 'CALCULATED', calculationFormula: 'TRIG / 5', specMin: 0.0, specMax: 30.0, defaultValue: '22.00' },
      { id: 'p_chol_hdl_ratio', code: 'CHOL_HDL_RATIO', name: 'Chol / HDL Ratio', unit: '', dataType: 'CALCULATED', calculationFormula: 'TCHOL / HDL', specMin: 0.0, specMax: 5.0, defaultValue: '3.37' },
    ],
  },
  '1062': {
    examCode: '1062',
    examName: 'CHOLESTEROL TOTAL',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'CHOD-PAP Enzymatic Colorimetric',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_tchol_only', code: 'TCHOL', name: 'Total Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.0, specMax: 200.0, defaultValue: '180.00' },
    ],
  },
  '1018': {
    examCode: '1018',
    examName: 'TRIGLYCERIDES',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'GPO-PAP Enzymatic Colorimetric',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_trig_only', code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.0, specMax: 150.0, defaultValue: '115.00' },
    ],
  },
  '1007': {
    examCode: '1007',
    examName: 'BLOOD URIC ACID (BUA)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Uricase Enzymatic Colorimetric',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_bua', code: 'BUA', name: 'URIC ACID (Blood Uric Acid)', unit: 'umol/L', dataType: 'NUMERIC', specMin: 137.0, specMax: 363.0, criticalMax: 700.0, defaultValue: '', normalText: '137 - 363' },
    ],
  },
  '1009': {
    examCode: '1009',
    examName: 'BLOOD UREA NITROGEN (BUN)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Urease-GLDH Kinetic Photometric',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_bun', code: 'BUN', name: 'BUN (Blood Urea Nitrogen)', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 2.8, specMax: 7.2, criticalMax: 28.0, defaultValue: '', normalText: '2.8 - 7.2' },
    ],
  },
  '1023': {
    examCode: '1023',
    examName: 'CREATININE',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Jaffe Alkaline Picrate / Enzymatic Kinetic',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_creat', code: 'CREAT', name: 'CREATININE', unit: 'umol/L', dataType: 'NUMERIC', specMin: 44.0, specMax: 80.0, criticalMax: 350.0, defaultValue: '', normalText: '44 - 80' },
    ],
  },
  '1034': {
    examCode: '1034',
    examName: 'SGPT / ALT',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'IFCC UV Kinetic without Pyridoxal Phosphate',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_sgpt', code: 'SGPT', name: 'SGPT/ALT', unit: 'U/L', dataType: 'NUMERIC', specMax: 34.0, criticalMax: 300.0, defaultValue: '', normalText: '< 34' },
    ],
  },
  '1033': {
    examCode: '1033',
    examName: 'SGOT / AST',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'IFCC UV Kinetic Method',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_sgot', code: 'SGOT', name: 'SGOT/AST', unit: 'U/L', dataType: 'NUMERIC', specMax: 31.0, criticalMax: 300.0, defaultValue: '', normalText: '< 31' },
    ],
  },
  '1045': {
    examCode: '1045',
    examName: 'ELECTROLYTES (NA, K, CL)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Ion Selective Electrode (ISE)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_na', code: 'NA', name: 'SODIUM', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 135.0, specMax: 148.0, criticalMin: 120.0, criticalMax: 160.0, defaultValue: '', normalText: '135 - 148' },
      { id: 'p_k', code: 'K', name: 'POTASSIUM', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 3.5, specMax: 5.3, criticalMin: 2.8, criticalMax: 6.2, defaultValue: '', normalText: '3.5 - 5.3' },
      { id: 'p_cl', code: 'CL', name: 'CHLORIDE', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 98.0, specMax: 107.0, defaultValue: '', normalText: '98 - 107' },
    ],
  },
  '1044': {
    examCode: '1044',
    examName: 'SODIUM (NA)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    specimenType: 'Serum / Lithium Heparin Plasma',
    parameters: [
      { id: 'p_na', code: 'NA', name: 'SODIUM', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 135.0, specMax: 148.0, criticalMin: 120.0, criticalMax: 160.0, defaultValue: '', normalText: '135 - 148' },
    ],
  },
  '1050': {
    examCode: '1050',
    examName: 'POTASSIUM (K)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    specimenType: 'Non-Hemolyzed Serum',
    parameters: [
      { id: 'p_k', code: 'K', name: 'POTASSIUM', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 3.5, specMax: 5.3, criticalMin: 2.8, criticalMax: 6.2, defaultValue: '', normalText: '3.5 - 5.3' },
    ],
  },
  '1051': {
    examCode: '1051',
    examName: 'CHLORIDE (CL)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    specimenType: 'Serum / Lithium Heparin Plasma',
    parameters: [
      { id: 'p_cl', code: 'CL', name: 'CHLORIDE', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 98.0, specMax: 107.0, defaultValue: '', normalText: '98 - 107' },
    ],
  },
  '6002': {
    examCode: '6002',
    examName: 'CREATININE',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Jaffe Kinetic Alkaline Picrate / Enzymatic',
    specimenType: 'Serum (SST Gel Separator)',
    parameters: [
      { id: 'p_creat', code: 'CREAT', name: 'CREATININE', unit: 'umol/L', dataType: 'NUMERIC', specMin: 44.0, specMax: 80.0, criticalMax: 350.0, defaultValue: '', normalText: '44 - 80' },
    ],
  },

  // 5. IMMUNOLOGY & THYROID
  '1020': {
    examCode: '1020',
    examName: 'TSH (THYROID STIMULATING HORMONE)',
    category: 'IMMUNOLOGY / THYROID',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_tsh', code: 'TSH', name: 'TSH (3rd Generation)', unit: 'uIU/mL', dataType: 'NUMERIC', specMin: 0.40, specMax: 4.50, defaultValue: '2.15' },
    ],
  },
  '1046': {
    examCode: '1046',
    examName: 'FREE T4 (FT4)',
    category: 'IMMUNOLOGY / THYROID',
    methodology: 'Chemiluminescence Immunoassay (CLIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ft4', code: 'FT4', name: 'Free Thyroxine (FT4)', unit: 'ng/dL', dataType: 'NUMERIC', specMin: 0.80, specMax: 1.80, defaultValue: '1.24' },
    ],
  },
  '1133': {
    examCode: '1133',
    examName: 'FT3 (FREE TRIIODOTHYRONINE)',
    category: 'IMMUNOLOGY / THYROID',
    methodology: 'Chemiluminescent Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ft3', code: 'FT3', name: 'Free Triiodothyronine (FT3)', unit: 'pg/mL', dataType: 'NUMERIC', specMin: 2.30, specMax: 4.20, defaultValue: '3.10' },
    ],
  },
  '1113': {
    examCode: '1113',
    examName: 'T3 (TOTAL TRIIODOTHYRONINE)',
    category: 'IMMUNOLOGY / THYROID',
    methodology: 'Competitive Enzyme-Linked / CMIA',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_t3_tot', code: 'T3_TOTAL', name: 'Total T3', unit: 'ng/dL', dataType: 'NUMERIC', specMin: 80.0, specMax: 200.0, defaultValue: '135.0' },
    ],
  },
  '1114': {
    examCode: '1114',
    examName: 'T4 (TOTAL THYROXINE)',
    category: 'IMMUNOLOGY / THYROID',
    methodology: 'Competitive Enzyme-Linked / CMIA',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_t4_tot', code: 'T4_TOTAL', name: 'Total T4', unit: 'ug/dL', dataType: 'NUMERIC', specMin: 4.5, specMax: 12.5, defaultValue: '8.4' },
    ],
  },

  // 6. CLINICAL CHEMISTRY - EXPANDED ORGAN PANELS & TUMOR MARKERS
  '1057': {
    examCode: '1057',
    examName: 'TOTAL CALCIUM',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Arsenazo III / O-Cresolphthalein Complexone',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ca_tot', code: 'CA', name: 'Total Calcium', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 8.5, specMax: 10.5, criticalMin: 6.0, criticalMax: 13.0, defaultValue: '9.40' },
    ],
  },
  '1058': {
    examCode: '1058',
    examName: 'IONIZED CALCIUM',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Direct Ion-Selective Electrode (ISE)',
    specimenType: 'Anaerobic Serum / Heparinized Blood',
    parameters: [
      { id: 'p_ica', code: 'ICA', name: 'Ionized Calcium (Free Ca++)', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 1.15, specMax: 1.33, criticalMin: 0.8, criticalMax: 1.6, defaultValue: '1.22' },
    ],
  },
  '1059': {
    examCode: '1059',
    examName: 'MAGNESIUM',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Calmagite / Xylidyl Blue Colorimetric',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_mg', code: 'MG', name: 'Serum Magnesium', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 1.70, specMax: 2.20, criticalMin: 1.0, criticalMax: 4.5, defaultValue: '1.95' },
    ],
  },
  '1060': {
    examCode: '1060',
    examName: 'ALBUMIN',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Bromocresol Green (BCG) Dye Binding',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_alb', code: 'ALB', name: 'Serum Albumin', unit: 'g/dL', dataType: 'NUMERIC', specMin: 3.5, specMax: 5.2, defaultValue: '4.20' },
    ],
  },
  '1061': {
    examCode: '1061',
    examName: 'BILIRUBIN (TOTAL, DIRECT, INDIRECT)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Modified Jendrassik-Grof / DPD Diazonium',
    specimenType: 'Protected Light Serum',
    parameters: [
      { id: 'p_bili_tot', code: 'TBILI', name: 'Total Bilirubin', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.20, specMax: 1.20, criticalMax: 15.0, defaultValue: '0.75' },
      { id: 'p_bili_dir', code: 'DBILI', name: 'Direct Bilirubin (Conjugated)', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 0.00, specMax: 0.30, defaultValue: '0.18' },
      { id: 'p_bili_ind', code: 'IBILI', name: 'Indirect Bilirubin (Unconjugated)', unit: 'mg/dL', dataType: 'CALCULATED', calculationFormula: 'TBILI - DBILI', specMin: 0.20, specMax: 0.90, defaultValue: '0.57' },
    ],
  },
  '1063': {
    examCode: '1063',
    examName: 'TOTAL PROTEIN A/G RATIO',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Biuret & BCG Dye Calculation',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_tp', code: 'TP', name: 'Total Protein', unit: 'g/dL', dataType: 'NUMERIC', specMin: 6.4, specMax: 8.3, defaultValue: '7.20' },
      { id: 'p_alb_ag', code: 'ALB', name: 'Albumin', unit: 'g/dL', dataType: 'NUMERIC', specMin: 3.5, specMax: 5.0, defaultValue: '4.20' },
      { id: 'p_glob', code: 'GLOB', name: 'Globulin (Calculated)', unit: 'g/dL', dataType: 'CALCULATED', calculationFormula: 'TP - ALB', specMin: 2.3, specMax: 3.5, defaultValue: '3.00' },
      { id: 'p_ag_ratio', code: 'AG_RATIO', name: 'A/G Ratio', unit: '', dataType: 'CALCULATED', calculationFormula: 'ALB / GLOB', specMin: 1.2, specMax: 2.2, defaultValue: '1.40' },
    ],
  },
  '1064': {
    examCode: '1064',
    examName: 'INORGANIC PHOSPHORUS',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Phosphomolybdate UV Complex Method',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_phos', code: 'PHOS', name: 'Inorganic Phosphorus', unit: 'mg/dL', dataType: 'NUMERIC', specMin: 2.5, specMax: 4.5, defaultValue: '3.40' },
    ],
  },
  '1065': {
    examCode: '1065',
    examName: 'PSA (PROSTATE SPECIFIC ANTIGEN)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_psa', code: 'PSA', name: 'Total PSA', unit: 'ng/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 4.0, criticalMax: 20.0, defaultValue: '1.20' },
    ],
  },
  '1067': {
    examCode: '1067',
    examName: 'TOTAL PROTEIN',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Biuret Colorimetric Reaction',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_tp_only', code: 'TP', name: 'Total Protein', unit: 'g/dL', dataType: 'NUMERIC', specMin: 6.4, specMax: 8.3, defaultValue: '7.10' },
    ],
  },
  '1068': {
    examCode: '1068',
    examName: 'PREGNANCY TEST (SERUM) (HP)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Quantitative Beta-hCG Chemiluminescent Immunoassay',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_bhcg_quant', code: 'BHCG', name: 'Quantitative Beta-hCG Titer', unit: 'mIU/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 5.0, defaultValue: '1.50' },
      { id: 'p_bhcg_interp', code: 'BHCG_INTERP', name: 'Pregnancy Status', dataType: 'SELECT', options: ['NEGATIVE (< 5 mIU/mL)', 'EQUIVOCAL (5-25 mIU/mL, REPEAT 48H)', 'POSITIVE (> 25 mIU/mL)'], defaultValue: 'NEGATIVE (< 5 mIU/mL)' },
    ],
  },
  '1069': {
    examCode: '1069',
    examName: 'AFP (LIVER / ALPHA-FETOPROTEIN)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Two-Step Chemiluminescent Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_afp', code: 'AFP', name: 'Alpha-Fetoprotein (AFP)', unit: 'ng/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 8.5, criticalMax: 200.0, defaultValue: '3.40' },
    ],
  },
  '1070': {
    examCode: '1070',
    examName: 'CA 125 (OVARIAN)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ca125', code: 'CA125', name: 'Cancer Antigen 125', unit: 'U/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 35.0, criticalMax: 100.0, defaultValue: '14.20' },
    ],
  },
  '1071': {
    examCode: '1071',
    examName: 'CA 15-3 (BREAST)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ca153', code: 'CA153', name: 'Cancer Antigen 15-3', unit: 'U/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 30.0, criticalMax: 100.0, defaultValue: '18.50' },
    ],
  },
  '1072': {
    examCode: '1072',
    examName: 'CA 19-9 (PANCREATIC)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_ca199', code: 'CA199', name: 'Cancer Antigen 19-9', unit: 'U/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 37.0, criticalMax: 150.0, defaultValue: '12.80' },
    ],
  },
  '1073': {
    examCode: '1073',
    examName: 'CEA (CARCINOEMBRYONIC ANTIGEN)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_cea', code: 'CEA', name: 'Carcinoembryonic Antigen', unit: 'ng/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 5.0, criticalMax: 20.0, defaultValue: '1.80' },
    ],
  },
  '1043': {
    examCode: '1043',
    examName: 'HGT (HEMOGLUCOTEST)',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Electrochemical Biosensor Point-of-Care',
    specimenType: 'Capillary Whole Blood',
    parameters: [
      // Result Form 1: open text result + fixed unit mg/dL
      { id: 'p_hgt', code: 'HGT', name: 'HGT Result', unit: 'mg/dL', dataType: 'TEXT', normalText: '70 - 140 mg/dL (random / bedside)', defaultValue: '' },
    ],
  },
  '1081': {
    examCode: '1081',
    examName: 'LIPASE',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Enzymatic Colorimetric Assay',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_lipase', code: 'LIPASE', name: 'Serum Lipase', unit: 'U/L', dataType: 'NUMERIC', specMin: 13.0, specMax: 60.0, criticalMax: 300.0, defaultValue: '32.00' },
    ],
  },
  '1082': {
    examCode: '1082',
    examName: 'AMYLASE',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Enzymatic Direct Substrate Cleavage',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_amylase', code: 'AMYLASE', name: 'Serum Amylase', unit: 'U/L', dataType: 'NUMERIC', specMin: 28.0, specMax: 100.0, criticalMax: 400.0, defaultValue: '55.00' },
    ],
  },
  '1005': {
    examCode: '1005',
    examName: 'LACTIC ACID',
    category: 'CLINICAL CHEMISTRY',
    methodology: 'Lactate Oxidase Enzymatic Amperometric',
    specimenType: 'Sodium Fluoride Plasma (Grey Top on Ice)',
    parameters: [
      { id: 'p_lactate', code: 'LACTATE', name: 'Plasma Lactic Acid', unit: 'mmol/L', dataType: 'NUMERIC', specMin: 0.5, specMax: 2.2, criticalMax: 4.0, defaultValue: '1.20' },
    ],
  },

  // 7. BACTERIOLOGY & TB SPECIALTY EXPANDED
  // Same Form 6 analytes as CBC 1010 (gendered refs come from RF-06 / RF-06F)
  '1185': {
    examCode: '1185',
    examName: 'CBC WITH MICROTAINER',
    category: 'HEMATOLOGY',
    methodology: 'Automated Micro-Volume Hematology Analyzer',
    specimenType: 'Microtainer Capillary Blood (EDTA)',
    parameters: [
      { id: 'p_hgb', code: 'HGB', name: 'Hemoglobin', unit: 'g/L', dataType: 'NUMERIC', specMin: 140.0, specMax: 180.0, criticalMin: 70.0, criticalMax: 200.0, defaultValue: '', normalText: '140 - 180' },
      { id: 'p_hct', code: 'HCT', name: 'Hematocrit', unit: '% VOLUME', dataType: 'NUMERIC', specMin: 42.0, specMax: 54.0, criticalMin: 21.0, criticalMax: 60.0, defaultValue: '', normalText: '42 - 54' },
      { id: 'p_rbc', code: 'RBC', name: 'RBC Count', unit: 'x10¹²/L', dataType: 'NUMERIC', specMin: 5.0, specMax: 6.2, criticalMin: 2.5, criticalMax: 7.0, defaultValue: '', normalText: '5 - 6.2' },
      { id: 'p_plt', code: 'PLT', name: 'Platelets', unit: 'x10⁹/L', dataType: 'NUMERIC', specMin: 150.0, specMax: 450.0, criticalMin: 40.0, criticalMax: 900.0, defaultValue: '', normalText: '150 - 450' },
      { id: 'p_wbc', code: 'WBC', name: 'WBC Count', unit: 'x10⁹/L', dataType: 'NUMERIC', specMin: 4.0, specMax: 10.0, criticalMin: 2.0, criticalMax: 30.0, defaultValue: '', normalText: '4 - 10' },
      { id: 'p_mcv', code: 'MCV', name: 'MCV', unit: 'fL', dataType: 'NUMERIC', specMin: 80.0, specMax: 100.0, defaultValue: '', normalText: '80 - 100' },
      { id: 'p_mch', code: 'MCH', name: 'MCH', unit: 'pg', dataType: 'NUMERIC', specMin: 27.0, specMax: 34.0, defaultValue: '', normalText: '27 - 34' },
      { id: 'p_mchc', code: 'MCHC', name: 'MCHC', unit: 'g/L', dataType: 'NUMERIC', specMin: 310.0, specMax: 370.0, defaultValue: '', normalText: '310 - 370' },
      { id: 'p_seg', code: 'NEUT', name: 'Neutrophils', unit: '%', dataType: 'NUMERIC', specMin: 50.0, specMax: 70.0, defaultValue: '', normalText: '50 - 70' },
      { id: 'p_lym', code: 'LYMPH', name: 'Lymphocytes', unit: '%', dataType: 'NUMERIC', specMin: 20.0, specMax: 40.0, defaultValue: '', normalText: '20 - 40' },
      { id: 'p_mon', code: 'MONO', name: 'Monocytes', unit: '%', dataType: 'NUMERIC', specMin: 3.0, specMax: 12.0, defaultValue: '', normalText: '3 - 12' },
      { id: 'p_eos', code: 'EOS', name: 'Eosinophils', unit: '%', dataType: 'NUMERIC', specMin: 0.5, specMax: 5.0, defaultValue: '', normalText: '0.5 - 5' },
      { id: 'p_bas', code: 'BASO', name: 'Basophils', unit: '%', dataType: 'NUMERIC', specMin: 0.0, specMax: 1.0, defaultValue: '', normalText: '0 - 1' },
    ],
  },
  '1086': {
    examCode: '1086',
    examName: 'XPERT MTB/RIF (GENE XPERT)',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Automated Real-Time Cartridge Nested PCR',
    specimenType: 'Sputum Specimen',
    parameters: [
      { id: 'p_xpert_mtb', code: 'MTB_DNA', name: 'M. tuberculosis DNA Result', dataType: 'SELECT', options: ['MTB NOT DETECTED', 'MTB DETECTED VERY LOW', 'MTB DETECTED LOW', 'MTB DETECTED MEDIUM', 'MTB DETECTED HIGH', 'INVALID / ERROR'], defaultValue: 'MTB NOT DETECTED' },
      { id: 'p_xpert_rif', code: 'RIF_RES', name: 'Rifampicin Resistance Status', dataType: 'SELECT', options: ['RIFAMPICIN RESISTANCE NOT DETECTED', 'RIFAMPICIN RESISTANCE DETECTED', 'INDETERMINATE', 'NOT APPLICABLE (MTB NEGATIVE)'], defaultValue: 'NOT APPLICABLE (MTB NEGATIVE)' },
    ],
  },
  '1037': {
    examCode: '1037',
    examName: 'TB CULTURE',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'MGIT Liquid Culture / Ogawa Solid Media',
    specimenType: 'Decontaminated Sputum Specimen',
    parameters: [
      {
        id: 'p_tb_culture_method',
        code: 'TB_METHOD',
        name: 'Culture',
        dataType: 'SELECT',
        options: [
          'Solid Culture (Modified Ogawa) & Liquid Culture (MGIT)',
          'Liquid Culture (MGIT)',
        ],
        defaultValue: '',
      },
      {
        id: 'p_tb_culture',
        code: 'TB_CULTURE',
        name: 'Culture result',
        dataType: 'SELECT',
        options: [
          'No growth after 8 weeks of incubation',
          'No growth after 6 weeks of incubation',
          'Positive for M.tuberculosis',
        ],
        defaultValue: '',
      },
    ],
  },
  '1087': {
    examCode: '1087',
    examName: 'TB DRUG SENSITIVITY (DST)',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Proportional Susceptibility Test (SIRE Panel)',
    specimenType: 'Positive M. tuberculosis Isolate',
    parameters: [
      { id: 'p_dst_inh', code: 'INH', name: 'Isoniazid 0.2 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_rif', code: 'RIF', name: 'Rifampicin 40.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_emb', code: 'EMB', name: 'Ethambutol 2.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_sm', code: 'STR', name: 'Streptomycin 4.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
    ],
  },
  '1038': {
    examCode: '1038',
    examName: 'TB CULTURE & DRUG SENSITIVITY',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Liquid Culture & SIRE DST System',
    specimenType: 'Early Morning Sputum Specimen',
    parameters: [
      {
        id: 'p_tb_culture_method',
        code: 'TB_METHOD',
        name: 'Culture',
        dataType: 'SELECT',
        options: [
          'Solid Culture (Modified Ogawa) & Liquid Culture (MGIT)',
          'Liquid Culture (MGIT)',
        ],
        defaultValue: '',
      },
      {
        id: 'p_tb_culture',
        code: 'TB_CULTURE',
        name: 'Culture result',
        dataType: 'SELECT',
        options: [
          'No growth after 8 weeks of incubation',
          'No growth after 6 weeks of incubation',
          'Positive for M.tuberculosis',
        ],
        defaultValue: '',
      },
      { id: 'p_dst_inh', code: 'INH', name: 'Isoniazid 0.2 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_rif', code: 'RIF', name: 'Rifampicin 40.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_emb', code: 'EMB', name: 'Ethambutol 2.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
      { id: 'p_dst_sm', code: 'STR', name: 'Streptomycin 4.0 ug/ml', dataType: 'SELECT', options: ['Resistant', 'Susceptible'], defaultValue: '' },
    ],
  },
  '1285': {
    examCode: '1285',
    examName: 'ID ONLY (MYCOBACTERIUM IDENTIFICATION)',
    category: 'DSSM / BACTERIOLOGY',
    methodology: 'Rapid MPT64 Antigen / Molecular Speciation',
    specimenType: 'Positive Culture Isolate',
    parameters: [
      { id: 'p_id_mpt64', code: 'MPT64', name: 'MPT64 Antigen Speciation', dataType: 'SELECT', options: ['M. TUBERCULOSIS COMPLEX CONFIRMED', 'NON-TUBERCULOUS MYCOBACTERIA (NTM)'], defaultValue: 'M. TUBERCULOSIS COMPLEX CONFIRMED' },
    ],
  },
  '1025': {
    examCode: '1025',
    examName: 'KOH (POTASSIUM HYDROXIDE MOUNT)',
    category: 'DSSM / BACTERIOLOGY',
    methodology: '10-20% KOH Direct Smear Microscopy',
    specimenType: 'Skin Scrapings / Sputum / Exudate',
    parameters: [
      // Result Form 2 options
      {
        id: 'p_koh_res',
        code: 'KOH',
        name: 'KOH Result',
        dataType: 'SELECT',
        options: ['Positive for Fungal Elements', 'Negative for Fungal Elements'],
        defaultValue: 'Negative for Fungal Elements',
      },
    ],
  },

  // 8. MICROBIOLOGY & CYTOLOGY SEND-OUT TESTS
  '6002-S': {
    examCode: '6002-S',
    examName: 'C/S FOR OTHER M.O (SPUTUM)',
    category: 'MICROBIOLOGY',
    methodology: 'Conventional Culture & Automated ID/AST',
    specimenType: 'Deep Sputum Specimen',
    parameters: [
      { id: 'p_cs_org', code: 'ORGANISM', name: 'Isolated Pathogen', dataType: 'TEXT', normalText: 'Normal Upper Respiratory Flora', defaultValue: 'Normal Upper Respiratory Flora' },
      { id: 'p_cs_col', code: 'COLONY_COUNT', name: 'Colony Count / Quantitation', dataType: 'TEXT', normalText: 'No significant growth', defaultValue: 'No significant growth' },
      { id: 'p_cs_ast', code: 'AST_RESULT', name: 'Antibiotic Susceptibility Remarks', dataType: 'TEXT', normalText: 'No susceptibility testing required', defaultValue: 'No susceptibility testing required' },
    ],
  },
  '1026': {
    examCode: '1026',
    examName: 'C/S FOR OTHER M.O (BODY FLUIDS)',
    category: 'MICROBIOLOGY',
    methodology: 'Automated Broth & Agar Inoculation',
    specimenType: 'Pleural / Peritoneal / Synovial Fluid',
    parameters: [
      { id: 'p_cs_fluid_org', code: 'ORGANISM', name: 'Isolated Organism', dataType: 'TEXT', normalText: 'No growth after 48-72 hours', defaultValue: 'No growth after 48-72 hours' },
      { id: 'p_cs_fluid_ast', code: 'SENSITIVITY', name: 'Antimicrobial Sensitivity', dataType: 'TEXT', normalText: 'Sterile specimen baseline', defaultValue: 'Sterile specimen baseline' },
    ],
  },
  '1088': {
    examCode: '1088',
    examName: 'CULTURE AND SENSITIVITY (AEROBIC)',
    category: 'MICROBIOLOGY',
    methodology: 'Kirby-Bauer Disc Diffusion & MIC Panel',
    specimenType: 'Wound Swab / Urine / Exudate',
    parameters: [
      { id: 'p_aer_org', code: 'ISOLATE', name: 'Identified Microorganism', dataType: 'TEXT', normalText: 'No bacterial growth', defaultValue: 'No bacterial growth' },
      { id: 'p_aer_sens', code: 'ANTIBIOGRAM', name: 'Antibiogram Pattern', dataType: 'TEXT', normalText: 'N/A', defaultValue: 'N/A' },
    ],
  },
  '1089': {
    examCode: '1089',
    examName: 'BLOOD CULTURE AND SENSITIVITY',
    category: 'MICROBIOLOGY',
    methodology: 'Continuous Automated Colorimetric Monitoring',
    specimenType: 'Venous Blood in BACTEC Bottle',
    parameters: [
      { id: 'p_bc_growth', code: 'GROWTH', name: 'Growth Status (Day 5)', dataType: 'SELECT', options: ['NO GROWTH AFTER 5 DAYS OF INCUBATION (STERILE)', 'POSITIVE FOR BACTERIAL GROWTH'], defaultValue: 'NO GROWTH AFTER 5 DAYS OF INCUBATION (STERILE)' },
    ],
  },
  '1160': {
    examCode: '1160',
    examName: 'CELL BLOCK',
    category: 'OTHERS',
    methodology: 'Histopathological Cell Block Preparation',
    specimenType: 'Centrifuged Body Fluid Pellet',
    parameters: [
      { id: 'p_cb_micro', code: 'MICROSCOPIC', name: 'Microscopic Description', dataType: 'TEXT', defaultValue: 'Sections show non-neoplastic inflammatory and mesothelial cells.' },
      { id: 'p_cb_diag', code: 'DIAGNOSIS', name: 'Histopathological Impression', dataType: 'SELECT', options: ['NEGATIVE FOR MALIGNANT CELLS', 'ATYPICAL CELLS PRESENT (BIOPSY RECOMMENDED)', 'POSITIVE FOR MALIGNANT CELLS'], defaultValue: 'NEGATIVE FOR MALIGNANT CELLS' },
    ],
  },
  '1161': {
    examCode: '1161',
    examName: 'CELL CYTOLOGY (BODY FLUID)',
    category: 'OTHERS',
    methodology: 'Papanicolaou & Giemsa Cytological Examination',
    specimenType: 'Pleural / Ascitic / CSF Fluid',
    parameters: [
      { id: 'p_cyto_desc', code: 'CYTO_EVAL', name: 'Cytological Smear Evaluation', dataType: 'TEXT', defaultValue: 'Smears contain mature lymphocytes, macrophages, and benign mesothelial elements.' },
      { id: 'p_cyto_diag', code: 'IMPRESSION', name: 'Cytological Impression', dataType: 'SELECT', options: ['NEGATIVE FOR MALIGNANCY (CLASS II)', 'SUSPICIOUS FOR MALIGNANCY (CLASS III)', 'POSITIVE FOR MALIGNANT CELLS (CLASS IV/V)'], defaultValue: 'NEGATIVE FOR MALIGNANCY (CLASS II)' },
    ],
  },
  '1162': {
    examCode: '1162',
    examName: 'CELL BLOCK & CELL CYTOLOGY (PACKAGE)',
    category: 'OTHERS',
    methodology: 'Combined Cytopathology & Cell Block Examination',
    specimenType: 'Direct Body Fluid & Centrifuged Pellet',
    parameters: [
      { id: 'p_pkg_cyto', code: 'CYTO_RESULT', name: 'Cytological Smear Findings', dataType: 'TEXT', defaultValue: 'Adequate cellularity, no diagnostic atypia.' },
      { id: 'p_pkg_cb', code: 'CB_RESULT', name: 'Cell Block Findings', dataType: 'TEXT', defaultValue: 'Cell block sections reveal benign mesothelial population.' },
      { id: 'p_pkg_diag', code: 'FINAL_IMPRESSION', name: 'Combined Final Diagnosis', dataType: 'SELECT', options: ['NEGATIVE FOR MALIGNANT CELLS (BENIGN EFFUSION)', 'POSITIVE FOR METASTATIC CARCINOMA'], defaultValue: 'NEGATIVE FOR MALIGNANT CELLS (BENIGN EFFUSION)' },
    ],
  },
  '1102': {
    examCode: '1102',
    examName: 'AFB (FOR BODY FLUIDS)',
    category: 'OTHERS',
    methodology: 'Concentrated Ziehl-Neelsen Smear Microscopy',
    specimenType: 'Centrifuged Body Fluid',
    parameters: [
      { id: 'p_afb_fluid', code: 'AFB_FLUID', name: 'Acid Fast Bacilli Result', dataType: 'SELECT', options: ['NO ACID FAST BACILLI SEEN IN 300 OIL IMMERSION FIELDS', 'POSITIVE FOR ACID FAST BACILLI (+1)', 'POSITIVE FOR ACID FAST BACILLI (+2)', 'POSITIVE FOR ACID FAST BACILLI (+3)'], defaultValue: 'NO ACID FAST BACILLI SEEN IN 300 OIL IMMERSION FIELDS' },
    ],
  },
  '1022': {
    examCode: '1022',
    examName: 'GRAM STAIN',
    category: 'OTHERS',
    methodology: 'Crystal Violet / Safranin Differential Smear Microscopy',
    specimenType: 'Direct Smear / Exudate',
    parameters: [
      { id: 'p_gram_eval', code: 'GRAM_EVAL', name: 'Gram Stain Observation', dataType: 'TEXT', defaultValue: 'No bacteria seen. Occasional polymorphonuclear leukocytes.' },
    ],
  },

  // 9. SEROLOGY & INFECTIOUS DISEASE PANELS (CMIA & RAPID)
  '1056': {
    examCode: '1056',
    examName: 'HEPATITIS B ANTIGEN TEST',
    category: 'SEROLOGY',
    methodology: 'Rapid Lateral Flow Immunochromatography',
    specimenType: 'Serum / Plasma',
    parameters: [
      { id: 'p_hbsag_res', code: 'HBSAG', name: 'HBsAg Qualitative Screening', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (CONFIRMATION RECOMMENDED)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1104': {
    examCode: '1104',
    examName: 'HBSAG W/ TITER (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Quantitative Chemiluminescent Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hbsag_titer', code: 'HBSAG_TITER', name: 'HBsAg Quantitative Level', unit: 'IU/mL', dataType: 'NUMERIC', specMin: 0.0, specMax: 0.05, defaultValue: '0.00' },
      { id: 'p_hbsag_interp', code: 'INTERP', name: 'HBsAg Interpretation', dataType: 'SELECT', options: ['NON-REACTIVE (< 0.05 IU/mL)', 'REACTIVE (>= 0.05 IU/mL)'], defaultValue: 'NON-REACTIVE (< 0.05 IU/mL)' },
    ],
  },
  '1105': {
    examCode: '1105',
    examName: 'ANTI-HBS (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Quantitative Anti-HBs CMIA',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_antihbs_cmia', code: 'ANTI_HBS', name: 'Anti-HBs Titer', unit: 'mIU/mL', dataType: 'NUMERIC', specMin: 10.0, specMax: 1000.0, defaultValue: '125.00' },
      { id: 'p_antihbs_stat', code: 'IMMUNITY', name: 'Immune Status', dataType: 'SELECT', options: ['PROTECTIVE IMMUNITY (>= 10 mIU/mL)', 'NON-PROTECTIVE (< 10 mIU/mL, BOOSTER RECOMMENDED)'], defaultValue: 'PROTECTIVE IMMUNITY (>= 10 mIU/mL)' },
    ],
  },
  '1106': {
    examCode: '1106',
    examName: 'HBEAG (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hbeag', code: 'HBEAG', name: 'HBeAg Qualitative Status', dataType: 'SELECT', options: ['NON-REACTIVE (Low Viral Replication)', 'REACTIVE (Active High Viral Replication)'], defaultValue: 'NON-REACTIVE (Low Viral Replication)' },
    ],
  },
  '1107': {
    examCode: '1107',
    examName: 'ANTI-HBE (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_antihbe', code: 'ANTI_HBE', name: 'Anti-HBe Status', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (Seroconversion Present)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1109': {
    examCode: '1109',
    examName: 'ANTI-HBC TOTAL (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Competitive Anti-HBc Total Immunoassay',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hbc_tot', code: 'ANTI_HBC_TOT', name: 'Anti-HBc Total (IgG + IgM)', dataType: 'SELECT', options: ['NON-REACTIVE (No Prior HBV Exposure)', 'REACTIVE (Prior / Chronic HBV Infection)'], defaultValue: 'NON-REACTIVE (No Prior HBV Exposure)' },
    ],
  },
  '1109-M': {
    examCode: '1109-M',
    examName: 'ANTI-HBC IGM (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Anti-HBc IgM Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hbc_igm', code: 'ANTI_HBC_IGM', name: 'Anti-HBc IgM (Acute Marker)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (Recent / Acute HBV Infection)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1116': {
    examCode: '1116',
    examName: 'ANTI-HAV IGM (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Chemiluminescent Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hav_igm', code: 'HAV_IGM', name: 'Anti-Hepatitis A Virus IgM', dataType: 'SELECT', options: ['NON-REACTIVE (No Acute Hep A)', 'REACTIVE (Acute Hepatitis A Infection)'], defaultValue: 'NON-REACTIVE (No Acute Hep A)' },
    ],
  },
  '1117': {
    examCode: '1117',
    examName: 'ANTI-HAV IGG (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Chemiluminescent Immunoassay (CMIA)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_hav_igg', code: 'HAV_IGG', name: 'Anti-Hepatitis A Virus IgG', dataType: 'SELECT', options: ['NON-REACTIVE (No Past Exposure/Immunity)', 'REACTIVE (Past Exposure / Protective Immunity)'], defaultValue: 'REACTIVE (Past Exposure / Protective Immunity)' },
    ],
  },
  '1112': {
    examCode: '1112',
    examName: 'ANTI-HCV (CMIA)',
    category: 'SEROLOGY',
    methodology: 'Recombinant Multi-Antigen CMIA',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_antihcv', code: 'ANTI_HCV', name: 'Anti-Hepatitis C Virus Antibody', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (HCV RNA Confirmation Recommended)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1004': {
    examCode: '1004',
    examName: 'HIV RAPID ANTIBODY TEST',
    category: 'SEROLOGY',
    methodology: 'Rapid 4th Gen Antigen/Antibody Screening',
    specimenType: 'Serum / Whole Blood',
    parameters: [
      { id: 'p_hiv_res', code: 'HIV', name: 'HIV 1/2 Qualitative Screening', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (SACCL Western Blot Confirmation Required)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1108': {
    examCode: '1108',
    examName: 'DENGUE DUO (NS1 / IGG / IGM)',
    category: 'SEROLOGY',
    methodology: 'Rapid Immunochromatographic Dual Detection',
    specimenType: 'Serum / Whole Blood',
    parameters: [
      { id: 'p_dengue_ns1', code: 'DENGUE_NS1', name: 'Dengue NS1 Antigen', dataType: 'SELECT', options: ['NEGATIVE / NON-REACTIVE', 'POSITIVE / REACTIVE (Acute Phase)'], defaultValue: 'NEGATIVE / NON-REACTIVE' },
      { id: 'p_dengue_igm', code: 'DENGUE_IGM', name: 'Dengue IgM Antibody', dataType: 'SELECT', options: ['NEGATIVE / NON-REACTIVE', 'POSITIVE / REACTIVE (Primary Infection)'], defaultValue: 'NEGATIVE / NON-REACTIVE' },
      { id: 'p_dengue_igg', code: 'DENGUE_IGG', name: 'Dengue IgG Antibody', dataType: 'SELECT', options: ['NEGATIVE / NON-REACTIVE', 'POSITIVE / REACTIVE (Secondary / Past)'], defaultValue: 'NEGATIVE / NON-REACTIVE' },
    ],
  },
  '1110': {
    examCode: '1110',
    examName: 'SYPHILIS (RPR / VDRL)',
    category: 'SEROLOGY',
    methodology: 'Rapid Plasma Reagin Flocculation',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_rpr_res', code: 'RPR', name: 'RPR Screening Result', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (Titration & TPHA Confirmation Required)'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1111': {
    examCode: '1111',
    examName: 'TYPHIDOT (IGG / IGM)',
    category: 'SEROLOGY',
    methodology: 'Dot-ELISA / Rapid Lateral Flow',
    specimenType: 'Serum or Plasma',
    parameters: [
      { id: 'p_typhi_igm', code: 'TYPHI_IGM', name: 'Salmonella typhi IgM', dataType: 'SELECT', options: ['NEGATIVE / NON-REACTIVE', 'POSITIVE (Acute Typhoid Fever)'], defaultValue: 'NEGATIVE / NON-REACTIVE' },
      { id: 'p_typhi_igg', code: 'TYPHI_IGG', name: 'Salmonella typhi IgG', dataType: 'SELECT', options: ['NEGATIVE / NON-REACTIVE', 'POSITIVE (Past Exposure / Relapse)'], defaultValue: 'NEGATIVE / NON-REACTIVE' },
    ],
  },
  '1115': {
    examCode: '1115',
    examName: 'WIDAL TEST (FEB AGGLUTINATION)',
    category: 'SEROLOGY',
    methodology: 'Slide & Tube Agglutination (TO, TH, AO, AH, BO, BH)',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_widal_to', code: 'TO', name: 'S. typhi "O" Titer', dataType: 'SELECT', options: ['< 1:80 (Negative)', '1:80', '1:160 (Clinically Significant)', '1:320', '>= 1:640'], defaultValue: '< 1:80 (Negative)' },
      { id: 'p_widal_th', code: 'TH', name: 'S. typhi "H" Titer', dataType: 'SELECT', options: ['< 1:80 (Negative)', '1:80', '1:160 (Clinically Significant)', '1:320', '>= 1:640'], defaultValue: '< 1:80 (Negative)' },
      { id: 'p_widal_ao', code: 'AO', name: 'S. paratyphi "A-O" Titer', dataType: 'SELECT', options: ['< 1:80', '1:80', '1:160', '>= 1:320'], defaultValue: '< 1:80' },
      { id: 'p_widal_bo', code: 'BO', name: 'S. paratyphi "B-O" Titer', dataType: 'SELECT', options: ['< 1:80', '1:80', '1:160', '>= 1:320'], defaultValue: '< 1:80' },
    ],
  },
  '1107-ASO': {
    examCode: '1107-ASO',
    examName: 'ASO TITRE (RAPID)',
    category: 'SEROLOGY',
    methodology: 'Latex Slide Agglutination',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_aso_res', code: 'ASO', name: 'Anti-Streptolysin O Titer', unit: 'IU/mL', dataType: 'SELECT', options: ['< 200 IU/mL (NON-REACTIVE)', '>= 200 IU/mL (REACTIVE)'], defaultValue: '< 200 IU/mL (NON-REACTIVE)' },
    ],
  },
  '1095': {
    examCode: '1095',
    examName: 'HEPA PROFILE (A, B, C)',
    category: 'SEROLOGY',
    methodology: 'Multiparameter CMIA Viral Hepatitis Panel',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_prof_hav', code: 'HAV_IGM', name: 'Anti-HAV IgM', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
      { id: 'p_prof_hbsag', code: 'HBSAG', name: 'HBsAg (Surface Antigen)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
      { id: 'p_prof_antihbs', code: 'ANTI_HBS', name: 'Anti-HBs (Surface Antibody)', dataType: 'SELECT', options: ['NON-REACTIVE (< 10 mIU/mL)', 'REACTIVE / IMMUNE (>= 10 mIU/mL)'], defaultValue: 'REACTIVE / IMMUNE (>= 10 mIU/mL)' },
      { id: 'p_prof_hcv', code: 'ANTI_HCV', name: 'Anti-HCV (Antibody)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1096': {
    examCode: '1096',
    examName: 'HEPA B FULL PANEL',
    category: 'SEROLOGY',
    methodology: '5-Parameter CMIA Hepatitis B Suite',
    specimenType: 'Serum',
    parameters: [
      { id: 'p_pnl_hbsag', code: 'HBSAG', name: 'HBsAg (Surface Antigen)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
      { id: 'p_pnl_antihbs', code: 'ANTI_HBS', name: 'Anti-HBs (Surface Antibody)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE (Immune)'], defaultValue: 'REACTIVE (Immune)' },
      { id: 'p_pnl_hbeag', code: 'HBEAG', name: 'HBeAg (Envelope Antigen)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
      { id: 'p_pnl_antihbe', code: 'ANTI_HBE', name: 'Anti-HBe (Envelope Antibody)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
      { id: 'p_pnl_hbc_tot', code: 'ANTI_HBC', name: 'Anti-HBc Total (Core Antibody)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
    ],
  },
  '1281': {
    examCode: '1281',
    examName: 'HEPATITIS B SCREENING (FOR HIV ONLY)',
    category: 'SEROLOGY',
    methodology: 'High-Sensitivity HBsAg Rapid / Chemiluminescent Panel',
    specimenType: 'Serum (SST Gel Separator)',
    parameters: [
      { id: 'p_hiv_hbsag', code: 'HBSAG_HIV', name: 'HBsAg Screening (Pre-ART Protocol)', dataType: 'SELECT', options: ['NON-REACTIVE', 'REACTIVE'], defaultValue: 'NON-REACTIVE' },
    ],
  },
};

export const STORAGE_KEY_TEMPLATES = 'aegis_examination_templates_v9';

/**
 * Loads stored examination templates from localStorage or falls back to standard templates.
 */
export function loadStoredTemplates(): Record<string, ExaminationTemplate> {
  if (typeof window === 'undefined') return DEFAULT_EXAMINATION_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) return DEFAULT_EXAMINATION_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      // Merge with default templates to guarantee completeness
      return { ...DEFAULT_EXAMINATION_TEMPLATES, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load stored templates:', err);
  }
  return DEFAULT_EXAMINATION_TEMPLATES;
}

/**
 * Persists customized examination templates to localStorage.
 */
export function saveStoredTemplates(templates: Record<string, ExaminationTemplate>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates to storage:', err);
  }
}

/**
 * Resets templates back to default factory schema.
 */
export function resetStoredTemplates(): Record<string, ExaminationTemplate> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_TEMPLATES);
    } catch (err) {
      console.error('Failed to reset templates:', err);
    }
  }
  return DEFAULT_EXAMINATION_TEMPLATES;
}

/**
 * Finds or generates the best matching parameter template for an examination name or code.
 */
export function getTemplateForExamination(
  examCodeOrName?: string | null, 
  catalogItem?: { code: string; name: string; category: string },
  customTemplates?: Record<string, ExaminationTemplate>
): ExaminationTemplate {
  const templates = customTemplates || loadStoredTemplates();
  const safeInput = (examCodeOrName || '').toString().trim();

  // 1. Direct code match
  if (safeInput && templates[safeInput]) {
    const tmpl = templates[safeInput];
    return {
      ...tmpl,
      parameters: Array.isArray(tmpl.parameters) ? tmpl.parameters : [],
    };
  }

  const clean = safeInput.toUpperCase();

  const findByCode = (code: string) => {
    const found = templates[code] || DEFAULT_EXAMINATION_TEMPLATES[code];
    if (found && Array.isArray(found.parameters)) {
      return found;
    }
    return null;
  };

  // Specific products before loose name matching.
  // "CBC WITH PLATELET COUNT" must stay on the CBC form, not standalone Platelet Count.
  if (clean) {
    if (clean.includes('MICROTAINER')) {
      const m = findByCode('1185');
      if (m) return m;
    }
    if (clean.includes('CBC') || clean.includes('COMPLETE BLOOD')) {
      const m = findByCode('1010');
      if (m) return m;
    }
    if (clean.includes('PLATELET') && !clean.includes('CBC') && !clean.includes('COMPLETE BLOOD')) {
      const m = findByCode('1029');
      if (m) return m;
    }
    if (clean.includes('PREGNAN') && !clean.includes('SERUM')) {
      const m = findByCode('1042') || findByCode('1013');
      if (m) return m;
    }
    if (clean.includes('SODIUM') || clean.includes('(NA)')) {
      const m = findByCode('1044');
      if (m) return m;
    }
    if ((clean.includes('POTASSIUM') || clean.includes('(K)')) && !clean.includes('KOH')) {
      const m = findByCode('1050');
      if (m) return m;
    }
    if (clean.includes('CHLORIDE') || clean.includes('(CL)')) {
      const m = findByCode('1051');
      if (m) return m;
    }
    if (clean.includes('ELECTROLYTE')) {
      const m = findByCode('1045');
      if (m) return m;
    }
    if (clean.includes('TB CULTURE') && (clean.includes('DRUG') || clean.includes('SENSITIVITY') || clean.includes('WITH ID'))) {
      const m = findByCode('1038');
      if (m) return m;
    }
    if (clean.includes('DRUG SENSITIVITY') || clean.includes('(DST)') || clean === 'DST') {
      const m = findByCode('1087');
      if (m) return m;
    }
    if (clean.includes('TB CULTURE')) {
      const m = findByCode('1037');
      if (m) return m;
    }
  }

  // Longest name/code match so a shorter name cannot steal a more specific exam.
  if (clean) {
    let best: ExaminationTemplate | null = null;
    let bestScore = 0;
    for (const key in templates) {
      const tmpl = templates[key];
      if (!tmpl) continue;
      const tName = (tmpl.examName || '').toUpperCase();
      const tCode = (tmpl.examCode || '').toUpperCase();
      let score = 0;
      if (tName && tName === clean) score = 10000 + tName.length;
      else if (tCode && tCode === clean) score = 9000;
      else if (tName && clean.includes(tName) && tName.length >= 4) score = 1000 + tName.length;
      else if (tName && tName.includes(clean) && clean.length >= 8) score = 500 + clean.length;
      else if (tCode && clean.includes(tCode) && tCode.length >= 3) score = 100 + tCode.length;
      if (score > bestScore) {
        best = tmpl;
        bestScore = score;
      }
    }
    if (best) {
      return {
        ...best,
        parameters: Array.isArray(best.parameters) ? best.parameters : [],
      };
    }
  }

  if (clean) {
    if (clean.includes('URIN') || clean.includes('URINALYSIS')) {
      const m = findByCode('1011');
      if (m) return m;
    }
    if (clean.includes('FECA') || (clean.includes('STOOL') && !clean.includes('OCCULT'))) {
      const m = findByCode('1019') || findByCode('1012');
      if (m) return m;
    }
    if (clean.includes('SPUTUM') || clean.includes('DSSM') || clean.includes('AFB')) {
      const m = findByCode('1001') || findByCode('1003');
      if (m) return m;
    }
    if (clean.includes('BLOOD TYP') || clean.includes('ABO') || clean.includes('RH FACTOR')) {
      const m = findByCode('1006') || findByCode('1030');
      if (m) return m;
    }
    if (clean.includes('FBS') || clean.includes('FASTING BLOOD')) {
      const m = findByCode('1021');
      if (m) return m;
    }
    if (clean.includes('LIPID') || clean.includes('CHOLESTEROL')) {
      const m = findByCode('1015');
      if (m) return m;
    }
    if (clean.includes('URIC') || clean.includes('BUA')) {
      const m = findByCode('1007');
      if (m) return m;
    }
    if (clean.includes('BUN') || clean.includes('UREA')) {
      const m = findByCode('1009');
      if (m) return m;
    }
    if (clean.includes('CREAT')) {
      const m = findByCode('6002') || findByCode('1023');
      if (m) return m;
    }
    if (clean.includes('SGPT') || clean.includes('ALT')) {
      const m = findByCode('1034');
      if (m) return m;
    }
    if (clean.includes('SGOT') || clean.includes('AST')) {
      const m = findByCode('1033');
      if (m) return m;
    }
    if (clean.includes('HBSAG') || clean.includes('HEPATITIS B')) {
      const m = findByCode('1056');
      if (m) return m;
    }
    if (clean.includes('DENGUE')) {
      const m = findByCode('1054');
      if (m) return m;
    }
    if (clean.includes('HIV')) {
      const m = findByCode('1060');
      if (m) return m;
    }
    if (clean.includes('SYPHILIS') || clean.includes('VDRL') || clean.includes('RPR')) {
      const m = findByCode('1059');
      if (m) return m;
    }
    if (clean.includes('TSH')) {
      const m = findByCode('1044');
      if (m) return m;
    }
    if (clean.includes('THROMBOPLASTIN') || clean.includes('PTT') || clean.includes('APTT')) {
      const m = findByCode('1032');
      if (m) return m;
    }
    if (clean.includes('PROTHROMBIN') || clean.includes(' PT ') || clean.endsWith('(PT)') || clean.includes('PT (')) {
      const m = findByCode('1031');
      if (m) return m;
    }
  }

  // Generic fallback template
  const fallbackName = catalogItem?.name || safeInput || 'Clinical Examination';
  const fallbackCat = catalogItem?.category || 'CLINICAL LABORATORY';
  return {
    examCode: catalogItem?.code || 'GEN-01',
    examName: fallbackName,
    category: fallbackCat,
    methodology: 'Standard Clinical Laboratory Protocol',
    specimenType: 'Biological Specimen',
    parameters: [
      {
        id: `p_gen_result`,
        code: 'RESULT',
        name: `${fallbackName} Measurement`,
        unit: 'Units',
        dataType: 'TEXT',
        normalText: 'Normal / Reference Baseline',
        defaultValue: 'Normal',
      },
      {
        id: `p_gen_remarks`,
        code: 'REMARKS',
        name: 'Clinical Remarks / Interpretation',
        dataType: 'TEXT',
        normalText: 'No abnormality detected',
        defaultValue: 'No abnormality detected',
      },
    ],
  };
}
