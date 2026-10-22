import React, { useState } from 'react';
import { 
  Leaf, 
  ChevronDown, 
  Pin, 
  Search, 
  Settings, 
  RefreshCw, 
  Edit, 
  Filter, 
  Plus, 
  Upload, 
  Printer, 
  Snowflake, 
  Sun,
  LayoutGrid,
  Box,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Sample } from '../../types/lims';
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

  return (
    <div className="lims-page-shell">
      {/* 1. List View Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Green Leaf Icon */}
          <div className="w-8 h-8 rounded-md bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a]">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Samples</div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-1.5 cursor-pointer">
                <span>Today's Samples</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </h1>
              <button className="text-slate-400 hover:text-slate-700" title="Pin this view">
                <Pin className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredSamples.length} items • Sorted by Customer Sample Name • Filtered by My samples - Record Type, Created Date • Updated a few seconds ago
            </p>
          </div>
        </div>

        {/* Right Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onOpenNewModal}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            New
          </button>
          <button
            onClick={() => onImportSamples?.()}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Import Samples
          </button>
          <button
            onClick={onPrintLabels}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Print Labels
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Please select one or more samples from the list using the checkboxes to freeze.');
                return;
              }
              if (onFreezeSamples) onFreezeSamples(selectedIds);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors cursor-pointer"
            title="Move selected specimens to -80°C Cryo-Vault"
          >
            <Snowflake className="w-3.5 h-3.5 text-blue-500" />
            <span>Freeze {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Please select one or more samples from the list using the checkboxes to thaw.');
                return;
              }
              if (onThawSamples) onThawSamples(selectedIds);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors cursor-pointer"
            title="Initiate controlled thaw cycle for testing"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Thaw {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
          <button className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-[#d8dde6]">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Search & Table Controls Row */}
      <div className="bg-white border border-[#d8dde6] rounded-md overflow-hidden shadow-sm">
        <div className="p-2.5 border-b border-[#e5e7eb] flex items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search this list..."
              value={searchListQuery}
              onChange={(e) => setSearchListQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0176d3]"
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

        {/* 3. Table matching Screenshot 2 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse lims-table">
            <thead>
              <tr>
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredSamples.length && filteredSamples.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#0176d3] focus:ring-[#0176d3]"
                  />
                </th>
                <th className="w-10 text-center text-slate-400 font-mono">#</th>
                <th className="cursor-pointer">Customer Sample Name ↑</th>
                <th className="cursor-pointer">Sample ID</th>
                <th className="cursor-pointer">Sample Name</th>
                <th className="cursor-pointer">Box ID</th>
                <th className="cursor-pointer">Box Position</th>
                <th className="w-10 text-right"></th>
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
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
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
                      className="cursor-pointer transition-colors"
                    >
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(sample.id)}
                        className="rounded border-slate-300 text-[#0176d3] focus:ring-[#0176d3]"
                      />
                    </td>
                    <td className="text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{sample.displayCustName}</span>
                        {sample.patientCategory && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border ${
                            sample.patientCategory === 'PhilHealth' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            sample.patientCategory === 'Indigent' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                            sample.patientCategory === 'Corporate' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            sample.patientCategory === 'Pre-Employment / Employee' || sample.patientCategory === 'Employee' ? 'bg-cyan-50 text-cyan-800 border-cyan-300' :
                            sample.patientCategory === 'Projects' ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                            'bg-blue-50 text-[#0176d3] border-blue-300'
                          }`}>
                            {sample.patientCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="link-blue font-mono font-semibold">
                      {sample.displaySampleId}
                    </td>
                    <td className="text-slate-800 font-medium">
                      {sample.displaySampleName}
                    </td>
                    <td className="link-blue font-mono font-bold" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToBox) onNavigateToBox(sample.displayBoxId, sample.displayBoxPos);
                        }}
                        className="text-[#0176d3] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        title={`View ${sample.displayBoxId} in 2D Box Grid`}
                      >
                        <span>{sample.displayBoxId}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
                    <td className="font-mono text-slate-800 font-bold">
                      {sample.displayBoxPos}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sample)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 hover:text-[#0176d3] hover:bg-blue-50 rounded text-xs font-semibold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                        title="Set Sample Name, Box ID & Position"
                      >
                        <Edit className="w-3 h-3 text-[#0176d3]" />
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
          <div className="bg-white border border-[#d8dde6] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-900 font-sans">
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
                  className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]"
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
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:border-[#0176d3] cursor-pointer"
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
                      className="text-[10px] text-[#0176d3] hover:underline font-semibold cursor-pointer"
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
                        : 'border-[#d8dde6] text-slate-900 focus:border-[#0176d3]'
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
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0176d3]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1 uppercase tracking-wide">
                    Storage Temperature
                  </label>
                  <select
                    value={editForm.temp}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, temp: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-[#d8dde6] text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0176d3] cursor-pointer"
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
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
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
