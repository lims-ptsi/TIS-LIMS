import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
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

const PATIENT_SELECT_KEY = 'labtis_selected_patient_id';

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
  IN_TESTING: 'bg-[#0176d3]',
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
        className={`font-semibold tabular-nums ${label === 'Barcode' ? 'text-[#0176d3]' : 'text-slate-900'}`}
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
        className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-white bg-[#0176d3] shadow-sm ring-2 ring-[#c5daf8]"
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
                  className="mt-1.5 text-xs font-semibold text-[#0176d3] hover:underline cursor-pointer"
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0176d3]">
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#0176d3] hover:bg-[#0060b2] text-white cursor-pointer"
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

  return (
    <div className="lims-page-shell">
      <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
          <div className="px-3 py-2.5 sm:px-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-[#eef4ff] border border-[#c5daf8] flex items-center justify-center text-[#0176d3] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-tight">
                  Patient records
                </h1>
                <p className="text-[11px] text-slate-500 truncate">
                  {filtered.length} of {directory.length} patients · click a row for full history
                </p>
              </div>
            </div>
            <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:justify-end shrink-0">
              {[
                { label: 'Patients', value: summary.totalPatients },
                { label: 'Visits', value: summary.totalVisits },
                { label: 'Completed', value: summary.completed, accent: 'text-emerald-700' },
                { label: 'This month', value: summary.visitsThisMonth, accent: 'text-[#0176d3]' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {i > 0 ? <span className="hidden sm:inline text-slate-300" aria-hidden>|</span> : null}
                  <dt className="text-slate-500">{item.label}</dt>
                  <dd className={`font-semibold tabular-nums text-slate-900 ${item.accent || ''}`}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="px-3 py-2 sm:px-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-1 min-w-0 lg:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, case, barcode…"
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-[#d8dde6] bg-white focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3]"
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
                className="text-xs rounded-md border border-[#d8dde6] px-2 py-1 bg-white text-slate-800 min-w-0 flex-1 sm:flex-none sm:max-w-[140px]"
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
                className="text-xs rounded-md border border-[#d8dde6] px-2 py-1 bg-white text-slate-800"
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
                className="text-xs rounded-md border border-[#d8dde6] px-2 py-1 bg-white text-slate-800 min-w-0 flex-1 sm:flex-none sm:max-w-[150px]"
                aria-label="Filter by visit status"
              >
                <option value="ALL">Any visit status</option>
                <option value="ACTIVE">Has active visit</option>
                <option value="COMPLETED">Has completed visit</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs rounded-md border border-[#d8dde6] px-2 py-1 bg-white text-slate-800"
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
                  className="text-[11px] font-semibold text-[#0176d3] hover:underline cursor-pointer px-1 shrink-0"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 px-3">Patient</th>
                  <th className="py-2 px-2">Date of birth</th>
                  <th className="py-2 px-2">Sex</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2 text-center">Visits</th>
                  <th className="py-2 px-2">Last visit</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-3">Latest case</th>
                  <th className="py-2 px-1 w-8" aria-hidden />
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
                          className="mt-3 text-xs font-semibold text-[#0176d3] hover:underline cursor-pointer"
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
                        className="border-b border-slate-100 hover:bg-[#eef4ff]/60 cursor-pointer transition-colors uppercase font-normal"
                      >
                        <td className="py-2 px-3 text-slate-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-slate-600" />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-white ${STATUS_DOT[statusKey] || STATUS_DOT.SUBMITTED}`}
                              />
                            </div>
                            <span className="truncate max-w-[200px]">
                              {formatPersonName(record.fullName)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 tabular-nums text-slate-800">{record.birthday || '—'}</td>
                        <td className="py-2 px-2 text-slate-700">{record.sex}</td>
                        <td className="py-2 px-2 text-slate-700 max-w-[120px] truncate">{record.category}</td>
                        <td className="py-2 px-2 text-center tabular-nums text-slate-900">
                          {record.visits.length}
                        </td>
                        <td className="py-2 px-2 tabular-nums text-slate-800 whitespace-nowrap">
                          {last?.requestDate || '—'}
                        </td>
                        <td className="py-2 px-2 normal-case">
                          <span
                            className={`inline-flex text-[9px] font-normal uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${tone}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="py-2 px-3 tabular-nums text-slate-800 whitespace-nowrap">
                          {last?.caseNo || last?.requisitionNumber || '—'}
                        </td>
                        <td className="py-2 px-1 text-slate-300">
                          <ChevronRight className="w-3.5 h-3.5" />
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
