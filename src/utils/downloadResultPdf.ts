import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { prepareHtml2CanvasClone } from './html2canvasOklchCompat';
import {
  OFFICIAL_COA_PAPER_WIDTH_PX,
  pdfPageFormatForSheet,
  type OfficialPdfPageFormat,
} from '../constants/officialCoaPaper';

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 120);
}

export type PdfSaveTarget =
  | { kind: 'picker'; handle: FileSystemFileHandle }
  | { kind: 'download'; fileName: string };

const PDF_EXPORT_CLASS = 'pdf-exporting';
const CAPTURE_ROOT_ID = 'lims-pdf-capture-root';
const MIN_PDF_BYTES = 1200;

export function getOrCreatePdfCaptureRoot(): HTMLElement {
  let el = document.getElementById(CAPTURE_ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CAPTURE_ROOT_ID;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

/** Save picker when available; otherwise a direct browser download. */
export async function resolvePdfSaveTarget(fileName: string): Promise<PdfSaveTarget> {
  const picked = await requestPdfSaveTarget(fileName);
  if (picked) return picked;
  const safe = sanitizeFileName(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  return { kind: 'download', fileName: safe };
}

export async function requestPdfSaveTarget(fileName: string): Promise<PdfSaveTarget | null> {
  const safe = sanitizeFileName(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  const w = window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>;
  };

  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: safe,
        types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
      });
      return { kind: 'picker', handle };
    } catch {
      return null;
    }
  }

  return { kind: 'download', fileName: safe };
}

async function awaitDocumentReady(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

async function captureSheetCanvas(sheet: HTMLElement): Promise<HTMLCanvasElement> {
  await awaitDocumentReady();
  const w = Math.max(sheet.scrollWidth, sheet.offsetWidth, OFFICIAL_COA_PAPER_WIDTH_PX);
  const h = Math.max(sheet.scrollHeight, sheet.offsetHeight, 200);
  const scale = Math.min(2, Math.max(1, 16384 / Math.max(h, w, 1)));

  const canvas = await html2canvas(sheet, {
    scale,
    useCORS: true,
    allowTaint: true,
    foreignObjectRendering: false,
    logging: false,
    backgroundColor: '#ffffff',
    width: w,
    height: h,
    windowWidth: w,
    windowHeight: h,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 15000,
    onclone: (clonedDoc, clonedSheet) => {
      clonedDoc.body.classList.add(PDF_EXPORT_CLASS);
      prepareHtml2CanvasClone(clonedDoc, sheet, clonedSheet);
    },
  });

  if (canvas.width < 2 || canvas.height < 2) {
    throw new Error('PDF capture produced an empty canvas');
  }

  return canvas;
}

function appendCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  pageFormat: OfficialPdfPageFormat,
  docAlreadyHasContent: boolean
): boolean {
  const margin = 8;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  const pxPerPage = Math.max(1, Math.floor((contentH * canvas.width) / contentW));

  let y = 0;
  let slice = 0;
  let placed = docAlreadyHasContent;
  while (y < canvas.height) {
    const sliceH = Math.min(pxPerPage, canvas.height - y);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create PDF slice canvas');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
    const drawH = (sliceH * contentW) / canvas.width;

    if (placed || slice > 0) {
      pdf.addPage(pageFormat, 'p');
    }
    pdf.addImage(imgData, 'JPEG', margin, margin, contentW, Math.min(drawH, contentH));

    y += sliceH;
    slice += 1;
    placed = true;
  }
  return placed;
}

/** Build PDF bytes in memory — call before opening the system save dialog. */
export async function buildPdfBlobFromSheets(sheets: HTMLElement[]): Promise<Blob> {
  if (!sheets.length) {
    throw new Error('No result form sheets to export');
  }

  let pdf: jsPDF | null = null;
  let docHasContent = false;

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const pageFormat = pdfPageFormatForSheet(sheet);
    if (!pdf) {
      pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageFormat });
    }
    const canvas = await captureSheetCanvas(sheet);
    docHasContent = appendCanvasToPdf(pdf, canvas, pageFormat, docHasContent);
  }

  if (!pdf) {
    throw new Error('No result form sheets to export');
  }

  const blob = pdf.output('blob') as Blob;
  if (!blob || blob.size < MIN_PDF_BYTES) {
    throw new Error(`PDF generation failed (output ${blob?.size ?? 0} bytes)`);
  }
  return blob;
}

export async function savePdfBlob(blob: Blob, target: PdfSaveTarget): Promise<void> {
  if (!blob || blob.size < MIN_PDF_BYTES) {
    throw new Error(`Refusing to save empty PDF (${blob?.size ?? 0} bytes)`);
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (target.kind === 'picker') {
    const writable = await target.handle.createWritable();
    try {
      await writable.write(bytes);
    } finally {
      await writable.close();
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = target.fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Capture sheets and save (build first, then write). */
export async function downloadSheetsAsPdf(
  sheets: HTMLElement[],
  target: PdfSaveTarget
): Promise<void> {
  const blob = await buildPdfBlobFromSheets(sheets);
  await savePdfBlob(blob, target);
}

function awaitPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function withVisibleForCapture<T>(
  element: HTMLElement,
  run: () => Promise<T>
): Promise<T> {
  const host = getOrCreatePdfCaptureRoot();
  document.body.classList.add(PDF_EXPORT_CLASS);

  const parent = element.parentNode;
  const next = element.nextSibling;

  const prevHostStyle = host.style.cssText;
  const prevElementStyle = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    width: element.style.width,
    display: element.style.display,
    visibility: element.style.visibility,
    opacity: element.style.opacity,
    overflow: element.style.overflow,
    background: element.style.background,
    pointerEvents: element.style.pointerEvents,
  };

  host.replaceChildren(element);
  host.style.cssText =
    `position:fixed;left:0;top:0;width:${OFFICIAL_COA_PAPER_WIDTH_PX}px;max-width:100vw;z-index:2147483647;background:#ffffff;opacity:1;pointer-events:none;overflow:visible;`;

  element.style.position = 'relative';
  element.style.left = '0';
  element.style.top = '0';
  element.style.width = `${OFFICIAL_COA_PAPER_WIDTH_PX}px`;
  element.style.display = 'block';
  element.style.visibility = 'visible';
  element.style.opacity = '1';
  element.style.overflow = 'visible';
  element.style.background = '#ffffff';
  element.style.pointerEvents = 'none';

  return (async () => {
    await awaitPaint();
    try {
      return await run();
    } finally {
      if (parent) {
        if (next && next.parentNode === parent) parent.insertBefore(element, next);
        else parent.appendChild(element);
      }
      host.replaceChildren();
      host.style.cssText = prevHostStyle;
      element.style.position = prevElementStyle.position;
      element.style.left = prevElementStyle.left;
      element.style.top = prevElementStyle.top;
      element.style.width = prevElementStyle.width;
      element.style.display = prevElementStyle.display;
      element.style.visibility = prevElementStyle.visibility;
      element.style.opacity = prevElementStyle.opacity;
      element.style.overflow = prevElementStyle.overflow;
      element.style.background = prevElementStyle.background;
      element.style.pointerEvents = prevElementStyle.pointerEvents;
      document.body.classList.remove(PDF_EXPORT_CLASS);
    }
  })();
}

export async function awaitPdfCaptureReady(
  getRoot: () => HTMLElement | null,
  maxFrames = 45
): Promise<HTMLElement | null> {
  for (let i = 0; i < maxFrames; i++) {
    const root = getRoot();
    if (root?.querySelector('.coa-result-sheet')) return root;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return getRoot();
}
