import React from 'react';

export const PTSI_LOGO_PATH = '/ptsilogo.png';

export function PtsiLogo({
  className = 'h-14 w-auto object-contain shrink-0',
  alt = 'Philippine Tuberculosis Society, Inc.',
  decorative,
}: {
  className?: string;
  alt?: string;
  /** Letterhead companion text names the org — hide logo from screen readers. */
  decorative?: boolean;
}) {
  return (
    <img
      src={PTSI_LOGO_PATH}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
