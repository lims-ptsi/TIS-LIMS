import React, { useState } from 'react';
import { 
  Cpu, 
  Radio, 
  Terminal, 
  Zap, 
  Send, 
  CheckCircle2, 
  Activity, 
  Layers 
} from 'lucide-react';
import { InstrumentDevice } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface InstrumentsViewProps {
  instruments: InstrumentDevice[];
  onTransmitDataPacket?: (instId: string, rawPayload: string) => void;
}

export const InstrumentsView: React.FC<InstrumentsViewProps> = ({
  instruments,
  onTransmitDataPacket,
}) => {
  const [selectedInst, setSelectedInst] = useState<InstrumentDevice>(instruments[0]);
  const [streamLog, setStreamLog] = useState<string[]>([
    '[2026-10-06 09:15:02] [TCP-SOCK] Connected to Sysmex XN-1000 at 192.168.10.104:5100',
    '[2026-10-06 09:15:03] [ASTM-RX] <ENQ>',
    '[2026-10-06 09:15:03] [ASTM-TX] <ACK>',
    '[2026-10-06 09:15:04] [ASTM-RX] H|\\^&|||Sysmex^XN-1000^00-12|||||||P|1|20261006091504',
    '[2026-10-06 09:15:05] [ASTM-RX] P|1||||Immunir^S000386||19840512|M',
    '[2026-10-06 09:15:06] [ASTM-RX] O|1|SMP-2026-88019||^^^CBC_DIFF|R||20261006083000||||A',
    '[2026-10-06 09:15:07] [ASTM-RX] R|1|^^^WBC|14.20|10^3/uL|4.0-11.0|H||F|||20261006091500',
    '[2026-10-06 09:15:08] [ASTM-RX] R|2|^^^RBC|3.10|10^6/uL|4.2-5.9|L||F|||20261006091500',
    '[2026-10-06 09:15:09] [ASTM-RX] R|3|^^^HGB|8.40|g/dL|13.5-17.5|L||F|||20261006091500',
    '[2026-10-06 09:15:10] [ASTM-RX] L|1|N',
    '[2026-10-06 09:15:10] [LIMS-BROKER] Payload sanitized and parsed into TestOrder ord-001.',
  ]);

  const [customPayload, setCustomPayload] = useState(
    'R|1|^^^WBC|14.50|10^3/uL|4.0-11.0|H||F|||20261006'
  );

  const handleSimulateTransmission = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLogs = [
      ...streamLog,
      `[${timestamp}] [TRANSMIT] Emitted data packet from ${selectedInst.name}`,
      `[${timestamp}] [PAYLOAD] ${customPayload}`,
      `[${timestamp}] [LIMS-BROKER] Ingested and mapped to sample results table.`,
    ];
    setStreamLog(newLogs);
    onTransmitDataPacket?.(selectedInst.id, customPayload);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Chevron Pipeline */}
      <LifecycleChevronBar
        currentStage="Instrument Telemetry & Ingestion Queue"
        entityType="Batch"
        onCompleteStage={() => alert('Device telemetry sync complete.')}
      />

      {/* 2. Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Hardware IoT & Middleware</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Instrument Interfacing & Data Ingestion</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateTransmission}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-semibold rounded shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Transmit Simulated ASTM Frame
          </button>
        </div>
      </div>

      {/* 3. Instruments & Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Device List */}
        <div className="lg:col-span-5 lims-card p-5 space-y-3">
          <h3 className="font-bold text-xs text-slate-900">Connected Analytical Instruments ({instruments.length})</h3>

          <div className="space-y-2.5">
            {instruments.map((inst) => {
              const isSelected = inst.id === selectedInst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`p-3 rounded border cursor-pointer transition-colors text-xs space-y-1 ${
                    isSelected
                      ? 'border-[#0176d3] bg-blue-50/50 shadow-xs'
                      : 'border-[#d8dde6] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{inst.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                      {inst.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    <div>Protocol: <strong className="text-slate-700">{inst.protocol}</strong></div>
                    <div>Endpoint: {inst.connectionEndpoint}</div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    <span>Throughput: {inst.throughputSamplesPerHour} smp/h</span>
                    <span className="text-emerald-700 font-semibold">Cal Due: {inst.nextCalibrationDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Terminal Stream */}
        <div className="lg:col-span-7 lims-card p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#0176d3]" />
              <span>Live Socket Raw Stream ({selectedInst.protocol})</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              Socket Listening
            </span>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-1 border border-slate-800 select-text">
            {streamLog.map((log, idx) => (
              <div key={idx}>
                {log.includes('ASTM-RX') ? (
                  <span className="text-cyan-400">{log}</span>
                ) : log.includes('LIMS-BROKER') ? (
                  <span className="text-emerald-400 font-bold">{log}</span>
                ) : log.includes('TRANSMIT') ? (
                  <span className="text-amber-300 font-bold">{log}</span>
                ) : (
                  <span className="text-slate-400">{log}</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-1 text-xs">
            <label className="text-slate-600 font-semibold block">Push Custom Frame to Broker</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border border-[#d8dde6] font-mono text-slate-800 text-xs"
              />
              <button
                onClick={handleSimulateTransmission}
                className="px-3 py-1.5 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded text-xs font-semibold"
              >
                Push
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
