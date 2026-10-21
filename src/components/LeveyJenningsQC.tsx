import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  AlertOctagon, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Sliders,
  History,
  TrendingUp
} from 'lucide-react';
import { QCRunRecord } from '../types/lims';
import { evaluateWestgardRules, computeZScore } from '../utils/qcCalculations';

interface LeveyJenningsQCProps {
  qcRuns: QCRunRecord[];
  onAddQCRun: (newRun: QCRunRecord) => void;
}

export const LeveyJenningsQC: React.FC<LeveyJenningsQCProps> = ({
  qcRuns,
  onAddQCRun,
}) => {
  const [selectedAnalyte, setSelectedAnalyte] = useState<'WBC' | 'Pb_Lead'>('WBC');
  const [newMeasuredInput, setNewMeasuredInput] = useState('7.25');
  const [simulatedZ, setSimulatedZ] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter runs for selected analyte
  const analyteRuns = qcRuns.filter((r) => r.parameterCode === selectedAnalyte);
  const targetMean = analyteRuns[0]?.targetMean || (selectedAnalyte === 'WBC' ? 7.2 : 10.0);
  const targetSD = analyteRuns[0]?.targetSD || (selectedAnalyte === 'WBC' ? 0.35 : 0.45);
  const controlLot = analyteRuns[0]?.controlLot || 'QC-LOT-HEM-LEVEL2-A';

  // Last run evaluation
  const latestRun = analyteRuns[analyteRuns.length - 1];
  const lastWestgard = latestRun
    ? evaluateWestgardRules(
        analyteRuns.slice(0, -1),
        latestRun.measuredValue,
        targetMean,
        targetSD
      )
    : null;

  const handleSimulateNewQCPoint = (forcedValue?: number) => {
    const val = forcedValue !== undefined ? forcedValue : parseFloat(newMeasuredInput) || targetMean;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const evaluation = evaluateWestgardRules(analyteRuns, val, targetMean, targetSD);
    const zScore = computeZScore(val, targetMean, targetSD);

    const newRecord: QCRunRecord = {
      id: `qc-${Date.now()}`,
      runDate: now,
      testCode: selectedAnalyte === 'WBC' ? 'CBC_DIFF' : 'HEAVY_METALS_WATER',
      parameterCode: selectedAnalyte,
      parameterName: selectedAnalyte === 'WBC' ? 'White Blood Cell Count' : 'Lead (Pb)',
      controlLot,
      level: 'LEVEL_2_NORMAL',
      targetMean,
      targetSD,
      measuredValue: val,
      zScore,
      westgardRuleTriggered: evaluation.rule,
      status: evaluation.status,
      analyst: 'Dr. Katherine Zhang, Lead Chemist',
      correctiveAction: evaluation.status === 'REJECTED' ? 'Westgard violation triggered. System quarantined instrument batch.' : undefined,
    };

    onAddQCRun(newRecord);
    setToastMessage(`QC Point recorded: ${val} (Z-Score: ${zScore} SD). Westgard Result: ${evaluation.rule}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Dimensions for SVG Levey-Jennings chart
  const width = 760;
  const height = 300;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Y mapping: +3.5 SD to -3.5 SD
  const maxSD = 3.5;
  const getYForZ = (z: number) => {
    const clampedZ = Math.max(-maxSD, Math.min(maxSD, z));
    return padding + (chartHeight / 2) - (clampedZ / maxSD) * (chartHeight / 2);
  };

  const getXForIndex = (index: number, total: number) => {
    if (total <= 1) return padding + chartWidth / 2;
    return padding + (index / (total - 1)) * chartWidth;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Statistical Quality Control (Levey-Jennings & Westgard Multi-Rules)
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              ISO 15189 / 17025 SPC Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated statistical process control, Gaussian distribution tracking, and real-time detection of systematic shifts & random errors.
          </p>
        </div>

        {/* Analyte Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Analyte QC Stream:</label>
          <select
            value={selectedAnalyte}
            onChange={(e) => setSelectedAnalyte(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none"
          >
            <option value="WBC">Hematology: WBC Count (Sysmex XN-1000)</option>
            <option value="Pb_Lead">Trace Metals: Lead Pb (iCAP ICP-MS)</option>
          </select>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          {toastMessage}
        </div>
      )}

      {/* QC Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-slate-400">Target Mean (x̄)</span>
          <div className="text-2xl font-bold text-white font-heading">{targetMean.toFixed(2)}</div>
          <span className="text-slate-400">Baseline Target</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-slate-400">Standard Deviation (1 SD)</span>
          <div className="text-2xl font-bold text-cyan-400 font-heading">±{targetSD.toFixed(2)}</div>
          <span className="text-slate-400">Tolerance Band</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-slate-400">Control Lot Number</span>
          <div className="text-sm font-bold text-white truncate font-mono">{controlLot}</div>
          <span className="text-emerald-400">Valid & Certified</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-slate-400">Current Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                lastWestgard?.status === 'REJECTED'
                  ? 'bg-rose-950 text-rose-300 border-rose-600'
                  : lastWestgard?.status === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-600'
              }`}
            >
              {lastWestgard?.status || 'IN CONTROL'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            Rule: {lastWestgard?.rule || 'NONE'}
          </span>
        </div>
      </div>

      {/* Main Levey-Jennings Chart Canvas */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-cyan-400" />
            Levey-Jennings Control Chart (Mean ± 3 SD Limits)
          </h3>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400">── Mean</span>
            <span className="text-amber-400">── ±2 SD (Warn)</span>
            <span className="text-rose-400">── ±3 SD (Reject)</span>
          </div>
        </div>

        {/* Responsive Chart Container */}
        <div className="overflow-x-auto bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-4xl mx-auto h-72 select-none">
            {/* Background Grid */}
            <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="#090d16" rx="8" />

            {/* +3 SD Line (Reject) */}
            <line x1={padding} y1={getYForZ(3)} x2={width - padding} y2={getYForZ(3)} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 35} y={getYForZ(3) + 4} fill="#f43f5e" fontSize="10" fontFamily="monospace">+3 SD ({(targetMean + 3 * targetSD).toFixed(2)})</text>

            {/* +2 SD Line (Warning) */}
            <line x1={padding} y1={getYForZ(2)} x2={width - padding} y2={getYForZ(2)} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 35} y={getYForZ(2) + 4} fill="#f59e0b" fontSize="10" fontFamily="monospace">+2 SD ({(targetMean + 2 * targetSD).toFixed(2)})</text>

            {/* +1 SD Line */}
            <line x1={padding} y1={getYForZ(1)} x2={width - padding} y2={getYForZ(1)} stroke="#334155" strokeDasharray="2 2" strokeWidth="1" />

            {/* Mean (Center Line) */}
            <line x1={padding} y1={getYForZ(0)} x2={width - padding} y2={getYForZ(0)} stroke="#10b981" strokeWidth="2" />
            <text x={padding - 35} y={getYForZ(0) + 4} fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="monospace">Mean ({targetMean.toFixed(2)})</text>

            {/* -1 SD Line */}
            <line x1={padding} y1={getYForZ(-1)} x2={width - padding} y2={getYForZ(-1)} stroke="#334155" strokeDasharray="2 2" strokeWidth="1" />

            {/* -2 SD Line (Warning) */}
            <line x1={padding} y1={getYForZ(-2)} x2={width - padding} y2={getYForZ(-2)} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 35} y={getYForZ(-2) + 4} fill="#f59e0b" fontSize="10" fontFamily="monospace">-2 SD ({(targetMean - 2 * targetSD).toFixed(2)})</text>

            {/* -3 SD Line (Reject) */}
            <line x1={padding} y1={getYForZ(-3)} x2={width - padding} y2={getYForZ(-3)} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 35} y={getYForZ(-3) + 4} fill="#f43f5e" fontSize="10" fontFamily="monospace">-3 SD ({(targetMean - 3 * targetSD).toFixed(2)})</text>

            {/* Connecting Polyline */}
            {analyteRuns.length > 1 && (
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                points={analyteRuns
                  .map((r, i) => `${getXForIndex(i, analyteRuns.length)},${getYForZ(r.zScore)}`)
                  .join(' ')}
              />
            )}

            {/* Data Points */}
            {analyteRuns.map((r, i) => {
              const cx = getXForIndex(i, analyteRuns.length);
              const cy = getYForZ(r.zScore);
              const isError = r.status === 'REJECTED';
              const isWarning = r.status === 'WARNING';

              return (
                <g key={r.id} className="cursor-pointer group">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isError ? 7 : isWarning ? 6 : 5}
                    fill={isError ? '#f43f5e' : isWarning ? '#f59e0b' : '#06b6d4'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Tooltip on hover simulation */}
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="9"
                    fontFamily="monospace"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {r.measuredValue} ({r.zScore > 0 ? `+${r.zScore}` : r.zScore} SD)
                  </text>
                  <text
                    x={cx}
                    y={height - padding + 15}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    Run #{i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Westgard Rules Live Evaluation & Simulator Toolbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Westgard Rules Cheat-sheet & Status */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Active Westgard Decision Rules
          </h3>
          <div className="space-y-2 text-xs">
            {[
              { rule: '1-2s Rule', type: 'WARNING', desc: '1 control exceeds ±2 SD. Screening trigger for systematic drift.' },
              { rule: '1-3s Rule', type: 'REJECTION', desc: '1 control exceeds ±3 SD. Random error or gross instrument fault.' },
              { rule: '2-2s Rule', type: 'REJECTION', desc: '2 consecutive controls exceed +2 SD or -2 SD. Systematic shift.' },
              { rule: 'R-4s Rule', type: 'REJECTION', desc: 'Difference between controls in same run > 4 SD. Random dispersal.' },
              { rule: '4-1s Rule', type: 'REJECTION', desc: '4 consecutive controls exceed +1 SD or -1 SD. Calibration needed.' },
              { rule: '10-x Rule', type: 'REJECTION', desc: '10 consecutive controls fall on same side of mean. Baseline drift.' },
            ].map((w, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-slate-200">{w.rule}</div>
                  <p className="text-[11px] text-slate-400">{w.desc}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                    w.type === 'REJECTION' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {w.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time QC Simulator & Direct Entry */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Live QC Point Ingestion Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Inject test data points to verify immediate automated Westgard rule evaluation and batch auto-quarantine.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Measured Value Input ({selectedAnalyte})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={newMeasuredInput}
                  onChange={(e) => setNewMeasuredInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSimulateNewQCPoint()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Record Run
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Preset Error Injections:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateNewQCPoint(targetMean + targetSD * 3.4)}
                  className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold text-left transition-all"
                >
                  💥 Trigger 1-3s Error (+3.4 SD)
                </button>
                <button
                  onClick={() => handleSimulateNewQCPoint(targetMean + targetSD * 2.2)}
                  className="p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold text-left transition-all"
                >
                  ⚠️ Trigger 1-2s Warning (+2.2 SD)
                </button>
                <button
                  onClick={() => handleSimulateNewQCPoint(targetMean + targetSD * 0.15)}
                  className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold text-left transition-all"
                >
                  ✅ In-Control Run (Ideal x̄)
                </button>
                <button
                  onClick={() => handleSimulateNewQCPoint(targetMean - targetSD * 2.3)}
                  className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold text-left transition-all"
                >
                  📉 Trigger Shift (-2.3 SD)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
