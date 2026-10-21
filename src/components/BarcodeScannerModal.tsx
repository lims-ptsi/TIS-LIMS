import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Search, 
  Barcode, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Sparkles,
  TestTube
} from 'lucide-react';
import { Sample } from '../types/lims';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
  onSelectSample: (sample: Sample) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  samples,
  onSelectSample,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [matchedSample, setMatchedSample] = useState<Sample | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setMatchedSample(null);
    }
  }, [isOpen]);

  const handleSearch = (code: string) => {
    setBarcodeInput(code);
    const found = samples.find(
      (s) =>
        s.barcode.toLowerCase() === code.trim().toLowerCase() ||
        s.externalId.toLowerCase() === code.trim().toLowerCase()
    );
    setMatchedSample(found || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/60 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Scan className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              Quick Barcode Wedge Scanner
            </h3>
            <p className="text-xs text-slate-400">
              USB HID / Bluetooth Scanner auto-input or manual entry
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <div className="relative">
            <Barcode className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
            <input
              type="text"
              autoFocus
              placeholder="Scan or type barcode (e.g. SMP-2026-88019)..."
              value={barcodeInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none shadow-inner"
            />
          </div>

          {/* Quick preset chips for rapid testing */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Recent:</span>
            {samples.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSearch(s.barcode)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] hover:bg-slate-700 hover:text-white border border-slate-700"
              >
                {s.barcode}
              </button>
            ))}
          </div>
        </div>

        {/* Matched Specimen Result Card */}
        {matchedSample ? (
          <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/60 space-y-3 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold font-mono text-cyan-300">
                  {matchedSample.barcode}
                </span>
                <div className="text-sm font-bold text-white mt-0.5">
                  {matchedSample.patientOrSourceName}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  matchedSample.priority === 'STAT'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {matchedSample.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Type / Matrix</span>
                <span>{matchedSample.sampleType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Storage Cell</span>
                <span>{matchedSample.storageLocation.unit} : {matchedSample.storageLocation.well}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectSample(matchedSample);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
            >
              <span>Open Specimen Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : barcodeInput ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 font-mono">
            No specimen found matching barcode "{barcodeInput}".
          </div>
        ) : null}
      </div>
    </div>
  );
};
