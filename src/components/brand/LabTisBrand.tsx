import React from 'react';

export const APP_NAME = 'LAB-TIS';
export const APP_TAGLINE = 'Laboratory Information Management System';

interface LabTisBrandProps {
  markClassName?: string;
  showText?: boolean;
  showName?: boolean;
  className?: string;
}

export const LabTisBrand: React.FC<LabTisBrandProps> = ({
  markClassName = 'h-9 w-auto',
  showText = true,
  showName = true,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
    <img
      src="/labtis.png"
      alt={showName ? '' : APP_NAME}
      className={`${markClassName} object-contain shrink-0`}
    />
    {showText && (
      <span className="text-left leading-tight shrink-0">
        {showName && (
          <span className="block text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">{APP_NAME}</span>
        )}
        <span className="block text-sm font-semibold leading-snug text-slate-700">
          <span className="block whitespace-nowrap">Laboratory Information</span>
          <span className="block whitespace-nowrap">Management System</span>
        </span>
      </span>
    )}
  </span>
);
