import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  ShieldAlert, 
  Sparkles, 
  Check, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { QCRunRecord } from '../../types/lims';
import { evaluateWestgardRules, computeZScore } from '../../utils/qcCalculations';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface QCAnalyticsViewProps {
  qcRuns: QCRunRecord[];
  onAddQCRun: (newRun: QCRunRecord) => void;
}

export const QCAnalyticsView: React.FC<QCAnalyticsViewProps> = ({
  qcRuns,
  onAddQCRun,
}) => {
  const [selectedAnalyte, setSelectedAnalyte] = useState<'WBC' | 'Pb_Lead'>('WBC');
  const [newMeasuredInput, setNewMeasuredInput] = useState('7.25');

  const analyteRuns = qcRuns.filter((r) => r.parameterCode === selectedAnalyte);
  const targetMean = analyteRuns[0]?.targetMean || (selectedAnalyte === 'WBC' ? 7.2 : 10.0);
  const targetSD = analyteRuns[0]?.targetSD || (selectedAnalyte === 'WBC' ? 0.35 : 0.45);
  const controlLot = analyteRuns[0]?.controlLot || 'QC-LOT-HEM-LEVEL2-A';

  const width = 740;
  const height = 280;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxSD = 3.5;

  const getYForZ = (z: number) => {
    const clampedZ = Math.max(-maxSD, Math.min(maxSD, z));
    return padding + (chartHeight / 2) - (clampedZ / maxSD) * (chartHeight / 2);
  };

  const getXForIndex = (index: number, total: number) => {
    if (total <= 1) return padding + chartWidth / 2;
    return padding + (index / (total - 1)) * chartWidth;
  };

  const handleRecordRun = (val: number) => {
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
    };
    onAddQCRun(newRecord);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Quality Control Testing Complete"
        entityType="Batch"
        onCompleteStage={() => alert('Quality Control Testing verified against Westgard multi-rules.')}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <LineChartIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Quality Assurance & SPC</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Levey-Jennings Quality Control</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAnalyte}
            onChange={(e) => setSelectedAnalyte(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 font-medium"
          >
            <option value="WBC">Hematology: WBC (Sysmex XN-1000)</option>
            <option value="Pb_Lead">Trace Metals: Lead Pb (iCAP ICP-MS)</option>
          </select>
        </div>
      </div>

      {/* 3. Levey-Jennings Chart Card */}
      <div className="lims-card p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <span>Statistical Control Boundaries (Target: {targetMean} ± {targetSD} SD)</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-600 font-bold">── Mean ({targetMean})</span>
            <span className="text-amber-600 font-bold">── ±2 SD (Warn)</span>
            <span className="text-rose-600 font-bold">── ±3 SD (Reject)</span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-4xl mx-auto h-64 select-none">
            {/* Target Mean Line */}
            <line x1={padding} y1={getYForZ(0)} x2={width - padding} y2={getYForZ(0)} stroke="#2e844a" strokeWidth="2" />
            <text x={padding - 40} y={getYForZ(0) + 4} fill="#2e844a" fontSize="10" fontWeight="bold">Mean</text>

            {/* +2 SD */}
            <line x1={padding} y1={getYForZ(2)} x2={width - padding} y2={getYForZ(2)} stroke="#e28704" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 40} y={getYForZ(2) + 4} fill="#e28704" fontSize="9">+2 SD</text>

            {/* -2 SD */}
            <line x1={padding} y1={getYForZ(-2)} x2={width - padding} y2={getYForZ(-2)} stroke="#e28704" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 40} y={getYForZ(-2) + 4} fill="#e28704" fontSize="9">-2 SD</text>

            {/* +3 SD */}
            <line x1={padding} y1={getYForZ(3)} x2={width - padding} y2={getYForZ(3)} stroke="#c23934" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 40} y={getYForZ(3) + 4} fill="#c23934" fontSize="9">+3 SD</text>

            {/* -3 SD */}
            <line x1={padding} y1={getYForZ(-3)} x2={width - padding} y2={getYForZ(-3)} stroke="#c23934" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={padding - 40} y={getYForZ(-3) + 4} fill="#c23934" fontSize="9">-3 SD</text>

            {/* Polyline */}
            {analyteRuns.length > 1 && (
              <polyline
                fill="none"
                stroke="#0176d3"
                strokeWidth="2.5"
                points={analyteRuns
                  .map((r, i) => `${getXForIndex(i, analyteRuns.length)},${getYForZ(r.zScore)}`)
                  .join(' ')}
              />
            )}

            {/* Points */}
            {analyteRuns.map((r, i) => {
              const cx = getXForIndex(i, analyteRuns.length);
              const cy = getYForZ(r.zScore);
              const isError = r.status === 'REJECTED';
              const isWarning = r.status === 'WARNING';

              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r={isError ? 6 : 5}
                  fill={isError ? '#c23934' : isWarning ? '#e28704' : '#0176d3'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Quick Simulation Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-slate-600">Preset QC Test Runs:</span>
          <button
            onClick={() => handleRecordRun(targetMean + targetSD * 0.2)}
            className="px-3 py-1 rounded border border-[#d8dde6] bg-white hover:bg-slate-50 text-xs font-semibold text-emerald-700"
          >
            ✅ In Control Run (x̄)
          </button>
          <button
            onClick={() => handleRecordRun(targetMean + targetSD * 2.2)}
            className="px-3 py-1 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800"
          >
            ⚠️ Warning (+2.2 SD)
          </button>
          <button
            onClick={() => handleRecordRun(targetMean + targetSD * 3.3)}
            className="px-3 py-1 rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-800"
          >
            ❌ 1-3s Error (+3.3 SD)
          </button>
        </div>
      </div>
    </div>
  );
};
