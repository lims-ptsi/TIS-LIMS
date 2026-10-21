import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Filter, 
  Download, 
  RotateCcw, 
  Clock, 
  Tag, 
  Layers, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Sparkles,
  FileSpreadsheet,
  ArrowUpDown,
  Sliders,
  FileText,
  ExternalLink,
  Send,
  Building2,
  ChevronDown
} from 'lucide-react';
import { 
  ExaminationItem, 
  ExaminationCategory, 
  CorporateCategory,
  AssignedFormType,
  ASSIGNED_FORM_OPTIONS,
  DEFAULT_SEND_OUT_PLATFORMS,
  getFormMeta,
  getDefaultAssignedForm,
  EXAMINATION_CATEGORIES, 
  CORPORATE_CATEGORIES, 
  EXAMINATION_CATALOG, 
  formatCurrency,
  isStandardSchemeExam,
  isCorporateSchemeExam,
  getExaminationCategory 
} from '../../data/examinationCatalog';

interface ExaminationsViewProps {
  examinations: ExaminationItem[];
  onUpdateExamination: (updated: ExaminationItem, originalCode: string) => void;
  /** Dedicated persist path for Form 1–10 / Send Out — always saves immediately */
  onAssignForm?: (examCode: string, assignedForm: AssignedFormType, sendOutPlatform?: string) => void;
  onAddExamination: (newItem: ExaminationItem) => boolean | void;
  onDeleteExamination: (code: string) => void;
  onResetToDefault: () => void;
  onNavigateToTemplates?: (examCode?: string) => void;
}

export const ExaminationsView: React.FC<ExaminationsViewProps> = ({
  examinations,
  onUpdateExamination,
  onAssignForm,
  onAddExamination,
  onDeleteExamination,
  onResetToDefault,
  onNavigateToTemplates,
}) => {
  // Filters & State
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [formFilter, setFormFilter] = useState<string>('ALL'); // 'ALL' | AssignedFormType
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [priceSchemeFilter, setPriceSchemeFilter] = useState<'ALL' | 'STANDARD' | 'CORPORATE'>('STANDARD');
  const [sortBy, setSortBy] = useState<'CODE' | 'NAME' | 'PRICE_ASC' | 'PRICE_DESC' | 'CORP_PRICE_DESC' | 'TAT' | 'FORM'>('CODE');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<ExaminationItem | null>(null);
  const [originalCodeForEdit, setOriginalCodeForEdit] = useState<string>('');

  // Quick platform editor modal for Send Out
  const [platformEditExam, setPlatformEditExam] = useState<ExaminationItem | null>(null);
  const [platformEditText, setPlatformEditText] = useState<string>('');

  // Delete confirmation
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string | null>(null);

  // Form State for Editing/Adding
  const [formCode, setFormCode] = useState('');
  const [formCorporateCode, setFormCorporateCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ExaminationCategory>('HEMATOLOGY');
  const [formCorporateCategory, setFormCorporateCategory] = useState<CorporateCategory | ''>('BLOOD CHEMISTRY');
  const [formAssignedForm, setFormAssignedForm] = useState<AssignedFormType>('Form 1');
  const [formSendOutPlatform, setFormSendOutPlatform] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(300);
  const [formCorporatePrice, setFormCorporatePrice] = useState<number | ''>(450);
  const [formSpecimenType, setFormSpecimenType] = useState('Whole Blood (K2-EDTA)');
  const [formTatHours, setFormTatHours] = useState<number>(4);
  const [formMethodology, setFormMethodology] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Open Edit Modal
  const handleOpenEdit = (exam: ExaminationItem) => {
    const currentForm = exam.assignedForm || getDefaultAssignedForm(exam);
    setSelectedExamForEdit(exam);
    setOriginalCodeForEdit(exam.code);
    setFormCode(exam.code);
    setFormCorporateCode(exam.corporateCode || '');
    setFormName(exam.name);
    setFormCategory(exam.category);
    setFormCorporateCategory(exam.corporateCategory || 'BLOOD CHEMISTRY');
    setFormAssignedForm(currentForm);
    setFormSendOutPlatform(exam.sendOutPlatform || (currentForm === 'Send Out' ? 'Hi-Precision Diagnostics' : ''));
    setFormPrice(exam.price);
    setFormCorporatePrice(exam.corporatePrice !== undefined ? exam.corporatePrice : '');
    setFormSpecimenType(exam.specimenType || 'Whole Blood (K2-EDTA)');
    setFormTatHours(exam.turnaroundHours ?? 4);
    setFormMethodology(exam.methodology || '');
    setFormNotes(exam.notes || '');
    setFormIsActive(exam.isActive !== false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    // Generate next available numerical code suggestion
    const existingCodes = examinations.map(e => parseInt(e.code, 10)).filter(n => !isNaN(n));
    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 1000;
    const suggestedCode = String(maxCode + 1);

    setFormCode(suggestedCode);
    setFormCorporateCode('');
    setFormName('');
    setFormCategory('HEMATOLOGY');
    setFormCorporateCategory('BLOOD CHEMISTRY');
    setFormAssignedForm('Form 1');
    setFormSendOutPlatform('');
    setFormPrice(250);
    setFormCorporatePrice('');
    setFormSpecimenType('Whole Blood (K2-EDTA)');
    setFormTatHours(4);
    setFormMethodology('Automated Hematology Analyzer / Photometric');
    setFormNotes('');
    setFormIsActive(true);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Direct Inline Form Assignment Handler (Dropdown change in table)
  const handleAssignForm = (exam: ExaminationItem, newForm: AssignedFormType) => {
    const isSendOut = newForm === 'Send Out';
    const platform = isSendOut
      ? (exam.sendOutPlatform || 'Hi-Precision Diagnostics')
      : undefined;

    if (onAssignForm) {
      onAssignForm(exam.code, newForm, platform);
      return;
    }

    // Fallback: full catalog update path
    const updated: ExaminationItem = {
      ...exam,
      assignedForm: newForm,
      sendOutPlatform: platform,
    };
    onUpdateExamination(updated, exam.code);
  };

  // Open Quick Platform Editor Modal for Send Out
  const handleOpenPlatformEdit = (exam: ExaminationItem) => {
    setPlatformEditExam(exam);
    setPlatformEditText(exam.sendOutPlatform || 'Hi-Precision Diagnostics');
  };

  // Save Quick Platform Editor Modal
  const handleSavePlatformEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformEditExam) return;
    const platform = platformEditText.trim() || 'Hi-Precision Diagnostics';

    if (onAssignForm) {
      onAssignForm(platformEditExam.code, 'Send Out', platform);
      setPlatformEditExam(null);
      return;
    }

    const updated: ExaminationItem = {
      ...platformEditExam,
      assignedForm: 'Send Out',
      sendOutPlatform: platform,
    };
    onUpdateExamination(updated, platformEditExam.code);
    setPlatformEditExam(null);
  };


  // Save Edit Handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    const cleanCorporateCode = formCorporateCode.trim().toUpperCase();
    const cleanName = formName.trim().toUpperCase();

    if (!cleanCode) {
      setFormError('Product Code is required.');
      return;
    }
    if (!cleanName) {
      setFormError('Examination Name is required.');
      return;
    }
    if (isNaN(formPrice) || formPrice < 0) {
      setFormError('Standard Price must be a valid positive amount.');
      return;
    }

    // Check if new code conflicts with another item
    if (cleanCode !== originalCodeForEdit) {
      const isCodeTaken = examinations.some(e => e.code.toUpperCase() === cleanCode);
      if (isCodeTaken) {
        setFormError(`Product Code "${cleanCode}" is already in use by another examination.`);
        return;
      }
    }

    const updatedItem: ExaminationItem = {
      code: cleanCode,
      corporateCode: cleanCorporateCode || undefined,
      name: cleanName,
      category: formCategory,
      corporateCategory: (formCorporatePrice !== '' && formCorporateCategory) ? (formCorporateCategory as CorporateCategory) : undefined,
      assignedForm: formAssignedForm,
      sendOutPlatform: formAssignedForm === 'Send Out' ? (formSendOutPlatform.trim() || 'Hi-Precision Diagnostics') : undefined,
      price: Number(formPrice),
      corporatePrice: formCorporatePrice !== '' ? Number(formCorporatePrice) : undefined,
      specimenType: formSpecimenType.trim(),
      turnaroundHours: Number(formTatHours) || 4,
      methodology: formMethodology.trim(),
      notes: formNotes.trim(),
      isActive: formIsActive,
    };

    onUpdateExamination(updatedItem, originalCodeForEdit);
    setIsEditModalOpen(false);
  };

  // Save Add Handler
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    const cleanCorporateCode = formCorporateCode.trim().toUpperCase();
    const cleanName = formName.trim().toUpperCase();

    if (!cleanCode) {
      setFormError('Product Code is required.');
      return;
    }
    if (!cleanName) {
      setFormError('Examination Name is required.');
      return;
    }
    if (isNaN(formPrice) || formPrice < 0) {
      setFormError('Standard Price must be a valid positive amount.');
      return;
    }

    // Check if code is already taken
    const isCodeTaken = examinations.some(e => e.code.toUpperCase() === cleanCode);
    if (isCodeTaken) {
      setFormError(`Product Code "${cleanCode}" already exists. Please choose a unique code.`);
      return;
    }

    // Check if name is already taken
    const isNameTaken = examinations.some(e => e.name.toUpperCase() === cleanName);
    if (isNameTaken) {
      setFormError(`An examination named "${cleanName}" already exists.`);
      return;
    }

    const newItem: ExaminationItem = {
      code: cleanCode,
      corporateCode: cleanCorporateCode || undefined,
      name: cleanName,
      category: formCategory,
      corporateCategory: (formCorporatePrice !== '' && formCorporateCategory) ? (formCorporateCategory as CorporateCategory) : undefined,
      assignedForm: formAssignedForm,
      sendOutPlatform: formAssignedForm === 'Send Out' ? (formSendOutPlatform.trim() || 'Hi-Precision Diagnostics') : undefined,
      price: Number(formPrice),
      corporatePrice: formCorporatePrice !== '' ? Number(formCorporatePrice) : undefined,
      specimenType: formSpecimenType.trim() || 'Whole Blood (K2-EDTA)',
      turnaroundHours: Number(formTatHours) || 4,
      methodology: formMethodology.trim() || 'Standard Automated Method',
      notes: formNotes.trim(),
      isActive: formIsActive,
    };

    onAddExamination(newItem);
    setIsAddModalOpen(false);
  };

  // Toggle Status Handler
  const handleToggleStatus = (exam: ExaminationItem) => {
    const updated: ExaminationItem = {
      ...exam,
      isActive: exam.isActive === false ? true : false,
    };
    onUpdateExamination(updated, exam.code);
  };

  // Filtered and Sorted Examinations
  const filteredExaminations = useMemo(() => {
    const isCorpScheme = priceSchemeFilter === 'CORPORATE';

    return examinations
      .filter((item) => {
        const itemForm = item.assignedForm || getDefaultAssignedForm(item);

        // Category Filter
        const matchesCategory = 
          activeCategory === 'ALL' || 
          (isCorpScheme ? item.corporateCategory === activeCategory : item.category === activeCategory);

        // Assigned Form / Routing Filter
        const matchesForm = 
          formFilter === 'ALL' ||
          itemForm === formFilter;
        
        // Status Filter
        const matchesStatus = 
          statusFilter === 'ALL' || 
          (statusFilter === 'ACTIVE' && item.isActive !== false) ||
          (statusFilter === 'INACTIVE' && item.isActive === false);

        // Price Scheme Filter
        // ALL = everything
        // STANDARD = OPD/PhilHealth/Indigent/Employee/Projects sheets only
        // CORPORATE = official Corporate HIS tariff sheet only
        const matchesScheme = 
          priceSchemeFilter === 'ALL' ||
          (priceSchemeFilter === 'STANDARD' && isStandardSchemeExam(item)) ||
          (isCorpScheme && isCorporateSchemeExam(item));

        // Search Query
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.corporateCode && item.corporateCode.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.corporateCategory && item.corporateCategory.toLowerCase().includes(q)) ||
          itemForm.toLowerCase().includes(q) ||
          (item.sendOutPlatform && item.sendOutPlatform.toLowerCase().includes(q)) ||
          (item.specimenType && item.specimenType.toLowerCase().includes(q)) ||
          (item.methodology && item.methodology.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q));

        return matchesCategory && matchesForm && matchesStatus && matchesScheme && matchesQuery;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'CODE':
            return a.code.localeCompare(b.code, undefined, { numeric: true });
          case 'NAME':
            return a.name.localeCompare(b.name);
          case 'PRICE_ASC':
            return a.price - b.price;
          case 'PRICE_DESC':
            return b.price - a.price;
          case 'CORP_PRICE_DESC':
            return (b.corporatePrice || b.price) - (a.corporatePrice || a.price);
          case 'TAT':
            return (a.turnaroundHours || 0) - (b.turnaroundHours || 0);
          case 'FORM':
            return (a.assignedForm || getDefaultAssignedForm(a)).localeCompare(b.assignedForm || getDefaultAssignedForm(b));
          default:
            return 0;
        }
      });
  }, [examinations, activeCategory, formFilter, statusFilter, priceSchemeFilter, searchQuery, sortBy]);

  // Pool of exams for the active price scheme (drives totals / category pills)
  const schemePool = useMemo(() => {
    if (priceSchemeFilter === 'CORPORATE') {
      return examinations.filter((e) => isCorporateSchemeExam(e));
    }
    if (priceSchemeFilter === 'STANDARD') {
      return examinations.filter((e) => isStandardSchemeExam(e));
    }
    return examinations;
  }, [examinations, priceSchemeFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = schemePool.length;
    const activeCount = schemePool.filter(e => e.isActive !== false).length;
    const inactiveCount = total - activeCount;
    const inHouseCount = schemePool.filter(e => (e.assignedForm || getDefaultAssignedForm(e)) !== 'Send Out').length;
    const sendOutCount = schemePool.filter(e => (e.assignedForm || getDefaultAssignedForm(e)) === 'Send Out').length;
    const avgFee = total > 0 ? schemePool.reduce((acc, curr) => acc + curr.price, 0) / total : 0;
    const minPrice = total > 0 ? Math.min(...schemePool.map(e => e.price)) : 0;
    const maxPrice = total > 0 ? Math.max(...schemePool.map(e => e.price)) : 0;
    
    return {
      total,
      activeCount,
      inactiveCount,
      inHouseCount,
      sendOutCount,
      avgFee,
      minPrice,
      maxPrice,
      departments: EXAMINATION_CATEGORIES.length,
      fullCatalogTotal: examinations.length,
      standardTotal: examinations.filter((e) => isStandardSchemeExam(e)).length,
    };
  }, [examinations, schemePool]);

  // Department Badge Colors
  const getCategoryColor = (cat: ExaminationCategory) => {
    switch (cat) {
      case 'HEMATOLOGY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CLINICAL MICROSCOPY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DSSM / BACTERIOLOGY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CLINICAL CHEMISTRY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MICROBIOLOGY':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'IMMUNOLOGY / THYROID':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SEROLOGY':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'OTHERS':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Product Code', 'Corporate Code', 'Examination Name', 'Category', 'Standard Price (PHP)', 'Corporate Price (PHP)', 'Specimen Type', 'TAT (Hours)', 'Methodology', 'Status', 'Notes'];
    const rows = examinations.map(e => [
      `"${e.code}"`,
      `"${e.corporateCode || ''}"`,
      `"${e.name}"`,
      `"${e.category}"`,
      e.price.toFixed(2),
      e.corporatePrice !== undefined ? e.corporatePrice.toFixed(2) : '',
      `"${e.specimenType || ''}"`,
      e.turnaroundHours || 4,
      `"${e.methodology || ''}"`,
      e.isActive !== false ? 'ACTIVE' : 'INACTIVE',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LIMS_Examinations_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 text-slate-900">
      
      {/* 1. Header Row */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Laboratory Master Setup</span>
              <span className="text-[10px] bg-blue-50 text-[#0176d3] px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                MASTER CATALOG &amp; CORPORATE TARIFFS
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Examinations Catalog &amp; Test Offerings
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure product codes, test names, department categories, standard rates, corporate pricelist tariffs, and SLAs.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToTemplates && (
            <button
              type="button"
              onClick={() => onNavigateToTemplates()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
              title="Open Diagnostic Result Templates & Parameters Editor"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span>Result Templates Editor</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#d8dde6] text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
            title="Download CSV Price Sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-[#d8dde6] text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
            title="Reset Catalog to PTS Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Examination</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#d8dde6] rounded-md p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Total Catalog</span>
            <FlaskConical className="w-3.5 h-3.5 text-[#0176d3]" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
            {metrics.total} Tests
          </div>
          <div className="text-[10px] text-slate-500">
            {priceSchemeFilter === 'STANDARD'
              ? 'OPD / PhilHealth / Indigent / Employee / Projects sheets'
              : priceSchemeFilter === 'CORPORATE'
              ? 'Official Corporate HIS tariff sheet'
              : `Full master catalog (${metrics.fullCatalogTotal})`}
          </div>
        </div>

        <div className="bg-white border border-[#d8dde6] rounded-md p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Form Assignment</span>
            <FileText className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono flex items-center gap-1.5">
            <span>10 Forms <span className="text-purple-700 text-sm">({metrics.inHouseCount})</span></span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-800 text-xs font-semibold">{metrics.sendOutCount} Send Out</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Standard in-house vs outsourced
          </div>
        </div>

        <div className="bg-white border border-[#d8dde6] rounded-md p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">TRF Active Status</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
            {metrics.activeCount} Active
          </div>
          <div className="text-[10px] text-slate-500">
            {metrics.inactiveCount > 0 ? `${metrics.inactiveCount} tests disabled` : 'All available for TRF order'}
          </div>
        </div>

        <div className="bg-white border border-[#d8dde6] rounded-md p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Corporate Tier</span>
            <Tag className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-800 mt-0.5 font-mono">
            {examinations.filter((e) => isCorporateSchemeExam(e)).length} Rates
          </div>
          <div className="text-[10px] text-slate-500">
            Official Corporate HIS tariff sheet
          </div>
        </div>
      </div>

      {/* 3. Filter Controls & Search */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-3 shadow-sm space-y-2.5">
        {/* Row 1: Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, test name, form, specimen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Form Dropdown, Status, Scheme, Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Form Routing Dropdown Filter */}
            <div className="flex items-center gap-1">
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-700 focus:outline-none focus:border-[#0176d3] font-medium cursor-pointer"
              >
                <option value="ALL">All Forms &amp; Send Out ({schemePool.length})</option>
                <optgroup label="10 Standard In-House Forms">
                  {ASSIGNED_FORM_OPTIONS.filter((f) => !f.isSendOut).map((opt) => {
                    const cnt = schemePool.filter((e) => (e.assignedForm || getDefaultAssignedForm(e)) === opt.id).length;
                    return (
                      <option key={opt.id} value={opt.id}>
                        {opt.shortName} ({cnt})
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Outsourced Referral">
                  <option value="Send Out">
                    Send Out ({schemePool.filter((e) => (e.assignedForm || getDefaultAssignedForm(e)) === 'Send Out').length})
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Price Scheme Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPriceSchemeFilter('ALL');
                  setActiveCategory('ALL');
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceSchemeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show all examinations (standard + corporate columns)"
              >
                All Schemes
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceSchemeFilter('STANDARD');
                  setActiveCategory('ALL');
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceSchemeFilter === 'STANDARD' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="OPD, PhilHealth, Indigent, Pre-Employment/Employee, Projects — without Corporate tariff view"
              >
                Without Corporate
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceSchemeFilter('CORPORATE');
                  setActiveCategory('ALL');
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceSchemeFilter === 'CORPORATE' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Official Corporate HIS tariff sheet only (not every exam with a corporate price)"
              >
                Corporate Tariffs
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'INACTIVE' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disabled
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-700 focus:outline-none focus:border-[#0176d3] font-medium cursor-pointer"
              >
                <option value="CODE">Sort by: Code</option>
                <option value="NAME">Sort by: Name (A-Z)</option>
                <option value="FORM">Sort by: Form</option>
                <option value="PRICE_ASC">Sort: Price (Lowest)</option>
                <option value="PRICE_DESC">Sort: Price (Highest)</option>
                <option value="CORP_PRICE_DESC">Sort: Corporate Price</option>
                <option value="TAT">Sort: TAT SLA</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Department Category Tabs (Single, Clean Row) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'ALL'
                ? 'bg-[#0176d3] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>ALL CATEGORIES</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeCategory === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {schemePool.length}
            </span>
          </button>

          {(priceSchemeFilter === 'CORPORATE' ? CORPORATE_CATEGORIES : EXAMINATION_CATEGORIES).map((cat) => {
            const count = priceSchemeFilter === 'CORPORATE'
              ? schemePool.filter(e => e.corporateCategory === cat).length
              : schemePool.filter(e => e.category === cat).length;
            const isSelected = activeCategory === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0176d3] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Examination Catalog Table */}
      <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#d8dde6] text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3 min-w-[200px]">Examination Name</th>
                <th className="py-2.5 px-3 min-w-[120px]">Department</th>
                <th className="py-2.5 px-3 min-w-[170px]">Assigned Form</th>
                <th className="py-2.5 px-3 w-24 text-right">
                  {priceSchemeFilter === 'CORPORATE' ? 'Corporate Fee' : 'Standard Fee'}
                </th>
                {priceSchemeFilter !== 'STANDARD' && (
                  <th className="py-2.5 px-3 w-24 text-right">
                    {priceSchemeFilter === 'CORPORATE' ? 'Std Fee (ref)' : 'Corporate Fee'}
                  </th>
                )}
                <th className="py-2.5 px-3 min-w-[140px]">Specimen</th>
                <th className="py-2.5 px-3 w-20">TAT SLA</th>
                <th className="py-2.5 px-3 min-w-[150px]">Methodology</th>
                <th className="py-2.5 px-3 w-20 text-center">Status</th>
                <th className="py-2.5 px-3 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExaminations.map((exam) => {
                const isActive = exam.isActive !== false;
                const currentForm = exam.assignedForm || getDefaultAssignedForm(exam);
                const isSendOut = currentForm === 'Send Out';

                return (
                  <tr 
                    key={exam.code} 
                    className={`hover:bg-blue-50/40 transition-colors ${
                      !isActive ? 'bg-slate-50/60 opacity-65' : ''
                    }`}
                  >
                    {/* 1. Code & Corporate Code */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-extrabold text-xs text-[#0176d3] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 self-start">
                          {priceSchemeFilter === 'CORPORATE' && exam.corporateCode
                            ? exam.corporateCode
                            : exam.code}
                        </span>
                        {priceSchemeFilter !== 'STANDARD' && exam.corporateCode && priceSchemeFilter !== 'CORPORATE' && (
                          <span className="font-mono font-bold text-[9px] text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 self-start" title="Corporate HIS Code">
                            CORP: {exam.corporateCode}
                          </span>
                        )}
                        {priceSchemeFilter === 'CORPORATE' && (
                          <span className="font-mono font-bold text-[9px] text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-200 self-start" title="Standard product code">
                            STD: {exam.code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Examination Name & Notes */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 text-xs uppercase leading-tight">
                        {priceSchemeFilter === 'CORPORATE' && exam.corporateName
                          ? exam.corporateName
                          : exam.name}
                      </div>
                      {priceSchemeFilter !== 'STANDARD' && exam.corporateName && exam.corporateName !== exam.name && priceSchemeFilter !== 'CORPORATE' && (
                        <div className="text-[10px] text-amber-700 font-semibold font-mono flex items-center gap-1 mt-0.5" title="Approved Corporate Tariff Test Name">
                          <Building2 className="w-2.5 h-2.5" />
                          <span>Corp: {exam.corporateName}</span>
                        </div>
                      )}
                      {exam.notes && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-normal line-clamp-1" title={exam.notes}>
                          {exam.notes}
                        </div>
                      )}
                    </td>

                    {/* 3. Department */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border self-start ${getCategoryColor(exam.category)}`}>
                          {exam.category}
                        </span>
                        {priceSchemeFilter === 'CORPORATE' && exam.corporateCategory && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 self-start" title="Corporate Tariff Billing Group">
                            CORP: {exam.corporateCategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Assigned Form Dropdown (Clean, Compact) */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={currentForm}
                          onChange={(e) => handleAssignForm(exam, e.target.value as AssignedFormType)}
                          className={`text-[11px] font-semibold py-1 px-2 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0176d3] transition-colors ${
                            isSendOut
                              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <optgroup label="10 Standard Forms">
                            {ASSIGNED_FORM_OPTIONS.filter((f) => !f.isSendOut).map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.shortName}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Outsourced">
                            <option value="Send Out">Send Out</option>
                          </optgroup>
                        </select>

                        {isSendOut && (
                          <button
                            type="button"
                            onClick={() => handleOpenPlatformEdit(exam)}
                            className="text-[10px] text-amber-900 hover:text-black font-semibold bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5 cursor-pointer shrink-0"
                            title={`Platform: ${exam.sendOutPlatform || 'Hi-Precision Diagnostics'} (Click to edit)`}
                          >
                            <span className="max-w-[70px] truncate">{exam.sendOutPlatform?.split(' ')[0] || 'External'}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-amber-700" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 5. Primary fee (Standard for non-corporate views; Corporate fee when Corporate filter) */}
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      {priceSchemeFilter === 'CORPORATE' ? (
                        exam.corporatePrice !== undefined ? (
                          <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                            {formatCurrency(exam.corporatePrice)}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-400">—</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-200">
                          {formatCurrency(exam.price)}
                        </span>
                      )}
                    </td>

                    {/* 6. Secondary fee column — hidden in "Without Corporate" view */}
                    {priceSchemeFilter !== 'STANDARD' && (
                      <td className="py-2 px-3 whitespace-nowrap text-right">
                        {priceSchemeFilter === 'CORPORATE' ? (
                          <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-200">
                            {formatCurrency(exam.price)}
                          </span>
                        ) : exam.corporatePrice !== undefined ? (
                          <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                            {formatCurrency(exam.corporatePrice)}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-400">—</span>
                        )}
                      </td>
                    )}

                    {/* 7. Specimen Requirement */}
                    <td className="py-2 px-3">
                      <span className="text-slate-700 text-[11px] block line-clamp-1" title={exam.specimenType}>
                        {exam.specimenType || 'Whole Blood'}
                      </span>
                    </td>

                    {/* 8. Turnaround SLA */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {(exam.turnaroundHours ?? 4) >= 24 
                            ? `${((exam.turnaroundHours ?? 4) / 24).toFixed(0)}d (${exam.turnaroundHours}h)`
                            : `${exam.turnaroundHours ?? 4}h`}
                        </span>
                      </div>
                    </td>

                    {/* 9. Methodology */}
                    <td className="py-2 px-3">
                      <span className="text-slate-600 text-[11px] line-clamp-1" title={exam.methodology}>
                        {exam.methodology || 'Standard Method'}
                      </span>
                    </td>

                    {/* 10. Status */}
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(exam)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to Toggle Active/Inactive"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{isActive ? 'ACTIVE' : 'OFF'}</span>
                      </button>
                    </td>

                    {/* 11. Actions */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onNavigateToTemplates && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTemplates(exam.code)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Configure Result Template & Parameters"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#0176d3]" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exam)}
                          className="p-1 text-slate-600 hover:text-[#0176d3] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit Full Examination Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmCode(exam.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Examination"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredExaminations.length === 0 && (
          <div className="p-8 text-center bg-white space-y-2">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Examinations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No examination matches your current search criteria &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
                setStatusFilter('ALL');
                setPriceSchemeFilter('ALL');
              }}
              className="mt-2 px-3 py-1.5 bg-blue-50 text-[#0176d3] hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Table Footer Summary */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-[#d8dde6] flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 font-mono">{filteredExaminations.length}</strong> of{' '}
            <strong className="text-slate-800 font-mono">{examinations.length}</strong> total examinations
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{metrics.activeCount} Active</span>
            </span>
            {metrics.inactiveCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>{metrics.inactiveCount} Disabled</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. EDIT EXAMINATION MODAL                                 */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    EDIT EXAMINATION DETAILS &amp; PRICING
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Code: <strong className="font-mono text-[#0176d3]">{originalCodeForEdit}</strong> · {selectedExamForEdit?.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form id="edit-exam-form" onSubmit={handleSaveEdit} className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* 1. Product Code (Standard) */}
                <div className="sm:col-span-4">
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    STANDARD CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-[#0176d3]"
                  />
                </div>

                {/* 2. Corporate HIS Code */}
                <div className="sm:col-span-4">
                  <label className="text-slate-700 font-bold block mb-1 text-[11px] flex items-center gap-1">
                    <span>CORPORATE CODE</span>
                    <span className="text-[9px] font-normal text-amber-700">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formCorporateCode}
                    onChange={(e) => setFormCorporateCode(e.target.value.toUpperCase())}
                    placeholder="E.G. 1260"
                    className="w-full px-3 py-1.5 rounded border border-amber-200 bg-amber-50/40 text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. Department Category */}
                <div className="sm:col-span-4">
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    DEPARTMENT *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExaminationCategory)}
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-semibold text-xs bg-white focus:outline-none focus:border-[#0176d3] cursor-pointer"
                  >
                    {EXAMINATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Examination Name */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  EXAMINATION NAME (ALL CAPS) *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value.toUpperCase())}
                  placeholder="E.G. COMPLETE BLOOD COUNT WITH PLATELET"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-bold text-xs uppercase focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* Form Assignment & Send-Out Routing */}
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-slate-800 text-xs">
                      ASSIGNED RESULT FORM / SEND-OUT ROUTING *
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                    10 Forms or External Referral
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className={formAssignedForm === 'Send Out' ? 'sm:col-span-5' : 'sm:col-span-12'}>
                    <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                      ROUTED IN-HOUSE FORM *
                    </label>
                    <select
                      value={formAssignedForm}
                      onChange={(e) => {
                        const val = e.target.value as AssignedFormType;
                        setFormAssignedForm(val);
                        if (val === 'Send Out' && !formSendOutPlatform) {
                          setFormSendOutPlatform('Hi-Precision Diagnostics');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-[#0176d3] cursor-pointer"
                    >
                      <optgroup label="10 Standard In-House Result Forms">
                        {ASSIGNED_FORM_OPTIONS.filter((f) => !f.isSendOut).map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="External Referral Routing">
                        <option value="Send Out">
                          Send Out (External Referral Platform)
                        </option>
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formAssignedForm === 'Send Out' 
                        ? 'Not included on in-house forms. Specimen is sent out to partner referral lab.'
                        : `Routes this test to ${getFormMeta(formAssignedForm).name}. In-house forms will be generated later.`}
                    </p>
                  </div>

                  {formAssignedForm === 'Send Out' && (
                    <div className="sm:col-span-7 animate-fadeIn">
                      <label className="text-amber-900 font-bold block mb-1 text-[11px]">
                        SEND-OUT REFERRAL PLATFORM / PARTNER LAB *
                      </label>
                      <input
                        type="text"
                        required
                        list="edit-sendout-platforms"
                        value={formSendOutPlatform}
                        onChange={(e) => setFormSendOutPlatform(e.target.value)}
                        placeholder="e.g. Hi-Precision Diagnostics"
                        className="w-full px-3 py-1.5 rounded border border-amber-300 bg-amber-50/50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600"
                      />
                      <datalist id="edit-sendout-platforms">
                        {DEFAULT_SEND_OUT_PLATFORMS.map((plat) => (
                          <option key={plat} value={plat} />
                        ))}
                      </datalist>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {DEFAULT_SEND_OUT_PLATFORMS.slice(0, 3).map((plat) => (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => setFormSendOutPlatform(plat)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer font-medium"
                          >
                            {plat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Rates & TAT SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Standard Price (PHP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold text-[11px]">STANDARD FEE (₱) *</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-slate-500 font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-[#0176d3]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    OPD, PhilHealth, etc.
                  </span>
                </div>

                {/* Corporate Price (PHP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-amber-800 font-bold text-[11px]">CORPORATE FEE (₱)</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-amber-600 font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Same as standard"
                      value={formCorporatePrice}
                      onChange={(e) => setFormCorporatePrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 rounded border border-amber-300 bg-amber-50/40 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                    Corporate / HMO tariff
                  </span>
                </div>

                {/* Corporate Category */}
                <div>
                  <label className="text-amber-800 font-bold block mb-1 text-[11px]">
                    CORPORATE CATEGORY
                  </label>
                  <select
                    value={formCorporateCategory}
                    onChange={(e) => setFormCorporateCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded border border-amber-300 bg-amber-50/40 text-slate-900 font-semibold text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">NONE</option>
                    {CORPORATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                    PTS Tariffs Group
                  </span>
                </div>

                {/* TAT in Hours */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    TAT SLA (HOURS) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTatHours}
                    onChange={(e) => setFormTatHours(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono text-xs focus:outline-none focus:border-[#0176d3]"
                  />
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    e.g. 4 for 4h, 24 for 1 day
                  </span>
                </div>
              </div>

              {/* 5. Specimen Type Requirement */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  SPECIMEN REQUIREMENT &amp; CONTAINER *
                </label>
                <input
                  type="text"
                  required
                  value={formSpecimenType}
                  onChange={(e) => setFormSpecimenType(e.target.value)}
                  placeholder="e.g. Whole Blood (K2-EDTA), Clean-Catch Urine, Serum (SST)"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 6. Methodology */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  ANALYTICAL METHODOLOGY / TECHNOLOGY STANDARD
                </label>
                <input
                  type="text"
                  value={formMethodology}
                  onChange={(e) => setFormMethodology(e.target.value)}
                  placeholder="e.g. Automated 5-Part Cell Counter / Flow Cytometry"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 7. Notes / Included Parameters */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  CLINICAL NOTES / INCLUDED PARAMETERS
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional parameters reported, special handling, or collection instructions..."
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 8. Active Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Offering Active Status</div>
                  <div className="text-[11px] text-slate-500">
                    Active tests appear on Create Lab Test Request and Requisition intake forms.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0176d3]"></div>
                </label>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-[#d8dde6] rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-exam-form"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>SAVE CHANGES</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ADD NEW EXAMINATION MODAL                              */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    ADD NEW EXAMINATION TO CATALOG
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Create a new test offering with product code, clinical specs &amp; pricing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form id="add-exam-form" onSubmit={handleSaveAdd} className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Product Code */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    PRODUCT CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="E.G. 1200"
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-[#0176d3]"
                  />
                </div>

                {/* 2. Corporate HIS Code */}
                <div>
                  <label className="text-amber-800 font-bold block mb-1 text-[11px]">
                    CORPORATE HIS CODE
                  </label>
                  <input
                    type="text"
                    value={formCorporateCode}
                    onChange={(e) => setFormCorporateCode(e.target.value.toUpperCase())}
                    placeholder="E.G. 1274"
                    className="w-full px-3 py-1.5 rounded border border-amber-300 bg-amber-50/40 text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. Department Category */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    DEPARTMENT CATEGORY *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExaminationCategory)}
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-semibold text-xs bg-white focus:outline-none focus:border-[#0176d3] cursor-pointer"
                  >
                    {EXAMINATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Examination Name */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  EXAMINATION NAME (ALL CAPS) *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value.toUpperCase())}
                  placeholder="E.G. VITAMIN D (25-HYDROXY)"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-bold text-xs uppercase focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* Form Assignment & Send-Out Routing */}
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-slate-800 text-xs">
                      ASSIGNED RESULT FORM / SEND-OUT ROUTING *
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                    10 Forms or External Referral
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className={formAssignedForm === 'Send Out' ? 'sm:col-span-5' : 'sm:col-span-12'}>
                    <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                      ROUTED IN-HOUSE FORM *
                    </label>
                    <select
                      value={formAssignedForm}
                      onChange={(e) => {
                        const val = e.target.value as AssignedFormType;
                        setFormAssignedForm(val);
                        if (val === 'Send Out' && !formSendOutPlatform) {
                          setFormSendOutPlatform('Hi-Precision Diagnostics');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-[#0176d3] cursor-pointer"
                    >
                      <optgroup label="10 Standard In-House Result Forms">
                        {ASSIGNED_FORM_OPTIONS.filter((f) => !f.isSendOut).map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="External Referral Routing">
                        <option value="Send Out">
                          Send Out (External Referral Platform)
                        </option>
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formAssignedForm === 'Send Out' 
                        ? 'Not included on in-house forms. Specimen is sent out to partner referral lab.'
                        : `Routes to ${getFormMeta(formAssignedForm).name}. In-house forms will be generated later.`}
                    </p>
                  </div>

                  {formAssignedForm === 'Send Out' && (
                    <div className="sm:col-span-7 animate-fadeIn">
                      <label className="text-amber-900 font-bold block mb-1 text-[11px]">
                        SEND-OUT REFERRAL PLATFORM / PARTNER LAB *
                      </label>
                      <input
                        type="text"
                        required
                        list="add-sendout-platforms"
                        value={formSendOutPlatform}
                        onChange={(e) => setFormSendOutPlatform(e.target.value)}
                        placeholder="e.g. Hi-Precision Diagnostics"
                        className="w-full px-3 py-1.5 rounded border border-amber-300 bg-amber-50/50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600"
                      />
                      <datalist id="add-sendout-platforms">
                        {DEFAULT_SEND_OUT_PLATFORMS.map((plat) => (
                          <option key={plat} value={plat} />
                        ))}
                      </datalist>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {DEFAULT_SEND_OUT_PLATFORMS.slice(0, 3).map((plat) => (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => setFormSendOutPlatform(plat)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer font-medium"
                          >
                            {plat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price & TAT SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Standard Price (PHP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold text-[11px]">STANDARD FEE (₱) *</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-slate-500 font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-[#0176d3]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    OPD / PhilHealth
                  </span>
                </div>

                {/* Corporate Price (PHP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-amber-800 font-bold text-[11px]">CORPORATE FEE (₱)</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-amber-600 font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Same as standard"
                      value={formCorporatePrice}
                      onChange={(e) => setFormCorporatePrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 rounded border border-amber-300 bg-amber-50/40 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                    Corporate / HMO tariff
                  </span>
                </div>

                {/* Corporate Category */}
                <div>
                  <label className="text-amber-800 font-bold block mb-1 text-[11px]">
                    CORPORATE CATEGORY
                  </label>
                  <select
                    value={formCorporateCategory}
                    onChange={(e) => setFormCorporateCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded border border-amber-300 bg-amber-50/40 text-slate-900 font-semibold text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">NONE</option>
                    {CORPORATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                    PTS Tariffs Group
                  </span>
                </div>

                {/* TAT in Hours */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                    TAT SLA (HOURS) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTatHours}
                    onChange={(e) => setFormTatHours(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono text-xs focus:outline-none focus:border-[#0176d3]"
                  />
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    e.g. 4 for 4h, 24 for 1 day
                  </span>
                </div>
              </div>

              {/* 5. Specimen Type Requirement */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  SPECIMEN REQUIREMENT &amp; CONTAINER *
                </label>
                <input
                  type="text"
                  required
                  value={formSpecimenType}
                  onChange={(e) => setFormSpecimenType(e.target.value)}
                  placeholder="e.g. Whole Blood (K2-EDTA), Clean-Catch Urine, Serum (SST)"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 6. Methodology */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  ANALYTICAL METHODOLOGY / TECHNOLOGY STANDARD
                </label>
                <input
                  type="text"
                  value={formMethodology}
                  onChange={(e) => setFormMethodology(e.target.value)}
                  placeholder="e.g. Chemiluminescent Immunoassay (CMIA)"
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 7. Notes / Included Parameters */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  CLINICAL NOTES / INCLUDED PARAMETERS
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional parameters reported, special handling, or collection instructions..."
                  className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs focus:outline-none focus:border-[#0176d3]"
                />
              </div>

              {/* 8. Active Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Offering Active Status</div>
                  <div className="text-[11px] text-slate-500">
                    Active tests appear on Create Lab Test Request and Requisition intake forms.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0176d3]"></div>
                </label>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-[#d8dde6] rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="add-exam-form"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TO CATALOG</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6.5. QUICK SEND-OUT PLATFORM EDITOR MODAL                 */}
      {/* ======================================================== */}
      {platformEditExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Set Send-Out Partner Platform
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    [{platformEditExam.code}] {platformEditExam.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlatformEditExam(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlatformEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                  REFERRAL PLATFORM / PARTNER LAB NAME *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={platformEditText}
                  onChange={(e) => setPlatformEditText(e.target.value)}
                  placeholder="e.g. Hi-Precision Diagnostics"
                  className="w-full px-3 py-2 rounded border border-amber-300 bg-amber-50/40 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1.5 text-[10px]">
                  Quick Platform Shortcuts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_SEND_OUT_PLATFORMS.map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlatformEditText(plat)}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                        platformEditText === plat
                          ? 'bg-amber-600 text-white border-amber-700 font-bold'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded text-[11px] text-amber-900">
                Notice: Send Out tests are outsourced to partner platforms and are not included on the 10 in-house forms.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlatformEditExam(null)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. DELETE CONFIRMATION MODAL                             */}
      {/* ======================================================== */}
      {deleteConfirmCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Examination</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove Code <strong className="font-mono">{deleteConfirmCode}</strong> from the master catalog?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
              <strong>Note:</strong> Past submitted requisitions referencing this code will retain their historical records.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmCode(null)}
                className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExamination(deleteConfirmCode);
                  setDeleteConfirmCode(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. RESET DEFAULTS CONFIRMATION MODAL                     */}
      {/* ======================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset to Default Catalog</h3>
                <p className="text-xs text-slate-500">
                  This will restore all 65 standard PTS examinations and original price values.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reset Catalog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
