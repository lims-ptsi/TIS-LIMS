import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  Edit,
  ExternalLink,
  Filter,
  LayoutGrid,
  Leaf,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Snowflake,
  Sun,
  TestTubes,
  X,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Sample } from '../../types/lims';
import { DashboardHeroArtwork } from '../common/LimsDashboardArtwork';
import { 
  isWellOccupiedInBox, 
  findNextAvailableWell, 
  normalizeWell 
} from '../../utils/storageLocation';

interface SamplesListViewProps {
  samples: Sample[];
  onSelectSample: (sample: Sample) => void;
  onOpenNewModal: () => void;
  onPrintLabels?: () => void;
  onFreezeSamples?: (selectedIds: string[]) => void;
  onThawSamples?: (selectedIds: string[]) => void;
  onImportSamples?: () => void;
  onUpdateSample?: (sample: Sample) => void;
  onNavigateToBox?: (boxId: string, well?: string) => void;
}

function HomeMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconWrap,
  iconColor,
  valueClass = 'text-[var(--lims-navy)]',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  valueClass?: string;
}) {
  return (
    <article className="lims-card h-full p-4 sm:px-5 sm:py-4 shadow-sm transition-all hover:shadow-md hover:border-[#0878e8]/35">
      <div className="flex items-center gap-3 sm:gap-4 w-full min-h-[4.5rem]">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconWrap}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[var(--lims-navy)] leading-snug">
            {label}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{hint}</p>
        </div>
        <span className={`text-2xl sm:text-[1.75rem] font-bold tabular-nums leading-none shrink-0 ${valueClass}`}>
          {value}
        </span>
      </div>
    </article>
  );
}

const CATEGORY_BADGE: Record<string, string> = {
  PhilHealth: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Indigent: 'bg-violet-50 text-violet-800 border-violet-200',
  Corporate: 'bg-amber-50 text-amber-800 border-amber-200',
  'Pre-Employment / Employee': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  Employee: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  Projects: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  OPD: 'bg-sky-50 text-sky-800 border-sky-200',
};

export const SamplesListView: React.FC<SamplesListViewProps> = ({
  samples,
  onSelectSample,
  onOpenNewModal,
  onPrintLabels,
  onFreezeSamples,
  onThawSamples,
  onImportSamples,
  onUpdateSample,
  onNavigateToBox,
}) => {
  const [searchListQuery, setSearchListQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [editForm, setEditForm] = useState({
    sampleName: '',
    boxId: 'BX000026',
    boxPosition: 'A01',
    unit: 'Main Freezer',
    temp: '+4°C',
  });

  // Dynamic dataset mapping honoring real storageLocation & sampleName values
  const sampleRows = samples.map((s, idx) => {
    const rawPatient = (s.patientOrSourceName || 'Patient').replace(/\s*\([^)]*\)/g, '').trim();
    const custName = rawPatient.split(' ')[0] || rawPatient;
    const defaultSampleId = s.externalId || s.barcode || `S000${445 - idx}`;
    const defaultSampleName = s.sampleName || (s.externalId ? `${custName}_${s.externalId}` : `Lockbox_${defaultSampleId}`);
    const defaultBoxId = s.storageLocation?.box || 'BX000026';
    const defaultBoxPos = s.storageLocation?.well || `A0${(idx % 9) + 1}`;

    return {
      ...s,
      displayCustName: custName,
      displaySampleId: defaultSampleId,
      displaySampleName: defaultSampleName,
      displayBoxId: defaultBoxId,
      displayBoxPos: defaultBoxPos,
    };
  });

  const handleOpenEdit = (s: Sample & { displaySampleName?: string; displayBoxId?: string; displayBoxPos?: string }) => {
    setEditingSample(s);
    setEditForm({
      sampleName: s.sampleName || s.displaySampleName || '',
      boxId: s.storageLocation?.box || s.displayBoxId || 'BX000026',
      boxPosition: s.storageLocation?.well || s.displayBoxPos || 'A01',
      unit: s.storageLocation?.unit || 'Main Freezer',
      temp: s.storageLocation?.temperature || '+4°C',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    const updated: Sample = {
      ...editingSample,
      sampleName: editForm.sampleName.trim() || undefined,
      storageLocation: {
        facility: editingSample.storageLocation?.facility || 'Central Laboratory',
        room: editingSample.storageLocation?.room || 'Rm 102 - Cold Vault',
        unit: editForm.unit,
        rack: editingSample.storageLocation?.rack || 'RK000001',
        box: editForm.boxId.trim().toUpperCase() || 'BX000026',
        well: editForm.boxPosition.trim().toUpperCase() || 'A01',
        temperature: editForm.temp,
      },
    };

    if (onUpdateSample) {
      onUpdateSample(updated);
    }
    setEditingSample(null);
  };

  const filteredSamples = sampleRows.filter(
    (s) =>
      s.displayCustName.toLowerCase().includes(searchListQuery.toLowerCase()) ||
      s.displaySampleId.toLowerCase().includes(searchListQuery.toLowerCase()) ||
      s.displaySampleName.toLowerCase().includes(searchListQuery.toLowerCase()) ||
      s.displayBoxId.toLowerCase().includes(searchListQuery.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSamples.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSamples.map((s) => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const uniqueBoxes = useMemo(
    () => new Set(samples.map((s) => s.storageLocation?.box || 'BX000026')).size,
    [samples]
  );

  const cryoCount = useMemo(
    () => samples.filter((s) => s.storageLocation?.temperature?.includes('-80')).length,
    [samples]
  );

  return (
    <div className="lims-page-shell space-y-4">
      <section className="lims-card relative overflow-hidden border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30">
        <DashboardHeroArtwork />
        <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src="/ptsilogo.png"
            alt="PTSI Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              Specimen repository
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">
              Today&apos;s samples
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Accessioned specimens, box placement, and cryo storage — sorted by customer sample name.
            </p>
          </div>
          <div className="sm:text-right shrink-0 sm:pl-6 border-l border-[var(--lims-border)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In this list</p>
            <p className="text-2xl font-bold text-[var(--lims-navy)] tabular-nums leading-none mt-1">
              {filteredSamples.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'My samples filter'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <HomeMetricCard
          label="Specimens on file"
          value={samples.length}
          hint="All accessioned records in the repository"
          icon={TestTubes}
          iconWrap="bg-sky-50"
          iconColor="text-sky-600"
        />
        <HomeMetricCard
          label="Matching search"
          value={filteredSamples.length}
          hint="Rows visible with current list filter"
          icon={Search}
          iconWrap="bg-slate-100"
          iconColor="text-slate-600"
        />
        <HomeMetricCard
          label="Storage boxes"
          value={uniqueBoxes}
          hint="Distinct box IDs in use"
          icon={Box}
          iconWrap="bg-violet-50"
          iconColor="text-violet-600"
        />
        <HomeMetricCard
          label="Cryo vault (-80°C)"
          value={cryoCount}
          hint="Ultra-low temperature placements"
          icon={Snowflake}
          iconWrap="bg-blue-50"
          iconColor="text-blue-600"
          valueClass="text-blue-700"
        />
      </section>

      <button
        type="button"
        onClick={onOpenNewModal}
        className="relative overflow-hidden w-full text-left rounded-xl bg-gradient-to-r from-[var(--lims-navy)] via-[#0c2d55] to-[#0a2240] hover:from-[#0c2d55] hover:to-[#081a33] text-white shadow-md px-5 py-4 flex items-center justify-between gap-4 cursor-pointer border border-[#0a2240]"
      >
        <span className="relative z-[1] flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-sky-200" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold">Register a new sample</span>
            <span className="block text-sm text-slate-300 mt-0.5">
              Barcode, patient link, and cold-chain box position.
            </span>
          </span>
        </span>
        <span className="relative z-[1] inline-flex items-center gap-2 text-sm font-semibold bg-white text-[var(--lims-navy)] px-4 py-2 rounded-lg shrink-0 shadow-sm">
          New
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>

      <div className="lims-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--lims-border)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--lims-navy)]">Specimen inventory</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select rows for freeze / thaw; open a row for full sample detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onImportSamples?.()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-[var(--lims-border)] shadow-xs cursor-pointer"
            >
              Import
            </button>
            <button
              type="button"
              onClick={onPrintLabels}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-[var(--lims-border)] shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print labels
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert('Please select one or more samples from the list using the checkboxes to freeze.');
                  return;
                }
                onFreezeSamples?.(selectedIds);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--lims-border)] bg-white hover:bg-sky-50 text-slate-700 cursor-pointer"
            >
              <Snowflake className="w-3.5 h-3.5 text-blue-500" />
              Freeze{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert('Please select one or more samples from the list using the checkboxes to thaw.');
                  return;
                }
                onThawSamples?.(selectedIds);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--lims-border)] bg-white hover:bg-amber-50 text-slate-700 cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Thaw{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
            <button
              type="button"
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-[var(--lims-border)] cursor-pointer"
              aria-label="More actions"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-[var(--lims-border)] flex items-center justify-between gap-4 bg-[#f8fafc]/60">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search this list..."
              value={searchListQuery}
              onChange={(e) => setSearchListQuery(e.target.value)}
              className="lims-input pl-8 pr-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 text-slate-600">
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Table Settings">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Display Density">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Refresh List">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Inline Edit">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Filter List">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left">
            <thead>
              <tr className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-[var(--lims-border)]">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredSamples.length && filteredSamples.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#0878e8] focus:ring-[#0878e8]"
                    aria-label="Select all"
                  />
                </th>
                <th className="w-10 px-2 py-3 text-center font-mono">#</th>
                <th className="px-3 py-3">Customer sample name</th>
                <th className="px-3 py-3">Sample ID</th>
                <th className="px-3 py-3">Sample name</th>
                <th className="px-3 py-3">Box ID</th>
                <th className="px-3 py-3">Position</th>
                <th className="w-20 px-2 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Leaf className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No Samples Accessioned Yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Receive and accession incoming specimens from the Submissions tab or register a new sample directly.
                    </p>
                    <button
                      onClick={onOpenNewModal}
                      className="mt-4 lims-btn-primary px-4 py-2 text-xs rounded-lg shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      New Sample
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample, idx) => {
                  const isSelected = selectedIds.includes(sample.id);

                  return (
                    <tr
                      key={sample.id}
                      onClick={() => onSelectSample(sample)}
                      className="border-b border-[var(--lims-border)] hover:bg-[#f8fafc] cursor-pointer transition-colors"
                    >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(sample.id)}
                        className="rounded border-slate-300 text-[#0878e8] focus:ring-[#0878e8]"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{sample.displayCustName}</span>
                        {sample.patientCategory ? (
                          <span
                            className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                              CATEGORY_BADGE[sample.patientCategory] ||
                              'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                          >
                            {sample.patientCategory}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#0878e8] font-mono font-semibold">
                      {sample.displaySampleId}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">
                      {sample.displaySampleName}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToBox) onNavigateToBox(sample.displayBoxId, sample.displayBoxPos);
                        }}
                        className="text-[#0878e8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        title={`View ${sample.displayBoxId} in 2D Box Grid`}
                      >
                        <span>{sample.displayBoxId}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-800 font-bold">
                      {sample.displayBoxPos}
                    </td>
                    <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sample)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 hover:text-[#0878e8] hover:bg-blue-50 rounded text-xs font-semibold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                        title="Set Sample Name, Box ID & Position"
                      >
                        <Edit className="w-3 h-3 text-[#0878e8]" />
                        <span>Set</span>
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Sample Name, Box ID & Box Position Modal */}
      {editingSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="lims-card rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-900 font-sans">
            <button
              onClick={() => setEditingSample(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-lg bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a] shadow-xs">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Set Sample Name &amp; Storage Placement
                </h3>
                <p className="text-xs text-slate-500">
                  Assign repository Sample Name, Cold Vault Box ID, and 96-well grid position
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="text-[11px] text-slate-500">Specimen Barcode &amp; Source:</div>
                <div className="font-mono font-bold text-slate-800 text-xs">
                  {editingSample.barcode} · {editingSample.patientOrSourceName}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1 uppercase tracking-wide">
                  Sample Name / Repository Label *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.sampleName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, sampleName: e.target.value }))}
                  placeholder="E.G. Lockbox_S000445 or PTSI_SMP-2026"
                  className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:border-[#0878e8] focus:ring-1 focus:ring-[#0878e8]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Displayed in the "Sample Name" column of repository manifests and testing logs.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1 uppercase tracking-wide">
                    Storage Box ID *
                  </label>
                  <select
                    value={editForm.boxId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, boxId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:border-[#0878e8] cursor-pointer"
                  >
                    <option value="BX000026">BX000026 (Primary Reception · +4°C)</option>
                    <option value="BX000025">BX000025 (Clinical Serum Archive B · -20°C)</option>
                    <option value="BX000010">BX000010 (DNA Extraction Vault · -80°C)</option>
                    <option value="BX000027">BX000027 (Site Freezer · -80°C)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold uppercase tracking-wide">
                      Box Position (Well) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({
                        ...prev,
                        boxPosition: findNextAvailableWell(editForm.boxId, samples, '96_WELL', editingSample?.id)
                      }))}
                      className="text-[10px] text-[#0878e8] hover:underline font-semibold cursor-pointer"
                    >
                      Auto-Next
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editForm.boxPosition}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, boxPosition: e.target.value.toUpperCase() }))}
                    placeholder="E.G. A01, A02, B05"
                    className={`w-full px-3 py-2 rounded-md border font-mono text-xs font-bold uppercase focus:outline-none ${
                      isWellOccupiedInBox(editForm.boxId, editForm.boxPosition, samples, editingSample?.id).isOccupied
                        ? 'border-amber-400 text-amber-900 bg-amber-50/30'
                        : 'border-[#d8dde6] text-slate-900 focus:border-[#0878e8]'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">SBS 96-well grid position</span>
                </div>
              </div>

              {(() => {
                const check = isWellOccupiedInBox(editForm.boxId, editForm.boxPosition, samples, editingSample?.id);
                if (check.isOccupied) {
                  return (
                    <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Well <strong>{normalizeWell(editForm.boxPosition)}</strong> is occupied by{' '}
                          <strong>{check.occupyingSample?.barcode}</strong> ({check.occupyingSample?.patientOrSourceName}).
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => ({
                          ...prev,
                          boxPosition: findNextAvailableWell(editForm.boxId, samples, '96_WELL', editingSample?.id)
                        }))}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 ml-2 cursor-pointer shadow-2xs"
                      >
                        Next Free
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1 uppercase tracking-wide">
                    Storage Unit
                  </label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="E.G. Main Freezer"
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0878e8]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1 uppercase tracking-wide">
                    Storage Temperature
                  </label>
                  <select
                    value={editForm.temp}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, temp: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0878e8] cursor-pointer"
                  >
                    <option value="+4°C">+4°C Cold Storage</option>
                    <option value="-20°C">-20°C Standard Freezer</option>
                    <option value="-80°C">-80°C Ultra-Low Cryo Vault</option>
                    <option value="Ambient">Ambient Room Temperature</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSample(null)}
                  className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#0878e8] hover:bg-[#0669c9] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
