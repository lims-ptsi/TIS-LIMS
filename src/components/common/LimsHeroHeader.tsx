import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { DashboardHeroArtwork } from './LimsDashboardArtwork';

interface LimsHeroHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Small pills above the title (e.g. module + step). */
  badges?: React.ReactNode;
  /** Right column — stat, clock, or step counter (home hero layout). */
  aside?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Welcome-style hero band (matches Home dashboard greeting card). */
export const LimsHeroHeader: React.FC<LimsHeroHeaderProps> = ({
  title,
  description,
  badges,
  aside,
  actions,
  className,
}) => (
  <header
    className={`relative overflow-hidden border-b border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30${
      className ? ` ${className}` : ''
    }`}
  >
    <DashboardHeroArtwork />
    <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <img
          src="/ptsilogo.png"
          alt="PTSI Logo"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-snug">{description}</p>
          ) : null}
        </div>
      </div>
      {(aside || actions) && (
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 lg:min-w-[11rem] lg:pl-6 lg:border-l lg:border-[var(--lims-border)]">
          {aside}
          {actions ? <div className="flex flex-wrap items-center gap-2 justify-end">{actions}</div> : null}
        </div>
      )}
    </div>
  </header>
);
