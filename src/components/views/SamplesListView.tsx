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
  LayoutGrid
} from 'lucide-react';
import { Sample } from '../../types/lims';

interface SamplesListViewProps {
  samples: Sample[];
  onSelectSample: (sample: Sample) => void;
  onOpenNewModal: () => void;
  onPrintLabels?: () => void;
  onFreezeSamples?: () => void;
  onThawSamples?: () => void;
  onImportSamples?: () => void;
}

export const SamplesListView: React.FC<SamplesListViewProps> = ({
  samples,
  onSelectSample,
  onOpenNewModal,
  onPrintLabels,
  onFreezeSamples,
  onThawSamples,
  onImportSamples,
}) => {
  const [searchListQuery, setSearchListQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Default dataset mapping matching Lockbox LIMS screenshot sample names
  const sampleRows = samples.map((s, idx) => {
    const idNum = 445 - idx;
    const isLockbox = idx < 5;
    const custName = isLockbox ? 'Lockbox' : 'TWA';
    const sampleId = `S000${idNum}`;
    const sampleName = `${custName}_${sampleId}`;
    const boxId = isLockbox ? 'BX000026' : 'BX000025';
    const boxPos = `A0${(idx % 6) + 1}`;

    return {
      ...s,
      displayCustName: s.patientOrSourceName.includes('Alexander') ? custName : s.patientOrSourceName.split(' ')[0],
      displaySampleId: sampleId,
      displaySampleName: sampleName,
      displayBoxId: boxId,
      displayBoxPos: boxPos,
    };
  });

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
    <div className="space-y-3 max-w-7xl mx-auto pb-12">
      {/* 1. List View Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Green Leaf Icon */}
          <div className="w-10 h-10 rounded-md bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a] shadow-xs">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Samples</div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 cursor-pointer">
                <span>Today's Samples</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
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
            onClick={onFreezeSamples}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Freeze
          </button>
          <button
            onClick={onThawSamples}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Thaw
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
                    <td className="text-slate-800">
                      {sample.displaySampleName}
                    </td>
                    <td className="link-blue font-mono">
                      {sample.displayBoxId}
                    </td>
                    <td className="font-mono text-slate-800">
                      {sample.displayBoxPos}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
