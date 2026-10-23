import {
  EXAMINATION_CATALOG,
  ExaminationItem,
  getExaminationName,
} from '../data/examinationCatalog';
import { examinationList } from '../data/requestDesk';
import { LabTestRequisition, PatientCategory, Sample } from '../types/lims';

export interface SpecimenLine {
  examinationNames: string[];
  sampleType: Sample['sampleType'];
  matrix: string;
  tubes: number;
}

export interface AccessionSpecimenPlan {
  lines: SpecimenLine[];
  tubeCount: number;
  primarySampleType: Sample['sampleType'];
  primaryMatrix: string;
  multipleContainers: boolean;
}

function matchExamination(
  catalog: ExaminationItem[],
  examName: string,
  category?: PatientCategory
): ExaminationItem | undefined {
  const clean = examName.trim().toUpperCase();
  const exact = catalog.find((item) => {
    const std = item.name.trim().toUpperCase();
    const corp = (item.corporateName || '').trim().toUpperCase();
    return std === clean || corp === clean;
  });
  if (exact) return exact;

  return catalog
    .filter((item) => {
      const std = getExaminationName(item, category).trim().toUpperCase();
      const corp = (item.corporateName || item.name).trim().toUpperCase();
      return clean.includes(std) || std.includes(clean) || clean.includes(corp) || corp.includes(clean);
    })
    .sort((a, b) => b.name.length - a.name.length)[0];
}

function mapSpecimenTypeToAccession(specimenType: string): {
  sampleType: Sample['sampleType'];
  matrix: string;
} {
  const matrix = specimenType.trim() || 'As directed by laboratory SOP';
  const lower = matrix.toLowerCase();

  if (lower.includes('urine')) {
    return { sampleType: 'Urine', matrix };
  }
  if (lower.includes('water') && !lower.includes('whole blood')) {
    return { sampleType: 'Drinking Water', matrix };
  }
  if (
    lower.includes('serum') ||
    lower.includes('sst') ||
    (lower.includes('clotted') && !lower.includes('whole blood'))
  ) {
    return { sampleType: 'Serum', matrix };
  }
  if (lower.includes('plasma') || lower.includes('heparin') || lower.includes('fluoride')) {
    return { sampleType: 'Plasma', matrix };
  }
  if (
    lower.includes('stool') ||
    lower.includes('fecal') ||
    lower.includes('sputum') ||
    lower.includes('scraping') ||
    lower.includes('swab') ||
    lower.includes('tissue') ||
    lower.includes('biopsy')
  ) {
    return { sampleType: 'Biopsy Tissue', matrix };
  }
  if (lower.includes('blood') || lower.includes('edta') || lower.includes('citrate') || lower.includes('capillary')) {
    return { sampleType: 'Whole Blood', matrix };
  }
  return { sampleType: 'Whole Blood', matrix };
}

function fallbackFromExamName(examName: string): { sampleType: Sample['sampleType']; matrix: string } {
  const tests = examName.toLowerCase();
  if (tests.includes('urinalysis') || tests.includes('urine')) {
    return { sampleType: 'Urine', matrix: 'Clean-Catch Midstream Urine' };
  }
  if (tests.includes('fecalysis') || tests.includes('stool') || tests.includes('fecal') || tests.includes('occult blood')) {
    return { sampleType: 'Biopsy Tissue', matrix: 'Fresh Stool Specimen' };
  }
  if (
    tests.includes('metabolic') ||
    tests.includes('lipid') ||
    tests.includes('glucose') ||
    tests.includes('chem') ||
    tests.includes('serum')
  ) {
    return { sampleType: 'Serum', matrix: 'Serum (SST Gel Separator)' };
  }
  if (tests.includes('blood typing') || tests.includes('abo') || tests.includes('cbc') || tests.includes('hemoglobin')) {
    return { sampleType: 'Whole Blood', matrix: 'Whole Blood (K2-EDTA)' };
  }
  if (tests.includes('esr') || tests.includes('coag') || tests.includes('citrate')) {
    return { sampleType: 'Whole Blood', matrix: 'Sodium Citrate Whole Blood (1:4)' };
  }
  return { sampleType: 'Whole Blood', matrix: 'K2-EDTA Anticoagulated Whole Blood' };
}

function lineKey(sampleType: Sample['sampleType'], matrix: string): string {
  return `${sampleType}::${matrix.trim().toUpperCase()}`;
}

export function buildAccessionSpecimenPlan(
  req: LabTestRequisition,
  catalog: ExaminationItem[] = EXAMINATION_CATALOG
): AccessionSpecimenPlan {
  const category = req.patientCategory;
  const examNames = examinationList(req);
  const rawLines: SpecimenLine[] = [];

  for (const name of examNames) {
    const item = matchExamination(catalog, name, category);
    const mapped = item?.specimenType
      ? mapSpecimenTypeToAccession(item.specimenType)
      : fallbackFromExamName(name);
    rawLines.push({
      examinationNames: [name],
      sampleType: mapped.sampleType,
      matrix: mapped.matrix,
      tubes: 1,
    });
  }

  if (!rawLines.length) {
    const mapped = fallbackFromExamName('');
    rawLines.push({
      examinationNames: ['(No examinations listed)'],
      sampleType: mapped.sampleType,
      matrix: mapped.matrix,
      tubes: req.tubeCount || 1,
    });
  }

  const merged = new Map<string, SpecimenLine>();
  for (const line of rawLines) {
    const key = lineKey(line.sampleType, line.matrix);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...line });
    } else {
      existing.examinationNames.push(...line.examinationNames);
      existing.tubes += 1;
    }
  }

  const lines = [...merged.values()];
  const tubeCount = Math.max(req.tubeCount || 0, lines.reduce((sum, l) => sum + l.tubes, 0), 1);
  const bloodFirst =
    lines.find((l) => l.sampleType === 'Whole Blood' || l.sampleType === 'Plasma' || l.sampleType === 'Serum') ||
    lines[0];

  return {
    lines,
    tubeCount,
    primarySampleType: bloodFirst.sampleType,
    primaryMatrix: bloodFirst.matrix,
    multipleContainers: lines.length > 1,
  };
}

export function inferAccessionDefaultsFromPlan(plan: AccessionSpecimenPlan, req: LabTestRequisition) {
  return {
    sampleType: plan.primarySampleType,
    matrix: plan.primaryMatrix,
    tubeCount: plan.tubeCount,
    priority: req.priority || ('ROUTINE' as const),
    notes: req.clinicalNotes || '',
    orNumber: req.orNumber,
  };
}
