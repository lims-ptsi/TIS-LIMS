import React, { useState } from 'react';
import { 
  PackageSearch, 
  Droplets, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { ReagentInventoryItem } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface InventoryTableViewProps {
  reagents: ReagentInventoryItem[];
  onDepleteReagent: (reagentId: string, volumeUsedMl: number) => void;
  onToggleLockReagent: (reagentId: string) => void;
}

export const InventoryTableView: React.FC<InventoryTableViewProps> = ({
  reagents,
  onDepleteReagent,
  onToggleLockReagent,
}) => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Reagent & Consumable Inventory Control"
        entityType="Batch"
        onCompleteStage={() => alert('Inventory lot verification complete.')}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Materials & Consumables</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reagent & Lot Master Inventory</h1>
          </div>
        </div>
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reagents.map((r) => {
          const percent = Math.round((r.volumeRemainingMl / r.initialVolumeMl) * 100);
          const isLow = r.volumeRemainingMl <= r.minThresholdAlertMl;

          return (
            <div key={r.id} className="lims-card p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {r.testCategoryId}
                  </span>
                  <button
                    onClick={() => onToggleLockReagent(r.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    {r.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-2 leading-snug">{r.name}</h4>
                <div className="text-[11px] text-slate-500 space-y-0.5 mt-1 font-mono">
                  <div>Lot: <span className="link-blue font-semibold">{r.lotNumber}</span></div>
                  <div>Supplier: {r.supplier}</div>
                  <div>Temp: {r.storageTemp}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Volume:</span>
                  <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {r.volumeRemainingMl} / {r.initialVolumeMl} mL ({percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-[#2e844a]'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => onDepleteReagent(r.id, 50)}
                  disabled={r.isLocked}
                  className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-[#d8dde6] rounded text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Droplets className="w-3 h-3 text-[#0176d3]" />
                  Simulate 50mL Run Depletion
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
