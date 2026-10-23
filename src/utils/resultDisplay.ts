import type { ResultFormAnalyteRow } from '../data/resultFormsCatalog';

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
