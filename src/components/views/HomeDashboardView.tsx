import React from 'react';
import { 
  Leaf, 
  Box, 
  Grid3X3, 
  LineChart, 
  FileText, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Sample, TestOrder, InstrumentDevice } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface HomeDashboardViewProps {
  samples: Sample[];
  testOrders: TestOrder[];
  instruments: InstrumentDevice[];
  onNavigate: (tab: string) => void;
  onSelectSample: (sample: Sample) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  samples,
  testOrders,
  instruments,
  onNavigate,
  onSelectSample,
}) => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Repository Operational Overview"
        entityType="Sample"
        onCompleteStage={() => onNavigate('samples')}
      />

      {/* 2. Top Banner Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-50 text-[#0176d3] border border-blue-200">
              Sample Management Portal
            </span>
            <span className="text-xs text-slate-500">Lockbox LIMS Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Laboratory Operations & Specimen Tracking
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl">
            Complete lifecycle management from intake accessioning to 96-well microplate normalization, QC statistical validation, and cryogenic storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('samples')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Leaf className="w-4 h-4" />
            <span>View Today's Samples</span>
          </button>
        </div>
      </div>

      {/* 3. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div 
          onClick={() => onNavigate('submissions')}
          className="lims-card p-4 space-y-1 cursor-pointer hover:border-[#0176d3] transition-colors"
        >
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>Test Submissions</span>
            <FileText className="w-4 h-4 text-[#0176d3]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">Active</div>
          <div className="text-[11px] text-slate-500">eTRF Intake &amp; Reception</div>
        </div>

        <div 
          onClick={() => onNavigate('samples')}
          className="lims-card p-4 space-y-1 cursor-pointer hover:border-[#0176d3] transition-colors"
        >
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>Accessioned Samples</span>
            <Leaf className="w-4 h-4 text-[#2e844a]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{samples.length}</div>
          <div className="text-[11px] text-slate-500">In testing repository</div>
        </div>

        <div 
          onClick={() => onNavigate('coa-reports')}
          className="lims-card p-4 space-y-1 cursor-pointer hover:border-[#0176d3] transition-colors"
        >
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>CoA Deliverables</span>
            <TrendingUp className="w-4 h-4 text-[#00a1e0]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{testOrders.length}</div>
          <div className="text-[11px] text-slate-500">Clinical Test Reports</div>
        </div>

        <div 
          onClick={() => onNavigate('audit-trail')}
          className="lims-card p-4 space-y-1 cursor-pointer hover:border-[#0176d3] transition-colors"
        >
          <div className="flex justify-between items-center text-slate-500 font-semibold">
            <span>Audit Trail &amp; CFR</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">Compliant</div>
          <div className="text-[11px] text-slate-500">21 CFR Part 11 Active</div>
        </div>
      </div>

      {/* 4. Quick Sample List */}
      <div className="lims-card p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-[#2e844a]" />
            <span>Recent Submitted Samples</span>
          </h3>
          <button 
            onClick={() => onNavigate('samples')}
            className="link-blue text-xs font-semibold flex items-center gap-1"
          >
            <span>View All Today's Samples</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse lims-table">
            <thead>
              <tr>
                <th>Customer Sample Name</th>
                <th>Sample ID</th>
                <th>Sample Name</th>
                <th>Box ID</th>
                <th>Box Position</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Leaf className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <p className="text-xs font-semibold">No samples accessioned yet.</p>
                  </td>
                </tr>
              ) : (
                samples.slice(0, 4).map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => {
                      onSelectSample(s);
                      onNavigate('sample-detail');
                    }}
                    className="cursor-pointer"
                  >
                    <td className="font-semibold text-slate-900">
                      {s.patientOrSourceName.split(' ')[0]}
                    </td>
                    <td className="link-blue font-mono">
                      {s.barcode}
                    </td>
                    <td className="text-slate-800">
                      {s.externalId || s.patientOrSourceName}
                    </td>
                    <td className="link-blue font-mono">
                      {s.storageLocation?.box || 'BX000010'}
                    </td>
                    <td className="font-mono text-slate-800">
                      {s.storageLocation?.well || 'A01'}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
