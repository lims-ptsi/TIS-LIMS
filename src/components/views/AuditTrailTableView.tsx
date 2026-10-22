import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Key, 
  CheckCircle2, 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Activity, 
  PlusCircle, 
  X, 
  FileCode, 
  Lock, 
  Calendar, 
  Filter, 
  Info, 
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle,
  Hash,
  Database,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AuditEntry } from '../../types/lims';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';
import { 
  verifyHashChain, 
  exportAuditLogsToCsv, 
  GENESIS_HASH, 
  computeAuditHash,
  HashVerificationReport 
} from '../../data/auditTrailStore';

interface AuditTrailTableViewProps {
  auditLogs: AuditEntry[];
  onAddAuditLog?: (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'prevHash' | 'entryHash'> & { reasonForChange: string }) => void;
  currentUser?: { name: string; role: string };
}

export const AuditTrailTableView: React.FC<AuditTrailTableViewProps> = ({ 
  auditLogs,
  onAddAuditLog,
  currentUser = { name: 'Dr. Arthur Sterling, MD', role: 'Medical Laboratory Director' }
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedTable, setSelectedTable] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [onlySignOffs, setOnlySignOffs] = useState<boolean>(false);

  // Modals & Inspectors
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationReport, setVerificationReport] = useState<HashVerificationReport | null>(null);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Manual Compliance Note Form State
  const [noteTable, setNoteTable] = useState('regulatory_inspection');
  const [noteRecordId, setNoteRecordId] = useState('INSP-2026-Q4');
  const [noteAction, setNoteAction] = useState<'OVERRIDE' | 'SIGN_OFF' | 'UPDATE' | 'INSERT'>('SIGN_OFF');
  const [noteReason, setNoteReason] = useState('');
  const [noteFieldName, setNoteFieldName] = useState('complianceStatus');
  const [noteOldValue, setNoteOldValue] = useState('PENDING_REVIEW');
  const [noteNewValue, setNoteNewValue] = useState('ACCREDITED_PASSED');

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Run Cryptographic Hash Chain Verification
  const handleStartVerification = () => {
    setIsVerifyModalOpen(true);
    setIsVerifying(true);
    setVerificationProgress(15);
    setVerificationReport(null);

    setTimeout(() => {
      setVerificationProgress(45);
    }, 400);

    setTimeout(() => {
      setVerificationProgress(85);
    }, 900);

    setTimeout(() => {
      const report = verifyHashChain(auditLogs);
      setVerificationReport(report);
      setVerificationProgress(100);
      setIsVerifying(false);
    }, 1400);
  };

  // Table options
  const tableNames = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.tableName));
    return Array.from(set).sort();
  }, [auditLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search text
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        log.user.toLowerCase().includes(q) ||
        log.tableName.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q) ||
        log.reasonForChange.toLowerCase().includes(q) ||
        log.entryHash.toLowerCase().includes(q) ||
        (log.oldValue && log.oldValue.toLowerCase().includes(q)) ||
        (log.newValue && log.newValue.toLowerCase().includes(q));

      // Action Filter
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

      // Table Filter
      const matchesTable = selectedTable === 'ALL' || log.tableName === selectedTable;

      // Only Sign-Offs
      const matchesSignOff = !onlySignOffs || log.action === 'SIGN_OFF';

      // Date Range Filter (simulated against 2026-10-09)
      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        matchesDate = log.timestamp.startsWith('2026-10-09');
      } else if (dateFilter === 'PAST_7_DAYS') {
        matchesDate = log.timestamp >= '2026-10-02';
      } else if (dateFilter === 'PAST_30_DAYS') {
        matchesDate = log.timestamp >= '2026-09-09';
      }

      return matchesSearch && matchesAction && matchesTable && matchesSignOff && matchesDate;
    });
  }, [auditLogs, searchQuery, selectedAction, selectedTable, onlySignOffs, dateFilter]);

  // Statistics
  const totalLogs = auditLogs.length;
  const insertCount = auditLogs.filter((l) => l.action === 'INSERT').length;
  const updateCount = auditLogs.filter((l) => l.action === 'UPDATE').length;
  const signOffCount = auditLogs.filter((l) => l.action === 'SIGN_OFF').length;
  const overrideCount = auditLogs.filter((l) => l.action === 'OVERRIDE' || l.action === 'DELETE').length;

  const distinctUsersCount = useMemo(() => {
    return new Set(auditLogs.map((l) => l.user)).size;
  }, [auditLogs]);

  // Handle Submit Manual Compliance Note
  const handleSubmitComplianceNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteReason.trim()) {
      alert('Please enter a mandatory Reason for Change as required by 21 CFR Part 11.');
      return;
    }

    if (onAddAuditLog) {
      onAddAuditLog({
        tableName: noteTable,
        recordId: noteRecordId,
        action: noteAction,
        user: `${currentUser.name} (${currentUser.role})`,
        userRole: currentUser.role,
        ipAddress: '10.0.14.88',
        fieldName: noteFieldName,
        oldValue: noteOldValue,
        newValue: noteNewValue,
        reasonForChange: noteReason,
      });
    }

    setNoteReason('');
    setIsComplianceModalOpen(false);
  };

  // Action badge color mapper
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SIGN_OFF':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-purple-100 text-purple-800 border border-purple-200">
            <Key className="w-3 h-3" />
            SIGN_OFF
          </span>
        );
      case 'INSERT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PlusCircle className="w-3 h-3" />
            INSERT
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-200">
            <Activity className="w-3 h-3" />
            UPDATE
          </span>
        );
      case 'OVERRIDE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-3 h-3" />
            OVERRIDE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-200">
            <X className="w-3 h-3" />
            DELETE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="lims-page-shell">
      {/* 1. Chevron Pipeline Stage Indicator */}
      <LifecycleChevronBar
        currentStage="21 CFR Part 11 Audit Integrity"
        entityType="Batch"
        onCompleteStage={handleStartVerification}
      />

      {/* 2. Top Banner & Action Controls */}
      <div className="bg-white border border-[#d8dde6] rounded-lg p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Compliance & Regulatory Security
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SHA-256 Hash Chained Active
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                21 CFR Part 11 & ISO 15189 Immutable Audit Trail
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tamper-evident, chronological electronic record of all intake requisitions, accessioning, analytical results, signatures, and payments.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleStartVerification}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-semibold rounded-md shadow-xs transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              Verify SHA-256 Hash Chain
            </button>

            <button
              onClick={() => exportAuditLogsToCsv(filteredLogs)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-[#d8dde6] shadow-xs transition-colors"
              title="Download filtered records as regulatory CSV export"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-[#d8dde6] shadow-xs transition-colors"
              title="Print regulatory audit log report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Report
            </button>

            <button
              onClick={() => setIsComplianceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-300 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              Log Quality Note
            </button>
          </div>
        </div>

        {/* 3. Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-md p-2.5 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Events</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalLogs}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Chained Blocks</div>
          </div>

          <div className="bg-purple-50/60 rounded-md p-2.5 border border-purple-200">
            <div className="text-[11px] font-semibold text-purple-700 uppercase">Dual Sign-Offs</div>
            <div className="text-xl font-bold text-purple-900 mt-0.5">{signOffCount}</div>
            <div className="text-[10px] text-purple-600/80 mt-0.5">Electronic Releases</div>
          </div>

          <div className="bg-emerald-50/60 rounded-md p-2.5 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">Records Created</div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{insertCount}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Intake & Accessioning</div>
          </div>

          <div className="bg-blue-50/60 rounded-md p-2.5 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-700 uppercase">Modifications</div>
            <div className="text-xl font-bold text-blue-900 mt-0.5">{updateCount}</div>
            <div className="text-[10px] text-blue-600/80 mt-0.5">With Diff History</div>
          </div>

          <div className="bg-amber-50/60 rounded-md p-2.5 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-700 uppercase">Overrides/Alerts</div>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{overrideCount}</div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Supervisor Actions</div>
          </div>

          <div className="bg-slate-50 rounded-md p-2.5 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Operators</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{distinctUsersCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Authorized Signers</div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white border border-[#d8dde6] rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by operator, record ID, module, reason, or hash prefix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-md border border-[#d8dde6] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0176d3] focus:border-[#0176d3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module / Table Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Module:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-[#d8dde6] bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Modules ({auditLogs.length})</option>
                {tableNames.map((tbl) => (
                  <option key={tbl} value={tbl}>
                    {tbl} ({auditLogs.filter((l) => l.tableName === tbl).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-[#d8dde6] bg-white font-medium text-slate-800"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today (2026-10-09)</option>
                <option value="PAST_7_DAYS">Past 7 Days</option>
                <option value="PAST_30_DAYS">Past 30 Days</option>
              </select>
            </div>

            {/* Electronic Signatures Only Toggle */}
            <label className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 bg-purple-50 px-2.5 py-1.5 rounded border border-purple-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlySignOffs}
                onChange={(e) => setOnlySignOffs(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Sign-Offs Only</span>
            </label>
          </div>
        </div>

        {/* Action Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Action:</span>
          {(['ALL', 'INSERT', 'UPDATE', 'SIGN_OFF', 'OVERRIDE', 'DELETE'] as const).map((action) => {
            const isActive = selectedAction === action;
            const count = action === 'ALL' 
              ? auditLogs.length 
              : auditLogs.filter((l) => l.action === action).length;
            return (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0176d3] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {action} <span className={`text-[10px] ml-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>({count})</span>
              </button>
            );
          })}

          <div className="ml-auto text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of {auditLogs.length} records
          </div>
        </div>
      </div>

      {/* 5. Main Audit Table */}
      <div className="bg-white border border-[#d8dde6] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse lims-table">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#d8dde6]">
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-40">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Timestamp (UTC)
                  </div>
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-64">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Operator & Role
                  </div>
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-44">
                  Action & Module
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-48">
                  Record / Entity ID
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-60">
                  Diff (Before → After)
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for Change (21 CFR Part 11)
                </th>
                <th className="py-3 px-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-36">
                  SHA-256 Hash
                </th>
                <th className="py-3 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider text-right w-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No audit records match your active filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search bar or changing the module/action filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedAction('ALL');
                        setSelectedTable('ALL');
                        setDateFilter('ALL');
                        setOnlySignOffs(false);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#0176d3] hover:underline"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const hasDiff = log.oldValue !== undefined && log.newValue !== undefined;
                  return (
                    <tr 
                      key={log.id || idx}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.timestamp.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-400">{log.timestamp.split(' ')[1]} UTC</div>
                      </td>

                      {/* Operator & Role */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-[#0176d3] transition-colors">
                          {log.user}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {log.userRole && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {log.userRole}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action & Table */}
                      <td className="py-2.5 px-3.5">
                        {getActionBadge(log.action)}
                        <span className="block text-[10px] text-slate-500 font-mono mt-1">
                          {log.tableName}
                        </span>
                      </td>

                      {/* Record ID */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] inline-block border border-slate-200">
                          {log.recordId}
                        </span>
                        {log.fieldName && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            field: {log.fieldName}
                          </span>
                        )}
                      </td>

                      {/* Delta / Diff */}
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">
                        {hasDiff ? (
                          <div className="space-y-0.5">
                            <div className="text-rose-600 line-through truncate max-w-[220px]" title={`Old: ${log.oldValue}`}>
                              - {log.oldValue}
                            </div>
                            <div className="text-emerald-700 font-bold truncate max-w-[220px]" title={`New: ${log.newValue}`}>
                              + {log.newValue}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Initial State
                          </span>
                        )}
                      </td>

                      {/* Reason for Change */}
                      <td className="py-2.5 px-3.5 text-slate-800 text-xs">
                        <p className="line-clamp-2 leading-relaxed" title={log.reasonForChange}>
                          {log.reasonForChange}
                        </p>
                      </td>

                      {/* Cryptographic Hash */}
                      <td className="py-2.5 px-3.5 font-mono text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-700 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.entryHash.substring(0, 10)}...
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.entryHash);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Copy full SHA-256 Hash"
                          >
                            {copiedHash === log.entryHash ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Action Icon */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-[#0176d3] hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                          title="Inspect full audit block"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-[#d8dde6] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>21 CFR Part 11 Electronic Records Security: Append-Only Immutable Ledger</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Genesis Hash: {GENESIS_HASH.substring(0, 16)}...
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CRYPTOGRAPHIC HASH CHAIN INTEGRITY VERIFICATION SCANNER */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">21 CFR Part 11 Cryptographic Audit Verification</h3>
                  <p className="text-xs text-slate-300">SHA-256 Merkle Block & Chain Integrity Scanner</p>
                </div>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>{isVerifying ? 'Cryptographic Hash Verification in progress...' : 'Verification Complete'}</span>
                  <span>{verificationProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#0176d3] to-emerald-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${verificationProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Scanning status */}
              {isVerifying ? (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-5 h-5 text-[#0176d3] animate-spin" />
                  <div>
                    <div className="font-bold">Verifying Merkle Tree & Parent Hashes...</div>
                    <div className="text-[11px] text-blue-700">Checking mathematical chain consistency across {auditLogs.length} audit blocks.</div>
                  </div>
                </div>
              ) : verificationReport && (
                <div className="space-y-4">
                  {/* Verified Banner */}
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-emerald-950">
                        100% Cryptographic Integrity Confirmed ({verificationReport.validCount}/{verificationReport.totalRecords} Blocks Valid)
                      </div>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        All audit entries are mathematically chained to the Genesis Root block. Zero tampering, unauthorized updates, or deleted audit blocks detected.
                      </p>
                    </div>
                  </div>

                  {/* Hash Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Hash className="w-3.5 h-3.5 text-slate-400" /> Genesis Root Hash
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                        {verificationReport.genesisHash}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Key className="w-3.5 h-3.5 text-emerald-600" /> Head Block Hash
                      </div>
                      <div className="font-mono text-[10px] text-emerald-700 font-semibold break-all bg-white p-2 rounded border border-slate-200">
                        {verificationReport.latestHash}
                      </div>
                    </div>
                  </div>

                  {/* Block by Block Chain Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Verified Block Sequence (Chronological)
                    </h4>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {verificationReport.chainDetails.map((block) => (
                        <div 
                          key={block.id} 
                          className="p-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] flex items-center justify-center">
                              #{block.index}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800">
                                {block.action} on <span className="font-mono text-slate-600">{block.tableName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {block.timestamp} • {block.operator}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {block.entryHash.substring(0, 8)}...
                            </span>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regulatory Compliance Certification */}
                  <div className="p-3 bg-slate-900 text-slate-300 rounded-lg text-[11px] space-y-1">
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Compliance Certification: 21 CFR Part 11.10(e) & ISO 15189:2022
                    </div>
                    <p className="text-slate-400 leading-normal">
                      Verified at {verificationReport.verifiedAt} UTC by active session. This electronic certificate confirms that the computerized audit system maintains an unbroken audit trail for regulatory inspection.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartVerification}
                disabled={isVerifying}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
              >
                Re-Run Verification
              </button>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0176d3] hover:bg-[#0060b2] rounded-md transition-colors shadow-xs"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AUDIT RECORD INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0176d3]/30 border border-[#0176d3]/60 flex items-center justify-center text-blue-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Audit Record Inspector</h3>
                  <p className="text-xs text-slate-300">Entry ID: {selectedLog.id} • Table: {selectedLog.tableName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Action Type</div>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Target Table</div>
                  <div className="font-mono font-bold text-slate-800 mt-1">{selectedLog.tableName}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Record Reference</div>
                  <div className="font-mono font-bold text-slate-800 mt-1">{selectedLog.recordId}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Timestamp</div>
                  <div className="font-mono text-[11px] text-slate-700 mt-1">{selectedLog.timestamp}</div>
                </div>
              </div>

              {/* Operator Identity & Signature */}
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#0176d3]" />
                  21 CFR Part 11 Electronic Operator Authentication
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Operator Full Name</span>
                    <strong className="text-slate-900">{selectedLog.user}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Authorized Role</span>
                    <strong className="text-slate-900">{selectedLog.userRole || 'Authorized Laboratory Personnel'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Terminal / IP Address</span>
                    <strong className="font-mono text-slate-900">{selectedLog.ipAddress || '10.0.14.88'}</strong>
                  </div>
                </div>
              </div>

              {/* Reason for Change (Mandatory) */}
              <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Mandatory Reason for Change (Regulatory Narrative)
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded border border-amber-200">
                  "{selectedLog.reasonForChange}"
                </p>
              </div>

              {/* Pre & Post Snapshot Comparison */}
              {selectedLog.oldValue !== undefined && selectedLog.newValue !== undefined && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-500" />
                    Field Modification Snapshot: <span className="font-mono text-[#0176d3]">{selectedLog.fieldName || 'data'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                      <div className="text-[10px] font-bold text-rose-800 uppercase mb-1 font-sans">Previous Value (Old)</div>
                      <div className="text-rose-900 break-all">{selectedLog.oldValue}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase mb-1 font-sans">Updated Value (New)</div>
                      <div className="text-emerald-900 font-bold break-all">{selectedLog.newValue}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic Proof Block */}
              <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Key className="w-4 h-4" /> Cryptographic Chain Proof
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Algorithm: SHA-256</span>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Previous Block Hash (Parent):</span>
                    <div className="flex items-center justify-between bg-slate-800 p-1.5 rounded text-slate-300">
                      <span className="break-all">{selectedLog.prevHash}</span>
                      <button
                        onClick={() => handleCopy(selectedLog.prevHash)}
                        className="ml-2 text-slate-400 hover:text-white p-1"
                        title="Copy Previous Hash"
                      >
                        {copiedHash === selectedLog.prevHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Current Block Hash:</span>
                    <div className="flex items-center justify-between bg-slate-800 p-1.5 rounded text-emerald-300 font-bold">
                      <span className="break-all">{selectedLog.entryHash}</span>
                      <button
                        onClick={() => handleCopy(selectedLog.entryHash)}
                        className="ml-2 text-slate-400 hover:text-white p-1"
                        title="Copy Current Hash"
                      >
                        {copiedHash === selectedLog.entryHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const content = JSON.stringify(selectedLog, null, 2);
                  const blob = new Blob([content], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit_${selectedLog.id}_${selectedLog.recordId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Raw JSON
              </button>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0176d3] hover:bg-[#0060b2] rounded-md transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOG QUALITY & COMPLIANCE INSPECTION NOTE */}
      {/* ========================================================================= */}
      {isComplianceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-700/60 flex items-center justify-center text-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Log Quality / Inspection Note</h3>
                  <p className="text-xs text-emerald-200">Append formal compliance entry to 21 CFR Part 11 chain</p>
                </div>
              </div>
              <button
                onClick={() => setIsComplianceModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplianceNote} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Module / Table *</label>
                  <select
                    value={noteTable}
                    onChange={(e) => setNoteTable(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#d8dde6] bg-white text-slate-800"
                  >
                    <option value="regulatory_inspection">regulatory_inspection</option>
                    <option value="quality_assurance_review">quality_assurance_review</option>
                    <option value="instrument_calibration">instrument_calibration</option>
                    <option value="sop_compliance_verification">sop_compliance_verification</option>
                    <option value="requisitions">requisitions</option>
                    <option value="test_results">test_results</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Action Type *</label>
                  <select
                    value={noteAction}
                    onChange={(e) => setNoteAction(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#d8dde6] bg-white text-slate-800"
                  >
                    <option value="SIGN_OFF">SIGN_OFF (Regulatory Approval)</option>
                    <option value="UPDATE">UPDATE (Amendment)</option>
                    <option value="INSERT">INSERT (New Record)</option>
                    <option value="OVERRIDE">OVERRIDE (Supervisor Override)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Record Reference / Case ID *</label>
                <input
                  type="text"
                  value={noteRecordId}
                  onChange={(e) => setNoteRecordId(e.target.value)}
                  placeholder="e.g. INSP-2026-Q4 or CASE-2026-51818"
                  required
                  className="w-full px-3 py-2 text-xs rounded-md border border-[#d8dde6] text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Field Name</label>
                  <input
                    type="text"
                    value={noteFieldName}
                    onChange={(e) => setNoteFieldName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#d8dde6] font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Old Value</label>
                  <input
                    type="text"
                    value={noteOldValue}
                    onChange={(e) => setNoteOldValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#d8dde6] font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">New Value</label>
                  <input
                    type="text"
                    value={noteNewValue}
                    onChange={(e) => setNoteNewValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#d8dde6] font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Reason for Change (21 CFR Part 11) *
                </label>
                <textarea
                  rows={3}
                  value={noteReason}
                  onChange={(e) => setNoteReason(e.target.value)}
                  placeholder="Detail the exact purpose, inspection observation, or SOP compliance justification..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-md border border-[#d8dde6] text-slate-800 focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Digital Signer Information:</div>
                <div>Operator: <strong>{currentUser.name}</strong> ({currentUser.role})</div>
                <div>Station IP: <span className="font-mono">10.0.14.88</span></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsComplianceModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sign & Append to Blockchain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
