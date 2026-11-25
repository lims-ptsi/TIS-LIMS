import React, { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';

export interface DocumentSideDrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onPrint?: () => void;
  /** Tailwind width classes for the sliding panel (default: wide document preview). */
  panelClassName?: string;
  /** Slightly tighter header for narrow panels (e.g. label preview). */
  compactHeader?: boolean;
  /** Extra actions shown beside the default Print / close controls. */
  headerActions?: React.ReactNode;
  /** Optional class on the fixed overlay root (e.g. print-modal-backdrop). */
  rootClassName?: string;
  /** Stacking class when this drawer must sit above another panel. */
  layerClassName?: string;
  children: React.ReactNode;
}

export function DocumentSideDrawer({
  title,
  subtitle,
  onClose,
  onPrint,
  panelClassName = 'sm:w-[min(62vw,1200px)]',
  compactHeader = false,
  headerActions,
  rootClassName,
  layerClassName = 'z-[60]',
  children,
}: DocumentSideDrawerProps) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 280);
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 ${layerClassName} flex justify-end print:static print:inset-auto print:block print:w-full print:p-0 print:bg-white print:min-h-0 print:h-auto ${rootClassName || ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-side-drawer-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer print:hidden ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close document panel"
        onClick={requestClose}
      />
      <div
        className={`relative w-full ${panelClassName} h-full bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] will-change-transform print:relative print:w-full print:max-w-none print:h-auto print:min-h-0 print:shadow-none print:border-0 print:transform-none ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div
          className={`shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-3 print:hidden ${
            compactHeader ? 'px-4 py-3' : 'px-5 py-4'
          }`}
        >
          <div className="min-w-0">
            <h2
              id="document-side-drawer-title"
              className={`font-semibold text-slate-900 tracking-tight ${compactHeader ? 'text-base' : 'text-lg'}`}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className={`text-slate-600 mt-0.5 truncate ${compactHeader ? 'text-xs' : 'text-sm'}`}>{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {headerActions}
            {onPrint ? (
              <button
                type="button"
                onClick={onPrint}
                className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-slate-900 hover:bg-black text-white cursor-pointer ${
                  compactHeader ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                }`}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            ) : null}
            <button
              type="button"
              onClick={requestClose}
              className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col print:overflow-visible print:min-h-0 print:h-auto print:flex-none">
          {children}
        </div>
      </div>
    </div>
  );
}
