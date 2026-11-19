import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
  icon: Icon,
  badge,
  actions,
  className,
  variant = 'card',
}) => (
  <header
    className={`flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between ${
      variant === 'embedded'
        ? 'border-b border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/40'
        : 'lims-card'
    }${className ? ` ${className}` : ''}`}
  >
    <div className="flex items-start gap-3 min-w-0">
      {Icon ? (
        <span className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0878e8] shrink-0">
          <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{eyebrow}</span>
            {badge}
          </div>
        ) : (
          badge
        )}
        <h1 className="text-lg sm:text-xl font-bold text-[var(--lims-navy)] tracking-tight mt-1">{title}</h1>
        {description ? <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-snug">{description}</p> : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </header>
);
