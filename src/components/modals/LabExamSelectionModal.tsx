import React, { useMemo, useState } from 'react';
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
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-3 sm:p-4">
      <div className="bg-white border border-[#d8dde6] rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        <div className="px-5 py-3 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Select examinations</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {requisition.patientOrSubjectName} · {requisition.caseNo || requisition.requisitionNumber} ·{' '}
              {category}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
              activeTab === 'ALL' ? 'bg-[#0176d3] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All
          </button>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                activeTab === tab ? 'bg-[#0176d3] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-5 py-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="SEARCH EXAMINATIONS"
              className="w-full pl-9 pr-3 py-2 rounded border border-[#d8dde6] text-xs uppercase focus:outline-none focus:border-[#0176d3]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-[11px] leading-tight">{getExaminationName(exam, category)}</span>
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

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-slate-50/80">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-900">{selected.length}</strong> selected ·{' '}
            <strong className="text-emerald-700">{formatCurrency(total)}</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
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
                  : 'Save & send to testing queue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
