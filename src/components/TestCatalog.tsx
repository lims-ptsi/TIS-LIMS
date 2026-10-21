import React, { useState } from 'react';
import { 
  FlaskRound, 
  Plus, 
  Calculator, 
  Code, 
  Check, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Play
} from 'lucide-react';
import { TestDefinition, TestParameter } from '../types/lims';
import { evaluateFormula } from '../utils/qcCalculations';

interface TestCatalogProps {
  testDefinitions: TestDefinition[];
  onAddTestDefinition: (test: TestDefinition) => void;
}

export const TestCatalog: React.FC<TestCatalogProps> = ({
  testDefinitions,
  onAddTestDefinition,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Dynamic Test Catalog & Formula Calculation Engine
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Multi-Analyte Graph Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Define custom analytical assays, configure dynamic multi-step math formulas, and calibrate limit thresholds without schema redeployment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Catalog List */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Available Assays ({testDefinitions.length})
          </h3>

          <div className="space-y-2">
            {testDefinitions.map((test) => {
              const isSelected = test.id === selectedTest.id;
              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono text-cyan-300">{test.code}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                      {test.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{test.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Ref: {test.methodReference}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5 font-mono">
                    <span>{test.parameters.length} Parameters</span>
                    <span className="text-emerald-400">TAT: {test.tatHours}h SLA</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Parameter Structure & Interactive Formula Sandbox */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Test Parameters Table */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Parameters Configuration for {selectedTest.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Method: {selectedTest.methodReference}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Seq</th>
                    <th className="p-3">Code & Name</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Reference Specs</th>
                    <th className="p-3">Calculation / Formula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedTest.parameters.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-400">{p.sequenceOrder}</td>
                      <td className="p-3 font-medium">
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {p.code} ({p.unit})
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                          p.dataType === 'CALCULATED' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.dataType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {p.specMin !== undefined && p.specMax !== undefined ? (
                          <span className="text-cyan-300">{p.specMin} - {p.specMax} {p.unit}</span>
                        ) : p.lodLimit !== undefined ? (
                          <span className="text-cyan-300">LOD: {p.lodLimit} / LOQ: {p.loqLimit}</span>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {p.calculationFormula ? (
                          <code className="px-2 py-0.5 bg-slate-950 text-emerald-300 rounded border border-slate-700">
                            {p.calculationFormula}
                          </code>
                        ) : (
                          <span className="text-slate-400">Direct Sensor Measurement</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Formula Sandbox */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              Dynamic Formula Execution Sandbox
            </h3>
            <p className="text-xs text-slate-400">
              Test mathematical equations with live variable inputs to verify automated calculation pipelines.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mathematical Equation (Safe Math Syntax)
                </label>
                <input
                  type="text"
                  value={sandboxFormula}
                  onChange={(e) => setSandboxFormula(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Variable A (RBC Count)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sandboxInputs.RBC || 4.85}
                    onChange={(e) => setSandboxInputs({ ...sandboxInputs, RBC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Variable B (MCV Volume)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sandboxInputs.MCV || 89.5}
                    onChange={(e) => setSandboxInputs({ ...sandboxInputs, MCV: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTestSandbox}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Evaluate Equation
                </button>

                {calculatedOutput !== null && (
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-slate-400">Calculated Result:</span>
                    <span className="text-lg font-bold text-emerald-400 bg-slate-950 px-3 py-1 rounded-xl border border-emerald-500/40">
                      {calculatedOutput} %
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
