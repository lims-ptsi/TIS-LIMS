import React, { useState } from 'react';
import { 
  FileText, 
  FlaskRound, 
  Calculator, 
  Play, 
  Sparkles, 
  Layers, 
  Leaf 
} from 'lucide-react';
import { TestDefinition } from '../../types/lims';
import { evaluateFormula } from '../../utils/qcCalculations';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface ProtocolsViewProps {
  testDefinitions: TestDefinition[];
  onAddProtocol?: (def: TestDefinition) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  testDefinitions,
  onAddProtocol,
}) => {
  const [selectedTest, setSelectedTest] = useState<TestDefinition>(testDefinitions[0]);
  const [sandboxFormula, setSandboxFormula] = useState("param['RBC'] * param['MCV'] / 10");
  const [sandboxInputs, setSandboxInputs] = useState<Record<string, number>>({
    RBC: 4.85,
    MCV: 89.5,
  });
  const [calculatedOutput, setCalculatedOutput] = useState<number | null>(null);

  const handleTestSandbox = () => {
    const result = evaluateFormula(sandboxFormula, sandboxInputs);
    setCalculatedOutput(result);
  };

  return (
    <div className="lims-page-shell">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Protocol Configuration & SOP Validation"
        entityType="Batch"
        onCompleteStage={() => alert(`Standard Operating Procedure ${selectedTest.code} validated.`)}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Testing Protocols & SOPs</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedTest.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTest.id}
            onChange={(e) => {
              const found = testDefinitions.find((t) => t.id === e.target.value);
              if (found) setSelectedTest(found);
            }}
            className="px-3 py-1.5 text-xs rounded border border-[#d8dde6] bg-white text-slate-800 font-medium"
          >
            {testDefinitions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} · {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Protocol Information & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Parameter Table */}
        <div className="lg:col-span-8 lims-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-900">
              Protocol Parameters ({selectedTest.parameters.length})
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Method Ref: {selectedTest.methodReference}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse lims-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Parameter Name</th>
                  <th>Code</th>
                  <th>Data Type</th>
                  <th>Reference Limits</th>
                  <th>Formula</th>
                </tr>
              </thead>
              <tbody>
                {selectedTest.parameters.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="font-mono text-slate-400 text-xs">{idx + 1}</td>
                    <td className="font-semibold text-slate-900">{p.name}</td>
                    <td className="font-mono link-blue">{p.code}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                        {p.dataType}
                      </span>
                    </td>
                    <td className="font-mono text-xs">
                      {p.specMin !== undefined && p.specMax !== undefined ? `${p.specMin} - ${p.specMax} ${p.unit}` : 'Qualitative'}
                    </td>
                    <td className="font-mono text-xs text-emerald-700">
                      {p.calculationFormula || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Formula Sandbox */}
        <div className="lg:col-span-4 lims-card p-5 space-y-4">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-[#0176d3]" />
            <span>Formula Calculator Sandbox</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Equation Expression</label>
              <input
                type="text"
                value={sandboxFormula}
                onChange={(e) => setSandboxFormula(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#d8dde6] bg-slate-50 text-emerald-700 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 text-[11px] block">RBC Count</label>
                <input
                  type="number"
                  step="0.01"
                  value={sandboxInputs.RBC || 4.85}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, RBC: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border border-[#d8dde6] font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 text-[11px] block">MCV Volume</label>
                <input
                  type="number"
                  step="0.1"
                  value={sandboxInputs.MCV || 89.5}
                  onChange={(e) => setSandboxInputs({ ...sandboxInputs, MCV: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border border-[#d8dde6] font-mono text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleTestSandbox}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded text-xs font-bold shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Evaluate Dynamic Equation
            </button>

            {calculatedOutput !== null && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center">
                <span className="text-[11px] text-emerald-700 font-medium">Calculated Output:</span>
                <div className="text-lg font-bold text-emerald-900 font-mono">{calculatedOutput} %</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
