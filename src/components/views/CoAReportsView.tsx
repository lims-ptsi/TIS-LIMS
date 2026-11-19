import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  QrCode, 
  ShieldCheck, 
  User, 
  Calendar,
  Share2
} from 'lucide-react';
import { TestOrder, Sample, TestDefinition } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import { LimsPageHeader } from '../common/LimsPageHeader';

interface CoAReportsViewProps {
  testOrders: TestOrder[];
  samples: Sample[];
  testDefinitions: TestDefinition[];
}

export const CoAReportsView: React.FC<CoAReportsViewProps> = ({
  testOrders,
  samples,
  testDefinitions,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(testOrders[0]?.id || '');

  if (!testOrders || testOrders.length === 0) {
    return (
      <div className="lims-page-shell">
        <LifecycleChevronBar
          currentStage="Certificate of Analysis Release"
          entityType="Sample"
          onCompleteStage={() => {}}
        />
        <div className="lims-card p-16 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Certificate of Analysis Deliverables Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Analytical results must be validated and signed off on active lab test requests to generate official Certificates of Analysis (CoA).
          </p>
        </div>
      </div>
    );
  }

  const currentOrder = testOrders.find((o) => o.id === selectedOrderId) || testOrders[0];
  const currentSample = samples.find((s) => s.id === currentOrder?.sampleId) || samples[0];
  const currentDef = testDefinitions.find((d) => d.id === currentOrder?.testDefinitionId) || testDefinitions[0];

  return (
    <div className="lims-page-shell">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Certificate of Analysis Release"
        entityType="Sample"
        onCompleteStage={() => window.print()}
      />

      <LimsPageHeader
        className="print:hidden"
        eyebrow="Deliverables & reports"
        icon={FileText}
        title="Official certificate of analysis"
        actions={
        <div className="flex items-center gap-2">
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="lims-input px-3 py-2 text-xs font-mono max-w-xs"
          >
            {testOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.sampleBarcode} · {o.patientOrSourceName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="lims-btn-primary px-4 py-2 text-xs rounded-lg shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print report PDF
          </button>
        </div>
        }
      />

      {/* 3. A4 Document */}
      <div className="lims-card text-slate-900 p-8 max-w-4xl mx-auto space-y-6 font-sans print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AEGIS ADVANCED LABORATORIES</h2>
            <p className="text-xs text-slate-600">Accredited Clinical, Molecular & Environmental Testing Center</p>
            <p className="text-[11px] text-slate-500 font-mono">742 Bioscience Pkwy · CLIA: 22D2091448 · ISO 15189</p>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded uppercase">
              CERTIFICATE OF ANALYSIS
            </div>
            <div className="text-slate-700 font-bold mt-1">Ref: CoA-2026-{currentSample?.barcode.split('-')[2] || '88019'}</div>
          </div>
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-700 uppercase text-[10px]">Specimen Details</div>
            <div><span className="text-slate-500">Customer:</span> <strong className="text-slate-900">{currentSample?.patientOrSourceName}</strong></div>
            <div><span className="text-slate-500">Sample ID:</span> <span className="font-mono">{currentSample?.externalId}</span></div>
            <div><span className="text-slate-500">Matrix:</span> {currentSample?.sampleType}</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-slate-700 uppercase text-[10px]">Timeline & Status</div>
            <div><span className="text-slate-500">Collected:</span> {currentSample?.collectionDate}</div>
            <div><span className="text-slate-500">Received:</span> {currentSample?.receivedDate}</div>
            <div><span className="text-slate-500">Preservation:</span> <span className="text-emerald-700 font-medium">{currentSample?.preservationStatus}</span></div>
          </div>
        </div>

        {/* Results Table */}
        <table className="w-full text-left text-xs border-collapse lims-table">
          <thead>
            <tr>
              <th>Analyte</th>
              <th>Measured Value</th>
              <th>Unit</th>
              <th>Reference Interval</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {currentDef?.parameters.map((p) => {
              const res = currentOrder?.results[p.id];
              return (
                <tr key={p.id}>
                  <td className="font-semibold text-slate-900">{p.name}</td>
                  <td className="font-bold font-mono text-sm">{res?.rawValue || '--'}</td>
                  <td className="font-mono text-slate-600">{p.unit}</td>
                  <td className="font-mono text-slate-600">
                    {p.specMin !== undefined ? `${p.specMin} - ${p.specMax}` : 'Qualitative'}
                  </td>
                  <td>
                    {res?.flag && res.flag !== 'NORMAL' ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300">
                        {res.flag}
                      </span>
                    ) : (
                      <span className="text-slate-400">Normal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signatures & QR */}
        <div className="flex justify-between items-end pt-4 border-t-2 border-slate-900 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Medical Laboratory Director</div>
            <div className="font-serif italic text-base font-bold text-slate-900">Dr. Arthur Sterling, MD</div>
            <div className="text-[10px] text-slate-500 font-mono">21 CFR Part 11 Digital E-Sign Seal</div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
            <QrCode className="w-10 h-10 text-slate-900" />
            <div className="text-[9px] text-slate-600 font-mono">
              <div className="font-bold text-slate-900">VERIFIED REPORT</div>
              <div>Aegis Public Registry</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
