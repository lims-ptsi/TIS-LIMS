import React from 'react';
import { 
  FlaskConical, 
  Scan, 
  ShieldCheck, 
  Activity, 
  Bell, 
  UserCheck, 
  Sparkles,
  Radio
} from 'lucide-react';

interface HeaderProps {
  onOpenScanner: () => void;
  statCount: number;
  activeInstrumentCount: number;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  statCount,
  activeInstrumentCount,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
            <FlaskConical className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-heading">
                Aegis<span className="text-cyan-400">LIMS</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 rounded-full">
                ENTERPRISE v4.2
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-800/50 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                21 CFR Part 11 Validated
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Clinical & Analytical Systems · Lab Cluster Alpha
            </p>
          </div>
        </div>

        {/* Live Telemetry & Quick Action Bar */}
        <div className="flex items-center gap-3">
          {/* Active Instruments Status */}
          <div 
            onClick={() => onNavigate('instruments')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-700/50 cursor-pointer transition-colors"
            title="Active Analytical Instruments"
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-slate-400">Instruments: </span>
              <span className="font-semibold text-emerald-400">{activeInstrumentCount} Online</span>
            </div>
          </div>

          {/* STAT Urgency Badge */}
          {statCount > 0 && (
            <div 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 cursor-pointer hover:bg-rose-900/60 transition-colors shadow-sm"
              title="Urgent STAT Samples Awaiting Processing"
            >
              <Activity className="w-4 h-4 text-rose-400 animate-bounce" />
              <div className="text-xs font-semibold">
                <span>{statCount} STAT</span>
                <span className="hidden md:inline text-rose-400 font-normal"> Urgent</span>
              </div>
            </div>
          )}

          {/* Fast Barcode Quick Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Scan</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-slate-900/60 rounded border border-white/20 font-mono">
              F2
            </kbd>
          </button>

          {/* User Session Profile with E-Sign Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white border border-cyan-400/40">
              KZ
            </div>
            <div className="hidden xl:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">Dr. Katherine Zhang</span>
                <span title="E-Signature Authorized"><UserCheck className="w-3 h-3 text-cyan-400" /></span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span>Lead Chemist / CLS</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400">Auth Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
