/**
 * html2canvas 1.x cannot parse modern CSS color functions (e.g. Tailwind v4 oklch).
 * Before capture, drop cloned stylesheets and mirror resolved computed styles as inline rgb.
 */

const STYLE_PROPS: (keyof CSSStyleDeclaration)[] = [
  'color',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'borderTopWidth',
  'borderTopStyle',
  'borderTopColor',
  'borderRightWidth',
  'borderRightStyle',
  'borderRightColor',
  'borderBottomWidth',
  'borderBottomStyle',
  'borderBottomColor',
  'borderLeftWidth',
  'borderLeftStyle',
  'borderLeftColor',
  'borderRadius',
  'boxShadow',
  'outlineWidth',
  'outlineStyle',
  'outlineColor',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textDecorationColor',
  'textTransform',
  'verticalAlign',
  'whiteSpace',
  'wordBreak',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'display',
  'flexDirection',
  'flexWrap',
  'alignItems',
  'justifyContent',
  'alignSelf',
  'gap',
  'columnGap',
  'rowGap',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
  'overflow',
  'overflowX',
  'overflowY',
  'opacity',
  'visibility',
  'boxSizing',
  'objectFit',
  'borderCollapse',
  'tableLayout',
  'captionSide',
  'listStyle',
  'listStyleType',
  'listStylePosition',
  'transform',
  'transformOrigin',
];

const MODERN_COLOR = /oklch\(|oklab\(|color-mix\(|\blab\(|\blch\(/;
let colorProbe: CanvasRenderingContext2D | null | undefined;

/** Canvas resolves oklch / color-mix into rgb, which print and html2canvas can keep. */
function cssColorToRgb(value: string): string {
  if (!MODERN_COLOR.test(value)) return value;
  if (colorProbe === undefined) {
    colorProbe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  }
  if (!colorProbe) return value;
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = value;
  colorProbe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorProbe.getImageData(0, 0, 1, 1).data;
  if (a === 0) return value;
  if (a < 255) return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  return `rgb(${r}, ${g}, ${b})`;
}

function stripUnsupportedStylesheets(clonedDoc: Document): void {
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
}

function applyComputedStyles(live: HTMLElement, clone: HTMLElement): void {
  const cs = getComputedStyle(live);
  for (const prop of STYLE_PROPS) {
    const val = cs[prop];
    if (typeof val !== 'string' || !val) continue;
    const printable = cssColorToRgb(val);
    if (MODERN_COLOR.test(printable)) continue;
    try {
      const cssName = String(prop).replace(/[A-Z]/g, (m: string) => `-${m.toLowerCase()}`);
      clone.style.setProperty(cssName, printable);
      if (cssName === 'color') clone.style.setProperty('-webkit-text-fill-color', printable);
    } catch {
      /* ignore unsupported assignments */
    }
  }
}

/** Copy resolved rgb/px styles from the live tree onto a clone (same document). */
export function mirrorComputedStyles(live: HTMLElement, clone: HTMLElement): void {
  walkSync(live, clone);
}

function walkSync(live: HTMLElement, clone: HTMLElement): void {
  applyComputedStyles(live, clone);

  const liveKids = live.children;
  const cloneKids = clone.children;
  const n = Math.min(liveKids.length, cloneKids.length);
  for (let i = 0; i < n; i++) {
    const lc = liveKids[i];
    const cc = cloneKids[i];
    if (lc instanceof HTMLElement && cc instanceof HTMLElement) {
      walkSync(lc, cc);
    }
  }
}

/** Prepare a html2canvas clone so its CSS parser never sees oklch/ color-mix. */
export function prepareHtml2CanvasClone(
  clonedDoc: Document,
  liveRoot: HTMLElement,
  clonedRoot: HTMLElement
): void {
  stripUnsupportedStylesheets(clonedDoc);
  walkSync(liveRoot, clonedRoot);
  clonedRoot.style.background = '#ffffff';
}