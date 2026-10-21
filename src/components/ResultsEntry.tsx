import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Send, 
  Lock, 
  Search,
  Filter,
  Eye,
  FileCheck
} from 'lucide-react';
import { TestOrder, TestDefinition, TestResultItem } from '../types/lims';
import { determineResultFlag } from '../utils/qcCalculations';

interface ResultsEntryProps {
  testOrders: TestOrder[];
  testDefinitions: TestDefinition[];
  onUpdateResult: (orderId: string, paramId: string, rawValue: string, reason: string) => void;
  onApproveOrder: (orderId: string, signaturePin: string, reason: string) => void;
  onNavigateToCoA?: (orderId: string) => void;
}

export const ResultsEntry: React.FC<ResultsEntryProps> = ({
  testOrders,
  testDefinitions,
  onUpdateResult,
  onApproveOrder,
  onNavigateToCoA,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(testOrders[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'APPROVED'>('ALL');
  
  // Sign-off Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signPin, setSignPin] = useState('');
  const [signReason, setSignReason] = useState('Reviewed and approved all analytical run parameters in compliance with ISO 15189.');
  const [orderToSign, setOrderToSign] = useState<TestOrder | null>(null);

  // Edit Value with Reason modal
  const [editingParam, setEditingParam] = useState<{ orderId: string; paramId: string; paramName: string; currentValue: string } | null>(null);
  const [editValueInput, setEditValueInput] = useState('');
  const [editReasonInput, setEditReasonInput] = useState('Re-assayed on secondary dilution.');

  const activeOrder = testOrders.find((o) => o.id === selectedOrderId) || testOrders[0];
  const activeDef = testDefinitions.find((d) => d.id === activeOrder?.testDefinitionId);

  const filteredOrders = testOrders.filter((o) => {
    const matchesSearch =
      o.sampleBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientOrSourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSimulateInstrumentFeed = () => {
    if (!activeOrder || !activeDef) return;
    
    // Simulate raw instrument feed population
    activeDef.parameters.forEach((p) => {
      let simulatedVal = '0';
      if (p.qcTargetMean && p.qcTargetSD) {
        simulatedVal = (p.qcTargetMean + (Math.random() - 0.5) * p.qcTargetSD * 1.5).toFixed(2);
      } else if (p.specMin && p.specMax) {
        simulatedVal = (p.specMin + Math.random() * (p.specMax - p.specMin)).toFixed(2);
      }
      onUpdateResult(activeOrder.id, p.id, simulatedVal, 'Automated Instrument Telemetry Ingestion (ASTM)');
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Analytical Results Entry & Delta Check Engine
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              21 CFR Part 11 Electronic Dual-Sign-Off
            </span>
          </div>
          <p className="text-xs text-slate-400">
            High-density tabular testing matrix, dynamic formula recalculations, and automated baseline variance delta checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateInstrumentFeed}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Simulate Instrument Telemetry Stream
          </button>
          {activeOrder && activeOrder.status !== 'APPROVED' && (
            <button
              onClick={() => {
                setOrderToSign(activeOrder);
                setShowSignModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign & Release CoA
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Orders Queue */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Assay Worklist Queue ({filteredOrders.length})
            </h3>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search barcode or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'IN_PROGRESS', 'AWAITING_REVIEW', 'APPROVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 text-[10px] rounded-lg font-mono font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredOrders.map((order) => {
              const isSelected = order.id === activeOrder?.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      {order.sampleBarcode}
                    </span>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                        order.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : order.status === 'AWAITING_REVIEW'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    {order.patientOrSourceName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {order.testName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Matrix & Result Parameters */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl space-y-6">
          {activeOrder && activeDef ? (
            <>
              {/* Active Order Details Banner */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-heading">
                      {activeOrder.testName}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {activeDef.methodReference}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>Barcode: <strong className="text-white">{activeOrder.sampleBarcode}</strong></span>
                    <span>·</span>
                    <span>Analyst: <strong className="text-slate-200">{activeOrder.assignedAnalyst}</strong></span>
                  </div>
                </div>

                {activeOrder.status === 'APPROVED' && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      Approved by {activeOrder.validatedBy?.split(',')[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Parameter Grid Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Parameter / Code</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Previous Result</th>
                      <th className="p-3">Current Measured Value</th>
                      <th className="p-3">Clinical Flag</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeDef.parameters.map((param) => {
                      const resItem: TestResultItem | undefined = activeOrder.results[param.id];
                      const currentValue = resItem?.rawValue || '--';
                      const flag = resItem?.flag || 'PENDING';

                      return (
                        <tr key={param.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-medium">
                            <div className="text-white font-semibold">{param.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {param.code} {param.dataType === 'CALCULATED' && '(Calculated Equation)'}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {param.specMin !== undefined && param.specMax !== undefined ? (
                              <span>{param.specMin} - {param.specMax} {param.unit}</span>
                            ) : param.lodLimit !== undefined ? (
                              <span>LOD: {param.lodLimit} {param.unit}</span>
                            ) : (
                              <span>Qualitative</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {resItem?.previousValue ? (
                              <span>{resItem.previousValue} {param.unit}</span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                                {currentValue}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{param.unit}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${
                                  flag === 'CRITICAL' || flag === 'OOS'
                                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                                    : flag === 'HIGH' || flag === 'LOW'
                                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                                    : flag === 'NORMAL'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {flag}
                              </span>
                              {resItem?.deltaCheckWarning && (
                                <span
                                  title="Delta Check Warning: >30% variance from previous baseline"
                                  className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono font-bold"
                                >
                                  Δ-CHECK
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setEditingParam({
                                  orderId: activeOrder.id,
                                  paramId: param.id,
                                  paramName: param.name,
                                  currentValue: resItem?.rawValue || '',
                                });
                                setEditValueInput(resItem?.rawValue || '');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded-lg font-semibold transition-all"
                            >
                              Edit / Recalc
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Select an assay order from the worklist on the left to review analytical parameters.
            </div>
          )}
        </div>
      </div>

      {/* Edit Parameter Modal with 21 CFR Part 11 Reason-For-Change Requirement */}
      {editingParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                21 CFR Part 11 Result Amendment
              </h3>
              <button onClick={() => setEditingParam(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Modifying value for <strong className="text-white">{editingParam.paramName}</strong>. All changes create an immutable hash-chained audit record.
            </p>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">New Numerical / Text Value *</label>
              <input
                type="text"
                value={editValueInput}
                onChange={(e) => setEditValueInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Mandatory Reason for Amendment *</label>
              <select
                value={editReasonInput}
                onChange={(e) => setEditReasonInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white mb-2"
              >
                <option>Re-assayed on secondary dilution</option>
                <option>Manual entry correction from instrument raw printout</option>
                <option>Baseline drift compensation after recalibration</option>
                <option>Sample repeat verification due to critical delta check</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingParam(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateResult(editingParam.orderId, editingParam.paramId, editValueInput, editReasonInput);
                  setEditingParam(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30"
              >
                Save & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 21 CFR Part 11 Electronic Dual Sign-Off Modal */}
      {showSignModal && orderToSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                21 CFR Part 11 Final Digital Approval
              </h3>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              You are applying your official digital signature and releasing the official Certificate of Analysis for <strong className="text-white font-mono">{orderToSign.sampleBarcode}</strong> ({orderToSign.testName}).
            </p>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Operator Signature PIN / Password *</label>
              <input
                type="password"
                placeholder="••••"
                value={signPin}
                onChange={(e) => setSignPin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Approval & Release Statement</label>
              <textarea
                rows={2}
                value={signReason}
                onChange={(e) => setSignReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onApproveOrder(orderToSign.id, signPin || '9988', signReason);
                  setShowSignModal(false);
                  setSignPin('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
              >
                Apply Digital Signature & Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
