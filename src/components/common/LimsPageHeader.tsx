import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { DashboardHeroArtwork } from './LimsDashboardArtwork';

interface LimsPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** `card` = standalone tile; `embedded` = top of LimsWorkspace (home-style panel). */
  variant?: 'card' | 'embedded';
}

export const LimsPageHeader: React.FC<LimsPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className,
  variant = 'card',
}) => (
  <header
    className={`relative overflow-hidden ${
      variant === 'embedded'
        ? 'border-b border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30'
        : 'lims-card border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30'
    }${className ? ` ${className}` : ''}`}
  >
    <DashboardHeroArtwork />
    <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <img
          src="/ptsilogo.png"
          alt="PTSI Logo"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
        />
        <div className="min-w-0">
          {eyebrow ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                {eyebrow}
              </span>
              {badge}
            </div>
          ) : (
            badge
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-snug">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  </header>
);
