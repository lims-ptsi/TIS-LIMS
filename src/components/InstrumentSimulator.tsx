import React, { useState } from 'react';
import { 
  Cpu, 
  Radio, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Activity, 
  Settings, 
  RotateCw,
  Zap,
  Send
} from 'lucide-react';
import { InstrumentDevice } from '../types/lims';

interface InstrumentSimulatorProps {
  instruments: InstrumentDevice[];
  onTransmitDataPacket: (instrumentId: string, rawPayload: string) => void;
}

export const InstrumentSimulator: React.FC<InstrumentSimulatorProps> = ({
  instruments,
  onTransmitDataPacket,
}) => {
  const [selectedInst, setSelectedInst] = useState<InstrumentDevice>(instruments[0]);
  const [streamLog, setStreamLog] = useState<string[]>([
    '[2026-10-06 09:15:02] [TCP-SOCK] Connected to Sysmex XN-1000 at 192.168.10.104:5100',
    '[2026-10-06 09:15:03] [ASTM-RX] <ENQ>',
    '[2026-10-06 09:15:03] [ASTM-TX] <ACK>',
    '[2026-10-06 09:15:04] [ASTM-RX] H|\\^&|||Sysmex^XN-1000^00-12|||||||P|1|20261006091504',
    '[2026-10-06 09:15:05] [ASTM-RX] P|1||||Alexander^Wright||19840512|M',
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
      `[${timestamp}] [LIMS-BROKER] Ingested and mapped to sample queue.`,
    ];
    setStreamLog(newLogs);
    onTransmitDataPacket(selectedInst.id, customPayload);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Instrument Interfacing & Edge IoT Middleware
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Bidirectional ASTM / HL7 / Serial Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time direct socket telemetry, automated hot-folder file parsing, and hardware device health monitoring.
          </p>
        </div>

        <button
          onClick={handleSimulateTransmission}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          Transmit Simulated Raw Frame
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Instruments List */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Connected Laboratory Equipment ({instruments.length})
          </h3>

          <div className="space-y-3">
            {instruments.map((inst) => {
              const isSelected = inst.id === selectedInst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white">{inst.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border bg-emerald-950 text-emerald-300 border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                      {inst.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 font-mono space-y-0.5">
                    <div>Model: <strong className="text-slate-300">{inst.model}</strong> ({inst.serialNumber})</div>
                    <div>Protocol: <span className="text-cyan-300">{inst.protocol}</span></div>
                    <div>Endpoint: <span className="text-slate-400">{inst.connectionEndpoint}</span></div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-2 font-mono">
                    <span>Throughput: {inst.throughputSamplesPerHour} smp/h</span>
                    <span className="text-emerald-400">Cal Due: {inst.nextCalibrationDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live ASTM/HL7 Terminal Stream & Frame Injector */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Hex / ASCII Terminal Console */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Live Raw Data Stream ({selectedInst.protocol})
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-ping" />
                Listening on Socket
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 max-h-72 overflow-y-auto space-y-1 select-text">
              {streamLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.includes('PAYLOAD') || log.includes('ASTM-RX') ? (
                    <span className="text-cyan-400">{log}</span>
                  ) : log.includes('LIMS-BROKER') ? (
                    <span className="text-emerald-400 font-bold">{log}</span>
                  ) : log.includes('TRANSMIT') ? (
                    <span className="text-amber-300">{log}</span>
                  ) : (
                    <span className="text-slate-400">{log}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Frame Injector */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Inject Custom Protocol Frame Payload (ASTM / HL7 / CSV)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleSimulateTransmission}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Push
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
