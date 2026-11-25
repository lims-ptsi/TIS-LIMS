import React from 'react';

const HEX_R = 34;
const HEX_DX = HEX_R * Math.sqrt(3);
const HEX_DY = HEX_R * 1.5;

type HexIcon = 'heart' | 'pill' | 'globe' | 'pulse' | 'plus';

type HexCell = {
  col: number;
  row: number;
  fill: string;
  icon?: HexIcon;
};

const HERO_HEXES: HexCell[] = [
  { col: 1, row: 0, fill: '#b7dff6' },
  { col: 2, row: 0, fill: '#7eb6e6', icon: 'heart' },
  { col: 3, row: 0, fill: '#cfe8f8' },
  { col: 0, row: 1, fill: '#9ed0f2' },
  { col: 1, row: 1, fill: '#d7eefb', icon: 'plus' },
  { col: 2, row: 1, fill: '#6aaede', icon: 'pill' },
  { col: 3, row: 1, fill: '#e8f5fc' },
  { col: 4, row: 1, fill: '#8ec4ee', icon: 'pulse' },
  { col: 0, row: 2, fill: '#a9d6f4' },
  { col: 1, row: 2, fill: '#7eb4e4' },
  { col: 2, row: 2, fill: '#c5e4f8', icon: 'globe' },
  { col: 3, row: 2, fill: '#9fd0f3' },
  { col: 1, row: 3, fill: '#b9dff5' },
  { col: 2, row: 3, fill: '#6eafdf' },
  { col: 3, row: 3, fill: '#d4ecfa' },
];

const BACKDROP_HEXES: HexCell[] = [
  { col: 1, row: 0, fill: 'rgba(255,255,255,0.28)' },
  { col: 2, row: 0, fill: 'rgba(255,255,255,0.42)', icon: 'heart' },
  { col: 0, row: 1, fill: 'rgba(255,255,255,0.22)' },
  { col: 1, row: 1, fill: 'rgba(255,255,255,0.5)', icon: 'pill' },
  { col: 2, row: 1, fill: 'rgba(255,255,255,0.3)', icon: 'pulse' },
  { col: 1, row: 2, fill: 'rgba(255,255,255,0.24)', icon: 'globe' },
  { col: 2, row: 2, fill: 'rgba(255,255,255,0.36)' },
];

/** Full main-column wallpaper (fixed under navbar, beside sidebar). */
export const LimsMainBackdrop: React.FC = () => (
  <div
    className="lims-main-backdrop print:hidden pointer-events-none fixed z-[1] inset-x-0 bottom-0 top-14 lg:left-[15.5rem] overflow-hidden"
    aria-hidden
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 70% at 30% 20%, #f7fbfe 0%, #e7f4fb 46%, #d3ebf8 100%)',
      }}
    />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
      <PlusField
        marks={[
          [90, 80, 11],
          [210, 160, 7],
          [360, 70, 8],
          [540, 140, 6],
          [760, 60, 12],
          [980, 120, 7],
          [1100, 48, 9],
          [140, 420, 8],
          [300, 640, 6],
          [1040, 520, 10],
          [860, 760, 7],
        ]}
        fill="rgba(255,255,255,0.85)"
      />
      <HeartOutline x={180} y={300} scale={0.7} stroke="rgba(255,255,255,0.7)" />
      <HeartOutline x={990} y={700} scale={0.9} stroke="rgba(255,255,255,0.75)" />
      <HexCluster cells={BACKDROP_HEXES} originX={860} originY={560} />
    </svg>
  </div>
);

/** Extra depth behind the home dashboard stack (inside page shell). */
export const DashboardPageBackdrop: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
      <PlusField
        marks={[
          [40, 36, 8],
          [180, 90, 5],
          [700, 40, 9],
          [640, 120, 6],
        ]}
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  </div>
);

/** Medical abstract for page heroes: plus signs, pills, and a hexagon cluster. */
export const DashboardHeroArtwork: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 75% 120% at 22% 40%, #f5fbfe 0%, #e4f3fb 38%, #c5e4f6 100%)',
      }}
    />
    <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 1040 280" preserveAspectRatio="xMidYMid slice">
      <PlusField
        marks={[
          [70, 36, 10],
          [168, 78, 6],
          [430, 28, 7],
          [560, 22, 11],
          [690, 48, 6],
          [860, 26, 9],
          [980, 58, 7],
          [36, 150, 6],
          [990, 210, 8],
        ]}
        fill="rgba(255,255,255,0.92)"
      />
      <HeartOutline x={250} y={210} scale={0.55} stroke="rgba(255,255,255,0.8)" />
      <HeartOutline x={760} y={250} scale={0.7} stroke="rgba(255,255,255,0.9)" />
      <g opacity="0.9">
        <DottedLink x1={78} y1={118} x2={168} y2={118} />
        <Pill x={52} y={118} rotate={-28} />
        <Pill x={930} y={150} rotate={18} />
        <DottedLink x1={860} y1={96} x2={960} y2={96} />
      </g>
      <path
        d="M620 34 H700 L714 34 L728 14 L742 52 L756 28 L770 34 H860"
        fill="none"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <HexCluster cells={HERO_HEXES} originX={730} originY={72} />
    </svg>
    <div className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-[#f5fbfe] via-[#f5fbfe]/90 to-transparent" />
  </div>
);

/** Light medical marks on the navy call-to-action strip. */
export const DashboardCtaArtwork: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 80" preserveAspectRatio="xMidYMid slice">
      <PlusField
        marks={[
          [36, 22, 7],
          [120, 54, 5],
          [700, 18, 8],
          [760, 48, 5],
        ]}
        fill="rgba(255,255,255,0.28)"
      />
      <path
        d="M240 46 H320 L334 46 L348 28 L362 62 L376 40 L390 46 H500"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

function hexPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(angle)).toFixed(1)} ${(cy + r * Math.sin(angle)).toFixed(1)}`;
  });
  return `M ${pts.join(' L ')} Z`;
}

function hexCenter(col: number, row: number, originX: number, originY: number) {
  return {
    x: originX + col * HEX_DX + (row % 2 ? HEX_DX / 2 : 0),
    y: originY + row * HEX_DY,
  };
}

function HexCluster({
  cells,
  originX,
  originY,
}: {
  cells: HexCell[];
  originX: number;
  originY: number;
}) {
  return (
    <g>
      {cells.map((cell) => {
        const { x, y } = hexCenter(cell.col, cell.row, originX, originY);
        return (
          <g key={`${cell.col}-${cell.row}`}>
            <path d={hexPath(x, y, HEX_R - 1.5)} fill={cell.fill} />
            {cell.icon ? <HexIconMark kind={cell.icon} x={x} y={y} /> : null}
          </g>
        );
      })}
    </g>
  );
}

function HexIconMark({ kind, x, y }: { kind: HexIcon; x: number; y: number }) {
  if (kind === 'plus') {
    return <Plus x={x} y={y} size={9} fill="#ffffff" />;
  }
  if (kind === 'heart') {
    return (
      <g transform={`translate(${x} ${y - 1})`}>
        <path
          d="M0 2.2 C-4.2 -3.2 -11 0.4 -7.2 6.2 L0 12.2 L7.2 6.2 C11 0.4 4.2 -3.2 0 2.2 Z"
          fill="#ffffff"
          transform="translate(0 -4) scale(0.85)"
        />
        <path d="M0 -1.5 v6 M-3 1.5 h6" stroke="#7eb6e6" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'pill') {
    return (
      <g transform={`translate(${x} ${y}) rotate(-18)`}>
        <rect x="-13" y="-6" width="26" height="12" rx="6" fill="#ffffff" />
        <path d="M0 -6 v12" stroke="#7eb6e6" strokeWidth="1.2" />
      </g>
    );
  }
  if (kind === 'globe') {
    return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke="#ffffff" strokeWidth="1.35">
        <circle r="9" />
        <ellipse rx="4" ry="9" />
        <path d="M-9 0 H9 M-7 -5 H7 M-7 5 H7" />
      </g>
    );
  }
  return (
    <path
      d={`M${x - 12} ${y + 1} H${x - 4} L${x - 1} ${y - 7} L${x + 4} ${y + 7} L${x + 7} ${y - 1} H${x + 13}`}
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Plus({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  return <path d={`M${x} ${y - size} v${size * 2} M${x - size} ${y} h${size * 2}`} stroke={fill} strokeWidth="1.8" strokeLinecap="round" />;
}

function PlusField({ marks, fill }: { marks: number[][]; fill: string }) {
  return (
    <g>
      {marks.map(([x, y, size]) => (
        <Plus key={`${x}-${y}`} x={x} y={y} size={size} fill={fill} />
      ))}
    </g>
  );
}

function Pill({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-16" y="-7" width="32" height="14" rx="7" fill="rgba(255,255,255,0.92)" />
      <path d="M0 -7 v14" stroke="#8ec4ee" strokeWidth="1.2" />
    </g>
  );
}

function DottedLink({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.2"
        strokeDasharray="1.5 4"
        strokeLinecap="round"
      />
      <circle cx={x1} cy={y1} r="3.2" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
      <circle cx={x2} cy={y2} r="2.2" fill="rgba(255,255,255,0.95)" />
    </g>
  );
}

function HeartOutline({ x, y, scale, stroke }: { x: number; y: number; scale: number; stroke: string }) {
  return (
    <path
      d="M0 3 C-5 -4 -14 1 -9 8 L0 15 L9 8 C14 1 5 -4 0 3 Z"
      fill="none"
      stroke={stroke}
      strokeWidth="1.4"
      transform={`translate(${x} ${y}) scale(${scale})`}
    />
  );
}
