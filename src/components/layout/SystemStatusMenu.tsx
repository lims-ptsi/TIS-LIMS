import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { InstrumentDevice, Sample } from '../../types/lims';

interface SystemStatusMenuProps {
  instruments: InstrumentDevice[];
  samples: Sample[];
  onOpenInstruments?: () => void;
}

const STATUS_LABEL: Record<InstrumentDevice['status'], string> = {
  ONLINE: 'Online',
  RUNNING: 'Running',
  CALIBRATING: 'Calibrating',
  MAINTENANCE_DUE: 'Maintenance due',
  OFFLINE: 'Offline',
};

function todayKey(date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDay(value: string): string {
  const [year, month, date] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !date) return value;
  return new Date(year, month - 1, date).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function readings(value: string): number[] {
  return (value.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

function temperatureInRange(value: string): boolean {
  const numbers = readings(value);
  if (!numbers.length) return false;
  return numbers.every((n) => (n >= 2 && n <= 8) || (n <= -15 && n >= -30) || (n <= -70 && n >= -90));
}

export const SystemStatusMenu: React.FC<SystemStatusMenuProps> = ({
  instruments,
  samples,
  onOpenInstruments,
}) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const today = todayKey();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const stored = samples.filter((sample) => sample.storageLocation?.temperature);
  const temps = [...new Set(stored.map((sample) => sample.storageLocation.temperature))];
  const coldProblems = temps.filter((temp) => !temperatureInRange(temp));
  const coldOk = temps.length === 0 || coldProblems.length === 0;

  const instrumentRows = instruments.map((instrument) => {
    const overdue = (instrument.nextCalibrationDate || '').slice(0, 10) < today;
    const down = instrument.status === 'OFFLINE' || instrument.status === 'MAINTENANCE_DUE';
    return { instrument, overdue, problem: overdue || down };
  });
  const problemCount = coldProblems.length + instrumentRows.filter((row) => row.problem).length;
  const clear = problemCount === 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative p-1.5 rounded cursor-pointer ${
          clear ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
        }`}
        title={clear ? 'System status: Normal. Cold vault +4°C.' : `System status: ${problemCount} item${problemCount === 1 ? '' : 's'} need attention`}
        aria-expanded={open}
        aria-label="System status"
      >
        <AlertTriangle className="w-4 h-4" />
        {!clear && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold leading-none flex items-center justify-center">
            {problemCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#d8dde6] rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">System status</div>
            <div className={`text-[11px] font-semibold ${clear ? 'text-emerald-700' : 'text-amber-700'}`}>
              {clear ? 'Normal' : `${problemCount} item${problemCount === 1 ? '' : 's'} need attention`}
            </div>
          </div>

          <div className="px-3 py-2.5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Cold vault</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {temps.length === 0
                    ? 'No specimens stored. Setpoint +4°C is inside +2°C to +8°C.'
                    : coldOk
                      ? `${stored.length} specimen${stored.length === 1 ? '' : 's'} inside a validated range.`
                      : `${coldProblems.join(', ')} is outside the fridge, freezer, and ultra-low ranges.`}
                </div>
              </div>
              <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                coldOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {coldOk ? temps[0] || '+4°C' : 'Check'}
              </span>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {instrumentRows.map(({ instrument, overdue, problem }) => {
              const detail = overdue
                ? `Calibration was due ${formatDay(instrument.nextCalibrationDate)}`
                : `${STATUS_LABEL[instrument.status]} · calibration ${formatDay(instrument.nextCalibrationDate)}`;
              const body = (
                <>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900 truncate">{instrument.name}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{detail}</span>
                  </span>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    problem ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {problem ? (overdue ? 'Overdue' : STATUS_LABEL[instrument.status]) : 'Ok'}
                  </span>
                </>
              );
              return onOpenInstruments ? (
                <button
                  key={instrument.id}
                  type="button"
                  onClick={() => {
                    onOpenInstruments();
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                >
                  {body}
                </button>
              ) : (
                <div key={instrument.id} className="px-3 py-2.5 flex items-start justify-between gap-3">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
