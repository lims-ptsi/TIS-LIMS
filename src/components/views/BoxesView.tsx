import React, { useState, useEffect } from 'react';
import { 
  Box, 
  ChevronDown, 
  MapPin, 
  Thermometer, 
  Search, 
  Layers, 
  Leaf, 
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Sample } from '../../types/lims';
import { 
  STANDARD_BOXES, 
  getBoxDefinition, 
  normalizeWell, 
  isSameWell, 
  findNextAvailableWell 
} from '../../utils/storageLocation';

interface BoxesViewProps {
  samples: Sample[];
  initialBoxId?: string;
  initialWell?: string;
  onSelectSample?: (sample: Sample) => void;
  onBackToSamples?: () => void;
}

export const BoxesView: React.FC<BoxesViewProps> = ({ 
  samples, 
  initialBoxId,
  initialWell,
  onSelectSample,
  onBackToSamples,
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState(initialBoxId || 'BX000026');
  const [selectedWell, setSelectedWell] = useState<string | null>(initialWell || 'A01');
  const [gridFormat, setGridFormat] = useState<'96_WELL' | '81_CRYO'>('96_WELL');

  useEffect(() => {
    if (initialBoxId) setSelectedBoxId(initialBoxId);
    if (initialWell) setSelectedWell(normalizeWell(initialWell));
  }, [initialBoxId, initialWell]);

  const currentBox = getBoxDefinition(selectedBoxId);

  // Filter samples that belong exclusively to this box
  const boxSamples = samples.filter(
    (s) => (s.storageLocation?.box || '').trim().toUpperCase() === currentBox.id.toUpperCase()
  );

  const totalCapacity = gridFormat === '81_CRYO' ? 81 : 96;
  const occupiedCount = boxSamples.length;
  const availableCount = Math.max(0, totalCapacity - occupiedCount);

  // Generate grid positions
  const gridPositions: string[] = [];
  if (gridFormat === '81_CRYO') {
    for (let r = 0; r < 9; r++) {
      const row = String.fromCharCode(65 + r);
      for (let c = 1; c <= 9; c++) {
        gridPositions.push(`${row}0${c}`);
      }
    }
  } else {
    for (let r = 0; r < 8; r++) {
      const row = String.fromCharCode(65 + r);
      for (let c = 1; c <= 12; c++) {
        gridPositions.push(`${row}${c < 10 ? '0' + c : c}`);
      }
    }
  }

  // Find sample occupying the currently selected cell
  const activeSelectedSample = boxSamples.find((s) => isSameWell(s.storageLocation?.well, selectedWell));

  return (
    <div className="lims-page-shell animate-fadeIn">
      {/* 1. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToSamples && (
            <button
              onClick={onBackToSamples}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-slate-200"
              title="Return to Samples Table"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Cold Vault Inventory</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="font-mono text-[#0176d3]">{currentBox.id}</span>
              <span className="text-sm font-normal text-slate-500">· {currentBox.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Format Toggle */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGridFormat('96_WELL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                gridFormat === '96_WELL'
                  ? 'bg-white text-[#0176d3] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              96-Well SBS (8×12)
            </button>
            <button
              type="button"
              onClick={() => setGridFormat('81_CRYO')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                gridFormat === '81_CRYO'
                  ? 'bg-white text-[#0176d3] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              81 Cryo (9×9)
            </button>
          </div>

          {/* Box Selector Dropdown */}
          <select
            value={selectedBoxId}
            onChange={(e) => {
              setSelectedBoxId(e.target.value);
              setSelectedWell(null);
            }}
            className="px-3 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-900 font-mono font-semibold focus:outline-none focus:border-[#0176d3] cursor-pointer"
          >
            {STANDARD_BOXES.map((b) => {
              const occ = samples.filter((s) => (s.storageLocation?.box || '').toUpperCase() === b.id.toUpperCase()).length;
              return (
                <option key={b.id} value={b.id}>
                  {b.id} ({b.name}) · {b.temp} · [{occ} occupied]
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 3. Main Grid & Storage Hierarchy Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left 8 Cols: Visual 2D Grid */}
        <div className="lg:col-span-8 lims-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-[#0176d3]" />
              <span>Cryogenic Grid Matrix ({currentBox.temp}) · {gridFormat === '96_WELL' ? '8 Rows × 12 Cols' : '9 Rows × 9 Cols'}</span>
            </h3>
            
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#2e844a]"></span> 
                <span className="text-slate-700 font-semibold">Occupied ({occupiedCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> 
                <span className="text-slate-500">Available ({availableCount})</span>
              </span>
            </div>
          </div>

          {/* Grid Container */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-200 overflow-x-auto">
            <div 
              className="grid gap-1.5 min-w-[560px]"
              style={{
                gridTemplateColumns: `repeat(${gridFormat === '96_WELL' ? 12 : 9}, minmax(0, 1fr))`
              }}
            >
              {gridPositions.map((pos) => {
                const matchedSample = boxSamples.find((s) => isSameWell(s.storageLocation?.well, pos));
                const isSelected = selectedWell === pos;

                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setSelectedWell(pos)}
                    className={`h-11 rounded border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      matchedSample
                        ? 'bg-[#2e844a] border-emerald-600 text-white font-bold shadow-xs hover:bg-[#26703e]'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white z-10 scale-105' : ''}`}
                    title={matchedSample ? `${pos}: ${matchedSample.barcode} (${matchedSample.patientOrSourceName})` : `Empty Well: ${pos}`}
                  >
                    <span className="text-[10px] font-mono leading-none">{pos}</span>
                    {matchedSample && (
                      <span className="text-[7.5px] truncate w-full mt-1 text-center font-normal opacity-95">
                        {matchedSample.sampleName?.split('_')[0] || matchedSample.barcode.replace('SMP-2026-', '')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Click any well cell to inspect specimen contents and cold vault chain-of-custody.</span>
            </span>

            <button
              type="button"
              onClick={() => {
                const nextFree = findNextAvailableWell(currentBox.id, samples, gridFormat);
                setSelectedWell(nextFree);
              }}
              className="inline-flex items-center gap-1 text-[#0176d3] hover:underline font-semibold cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Jump to next free well</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Inspector & Hierarchy */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Well Inspector Card */}
          <div className="lims-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0176d3]" />
                <span>Selected Cell: <strong className="font-mono text-slate-900 text-sm">{selectedWell || 'None'}</strong></span>
              </h3>
              {selectedWell && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                  activeSelectedSample 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {activeSelectedSample ? 'OCCUPIED' : 'EMPTY / AVAILABLE'}
                </span>
              )}
            </div>

            {activeSelectedSample ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Specimen Barcode</span>
                    <span className="font-mono font-bold text-[#0176d3]">{activeSelectedSample.barcode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Sample Name</span>
                    <span className="font-bold text-slate-900">{activeSelectedSample.sampleName || 'Standard Specimen'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Patient / Source</span>
                    <span className="font-semibold text-slate-800">{activeSelectedSample.patientOrSourceName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Matrix / Specimen</span>
                    <span className="text-slate-700">{activeSelectedSample.sampleType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                    <span className="font-mono font-bold text-emerald-700">{activeSelectedSample.status}</span>
                  </div>
                </div>

                {onSelectSample && (
                  <button
                    type="button"
                    onClick={() => onSelectSample(activeSelectedSample)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Open Full Specimen Detail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Cell {selectedWell || 'A01'} is Available</p>
                <p className="text-[11px] text-slate-400">
                  Ready to receive specimens during intake accessioning or reassignment.
                </p>
              </div>
            )}
          </div>

          {/* Storage Hierarchy Card */}
          <div className="lims-card p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Storage Facility Hierarchy</span>
            </h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Facility:</span>
                <span className="text-slate-900 font-semibold">{currentBox.facility}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Room / Vault:</span>
                <span className="text-slate-900 font-semibold">{currentBox.room}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Storage Unit:</span>
                <span className="link-blue font-semibold">{currentBox.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Shelf / Rack:</span>
                <span className="link-blue font-mono font-semibold">{currentBox.shelf} · {currentBox.rack}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Box ID:</span>
                <span className="font-mono font-bold text-slate-900">{currentBox.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Temp:</span>
                <span className="font-mono font-bold text-[#0176d3]">{currentBox.temp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
