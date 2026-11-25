/** Content width for Form 2a / RF-10 — Legal page width minus ~10mm side margins (96dpi). */
export const OFFICIAL_COA_PAPER_WIDTH_PX = 738;

/** CSS width for RF-10 screen/print frame (≈ same as {@link OFFICIAL_COA_PAPER_WIDTH_PX}). */
export const OFFICIAL_COA_PAPER_WIDTH_PRINT = '195.9mm';

/** Full A4 sheet width at 96 CSS px/in (210mm). */
export const STANDARD_RESULT_PAPER_WIDTH_PX = 794;

/** CSS width for RF-01…RF-09 screen preview. */
export const STANDARD_RESULT_PAPER_WIDTH_PRINT = '210mm';

export const STANDARD_RESULT_PAPER_MIN_HEIGHT_PRINT = '297mm';

/** jsPDF page format for RF-10 Form 2a only (8.5″ × 14″). Other result forms stay A4. */
export const NTP_RF10_PDF_PAGE_FORMAT = 'legal' as const;

export const STANDARD_RESULT_PDF_PAGE_FORMAT = 'a4' as const;

export type OfficialPdfPageFormat =
  | typeof NTP_RF10_PDF_PAGE_FORMAT
  | typeof STANDARD_RESULT_PDF_PAGE_FORMAT;

export function isLegalResultFormId(formId?: string | null): boolean {
  return formId === 'RF-10';
}

export function pdfPageFormatForSheet(sheet: HTMLElement): OfficialPdfPageFormat {
  return sheet.classList.contains('coa-result-sheet--legal')
    ? NTP_RF10_PDF_PAGE_FORMAT
    : STANDARD_RESULT_PDF_PAGE_FORMAT;
}