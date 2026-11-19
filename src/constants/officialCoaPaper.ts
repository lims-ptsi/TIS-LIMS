/** Content width for Form 2a / official CoA — Legal page width minus ~10mm side margins (96dpi). */
export const OFFICIAL_COA_PAPER_WIDTH_PX = 738;

/** CSS width for @media print (≈ same as {@link OFFICIAL_COA_PAPER_WIDTH_PX}). */
export const OFFICIAL_COA_PAPER_WIDTH_PRINT = '195.9mm';

/** jsPDF page format for RF-10 Form 2a only (8.5″ × 14″). Other result forms stay A4. */
export const NTP_RF10_PDF_PAGE_FORMAT = 'legal' as const;

export const STANDARD_RESULT_PDF_PAGE_FORMAT = 'a4' as const;

export type OfficialPdfPageFormat =
  | typeof NTP_RF10_PDF_PAGE_FORMAT
  | typeof STANDARD_RESULT_PDF_PAGE_FORMAT;

export function pdfPageFormatForSheet(sheet: HTMLElement): OfficialPdfPageFormat {
  return sheet.classList.contains('ntp-official-result-form')
    ? NTP_RF10_PDF_PAGE_FORMAT
    : STANDARD_RESULT_PDF_PAGE_FORMAT;
}