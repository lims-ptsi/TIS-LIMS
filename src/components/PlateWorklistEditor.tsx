import React, { useState } from 'react';
import { 
  Grid3X3, 
  Sparkles, 
  Trash2, 
  Play, 
  FileDown, 
  Layers, 
  CheckCircle2, 
  Info,
  Beaker,
  ShieldCheck
} from 'lucide-react';
import { Sample, MicroplateWell } from '../types/lims';

interface PlateWorklistEditorProps {
  samples: Sample[];
  onExecuteBatchRun: (batchName: string, instrumentName: string) => void;
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);

export const PlateWorklistEditor: React.FC<PlateWorklistEditorProps> = ({
  samples,
  onExecuteBatchRun,
}) => {
  const [selectedAssay, setSelectedAssay] = useState('Heavy Metals ICP-MS (EPA 200.8)');
  const [targetInstrument, setTargetInstrument] = useState('Thermo iCAP PRO XP ICP-MS');
  const [batchName, setBatchName] = useState('BATCH-2026-EPA-METALS-44');
  const [activeWell, setActiveWell] = useState<MicroplateWell | null>(null);
  const [selectedTool, setSelectedTool] = useState<MicroplateWell['type']>('SAMPLE');

  // Initialize 96 wells
  const [plate, setPlate] = useState<MicroplateWell[]>(() => {
    const wells: MicroplateWell[] = [];
    ROWS.forEach((row) => {
      COLS.forEach((col) => {
        wells.push({
          row,
          col,
          position: `${row}${col}`,
          type: 'EMPTY',
          status: 'UNASSIGNED',
        });
      });
    });
    return wells;
  });

  // Auto-populate standard 96-well template
  const handleAutoPopulateTemplate = () => {
    const newPlate = [...plate];

    // Col 1: Blanks & Calibrators
    newPlate.find((w) => w.position === 'A1')!.type = 'BLANK';
    newPlate.find((w) => w.position === 'B1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'C1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'D1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'E1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'F1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'G1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'H1')!.type = 'BLANK';

    // Col 2: QC Controls
    newPlate.find((w) => w.position === 'A2')!.type = 'QC_LOW';
    newPlate.find((w) => w.position === 'B2')!.type = 'QC_HIGH';
    newPlate.find((w) => w.position === 'C2')!.type = 'NEGATIVE_CTRL';
    newPlate.find((w) => w.position === 'D2')!.type = 'POSITIVE_CTRL';

    // Fill remaining starting at A3 with available samples
    let sampleIdx = 0;
    for (let col = 3; col <= 12; col++) {
      for (let r = 0; r < ROWS.length; r++) {
        const pos = `${ROWS[r]}${col}`;
        const well = newPlate.find((w) => w.position === pos);
        if (well && sampleIdx < samples.length) {
          well.type = 'SAMPLE';
          well.sampleBarcode = samples[sampleIdx].barcode;
          well.sampleId = samples[sampleIdx].id;
          well.status = 'ASSIGNED';
          sampleIdx++;
        }
      }
    }

    setPlate(newPlate);
  };

  const handleWellClick = (position: string) => {
    const newPlate = plate.map((w) => {
      if (w.position === position) {
        if (w.type === selectedTool) {
          return { ...w, type: 'EMPTY' as const, sampleBarcode: undefined, status: 'UNASSIGNED' as const };
        }
        return {
          ...w,
          type: selectedTool,
          sampleBarcode: selectedTool === 'SAMPLE' ? samples[0]?.barcode : undefined,
          status: 'ASSIGNED' as const,
        };
      }
      return w;
    });
    setPlate(newPlate);
    const clicked = newPlate.find((w) => w.position === position);
    if (clicked) setActiveWell(clicked);
  };

  const handleClearPlate = () => {
    setPlate(
      plate.map((w) => ({
        ...w,
        type: 'EMPTY',
        sampleBarcode: undefined,
        status: 'UNASSIGNED',
      }))
    );
    setActiveWell(null);
  };

  const getWellColor = (type: MicroplateWell['type']) => {
    switch (type) {
      case 'BLANK':
        return 'bg-slate-700 border-slate-500 text-slate-200';
      case 'CALIBRATOR':
        return 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/50';
      case 'QC_LOW':
        return 'bg-amber-600 border-amber-400 text-white';
      case 'QC_HIGH':
        return 'bg-amber-500 border-amber-300 text-slate-950 font-bold';
      case 'NEGATIVE_CTRL':
        return 'bg-teal-700 border-teal-500 text-white';
      case 'POSITIVE_CTRL':
        return 'bg-purple-600 border-purple-400 text-white';
      case 'SAMPLE':
        return 'bg-cyan-600 border-cyan-400 text-white shadow-sm shadow-cyan-500/50';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700';
    }
  };

  const occupiedCount = plate.filter((w) => w.type !== 'EMPTY').length;

  return (
    <div className="space-y-6">
      {/* Worklist Config Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              96-Well Microplate Batch Worklist Builder
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Interactive SBS Standard 8x12
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Map calibrators, blanks, quality controls, and unknown patient samples prior to instrument run sequence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAutoPopulateTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Fill Standard Template
          </button>
          <button
            onClick={handleClearPlate}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear
          </button>
          <button
            onClick={() => onExecuteBatchRun(batchName, targetInstrument)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4" />
            Dispatch to Instrument ({occupiedCount} Wells)
          </button>
        </div>
      </div>

      {/* Batch Metadata Header */}
      <div className="glass-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Batch Sequence Name</label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Assay Protocol</label>
          <select
            value={selectedAssay}
            onChange={(e) => setSelectedAssay(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
          >
            <option>Heavy Metals ICP-MS (EPA 200.8)</option>
            <option>Complete Blood Count 5-Part Diff (Sysmex)</option>
            <option>Comprehensive Metabolic Panel (Cobas)</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Assigned Analytical Instrument</label>
          <select
            value={targetInstrument}
            onChange={(e) => setTargetInstrument(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
          >
            <option>Thermo iCAP PRO XP ICP-MS (REST/MQTT)</option>
            <option>Sysmex XN-1000 Hematology (ASTM E1394)</option>
            <option>Roche Cobas c502 (HL7 v2.5.1)</option>
          </select>
        </div>
      </div>

      {/* Well Placement Palette / Tool Selector */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">Active Placement Tool:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { type: 'SAMPLE', label: 'Sample (SMP)', color: 'bg-cyan-600' },
            { type: 'BLANK', label: 'Method Blank (BLK)', color: 'bg-slate-700' },
            { type: 'CALIBRATOR', label: 'Calibrator (CAL)', color: 'bg-indigo-600' },
            { type: 'QC_LOW', label: 'QC Low (QCL)', color: 'bg-amber-600' },
            { type: 'QC_HIGH', label: 'QC High (QCH)', color: 'bg-amber-500' },
            { type: 'NEGATIVE_CTRL', label: 'Neg Control', color: 'bg-teal-700' },
          ].map((tool) => (
            <button
              key={tool.type}
              onClick={() => setSelectedTool(tool.type as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedTool === tool.type
                  ? 'bg-slate-100 text-slate-950 font-bold ring-2 ring-cyan-400'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${tool.color}`}></span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 96-Well Plate Layout Visual Canvas */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[760px] p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            {/* Column Numbers Header (1 to 12) */}
            <div className="grid grid-cols-13 gap-2 text-center text-xs font-mono font-bold text-slate-400 mb-2">
              <div className="w-8"></div>
              {COLS.map((col) => (
                <div key={col} className="w-10">
                  {col}
                </div>
              ))}
            </div>

            {/* Rows A to H */}
            {ROWS.map((row) => (
              <div key={row} className="grid grid-cols-13 gap-2 items-center mb-2">
                {/* Row Letter */}
                <div className="w-8 text-center font-mono font-bold text-slate-400 text-xs">{row}</div>

                {/* 12 Wells for this row */}
                {COLS.map((col) => {
                  const pos = `${row}${col}`;
                  const well = plate.find((w) => w.position === pos);
                  const isSelected = activeWell?.position === pos;

                  return (
                    <button
                      key={pos}
                      onClick={() => handleWellClick(pos)}
                      className={`w-10 h-10 rounded-full border flex flex-col items-center justify-center text-[10px] font-mono transition-all transform hover:scale-110 active:scale-95 ${getWellColor(
                        well?.type || 'EMPTY'
                      )} ${isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-950' : ''}`}
                      title={`${pos}: ${well?.type} ${well?.sampleBarcode ? `(${well.sampleBarcode})` : ''}`}
                    >
                      {well?.type === 'SAMPLE' && 'SMP'}
                      {well?.type === 'BLANK' && 'BLK'}
                      {well?.type === 'CALIBRATOR' && 'CAL'}
                      {well?.type === 'QC_LOW' && 'QCL'}
                      {well?.type === 'QC_HIGH' && 'QCH'}
                      {well?.type === 'NEGATIVE_CTRL' && 'NC'}
                      {well?.type === 'EMPTY' && <span className="text-[8px] text-slate-400">{pos}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Well Inspector Card */}
        {activeWell && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md">
                {activeWell.position}
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Well {activeWell.position}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                    {activeWell.type}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                  {activeWell.sampleBarcode
                    ? `Assigned Specimen: ${activeWell.sampleBarcode}`
                    : 'No specific specimen assigned'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleWellClick(activeWell.position)}
              className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs hover:bg-rose-900"
            >
              Clear This Well
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
