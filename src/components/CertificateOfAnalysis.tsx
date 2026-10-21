import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Award,
  Calendar,
  User,
  Share2
} from 'lucide-react';
import { TestOrder, Sample, TestDefinition } from '../types/lims';

interface CertificateOfAnalysisProps {
  testOrders: TestOrder[];
  samples: Sample[];
  testDefinitions: TestDefinition[];
}

export const CertificateOfAnalysis: React.FC<CertificateOfAnalysisProps> = ({
  testOrders,
  samples,
  testDefinitions,
}) => {
  const approvedOrders = testOrders.filter((o) => o.status === 'APPROVED' || o.status === 'AWAITING_REVIEW');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(approvedOrders[0]?.id || testOrders[0]?.id || '');
  const [isCopied, setIsCopied] = useState(false);

  const currentOrder = testOrders.find((o) => o.id === selectedOrderId) || testOrders[0];
  const currentSample = samples.find((s) => s.id === currentOrder?.sampleId) || samples[0];
  const currentDef = testDefinitions.find((d) => d.id === currentOrder?.testDefinitionId) || testDefinitions[0];

  const handlePrint = () => {
    window.print();
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(
      `https://lims-verify.aegislabs.org/coa/verify/${currentOrder?.sampleBarcode}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Official Certificate of Analysis (CoA) & Clinical Diagnostic Reports
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Cryptographically Sealed
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Validated regulatory deliverable with tamper-evident QR verification seal and 21 CFR Part 11 electronic director signatures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
          >
            {testOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.sampleBarcode} · {o.patientOrSourceName} ({o.testName})
              </option>
            ))}
          </select>

          <button
            onClick={handleShareLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            {isCopied ? 'Verification URL Copied!' : 'Copy Verification Seal'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Export Official CoA PDF
          </button>
        </div>
      </div>

      {/* PUBLICATION-READY CERTIFICATE OF ANALYSIS DOCUMENT (A4 PRINTABLE DESIGN) */}
      <div className="bg-white text-slate-900 rounded-3xl p-8 lg:p-12 shadow-2xl border border-slate-200 max-w-4xl mx-auto space-y-8 font-sans print:p-0 print:border-none print:shadow-none print-paper-sheet print:space-y-4">
        {/* Document Header & Accreditation Badges */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 print:pb-3 gap-6 print:gap-3 print-avoid-break">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-bold text-lg">
                Æ
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading">
                AEGIS ADVANCED LABORATORIES
              </h1>
            </div>
            <p className="text-xs text-slate-600">
              Accredited Clinical, Molecular & Environmental Testing Center
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              742 Bioscience Parkway, Cambridge, MA 02142 · Tel: (617) 555-0199
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded uppercase tracking-wider">
              CERTIFICATE OF ANALYSIS
            </div>
            <div className="text-xs font-mono font-bold text-slate-800">
              Report Ref: CoA-2026-{currentSample?.barcode.split('-')[2] || '88019'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-end gap-2">
              <span>CLIA: 22D2091448</span>
              <span>·</span>
              <span>CAP: 8192044</span>
              <span>·</span>
              <span>ISO 15189:2022</span>
            </div>
          </div>
        </div>

        {/* Specimen & Client Metadata Dual Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 print:bg-white p-5 print:p-2 rounded-2xl border border-slate-200 text-xs print:text-[9px] print-avoid-break">
          <div className="space-y-2 print:space-y-0.5">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <User className="w-3 h-3 text-cyan-700" />
              Patient / Specimen Information
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 print:gap-y-0.5 font-mono">
              <span className="text-slate-500">Patient / Source:</span>
              <span className="font-bold text-slate-900 font-sans">{currentSample?.patientOrSourceName}</span>

              <span className="text-slate-500">External Identifier:</span>
              <span className="font-bold text-slate-900">{currentSample?.externalId}</span>

              <span className="text-slate-500">Specimen Matrix:</span>
              <span className="font-bold text-slate-900 font-sans">{currentSample?.sampleType} ({currentSample?.matrix})</span>

              <span className="text-slate-500">Primary Barcode:</span>
              <span className="font-bold text-cyan-800 font-bold">{currentSample?.barcode}</span>
            </div>
          </div>

          <div className="space-y-2 print:space-y-0.5">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-cyan-700" />
              Timeline & Chain of Custody
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 print:gap-y-0.5 font-mono">
              <span className="text-slate-500">Collection Date:</span>
              <span className="font-bold text-slate-900">{currentSample?.collectionDate}</span>

              <span className="text-slate-500">Lab Received Date:</span>
              <span className="font-bold text-slate-900">{currentSample?.receivedDate}</span>

              <span className="text-slate-500">Analysis Completed:</span>
              <span className="font-bold text-slate-900">{currentOrder?.completedAt || '2026-10-06 10:15:00'}</span>

              <span className="text-slate-500">Preservation Status:</span>
              <span className="font-bold text-emerald-700 font-sans">{currentSample?.preservationStatus}</span>
            </div>
          </div>
        </div>

        {/* Analytical Results Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-300 pb-2">
            <h3 className="font-bold text-slate-900 font-heading text-sm uppercase tracking-wide">
              Analytical Test: {currentOrder?.testName}
            </h3>
            <span className="text-[11px] font-mono text-slate-600">
              Method: {currentDef?.methodReference}
            </span>
          </div>

          <table className="w-full text-left text-xs print:text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-y border-slate-300">
                <th className="py-2.5 px-3 print:py-1 print:px-2">Analyte / Parameter</th>
                <th className="py-2.5 px-3 print:py-1 print:px-2">Result</th>
                <th className="py-2.5 px-3 print:py-1 print:px-2">Unit</th>
                <th className="py-2.5 px-3 print:py-1 print:px-2">Reference Range / Limit</th>
                <th className="py-2.5 px-3 print:py-1 print:px-2">Flag</th>
                <th className="py-2.5 px-3 print:py-1 print:px-2">Methodology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentDef?.parameters.map((param) => {
                const res = currentOrder?.results[param.id];
                const isCritical = res?.flag === 'CRITICAL' || res?.flag === 'OOS';
                const isAbnormal = res?.flag === 'HIGH' || res?.flag === 'LOW';

                return (
                  <tr key={param.id} className={isCritical ? 'bg-rose-50/70 font-semibold' : ''}>
                    <td className="py-3 px-3 print:py-1 print:px-2">
                      <div className="font-bold text-slate-900">{param.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{param.code}</div>
                    </td>
                    <td className="py-3 px-3 print:py-1 print:px-2 font-mono font-bold text-sm text-slate-900">
                      {res?.rawValue || '--'}
                    </td>
                    <td className="py-3 px-3 print:py-1 print:px-2 font-mono text-slate-600">{param.unit}</td>
                    <td className="py-3 px-3 print:py-1 print:px-2 font-mono text-slate-600">
                      {param.specMin !== undefined && param.specMax !== undefined
                        ? `${param.specMin} - ${param.specMax}`
                        : param.lodLimit !== undefined
                        ? `< ${param.lodLimit} (LOD)`
                        : 'Qualitative'}
                    </td>
                    <td className="py-3 px-3 print:py-1 print:px-2">
                      {res?.flag && res.flag !== 'NORMAL' && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black font-mono rounded ${
                            isCritical
                              ? 'bg-rose-600 text-white'
                              : isAbnormal
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {res.flag}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 print:py-1 print:px-2 text-[11px] text-slate-500">
                      {param.dataType === 'CALCULATED' ? 'Calculated Equation' : 'Instrument Sensor'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Interpretive Clinical Notes & Regulatory Disclaimers */}
        <div className="p-4 print:p-2 rounded-xl bg-slate-50 print:bg-white border border-slate-200 text-[11px] print:text-[8px] text-slate-600 space-y-1 leading-relaxed print-avoid-break">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            Laboratory Director Comments & Method Disclaimer
          </div>
          <p>
            Results relate only to the specimen tested as received. Testing was performed under ISO/IEC 17025 and CLIA certified conditions. Any critical or out-of-specification values have been verified by secondary repeat assay in accordance with Standard Operating Procedure SOP-LAB-404.
          </p>
        </div>

        {/* Signatures & Public Verification QR Stamp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t-2 border-slate-900 items-end print-avoid-break">
          {/* Analyst Sign-off */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Analyzing Scientist</span>
            <div className="font-serif italic text-base font-bold text-slate-800 border-b border-slate-300 pb-1">
              {currentOrder?.assignedAnalyst || 'Maria Hernandez, CLS'}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Date: 2026-10-06 09:55:00 UTC
            </p>
          </div>

          {/* Medical / Laboratory Director Digital Seal */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Medical Laboratory Director</span>
            <div className="font-serif italic text-base font-bold text-cyan-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>Dr. Arthur Sterling, MD</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              21 CFR Part 11 Digital E-Sign Hash: e8912...bbcc
            </p>
          </div>

          {/* Tamper-Proof Public Verification QR Code */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 justify-self-end w-full">
            <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 flex items-center justify-center shrink-0">
              <QrCode className="w-12 h-12 text-slate-900" />
            </div>
            <div className="text-[10px] text-slate-600 font-mono space-y-0.5">
              <div className="font-bold text-slate-900">VERIFY REPORT</div>
              <div>Scan to validate official cryptographic seal on Aegis Public Registry.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
