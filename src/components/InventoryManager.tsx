import React, { useState } from 'react';
import { 
  PackageSearch, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  MinusCircle, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Search,
  Lock,
  Unlock,
  Droplets
} from 'lucide-react';
import { ReagentInventoryItem } from '../types/lims';

interface InventoryManagerProps {
  reagents: ReagentInventoryItem[];
  onDepleteReagent: (reagentId: string, volumeUsedMl: number) => void;
  onToggleLockReagent: (reagentId: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  reagents,
  onDepleteReagent,
  onToggleLockReagent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredReagents = reagents.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulateBatchConsumption = (reagent: ReagentInventoryItem) => {
    const consumption = reagent.testCategoryId === 'Environmental & Water' ? 20 : 50;
    onDepleteReagent(reagent.id, consumption);
    setToastMessage(`Auto-depleted ${consumption} mL from Lot ${reagent.lotNumber} after analytical run completion.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Reagent, Consumables & Lot Inventory Control
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Automated Bill-of-Materials Depletion
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time lot expiration tracking, open-vial stability countdowns, and automated threshold alerts preventing expired-lot runs.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredReagents.map((reagent) => {
          const percentRemaining = Math.max(0, Math.min(100, Math.round((reagent.volumeRemainingMl / reagent.initialVolumeMl) * 100)));
          const isLow = reagent.volumeRemainingMl <= reagent.minThresholdAlertMl;

          return (
            <div
              key={reagent.id}
              className={`glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4 border transition-all ${
                reagent.isLocked
                  ? 'border-rose-800/80 bg-rose-950/20'
                  : isLow
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'hover:border-cyan-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {reagent.testCategoryId}
                  </span>
                  <button
                    onClick={() => onToggleLockReagent(reagent.id)}
                    title={reagent.isLocked ? 'Reagent Lot Locked: Click to Unlock' : 'Reagent Active: Click to Lock'}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      reagent.isLocked
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {reagent.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white mt-2 leading-snug">{reagent.name}</h4>
                <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                  <div>Lot: <strong className="text-cyan-300">{reagent.lotNumber}</strong></div>
                  <div>Supplier: {reagent.supplier}</div>
                  <div>Storage: {reagent.storageTemp}</div>
                </div>
              </div>

              {/* Volume Progress Meter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Volume Level:</span>
                  <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {reagent.volumeRemainingMl} / {reagent.initialVolumeMl} mL ({percentRemaining}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLow ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                    }`}
                    style={{ width: `${percentRemaining}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Exp: {reagent.expirationDate}</span>
                  <span>Stability: {reagent.openStabilityDays}d</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => handleSimulateBatchConsumption(reagent)}
                disabled={reagent.isLocked}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  reagent.isLocked
                    ? 'bg-slate-900 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Simulate Run Depletion
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
