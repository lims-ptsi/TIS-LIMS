import { mirrorComputedStyles } from './html2canvasOklchCompat';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';

export type PaperKind = 'legal' | 'a4';

/** Equal inset on every edge so the left and right margins match. */
function paperInches(paper: PaperKind): { w: number; h: number; margin: number } {
  return paper === 'legal'
    ? { w: 8.5, h: 14, margin: 0.22 }
    : { w: 8.27, h: 11.69, margin: 0.22 };
}

function pageRule(paper: PaperKind): string {
  const p = paperInches(paper);
  return `size: ${p.w}in ${p.h}in; margin: ${p.margin}in ${p.margin}in ${p.margin}in ${p.margin}in;`;
}

/** Printable box inside the equal page margins (96 CSS px per inch). */
function contentBoxPx(paper: PaperKind): { w: number; h: number } {
  const p = paperInches(paper);
  return {
    w: Math.floor((p.w - p.margin * 2) * 96),
    h: Math.floor((p.h - p.margin * 2) * 96),
  };
}

function syncControls(live: HTMLElement, clone: HTMLElement): void {
  const liveNodes = live.querySelectorAll('input, textarea, select');
  const cloneNodes = clone.querySelectorAll('input, textarea, select');
  liveNodes.forEach((node, i) => {
    const copy = cloneNodes[i];
    if (node instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
      copy.checked = node.checked;
      copy.value = node.value;
      if (node.checked) copy.setAttribute('checked', '');
      else copy.removeAttribute('checked');
    } else if (node instanceof HTMLTextAreaElement && copy instanceof HTMLTextAreaElement) {
      copy.value = node.value;
      copy.textContent = node.value;
    } else if (node instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) {
      copy.value = node.value;
    }
  });
}

function bakeCanvases(live: HTMLElement, clone: HTMLElement): void {
  const liveCanvases = [...live.querySelectorAll('canvas')];
  const cloneCanvases = [...clone.querySelectorAll('canvas')];
  liveCanvases.forEach((canvas, i) => {
    const target = cloneCanvases[i];
    if (!target?.parentNode) return;
    const img = document.createElement('img');
    try {
      img.src = canvas.toDataURL('image/png');
    } catch {
      return;
    }
    img.alt = '';
    const cs = getComputedStyle(canvas);
    img.style.width = cs.width;
    img.style.height = cs.height;
    img.style.display = cs.display === 'inline' ? 'inline-block' : cs.display;
    target.replaceWith(img);
  });
}

function revealInactiveSheets(root: HTMLElement): () => void {
  const hidden = [...root.querySelectorAll<HTMLElement>('.coa-official-sheet--inactive')];
  const prev = hidden.map((el) => el.style.display);
  hidden.forEach((el) => {
    el.style.display = 'block';
  });
  root.getBoundingClientRect();
  return () => {
    hidden.forEach((el, i) => {
      el.style.display = prev[i] || '';
    });
  };
}

/**
 * Print a frozen copy of the on-screen form.
 * Chrome's window.print() on the app scales the whole viewport, so the dialog
 * does not match the drawer. This opens a document that contains only the form.
 */
export function printScreenPreview(source: HTMLElement, paper: PaperKind): void {
  const restore = revealInactiveSheets(source);
  const width = Math.max(source.offsetWidth, 640);
  const clone = source.cloneNode(true) as HTMLElement;
  try {
    syncControls(source, clone);
    mirrorComputedStyles(source, clone);
    bakeCanvases(source, clone);
    clone.querySelectorAll<HTMLElement>('.text-red-600, .lims-ntp-result-select--alert').forEach((el) => {
      el.style.color = '#dc2626';
      el.style.setProperty('-webkit-text-fill-color', '#dc2626');
    });
    clone.querySelectorAll<HTMLElement>('.text-red-700').forEach((el) => {
      el.style.color = '#b91c1c';
      el.style.setProperty('-webkit-text-fill-color', '#b91c1c');
    });
  } finally {
    restore();
  }

  clone.querySelectorAll<HTMLElement>('.coa-official-sheet--inactive').forEach((el) => {
    el.style.display = 'block';
    el.style.visibility = 'visible';
  });
  clone.style.width = `${width}px`;
  clone.style.maxWidth = 'none';
  clone.style.minHeight = '0';
  clone.style.margin = '0';
  clone.style.marginLeft = '0';
  clone.style.marginRight = '0';
  clone.style.paddingLeft = '0';
  clone.style.paddingRight = '0';
  clone.style.left = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.background = '#ffffff';

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Official result form print');
  const boxForFrame = contentBoxPx(paper);
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${boxForFrame.w}px;height:${boxForFrame.h}px;border:0;background:#fff;`;
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official Result Form</title>
  <link rel="stylesheet" href="${FONT_HREF}" />
  <style>
    @page { ${pageRule(paper)} }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      width: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      html, body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body></body>
</html>`);
  doc.close();
  const sheet = paperInches(paper);
  const boxWIn = sheet.w - sheet.margin * 2;
  const boxHIn = sheet.h - sheet.margin * 2;

  const page = doc.createElement('div');
  page.style.cssText = `width:${boxWIn}in;margin:0 auto;padding:0;text-align:center;background:#fff;`;
  doc.body.appendChild(page);
  page.appendChild(clone);

  const naturalW = Math.max(clone.offsetWidth, clone.scrollWidth, 1);
  const naturalH = Math.max(clone.offsetHeight, clone.scrollHeight, 1);
  const scale = Math.min(boxWIn / (naturalW / 96), boxHIn / (naturalH / 96)) * 0.995;
  const fitted = Math.max(0.5, Math.min(scale, 1.2));
  clone.style.display = 'inline-block';
  clone.style.verticalAlign = 'top';
  clone.style.zoom = String(fitted);
  clone.style.marginLeft = '0';
  clone.style.marginRight = '0';

  const cleanup = () => {
    win.removeEventListener('afterprint', cleanup);
    iframe.remove();
  };
  win.addEventListener('afterprint', cleanup);

  const run = () => {
    win.focus();
    win.print();
    window.setTimeout(cleanup, 60_000);
  };

  const fontsReady = doc.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady.catch(() => undefined), new Promise((r) => window.setTimeout(r, 700))]).then(run);
}

export function paperKindForPreview(root: HTMLElement): PaperKind {
  return root.querySelector('.coa-result-sheet--legal, .lims-result-form-paper--legal')
    ? 'legal'
    : 'a4';
}
