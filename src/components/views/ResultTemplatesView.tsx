import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Sliders, 
  Info, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Calculator,
  ListFilter,
  Eye,
  X,
  Tag,
  FileText,
  FileCode,
} from 'lucide-react';
import { 
  ExaminationTemplate, 
  ParameterDef, 
  DEFAULT_EXAMINATION_TEMPLATES, 
  saveStoredTemplates,
  resetStoredTemplates,
  getTemplateForExamination
} from '../../data/testParametersCatalog';
import { 
  ExaminationItem, 
  EXAMINATION_CATALOG, 
  loadStoredExaminations, 
  formatCurrency 
} from '../../data/examinationCatalog';
import { determineResultFlag } from '../../utils/qcCalculations';

interface ResultTemplatesViewProps {
  templates: Record<string, ExaminationTemplate>;
  onUpdateTemplates: (newTemplates: Record<string, ExaminationTemplate>) => void;
  onLogAudit?: (action: string, reason: string) => void;
  currentUserName?: string;
  examinations?: ExaminationItem[];
}

export const ResultTemplatesView: React.FC<ResultTemplatesViewProps> = ({
  templates,
  onUpdateTemplates,
  onLogAudit,
  currentUserName: _currentUserName = 'System Administrator',
  examinations = loadStoredExaminations(),
}) => {
  // Master catalog list of all examinations (69 items from official PTSI tariff)
  const allExaminations = useMemo(() => {
    return examinations && examinations.length > 0 ? examinations : EXAMINATION_CATALOG;
  }, [examinations]);

  // Selected examination product code
  const [selectedKey, setSelectedKey] = useState<string>(() => {
    return allExaminations[0]?.code || '1010';
  });

  // Search & discipline category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Find active examination item from catalog
  const activeExamItem = useMemo(() => {
    return allExaminations.find((e) => e.code === selectedKey) || allExaminations[0];
  }, [allExaminations, selectedKey]);

  // Active loaded template (from state or default fallback)
  const activeTemplate = useMemo(() => {
    if (templates[selectedKey]) return templates[selectedKey];
    return getTemplateForExamination(selectedKey, activeExamItem, templates);
  }, [templates, selectedKey, activeExamItem]);

  // Local editing draft state for active template
  const [draftTemplate, setDraftTemplate] = useState<ExaminationTemplate>(() => {
    return JSON.parse(JSON.stringify(activeTemplate));
  });

  // Unsaved changes tracking
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftTemplate) !== JSON.stringify(activeTemplate);
  }, [draftTemplate, activeTemplate]);

  // Sandbox preview test values
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({});
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // New Template Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newExamCode, setNewExamCode] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamCategory, setNewExamCategory] = useState('HEMATOLOGY');
  const [newExamMethod, setNewExamMethod] = useState('Automated Clinical Assay');
  const [newExamSpecimen, setNewExamSpecimen] = useState('Whole Blood (K2-EDTA)');
  const [newExamPrice, setNewExamPrice] = useState('300.00');

  // JSON Import File Input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize draft when selected template changes
  useEffect(() => {
    const current = JSON.parse(JSON.stringify(activeTemplate));
    setDraftTemplate(current);

    // Initialize sandbox values from defaults
    const initialSandbox: Record<string, string> = {};
    current.parameters.forEach((p: ParameterDef) => {
      initialSandbox[p.id] = p.defaultValue || '';
    });
    setSandboxValues(initialSandbox);
  }, [selectedKey, activeTemplate]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allExaminations.length };
    allExaminations.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allExaminations]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allExaminations.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [allExaminations]);

  // Filtered examinations list for the sidebar
  const filteredExaminations = useMemo(() => {
    return allExaminations.filter((item) => {
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.corporateCode && item.corporateCode.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allExaminations, categoryFilter, searchQuery]);

  // Parameter field updater
  const handleUpdateParamField = (paramIndex: number, field: keyof ParameterDef, value: any) => {
    setDraftTemplate((prev) => {
      const updatedParams = [...prev.parameters];
      updatedParams[paramIndex] = {
        ...updatedParams[paramIndex],
        [field]: value,
      };
      return { ...prev, parameters: updatedParams };
    });
  };

  // Add new parameter to active template
  const handleAddParameter = (type: 'NUMERIC' | 'SELECT' | 'CALCULATED' | 'TEXT' = 'NUMERIC') => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let newParam: ParameterDef;

    if (type === 'SELECT') {
      newParam = {
        id: newId,
        code: `PARAM_${draftTemplate.parameters.length + 1}`,
        name: `Analyte Parameter ${draftTemplate.parameters.length + 1}`,
        dataType: 'SELECT',
        options: ['NON-REACTIVE', 'REACTIVE', 'INDETERMINATE'],
        defaultValue: 'NON-REACTIVE',
      };
    } else if (type === 'CALCULATED') {
      newParam = {
        id: newId,
        code: `CALC_${draftTemplate.parameters.length + 1}`,
        name: `Calculated Parameter ${draftTemplate.parameters.length + 1}`,
        unit: '%',
        dataType: 'CALCULATED',
        calculationFormula: 'PARAM_1 * 1.0',
        specMin: 0.0,
        specMax: 100.0,
        defaultValue: '0.00',
      };
    } else if (type === 'TEXT') {
      newParam = {
        id: newId,
        code: `OBS_${draftTemplate.parameters.length + 1}`,
        name: `Microscopic Observation ${draftTemplate.parameters.length + 1}`,
        dataType: 'TEXT',
        normalText: 'Normal baseline. No abnormality detected.',
        defaultValue: 'Normal baseline. No abnormality detected.',
      };
    } else {
      newParam = {
        id: newId,
        code: `PARAM_${draftTemplate.parameters.length + 1}`,
        name: `Analyte Parameter ${draftTemplate.parameters.length + 1}`,
        unit: 'mg/dL',
        dataType: 'NUMERIC',
        specMin: 0.0,
        specMax: 100.0,
        criticalMin: 0.0,
        criticalMax: 200.0,
        defaultValue: '50.00',
      };
    }

    setDraftTemplate((prev) => ({
      ...prev,
      parameters: [...prev.parameters, newParam],
    }));

    setSandboxValues((prev) => ({
      ...prev,
      [newId]: newParam.defaultValue || '',
    }));
  };

  // Delete parameter from active template
  const handleDeleteParameter = (index: number) => {
    if (draftTemplate.parameters.length <= 1) {
      alert('An examination template must retain at least one analyte parameter.');
      return;
    }
    const paramName = draftTemplate.parameters[index]?.name || 'Analyte';
    if (confirm(`Remove analyte "${paramName}" from this template?`)) {
      setDraftTemplate((prev) => {
        const updated = [...prev.parameters];
        updated.splice(index, 1);
        return { ...prev, parameters: updated };
      });
    }
  };

  // Duplicate parameter
  const handleDuplicateParameter = (index: number) => {
    const source = draftTemplate.parameters[index];
    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const copy: ParameterDef = {
      ...source,
      id: newId,
      code: `${source.code}_COPY`,
      name: `${source.name} (Copy)`,
    };

    setDraftTemplate((prev) => {
      const updated = [...prev.parameters];
      updated.splice(index + 1, 0, copy);
      return { ...prev, parameters: updated };
    });

    setSandboxValues((prev) => ({
      ...prev,
      [newId]: copy.defaultValue || '',
    }));
  };

  // Move parameter position (Up / Down)
  const handleMoveParameter = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftTemplate.parameters.length) return;

    setDraftTemplate((prev) => {
      const updated = [...prev.parameters];
      const item = updated.splice(index, 1)[0];
      updated.splice(targetIndex, 0, item);
      return { ...prev, parameters: updated };
    });
  };

  // Save current template changes
  const handleSaveTemplate = useCallback(() => {
    const updatedTemplates: Record<string, ExaminationTemplate> = {
      ...templates,
      [draftTemplate.examCode]: draftTemplate,
    };

    // If examCode was changed from original selectedKey, remove old key
    if (draftTemplate.examCode !== selectedKey && templates[selectedKey]) {
      delete updatedTemplates[selectedKey];
    }

    onUpdateTemplates(updatedTemplates);
    saveStoredTemplates(updatedTemplates);

    if (onLogAudit) {
      onLogAudit(
        'UPDATE_TEMPLATE',
        `Admin modified result parameter template & reference ranges for ${draftTemplate.examName} (${draftTemplate.examCode})`
      );
    }

    setSaveSuccessToast(`Saved diagnostic result template for ${draftTemplate.examName} (${draftTemplate.examCode}) successfully!`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  }, [templates, draftTemplate, selectedKey, onUpdateTemplates, onLogAudit]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveTemplate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveTemplate]);

  // Reset this single test back to standard factory template
  const handleResetCurrentTest = () => {
    const factory = DEFAULT_EXAMINATION_TEMPLATES[selectedKey] || getTemplateForExamination(selectedKey, activeExamItem);
    if (confirm(`Reset "${draftTemplate.examName}" template back to factory defaults?`)) {
      setDraftTemplate(JSON.parse(JSON.stringify(factory)));
      const updated = {
        ...templates,
        [selectedKey]: factory,
      };
      onUpdateTemplates(updated);
      saveStoredTemplates(updated);
      setSaveSuccessToast(`Reset ${draftTemplate.examName} to laboratory factory template.`);
      setTimeout(() => setSaveSuccessToast(null), 3000);
    }
  };

  // Create brand new examination template
  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newExamCode.trim().toUpperCase();
    const cleanName = newExamName.trim().toUpperCase();

    if (!cleanCode || !cleanName) {
      alert('Examination Code and Examination Name are required.');
      return;
    }

    const created: ExaminationTemplate = {
      examCode: cleanCode,
      examName: cleanName,
      category: newExamCategory,
      methodology: newExamMethod,
      specimenType: newExamSpecimen,
      parameters: [
        {
          id: `p_${cleanCode.toLowerCase()}_01`,
          code: `${cleanCode}_VAL`,
          name: `${cleanName} Measurement`,
          unit: 'Units',
          dataType: 'NUMERIC',
          specMin: 10.0,
          specMax: 50.0,
          criticalMin: 5.0,
          criticalMax: 80.0,
          defaultValue: '25.00',
        },
      ],
    };

    const updated = {
      ...templates,
      [cleanCode]: created,
    };

    onUpdateTemplates(updated);
    saveStoredTemplates(updated);
    setSelectedKey(cleanCode);
    setIsNewModalOpen(false);

    if (onLogAudit) {
      onLogAudit(
        'CREATE_TEMPLATE',
        `Admin created new diagnostic result template ${cleanName} (${cleanCode})`
      );
    }

    setSaveSuccessToast(`Successfully created new result template for ${cleanName}!`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  // Reset all templates back to factory default
  const handleResetToFactoryDefaults = () => {
    if (confirm('Are you sure you want to reset ALL examination result templates to laboratory factory standards? Any custom reference intervals and formulas will be reverted.')) {
      const reset = resetStoredTemplates();
      onUpdateTemplates(reset);
      setSelectedKey('1010');

      if (onLogAudit) {
        onLogAudit(
          'RESET_TEMPLATES',
          'Admin restored factory default laboratory examination result templates schema.'
        );
      }

      setSaveSuccessToast('All result templates have been restored to laboratory factory defaults.');
      setTimeout(() => setSaveSuccessToast(null), 4000);
    }
  };

  // Export JSON Schema
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AegisLIMS_Result_Templates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Schema
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          onUpdateTemplates(parsed);
          saveStoredTemplates(parsed);
          setSaveSuccessToast('Imported template schema successfully!');
          setTimeout(() => setSaveSuccessToast(null), 4000);
        } else {
          alert('Invalid JSON template schema format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper: Live calculation evaluator for sandbox
  const evaluateSandboxCalculations = () => {
    const currentVals = { ...sandboxValues };
    draftTemplate.parameters.forEach((param) => {
      if (param.dataType === 'CALCULATED' && param.calculationFormula) {
        try {
          let formula = param.calculationFormula;
          draftTemplate.parameters.forEach((other) => {
            if (other.id !== param.id) {
              const val = parseFloat(currentVals[other.id] || '0') || 0;
              const regex = new RegExp(`\\b${other.code}\\b`, 'g');
              formula = formula.replace(regex, val.toString());
            }
          });
          // Evaluate arithmetic
          const sanitized = formula.replace(/[^0-9+\-*/(). ]/g, '');
          // eslint-disable-next-line no-eval
          const result = Function(`'use strict'; return (${sanitized})`)();
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            currentVals[param.id] = result.toFixed(2);
          }
        } catch {
          // ignore evaluation error
        }
      }
    });
    return currentVals;
  };

  const computedSandboxValues = evaluateSandboxCalculations();

  // Helper: Get flag for sandbox
  const getSandboxFlag = (param: ParameterDef, valStr: string) => {
    if (!valStr || valStr.trim() === '') return 'PENDING';
    const clean = valStr.toUpperCase();
    if (clean === 'NON-REACTIVE' || clean === 'NEGATIVE' || clean === 'NO OVA OR PARASITE SEEN') return 'NORMAL';
    if (clean.includes('REACTIVE') || clean.includes('POSITIVE')) return 'REACTIVE';

    if (param.dataType === 'NUMERIC' || param.dataType === 'CALCULATED') {
      const num = parseFloat(valStr);
      if (isNaN(num)) return 'NORMAL';
      const flag = determineResultFlag(num, param.specMin, param.specMax, param.criticalMin, param.criticalMax);
      return flag === 'OOS' ? 'CRITICAL' : flag;
    }
    return 'NORMAL';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans text-slate-900 animate-in fade-in duration-200">
      
      {/* 1. Page Header & Master Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Diagnostic Administration &amp; Master LIMS Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-[#0176d3] border border-blue-200">
              Analyte Studio
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
              {allExaminations.length} Catalog Tests
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
            <Sliders className="w-6 h-6 text-[#0176d3]" />
            <span>Examination Result Templates &amp; Parameters</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure laboratory analyte parameters, biological reference limits, qualitative dropdowns, critical panic thresholds, and dynamic calculated formulas per examination.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            accept=".json" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Template</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Download JSON schema backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Import JSON schema backup"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetToFactoryDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 shadow-xs transition-colors cursor-pointer"
            title="Restore laboratory factory templates"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset All Defaults</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast Banner */}
      {saveSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-emerald-900 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccessToast(null)} 
            className="p-1 hover:bg-emerald-100 rounded text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Examination Selector Sidebar (4 of 12) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col sticky top-20">
          
          {/* Sidebar Header & Search Box */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-[#0176d3]" />
                <span>Examinations ({filteredExaminations.length})</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                Click to Edit
              </span>
            </div>

            {/* Search Input with Clear Button */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code or test name..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-[#0176d3]/20 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isCatActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isCatActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isCatActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Examinations Scrollable List */}
          <div className="divide-y divide-slate-100 max-h-[660px] overflow-y-auto">
            {filteredExaminations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Search className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold">No matching examinations found.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); }}
                  className="text-xs text-[#0176d3] font-bold hover:underline"
                >
                  Clear search &amp; filters
                </button>
              </div>
            ) : (
              filteredExaminations.map((item) => {
                const isSelected = item.code === selectedKey;
                const tmpl = templates[item.code] || DEFAULT_EXAMINATION_TEMPLATES[item.code];
                const paramCount = tmpl?.parameters?.length || 1;

                return (
                  <button
                    key={item.code}
                    onClick={() => setSelectedKey(item.code)}
                    className={`w-full p-4 text-left transition-all flex items-center justify-between cursor-pointer group relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-l-[#0176d3] shadow-xs'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded-md shadow-2xs">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#0176d3] bg-blue-50/60 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.corporatePrice && (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Corp {formatCurrency(item.corporatePrice)}
                          </span>
                        )}
                      </div>

                      <div className={`text-xs font-bold transition-colors line-clamp-1 ${
                        isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        {item.name}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>{formatCurrency(item.price)}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">{paramCount} analyte(s)</span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[#0176d3] translate-x-1' : 'text-slate-300 group-hover:text-slate-500'
                    }`} />
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Template Studio & Analyte Editor (8 of 12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Template Sticky Quick Action Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0176d3] flex items-center justify-center font-bold border border-blue-100 shrink-0">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#0176d3]">
                    {draftTemplate.examCode}
                  </span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {draftTemplate.category}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <h2 className="text-base font-black text-slate-900 leading-snug">
                  {draftTemplate.examName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetCurrentTest}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title="Reset this test to factory template"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Test</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/30'
                    : 'bg-[#0176d3] hover:bg-[#0060b2] text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Template (Ctrl+S)</span>
              </button>
            </div>
          </div>

          {/* Section 1: Examination Header & Specimen Matrix Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-[#0176d3]" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Examination Header &amp; Laboratory Protocol
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                Code: {draftTemplate.examCode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  value={draftTemplate.examName}
                  onChange={(e) => setDraftTemplate((prev) => ({ ...prev, examName: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-[#0176d3]/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Examination Product Code *
                </label>
                <input
                  type="text"
                  value={draftTemplate.examCode}
                  onChange={(e) => setDraftTemplate((prev) => ({ ...prev, examCode: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-[#0176d3]/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Laboratory Discipline / Category *
                </label>
                <select
                  value={draftTemplate.category}
                  onChange={(e) => setDraftTemplate((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] shadow-xs cursor-pointer"
                >
                  <option value="HEMATOLOGY">HEMATOLOGY</option>
                  <option value="CLINICAL MICROSCOPY">CLINICAL MICROSCOPY</option>
                  <option value="DSSM / BACTERIOLOGY">DSSM / BACTERIOLOGY</option>
                  <option value="CLINICAL CHEMISTRY">CLINICAL CHEMISTRY</option>
                  <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                  <option value="IMMUNOLOGY / THYROID">IMMUNOLOGY / THYROID</option>
                  <option value="SEROLOGY">SEROLOGY / HEPATITIS</option>
                  <option value="OTHERS">OTHERS / CYTOLOGY / STAINS</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Default Specimen Matrix
                </label>
                <input
                  type="text"
                  value={draftTemplate.specimenType || ''}
                  onChange={(e) => setDraftTemplate((prev) => ({ ...prev, specimenType: e.target.value }))}
                  placeholder="e.g. Whole Blood (K2-EDTA), Serum (SST), Clean-Catch Urine"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0176d3] shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assay Methodology / Standard Operating Protocol (SOP)
                </label>
                <input
                  type="text"
                  value={draftTemplate.methodology || ''}
                  onChange={(e) => setDraftTemplate((prev) => ({ ...prev, methodology: e.target.value }))}
                  placeholder="e.g. Automated 5-Part Cell Counter & Flow Cytometry, Chemiluminescent Immunoassay (CMIA)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0176d3] shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Analyte Parameters Studio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#0176d3]" />
                  <span>Configured Analyte Parameters ({draftTemplate.parameters.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set biological reference limits, formula expressions, critical alert thresholds, and qualitative options.
                </p>
              </div>

              {/* Quick Add Buttons by Data Type */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddParameter('NUMERIC')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0176d3] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-blue-200"
                  title="Add continuous numeric quantitative parameter"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Numeric</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddParameter('SELECT')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-purple-200"
                  title="Add qualitative dropdown parameter"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Dropdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddParameter('CALCULATED')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-amber-200"
                  title="Add auto-calculated formula parameter"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>+ Formula</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddParameter('TEXT')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-200"
                  title="Add free text morphology/observation parameter"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>+ Text</span>
                </button>
              </div>
            </div>

            {/* Parameter Cards List */}
            <div className="space-y-4">
              {draftTemplate.parameters.map((param, idx) => (
                <div 
                  key={param.id || idx}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-4 shadow-xs"
                >
                  {/* Parameter Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">
                          {param.name || 'Untitled Parameter'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 ml-2">
                          ({param.code || 'NO_CODE'})
                        </span>
                      </div>
                    </div>

                    {/* Card Actions (Up, Down, Duplicate, Delete) */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveParameter(idx, 'UP')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draftTemplate.parameters.length - 1}
                        onClick={() => handleMoveParameter(idx, 'DOWN')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateParameter(idx)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-colors"
                        title="Duplicate Parameter"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteParameter(idx)}
                        className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors"
                        title="Delete Parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 text-xs">
                    
                    {/* Analyte Short Code */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 font-mono flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Analyte Code *</span>
                      </label>
                      <input
                        type="text"
                        value={param.code}
                        onChange={(e) => handleUpdateParamField(idx, 'code', e.target.value.toUpperCase())}
                        placeholder="e.g. WBC, HGB, CREAT"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                      />
                    </div>

                    {/* Analyte Full Display Name */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Report Display Name *
                      </label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => handleUpdateParamField(idx, 'name', e.target.value)}
                        placeholder="e.g. White Blood Cell Count (WBC)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                      />
                    </div>

                    {/* Data Type Selector */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Data Entry Type *
                      </label>
                      <select
                        value={param.dataType}
                        onChange={(e) => handleUpdateParamField(idx, 'dataType', e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] cursor-pointer"
                      >
                        <option value="NUMERIC">🔢 NUMERIC (Continuous Values)</option>
                        <option value="SELECT">📋 SELECT (Qualitative Dropdown)</option>
                        <option value="CALCULATED">🧮 CALCULATED (Formula Computed)</option>
                        <option value="TEXT">📝 TEXT (Microscopic Observation)</option>
                      </select>
                    </div>

                    {/* Specific Settings for NUMERIC */}
                    {param.dataType === 'NUMERIC' && (
                      <div className="sm:col-span-12 grid grid-cols-2 sm:grid-cols-6 gap-3 p-3.5 bg-white border border-slate-200 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={param.unit || ''}
                            onChange={(e) => handleUpdateParamField(idx, 'unit', e.target.value)}
                            placeholder="e.g. mg/dL, %"
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Normal Min
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={param.specMin ?? ''}
                            onChange={(e) => handleUpdateParamField(idx, 'specMin', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="Min"
                            className="w-full px-2.5 py-1 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Normal Max
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={param.specMax ?? ''}
                            onChange={(e) => handleUpdateParamField(idx, 'specMax', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="Max"
                            className="w-full px-2.5 py-1 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-rose-800 mb-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Panic Min (&lt;)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={param.criticalMin ?? ''}
                            onChange={(e) => handleUpdateParamField(idx, 'criticalMin', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="Panic <"
                            className="w-full px-2.5 py-1 bg-rose-50/70 border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-rose-800 mb-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Panic Max (&gt;)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={param.criticalMax ?? ''}
                            onChange={(e) => handleUpdateParamField(idx, 'criticalMax', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="Panic >"
                            className="w-full px-2.5 py-1 bg-rose-50/70 border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Default Baseline
                          </label>
                          <input
                            type="text"
                            value={param.defaultValue || ''}
                            onChange={(e) => handleUpdateParamField(idx, 'defaultValue', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Specific Settings for CALCULATED */}
                    {param.dataType === 'CALCULATED' && (
                      <div className="sm:col-span-12 p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6">
                            <label className="block text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                              <Calculator className="w-3.5 h-3.5 text-amber-700" />
                              <span>Calculation Formula Expression *</span>
                            </label>
                            <input
                              type="text"
                              value={param.calculationFormula || ''}
                              onChange={(e) => handleUpdateParamField(idx, 'calculationFormula', e.target.value)}
                              placeholder="e.g. TCHOL - HDL - (TRIG / 5) or (HBA1C * 28.7) - 46.7"
                              className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={param.unit || ''}
                              onChange={(e) => handleUpdateParamField(idx, 'unit', e.target.value)}
                              placeholder="e.g. mg/dL"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                              Normal Min
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={param.specMin ?? ''}
                              onChange={(e) => handleUpdateParamField(idx, 'specMin', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              placeholder="Min"
                              className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                              Normal Max
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={param.specMax ?? ''}
                              onChange={(e) => handleUpdateParamField(idx, 'specMax', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              placeholder="Max"
                              className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                            />
                          </div>
                        </div>

                        {/* Available Analyte Token Insert Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-bold text-amber-800">Insert Token:</span>
                          {draftTemplate.parameters.filter((p) => p.id !== param.id).map((other) => (
                            <button
                              key={other.id}
                              type="button"
                              onClick={() => {
                                const currentFormula = param.calculationFormula || '';
                                const updatedFormula = currentFormula ? `${currentFormula} ${other.code}` : other.code;
                                handleUpdateParamField(idx, 'calculationFormula', updatedFormula);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                              title={`Click to insert ${other.name}`}
                            >
                              +{other.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specific Settings for SELECT */}
                    {param.dataType === 'SELECT' && (
                      <div className="sm:col-span-12 p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-purple-950">
                            Dropdown Options (Click × to remove, click option to set default)
                          </label>
                        </div>

                        {/* Option Tag Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(param.options || []).map((opt) => {
                            const isDefault = param.defaultValue === opt;
                            return (
                              <span
                                key={opt}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all ${
                                  isDefault
                                    ? 'bg-purple-700 text-white font-bold ring-2 ring-purple-400'
                                    : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100 cursor-pointer'
                                }`}
                                onClick={() => handleUpdateParamField(idx, 'defaultValue', opt)}
                                title={isDefault ? 'Default Selection' : 'Click to set as default'}
                              >
                                <span>{opt}</span>
                                {isDefault && <Check className="w-3 h-3 text-purple-200" />}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextOpts = (param.options || []).filter((o) => o !== opt);
                                    handleUpdateParamField(idx, 'options', nextOpts);
                                    if (param.defaultValue === opt) {
                                      handleUpdateParamField(idx, 'defaultValue', nextOpts[0] || '');
                                    }
                                  }}
                                  className="hover:text-rose-600 rounded-full p-0.5 ml-0.5"
                                  title="Remove Option"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Add Option Input */}
                        <div className="flex items-center gap-2 max-w-md pt-1">
                          <input
                            type="text"
                            placeholder="Type new option (e.g. REACTIVE, TRACE, 1+) and press Enter..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.currentTarget.value || '').trim();
                                if (val && !(param.options || []).includes(val)) {
                                  const updatedOpts = [...(param.options || []), val];
                                  handleUpdateParamField(idx, 'options', updatedOpts);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs text-purple-950 placeholder-purple-400 focus:outline-none focus:border-purple-600 shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Specific Settings for TEXT */}
                    {param.dataType === 'TEXT' && (
                      <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Unit / Field Tag (Optional)
                          </label>
                          <input
                            type="text"
                            value={param.unit || ''}
                            onChange={(e) => handleUpdateParamField(idx, 'unit', e.target.value)}
                            placeholder="e.g. /hpf, /lpf, Visual"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Standard Reference Note / Baseline
                          </label>
                          <input
                            type="text"
                            value={param.normalText || ''}
                            onChange={(e) => handleUpdateParamField(idx, 'normalText', e.target.value)}
                            placeholder="e.g. Normal baseline. None seen."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save & Reset Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Modifications apply immediately to laboratory sample entry forms and Certificate of Analysis printouts.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Live Interactive Laboratory Sandbox Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#0176d3]" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live Laboratory Entry &amp; CoA Preview Bench
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Interactive Validation
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Test entering patient values below to verify auto-calculations, normal reference intervals, and critical panic flags in real time.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">Analyte Parameter</th>
                    <th className="p-3">Test Value Input</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Biological Reference</th>
                    <th className="p-3">Clinical Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftTemplate.parameters.map((param) => {
                    const rawVal = computedSandboxValues[param.id] || '';
                    const flag = getSandboxFlag(param, rawVal);

                    return (
                      <tr key={param.id} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{param.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{param.code}</div>
                        </td>

                        <td className="p-3">
                          {param.dataType === 'SELECT' ? (
                            <select
                              value={sandboxValues[param.id] || ''}
                              onChange={(e) => setSandboxValues((prev) => ({ ...prev, [param.id]: e.target.value }))}
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                            >
                              {(param.options || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : param.dataType === 'CALCULATED' ? (
                            <div className="font-mono font-bold text-xs text-amber-950 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                              {rawVal || '—'}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={sandboxValues[param.id] || ''}
                              onChange={(e) => setSandboxValues((prev) => ({ ...prev, [param.id]: e.target.value }))}
                              placeholder="Enter value"
                              className="w-32 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                            />
                          )}
                        </td>

                        <td className="p-3 font-mono text-slate-500">
                          {param.unit || '—'}
                        </td>

                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {param.dataType === 'NUMERIC' || param.dataType === 'CALCULATED' ? (
                            typeof param.specMin === 'number' && typeof param.specMax === 'number' ? (
                              <span>{param.specMin} - {param.specMax}</span>
                            ) : '—'
                          ) : (
                            param.normalText || param.defaultValue || '—'
                          )}
                        </td>

                        <td className="p-3">
                          {flag === 'NORMAL' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              NORMAL
                            </span>
                          )}
                          {flag === 'LOW' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              LOW
                            </span>
                          )}
                          {flag === 'HIGH' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                              HIGH
                            </span>
                          )}
                          {flag === 'CRITICAL' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
                              CRITICAL
                            </span>
                          )}
                          {flag === 'REACTIVE' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                              REACTIVE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* New Template Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0176d3]" />
                <h3 className="text-base font-black text-slate-900">
                  Create New Examination Template
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Examination Product Code *
                </label>
                <input
                  type="text"
                  value={newExamCode}
                  onChange={(e) => setNewExamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 1099, CHEM-01"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="e.g. C-REACTIVE PROTEIN (QUANTITATIVE)"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Discipline / Category *
                  </label>
                  <select
                    value={newExamCategory}
                    onChange={(e) => setNewExamCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="HEMATOLOGY">HEMATOLOGY</option>
                    <option value="CLINICAL MICROSCOPY">CLINICAL MICROSCOPY</option>
                    <option value="DSSM / BACTERIOLOGY">DSSM / BACTERIOLOGY</option>
                    <option value="CLINICAL CHEMISTRY">CLINICAL CHEMISTRY</option>
                    <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                    <option value="IMMUNOLOGY / THYROID">IMMUNOLOGY / THYROID</option>
                    <option value="SEROLOGY">SEROLOGY / HEPATITIS</option>
                    <option value="OTHERS">OTHERS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Standard Tariff (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newExamPrice}
                    onChange={(e) => setNewExamPrice(e.target.value)}
                    placeholder="300.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Default Specimen Matrix
                </label>
                <input
                  type="text"
                  value={newExamSpecimen}
                  onChange={(e) => setNewExamSpecimen(e.target.value)}
                  placeholder="e.g. Serum (SST Gel Separator)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assay Methodology
                </label>
                <input
                  type="text"
                  value={newExamMethod}
                  onChange={(e) => setNewExamMethod(e.target.value)}
                  placeholder="e.g. Immunoturbidimetric High Sensitivity Assay"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
