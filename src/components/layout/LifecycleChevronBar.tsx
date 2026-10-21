import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface LifecycleChevronBarProps {
  currentStage?: string;
  onCompleteStage?: () => void;
  entityType?: 'Sample' | 'Batch';
}

const DEFAULT_STAGES = [
  'Electronic Test Requisition & Intake',
  'Specimen Accessioning',
  'Laboratory Testing & Analysis',
  'Technical Review & QC',
  'CoA Final Release',
];

export const LifecycleChevronBar: React.FC<LifecycleChevronBarProps> = ({
  currentStage = 'Electronic Test Requisition & Intake',
  onCompleteStage,
  entityType = 'Sample',
}) => {
  // Find current stage index
  const currentIndex = DEFAULT_STAGES.findIndex(
    (s) => s.toLowerCase() === currentStage.toLowerCase() || currentStage.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(currentStage.toLowerCase())
  );
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Step Indicators / Chevron Workflow */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 py-0.5">
        {DEFAULT_STAGES.map((stageName, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isCompleted ? (
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
              ) : (
                <span className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
              )}
              <span>{stageName}</span>
              {idx < DEFAULT_STAGES.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Right Action Button */}
      {onCompleteStage && (
        <div className="shrink-0">
          <button
            type="button"
            onClick={onCompleteStage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-lg shadow-2xs transition-all active:scale-98 cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            <span>+ New Requisition</span>
          </button>
        </div>
      )}
    </div>
  );
};
