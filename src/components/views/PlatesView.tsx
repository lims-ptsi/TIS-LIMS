import React, { useState } from 'react';
import { 
  Grid3X3, 
  Sparkles, 
  Trash2, 
  Play, 
  Layers, 
  Check, 
  Leaf, 
  Info,
  ChevronDown
} from 'lucide-react';
import { Sample, MicroplateWell } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface PlatesViewProps {
  samples: Sample[];
  onExecuteBatch?: (batchName: string) => void;
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);

export const PlatesView: React.FC<PlatesViewProps> = ({
  samples,
  onExecuteBatch,
}) => {
  const [selectedAssay, setSelectedAssay] = useState('qPCR 16S Amplicon Sequencing (SBS 96-Well)');
  const [plateName, setPlateName] = useState('PLT-2026-DNA-092');
  const [activeWell, setActiveWell] = useState<MicroplateWell | null>(null);
  const [selectedTool, setSelectedTool] = useState<MicroplateWell['type']>('SAMPLE');

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

  const handleAutoPopulateTemplate = () => {
    const newPlate = [...plate];
    newPlate.find((w) => w.position === 'A1')!.type = 'BLANK';
    newPlate.find((w) => w.position === 'B1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'C1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'D1')!.type = 'CALIBRATOR';
    newPlate.find((w) => w.position === 'A2')!.type = 'QC_LOW';
    newPlate.find((w) => w.position === 'B2')!.type = 'QC_HIGH';

    let sampleIdx = 0;
    for (let col = 3; col <= 12; col++) {
      for (let r = 0; r < ROWS.length; r++) {
        const pos = `${ROWS[r]}${col}`;
        const well = newPlate.find((w) => w.position === pos);
        if (well && sampleIdx < samples.length) {
          well.type = 'SAMPLE';
          well.sampleBarcode = samples[sampleIdx].barcode;
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

  const getWellColor = (type: MicroplateWell['type']) => {
    switch (type) {
      case 'BLANK':
        return 'bg-slate-400 border-slate-500 text-white';
      case 'CALIBRATOR':
        return 'bg-[#0176d3] border-blue-600 text-white';
      case 'QC_LOW':
        return 'bg-[#e28704] border-amber-600 text-white';
      case 'QC_HIGH':
        return 'bg-[#e5b800] border-yellow-600 text-slate-900 font-bold';
      case 'SAMPLE':
        return 'bg-[#2e844a] border-emerald-600 text-white';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100';
    }
  };

  return (
    <div className="lims-page-shell">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Plate Mapping & Normalization"
        entityType="Batch"
        onCompleteStage={() => alert(`Plate ${plateName} dispatched to automated liquid handler.`)}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a] shadow-xs">
            <Grid3X3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Plate Layout</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{plateName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoPopulateTemplate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-semibold rounded shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Fill Standard Template
          </button>
          <button
            onClick={() => setPlate(plate.map((w) => ({ ...w, type: 'EMPTY', sampleBarcode: undefined })))}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6]"
          >
            Clear Plate
          </button>
        </div>
      </div>

      {/* 3. Palette & 96-Well Layout */}
      <div className="lims-card p-6 space-y-6">
        {/* Placement Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Layers className="w-4 h-4 text-[#0176d3]" />
            <span>Active Placement Tool:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { type: 'SAMPLE', label: 'Sample (SMP)', color: 'bg-[#2e844a]' },
              { type: 'BLANK', label: 'Method Blank (BLK)', color: 'bg-slate-400' },
              { type: 'CALIBRATOR', label: 'Calibrator (CAL)', color: 'bg-[#0176d3]' },
              { type: 'QC_LOW', label: 'QC Low (QCL)', color: 'bg-[#e28704]' },
              { type: 'QC_HIGH', label: 'QC High (QCH)', color: 'bg-[#e5b800]' },
            ].map((tool) => (
              <button
                key={tool.type}
                onClick={() => setSelectedTool(tool.type as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                  selectedTool === tool.type
                    ? 'border-[#0176d3] bg-blue-50 text-[#0176d3] font-bold ring-1 ring-[#0176d3]'
                    : 'border-[#d8dde6] bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${tool.color}`}></span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 96-Well Matrix Grid */}
        <div className="overflow-x-auto bg-slate-50 p-6 rounded-md border border-slate-200">
          <div className="min-w-[720px] max-w-4xl mx-auto">
            {/* Header Columns */}
            <div className="grid grid-cols-13 gap-2 text-center text-xs font-mono font-bold text-slate-500 mb-2">
              <div className="w-8"></div>
              {COLS.map((col) => (
                <div key={col} className="w-9">{col}</div>
              ))}
            </div>

            {/* Rows */}
            {ROWS.map((row) => (
              <div key={row} className="grid grid-cols-13 gap-2 items-center mb-2">
                <div className="w-8 text-center font-mono font-bold text-slate-600 text-xs">{row}</div>
                {COLS.map((col) => {
                  const pos = `${row}${col}`;
                  const well = plate.find((w) => w.position === pos);
                  const isSelected = activeWell?.position === pos;

                  return (
                    <button
                      key={pos}
                      onClick={() => handleWellClick(pos)}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center text-[10px] font-mono transition-all transform hover:scale-110 ${getWellColor(
                        well?.type || 'EMPTY'
                      )} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      title={`${pos}: ${well?.type} ${well?.sampleBarcode ? `(${well.sampleBarcode})` : ''}`}
                    >
                      {well?.type === 'SAMPLE' && 'SMP'}
                      {well?.type === 'BLANK' && 'BLK'}
                      {well?.type === 'CALIBRATOR' && 'CAL'}
                      {well?.type === 'QC_LOW' && 'QCL'}
                      {well?.type === 'QC_HIGH' && 'QCH'}
                      {well?.type === 'EMPTY' && <span className="text-[9px] text-slate-400">{pos}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
