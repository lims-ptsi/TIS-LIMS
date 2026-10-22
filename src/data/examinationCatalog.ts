import { PatientCategory } from '../types/lims';

export interface ExaminationItem {
  code: string;
  name: string; // Standard / Routine examination name (Sheet 1 & Sheet 2 for OPD, PhilHealth, etc.)
  corporateName?: string; // Approved Corporate examination name (PMDT Corporate Tariff)
  category: ExaminationCategory;
  corporateCategory?: CorporateCategory; // 'BLOOD CHEMISTRY' | 'OTHER LABORATORY SERVICES'
  /** Standard tariff for OPD, PhilHealth, Indigent, Pre-Employment/Employee, and Projects */
  price: number;
  corporatePrice?: number; // Corporate / HMO approved rate
  corporateCode?: string; // Corporate HIS code
  specimenType?: string;
  turnaroundHours?: number;
  methodology?: string;
  notes?: string;
  isActive?: boolean;
  assignedForm?: AssignedFormType;
  sendOutPlatform?: string; // Platform/partner name if assignedForm === 'Send Out'
  /**
   * When false, exam appears only under Corporate / All Schemes —
   * it is NOT on the OPD / PhilHealth / Indigent / Employee / Projects price sheets.
   * Default (undefined/true) = included in standard-scheme lists.
   */
  standardScheme?: boolean;
  /**
   * When true, exam is on the official Corporate HIS tariff sheet.
   * Corporate Tariffs filter shows only these rows.
   */
  corporateScheme?: boolean;
}

/** True if exam belongs on OPD / PhilHealth / Indigent / Employee / Projects sheets */
export const isStandardSchemeExam = (item: ExaminationItem): boolean =>
  item.standardScheme !== false;

/** True if exam belongs on the Corporate / HMO approved HIS tariff sheet */
export const isCorporateSchemeExam = (item: ExaminationItem): boolean =>
  item.corporateScheme === true;

/**
 * Search examinations by internal name, corporate tariff name (HIS sheet), codes, etc.
 * All whitespace-separated tokens must appear somewhere in the combined text.
 */
export function examinationMatchesSearch(
  item: ExaminationItem,
  query: string,
  extraFields: (string | undefined | null)[] = []
): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const haystack = [
    item.name,
    item.corporateName,
    item.code,
    item.corporateCode,
    item.category,
    item.corporateCategory,
    item.specimenType,
    item.methodology,
    item.notes,
    item.sendOutPlatform,
    ...extraFields,
  ]
    .filter((part): part is string => Boolean(part && String(part).trim()))
    .join(' ')
    .toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Official Corporate HIS sheet product codes (maps to ExaminationItem.code).
 * Exactly 40 HIS tariff lines (25 Blood Chemistry + 15 Other Laboratory Services).
 * Pregnancy is one line (HIS 1275) — urine product 1042 only; serum 1068 is not on this sheet.
 */
export const CORPORATE_SHEET_PRODUCT_CODES: readonly string[] = [
  '1010', // CBC — HIS 1274
  '1021', // FBS — HIS 1260
  '1066', // HbA1c — HIS 1261
  '1007', // BUA — HIS 1262
  '1009', // BUN — HIS 1263
  '6002', // Creatinine — HIS 1264
  '1034', // SGPT/ALT — HIS 1265
  '1033', // SGOT/AST — HIS 1266
  '1061', // Bilirubin — HIS 1267
  '1044', // Sodium — HIS 1268
  '1060', // Albumin — HIS 1269
  '1050', // Potassium — HIS 1270
  '1057', // Calcium — HIS 1271
  '1059', // Magnesium — HIS 1272
  '1020', // TSH — HIS 1273
  '1029', // Platelet Count — HIS 1029
  '1004', // HIV Rapid — HIS 1004
  '1042', // Pregnancy Test — HIS 1275 (single corporate line)
  '1081', // Lipase — HIS 1008
  '1082', // Amylase — HIS 1009
  '1056', // HBsAg Rapid — HIS 1276
  '1112', // Anti-HCV — HIS 1277
  '1019', // Fecalysis — HIS 1288
  '1041', // Urinalysis — HIS 1279
  '1043', // HGT — HIS 1280
  '1281', // Hep B Screening (HIV only) — HIS 1281
  '1086', // GeneXpert — HIS 1006
  '1087', // DST — HIS 1282
  '1038', // TB Culture with ID — HIS 1283
  '1037', // TB Culture without ID — HIS 1284
  '1285', // ID only — HIS 1285
  '1017', // AFB-ZN / DSSM — HIS 1286
  '1109', // Hepa HBc Total — HIS 1287
  '1105', // Anti-HBs — HIS 1278
  '1095', // Hepa Profile A,B,C — HIS 1015
  '1096', // Hepa B Full Panel — HIS 1016
  '1047', // Lipid Profile — HIS 1017
  '1113', // T3 — HIS 1018
  '1114', // T4 — HIS 1019
  '1005', // Lactic Acid — HIS 1005
];

export type AssignedFormType = 
  | 'Form 1'
  | 'Form 2'
  | 'Form 3'
  | 'Form 4'
  | 'Form 5'
  | 'Form 6'
  | 'Form 7'
  | 'Form 8'
  | 'Form 9'
  | 'Form 10'
  | 'Send Out'
  | 'Unassigned';

export interface FormOptionMeta {
  id: AssignedFormType;
  formNumber?: number;
  label: string;
  name: string;
  shortName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  isSendOut?: boolean;
}

export const ASSIGNED_FORM_OPTIONS: FormOptionMeta[] = [
  {
    id: 'Form 1',
    formNumber: 1,
    label: 'Form 1 - HGT',
    name: 'Form 1 (HGT / Hemoglucotest)',
    shortName: 'Form 1',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    description: 'Result Form 1. Capillary blood glucose (HGT).',
  },
  {
    id: 'Form 2',
    formNumber: 2,
    label: 'Form 2 - KOH',
    name: 'Form 2 (KOH Mount)',
    shortName: 'Form 2',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    description: 'Result Form 2. Potassium hydroxide mount.',
  },
  {
    id: 'Form 3',
    formNumber: 3,
    label: 'Form 3 - Urinalysis',
    name: 'Form 3 (Urinalysis)',
    shortName: 'Form 3',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    description: 'Result Form 3. Urinalysis.',
  },
  {
    id: 'Form 4',
    formNumber: 4,
    label: 'Form 4 - Fecalysis',
    name: 'Form 4 (Fecalysis)',
    shortName: 'Form 4',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-300',
    description: 'Result Form 4. Fecalysis and occult blood.',
  },
  {
    id: 'Form 5',
    formNumber: 5,
    label: 'Form 5 - Blood Typing',
    name: 'Form 5 (Blood Typing)',
    shortName: 'Form 5',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    description: 'Result Form 5. ABO and Rh blood typing.',
  },
  {
    id: 'Form 6',
    formNumber: 6,
    label: 'Form 6 - Hematology',
    name: 'Form 6 (Hematology / CBC)',
    shortName: 'Form 6',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-300',
    description: 'Result Form 6. Complete blood count, with male and female reference ranges.',
  },
  {
    id: 'Form 7',
    formNumber: 7,
    label: 'Form 7 - Pregnancy Test',
    name: 'Form 7 (Urine Pregnancy Test)',
    shortName: 'Form 7',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    description: 'Result Form 7. Urine pregnancy test.',
  },
  {
    id: 'Form 8',
    formNumber: 8,
    label: 'Form 8 - Clinical Chemistry',
    name: 'Form 8 (Clinical Chemistry)',
    shortName: 'Form 8',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
    description: 'Result Form 8. Electrolytes, kidney function, liver enzymes, and FBS.',
  },
  {
    id: 'Form 9',
    formNumber: 9,
    label: 'Form 9 - TB Bacteriology',
    name: 'Form 9 (TB Bacteriology Result Form)',
    shortName: 'Form 9',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    description: 'TB culture (Modified Ogawa / MGIT) and drug susceptibility (SIRE)',
  },
  {
    id: 'Form 10',
    formNumber: 10,
    label: 'Form 10 - Laboratory Request and Result',
    name: 'Form 10 (Form 2a Laboratory Request and Result)',
    shortName: 'Form 10',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
    description: 'Xpert, Truenat, TB LAMP, and smear microscopy request and result form',
  },
  {
    id: 'Send Out',
    label: 'Send Out (External Platform)',
    name: 'Send Out (External Referral Lab / Platform)',
    shortName: 'Send Out',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-400',
    description: 'Referred to external diagnostic partner platform / reference lab (Not on in-house forms)',
    isSendOut: true,
  },
];

export function getFormMeta(formId?: string): FormOptionMeta {
  const match = ASSIGNED_FORM_OPTIONS.find((f) => f.id === formId);
  if (match) return match;
  return {
    id: 'Send Out',
    label: formId || 'Unassigned',
    name: formId || 'Unassigned',
    shortName: formId || 'Unassigned',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-300',
    description: 'Unassigned routing',
  };
}

/** Official paper each product code prints on. Form N is Result Form N. */
const OFFICIAL_FORM_BY_CODE: Record<string, AssignedFormType> = {
  '1043': 'Form 1',
  '1025': 'Form 2',
  '1041': 'Form 3',
  '1011': 'Form 3',
  '1019': 'Form 4',
  '1006': 'Form 5',
  '1030': 'Form 5',
  '1010': 'Form 6',
  '1185': 'Form 6',
  '1042': 'Form 7',
  '1013': 'Form 7',
  '1044': 'Form 8',
  '1050': 'Form 8',
  '1051': 'Form 8',
  '1045': 'Form 8',
  '1009': 'Form 8',
  '6002': 'Form 8',
  '1023': 'Form 8',
  '1007': 'Form 8',
  '1033': 'Form 8',
  '1034': 'Form 8',
  '1021': 'Form 8',
  '1037': 'Form 9',
  '1087': 'Form 9',
  '1038': 'Form 9',
  '1086': 'Form 10',
  '1017': 'Form 10',
};

/**
 * Ordered here, but performed by a referral laboratory. They have no PTSI result
 * paper, so they must not print as an in-house official form.
 */
const SEND_OUT_EXAM_CODES = new Set([
  '1029', // Platelet Count
  '1032', // Partial Thromboplastin Time (PTT)
  '1047', // Lipid Profile
  '1057', // Total Calcium
  '1059', // Magnesium
  '1061', // Bilirubin (Total, Direct, Indirect)
  '1081', // Lipase
  '1082', // Amylase
  '1005', // Lactic Acid
]);

/**
 * Older catalog builds stored a department number (Form 1 meant every hematology
 * exam, Form 3 meant every chemistry exam). Those numbers are not the result forms.
 * Used only to recognize an automatic assignment that should be corrected.
 */
function legacyDepartmentForm(item: Partial<ExaminationItem>): AssignedFormType {
  const cleanName = (item.name || '').toUpperCase();
  const cat = item.category;

  if (item.notes?.toLowerCase().includes('send-out') || cleanName.includes('SEND-OUT')) {
    return 'Send Out';
  }
  if (cleanName.includes('PROTHROMBIN') || cleanName.includes('PTT') || cleanName.includes('PT/INR')) {
    return 'Form 8';
  }
  if (cleanName.includes('CLOTTING TIME') || cleanName.includes('CT/BT')) {
    return 'Form 1';
  }
  if (cleanName.includes('TSH') || cleanName.includes('FT3') || cleanName.includes('FT4') || cleanName.startsWith('T3') || cleanName.startsWith('T4')) {
    return 'Form 7';
  }
  if (cleanName.includes('C/S') || (cleanName.includes('CULTURE') && !cleanName.includes('TB')) || cleanName.includes('GRAM STAIN') || cleanName.includes('KOH')) {
    return 'Form 6';
  }
  if (cleanName.includes('TB CULTURE') || cleanName.includes('DRUG SENSITIVITY')) {
    return 'Form 9';
  }
  if (cleanName.includes('PSA') || cleanName.includes('CA 125') || cleanName.includes('CA 15-3') || cleanName.includes('CA 19-9') || cleanName.includes('CEA') || cleanName.includes('TROPONIN')) {
    return 'Unassigned';
  }
  if (cleanName.includes('PAP SMEAR') || cleanName.includes('WIDAL')) {
    return 'Send Out';
  }
  if (cat === 'HEMATOLOGY') return 'Form 1';
  if (cat === 'CLINICAL MICROSCOPY') return 'Form 2';
  if (cat === 'CLINICAL CHEMISTRY') return 'Form 3';
  if (cat === 'DSSM / BACTERIOLOGY') return 'Form 5';
  if (cat === 'SEROLOGY' || cat === 'IMMUNOLOGY / THYROID') return 'Form 4';
  if (cat === 'MICROBIOLOGY') return 'Form 6';
  if (cat === 'OTHERS') return 'Form 10';
  return 'Send Out';
}

export function getDefaultAssignedForm(item: Partial<ExaminationItem>): AssignedFormType {
  const cleanName = (item.name || '').toUpperCase();
  const code = (item.code || '').trim();

  if (item.notes?.toLowerCase().includes('send-out') || cleanName.includes('SEND-OUT') || cleanName.includes('PAP SMEAR') || cleanName.includes('WIDAL')) {
    return 'Send Out';
  }
  if (OFFICIAL_FORM_BY_CODE[code]) return OFFICIAL_FORM_BY_CODE[code];
  if (SEND_OUT_EXAM_CODES.has(code)) return 'Send Out';

  if (cleanName.includes('HGT') || cleanName.includes('HEMOGLUCOTEST')) return 'Form 1';
  if (cleanName.includes('KOH') && !cleanName.includes('POTASSIUM')) return 'Form 2';
  if (cleanName.includes('URINALYSIS')) return 'Form 3';
  if (cleanName.includes('FECALYSIS') || cleanName.includes('OCCULT BLOOD')) return 'Form 4';
  if (cleanName.includes('BLOOD TYPING') || cleanName.includes('ABO')) return 'Form 5';
  if (cleanName.includes('COMPLETE BLOOD') || cleanName.includes('MICROTAINER') || /\bCBC\b/.test(cleanName)) return 'Form 6';
  if (cleanName.includes('PREGNANCY') && !cleanName.includes('SERUM')) return 'Form 7';
  if (
    /\bFBS\b/.test(cleanName) || cleanName.includes('FASTING BLOOD') ||
    cleanName.includes('SODIUM') || cleanName.includes('POTASSIUM') || cleanName.includes('CHLORIDE') ||
    cleanName.includes('ELECTROLYTE') || /\bBUN\b/.test(cleanName) || cleanName.includes('CREATININE') ||
    cleanName.includes('SGPT') || cleanName.includes('SGOT') || cleanName.includes('URIC ACID') || cleanName.includes('(BUA)')
  ) return 'Form 8';
  if (cleanName.includes('TB CULTURE') || cleanName.includes('(DST)') || cleanName === 'DST' || (cleanName.includes('DRUG SENSITIVITY') && cleanName.includes('TB'))) {
    return 'Form 9';
  }
  if (cleanName.includes('XPERT') || cleanName.includes('GENEXPERT') || cleanName.includes('DSSM') || cleanName.includes('AFB') || cleanName.includes('TRUENAT') || cleanName.includes('TB LAMP')) {
    return 'Form 10';
  }

  return 'Unassigned';
}

export type ExaminationCategory = 
  | 'HEMATOLOGY'
  | 'CLINICAL MICROSCOPY'
  | 'DSSM / BACTERIOLOGY'
  | 'CLINICAL CHEMISTRY'
  | 'MICROBIOLOGY'
  | 'IMMUNOLOGY / THYROID'
  | 'SEROLOGY'
  | 'OTHERS';

export type CorporateCategory = 
  | 'BLOOD CHEMISTRY'
  | 'OTHER LABORATORY SERVICES';

export const EXAMINATION_CATEGORIES: ExaminationCategory[] = [
  'HEMATOLOGY',
  'CLINICAL MICROSCOPY',
  'DSSM / BACTERIOLOGY',
  'CLINICAL CHEMISTRY',
  'MICROBIOLOGY',
  'IMMUNOLOGY / THYROID',
  'SEROLOGY',
  'OTHERS',
];

export const CORPORATE_CATEGORIES: CorporateCategory[] = [
  'BLOOD CHEMISTRY',
  'OTHER LABORATORY SERVICES',
];

export const EXAMINATION_CATALOG: ExaminationItem[] = [
  // =========================================================================
  // SHEET 1: IN-HOUSE ROUTINE & SPECIAL DIAGNOSTICS (42 EXAMINATIONS)
  // =========================================================================

  // --- HEMATOLOGY (5) ---
  { 
    code: '1010', 
    corporateCode: '1274',
    name: 'CBC WITH PLATELET COUNT', 
    corporateName: 'COMPLETE BLOOD COUNT W/ PLATELET COUNT (CBC)',
    category: 'HEMATOLOGY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 300.00,
    corporatePrice: 450.00,
    specimenType: 'Whole Blood (K2-EDTA)',
    turnaroundHours: 4,
    methodology: 'Automated 5-Part Cell Counter / Flow Cytometry',
    notes: 'Includes WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT, Differential Count',
    isActive: true
  },
  { 
    code: '1185', 
    name: 'CBC WITH MICROTAINER', 
    category: 'HEMATOLOGY', 
    price: 250.00,
    specimenType: 'Microtainer Capillary Blood (EDTA)',
    turnaroundHours: 4,
    methodology: 'Automated Micro-Volume Hematology Analyzer',
    notes: 'Pediatric & difficult draw microtainer collection',
    isActive: true
  },
  { 
    code: '1014', 
    name: 'CT/BT (CLOTTING TIME / BLEEDING TIME)', 
    category: 'HEMATOLOGY', 
    price: 100.00,
    specimenType: 'Capillary / Venous Blood',
    turnaroundHours: 2,
    methodology: 'Ivy / Duke / Lee-White Manual Method',
    notes: 'Pre-operative coagulation screening test',
    isActive: true
  },
  { 
    code: '1006', 
    name: 'BLOOD TYPING (ABO & RH)', 
    category: 'HEMATOLOGY', 
    price: 150.00,
    specimenType: 'Whole Blood (EDTA or Plain)',
    turnaroundHours: 2,
    methodology: 'Forward & Reverse Tube Agglutination',
    notes: 'Includes ABO Grouping and Rh(D) Factor Determination',
    isActive: true
  },
  { 
    code: '1012', 
    name: 'ESR AUTOMATED', 
    category: 'HEMATOLOGY', 
    price: 187.20,
    specimenType: 'Sodium Citrate Whole Blood (1:4)',
    turnaroundHours: 4,
    methodology: 'Automated Photometric Infrared Sedimentation',
    notes: 'Westergren equivalent erythrocyte sedimentation rate',
    isActive: true
  },

  // --- CLINICAL MICROSCOPY (3) ---
  { 
    code: '1019', 
    corporateCode: '1288',
    name: 'FECALYSIS', 
    corporateName: 'FECALYSIS',
    category: 'CLINICAL MICROSCOPY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 95.00,
    corporatePrice: 100.00,
    specimenType: 'Fresh Stool Specimen',
    turnaroundHours: 2,
    methodology: 'Direct Wet Mount & Concentration Microscopy',
    notes: 'Physical, chemical, and microscopic examination for ova and parasites',
    isActive: true
  },
  { 
    code: '1041', 
    corporateCode: '1279',
    name: 'URINALYSIS', 
    corporateName: 'URINALYSIS',
    category: 'CLINICAL MICROSCOPY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 100.00,
    corporatePrice: 100.00,
    specimenType: 'Clean-Catch Midstream Urine',
    turnaroundHours: 2,
    methodology: 'Automated Test Strip Reader & Sediment Microscopy',
    notes: '10-parameter dipstick chemical analysis + microscopic sediment evaluation',
    isActive: true
  },
  { 
    code: '1042', 
    corporateCode: '1275',
    name: 'PREGNANCY TEST (URINE)', 
    corporateName: 'PREGNANCY TEST',
    category: 'CLINICAL MICROSCOPY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 150.00,
    corporatePrice: 250.00,
    specimenType: 'First Morning Urine Specimen',
    turnaroundHours: 1,
    methodology: 'Qualitative hCG Immunochromatography',
    notes: 'Early detection threshold: 25 mIU/mL human chorionic gonadotropin',
    isActive: true
  },

  // --- DSSM / BACTERIOLOGY (5) ---
  { 
    code: '1017', 
    corporateCode: '1286',
    name: 'DSSM (DIRECT SPUTUM SMEAR MICROSCOPY)', 
    corporateName: 'AFB-ZN',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 150.00,
    corporatePrice: 429.00,
    specimenType: 'Early Morning Deep Sputum (2 specimens)',
    turnaroundHours: 24,
    methodology: 'Ziehl-Neelsen Acid Fast Bacilli Stain',
    notes: 'National Tuberculosis Control Program (NTP) protocol smear examination (AFB-ZN)',
    isActive: true
  },
  { 
    code: '1037', 
    corporateCode: '1284',
    name: 'TB CULTURE', 
    corporateName: 'TB CULTURE WITHOUT ID',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 1250.00,
    corporatePrice: 1920.00,
    specimenType: 'Decontaminated Sputum Specimen',
    turnaroundHours: 720,
    methodology: 'MGIT Liquid Culture / Ogawa Solid Media',
    notes: 'Mycobacterium tuberculosis complex recovery without identification (TB Culture without ID)',
    isActive: true,
    assignedForm: 'Form 9',
  },
  { 
    code: '1087', 
    corporateCode: '1282',
    name: 'TB DRUG SENSITIVITY (DST)', 
    corporateName: 'DST',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 1000.00,
    corporatePrice: 1404.00,
    specimenType: 'Positive M. tuberculosis Isolate',
    turnaroundHours: 336,
    methodology: 'Proportional Susceptibility Test (SIRE Panel)',
    notes: 'Susceptibility testing against Streptomycin, Isoniazid, Rifampicin, Ethambutol (DST)',
    isActive: true,
    assignedForm: 'Form 9',
  },
  { 
    code: '1038', 
    corporateCode: '1283',
    name: 'TB CULTURE & DRUG SENSITIVITY', 
    corporateName: 'TB CULTURE WITH ID',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 2250.00,
    corporatePrice: 2520.00,
    specimenType: 'Early Morning Sputum Specimen',
    turnaroundHours: 720,
    methodology: 'Automated Liquid Culture & DST System',
    notes: 'Combined TB culture with full identification and first-line susceptibility (TB Culture with ID)',
    isActive: true,
    assignedForm: 'Form 9',
  },
  { 
    code: '1025', 
    name: 'KOH (POTASSIUM HYDROXIDE MOUNT)', 
    category: 'DSSM / BACTERIOLOGY', 
    price: 150.00,
    specimenType: 'Skin Scrapings / Nail / Hair / Sputum',
    turnaroundHours: 4,
    methodology: '10-20% KOH Direct Microscopic Examination',
    notes: 'Direct fungal elements, pseudohyphae, and budding yeast evaluation',
    isActive: true
  },
  { 
    code: '1086', 
    corporateCode: '1006',
    name: 'XPERT MTB/RIF (GENE XPERT)', 
    corporateName: 'XPERT MTB/RIF (GENE XPERT)',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 620.00,
    corporatePrice: 620.00,
    specimenType: 'Sputum Specimen',
    turnaroundHours: 4,
    methodology: 'Automated Real-Time Cartridge Nested PCR',
    notes: 'Rapid molecular detection of M. tuberculosis DNA & Rifampicin resistance (Gene Xpert)',
    isActive: true,
    assignedForm: 'Form 10',
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1285', 
    corporateCode: '1285',
    name: 'ID ONLY', 
    corporateName: 'ID ONLY',
    category: 'DSSM / BACTERIOLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 600.00,
    corporatePrice: 600.00,
    standardScheme: false, // Corporate sheet only
    specimenType: 'Positive Culture Isolate',
    turnaroundHours: 24,
    methodology: 'Rapid MPT64 Antigen / Molecular Speciation',
    notes: 'Speciation confirmation of M. tuberculosis complex vs NTM (ID only)',
    isActive: true
  },

  // --- CLINICAL CHEMISTRY & TUMOR MARKERS (29) ---
  { 
    code: '1007', 
    corporateCode: '1262',
    name: 'BUA (BLOOD URIC ACID)', 
    corporateName: 'BLOOD URIC ACID (BUA)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 420.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Enzymatic Uricase / Photometric',
    notes: 'Assessment of hyperuricemia and gout prognosis (Blood Uric Acid BUA)',
    isActive: true
  },
  { 
    code: '1009', 
    corporateCode: '1263',
    name: 'BUN (BLOOD UREA NITROGEN)', 
    corporateName: 'BLOOD UREA NITROGEN (BUN)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 410.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Enzymatic GLDH UV Method',
    notes: 'Evaluation of renal function and protein metabolism (Blood Urea Nitrogen BUN)',
    isActive: true
  },
  { 
    code: '6002', 
    corporateCode: '1264',
    name: 'CREATININE', 
    corporateName: 'CREATININE',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 187.50,
    corporatePrice: 200.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Jaffe Kinetic Alkaline Picrate / Enzymatic',
    notes: 'Renal clearance & estimated GFR biomarker',
    isActive: true
  },
  { 
    code: '1021', 
    corporateCode: '1260',
    name: 'GLUCOSE (FBS / RBS)', 
    corporateName: 'FASTING BLOOD SUGAR (FBS)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 150.00,
    corporatePrice: 200.00,
    specimenType: 'Sodium Fluoride Plasma / Serum',
    turnaroundHours: 4,
    methodology: 'Hexokinase / Glucose Oxidase (GOD-PAP)',
    notes: 'Fasting Blood Sugar (FBS 8-10h fast) or Random Blood Sugar (RBS)',
    isActive: true
  },
  { 
    code: '1033', 
    corporateCode: '1266',
    name: 'SGOT/AST', 
    corporateName: 'ASPARTATE TRANSAMINASE (SGOT)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 170.00,
    corporatePrice: 300.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'IFCC UV without Pyridoxal Phosphate',
    notes: 'Aspartate Aminotransferase (AST) for hepatic & cardiac panel',
    isActive: true
  },
  { 
    code: '1034', 
    corporateCode: '1265',
    name: 'SGPT/ALT', 
    corporateName: 'ALANINE TRANSAMINASE (ALT) SGPT',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 170.00,
    corporatePrice: 300.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'IFCC Kinetic UV Method',
    notes: 'Alanine Aminotransferase (ALT) for specific hepatobiliary assessment',
    isActive: true
  },
  { 
    code: '1044', 
    corporateCode: '1268',
    name: 'SODIUM (NA)', 
    corporateName: 'SODIUM (NA)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 520.00,
    specimenType: 'Serum / Lithium Heparin Plasma',
    turnaroundHours: 4,
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    notes: 'Extracellular fluid electrolyte balance assessment',
    isActive: true
  },
  { 
    code: '1050', 
    corporateCode: '1270',
    name: 'POTASSIUM (K)', 
    corporateName: 'POTASSIUM (K)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 350.00,
    specimenType: 'Non-Hemolyzed Serum',
    turnaroundHours: 4,
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    notes: 'Critical intracellular electrolyte & cardiac conduction check',
    isActive: true
  },
  { 
    code: '1051', 
    name: 'CHLORIDE (CL)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 200.00,
    specimenType: 'Serum / Lithium Heparin Plasma',
    turnaroundHours: 4,
    methodology: 'Ion-Selective Electrode (ISE Direct)',
    notes: 'Anion-cation buffer & hydration state evaluation',
    isActive: true
  },
  { 
    code: '1045', 
    name: 'ELECTROLYTES (NA, K, CL)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 500.00,
    specimenType: 'Serum / Lithium Heparin Plasma',
    turnaroundHours: 4,
    methodology: 'Multiparameter Direct ISE Electrolyte Analyzer',
    notes: 'Comprehensive 3-parameter electrolyte panel',
    isActive: true
  },
  { 
    code: '1043', 
    corporateCode: '1280',
    name: 'HGT (HEMOGLUCOTEST)', 
    corporateName: 'HGT - GLUCOSE',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 150.00,
    corporatePrice: 150.00,
    specimenType: 'Capillary Whole Blood',
    turnaroundHours: 1,
    methodology: 'Electrochemical Biosensor Point-of-Care',
    notes: 'Rapid bedside / clinic glycemic index monitoring (HGT - Glucose)',
    isActive: true
  },
  { 
    code: '1047', 
    corporateCode: '1017',
    name: 'LIPID PROFILE (CHOLESTEROL, TRIGLYCERIDES, HDL, LDL)', 
    corporateName: 'LIPID PROFILE',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 621.00,
    corporatePrice: 860.00,
    specimenType: 'Fasting Serum (10-12 hrs fast)',
    turnaroundHours: 6,
    methodology: 'Enzymatic Colorimetric / Direct Clearance',
    notes: 'Includes Total Cholesterol, Triglycerides, HDL, Direct LDL, VLDL, Risk Ratio',
    isActive: true
  },
  { 
    code: '1066', 
    corporateCode: '1261',
    name: 'HBA1C (GLYCATED HEMOGLOBIN)', 
    corporateName: 'HEMOGLOBIN A1C (HBA1C)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 416.00,
    corporatePrice: 700.00,
    specimenType: 'Whole Blood (K2-EDTA)',
    turnaroundHours: 6,
    methodology: 'High-Performance Liquid Chromatography (HPLC) / Boronate Affinity',
    notes: '3-Month longitudinal glycemic control biomarker (NGSP certified)',
    isActive: true
  },
  { 
    code: '1057', 
    corporateCode: '1271',
    name: 'TOTAL CALCIUM', 
    corporateName: 'CALCIUM (CA)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 550.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Arsenazo III / O-Cresolphthalein Complexone',
    notes: 'Bone metabolism and parathyroid hormone indicator (Calcium Ca)',
    isActive: true
  },
  { 
    code: '1058', 
    name: 'IONIZED CALCIUM', 
    category: 'CLINICAL CHEMISTRY', 
    price: 572.00,
    specimenType: 'Anaerobic Heparinized Whole Blood / Serum',
    turnaroundHours: 4,
    methodology: 'Direct Ion-Selective Electrode (pH corrected)',
    notes: 'Biologically active free calcium fraction',
    isActive: true
  },
  { 
    code: '1059', 
    corporateCode: '1272',
    name: 'MAGNESIUM', 
    corporateName: 'MAGNESIUM (MG)',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 332.80,
    corporatePrice: 670.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Calmagite / Xylidyl Blue Colorimetric',
    notes: 'Neuromuscular and cardiovascular metabolic cofactor (Magnesium Mg)',
    isActive: true
  },
  { 
    code: '1060', 
    corporateCode: '1269',
    name: 'ALBUMIN', 
    corporateName: 'ALBUMIN',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 120.00,
    corporatePrice: 250.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Bromocresol Green (BCG) Dye Binding',
    notes: 'Hepatic synthetic function and nutritional status',
    isActive: true
  },
  { 
    code: '1061', 
    corporateCode: '1267',
    name: 'BILIRUBIN (TOTAL, DIRECT, INDIRECT)', 
    corporateName: 'TOTAL BILIRUBIN TEST',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 169.00,
    corporatePrice: 370.00,
    specimenType: 'Protected Light Serum (SST)',
    turnaroundHours: 6,
    methodology: 'Modified Jendrassik-Grof / DPD Diazonium',
    notes: 'Differential diagnosis of jaundice & hemolytic conditions (Total Bilirubin Test)',
    isActive: true
  },
  { 
    code: '1062', 
    name: 'TOTAL CHOLESTEROL', 
    category: 'CLINICAL CHEMISTRY', 
    price: 200.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'CHOD-PAP Enzymatic Colorimetric',
    notes: 'Cardiovascular risk screening single parameter',
    isActive: true
  },
  { 
    code: '1063', 
    name: 'TOTAL PROTEIN A/G RATIO', 
    category: 'CLINICAL CHEMISTRY', 
    price: 332.80,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Biuret Reaction & BCG Albumin Calculation',
    notes: 'Reports Total Protein, Albumin, Globulin & A/G Ratio',
    isActive: true
  },
  { 
    code: '1064', 
    name: 'INORGANIC PHOSPHORUS', 
    category: 'CLINICAL CHEMISTRY', 
    price: 312.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Phosphomolybdate UV Complex Method',
    notes: 'Renal phosphate handling & mineral homeostasis',
    isActive: true
  },
  { 
    code: '1065', 
    name: 'PSA (PROSTATE SPECIFIC ANTIGEN)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 1014.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Quantitative prostate cancer screening and monitoring biomarker',
    isActive: true
  },
  { 
    code: '1067', 
    name: 'TOTAL PROTEIN', 
    category: 'CLINICAL CHEMISTRY', 
    price: 187.20,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Biuret Colorimetric Reaction',
    notes: 'Serum total protein concentration',
    isActive: true
  },
  { 
    code: '1068', 
    corporateCode: '1275',
    name: 'PREGNANCY TEST (SERUM) (HP)', 
    corporateName: 'PREGNANCY TEST',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 312.00,
    corporatePrice: 250.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 4,
    methodology: 'Quantitative / Semi-Quantitative Beta-hCG CMIA',
    notes: 'High Precision quantitative Beta-hCG pregnancy confirmation',
    isActive: true
  },
  { 
    code: '1069', 
    name: 'AFP (LIVER / ALPHA-FETOPROTEIN)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 650.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Two-Step Chemiluminescent Immunoassay (CMIA)',
    notes: 'Hepatocellular carcinoma & germ cell tumor marker',
    isActive: true
  },
  { 
    code: '1070', 
    name: 'CA 125 (OVARIAN)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 1267.50,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Paramagnetic Microparticle Chemiluminescent Immunoassay',
    notes: 'Ovarian carcinoma monitoring tumor marker',
    isActive: true
  },
  { 
    code: '1071', 
    name: 'CA 15-3 (BREAST)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 1267.50,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Microparticle Enzyme Immunoassay / CMIA',
    notes: 'Breast carcinoma monitoring and surveillance marker',
    isActive: true
  },
  { 
    code: '1072', 
    name: 'CA 19-9 (PANCREATIC)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 1560.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Immunoassay (CMIA)',
    notes: 'Pancreatic and gastrointestinal adenocarcinoma tumor marker',
    isActive: true
  },
  { 
    code: '1073', 
    name: 'CEA (CARCINOEMBRYONIC ANTIGEN)', 
    category: 'CLINICAL CHEMISTRY', 
    price: 832.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Colorectal and general gastrointestinal malignancy marker',
    isActive: true
  },
  { 
    code: '1081', 
    corporateCode: '1008',
    name: 'LIPASE', 
    corporateName: 'LIPASE',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 320.00,
    corporatePrice: 320.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 4,
    methodology: 'Enzymatic Colorimetric Assay',
    notes: 'Pancreatic function biomarker (acute pancreatitis evaluation)',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1082', 
    corporateCode: '1009',
    name: 'AMYLASE', 
    corporateName: 'AMYLASE',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 370.00,
    corporatePrice: 370.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 4,
    methodology: 'Enzymatic Direct Substrate Cleavage',
    notes: 'Serum alpha-amylase pancreatic & salivary enzyme determination',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1005', 
    corporateCode: '1005',
    name: 'LACTIC ACID', 
    corporateName: 'LACTIC ACID',
    category: 'CLINICAL CHEMISTRY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 2280.00,
    corporatePrice: 2280.00,
    specimenType: 'Sodium Fluoride Plasma (Grey Top on Ice)',
    turnaroundHours: 6,
    methodology: 'Lactate Oxidase Enzymatic Amperometric',
    notes: 'Plasma lactate assessment for tissue hypoperfusion & metabolic acidosis',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },

  // =========================================================================
  // SHEET 2: SEND-OUT TESTS & SPECIALTY DIAGNOSTICS (27 EXAMINATIONS)
  // =========================================================================

  // --- HEMATOLOGY SEND-OUT (2) ---
  { 
    code: '1031', 
    name: 'PROTHROMBIN TIME (PT)', 
    category: 'HEMATOLOGY', 
    price: 286.00,
    specimenType: 'Citrated Plasma (Light Blue Top 3.2%)',
    turnaroundHours: 4,
    methodology: 'Optical / Mechanical Clot Detection',
    notes: 'Reports PT seconds, % Activity, and International Normalized Ratio (INR)',
    isActive: true
  },
  { 
    code: '1032', 
    name: 'PARTIAL THROMBOPLASTIN TIME (PTT)', 
    category: 'HEMATOLOGY', 
    price: 377.00,
    specimenType: 'Citrated Plasma (Light Blue Top 3.2%)',
    turnaroundHours: 4,
    methodology: 'Automated Photo-Optical Coagulometry',
    notes: 'Activated partial thromboplastin time for intrinsic pathway evaluation',
    isActive: true
  },

  // --- MICROBIOLOGY SEND-OUT (2) ---
  { 
    code: '6002-S', // Sheet lists "6002" but 6002 is Creatinine — use 6002-S for culture
    name: 'C/S FOR OTHER M.O (SPUTUM)', 
    category: 'MICROBIOLOGY', 
    price: 2288.00,
    specimenType: 'Deep Sputum Specimen',
    turnaroundHours: 72,
    methodology: 'Conventional Culture & Automated ID/AST',
    notes: 'Microbiological isolation and antibiotic susceptibility for sputum flora',
    isActive: true
  },
  { 
    code: '1026', 
    name: 'C/S FOR OTHER M.O (BODY FLUIDS)', 
    category: 'MICROBIOLOGY', 
    price: 2288.00,
    specimenType: 'Pleural / Peritoneal / Synovial Fluid',
    turnaroundHours: 72,
    methodology: 'Automated Broth & Agar Inoculation',
    notes: 'Microbiological culture and sensitivity for sterile body fluids',
    isActive: true
  },

  // --- IMMUNOLOGY / THYROID (5) ---
  { 
    code: '1020', 
    corporateCode: '1273',
    name: 'TSH (THYROID STIMULATING HORMONE)', 
    corporateName: 'THYROID STIMULATING HORMONE (TSH)',
    category: 'IMMUNOLOGY / THYROID', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 494.00,
    corporatePrice: 1000.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Ultrasensitive Chemiluminescent Immunoassay (CMIA)',
    notes: '3rd-generation ultrasensitive thyroid stimulation evaluation',
    isActive: true
  },
  { 
    code: '1133', 
    name: 'FT3 (FREE TRIIODOTHYRONINE)', 
    category: 'IMMUNOLOGY / THYROID', 
    price: 416.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Competitive Chemiluminescent Immunoassay (CMIA)',
    notes: 'Active unbound triiodothyronine hormone assay',
    isActive: true
  },
  { 
    code: '1134', 
    name: 'FT4 (FREE THYROXINE)', 
    category: 'IMMUNOLOGY / THYROID', 
    price: 416.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Competitive Chemiluminescent Immunoassay (CMIA)',
    notes: 'Active unbound thyroxine hormone assay',
    isActive: true
  },
  { 
    code: '1113', 
    corporateCode: '1018',
    name: 'T3 (TOTAL TRIIODOTHYRONINE)', 
    corporateName: 'T3',
    category: 'IMMUNOLOGY / THYROID', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 325.00,
    corporatePrice: 360.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Competitive Enzyme-Linked / CMIA',
    notes: 'Total circulating triiodothyronine fraction',
    isActive: true
  },
  { 
    code: '1114', 
    corporateCode: '1019',
    name: 'T4 (TOTAL THYROXINE)', 
    corporateName: 'T4',
    category: 'IMMUNOLOGY / THYROID', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 325.00,
    corporatePrice: 360.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Competitive Enzyme-Linked / CMIA',
    notes: 'Total circulating thyroxine fraction',
    isActive: true
  },

  // --- OTHERS, STAINS & CYTOLOGY (5) ---
  { 
    code: '1022', 
    name: 'GRAM STAIN', 
    category: 'OTHERS', 
    price: 150.00,
    specimenType: 'Direct Smear / Body Fluid / Swab',
    turnaroundHours: 4,
    methodology: 'Crystal Violet / Safranin Differential Smear Microscopy',
    notes: 'Rapid identification of Gram-positive & Gram-negative bacteria',
    isActive: true
  },
  { 
    code: '1102', 
    name: 'AFB (FOR BODY FLUIDS)', 
    category: 'OTHERS', 
    price: 195.00,
    specimenType: 'Pleural / Peritoneal / CSF / Body Fluid',
    turnaroundHours: 24,
    methodology: 'Concentrated Ziehl-Neelsen AFB Microscopy',
    notes: 'Centrifuged acid-fast bacilli smear examination for extra-pulmonary specimens',
    isActive: true
  },
  { 
    code: '1160', 
    name: 'CELL BLOCK', 
    category: 'OTHERS', 
    price: 1700.00,
    specimenType: 'Centrifuged Body Fluid Pellet',
    turnaroundHours: 48,
    methodology: 'Histopathological Cell Block Preparation & Staining',
    notes: 'Official tariff update: Cell Block + Cell Cytology package rate ₱1,700 (order package code 1162 for combined reporting)',
    isActive: true
  },
  { 
    code: '1161', 
    name: 'CELL CYTOLOGY (BODY FLUID)', 
    category: 'OTHERS', 
    price: 1700.00,
    specimenType: 'Direct Body Fluid / Smear',
    turnaroundHours: 48,
    methodology: 'Papanicolaou & Giemsa Cytological Examination',
    notes: 'Official tariff update: Cell Block + Cell Cytology package rate ₱1,700 (order package code 1162 for combined reporting)',
    isActive: true
  },
  { 
    code: '1162', 
    name: 'CELL BLOCK & CELL CYTOLOGY (PACKAGE)', 
    category: 'OTHERS', 
    price: 1700.00,
    specimenType: 'Direct Body Fluid & Centrifuged Pellet',
    turnaroundHours: 72,
    methodology: 'Combined Cytopathology & Histopathological Cell Block Evaluation',
    notes: 'Convenience package SKU for Cell Block + Cell Cytology at ₱1,700 (sheet lists 1160 & 1161 separately)',
    isActive: true,
    standardScheme: false, // Convenience SKU — sheet lists 1160/1161 individually
  },

  // --- SEROLOGY & HEPATITIS CMIA PANELS (11) ---
  { 
    code: '1056', 
    corporateCode: '1276',
    name: 'HBSAG (RAPID) SCREENING', 
    corporateName: 'HEPATITIS B ANTIGEN TEST',
    category: 'SEROLOGY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 195.00,
    corporatePrice: 400.00,
    specimenType: 'Serum or Plasma',
    turnaroundHours: 2,
    methodology: 'Rapid Lateral Flow Immunochromatography',
    notes: 'Qualitative screening for Hepatitis B Surface Antigen (HBsAg Rapid)',
    isActive: true
  },
  { 
    code: '1104', 
    name: 'HBSAG W/ TITER (CMIA)', 
    category: 'SEROLOGY', 
    price: 221.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Immunoassay (CMIA)',
    notes: 'Quantitative Hepatitis B Surface Antigen concentration & titer',
    isActive: true
  },
  { 
    code: '1105', 
    corporateCode: '1278',
    name: 'ANTI-HBS (CMIA)', 
    corporateName: 'ANTI HBS',
    category: 'SEROLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 234.00,
    corporatePrice: 430.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Quantitative Anti-HBs Chemiluminescent Immunoassay',
    notes: 'Hepatitis B vaccine immunity titer in mIU/mL (>10 mIU/mL protective)',
    isActive: true
  },
  { 
    code: '1106', 
    name: 'HBEAG (CMIA)', 
    category: 'SEROLOGY', 
    price: 364.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Hepatitis B e-Antigen replication & infectivity marker',
    isActive: true
  },
  { 
    code: '1107', 
    name: 'ANTI-HBE (CMIA)', 
    category: 'SEROLOGY', 
    price: 364.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Hepatitis B e-Antibody seroconversion marker',
    isActive: true
  },
  { 
    code: '1109-M', 
    name: 'ANTI-HBC IGM (CMIA)', 
    category: 'SEROLOGY', 
    price: 403.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Acute Hepatitis B infection phase biomarker',
    isActive: true
  },
  { 
    code: '1109', 
    corporateCode: '1287',
    name: 'ANTI-HBC TOTAL (CMIA)', 
    corporateName: 'HEPA HBC TOTAL',
    category: 'SEROLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 403.00,
    corporatePrice: 500.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Competitive Anti-HBc Total Immunoassay (CMIA)',
    notes: 'Indicator of prior or chronic exposure to Hepatitis B virus',
    isActive: true
  },
  { 
    code: '1116', 
    name: 'ANTI-HAV IGM (CMIA)', 
    category: 'SEROLOGY', 
    price: 468.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Acute Hepatitis A Virus infection antibody',
    isActive: true
  },
  { 
    code: '1117', 
    name: 'ANTI-HAV IGG (CMIA)', 
    category: 'SEROLOGY', 
    price: 468.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    notes: 'Hepatitis A Virus immunity & past exposure evaluation',
    isActive: true
  },
  { 
    code: '1112', 
    corporateCode: '1277',
    name: 'ANTI-HCV (CMIA)', 
    corporateName: 'HEPATITIS C ANTIBODY TEST',
    category: 'SEROLOGY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 572.00,
    corporatePrice: 650.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 24,
    methodology: 'Multi-Antigen Recombinant Chemiluminescent Immunoassay',
    notes: 'Screening for exposure to Hepatitis C Virus antibodies',
    isActive: true
  },
  { 
    code: '1004', 
    corporateCode: '1004',
    name: 'HIV RAPID ANTIBODY TEST', 
    corporateName: 'HIV RAPID ANTIBODY TEST',
    category: 'SEROLOGY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 1110.00,
    corporatePrice: 1110.00,
    specimenType: 'Serum / Whole Blood',
    turnaroundHours: 4,
    methodology: 'Rapid 4th Gen Antigen/Antibody Screening',
    notes: 'HIV 1/2 qualitative screening (SACCL Western Blot confirmation required if reactive)',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1281', 
    corporateCode: '1281',
    name: 'HEPATITIS B SCREENING (FOR HIV ONLY)', 
    corporateName: 'HEPATITIS B SCREENING (FOR HIV ONLY)',
    category: 'SEROLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 500.00,
    corporatePrice: 500.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 4,
    methodology: 'High-Sensitivity HBsAg Rapid / Chemiluminescent Panel',
    notes: 'Pre-ART protocol HBV surface antigen baseline screening',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1095', 
    corporateCode: '1015',
    name: 'HEPA PROFILE (A, B, C)', 
    corporateName: 'HEPA PROFILE (A, B, C)',
    category: 'SEROLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 3840.00,
    corporatePrice: 3840.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: 'Multiparameter CMIA Viral Hepatitis Panel',
    notes: 'Comprehensive profile: Anti-HAV IgM, HBsAg, Anti-HBs, Anti-HCV',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1096', 
    corporateCode: '1016',
    name: 'HEPA B FULL PANEL', 
    corporateName: 'HEPA B FULL PANEL',
    category: 'SEROLOGY', 
    corporateCategory: 'OTHER LABORATORY SERVICES',
    price: 2200.00,
    corporatePrice: 2200.00,
    specimenType: 'Serum (SST Gel Separator)',
    turnaroundHours: 6,
    methodology: '5-Parameter CMIA Hepatitis B Suite',
    notes: 'Complete panel: HBsAg, Anti-HBs, HBeAg, Anti-HBe, Anti-HBc Total',
    isActive: true,
    standardScheme: false, // Corporate sheet only
  },
  { 
    code: '1029', 
    corporateCode: '1029',
    name: 'PLATELET COUNT', 
    corporateName: 'PLATELET COUNT',
    category: 'HEMATOLOGY', 
    corporateCategory: 'BLOOD CHEMISTRY',
    price: 200.00,
    corporatePrice: 310.00,
    specimenType: 'Whole Blood (K2-EDTA)',
    turnaroundHours: 2,
    methodology: 'Automated / Phase-Contrast Manual Verification',
    notes: 'Quantitative thrombocyte concentration determination',
    isActive: true,
    standardScheme: false, // Corporate sheet only (CBC already includes platelets on OPD sheet)
  },
];

// Stamp official Corporate HIS sheet membership onto catalog rows
(() => {
  const corporateSheet = new Set(CORPORATE_SHEET_PRODUCT_CODES);
  for (const item of EXAMINATION_CATALOG) {
    item.corporateScheme = corporateSheet.has(item.code);
  }
})();

export const isCorporateItem = (item: ExaminationItem): boolean => {
  if (typeof item.corporatePrice === 'number' && item.corporatePrice > 0) {
    return true;
  }
  if (item.corporateCategory || item.corporateCode) {
    return true;
  }
  const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code || d.name === item.name);
  return typeof defaultMatch?.corporatePrice === 'number' && defaultMatch.corporatePrice > 0;
};

/**
 * Pricing rules:
 * - Corporate → corporatePrice (when available)
 * - OPD, PhilHealth, Indigent, Pre-Employment/Employee, Employee, Projects → standard `price`
 */
export const getExaminationPrice = (
  item: ExaminationItem,
  patientCategory?: PatientCategory | string
): number => {
  if (patientCategory === 'Corporate') {
    if (typeof item.corporatePrice === 'number' && item.corporatePrice > 0) {
      return item.corporatePrice;
    }
    const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code || d.name === item.name);
    if (defaultMatch && typeof defaultMatch.corporatePrice === 'number' && defaultMatch.corporatePrice > 0) {
      return defaultMatch.corporatePrice;
    }
  }
  // OPD / PhilHealth / Indigent / Pre-Employment / Employee / Projects
  return item.price;
};

export const getExaminationCode = (
  item: ExaminationItem,
  patientCategory?: PatientCategory | string
): string => {
  if (patientCategory === 'Corporate') {
    if (item.corporateCode) {
      return item.corporateCode;
    }
    const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code || d.name === item.name);
    if (defaultMatch?.corporateCode) {
      return defaultMatch.corporateCode;
    }
  }
  return item.code;
};

export const getExaminationCategory = (
  item: ExaminationItem,
  patientCategory?: PatientCategory | string
): string => {
  if (patientCategory === 'Corporate') {
    if (item.corporateCategory) {
      return item.corporateCategory;
    }
    const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code || d.name === item.name);
    if (defaultMatch?.corporateCategory) {
      return defaultMatch.corporateCategory;
    }
    if (item.category === 'CLINICAL CHEMISTRY' || item.category === 'HEMATOLOGY' || item.category === 'CLINICAL MICROSCOPY') {
      return 'BLOOD CHEMISTRY';
    }
    return 'OTHER LABORATORY SERVICES';
  }
  return item.category;
};

export const getExaminationName = (
  item: ExaminationItem,
  patientCategory?: PatientCategory | string
): string => {
  if (patientCategory === 'Corporate') {
    if (item.corporateName) {
      return item.corporateName;
    }
    const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code || d.name === item.name);
    if (defaultMatch?.corporateName) {
      return defaultMatch.corporateName;
    }
  }
  return item.name;
};

export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const DEFAULT_SEND_OUT_PLATFORMS: string[] = [
  'Hi-Precision Diagnostics',
  'Research Institute for Tropical Medicine (RITM)',
  'National Kidney and Transplant Institute (NKTI)',
  'Philippine General Hospital (PGH)',
  'St. Luke\'s Medical Center',
  'Lung Center of the Philippines',
  'External Partner Reference Lab',
];

const isFecalysisSheet2 = (item: Partial<ExaminationItem>): boolean => {
  return item.code === '1021-M' || (item.name || '').toUpperCase().includes('FECALYSIS (SHEET 2)');
};

const LOCAL_STORAGE_CATALOG_KEY = 'lims_examination_catalog_v24';
const LEGACY_CATALOG_KEYS = [
  'lims_examination_catalog_v23',
  'lims_examination_catalog_v22',
  'lims_examination_catalog_v21',
  'lims_examination_catalog_v20',
  'lims_examination_catalog_v19',
  'lims_examination_catalog_v18',
  'lims_examination_catalog_v17',
  'lims_examination_catalog_v16',
  'lims_examination_catalog_v15',
  'lims_examination_catalog_v14',
  'lims_examination_catalog_v13',
  'lims_examination_catalog_v12',
  'lims_examination_catalog_v11',
  'lims_examination_catalog_v10',
] as const;

/** Prefer the user's saved form assignment; never let defaults silently overwrite it. */
function resolveStoredFormFields(
  item: ExaminationItem,
  defaultMatch?: ExaminationItem
): Pick<ExaminationItem, 'assignedForm' | 'sendOutPlatform'> {
  const mergedForDefault = { ...defaultMatch, ...item, assignedForm: undefined, sendOutPlatform: undefined };
  const legacy = legacyDepartmentForm(mergedForDefault);
  const official = getDefaultAssignedForm(mergedForDefault);
  const stored = item.assignedForm ?? defaultMatch?.assignedForm;
  // A saved value that is only the old department number is corrected to the official paper.
  // A value the user chose, different from that automatic number, is kept.
  let assignedForm: AssignedFormType = !stored || stored === legacy ? official : stored;
  // Unassigned was the automatic placeholder for exams with no paper. These are send-out.
  if (
    SEND_OUT_EXAM_CODES.has((item.code || '').trim()) &&
    (!stored || stored === 'Unassigned' || stored === legacy)
  ) {
    assignedForm = 'Send Out';
  }

  const examName = (item.name || defaultMatch?.name || '').toUpperCase();
  const tbFormCodes = new Set(['1037', '1087', '1038']);
  if (tbFormCodes.has(item.code) && (!item.assignedForm || item.assignedForm === 'Form 5')) {
    assignedForm = 'Form 9';
  }
  const legacyTumorMarker =
    examName.includes('PSA') ||
    examName.includes('CA 125') ||
    examName.includes('CA 15-3') ||
    examName.includes('CA 19-9') ||
    examName.includes('CEA') ||
    examName.includes('TROPONIN');
  if (legacyTumorMarker && (assignedForm === 'Form 9' || assignedForm === 'Form 10')) {
    assignedForm = 'Unassigned';
  }

  if (assignedForm === 'Send Out') {
    return {
      assignedForm,
      sendOutPlatform:
        item.sendOutPlatform ||
        defaultMatch?.sendOutPlatform ||
        'Hi-Precision Diagnostics',
    };
  }

  return {
    assignedForm,
    sendOutPlatform: undefined,
  };
}

/**
 * Merge stored catalog with official baseline tariff.
 * Always refreshes standard `price` (OPD/PhilHealth/Indigent/Employee/Projects)
 * from EXAMINATION_CATALOG while preserving user form / send-out assignments.
 */
function normalizeStoredCatalog(parsed: ExaminationItem[]): ExaminationItem[] {
  const existingCodes = new Set(parsed.map((item) => item.code));
  const cleanParsed = parsed
    .filter((item) => !isFecalysisSheet2(item) && item.code !== '1114-R')
    .map((item) => {
      const defaultMatch = EXAMINATION_CATALOG.find((d) => d.code === item.code);
      const formFields = resolveStoredFormFields(item, defaultMatch);
      return {
        ...item,
        // Official names & standard tariff from baseline sheets (do not invent new names)
        name: defaultMatch ? defaultMatch.name : item.name,
        category: defaultMatch ? defaultMatch.category : item.category,
        price: defaultMatch ? defaultMatch.price : item.price,
        specimenType: defaultMatch?.specimenType ?? item.specimenType,
        turnaroundHours: defaultMatch?.turnaroundHours ?? item.turnaroundHours,
        methodology: defaultMatch?.methodology ?? item.methodology,
        notes: defaultMatch ? defaultMatch.notes : item.notes,
        isActive: defaultMatch ? defaultMatch.isActive : item.isActive,
        standardScheme: defaultMatch ? defaultMatch.standardScheme : item.standardScheme,
        corporateScheme: defaultMatch
          ? defaultMatch.corporateScheme
          : CORPORATE_SHEET_PRODUCT_CODES.includes(item.code),
        corporateName: defaultMatch ? defaultMatch.corporateName : item.corporateName,
        corporatePrice: defaultMatch ? defaultMatch.corporatePrice : item.corporatePrice,
        corporateCode: defaultMatch ? defaultMatch.corporateCode : item.corporateCode,
        corporateCategory: defaultMatch ? defaultMatch.corporateCategory : item.corporateCategory,
        ...formFields,
      };
    });

  const missingDefaults = EXAMINATION_CATALOG
    .filter((d) => !existingCodes.has(d.code) && !isFecalysisSheet2(d) && d.code !== '1114-R')
    .map((d) => {
      const formFields = resolveStoredFormFields(d, d);
      return { ...d, ...formFields };
    });

  return [...cleanParsed, ...missingDefaults];
}

/** Apply official sheet prices onto a live catalog list while keeping form assignments. */
export function applyOfficialTariffPrices(items: ExaminationItem[]): ExaminationItem[] {
  return normalizeStoredCatalog(items);
}

export const loadStoredExaminations = (): ExaminationItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CATALOG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const combined = normalizeStoredCatalog(parsed);
        // Keep storage in sync when new baseline exams are merged in
        localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(combined));
        return combined;
      }
    }

    // Migrate any legacy catalog version (preserves assignedForm / sendOutPlatform)
    for (const legacyKey of LEGACY_CATALOG_KEYS) {
      const prevData = localStorage.getItem(legacyKey);
      if (!prevData) continue;
      const parsed = JSON.parse(prevData);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      const combined = normalizeStoredCatalog(parsed);
      localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(combined));
      return combined;
    }
  } catch (err) {
    console.warn('Error loading examinations from localStorage:', err);
  }

  return EXAMINATION_CATALOG
    .filter((item) => !isFecalysisSheet2(item) && item.code !== '1114-R')
    .map((item) => {
      const formFields = resolveStoredFormFields(item, item);
      return { ...item, ...formFields };
    });
};

/** True when the examination is referred out and has no in-house result paper. */
export function isSendOutExamination(examName?: string | null, examCode?: string | null): boolean {
  const item = findCatalogExamination(examName) || findCatalogExamination(examCode);
  if (!item) return SEND_OUT_EXAM_CODES.has((examCode || '').trim());
  return (item.assignedForm || getDefaultAssignedForm(item)) === 'Send Out';
}

/** Look up a catalog exam by code or name, preferring the user's saved list. */
export function findCatalogExamination(codeOrName?: string | null): ExaminationItem | undefined {
  const raw = (codeOrName || '').trim();
  if (!raw) return undefined;
  const catalog = loadStoredExaminations();
  const clean = raw.toUpperCase();
  const byCode = catalog.find(
    (e) =>
      e.code.toUpperCase() === clean ||
      (e.corporateCode || '').toUpperCase() === clean
  );
  if (byCode) return byCode;
  const byExact = catalog.find(
    (e) =>
      e.name.toUpperCase() === clean ||
      (e.corporateName || '').toUpperCase() === clean
  );
  if (byExact) return byExact;
  let best: ExaminationItem | undefined;
  let score = 0;
  for (const item of catalog) {
    const name = (item.name || '').toUpperCase();
    if (name && clean.includes(name) && name.length > score) {
      best = item;
      score = name.length;
    }
  }
  return best;
}

export const saveStoredExaminations = (items: ExaminationItem[]): boolean => {
  try {
    // Always persist explicit form fields so reload never falls back to defaults
    const toStore = items.map((item) => {
      const formFields = resolveStoredFormFields(item);
      return { ...item, ...formFields };
    });
    localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(toStore));
    return true;
  } catch (err) {
    console.warn('Error saving examinations to localStorage:', err);
    return false;
  }
};

