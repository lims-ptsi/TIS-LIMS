import React from 'react';

// Stable ids so SSR/hydration does not mismatch pattern refs.
const patternId = 'lims-main-art';

/** Full main-column wallpaper (fixed under navbar, beside sidebar). */
export const LimsMainBackdrop: React.FC = () => (
  <div
    className="lims-main-backdrop print:hidden pointer-events-none fixed z-[1] inset-x-0 bottom-0 top-14 lg:left-[15.5rem] overflow-hidden"
    aria-hidden
  >
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(165deg, #f8fafc 0%, var(--lims-bg) 38%, #e8f2fc 100%)',
      }}
    />
    <div className="absolute -top-16 right-[5%] h-96 w-96 rounded-full bg-[#0878e8]/[0.14] blur-3xl" />
    <div className="absolute top-[35%] -left-24 h-80 w-80 rounded-full bg-[#0a2240]/[0.08] blur-3xl" />
    <div className="absolute bottom-[20%] right-[8%] h-72 w-72 rounded-full bg-sky-400/[0.12] blur-2xl" />

    <svg
      className="absolute inset-0 h-full w-full text-[#0878e8]/[0.085]"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={`${patternId}-dots`} width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
        <pattern id={`${patternId}-hex`} width="56" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
          <path
            d="M28 2 L52 16 L52 44 L28 58 L4 44 L4 16 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.35"
          />
        </pattern>
      </defs>
      <rect width="1200" height="900" fill={`url(#${patternId}-dots)`} />
      <rect width="1200" height="900" fill={`url(#${patternId}-hex)`} opacity="0.55" />
    </svg>

    <svg
      className="absolute left-[3%] top-[10%] h-[60%] w-36 text-[#0a2240]/[0.09] sm:w-48"
      viewBox="0 0 120 400"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        d="M60,20 Q90,80 60,140 Q30,200 60,260 Q90,320 60,380"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
        d="M60,20 Q30,80 60,140 Q90,200 60,260 Q30,320 60,380"
      />
    </svg>

    <MotionRing className="absolute right-[4%] top-[14%] h-56 w-56 text-[#0878e8]/[0.11] hidden sm:block" />
    <MotionRing className="absolute right-[14%] top-[48%] h-40 w-40 text-[#0a2240]/[0.09] hidden md:block" />

    <svg
      className="absolute bottom-0 left-0 h-40 w-full text-[#0878e8]/[0.12]"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,72 C200,28 400,92 600,52 C800,18 1000,68 1200,48 L1200,120 L0,120 Z"
      />
    </svg>
    <svg
      className="absolute bottom-0 left-0 h-52 w-full text-[#0a2240]/[0.07]"
      viewBox="0 0 1200 140"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,82 C240,36 480,108 720,62 C900,32 1050,78 1200,58 L1200,140 L0,140 Z"
      />
    </svg>
  </div>
);

/** Extra depth behind the home dashboard stack (inside page shell). */
export const DashboardPageBackdrop: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    aria-hidden
  >
    <svg
      className="absolute right-[2%] top-[6%] h-52 w-52 text-[#0878e8]/[0.09] hidden sm:block"
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" />
      <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <circle cx="50" cy="28" r="3" fill="currentColor" />
      <circle cx="68" cy="58" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="32" cy="58" r="2.5" fill="currentColor" opacity="0.7" />
    </svg>
    <svg
      className="absolute left-0 bottom-[18%] h-24 w-full text-[#0878e8]/[0.06]"
      viewBox="0 0 800 72"
      preserveAspectRatio="none"
    >
      <path fill="currentColor" d="M0,40 C180,12 360,56 540,32 C660,18 730,44 800,36 L800,72 L0,72 Z" />
    </svg>
  </div>
);

/** Layered waves + accents inside the welcome hero card. */
export const DashboardHeroArtwork: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="absolute -top-20 right-[5%] h-56 w-56 rounded-full bg-gradient-to-br from-[#0878e8]/15 to-sky-200/20 blur-2xl" />
    <div className="absolute top-8 right-[28%] h-24 w-24 rounded-full border border-[#0878e8]/10 bg-white/40" />
    <MotionRing className="absolute top-6 right-[18%] h-36 w-36 text-[#0878e8]/[0.12]" />
    <MotionRing className="absolute -bottom-6 right-[8%] h-44 w-44 text-[#0a2240]/[0.08]" />

    <svg
      className="absolute bottom-0 left-0 h-20 w-full text-[#0878e8]/[0.09]"
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,52 C120,18 240,68 400,38 C520,18 640,58 800,42 L800,80 L0,80 Z"
      />
    </svg>
    <svg
      className="absolute bottom-0 left-0 h-28 w-full text-[#0a2240]/[0.05]"
      viewBox="0 0 800 96"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,58 C160,24 280,78 440,48 C600,22 700,62 800,50 L800,96 L0,96 Z"
      />
    </svg>

    <svg
      className="absolute right-0 top-0 h-full w-[min(42%,320px)] text-[#0878e8]/[0.07]"
      viewBox="0 0 280 200"
      preserveAspectRatio="xMaxYMid slice"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        d="M40,20 Q140,80 60,160 M120,30 Q200,100 100,180 M180,10 Q240,90 200,170"
      />
      <circle cx="220" cy="48" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="248" cy="120" r="2.5" fill="currentColor" opacity="0.35" />
      <circle cx="195" cy="155" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  </div>
);

/** Inverted waves on the navy CTA strip. */
export const DashboardCtaArtwork: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
    <div className="absolute -right-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#0878e8]/25 blur-2xl" />
    <svg
      className="absolute bottom-0 left-0 h-14 w-full text-white/[0.08]"
      viewBox="0 0 800 56"
      preserveAspectRatio="none"
    >
      <path fill="currentColor" d="M0,36 C200,8 400,44 600,22 C700,12 760,32 800,26 L800,56 L0,56 Z" />
    </svg>
    <svg
      className="absolute bottom-0 left-0 h-20 w-full text-[#0878e8]/20"
      viewBox="0 0 800 72"
      preserveAspectRatio="none"
    >
      <path fill="currentColor" d="M0,42 C220,14 380,50 560,30 C680,18 740,38 800,32 L800,72 L0,72 Z" />
    </svg>
  </div>
);

function MotionRing({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 6" />
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}
