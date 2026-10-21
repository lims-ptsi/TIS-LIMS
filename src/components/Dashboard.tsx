import React from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Radio, 
  ArrowUpRight, 
  Barcode, 
  FileSpreadsheet, 
  ShieldCheck, 
  Flame,
  ArrowRight,
  TestTube
} from 'lucide-react';
import { Sample, TestOrder, InstrumentDevice, QCRunRecord } from '../types/lims';

interface DashboardProps {
  samples: Sample[];
  testOrders: TestOrder[];
  instruments: InstrumentDevice[];
  qcRuns: QCRunRecord[];
  onNavigate: (tab: string) => void;
  onSelectSampleForQuickView?: (sample: Sample) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  samples,
  testOrders,
  instruments,
  qcRuns,
  onNavigate,
}) => {
  const statSamples = samples.filter((s) => s.priority === 'STAT');
  const oosCount = testOrders.flatMap(o => Object.values(o.results)).filter(r => r.flag === 'CRITICAL' || r.flag === 'OOS').length;
  const pendingReviews = testOrders.filter(o => o.status === 'AWAITING_REVIEW').length;
  const approvedToday = testOrders.filter(o => o.status === 'APPROVED').length;

  const pipelineStages = [
    { label: 'Accessioned', count: samples.filter(s => s.status === 'ACCESSIONED' || s.status === 'RECEIVED').length, color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
    { label: 'In Testing', count: samples.filter(s => s.status === 'TESTING').length, color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20' },
    { label: 'Review Pending', count: pendingReviews, color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
    { label: 'Approved & Signed', count: approvedToday, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                Live Operations Command
              </span>
              <span className="text-xs text-slate-400 font-mono">ISO 17025 & CLIA Certified</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-heading">
              Analytical Throughput & Operations Hub
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time monitoring of clinical specimen batches, automated instrument feeds, Westgard statistical QC rules, and 21 CFR Part 11 compliant sign-off workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('accessioning')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all active:scale-95"
            >
              <Barcode className="w-4 h-4" />
              <span>Accession Sample</span>
            </button>
            <button
              onClick={() => onNavigate('plate-worklist')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>96-Well Worklist</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Samples */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase font-mono">Active Samples</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <TestTube className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-heading">{samples.length}</span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +18.4%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
            <span>Daily Intake Volume</span>
            <span className="text-slate-300 font-mono">Target: 150/day</span>
          </div>
        </div>

        {/* Card 2: STAT Urgent Priority */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase font-mono">STAT Emergency</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-200 font-heading">{statSamples.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              TAT &lt; 60m
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
            <span>Critical Hold SLA</span>
            <span className="text-rose-400 font-mono font-semibold">Priority 1 Active</span>
          </div>
        </div>

        {/* Card 3: Out-of-Specification (OOS) / Flags */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase font-mono">Critical Flags & OOS</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-200 font-heading">{oosCount}</span>
            <span className="text-xs text-amber-400 font-medium">Requires CAPA</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
            <span>Delta Check Variance</span>
            <span className="text-amber-400 font-mono font-medium">Auto-Flagged</span>
          </div>
        </div>

        {/* Card 4: TAT SLA Compliance Rate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase font-mono">TAT SLA Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-300 font-heading">98.6%</span>
            <span className="text-xs text-emerald-400 font-medium">Within SLA</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
            <span>Average TAT</span>
            <span className="text-emerald-400 font-mono">3.2 Hours</span>
          </div>
        </div>
      </div>

      {/* Operational Pipeline Flow Tracker */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Specimen Pipeline Lifecycle
          </h3>
          <span className="text-xs text-slate-400">Auto-synchronized with LIS Broker</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${stage.color} flex flex-col justify-between transition-all hover:scale-[1.02]`}
            >
              <div className="text-xs font-semibold text-slate-300">{stage.label}</div>
              <div className="text-2xl font-bold mt-2 font-heading">{stage.count} <span className="text-xs font-normal text-slate-400">units</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: STAT Urgent Queue & Live Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STAT Specimens Queue */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  STAT & Urgent Specimen Queue
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('results-entry')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>View Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {statSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-900/40 hover:border-rose-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {sample.barcode}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold font-mono">
                        STAT
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      {sample.patientOrSourceName}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Matrix: {sample.sampleType}</span>
                      <span>·</span>
                      <span className="text-rose-400 font-mono">Hold: {sample.holdTimeDeadline.split(' ')[1]}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('results-entry')}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-all active:scale-95"
                  >
                    Execute Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Instrument Telemetry Feeds */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Live Instrument Telemetry
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('instruments')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>Manage IoT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {instruments.map((inst) => (
                <div
                  key={inst.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{inst.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Protocol: {inst.protocol}</span>
                      <span>·</span>
                      <span className="text-cyan-400">{inst.throughputSamplesPerHour} smp/hr</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                      inst.status === 'RUNNING'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                    }`}>
                      {inst.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-ping"></span>}
                      {inst.status}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Cal Due: {inst.nextCalibrationDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
