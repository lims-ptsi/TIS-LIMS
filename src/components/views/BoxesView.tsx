import React, { useState } from 'react';
import { 
  Box, 
  ChevronDown, 
  MapPin, 
  Thermometer, 
  Search, 
  Layers, 
  Leaf, 
  ExternalLink 
} from 'lucide-react';
import { Sample } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface BoxesViewProps {
  samples: Sample[];
  onSelectSample?: (sample: Sample) => void;
}

export const BoxesView: React.FC<BoxesViewProps> = ({ samples, onSelectSample }) => {
  const [selectedBoxId, setSelectedBoxId] = useState('BX000010');
  const [selectedWell, setSelectedWell] = useState<string | null>('A02');

  const boxList = [
    { id: 'BX000010', name: 'DNA Extraction Vault 01', temp: '-80°C', rack: 'RK000001', shelf: 'Shelf 1', occupied: 4 },
    { id: 'BX000025', name: 'Clinical Serum Archive B', temp: '-20°C', rack: 'RK000002', shelf: 'Shelf 2', occupied: 6 },
    { id: 'BX000026', name: 'Lockbox Primary Reception', temp: '+4°C', rack: 'RK000005', shelf: 'Shelf 1', occupied: 5 },
    { id: 'BX000027', name: 'Batch Testing Site Freezer', temp: '-80°C', rack: 'RK000005', shelf: 'Shelf 2', occupied: 3 },
  ];

  const currentBox = boxList.find((b) => b.id === selectedBoxId) || boxList[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="In Storage Placement"
        entityType="Sample"
        onCompleteStage={() => alert(`Storage placement verified for ${selectedBoxId}.`)}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Storage Box</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{currentBox.id}</span>
              <span className="text-sm font-normal text-slate-500">· {currentBox.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBoxId}
            onChange={(e) => setSelectedBoxId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 font-mono"
          >
            {boxList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} ({b.name}) · {b.temp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Box 9x9 Grid Layout and Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 9x9 Cryo Box Grid */}
        <div className="lg:col-span-8 lims-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-[#0176d3]" />
              <span>Cryogenic 9x9 Box Grid ({currentBox.temp})</span>
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#2e844a]"></span> Occupied ({currentBox.occupied})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> Available (77)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded border border-slate-200 max-w-xl mx-auto">
            <div className="grid grid-cols-9 gap-2">
              {Array.from({ length: 81 }).map((_, idx) => {
                const row = String.fromCharCode(65 + Math.floor(idx / 9));
                const col = (idx % 9) + 1;
                const pos = `${row}0${col}`;
                const matchedSample = samples.find((s) => s.storageLocation.well === pos || s.storageLocation.well === `${row}${col}`);
                const isSelected = selectedWell === pos;

                return (
                  <button
                    key={pos}
                    onClick={() => {
                      setSelectedWell(pos);
                      if (matchedSample && onSelectSample) onSelectSample(matchedSample);
                    }}
                    className={`h-11 rounded border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      matchedSample
                        ? 'bg-[#2e844a] border-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    title={matchedSample ? `${matchedSample.barcode} (${matchedSample.patientOrSourceName})` : `Empty Cell: ${pos}`}
                  >
                    <span className="text-[10px] font-mono">{pos}</span>
                    {matchedSample && <span className="text-[7px] truncate w-full">{matchedSample.barcode.split('-')[2]}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Storage Location Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="lims-card p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Storage Hierarchy</h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Equipment Name:</span>
                <span className="link-blue font-semibold">Main Freezer -80°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shelf ID:</span>
                <span className="link-blue font-mono font-semibold">{currentBox.shelf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rack ID:</span>
                <span className="link-blue font-mono font-semibold">{currentBox.rack}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Cell:</span>
                <span className="font-bold font-mono text-slate-900">{selectedWell || 'A02'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
