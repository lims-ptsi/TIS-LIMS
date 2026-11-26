import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  FileText,
  FlaskConical,
  MapPin,
  PackageCheck,
  Printer,
  Search,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LabTestRequisition, PatientCategory, Sample } from '../../types/lims';
import {
  buildPatientDirectory,
  filterPatientRecords,
  findSampleForRequisition,
  patientRecordStats,
  PatientRecord,
  PatientVisit,
} from '../../data/patientDirectory';
import {
  formatResultsPickupWhen,
  isResultsPickedUp,
} from '../../utils/resultsPickup';
import { DashboardHeroArtwork } from '../common/LimsDashboardArtwork';

const PATIENT_SELECT_KEY = 'labtis_selected_patient_id';

function HomeMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconWrap,
  iconColor,
  valueClass = 'text-[var(--lims-navy)]',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  valueClass?: string;
}) {
  return (
    <article className="lims-card h-full p-4 sm:px-5 sm:py-4 shadow-sm transition-all hover:shadow-md hover:border-[#0878e8]/35">
      <div className="flex items-center gap-3 sm:gap-4 w-full min-h-[4.5rem]">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconWrap}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[var(--lims-navy)] leading-snug">
            {label}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{hint}</p>
        </div>
        <span className={`text-2xl sm:text-[1.75rem] font-bold tabular-nums leading-none shrink-0 ${valueClass}`}>
          {value}
        </span>
      </div>
    </article>
  );
}

const CATEGORY_BADGE: Record<string, string> = {
  PhilHealth: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Indigent: 'bg-violet-50 text-violet-800 border-violet-200',
  Corporate: 'bg-amber-50 text-amber-800 border-amber-200',
  'Pre-Employment / Employee': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  Employee: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  Projects: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  OPD: 'bg-sky-50 text-sky-800 border-sky-200',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  RECEIVED: 'Received',
  IN_TESTING: 'In testing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: 'bg-amber-50 text-amber-900 border-amber-200',
  RECEIVED: 'bg-sky-50 text-sky-900 border-sky-200',
  IN_TESTING: 'bg-blue-50 text-[#014486] border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_DOT: Record<string, string> = {
  SUBMITTED: 'bg-amber-500',
  RECEIVED: 'bg-sky-500',
  IN_TESTING: 'bg-[#0878e8]',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-400',
};

const CATEGORIES: (PatientCategory | 'ALL')[] = [
  'ALL',
  'OPD',
  'PhilHealth',
  'Indigent',
  'Corporate',
  'Pre-Employment / Employee',
  'Employee',
  'Projects',
];

function formatPersonName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Unknown patient';
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/\./g, '');
      if (/^(jr|sr)$/i.test(bare)) return bare.charAt(0).toUpperCase() + bare.slice(1).toLowerCase() + '.';
      if (/^(ii|iii|iv|v|vi)$/i.test(bare)) return bare.toUpperCase();
      if (bare === 'md') return 'MD';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function copyText(value: string) {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value || value === '—') return null;
  return (
    <button
      type="button"
      onClick={() => {
        copyText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1 text-left rounded-md px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group text-[11px]"
      title={`Copy ${label}`}
    >
      <span className="text-slate-500 font-medium">{label}</span>
      <span
        className={`font-semibold tabular-nums ${label === 'Barcode' ? 'text-[#0878e8]' : 'text-slate-900'}`}
      >
        {value}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0" aria-hidden />
      )}
    </button>
  );
}

interface PatientRecordsViewProps {
  requisitions: LabTestRequisition[];
  samples: Sample[];
  onOpenSpecimen?: (sample: Sample, req: LabTestRequisition) => void;
  onPrintResults?: (req: LabTestRequisition) => void;
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
}

function VisitTimelineItem({
  visit,
  req,
  isLast,
  onOpenSpecimen,
  onPrintResults,
  onMarkResultsPickedUp,
}: {
  visit: PatientVisit;
  req: LabTestRequisition | undefined;
  isLast: boolean;
  onOpenSpecimen?: (sample: Sample, req: LabTestRequisition) => void;
  onPrintResults?: (req: LabTestRequisition) => void;
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
}) {
  const [examsExpanded, setExamsExpanded] = useState(false);
  const tone = STATUS_TONE[visit.status] || STATUS_TONE.SUBMITTED;
  const label = STATUS_LABEL[visit.status] || visit.status;
  const exams = visit.examinations;
  const visibleExams = examsExpanded ? exams : exams.slice(0, 5);

  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      {!isLast ? (
        <span className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200" aria-hidden />
      ) : null}
      <span
        className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-white bg-[#0878e8] shadow-sm ring-2 ring-[#c5daf8]"
        aria-hidden
      />

      <div className="rounded-lg border border-[#d8dde6] bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
        <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{visit.requestDate || '—'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tone}`}>
                  {label}
                </span>
                {visit.patientCategory ? (
                  <span className="text-[10px] font-medium text-slate-600 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    {visit.patientCategory}
                  </span>
                ) : null}
                {visit.status === 'COMPLETED' ? (
                  isResultsPickedUp(visit) ? (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200"
                      title={formatResultsPickupWhen(visit.resultsPickedUpAt) || undefined}
                    >
                      Picked up
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-violet-50 text-violet-900 border-violet-200">
                      Awaiting pickup
                    </span>
                  )
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <CopyChip label="Case" value={visit.caseNo || '—'} />
            <CopyChip label="Req" value={visit.requisitionNumber} />
            {visit.sampleBarcode ? <CopyChip label="Barcode" value={visit.sampleBarcode} /> : null}
          </div>
          {(req && visit.sampleId && onOpenSpecimen) ||
          (req && visit.status === 'COMPLETED' && (onPrintResults || onMarkResultsPickedUp)) ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
              {req && visit.sampleId && onOpenSpecimen ? (
                <button
                  type="button"
                  onClick={() => {
                    const sample = { id: visit.sampleId! } as Sample;
                    onOpenSpecimen(sample, req);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-[#c5daf8] bg-[#eef4ff] hover:bg-[#dde9fc] text-[#014486] cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Open specimen
                </button>
              ) : null}
              {req && visit.status === 'COMPLETED' && onPrintResults ? (
                <button
                  type="button"
                  onClick={() => onPrintResults(req)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print results
                </button>
              ) : null}
              {req && visit.status === 'COMPLETED' && onMarkResultsPickedUp ? (
                <button
                  type="button"
                  onClick={() => onMarkResultsPickedUp(req, !isResultsPickedUp(visit))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer ${
                    isResultsPickedUp(visit)
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  {isResultsPickedUp(visit) ? 'Undo pickup' : 'Mark picked up'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="px-3.5 py-3 space-y-3 text-sm">
          {visit.status === 'COMPLETED' && isResultsPickedUp(visit) ? (
            <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2">
              Results picked up
              {visit.resultsPickedUpBy ? ` by ${visit.resultsPickedUpBy}` : ''}
              {formatResultsPickupWhen(visit.resultsPickedUpAt) ? ` · ${formatResultsPickupWhen(visit.resultsPickedUpAt)}` : ''}
            </p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Physician</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{visit.physician || '—'}</p>
            </div>
            {(visit.orNumber || visit.chargeSlipNumber) && (
              <div className="space-y-1.5">
                {visit.orNumber ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Official receipt</span>
                    <p className="text-sm font-medium tabular-nums text-slate-900 mt-0.5">{visit.orNumber}</p>
                  </div>
                ) : null}
                {visit.chargeSlipNumber ? (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Charge slip</span>
                    <p className="text-sm font-medium tabular-nums text-slate-900 mt-0.5">{visit.chargeSlipNumber}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {exams.length > 0 ? (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Examinations ({exams.length})
              </span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {visibleExams.map((exam) => (
                  <li
                    key={exam}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 leading-snug max-w-full"
                  >
                    {exam}
                  </li>
                ))}
              </ul>
              {exams.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setExamsExpanded(!examsExpanded)}
                  className="mt-1.5 text-xs font-semibold text-[#0878e8] hover:underline cursor-pointer"
                >
                  {examsExpanded ? 'Show fewer examinations' : `Show ${exams.length - 5} more examinations`}
                </button>
              ) : null}
            </div>
          ) : null}
          {visit.clinicalNotes ? (
            <p className="text-xs text-slate-600 border-t border-slate-100 pt-2 leading-relaxed">
              {visit.clinicalNotes}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PatientDetailDrawer({
  record,
  reqById,
  onClose,
  onOpenSpecimen,
  onPrintResults,
  onMarkResultsPickedUp,
}: {
  record: PatientRecord;
  reqById: Map<string, LabTestRequisition>;
  onClose: () => void;
  onOpenSpecimen?: (sample: Sample, req: LabTestRequisition) => void;
  onPrintResults?: (req: LabTestRequisition) => void;
  onMarkResultsPickedUp?: (req: LabTestRequisition, pickedUp: boolean) => void;
}) {
  const stats = patientRecordStats(record);
  const latestVisit = record.visits[0];
  const latestReq = latestVisit ? reqById.get(latestVisit.id) : undefined;

  const handleOpenSpecimen = (partial: Sample, req: LabTestRequisition) => {
    onOpenSpecimen?.(partial, req);
  };

  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 280);
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="patient-drawer-title">
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer ${
          closing ? 'patient-drawer-backdrop-out' : 'patient-drawer-backdrop-in'
        }`}
        aria-label="Close patient details"
        onClick={requestClose}
      />
      <div
        className={`relative w-full sm:max-w-[28rem] md:max-w-[32rem] h-full bg-white shadow-2xl flex flex-col border-l border-[#d8dde6] will-change-transform ${
          closing ? 'patient-drawer-panel-out' : 'patient-drawer-panel-in'
        }`}
      >
        <div className="shrink-0 px-4 py-3.5 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0878e8]">
                Patient history
              </p>
              <h2
                id="patient-drawer-title"
                className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5 break-words leading-snug"
              >
                {formatPersonName(record.fullName)}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {stats.firstVisit && stats.lastVisit
                  ? stats.firstVisit === stats.lastVisit
                    ? `Single visit · ${stats.lastVisit}`
                    : `${stats.firstVisit} – ${stats.lastVisit}`
                  : 'No visits recorded'}
              </p>
              {record.address ? (
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{record.address}</p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 tabular-nums">
                  {stats.totalVisits} {stats.totalVisits === 1 ? 'visit' : 'visits'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 tabular-nums">
                  {stats.completed} completed
                </span>
                {stats.inFlight > 0 ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#014486] tabular-nums">
                    {stats.inFlight} in progress
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: Calendar, label: 'Date of birth', value: record.birthday || '—' },
              {
                icon: Activity,
                label: 'Age / sex',
                value: `${record.age ? `${record.age} yrs` : '—'} · ${record.sex}`,
              },
              { icon: FileText, label: 'Civil status', value: record.civilStatus },
              { icon: MapPin, label: 'Category', value: record.category },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-slate-200/90 bg-white px-2.5 py-2 min-w-0"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                  <item.icon className="w-3 h-3 shrink-0" aria-hidden />
                  {item.label}
                </dt>
                <dd className="font-medium text-slate-900 mt-0.5 truncate" title={item.value}>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          {stats.categories.length > 1 ? (
            <p className="mt-2 text-[11px] text-amber-950 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
              Multiple billing categories: {stats.categories.join(', ')}
            </p>
          ) : null}

          {latestVisit && latestReq ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {latestVisit.sampleId && onOpenSpecimen ? (
                <button
                  type="button"
                  onClick={() => handleOpenSpecimen({ id: latestVisit.sampleId! } as Sample, latestReq)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#0878e8] hover:bg-[#0669c9] text-white cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Latest specimen
                </button>
              ) : null}
              {latestVisit.status === 'COMPLETED' && onPrintResults ? (
                <button
                  type="button"
                  onClick={() => onPrintResults(latestReq)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print latest results
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 bg-slate-50/40">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">
            Visit timeline · {record.visits.length}
          </h3>
          {record.visits.map((visit, idx) => (
            <VisitTimelineItem
              key={visit.id}
              visit={visit}
              req={reqById.get(visit.id)}
              isLast={idx === record.visits.length - 1}
              onOpenSpecimen={onOpenSpecimen}
              onPrintResults={onPrintResults}
              onMarkResultsPickedUp={onMarkResultsPickedUp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  requisitions,
  samples,
  onOpenSpecimen,
  onPrintResults,
  onMarkResultsPickedUp,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PatientCategory | 'ALL'>('ALL');
  const [sex, setSex] = useState<'ALL' | 'Male' | 'Female' | 'Other'>('ALL');
  const [visitStatus, setVisitStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'visits'>('recent');
  const [drawerPatientId, setDrawerPatientId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const directory = useMemo(
    () => buildPatientDirectory(requisitions, samples),
    [requisitions, samples]
  );

  const filtered = useMemo(() => {
    let list = filterPatientRecords(directory, { query, category, sex, sortBy });
    if (visitStatus === 'ACTIVE') {
      list = list.filter((r) =>
        r.visits.some((v) => ['SUBMITTED', 'RECEIVED', 'IN_TESTING'].includes(v.status))
      );
    } else if (visitStatus === 'COMPLETED') {
      list = list.filter((r) => r.visits.some((v) => v.status === 'COMPLETED'));
    }
    return list;
  }, [directory, query, category, sex, sortBy, visitStatus]);

  const drawerPatient = useMemo(
    () => (drawerPatientId ? directory.find((r) => r.id === drawerPatientId) : null),
    [directory, drawerPatientId]
  );

  const reqById = useMemo(() => {
    const map = new Map<string, LabTestRequisition>();
    requisitions.forEach((r) => map.set(r.id, r));
    return map;
  }, [requisitions]);

  const hasActiveFilters =
    query.trim() !== '' || category !== 'ALL' || sex !== 'ALL' || visitStatus !== 'ALL';

  const summary = useMemo(() => {
    const totalPatients = directory.length;
    const totalVisits = directory.reduce((n, r) => n + r.visits.length, 0);
    const completed = directory.reduce(
      (n, r) => n + r.visits.filter((v) => v.status === 'COMPLETED').length,
      0
    );
    const thisMonth = new Date().toISOString().slice(0, 7);
    const visitsThisMonth = directory.reduce(
      (n, r) => n + r.visits.filter((v) => (v.requestDate || '').startsWith(thisMonth)).length,
      0
    );
    return { totalPatients, totalVisits, completed, visitsThisMonth };
  }, [directory]);

  const handleOpenSpecimen = (partial: Sample, req: LabTestRequisition) => {
    const full = samples.find((s) => s.id === partial.id) || findSampleForRequisition(req, samples);
    if (full && onOpenSpecimen) onOpenSpecimen(full, req);
  };

  const openDrawer = (patientId: string) => {
    setDrawerPatientId(patientId);
    try {
      sessionStorage.setItem(PATIENT_SELECT_KEY, patientId);
    } catch {
      /* ignore */
    }
  };

  const closeDrawer = () => setDrawerPatientId(null);

  const clearFilters = () => {
    setQuery('');
    setCategory('ALL');
    setSex('ALL');
    setVisitStatus('ALL');
    searchRef.current?.focus();
  };

  const activePatients = useMemo(
    () =>
      directory.filter((r) =>
        r.visits.some((v) => ['SUBMITTED', 'RECEIVED', 'IN_TESTING'].includes(v.status))
      ).length,
    [directory]
  );

  const focusSearch = () => {
    window.setTimeout(() => searchRef.current?.focus(), 0);
  };

  return (
    <div className="lims-page-shell space-y-4">
      <section className="lims-card relative overflow-hidden border-[var(--lims-border)] bg-gradient-to-br from-white via-white to-sky-50/30">
        <DashboardHeroArtwork />
        <div className="relative z-[1] px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src="/ptsilogo.png"
            alt="PTSI Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0878e8] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              Patient directory
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--lims-navy)] mt-2 tracking-tight">
              Patient records
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Visit history, billing category, and latest case status — select a row to open full timeline.
            </p>
          </div>
          <div className="sm:text-right shrink-0 sm:pl-6 border-l border-[var(--lims-border)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Showing</p>
            <p className="text-2xl font-bold text-[var(--lims-navy)] tabular-nums leading-none mt-1">
              {filtered.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">of {directory.length} patients</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <HomeMetricCard
          label="Patients"
          value={summary.totalPatients}
          hint="Unique patients in the directory"
          icon={Users}
          iconWrap="bg-sky-50"
          iconColor="text-sky-600"
        />
        <HomeMetricCard
          label="Total visits"
          value={summary.totalVisits}
          hint="All laboratory requests linked to patients"
          icon={FileText}
          iconWrap="bg-slate-100"
          iconColor="text-slate-700"
        />
        <HomeMetricCard
          label="Completed visits"
          value={summary.completed}
          hint="Released results on record"
          icon={Check}
          iconWrap="bg-emerald-50"
          iconColor="text-emerald-600"
          valueClass="text-emerald-700"
        />
        <HomeMetricCard
          label="Active patients"
          value={activePatients}
          hint={`${summary.visitsThisMonth} visit(s) this month`}
          icon={Activity}
          iconWrap="bg-blue-50"
          iconColor="text-[#0878e8]"
          valueClass="text-[#0878e8]"
        />
      </section>

      <button
        type="button"
        onClick={() => {
          setVisitStatus('ACTIVE');
          focusSearch();
        }}
        className="relative overflow-hidden w-full text-left rounded-xl bg-gradient-to-r from-[var(--lims-navy)] via-[#0c2d55] to-[#0a2240] hover:from-[#0c2d55] hover:to-[#081a33] text-white shadow-md px-5 py-4 flex items-center justify-between gap-4 cursor-pointer border border-[#0a2240]"
      >
        <span className="relative z-[1] flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-sky-200" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold">Find patients with active visits</span>
            <span className="block text-sm text-slate-300 mt-0.5">
              Filter to open cases and jump to name, case, or barcode search.
            </span>
          </span>
        </span>
        <span className="relative z-[1] inline-flex items-center gap-2 text-sm font-semibold bg-white text-[var(--lims-navy)] px-4 py-2 rounded-lg shrink-0 shadow-sm">
          Search
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>

      <div className="lims-card overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--lims-border)]">
            <h2 className="text-base font-semibold text-[var(--lims-navy)]">Patient directory</h2>
            <p className="text-xs text-slate-500 mt-1">
              {filtered.length} of {directory.length} patients — click a row for full history
            </p>
          </div>
          <div className="px-5 py-3 border-b border-[var(--lims-border)] bg-[#f8fafc]/60 flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-1 min-w-0 lg:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, case, barcode…"
                className="lims-input pl-8 pr-8 py-2 text-xs"
                aria-label="Search patients"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-1.5 top-1.5 p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 lg:flex-1 lg:justify-end">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PatientCategory | 'ALL')}
                className="lims-input text-xs px-2 py-1.5 min-w-0 flex-1 sm:flex-none sm:max-w-[140px]"
                aria-label="Filter by category"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All categories' : c}
                  </option>
                ))}
              </select>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as typeof sex)}
                className="lims-input text-xs px-2 py-1.5"
                aria-label="Filter by sex"
              >
                <option value="ALL">All sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value as typeof visitStatus)}
                className="lims-input text-xs px-2 py-1.5 min-w-0 flex-1 sm:flex-none sm:max-w-[150px]"
                aria-label="Filter by visit status"
              >
                <option value="ALL">Any visit status</option>
                <option value="ACTIVE">Has active visit</option>
                <option value="COMPLETED">Has completed visit</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="lims-input text-xs px-2 py-1.5"
                aria-label="Sort patients"
              >
                <option value="recent">Recent visit</option>
                <option value="name">Name A–Z</option>
                <option value="visits">Most visits</option>
              </select>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-semibold text-[#0878e8] hover:underline cursor-pointer px-1 shrink-0"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-[var(--lims-border)]">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-3 py-3">Date of birth</th>
                  <th className="px-3 py-3">Sex</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-center">Visits</th>
                  <th className="px-3 py-3">Last visit</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Latest case</th>
                  <th className="w-10 px-2 py-3" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">No patients match</p>
                      <p className="text-xs text-slate-500 mt-1">Try a different search or reset filters.</p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 text-xs font-semibold text-[#0878e8] hover:underline cursor-pointer"
                        >
                          Reset filters
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => {
                    const last = record.visits[0];
                    const statusKey = last?.status || 'SUBMITTED';
                    const tone = STATUS_TONE[statusKey] || STATUS_TONE.SUBMITTED;
                    const label = STATUS_LABEL[statusKey] || statusKey;
                    return (
                      <tr
                        key={record.id}
                        onClick={() => openDrawer(record.id)}
                        className="border-b border-[var(--lims-border)] hover:bg-[#f8fafc] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-5 text-sm font-medium text-slate-900">
                          <div className="flex items-center gap-2 min-w-0 normal-case">
                            <div className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-600" />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${STATUS_DOT[statusKey] || STATUS_DOT.SUBMITTED}`}
                              />
                            </div>
                            <span className="truncate max-w-[220px]">{formatPersonName(record.fullName)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-600">{record.birthday || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-700 uppercase text-[11px]">{record.sex}</td>
                        <td className="px-3 py-2.5 max-w-[140px]">
                          <span
                            className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border truncate max-w-full ${
                              CATEGORY_BADGE[record.category] ||
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title={record.category}
                          >
                            {record.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-slate-900">
                          {record.visits.length}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-600 whitespace-nowrap">
                          {last?.requestDate || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${tone}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-800 whitespace-nowrap font-mono text-[11px]">
                          {last?.caseNo || last?.requisitionNumber || '—'}
                        </td>
                        <td className="px-2 py-2.5 text-slate-400">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
      </div>

      {drawerPatient ? (
        <PatientDetailDrawer
          record={drawerPatient}
          reqById={reqById}
          onClose={closeDrawer}
          onOpenSpecimen={handleOpenSpecimen}
          onPrintResults={onPrintResults}
          onMarkResultsPickedUp={onMarkResultsPickedUp}
        />
      ) : null}
    </div>
  );
};
