import type { ResultFormAnalyteRow, ResultFormSection } from '../data/resultFormsCatalog';

/** RF-09 drug susceptibility parameter ids */
export const TB_DST_PARAM_IDS = ['p_dst_inh', 'p_dst_rif', 'p_dst_emb', 'p_dst_sm'] as const;

export function isTbCultureNoGrowth(cultureResult: unknown): boolean {
  return /no growth/i.test(String(cultureResult ?? '').trim());
}

/** Matches RF-09 / catalog option "Positive for M.tuberculosis". */
export function isTbCulturePositive(cultureResult: unknown): boolean {
  return /positive\s+for\s+m\.?\s*tuberculosis/i.test(String(cultureResult ?? '').trim());
}

/** RF-09: DST only when culture is explicitly positive (isolate available). */
export function isResultFormSectionApplicable(
  section: Pick<ResultFormSection, 'id'>,
  readValue: (paramId: string) => string
): boolean {
  if (section.id === 'dst') {
    return isTbCulturePositive(readValue('p_tb_culture'));
  }
  return true;
}

/** True when a result field has any non-empty value (examined / entered). */
export function hasEnteredResult(value: unknown): boolean {
  return String(value ?? '').trim() !== '';
}

export function resultFormRowExamChoiceKey(row: ResultFormAnalyteRow): string {
  return row.examChoiceId || `${row.id}_exam`;
}

/** Row counts as examined when result and/or examination method is filled. */
export function isResultFormRowExamined(
  row: ResultFormAnalyteRow,
  readValue: (paramId: string) => string
): boolean {
  if (hasEnteredResult(readValue(row.id))) return true;
  if (row.examOptions && hasEnteredResult(readValue(resultFormRowExamChoiceKey(row)))) {
    return true;
  }
  return false;
}

/** Hide form rows tied to exams not on this panel / tab. */
export function resultFormRowAppliesToExamCodes(
  row: ResultFormAnalyteRow,
  examCodes: Iterable<string>
): boolean {
  if (!row.examCode) return true;
  for (const code of examCodes) {
    if (code === row.examCode) return true;
  }
  return false;
}

const RF09_EXAM_CODES = new Set(['1037', '1038', '1087']);

/**
 * Shared RF-09 panel: culture row is catalog-tagged 1037 but also applies to 1038;
 * DST rows apply when DST or culture+DST is on the order.
 */
export function resultFormRowAppliesToPanel(
  row: ResultFormAnalyteRow,
  panelExamCodes: string[],
  formId?: string
): boolean {
  if (resultFormRowAppliesToExamCodes(row, panelExamCodes)) return true;
  if (formId !== 'RF-09' || !row.examCode || !RF09_EXAM_CODES.has(row.examCode)) return false;

  const panelHasTb = panelExamCodes.some((c) => RF09_EXAM_CODES.has(c));
  if (!panelHasTb) return false;

  if (row.id === 'p_tb_culture') {
    return panelExamCodes.some((c) => c === '1037' || c === '1038' || c === '1087');
  }
  if (row.id.startsWith('p_dst_')) {
    return panelExamCodes.some((c) => c === '1087' || c === '1038');
  }
  return false;
}

/** RF-09 culture line is always shown for entry (DST still gated separately). */
export function isRf09CultureEntryRow(formId: string | undefined, row: ResultFormAnalyteRow): boolean {
  return formId === 'RF-09' && row.id === 'p_tb_culture';
}
