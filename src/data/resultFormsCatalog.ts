/**
 * Official printable Result Forms (paper-style lab reports).
 * Distinct from Result Templates (analyte / parameter schemas).
 */

import { findCatalogExamination, getDefaultAssignedForm } from './examinationCatalog';

export type ResultFormFieldType = 'text' | 'date' | 'time' | 'select' | 'textarea' | 'datetime';

export interface ResultFormHeaderField {
  id: string;
  label: string;
  type: ResultFormFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  /** Grid column span on the patient header (1–12). Default 6. */
  span?: number;
  /** When select value equals this, show an extra free-text field */
  otherSpecifyOption?: string;
}

/**
 * Specimen / accession meta fields (lab number, sample type, exam date).
 * Use `otherSpecifyOption` when selecting that option should reveal a free-text field.
 */
export interface ResultFormSpecimenField {
  id: string;
  label: string;
  type: ResultFormFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  span?: number;
  /** When select value equals this, show an extra "specify" text input */
  otherSpecifyOption?: string;
}

export interface ResultFormAnalyteRow {
  id: string;
  /** Display label, e.g. "Examination HGT @" or "Color" */
  label: string;
  /** Linked examination product code when applicable */
  examCode?: string;
  /** Fixed unit shown beside the result (omit or leave empty to hide unit column) */
  unit?: string;
  hideUnit?: boolean;
  /** Reference range text for 4-column hematology tables (e.g. "140 - 180") */
  refRange?: string;
  /** Result input control */
  resultType: 'text' | 'textarea' | 'numeric' | 'select';
  options?: string[];
  /**
   * When set, the examination cell is a dropdown of these methods
   * instead of the fixed label.
   */
  examOptions?: string[];
  /** Stored parameter id for the chosen examination. Default `${id}_exam`. */
  examChoiceId?: string;
  /** Result choices that depend on the selected examination. */
  resultOptionsByExam?: Record<string, string[]>;
  /** Optional time-of-draw / reading time beside the exam name (the "@" slot) */
  hasAtTime?: boolean;
  placeholder?: string;
}

/** Grouped TEST / RESULT rows (e.g. Macroscopic / Chemical / Microscopic) */
export interface ResultFormSection {
  id: string;
  title: string;
  rows: ResultFormAnalyteRow[];
}

export interface ResultFormSignature {
  id: string;
  label: string;
  /** Show date line under the signature */
  showDate?: boolean;
  /** Show license / PRC number line */
  showLicense?: boolean;
  /** Show blank signature line for wet-ink / e-sign */
  showSignatureLine?: boolean;
  /** Printed signatory, prefilled on the sheet */
  defaultName?: string;
  defaultLicense?: string;
}

export interface ResultFormOrgHeader {
  name: string;
  /** e.g. *CENTRAL LABORATORY* */
  subtitle?: string;
  address: string;
  showQr?: boolean;
}

export interface ResultFormDefinition {
  id: string;
  formNumber: number;
  title: string;
  shortName: string;
  description: string;
  /** Primary exam codes this form covers */
  examCodes: string[];
  /** Optional PTSI-style organization banner */
  orgHeader?: ResultFormOrgHeader;
  headerFields: ResultFormHeaderField[];
  /** Optional specimen / accession block (lab no., sample type, etc.) */
  specimenFields?: ResultFormSpecimenField[];
  /**
   * Flat analyte list (Forms 1–2).
   * Prefer `resultSections` for multi-panel reports like Urinalysis.
   */
  analytes?: ResultFormAnalyteRow[];
  /** Sectioned TEST / RESULT panels (Form 3 Urinalysis) */
  resultSections?: ResultFormSection[];
  /** Panel title above TEST/RESULT table (e.g. URINALYSIS) */
  panelTitle?: string;
  /** Show Remarks free-text block */
  showRemarks?: boolean;
  /** On print, hide analyte rows with empty results */
  hideEmptyResultsOnPrint?: boolean;
  signatures: ResultFormSignature[];
  /** Footer disclaimer under signatures */
  footerNote?: string;
  /**
   * Special render mode:
   * - blood-typing: centered ABO + Rh dropdowns (Form 5)
   * - pregnancy: centered urine hCG result (Form 7)
   */
  layoutStyle?: 'default' | 'blood-typing' | 'pregnancy' | 'ntp-request';
  /**
   * Section table column layout:
   * - test-result (Forms 3–4)
   * - test-result-unit-ref (Form 6 Hematology CBC)
   */
  tableColumns?: 'test-result' | 'test-result-unit-ref';
  /** Left result-table header. Default "Test". */
  testColumnLabel?: string;
  /** Right result-table header. Default "Result". */
  resultColumnLabel?: string;
  /** Where panelTitle is drawn. Default above the result table. */
  panelTitlePlacement?: 'above-table' | 'below-org';
  /** Sectioned forms print "- End of Report -" unless this is false. */
  showEndOfReport?: boolean;
  /** Gender-specific reference variant (Form 6 Male / future Female) */
  genderVariant?: 'male' | 'female';
}

/**
 * Standard PTSI patient block used on all Result Forms (3-column compact layout).
 * Patient Name | Phone# | OR#
 * Patient ID No | Age | Collected
 * Hospital/Clinic | Birthdate | Release date
 * Referring MD | Gender | Barcode
 */
export const PTSI_PATIENT_HEADER_FIELDS: ResultFormHeaderField[] = [
  { id: 'patientName', label: 'Patient Name', type: 'text', required: true, span: 4, placeholder: 'Full name' },
  { id: 'phone', label: 'Phone#', type: 'text', span: 4, placeholder: 'Contact number' },
  { id: 'orNumber', label: 'OR#', type: 'text', span: 4, placeholder: 'Official receipt no.' },
  { id: 'patientId', label: 'Patient ID No', type: 'text', span: 4, placeholder: 'Patient / case ID' },
  { id: 'age', label: 'Age', type: 'text', span: 4, placeholder: 'Age' },
  { id: 'collected', label: 'Collected', type: 'text', span: 4, placeholder: 'Date / time collected' },
  { id: 'hospitalClinic', label: 'Hospital/Clinic', type: 'text', span: 4, placeholder: 'Hospital or clinic' },
  { id: 'birthdate', label: 'Birthdate', type: 'date', span: 4 },
  { id: 'releaseDate', label: 'Release date', type: 'date', span: 4 },
  { id: 'referringMd', label: 'Referring MD', type: 'text', span: 4, placeholder: 'Referring physician' },
  { id: 'gender', label: 'Gender', type: 'select', span: 4, options: ['Male', 'Female', 'Other'] },
  { id: 'barcode', label: 'Barcode', type: 'text', span: 4, placeholder: 'Specimen barcode' },
];

/** Result Form 1 — HGT (Hemoglucotest) */
export const RESULT_FORM_1: ResultFormDefinition = {
  id: 'RF-01',
  formNumber: 1,
  title: 'Result Form 1 — HGT',
  shortName: 'RF-01 HGT',
  description: 'Hemoglucotest (capillary blood glucose) result report',
  examCodes: ['1043'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  analytes: [
    {
      id: 'hgt',
      label: 'Examination HGT',
      examCode: '1043',
      unit: 'mg/dL',
      resultType: 'text',
      hasAtTime: true,
      placeholder: 'Enter result',
    },
  ],
  signatures: [
    { id: 'medTech', label: 'Medical Technologist', showDate: true },
    { id: 'pathologist', label: 'Pathologist', showDate: true, showLicense: true, showSignatureLine: true },
  ],
};

/** Result Form 2 — KOH (Potassium Hydroxide Mount) */
export const RESULT_FORM_2: ResultFormDefinition = {
  id: 'RF-02',
  formNumber: 2,
  title: 'KOH Result Form',
  shortName: 'RF-02 KOH',
  description: 'Potassium hydroxide mount — fungal elements result report',
  examCodes: ['1025'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  specimenFields: [
    { id: 'labNumber', label: 'Laboratory Number', type: 'text', required: true, span: 6, placeholder: 'Lab accession / case no.' },
    { id: 'dateSpecimenExamined', label: 'Date Specimen Examined', type: 'date', required: true, span: 6 },
    {
      id: 'sampleType',
      label: 'Sample',
      type: 'select',
      required: true,
      span: 12,
      options: ['Sputum', 'Other'],
      otherSpecifyOption: 'Other',
      placeholder: 'Specify other specimen',
    },
  ],
  analytes: [
    {
      id: 'koh',
      label: 'KOH Examination',
      examCode: '1025',
      hideUnit: true,
      resultType: 'select',
      options: [
        'Positive for Fungal Elements',
        'Negative for Fungal Elements',
      ],
      placeholder: 'Select result',
    },
  ],
  signatures: [
    { id: 'labTech', label: 'Laboratory Technician', showDate: true },
    { id: 'medTech', label: 'Medical Technologist', showDate: true, showLicense: true },
    {
      id: 'pathologist',
      label: 'Pathologist',
      showDate: true,
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Result Form 3 — Urinalysis (PTSI official layout) */
export const RESULT_FORM_3: ResultFormDefinition = {
  id: 'RF-03',
  formNumber: 3,
  title: 'URINALYSIS',
  shortName: 'RF-03 Urinalysis',
  description: 'PTSI urinalysis result report (macroscopic, chemical, microscopic)',
  examCodes: ['1041', '1011'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  panelTitle: 'URINALYSIS',
  showRemarks: true,
  hideEmptyResultsOnPrint: true,
  footerNote:
    'This laboratory result is best interpreted by your attending physician in correlation with your other diagnostic procedures. This is an electronically generated report.',
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  resultSections: [
    {
      id: 'macroscopic',
      title: 'MACROSCOPIC EXAMINATION',
      rows: [
        { id: 'ua_color', label: 'Color', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_transparency', label: 'Transparency', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_ph', label: 'PH', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_sg', label: 'Specific Gravity', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
    {
      id: 'chemical',
      title: 'CHEMICAL EXAMINATION',
      rows: [
        { id: 'ua_protein', label: 'Protein', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_glucose', label: 'Glucose', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_ketone', label: 'Ketone', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_nitrite', label: 'Nitrite', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_urobilinogen', label: 'Urobilinogen', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_bilirubin', label: 'Bilirubin', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_leukocytes', label: 'Leukocytes', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_blood', label: 'Blood', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
    {
      id: 'microscopic',
      title: 'MICROSCOPIC EXAMINATION',
      rows: [
        { id: 'ua_wbc', label: 'WBC', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_rbc', label: 'RBC', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_epithelial', label: 'Epithelial Cells', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_bacteria', label: 'Bacteria', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_mucus', label: 'Mucus Threads', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_amorphous', label: 'Amorphous Urates/ Phosphates', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_crystals', label: 'Crystals', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_casts', label: 'Casts', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'ua_others', label: 'Others', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
  ],
  signatures: [
    {
      id: 'medTech1',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'medTech2',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'pathologist',
      label: 'Pathologist',
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Result Form 4 — Fecalysis (PTSI official layout) */
export const RESULT_FORM_4: ResultFormDefinition = {
  id: 'RF-04',
  formNumber: 4,
  title: 'FECALYSIS',
  shortName: 'RF-04 Fecalysis',
  description: 'PTSI fecalysis result report (macroscopic, microscopic, occult blood)',
  examCodes: ['1019', '1012'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  panelTitle: 'FECALYSIS',
  showRemarks: true,
  hideEmptyResultsOnPrint: true,
  footerNote:
    'This laboratory result is best interpreted by your attending physician in correlation with your other diagnostic procedures. This is an electronically generated report.',
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  resultSections: [
    {
      id: 'macroscopic',
      title: 'MACROSCOPIC EXAMINATION',
      rows: [
        { id: 'fec_color', label: 'Color', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_consistency', label: 'Consistency', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_mucus', label: 'Mucus', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_blood', label: 'Blood', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
    {
      id: 'microscopic',
      title: 'MICROSCOPIC EXAMINATION',
      rows: [
        { id: 'fec_wbc', label: 'White blood cell', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_ova', label: 'OVA / Parasites', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_rbc', label: 'Red blood cell', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_pus', label: 'Pus Cells', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_bacteria', label: 'Bacteria', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_yeast', label: 'Yeast Cells', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_fat', label: 'Fat Globules', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_amoeba', label: 'Amoeba', resultType: 'text', hideUnit: true, placeholder: '' },
        { id: 'fec_others', label: 'Others', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
    {
      id: 'occult',
      title: 'OCCULT BLOOD STOOL EXAMINATION',
      rows: [
        { id: 'fec_fobt', label: 'Fecal Occult Blood Test', resultType: 'text', hideUnit: true, placeholder: '' },
      ],
    },
  ],
  signatures: [
    {
      id: 'medTech1',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'medTech2',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'pathologist',
      label: 'Pathologist',
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Compact patient header for Blood Typing Form 5 (matches paper template) */
export const BLOOD_TYPING_HEADER_FIELDS: ResultFormHeaderField[] = [
  { id: 'patientName', label: 'Name', type: 'text', required: true, span: 6, placeholder: 'Patient full name' },
  { id: 'age', label: 'Age', type: 'text', span: 3, placeholder: 'Age' },
  { id: 'date', label: 'Date', type: 'date', required: true, span: 3 },
  { id: 'referringMd', label: 'Requesting Physician', type: 'text', span: 6, placeholder: 'Physician name' },
  { id: 'gender', label: 'Sex', type: 'select', span: 3, options: ['Male', 'Female', 'Other'] },
  { id: 'ward', label: 'Ward', type: 'text', span: 3, placeholder: 'Ward / Clinic' },
];

/** Result Form 5 — Blood Typing (ABO & Rh) */
export const RESULT_FORM_5: ResultFormDefinition = {
  id: 'RF-05',
  formNumber: 5,
  title: 'Blood Typing Result',
  shortName: 'RF-05 Blood Typing',
  description: 'ABO blood group and Rh factor result report',
  examCodes: ['1006', '1030'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    subtitle: '*CENTRAL LABORATORY*',
    address: '',
    showQr: false,
  },
  panelTitle: 'HEMATOLOGY',
  layoutStyle: 'blood-typing',
  headerFields: BLOOD_TYPING_HEADER_FIELDS,
  analytes: [
    {
      id: 'bt_abo',
      label: 'Blood Type (ABO)',
      examCode: '1006',
      hideUnit: true,
      resultType: 'select',
      options: ['A', 'B', 'AB', 'O'],
      placeholder: 'Select blood type',
    },
    {
      id: 'bt_rh',
      label: 'Rh Factor',
      examCode: '1006',
      hideUnit: true,
      resultType: 'select',
      options: ['RH POSITIVE', 'RH NEGATIVE'],
      placeholder: 'Select Rh',
    },
  ],
  signatures: [
    {
      id: 'medTech1',
      label: 'NAME, RMT',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'medTech2',
      label: 'NAME, RMT',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'pathologist',
      label: 'NAME, MD',
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Result Form 7 — Pregnancy Test (Urine) */
export const RESULT_FORM_7: ResultFormDefinition = {
  id: 'RF-07',
  formNumber: 7,
  title: 'Pregnancy Test Result',
  shortName: 'RF-07 Pregnancy Test',
  description: 'Qualitative urine hCG pregnancy test result',
  examCodes: ['1042', '1013'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    subtitle: '*CENTRAL LABORATORY*',
    address: '',
    showQr: false,
  },
  panelTitle: 'PREGNANCY TEST',
  layoutStyle: 'pregnancy',
  headerFields: BLOOD_TYPING_HEADER_FIELDS,
  analytes: [
    {
      id: 'preg_urine',
      label: 'Result',
      examCode: '1042',
      hideUnit: true,
      resultType: 'select',
      options: ['POSITIVE', 'NEGATIVE'],
      placeholder: 'Select result',
    },
  ],
  signatures: [
    {
      id: 'medTech1',
      label: 'NAME, RMT',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'medTech2',
      label: 'NAME, RMT',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'pathologist',
      label: 'NAME, MD',
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Result Form 6 — Hematology CBC (Male reference ranges) */
export const RESULT_FORM_6: ResultFormDefinition = {
  id: 'RF-06',
  formNumber: 6,
  title: 'HEMATOLOGY',
  shortName: 'RF-06 Hematology (Male)',
  description: 'CBC with differential — male reference ranges (PTSI Form 6)',
  examCodes: ['1010', '1185'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  panelTitle: 'HEMATOLOGY',
  tableColumns: 'test-result-unit-ref',
  genderVariant: 'male',
  showRemarks: true,
  hideEmptyResultsOnPrint: true,
  footerNote:
    'This laboratory result is best interpreted by your attending physician in correlation with your other diagnostic procedures. This is an electronically generated report.',
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  resultSections: [
    {
      id: 'cbc',
      title: 'COMPLETE BLOOD COUNT',
      rows: [
        {
          id: 'p_hgb',
          label: 'Hemoglobin',
          examCode: '1010',
          unit: 'g/L',
          refRange: '140 - 180',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_hct',
          label: 'Hematocrit',
          examCode: '1010',
          unit: '% VOLUME',
          refRange: '42 - 54',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_rbc',
          label: 'RBC Count',
          examCode: '1010',
          unit: 'x10¹²/L',
          refRange: '5 - 6.2',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_plt',
          label: 'Platelets',
          examCode: '1010',
          unit: 'x10⁹/L',
          refRange: '150 - 450',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_wbc',
          label: 'WBC Count',
          examCode: '1010',
          unit: 'x10⁹/L',
          refRange: '4 - 10',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_mcv',
          label: 'MCV',
          examCode: '1010',
          unit: 'fL',
          refRange: '80 - 100',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_mch',
          label: 'MCH',
          examCode: '1010',
          unit: 'pg',
          refRange: '27 - 34',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_mchc',
          label: 'MCHC',
          examCode: '1010',
          unit: 'g/L',
          refRange: '310 - 370',
          resultType: 'numeric',
          placeholder: '',
        },
      ],
    },
    {
      id: 'differential',
      title: 'DIFFERENTIAL COUNT',
      rows: [
        {
          id: 'p_seg',
          label: 'Neutrophils',
          examCode: '1010',
          unit: '%',
          refRange: '50 - 70',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_lym',
          label: 'Lymphocytes',
          examCode: '1010',
          unit: '%',
          refRange: '20 - 40',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_mon',
          label: 'Monocytes',
          examCode: '1010',
          unit: '%',
          refRange: '3 - 12',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_eos',
          label: 'Eosinophils',
          examCode: '1010',
          unit: '%',
          refRange: '0.5 - 5',
          resultType: 'numeric',
          placeholder: '',
        },
        {
          id: 'p_bas',
          label: 'Basophils',
          examCode: '1010',
          unit: '%',
          refRange: '0 - 1',
          resultType: 'numeric',
          placeholder: '',
        },
      ],
    },
  ],
  signatures: [
    {
      id: 'medTech1',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'medTech2',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
    },
    {
      id: 'pathologist',
      label: 'Pathologist',
      showLicense: true,
      showSignatureLine: true,
    },
  ],
};

/** Result Form 6F — Hematology CBC (Female reference ranges) */
export const RESULT_FORM_6F: ResultFormDefinition = {
  ...RESULT_FORM_6,
  id: 'RF-06F',
  formNumber: 6,
  shortName: 'RF-06 Hematology (Female)',
  description: 'CBC with differential — female reference ranges (PTSI Form 6)',
  genderVariant: 'female',
  showRemarks: true,
  resultSections: (RESULT_FORM_6.resultSections || []).map((section) => ({
    ...section,
    rows: section.rows.map((row) => {
      if (row.id === 'p_hgb') return { ...row, refRange: '120 - 160' };
      if (row.id === 'p_hct') return { ...row, refRange: '38 - 48' };
      if (row.id === 'p_rbc') return { ...row, refRange: '4 - 5.5' };
      return { ...row };
    }),
  })),
};

/** Result Form 8 — Clinical Chemistry (Female reference ranges) */
export const RESULT_FORM_8F: ResultFormDefinition = {
  id: 'RF-08F',
  formNumber: 8,
  title: 'CLINICAL CHEMISTRY',
  shortName: 'RF-08 Clinical Chemistry (Female)',
  description: 'Electrolytes, kidney function, liver enzymes, and FBS — female reference ranges',
  examCodes: ['1044', '1050', '1051', '1045', '1009', '6002', '1023', '1007', '1033', '1034', '1021'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    address: 'QUEZON INSTITUTE Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
    showQr: true,
  },
  panelTitle: 'CLINICAL CHEMISTRY',
  tableColumns: 'test-result-unit-ref',
  genderVariant: 'female',
  hideEmptyResultsOnPrint: true,
  footerNote:
    'This laboratory result is best interpreted by your attending physician in correlation with your other diagnostic procedures. This is an electronically generated report.',
  headerFields: PTSI_PATIENT_HEADER_FIELDS,
  resultSections: [
    {
      id: 'electrolytes',
      title: 'ELECTROLYTES',
      rows: [
        { id: 'p_na', label: 'SODIUM', examCode: '1044', unit: 'mmol/L', refRange: '135 - 148', resultType: 'numeric' },
        { id: 'p_k', label: 'POTASSIUM', examCode: '1050', unit: 'mmol/L', refRange: '3.5 - 5.3', resultType: 'numeric' },
        { id: 'p_cl', label: 'CHLORIDE', examCode: '1051', unit: 'mmol/L', refRange: '98 - 107', resultType: 'numeric' },
      ],
    },
    {
      id: 'kidney',
      title: 'KIDNEY FUNCTION TEST',
      rows: [
        { id: 'p_bun', label: 'BUN (Blood Urea Nitrogen)', examCode: '1009', unit: 'mmol/L', refRange: '2.8 - 7.2', resultType: 'numeric' },
        { id: 'p_creat', label: 'CREATININE', examCode: '6002', unit: 'umol/L', refRange: '44 - 80', resultType: 'numeric' },
        { id: 'p_bua', label: 'URIC ACID (Blood Uric Acid)', examCode: '1007', unit: 'umol/L', refRange: '137 - 363', resultType: 'numeric' },
      ],
    },
    {
      id: 'liver',
      title: 'LIVER FUNCTION TEST',
      rows: [
        { id: 'p_sgot', label: 'SGOT/AST', examCode: '1033', unit: 'U/L', refRange: '< 31', resultType: 'numeric' },
        { id: 'p_sgpt', label: 'SGPT/ALT', examCode: '1034', unit: 'U/L', refRange: '< 34', resultType: 'numeric' },
      ],
    },
    {
      id: 'glucose',
      title: 'GLUCOSE',
      rows: [
        { id: 'p_fbs', label: 'FBS (Fasting Blood Sugar)', examCode: '1021', unit: 'mmol/L', refRange: '3.9 - 6.4', resultType: 'numeric' },
      ],
    },
  ],
  signatures: [
    { id: 'medTech1', label: 'Medical Technologist', showLicense: true, showSignatureLine: true },
    { id: 'medTech2', label: 'Medical Technologist', showLicense: true, showSignatureLine: true },
    { id: 'pathologist', label: 'Pathologist', showLicense: true, showSignatureLine: true },
  ],
};

/** Result Form 8 — Clinical Chemistry (Male reference ranges) */
export const RESULT_FORM_8: ResultFormDefinition = {
  ...RESULT_FORM_8F,
  id: 'RF-08',
  shortName: 'RF-08 Clinical Chemistry (Male)',
  description: 'Electrolytes, kidney function, liver enzymes, and FBS — male reference ranges',
  genderVariant: 'male',
  resultSections: (RESULT_FORM_8F.resultSections || []).map((section) => ({
    ...section,
    rows: section.rows.map((row) => {
      if (row.id === 'p_creat') return { ...row, refRange: '70 - 115' };
      if (row.id === 'p_bua') return { ...row, refRange: '214 - 488' };
      if (row.id === 'p_sgot') return { ...row, refRange: '< 35' };
      if (row.id === 'p_sgpt') return { ...row, refRange: '< 45' };
      return { ...row };
    }),
  })),
};

const TB_CULTURE_SOLID_LIQUID = 'Solid Culture (Modified Ogawa) & Liquid Culture (MGIT)';
const TB_CULTURE_LIQUID = 'Liquid Culture (MGIT)';
const TB_POSITIVE = 'Positive for M.tuberculosis';

const TB_DST_OPTIONS = ['Resistant', 'Susceptible'];

/** Parameter id that stores the chosen culture method on Form 9. */
export function examChoiceKey(row: ResultFormAnalyteRow): string {
  return row.examChoiceId || `${row.id}_exam`;
}

/** Result dropdown options for a row, narrowed by the selected examination when needed. */
export function resultOptionsForRow(row: ResultFormAnalyteRow, examChoice?: string): string[] {
  if (row.resultOptionsByExam) {
    if (!examChoice) return [];
    return row.resultOptionsByExam[examChoice] || [];
  }
  return row.options || [];
}

/** Result Form 9 — TB Bacteriology */
export const RESULT_FORM_9: ResultFormDefinition = {
  id: 'RF-09',
  formNumber: 9,
  title: 'TB BACTERIOLOGY RESULT FORM',
  shortName: 'RF-09 TB Bacteriology',
  description: 'TB culture (Ogawa / MGIT) and first-line drug susceptibility',
  examCodes: ['1037', '1087', '1038'],
  orgHeader: {
    name: 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.',
    subtitle: 'CENTRAL LABORATORY',
    address: 'Q.I. Compound, E. Rodriguez Sr. Avenue, Quezon City',
  },
  panelTitle: 'TB BACTERIOLOGY RESULT FORM',
  panelTitlePlacement: 'below-org',
  testColumnLabel: 'Examination',
  resultColumnLabel: 'Result',
  showEndOfReport: false,
  hideEmptyResultsOnPrint: true,
  headerFields: [
    { id: 'labNo', label: 'Lab. No.', type: 'text', span: 6, placeholder: 'Lab number' },
    { id: 'ageSex', label: 'Age/Sex', type: 'text', span: 6, placeholder: 'Age / Sex' },
    { id: 'patientName', label: 'Name', type: 'text', required: true, span: 6, placeholder: 'Full name' },
    { id: 'dateSubmitted', label: 'Date Submitted', type: 'date', span: 6 },
    { id: 'requestingPhysician', label: 'Requesting Physician', type: 'text', span: 6, placeholder: 'Physician' },
    { id: 'dateReleased', label: 'Date Released', type: 'date', span: 6 },
    {
      id: 'specimen',
      label: 'Specimen',
      type: 'select',
      span: 6,
      options: ['Sputum', 'Other'],
      otherSpecifyOption: 'Other',
      placeholder: 'Specify specimen',
    },
    { id: 'source', label: 'Source', type: 'text', span: 6, placeholder: 'Source' },
  ],
  resultSections: [
    {
      id: 'culture',
      title: 'CULTURE',
      rows: [
        {
          id: 'p_tb_culture',
          label: 'Culture',
          examCode: '1037',
          examChoiceId: 'p_tb_culture_method',
          examOptions: [TB_CULTURE_SOLID_LIQUID, TB_CULTURE_LIQUID],
          resultType: 'select',
          resultOptionsByExam: {
            [TB_CULTURE_SOLID_LIQUID]: [
              'No growth after 8 weeks of incubation',
              TB_POSITIVE,
            ],
            [TB_CULTURE_LIQUID]: [
              'No growth after 6 weeks of incubation',
              TB_POSITIVE,
            ],
          },
        },
      ],
    },
    {
      id: 'dst',
      title: 'DRUG SUSCEPTIBILITY TEST',
      rows: [
        { id: 'p_dst_inh', label: 'Isoniazid 0.2 ug/ml', examCode: '1087', resultType: 'select', options: TB_DST_OPTIONS },
        { id: 'p_dst_rif', label: 'Rifampicin 40.0 ug/ml', examCode: '1087', resultType: 'select', options: TB_DST_OPTIONS },
        { id: 'p_dst_emb', label: 'Ethambutol 2.0 ug/ml', examCode: '1087', resultType: 'select', options: TB_DST_OPTIONS },
        { id: 'p_dst_sm', label: 'Streptomycin 4.0 ug/ml', examCode: '1087', resultType: 'select', options: TB_DST_OPTIONS },
      ],
    },
  ],
  signatures: [
    {
      id: 'medTech',
      label: 'Medical Technologist',
      showLicense: true,
      showSignatureLine: true,
      defaultName: 'Harry S. De Mesa, RMT',
      defaultLicense: '006494',
    },
    {
      id: 'verified',
      label: 'Verified',
      showLicense: true,
      showSignatureLine: true,
      defaultName: 'Citadel L. Loresco, RMT',
      defaultLicense: '0031142',
    },
    {
      id: 'pathologist',
      label: 'Pathologist',
      showLicense: true,
      showSignatureLine: true,
      defaultName: 'Marlene S. Ontog, MD',
      defaultLicense: '006826',
    },
  ],
};

/** Result Form 10 — Form 2a Laboratory Request and Result Form */
export const RESULT_FORM_10: ResultFormDefinition = {
  id: 'RF-10',
  formNumber: 10,
  title: 'Form 2a. LABORATORY REQUEST AND RESULT FORM',
  shortName: 'RF-10 Laboratory Request',
  description: 'Xpert, Truenat, TB LAMP, and smear microscopy request and result form',
  examCodes: ['1086', '1017'],
  layoutStyle: 'ntp-request',
  panelTitle: 'Form 2a. LABORATORY REQUEST AND RESULT FORM',
  headerFields: [],
  signatures: [],
  footerNote: 'A separate result form for LPA, Culture and DST will be issued',
};

export const RESULT_FORMS: ResultFormDefinition[] = [
  RESULT_FORM_1,
  RESULT_FORM_2,
  RESULT_FORM_3,
  RESULT_FORM_4,
  RESULT_FORM_5,
  RESULT_FORM_6,
  RESULT_FORM_6F,
  RESULT_FORM_7,
  RESULT_FORM_8,
  RESULT_FORM_8F,
  RESULT_FORM_9,
  RESULT_FORM_10,
];

export function getResultFormById(id: string): ResultFormDefinition | undefined {
  return RESULT_FORMS.find((f) => f.id === id);
}

/** Result form whose paper number matches a catalog assignment such as "Form 6". */
export function getResultFormForAssignedForm(
  assignedForm?: string | null,
  gender?: string | null
): ResultFormDefinition | undefined {
  const match = /^Form\s+(\d+)$/i.exec((assignedForm || '').trim());
  if (!match) return undefined;
  const formNumber = Number(match[1]);
  const variants = RESULT_FORMS.filter((f) => f.formNumber === formNumber);
  if (variants.length === 0) return undefined;
  const g = normalizeResultFormGender(gender);
  if (g) {
    const gendered = variants.find((f) => f.genderVariant === g);
    if (gendered) return gendered;
  }
  return (
    variants.find((f) => f.genderVariant === 'male') ||
    variants.find((f) => !f.genderVariant) ||
    variants[0]
  );
}

/**
 * Form used for result entry and printing.
 * Catalog assignment wins (all exams set to Form 6 share RF-06), then exam-code links.
 */
export function resolveEntryForm(
  examName: string,
  examCode: string,
  gender?: string | null
): ResultFormDefinition | undefined {
  const item = findCatalogExamination(examName) || findCatalogExamination(examCode);
  const assigned = item
    ? item.assignedForm || getDefaultAssignedForm(item)
    : undefined;
  return (
    getResultFormForAssignedForm(assigned, gender) ||
    getResultFormForExam(examCode, gender)
  );
}

/** Normalize patient gender string to male | female when recognizable. */
export function normalizeResultFormGender(
  gender?: string | null
): 'male' | 'female' | undefined {
  if (!gender) return undefined;
  const g = String(gender).trim().toLowerCase();
  if (g.startsWith('f')) return 'female';
  if (g.startsWith('m')) return 'male';
  return undefined;
}

/**
 * Resolve the result form for an exam code.
 * When multiple gender variants exist (CBC RF-06 / RF-06F), pick by patient gender.
 */
export function getResultFormForExam(
  examCode: string,
  gender?: string | null
): ResultFormDefinition | undefined {
  const matches = RESULT_FORMS.filter((f) => f.examCodes.includes(examCode));
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  const g = normalizeResultFormGender(gender);
  if (g) {
    const gendered = matches.find((f) => f.genderVariant === g);
    if (gendered) return gendered;
  }

  return (
    matches.find((f) => f.genderVariant === 'male') ||
    matches.find((f) => !f.genderVariant) ||
    matches[0]
  );
}

/** Flatten all analyte rows for a form (sections + flat list). */
export function getAllAnalyteRows(form: ResultFormDefinition): ResultFormAnalyteRow[] {
  const fromSections = (form.resultSections || []).flatMap((s) => s.rows);
  return [...(form.analytes || []), ...fromSections];
}
