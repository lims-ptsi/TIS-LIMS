import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Check, Search, X } from 'lucide-react';
import { LabTestRequisition } from '../../types/lims';
import {
  ExaminationItem,
  EXAMINATION_CATEGORIES,
  CORPORATE_CATEGORIES,
  formatCurrency,
  getExaminationCategory,
  getExaminationCode,
  getExaminationName,
  getExaminationPrice,
  examinationMatchesSearch,
  isCorporateSchemeExam,
  isStandardSchemeExam,
} from '../../data/examinationCatalog';

export interface LabExamSelectionModalProps {
  isOpen: boolean;
  requisition: LabTestRequisition | null;
  examinationCatalog: ExaminationItem[];
  onClose: () => void;
  onSave: (req: LabTestRequisition, examNames: string[]) => void | Promise<void>;
}

export function LabExamSelectionModal({
  isOpen,
  requisition,
  examinationCatalog,
  onClose,
  onSave,
}: LabExamSelectionModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = () => {
    if (closing || saving) return;
    setClosing(true);
  };

  React.useEffect(() => {
    if (!requisition || !isOpen) return;
    const existing =
      requisition.kindOfExamination?.length
        ? requisition.kindOfExamination
        : requisition.selectedTestNames || [];
    setSelected(existing);
    setSearch('');
    setActiveTab('ALL');
  }, [requisition?.id, isOpen]);

  useEffect(() => {
    if (isOpen) setClosing(false);
  }, [isOpen]);

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
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closing, saving]);

  const category = requisition?.patientCategory || 'OPD';
  const isCorporate = category === 'Corporate';

  const catalog = useMemo(() => {
    return examinationCatalog.filter((item) => {
      if (item.isActive === false) return false;
      return isCorporate ? isCorporateSchemeExam(item) : isStandardSchemeExam(item);
    });
  }, [examinationCatalog, isCorporate]);

  const tabs = isCorporate ? CORPORATE_CATEGORIES : EXAMINATION_CATEGORIES;

  const filtered = useMemo(() => {
    return catalog.filter((item) => {
      const cat = getExaminationCategory(item, category);
      if (activeTab !== 'ALL' && cat !== activeTab) return false;
      if (!search.trim()) return true;
      return examinationMatchesSearch(item, search, [category]);
    });
  }, [catalog, activeTab, search, category]);

  const total = useMemo(
    () =>
      selected.reduce((sum, name) => {
        const item = catalog.find((e) => e.name === name);
        return sum + (item ? getExaminationPrice(item, category) : 0);
      }, 0),
    [selected, catalog, category]
  );

  if (!isOpen || !requisition) return null;

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onSave(requisition, selected);
      requestClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-selection-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close examination panel"
        onClick={requestClose}
      />
      <div
        className={`relative h-full w-full sm:w-[min(860px,94vw)] bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] overflow-hidden text-slate-900 will-change-transform ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 id="exam-selection-title" className="text-lg font-semibold text-slate-900 tracking-tight">
              Select examinations
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              {requisition.patientOrSubjectName} · {requisition.caseNo || requisition.requisitionNumber} · {category}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer ${
                activeTab === 'ALL' ? 'bg-[#0176d3] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer ${
                  activeTab === tab ? 'bg-[#0176d3] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="Search examinations"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d8dde6] text-sm focus:outline-none focus:border-[#0176d3]"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((exam) => {
              const isSelected = selected.includes(exam.name);
              return (
                <button
                  type="button"
                  key={`${exam.code}-${exam.name}`}
                  onClick={() => toggle(exam.name)}
                  className={`p-2.5 rounded-lg text-left text-xs border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#0176d3] ring-1 ring-[#0176d3]'
                      : 'bg-white border-[#d8dde6] hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between gap-2 items-start">
                    <span className="font-semibold text-[12px] leading-snug">{getExaminationName(exam, category)}</span>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0176d3] border-[#0176d3] text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : null}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-slate-100 text-[9px]">
                    <span className="text-slate-500 font-mono">{getExaminationCode(exam, category)}</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(getExaminationPrice(exam, category))}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No examinations match this filter.
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-900">{selected.length}</strong> selected ·{' '}
            <strong className="text-emerald-700">{formatCurrency(total)}</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.length === 0 || saving}
              onClick={() => void handleSave()}
              className="px-5 py-2 text-xs font-bold rounded-md bg-[#0176d3] text-white disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? 'Saving…'
                : category === 'OPD'
                  ? 'Save & send to cashier'
                  : 'Save examinations'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
