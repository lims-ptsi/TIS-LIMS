import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Check, 
  X, 
  ChevronDown,
  Calculator,
  RotateCcw
} from 'lucide-react';

interface BirthdateAgePickerProps {
  birthday: string; // Stored in ISO 'YYYY-MM-DD'
  age: number | '';
  onBirthdayChange: (dob: string) => void;
  onAgeChange: (age: number | '') => void;
  required?: boolean;
  disabled?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CURRENT_YEAR = new Date().getFullYear();

// Calculate exact age from YYYY-MM-DD
export function calculateAgeFromDob(dobStr: string): number | '' {
  if (!dobStr) return '';
  const parts = dobStr.split('-');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';

  const today = new Date();
  let calculated = today.getFullYear() - y;
  const monthDiff = today.getMonth() - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    calculated--;
  }
  return Math.max(0, calculated);
}

// Convert YYYY-MM-DD to MM/DD/YYYY for user-friendly display
export function formatDobToDisplay(dobStr: string): string {
  if (!dobStr) return '';
  const parts = dobStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dobStr;
}

// Convert MM/DD/YYYY or MMDDYYYY to YYYY-MM-DD
export function parseDisplayToDob(input: string): string | null {
  const clean = input.trim();
  
  // Format 1: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= CURRENT_YEAR) {
      return clean;
    }
  }

  // Format 2: MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [mStr, dStr, yStr] = clean.split('/');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const y = parseInt(yStr, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= CURRENT_YEAR) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Format 3: Raw 8 digits MMDDYYYY
  if (/^\d{8}$/.test(clean)) {
    const m = parseInt(clean.substring(0, 2), 10);
    const d = parseInt(clean.substring(2, 4), 10);
    const y = parseInt(clean.substring(4, 8), 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= CURRENT_YEAR) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export const BirthdateAgePicker: React.FC<BirthdateAgePickerProps> = ({
  birthday,
  age,
  onBirthdayChange,
  onAgeChange,
  required = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typedText, setTypedText] = useState(birthday ? formatDobToDisplay(birthday) : '');
  const [isEstimatedFromAge, setIsEstimatedFromAge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar navigation state
  const initialYear = birthday ? parseInt(birthday.split('-')[0], 10) || 1995 : 1995;
  const initialMonth = birthday ? (parseInt(birthday.split('-')[1], 10) - 1) || 0 : 0;
  const initialDay = birthday ? parseInt(birthday.split('-')[2], 10) || 1 : 1;

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Sync typed text when birthday prop changes externally
  useEffect(() => {
    if (birthday) {
      setTypedText(formatDobToDisplay(birthday));
      const parts = birthday.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10) || viewYear);
        setViewMonth((parseInt(parts[1], 10) - 1) || 0);
        setSelectedDay(parseInt(parts[2], 10) || 1);
      }
    } else {
      setTypedText('');
    }
  }, [birthday]);

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Days in selected view month
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  // First day of month offset (0 = Sunday, 1 = Monday, ...)
  const firstDayOffset = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Year options list: Descending from CURRENT_YEAR down to 1910
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = CURRENT_YEAR; y >= 1910; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // Decade presets
  const decades = [
    { label: '2020s', startYear: 2020 },
    { label: '2010s', startYear: 2010 },
    { label: '2000s', startYear: 2000 },
    { label: '1990s', startYear: 1990 },
    { label: '1980s', startYear: 1980 },
    { label: '1970s', startYear: 1970 },
    { label: '1960s', startYear: 1960 },
    { label: '1950s', startYear: 1950 },
  ];

  // Quick Age Preset Helper (e.g. 25 years old)
  const handleSelectQuickAge = (targetAge: number) => {
    const birthYear = CURRENT_YEAR - targetAge;
    const dob = `${birthYear}-01-01`;
    onBirthdayChange(dob);
    onAgeChange(targetAge);
    setIsEstimatedFromAge(false);
    setViewYear(birthYear);
    setViewMonth(0);
    setSelectedDay(1);
    setIsOpen(false);
  };

  // Direct date cell click
  const handleSelectDate = (d: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const dob = `${viewYear}-${formattedMonth}-${formattedDay}`;
    const calculatedAge = calculateAgeFromDob(dob);

    setSelectedDay(d);
    onBirthdayChange(dob);
    onAgeChange(calculatedAge);
    setIsEstimatedFromAge(false);
    setIsOpen(false);
  };

  // Fast typing input change
  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Auto-insert slashes when user types numbers continuously: e.g. 05121990 -> 05/12/1990
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length <= 8 && !raw.includes('-')) {
      if (digitsOnly.length > 4) {
        raw = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
      } else if (digitsOnly.length > 2) {
        raw = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`;
      } else {
        raw = digitsOnly;
      }
    }

    setTypedText(raw);

    const parsed = parseDisplayToDob(raw);
    if (parsed) {
      const calculatedAge = calculateAgeFromDob(parsed);
      onBirthdayChange(parsed);
      onAgeChange(calculatedAge);
      setIsEstimatedFromAge(false);

      const parts = parsed.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
      setSelectedDay(parseInt(parts[2], 10));
    }
  };

  // Direct Age Input change with bidirectional auto-estimation
  const handleDirectAgeChange = (newAgeVal: string) => {
    if (newAgeVal === '') {
      onAgeChange('');
      return;
    }

    const parsedAge = parseInt(newAgeVal, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      onAgeChange('');
      return;
    }

    onAgeChange(parsedAge);

    // If no birthday or birthday was estimated, calculate approximate birth year
    const estimatedYear = CURRENT_YEAR - parsedAge;
    const currentMonthPart = birthday ? birthday.split('-')[1] || '01' : '01';
    const currentDayPart = birthday ? birthday.split('-')[2] || '01' : '01';
    const estimatedDob = `${estimatedYear}-${currentMonthPart}-${currentDayPart}`;

    onBirthdayChange(estimatedDob);
    setIsEstimatedFromAge(true);
    setViewYear(estimatedYear);
  };

  // Format readable badge text: e.g. "Aug 20, 1995 (Sunday)"
  const formattedDobSummary = useMemo(() => {
    if (!birthday) return null;
    const parts = birthday.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const dateObj = new Date(y, m, d);
    if (isNaN(dateObj.getTime())) return null;

    const monthName = SHORT_MONTHS[m];
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    return `${monthName} ${d}, ${y} (${dayName})`;
  }, [birthday]);

  return (
    <React.Fragment>
      {/* 1. BIRTHDAY INPUT COLUMN */}
      <div ref={containerRef} className="sm:col-span-2 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold block text-[11px] flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-[#0176d3]" />
            <span>BIRTHDAY {required && '*'}</span>
          </label>
          <span className="text-[9.5px] text-slate-400 font-mono">MM/DD/YYYY</span>
        </div>

        <div className="relative">
          <input
            type="text"
            required={required}
            disabled={disabled}
            placeholder="MM/DD/YYYY"
            value={typedText}
            onChange={handleTypedChange}
            onFocus={() => setIsOpen(true)}
            className={`w-full pl-3 pr-8 py-1.5 rounded border text-xs font-mono transition-all ${
              isOpen 
                ? 'border-[#0176d3] ring-2 ring-[#0176d3]/20 bg-white' 
                : birthday 
                ? 'border-slate-300 bg-white text-slate-900 font-bold' 
                : 'border-[#d8dde6] bg-white text-slate-700'
            }`}
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0176d3] rounded transition-colors cursor-pointer"
            title="Open Interactive Birthdate Selector"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clear / Status Helper Badge */}
        {birthday && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9.5px] text-emerald-700 font-mono font-medium truncate">
              ✓ {formattedDobSummary}
            </span>
            {isEstimatedFromAge && (
              <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded font-mono">
                Est.
              </span>
            )}
          </div>
        )}

        {/* 3. INTERACTIVE SMART BIRTHDAY PICKER POPOVER (Anchored Directly Below Birthday Field) */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 z-50 w-80 sm:w-84 max-w-[95vw] bg-white border border-slate-300 rounded-xl shadow-2xl p-3.5 space-y-3 font-sans text-slate-900 animate-fadeIn">
            
            {/* Header Controls: Year & Month Selectors */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-1.5">
              {/* Month Select */}
              <div className="relative flex-1">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="w-full pl-2 pr-6 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-[#0176d3]"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Select (Direct 1910 - 2026 dropdown) */}
              <div className="relative flex-1">
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="w-full pl-2 pr-6 py-1 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 rounded text-xs font-mono font-bold text-blue-900 cursor-pointer focus:outline-none focus:border-[#0176d3]"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y} ({CURRENT_YEAR - y} yo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Close popover */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Decade Jump Badges */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Quick Decade Jump:
              </span>
              <div className="flex flex-wrap gap-1">
                {decades.map((dec) => {
                  const isActive = viewYear >= dec.startYear && viewYear < dec.startYear + 10;
                  return (
                    <button
                      key={dec.label}
                      type="button"
                      onClick={() => setViewYear(dec.startYear + 5)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0176d3] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {dec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Day Grid */}
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
                {/* Blank leading days */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`blank-${i}`} className="h-7" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected = 
                    birthday && 
                    parseInt(birthday.split('-')[0], 10) === viewYear &&
                    parseInt(birthday.split('-')[1], 10) - 1 === viewMonth &&
                    parseInt(birthday.split('-')[2], 10) === d;

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDate(d)}
                      className={`h-7 w-full rounded flex items-center justify-center font-medium transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-[#0176d3] text-white font-bold shadow-xs'
                          : 'hover:bg-blue-50 hover:text-[#0176d3] text-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Age Demographic Presets */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-500">Quick Age Presets:</span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleSelectQuickAge(25)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  title="Set to 25 years old"
                >
                  25yo
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickAge(40)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  title="Set to 40 years old"
                >
                  40yo
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickAge(60)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  title="Set to 60 years old (Senior)"
                >
                  60yo
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 2. AGE INPUT COLUMN */}
      <div className="sm:col-span-2 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold text-[11px] flex items-center gap-1">
            <Calculator className="w-3 h-3 text-[#0176d3]" />
            <span>AGE {required && '*'}</span>
          </label>
          <span className="text-[9.5px] text-blue-700 font-mono font-semibold">YEARS</span>
        </div>

        <div className="relative">
          <input
            type="number"
            min="0"
            max="130"
            required={required}
            disabled={disabled}
            placeholder="0"
            value={age}
            onChange={(e) => handleDirectAgeChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono text-xs font-bold bg-slate-50 focus:bg-white focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] transition-all"
            title="Type exact age in years to auto-estimate birth year"
          />
          {age !== '' && typeof age === 'number' && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono pointer-events-none">
              YRS
            </span>
          )}
        </div>

        {age !== '' && typeof age === 'number' && (
          <div className="pt-1 text-[9.5px] text-slate-500 font-mono">
            {age === 0 ? 'Infant (< 1 yr)' : age < 18 ? 'Pediatric' : age >= 60 ? 'Senior Citizen' : 'Adult'}
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
