import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastAlertProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((t) => {
      const duration = t.duration || 5000;
      return setTimeout(() => {
        onDismiss(t.id);
      }, duration);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : isError
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : isWarning
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-blue-50 border-blue-300 text-blue-950'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isError && <XCircle className="w-5 h-5 text-rose-600" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-amber-600" />}
              {isInfo && <Info className="w-5 h-5 text-blue-600" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wide leading-tight">
                {toast.title}
              </h4>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90 font-medium">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
