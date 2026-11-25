import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Calculator } from 'lucide-react';

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
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CURRENT_YEAR = new Date().getFullYear();
const OLDEST_YEAR = 1910;

const YEAR_OPTIONS: number[] = [];
for (let y = CURRENT_YEAR; y >= OLDEST_YEAR; y--) YEAR_OPTIONS.push(y);

type DobParts = { year: number | ''; month: number | ''; day: number | '' };

function splitDob(birthday: string): DobParts {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return { year: '', month: '', day: '' };
  const [y, m, d] = birthday.split('-').map((part) => parseInt(part, 10));
  if (!y || !m || !d) return { year: '', month: '', day: '' };
  return { year: y, month: m, day: d };
}

function daysInMonth(year: number | '', month: number | ''): number {
  if (month === '') return 31;
  const y = year === '' ? 2000 : year;
  return new Date(y, month, 0).getDate();
}

function toIso(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

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

export function formatDobToDisplay(dobStr: string): string {
  if (!dobStr) return '';
  const parts = dobStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dobStr;
}

export function parseDisplayToDob(input: string): string | null {
  const clean = input.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= OLDEST_YEAR && y <= CURRENT_YEAR) {
      return clean;
    }
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [mStr, dStr, yStr] = clean.split('/');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const y = parseInt(yStr, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= OLDEST_YEAR && y <= CURRENT_YEAR) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  if (/^\d{8}$/.test(clean)) {
    const m = parseInt(clean.substring(0, 2), 10);
    const d = parseInt(clean.substring(2, 4), 10);
    const y = parseInt(clean.substring(4, 8), 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= OLDEST_YEAR && y <= CURRENT_YEAR) {
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
  const [parts, setParts] = useState<DobParts>(() => splitDob(birthday));
  const [isEstimatedFromAge, setIsEstimatedFromAge] = useState(false);

  useEffect(() => {
    setParts(splitDob(birthday));
  }, [birthday]);

  const maxDay = daysInMonth(parts.year, parts.month);

  const applyParts = (next: DobParts) => {
    let day = next.day;
    if (day !== '') {
      const limit = daysInMonth(next.year, next.month);
      if (day > limit) day = limit;
    }
    const normalized: DobParts = { ...next, day };
    setParts(normalized);
    if (normalized.year === '' || normalized.month === '' || normalized.day === '') return;
    const dob = toIso({ year: normalized.year, month: normalized.month, day: normalized.day });
    if (dob === birthday) return;
    onBirthdayChange(dob);
    onAgeChange(calculateAgeFromDob(dob));
    setIsEstimatedFromAge(false);
  };

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

    const estimatedYear = CURRENT_YEAR - parsedAge;
    const month = parts.month === '' ? 1 : parts.month;
    const day = parts.day === '' ? 1 : Math.min(parts.day, daysInMonth(estimatedYear, month));
    onBirthdayChange(toIso({ year: estimatedYear, month, day }));
    setIsEstimatedFromAge(true);
  };

  const summary = (() => {
    if (parts.year === '' || parts.month === '' || parts.day === '') return null;
    const dateObj = new Date(parts.year, parts.month - 1, parts.day);
    if (isNaN(dateObj.getTime())) return null;
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    return `${SHORT_MONTHS[parts.month - 1]} ${parts.day}, ${parts.year} (${dayName})`;
  })();

  const selectClass = (filled: boolean) =>
    `w-full min-w-0 px-1.5 py-1.5 rounded border text-xs cursor-pointer focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] disabled:opacity-60 ${
      filled
        ? 'border-slate-300 bg-white text-slate-900 font-bold'
        : 'border-[#d8dde6] bg-white text-slate-500 font-medium'
    }`;

  return (
    <React.Fragment>
      <div className="col-span-2 sm:col-span-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold block text-[11px] flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-[#0176d3]" />
            <span>BIRTHDAY {required && '*'}</span>
          </label>
          <span className="text-[9.5px] text-slate-400">Month / Day / Year</span>
        </div>

        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,0.7fr)_minmax(0,0.95fr)] gap-1">
          <select
            aria-label="Birth month"
            required={required}
            disabled={disabled}
            value={parts.month === '' ? '' : String(parts.month)}
            onChange={(e) =>
              applyParts({
                ...parts,
                month: e.target.value === '' ? '' : parseInt(e.target.value, 10),
              })
            }
            className={selectClass(parts.month !== '')}
          >
            <option value="">Month</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Birth day"
            required={required}
            disabled={disabled}
            value={parts.day === '' ? '' : String(parts.day)}
            onChange={(e) =>
              applyParts({
                ...parts,
                day: e.target.value === '' ? '' : parseInt(e.target.value, 10),
              })
            }
            className={selectClass(parts.day !== '')}
          >
            <option value="">Day</option>
            {Array.from({ length: maxDay }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>

          <select
            aria-label="Birth year"
            required={required}
            disabled={disabled}
            value={parts.year === '' ? '' : String(parts.year)}
            onChange={(e) =>
              applyParts({
                ...parts,
                year: e.target.value === '' ? '' : parseInt(e.target.value, 10),
              })
            }
            className={selectClass(parts.year !== '')}
            title="Open the list and type the year, for example 1975"
          >
            <option value="">Year</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {summary ? (
          <div className="flex items-center justify-between pt-1 gap-2">
            <span className="text-[9.5px] text-emerald-700 font-medium truncate">✓ {summary}</span>
            {isEstimatedFromAge ? (
              <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded shrink-0">
                Est.
              </span>
            ) : null}
          </div>
        ) : (
          <p className="pt-1 text-[9.5px] text-slate-400">Pick the month, the day, and the year.</p>
        )}
      </div>

      <div className="sm:col-span-2 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold text-[11px] flex items-center gap-1">
            <Calculator className="w-3 h-3 text-[#0176d3]" />
            <span>AGE {required && '*'}</span>
          </label>
          <span className="text-[9.5px] text-blue-700 font-semibold">YEARS</span>
        </div>

        <div className="relative">
          <input
            type="number"
            min="0"
            max="130"
            required={required}
            disabled={disabled}
            value={age}
            onChange={(e) => handleDirectAgeChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 text-xs font-bold bg-slate-50 focus:bg-white focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] transition-all"
            title="Type the age in years when the birthday is not known"
          />
          {age !== '' && typeof age === 'number' ? (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
              YRS
            </span>
          ) : null}
        </div>

        {age !== '' && typeof age === 'number' ? (
          <div className="pt-1 text-[9.5px] text-slate-500">
            {age === 0 ? 'Infant (< 1 yr)' : age < 18 ? 'Pediatric' : age >= 60 ? 'Senior Citizen' : 'Adult'}
          </div>
        ) : null}
      </div>
    </React.Fragment>
  );
};
