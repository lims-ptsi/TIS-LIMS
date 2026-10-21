import React, { useState, useEffect, useRef } from 'react';
import { limsService } from './services/limsService';
import { TopNavbar } from './components/layout/TopNavbar';
import { HomeDashboardView } from './components/views/HomeDashboardView';
import { SamplesListView } from './components/views/SamplesListView';
import { SampleDetailView } from './components/views/SampleDetailView';
import { BatchDetailView } from './components/views/BatchDetailView';
import { PlatesView } from './components/views/PlatesView';
import { BoxesView } from './components/views/BoxesView';
import { ProtocolsView } from './components/views/ProtocolsView';
import { QCAnalyticsView } from './components/views/QCAnalyticsView';
import { InventoryTableView } from './components/views/InventoryTableView';
import { CoAReportsView } from './components/views/CoAReportsView';
import { AuditTrailTableView } from './components/views/AuditTrailTableView';
import { InstrumentsView } from './components/views/InstrumentsView';
import { SubmissionsView } from './components/views/SubmissionsView';
import { CreateRequisitionView } from './components/views/CreateRequisitionView';
import { ExaminationsView } from './components/views/ExaminationsView';
import { ResultTemplatesView } from './components/views/ResultTemplatesView';
import { ResultFormsView } from './components/views/ResultFormsView';
import { NewSampleModal } from './components/modals/NewSampleModal';
import { NewRequisitionModal, LabTestRequisition } from './components/modals/NewRequisitionModal';
import { OrderOfPaymentModal } from './components/modals/OrderOfPaymentModal';
import { ResultEntryModal, ExamResultGroup } from './components/modals/ResultEntryModal';
import { CoAReportModal } from './components/modals/CoAReportModal';
import { LoginPage } from './components/auth/LoginPage';
import { LockScreenModal } from './components/auth/LockScreenModal';
import { ToastAlert, ToastMessage } from './components/common/ToastAlert';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  ExaminationItem, 
  AssignedFormType,
  loadStoredExaminations, 
  saveStoredExaminations,
  applyOfficialTariffPrices,
  EXAMINATION_CATALOG 
} from './data/examinationCatalog';
import { 
  ExaminationTemplate, 
  loadStoredTemplates, 
  saveStoredTemplates 
} from './data/testParametersCatalog';
import { 
  loadStoredAuditLogs, 
  saveStoredAuditLogs, 
  computeAuditHash, 
  GENESIS_HASH 
} from './data/auditTrailStore';
import { 
  loadStoredRequisitions, 
  saveStoredRequisitions, 
  loadStoredSamples, 
  saveStoredSamples, 
  loadStoredTestOrders, 
  saveStoredTestOrders,
  loadStoredTestResults,
  saveStoredTestResults,
  lookupStoredRecord,
  requisitionNumberKey,
} from './data/limsDataStore';

import { 
  INITIAL_SAMPLES, 
  INITIAL_TEST_DEFINITIONS, 
  INITIAL_TEST_ORDERS, 
  INITIAL_QC_RUNS, 
  INITIAL_REAGENTS, 
  INITIAL_INSTRUMENTS, 
  INITIAL_AUDIT_LOGS 
} from './mock/initialData';

import { 
  Sample, 
  TestDefinition, 
  TestOrder, 
  QCRunRecord, 
  ReagentInventoryItem, 
  AuditEntry,
  PatientCategory,
  PriorityLevel,
  LimsNotification
} from './types/lims';
import { playNotificationChime, triggerDesktopNotification } from './utils/notificationSound';
import { hasPermission, permissionDeniedMessage } from './utils/permissions';
import { canOpenTab, defaultTabForRole, tabsForRole } from './data/roleAccess';

function MainLimsContent() {
  const { isAuthenticated, user, terminalInfo } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('submissions');

  useEffect(() => {
    if (!user) return;
    if (!canOpenTab(user.roleType, currentTab)) {
      setCurrentTab(defaultTabForRole(user.roleType));
    }
  }, [user, currentTab]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isNewSampleModalOpen, setIsNewSampleModalOpen] = useState(false);
  const [isNewRequisitionModalOpen, setIsNewRequisitionModalOpen] = useState(false);
  const [opdPaymentModalReq, setOpdPaymentModalReq] = useState<LabTestRequisition | null>(null);
  const [detailResultModalReq, setDetailResultModalReq] = useState<LabTestRequisition | null>(null);
  const [detailCoAModalReq, setDetailCoAModalReq] = useState<LabTestRequisition | null>(null);
  const [storedResults, setStoredResults] = useState<Record<string, Record<string, ExamResultGroup>>>(
    () => loadStoredTestResults().results
  );
  const [storedMedTechInfo, setStoredMedTechInfo] = useState<Record<string, any>>(
    () => loadStoredTestResults().medtech
  );
  const [resultUpdatedAt, setResultUpdatedAt] = useState<Record<string, string>>(
    () => loadStoredTestResults().updatedAt
  );
  const resultsTableWarned = useRef(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Live Notifications State
  const [notifications, setNotifications] = useState<LimsNotification[]>([]);

  const addNotification = (notif: Omit<LimsNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: LimsNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: 'Just now',
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // 1. Play Audio Chime via Web Audio API synthesizer
    playNotificationChime(notif.priority === 'STAT' ? 'stat' : 'new_request');

    // 2. Trigger native OS / Browser Desktop Notification
    triggerDesktopNotification(
      notif.title,
      notif.message,
      () => {
        if (notif.targetTab) {
          setCurrentTab(notif.targetTab);
        }
      }
    );
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Core State
  const [samples, setSamples] = useState<Sample[]>(() => loadStoredSamples());

  useEffect(() => {
    saveStoredSamples(samples);
  }, [samples]);

  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>(INITIAL_TEST_DEFINITIONS);
  const [testOrders, setTestOrders] = useState<TestOrder[]>(() => loadStoredTestOrders());

  useEffect(() => {
    saveStoredTestOrders(testOrders);
  }, [testOrders]);

  const [qcRuns, setQcRuns] = useState<QCRunRecord[]>(INITIAL_QC_RUNS);
  const [reagents, setReagents] = useState<ReagentInventoryItem[]>(INITIAL_REAGENTS);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => loadStoredAuditLogs());

  useEffect(() => {
    saveStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  // Centralized 21 CFR Part 11 Cryptographic Audit Trail Appender
  const handleAppendAuditLog = (
    entry: Omit<AuditEntry, 'id' | 'timestamp' | 'prevHash' | 'entryHash'> & {
      timestamp?: string;
      id?: string;
    }
  ) => {
    const timestamp = entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const id = entry.id || `aud-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    setAuditLogs((prev) => {
      const prevHash = prev[0]?.entryHash || GENESIS_HASH;
      const payload = `${entry.recordId}-${entry.action}-${entry.tableName}-${entry.user}-${entry.reasonForChange}`;
      const entryHash = computeAuditHash(prevHash, payload);

      const newEntry: AuditEntry = {
        ...entry,
        id,
        timestamp,
        prevHash,
        entryHash,
      };

      limsService.createAuditLog(newEntry);
      return [newEntry, ...prev];
    });
  };

  // Master Examination Catalog State with LocalStorage Persistence
  const [examinations, setExaminations] = useState<ExaminationItem[]>(() => loadStoredExaminations());

  useEffect(() => {
    saveStoredExaminations(examinations);
  }, [examinations]);

  // Load / seed examinations catalog from Supabase (Forms 1–10 + Send Out)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!limsService.isLive) return;

      const remote = await limsService.fetchExaminations();
      if (cancelled) return;

      if (remote === null) {
        addToast({
          type: 'warning',
          title: 'EXAMINATIONS NOT IN DATABASE',
          message: 'Table "examinations" not found or unreachable. Run supabase_examinations.sql in the Supabase SQL Editor, then refresh.',
          duration: 9000,
        });
        return;
      }

      if (remote.length > 0) {
        // Keep form assignments from DB; refresh official sheet prices (OPD/PhilHealth/etc.)
        const merged = applyOfficialTariffPrices(remote);
        saveStoredExaminations(merged);
        setExaminations(merged);
        await limsService.upsertExaminations(merged);
        if (!cancelled) {
          addToast({
            type: 'success',
            title: 'EXAMINATION TARIFF UPDATED',
            message: `Applied OPD/PhilHealth/Indigent/Employee/Projects + Corporate HIS tariffs (${merged.length} exams) and synced to Supabase.`,
            duration: 5500,
          });
        }
        return;
      }

      // Table empty → seed from current local catalog so DB matches the app
      const local = applyOfficialTariffPrices(loadStoredExaminations());
      saveStoredExaminations(local);
      setExaminations(local);
      const seed = await limsService.upsertExaminations(local);
      if (!cancelled && seed.success) {
        addToast({
          type: 'info',
          title: 'EXAMINATIONS SYNCED TO DATABASE',
          message: `Seeded ${local.length} examinations with official tariff into Supabase.`,
          duration: 5000,
        });
      } else if (!cancelled && seed.error) {
        addToast({
          type: 'warning',
          title: 'EXAMINATIONS TABLE MISSING?',
          message: `Could not sync catalog: ${seed.error}. Run supabase_examinations.sql in the SQL Editor.`,
          duration: 8000,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time catalog hydrate/seed
  }, []);

  // Master Examination Result Templates & Parameters State
  const [templates, setTemplates] = useState<Record<string, ExaminationTemplate>>(() => loadStoredTemplates());

  const handleUpdateTemplates = (newTemplates: Record<string, ExaminationTemplate>) => {
    if (!hasPermission(user, 'canModifyProtocols')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }
    setTemplates(newTemplates);
    saveStoredTemplates(newTemplates);
  };

  // Requisitions / Lab Test Requests State with LocalStorage Persistence
  const [requisitions, setRequisitions] = useState<LabTestRequisition[]>(() => loadStoredRequisitions());

  useEffect(() => {
    saveStoredRequisitions(requisitions);
  }, [requisitions]);

  // Load initial requisitions from Supabase if connected
  useEffect(() => {
    limsService.fetchRequisitions().then((data) => {
      if (data && data.length > 0) {
        setRequisitions(data);
      }
    });
  }, []);

  useEffect(() => {
    saveStoredTestResults({
      results: storedResults,
      medtech: storedMedTechInfo,
      updatedAt: resultUpdatedAt,
    });
  }, [storedResults, storedMedTechInfo, resultUpdatedAt]);

  // Load examination result forms. A newer browser copy is pushed up; the database wins when it is newer.
  useEffect(() => {
    const local = loadStoredTestResults();
    limsService.fetchTestResults().then((rows) => {
      if (!rows) return;

      const dbById = new Map(rows.map((row) => [row.requisitionId, row]));

      const applyRow = <T,>(prev: Record<string, T>, pick: (row: (typeof rows)[number]) => T) => {
        const next = { ...prev };
        rows.forEach((row) => {
          const localStamp = local.updatedAt[row.requisitionId] || '';
          if (localStamp && row.updatedAt && localStamp > row.updatedAt) return;
          next[row.requisitionId] = pick(row);
          const numberKey = requisitionNumberKey(row.requisitionNumber);
          if (numberKey) next[numberKey] = pick(row);
        });
        return next;
      };

      setStoredResults((prev) => applyRow(prev, (row) => row.results as Record<string, ExamResultGroup>));
      setStoredMedTechInfo((prev) => applyRow(prev, (row) => row.medtechInfo));
      setResultUpdatedAt((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          const localStamp = local.updatedAt[row.requisitionId] || '';
          if (!row.updatedAt) return;
          if (localStamp && localStamp > row.updatedAt) return;
          next[row.requisitionId] = row.updatedAt;
          const numberKey = requisitionNumberKey(row.requisitionNumber);
          if (numberKey) next[numberKey] = row.updatedAt;
        });
        return next;
      });

      Object.entries(local.results).forEach(([id, results]) => {
        if (!id || id.startsWith('rn:')) return;
        if (!results || Object.keys(results).length === 0) return;
        const db = dbById.get(id);
        const localStamp = local.updatedAt[id] || '';
        if (db && db.updatedAt && localStamp && localStamp <= db.updatedAt) return;
        void limsService.upsertTestResults({
          requisitionId: id,
          requisitionNumber: db?.requisitionNumber || null,
          results,
          medtechInfo: local.medtech[id] || {},
          status: db?.status || 'IN_TESTING',
        });
      });
    });
  }, []);

  // If user is not authenticated, render the dedicated LoginPage
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Handler: Add New Requisition
  const handleAddRequisition = async (newReq: LabTestRequisition) => {
    try {
      // 1. Add to local state immediately for instant responsive UI
      setRequisitions((prev) => [newReq, ...prev]);

      // 2. Append Audit Log with active user details
      handleAppendAuditLog({
        tableName: 'requisitions',
        recordId: newReq.id,
        action: 'INSERT',
        user: `${user.name} (${user.role})`,
        userRole: user.role,
        ipAddress: '10.0.14.88',
        reasonForChange: `Submitted electronic test requisition ${newReq.requisitionNumber} for ${newReq.patientOrSubjectName} (${newReq.kindOfExamination.length} examinations requested)`,
      });

      // 3. Sync to Supabase Database
      const res = await limsService.createRequisition(newReq);

      if (res.success) {
        addToast({
          type: 'success',
          title: 'SUCCESSFULLY SUBMITTED',
          message: `Laboratory Test Requisition ${newReq.requisitionNumber} for ${newReq.patientOrSubjectName} (${newReq.caseNo}) has been successfully saved.`,
          duration: 5000,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'SAVED LOCALLY (DATABASE SYNC WARNING)',
          message: `Requisition saved in system memory, but database sync returned: ${res.error || 'Check network connection'}.`,
          duration: 7000,
        });
      }

      // 4. Dispatch Live Notification & Audio Chime
      const examCount = (newReq.kindOfExamination || newReq.selectedTestNames || []).length;
      addNotification({
        type: 'NEW_REQUEST',
        title: 'NEW LAB REQUEST SUBMITTED',
        message: `Requisition ${newReq.requisitionNumber} created for ${newReq.patientOrSubjectName} (${newReq.caseNo || 'No Case#'}) with ${examCount} test${examCount > 1 ? 's' : ''} requested.`,
        priority: newReq.priority,
        reqId: newReq.id,
        caseNo: newReq.caseNo,
        patientName: newReq.patientOrSubjectName,
        targetTab: 'submissions',
      });

      // If patient is OPD, automatically generate and open the Order of Payment / Partial Receipt Modal
      if (newReq.patientCategory === 'OPD' && hasPermission(user, 'canAssignOrNumber')) {
        setOpdPaymentModalReq(newReq);
      }

      setCurrentTab('submissions');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'SUBMISSION ERROR',
        message: `Failed to process requisition: ${err?.message || 'Unexpected error occurred.'}`,
        duration: 7000,
      });
      throw err;
    }
  };

  // Handler: Update Patient Category directly
  const handleUpdateRequisitionCategory = async (reqId: string, category: PatientCategory) => {
    // 1. Update requisition in state
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, patientCategory: category } : r))
    );

    const foundReq = requisitions.find((r) => r.id === reqId);
    const patientName = foundReq ? foundReq.patientOrSubjectName : 'Patient';
    const caseRef = foundReq?.caseNo || foundReq?.externalRef;

    // 2. Update matching sample in state
    if (caseRef) {
      setSamples((prev) =>
        prev.map((s) => (s.externalId === caseRef ? { ...s, patientCategory: category } : s))
      );
    }

    // 3. Sync to Supabase
    limsService.updateRequisitionCategory(reqId, category);
    if (caseRef) {
      limsService.updateSampleCategory(caseRef, category);
    }

    // 4. Toast alert
    addToast({
      type: 'success',
      title: 'PATIENT CATEGORY ASSIGNED',
      message: `Assigned category [${category}] to ${patientName} (${caseRef || reqId}).`,
      duration: 4000,
    });
  };

  // Handler: Settle OPD Cashier Payment & Assign Official Receipt (OR#)
  const handleSettlePayment = (reqId: string, orNumber: string) => {
    if (!hasPermission(user, 'canAssignOrNumber')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canAssignOrNumber'),
        duration: 5000,
      });
      return;
    }
    // 1. Update requisitions state
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, orNumber } : r))
    );

    // 2. Update active modal if open
    if (opdPaymentModalReq && opdPaymentModalReq.id === reqId) {
      setOpdPaymentModalReq((prev) => (prev ? { ...prev, orNumber } : null));
    }

    const foundReq = requisitions.find((r) => r.id === reqId);
    const patientName = foundReq ? foundReq.patientOrSubjectName : 'Patient';

    // 3. Log Audit Trail
    handleAppendAuditLog({
      tableName: 'cashier_billing',
      recordId: reqId,
      action: 'UPDATE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      fieldName: 'orNumber',
      oldValue: 'PENDING',
      newValue: orNumber,
      reasonForChange: `Cashier payment recorded with Official Receipt ${orNumber} for ${patientName} (Settled in full)`,
    });

    // 4. Toast alert & Live Notification
    addToast({
      type: 'success',
      title: 'PAYMENT RECORDED',
      message: `Official Receipt ${orNumber} recorded for ${patientName}. Payment status marked as Settled.`,
      duration: 5000,
    });

    addNotification({
      type: 'PAYMENT_SETTLED',
      title: 'CASHIER PAYMENT RECORDED (OR#)',
      message: `Official Receipt ${orNumber} recorded for ${patientName}. Status updated to Settled.`,
      priority: 'ROUTINE',
      reqId: reqId,
      patientName: patientName,
      targetTab: 'submissions',
    });
  };

  // Handler: Save & Validate Test Results
  const handleSaveTestResults = (
    reqId: string, 
    resultsData: Record<string, ExamResultGroup>, 
    isFinalize: boolean,
    medTechInfo: {
      labTechName?: string;
      rmtName: string;
      rmtLicense: string;
      pathologistName: string;
      pathologistLicense?: string;
      remarks: string;
    },
    options?: { silent?: boolean }
  ) => {
    if (isFinalize) {
      if (!hasPermission(user, 'canReleaseCoA')) {
        if (!options?.silent) {
          addToast({
            type: 'error',
            title: 'PERMISSION DENIED',
            message: permissionDeniedMessage(user, 'canReleaseCoA'),
            duration: 6000,
          });
        }
        return;
      }
    } else if (!hasPermission(user, 'canEnterResults')) {
      if (!options?.silent) {
        addToast({
          type: 'error',
          title: 'PERMISSION DENIED',
          message: permissionDeniedMessage(user, 'canEnterResults'),
          duration: 6000,
        });
      }
      return;
    }

    const newStatus = isFinalize ? 'COMPLETED' : 'IN_TESTING';

    // Autosave writes the form values only. Status changes on Save Draft / Finalize.
    if (!options?.silent) {
      setRequisitions((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
      );
    }

    const foundReq = requisitions.find((r) => r.id === reqId);
    const numberKey = requisitionNumberKey(foundReq?.requisitionNumber);
    const savedAt = new Date().toISOString();

    // 2. Store every examination input (template parameters and form-only fields)
    setStoredResults((prev) => {
      const next = { ...prev, [reqId]: resultsData };
      if (numberKey) next[numberKey] = resultsData;
      return next;
    });
    setStoredMedTechInfo((prev) => {
      const next = { ...prev, [reqId]: medTechInfo };
      if (numberKey) next[numberKey] = medTechInfo;
      return next;
    });
    setResultUpdatedAt((prev) => {
      const next = { ...prev, [reqId]: savedAt };
      if (numberKey) next[numberKey] = savedAt;
      return next;
    });

    void limsService
      .upsertTestResults({
        requisitionId: reqId,
        requisitionNumber: foundReq?.requisitionNumber || null,
        results: resultsData,
        medtechInfo: medTechInfo,
        status: newStatus,
      })
      .then((res) => {
        if (res.success) return;
        if (res.missingTable) {
          if (!resultsTableWarned.current) {
            resultsTableWarned.current = true;
            addToast({
              type: 'warning',
              title: 'RESULTS TABLE NOT IN DATABASE',
              message:
                'Values are kept in this browser. Run the test_results section of supabase_setup.sql in the Supabase SQL Editor, then save again.',
              duration: 9000,
            });
          }
          return;
        }
        if (!options?.silent) {
          addToast({
            type: 'warning',
            title: 'SAVED IN BROWSER (DATABASE SYNC WARNING)',
            message: res.error || 'Could not write examination results to the database.',
            duration: 7000,
          });
        }
      });

    const patientName = foundReq ? foundReq.patientOrSubjectName : 'Patient';
    const caseRef = foundReq?.caseNo || foundReq?.externalRef;

    if (options?.silent) return;

    // 3. Update matching Sample status
    if (caseRef) {
      setSamples((prev) =>
        prev.map((s) => (s.externalId === caseRef ? { ...s, status: isFinalize ? 'APPROVED' : 'TESTING' } : s))
      );
    }

    // 4. Update TestOrders in queue
    if (foundReq) {
      setTestOrders((prev) =>
        prev.map((order) => {
          if (order.sampleBarcode === foundReq.requisitionNumber || order.patientOrSourceName.includes(foundReq.patientOrSubjectName)) {
            return {
              ...order,
              status: isFinalize ? 'APPROVED' : 'IN_PROGRESS',
              completedAt: isFinalize ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
              validatedBy: isFinalize ? `${medTechInfo.pathologistName}, ${medTechInfo.rmtName}` : undefined,
            };
          }
          return order;
        })
      );
    }

    // 5. Create 21 CFR Part 11 Audit Log
    handleAppendAuditLog({
      tableName: 'test_results',
      recordId: reqId,
      action: isFinalize ? 'SIGN_OFF' : 'UPDATE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      fieldName: isFinalize ? 'signatureStatus' : 'draftStatus',
      oldValue: isFinalize ? 'DRAFT_PENDING' : 'UNSAVED',
      newValue: isFinalize ? 'DIGITALLY_SIGNED_RELEASED' : 'IN_TESTING_SAVED',
      reasonForChange: isFinalize 
        ? `Validated official laboratory diagnostic results & released CoA for ${patientName} (${foundReq?.requisitionNumber}) with 21 CFR Part 11 Electronic Dual-Authentication`
        : `Saved in-testing parameter draft for ${patientName} (${foundReq?.requisitionNumber})`,
    });
    limsService.updateRequisitionStatus(reqId, newStatus);

    // 6. User Alert Notification & Audio Chime
    addToast({
      type: isFinalize ? 'success' : 'info',
      title: isFinalize ? 'RESULTS VALIDATED & COMPLETED' : 'RESULTS DRAFT SAVED',
      message: isFinalize 
        ? `Diagnostic test results for ${patientName} validated. Opening CoA — use Print Official Report.`
        : `Saved draft results for ${patientName}. Status marked as In Testing.`,
      duration: 5000,
    });

    if (isFinalize) {
      addNotification({
        type: 'RESULTS_READY',
        title: 'ANALYTICAL RESULTS COMPLETED (CoA RELEASE)',
        message: `Validated test results & released official Certificate of Analysis for ${patientName} (${caseRef || reqId}).`,
        priority: 'ROUTINE',
        reqId: reqId,
        caseNo: caseRef,
        patientName: patientName,
        targetTab: 'coa-reports',
      });

      // Open printable CoA immediately so finalize → print is one flow
      if (foundReq) {
        setDetailCoAModalReq({ ...foundReq, status: 'COMPLETED' });
      }
    }
  };

  // Handler: Persist form / send-out assignment to localStorage AND Supabase
  const handleAssignExaminationForm = async (
    examCode: string,
    assignedForm: AssignedFormType,
    sendOutPlatform?: string
  ) => {
    // Form routing is operational — allow catalog admins and result-entry staff
    if (!hasPermission(user, 'canModifyProtocols') && !hasPermission(user, 'canEnterResults')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }

    const current = examinations.find((e) => e.code === examCode);
    if (!current) {
      addToast({
        type: 'error',
        title: 'EXAM NOT FOUND',
        message: `Could not find examination ${examCode} in the catalog.`,
        duration: 5000,
      });
      return;
    }

    const previousForm = current.assignedForm || 'Unassigned';
    const platform =
      assignedForm === 'Send Out'
        ? (sendOutPlatform || current.sendOutPlatform || 'Hi-Precision Diagnostics')
        : undefined;

    const updatedItem: ExaminationItem = {
      ...current,
      assignedForm,
      sendOutPlatform: platform,
    };

    const next = examinations.map((item) =>
      item.code === examCode ? updatedItem : item
    );

    const ok = saveStoredExaminations(next);
    if (!ok) {
      addToast({
        type: 'error',
        title: 'SAVE FAILED',
        message: 'Could not write form assignment to browser storage. Check storage quota / private mode.',
        duration: 7000,
      });
      return;
    }

    setExaminations(next);

    handleAppendAuditLog({
      tableName: 'examination_catalog',
      recordId: examCode,
      action: 'UPDATE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      fieldName: 'assignedForm',
      oldValue: previousForm,
      newValue: assignedForm === 'Send Out' ? `Send Out → ${platform}` : assignedForm,
      reasonForChange: `Assigned result form for "${current.name}" (${examCode}) from ${previousForm} to ${assignedForm}`,
    });

    const formLabel =
      assignedForm === 'Send Out'
        ? `Send Out (${platform})`
        : assignedForm;

    // Require live Supabase write so form assignment is not "local only"
    if (!limsService.isLive) {
      addToast({
        type: 'warning',
        title: 'SAVED LOCALLY ONLY',
        message: `[${examCode}] ${current.name} → ${formLabel}. Supabase is not configured — check .env credentials.`,
        duration: 7000,
      });
      return;
    }

    const res = await limsService.upsertExamination(updatedItem);
    if (!res.success) {
      addToast({
        type: 'error',
        title: 'SUPABASE SAVE FAILED',
        message:
          res.error?.includes('Could not find the table') ||
          res.error?.includes('examinations') ||
          res.error?.includes('schema cache')
            ? `Form kept in browser, but DB write failed. Run supabase_examinations.sql in SQL Editor, then re-assign. (${res.error})`
            : `[${examCode}] saved in browser only. Database error: ${res.error}`,
        duration: 9000,
      });
      return;
    }

    addToast({
      type: 'success',
      title: 'SAVED TO SUPABASE',
      message: `[${examCode}] ${current.name} → ${formLabel}. assigned_form written to examinations table.`,
      duration: 4500,
    });
  };

  // Handler: Update Examination Details
  const handleUpdateExamination = (updated: ExaminationItem, originalCode: string) => {
    if (!hasPermission(user, 'canModifyProtocols')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }

    let next: ExaminationItem[];
    if (originalCode !== updated.code) {
      next = examinations
        .filter((item) => item.code !== originalCode)
        .concat(updated);
    } else {
      next = examinations.map((item) => (item.code === originalCode ? updated : item));
    }

    const ok = saveStoredExaminations(next);
    if (!ok) {
      addToast({
        type: 'error',
        title: 'SAVE FAILED',
        message: 'Could not write examination catalog to browser storage.',
        duration: 7000,
      });
      return;
    }
    setExaminations(next);

    (async () => {
      if (originalCode !== updated.code) {
        await limsService.deleteExamination(originalCode);
      }
      const res = await limsService.upsertExamination(updated);
      if (!res.success) {
        addToast({
          type: 'warning',
          title: 'SAVED LOCALLY (DB SYNC WARNING)',
          message: res.error || 'Could not sync examination to Supabase.',
          duration: 7000,
        });
      }
    })();

    handleAppendAuditLog({
      tableName: 'examination_catalog',
      recordId: updated.code,
      action: 'UPDATE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      fieldName: 'assignedForm',
      oldValue: examinations.find((e) => e.code === originalCode)?.assignedForm || '—',
      newValue: updated.assignedForm || '—',
      reasonForChange: `Updated examination "${updated.name}" (${updated.code}) — form ${updated.assignedForm || 'n/a'}, price ₱${updated.price.toFixed(2)}`,
    });

    addToast({
      type: 'success',
      title: 'EXAMINATION SAVED',
      message: `Saved [${updated.code}] ${updated.name} · ${updated.assignedForm || 'No form'} · ₱${updated.price.toFixed(2)}.`,
      duration: 4000,
    });
  };

  // Handler: Add New Examination
  const handleAddExamination = (newItem: ExaminationItem) => {
    if (!hasPermission(user, 'canModifyProtocols')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }

    const next = [...examinations, newItem];
    saveStoredExaminations(next);
    setExaminations(next);
    limsService.upsertExamination(newItem);

    handleAppendAuditLog({
      tableName: 'examination_catalog',
      recordId: newItem.code,
      action: 'INSERT',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      reasonForChange: `Created new examination offering "${newItem.name}" (${newItem.code}) at ₱${newItem.price.toFixed(2)}`,
    });

    addToast({
      type: 'success',
      title: 'NEW EXAMINATION ADDED',
      message: `Successfully added [${newItem.code}] ${newItem.name} (${newItem.category}) to the catalog.`,
      duration: 5000,
    });
  };

  // Handler: Delete Examination
  const handleDeleteExamination = (code: string) => {
    if (!hasPermission(user, 'canModifyProtocols')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }

    const found = examinations.find((e) => e.code === code);
    const name = found ? found.name : code;

    const next = examinations.filter((item) => item.code !== code);
    saveStoredExaminations(next);
    setExaminations(next);
    limsService.deleteExamination(code);

    handleAppendAuditLog({
      tableName: 'examination_catalog',
      recordId: code,
      action: 'DELETE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      reasonForChange: `Removed examination offering "${name}" (${code}) from active catalog`,
    });

    addToast({
      type: 'info',
      title: 'EXAMINATION REMOVED',
      message: `Removed [${code}] ${name} from active catalog.`,
      duration: 4000,
    });
  };

  // Handler: Reset Catalog to Default
  const handleResetCatalog = () => {
    if (!hasPermission(user, 'canModifyProtocols')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canModifyProtocols'),
        duration: 6000,
      });
      return;
    }

    [
      'lims_examination_catalog_v24',
      'lims_examination_catalog_v23',
      'lims_examination_catalog_v22',
      'lims_examination_catalog_v21',
      'lims_examination_catalog_v20',
      'lims_examination_catalog_v19',
      'lims_examination_catalog_v18',
      'lims_examination_catalog_v17',
      'lims_examination_catalog_v16',
      'lims_examination_catalog_v15',
      'lims_examination_catalog_v14',
      'lims_examination_catalog_v13',
      'lims_examination_catalog_v12',
      'lims_examination_catalog_v11',
      'lims_examination_catalog_v10',
    ].forEach((key) => localStorage.removeItem(key));
    const freshExaminations = applyOfficialTariffPrices(loadStoredExaminations());
    saveStoredExaminations(freshExaminations);
    setExaminations(freshExaminations);
    limsService.upsertExaminations(freshExaminations);

    handleAppendAuditLog({
      tableName: 'examination_catalog',
      recordId: 'RESET_ALL',
      action: 'OVERRIDE',
      user: `${user.name} (${user.role})`,
      userRole: user.role,
      ipAddress: '10.0.14.88',
      reasonForChange: `Reset examination catalog to official default baseline (${freshExaminations.length} examinations with 10 standard forms & send-out routing)`,
    });

    addToast({
      type: 'success',
      title: 'CATALOG RESTORED',
      message: `Restored all ${freshExaminations.length} default examinations, 10 in-house forms & send-out routings.`,
      duration: 4000,
    });
  };

  // Handler: Receive and Accession Requisition into Samples & Testing Queue
  const handleReceiveAndAccession = (
    req: LabTestRequisition,
    accessionData?: {
      patientCategory: PatientCategory;
      sampleType: Sample['sampleType'];
      matrix: string;
      tubeCount: number;
      priority: PriorityLevel;
      storageFacility: string;
      storageRoom: string;
      storageTemp: string;
      notes: string;
      orNumber?: string;
    }
  ) => {
    if (!hasPermission(user, 'canAccessionSamples')) {
      addToast({
        type: 'error',
        title: 'PERMISSION DENIED',
        message: permissionDeniedMessage(user, 'canAccessionSamples'),
        duration: 6000,
      });
      return;
    }

    const category: PatientCategory = accessionData?.patientCategory || req.patientCategory || 'OPD';
    const caseRef = req.caseNo || req.externalRef;
    const effectiveOr = accessionData?.orNumber || req.orNumber;

    // If requisition is ALREADY received, update category without duplicating sample
    if (req.status === 'RECEIVED') {
      setRequisitions((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, patientCategory: category } : r))
      );

      if (caseRef) {
        setSamples((prev) =>
          prev.map((s) => (s.externalId === caseRef ? { ...s, patientCategory: category } : s))
        );
        limsService.updateSampleCategory(caseRef, category);
      }

      limsService.updateRequisitionCategory(req.id, category);

      addToast({
        type: 'success',
        title: 'CATEGORY UPDATED',
        message: `Updated Patient Category to [${category}] for ${req.patientOrSubjectName}.`,
        duration: 4000,
      });
      return;
    }

    const sampleType = accessionData?.sampleType || (req.specimenTypes?.[0]?.includes('Blood') ? 'Whole Blood' : req.specimenTypes?.[0]?.includes('Serum') ? 'Serum' : 'Whole Blood');
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const barcode = `SMP-2026-${idNum}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newSample: Sample = {
      id: `smp-${Date.now()}`,
      barcode,
      externalId: req.caseNo || req.externalRef,
      sampleType: sampleType,
      matrix: accessionData?.matrix || req.specimenTypes?.[0] || 'K2-EDTA Anticoagulated Whole Blood',
      patientOrSourceName: `${req.patientOrSubjectName} (${category})`,
      patientCategory: category,
      collectionDate: now,
      receivedDate: now,
      holdTimeDeadline: req.tatDeadline,
      priority: accessionData?.priority || req.priority || 'ROUTINE',
      status: 'ACCESSIONED',
      storageLocation: {
        facility: accessionData?.storageFacility || 'Central Laboratory',
        room: accessionData?.storageRoom || 'Rm 102 - Cold Vault',
        unit: 'Main Freezer',
        rack: 'RK000001',
        box: 'BX000026',
        well: `A0${Math.floor(1 + Math.random() * 8)}`,
        temperature: accessionData?.storageTemp || '+4°C',
      },
      preservationStatus: 'Cold Chain Validated & Inspected',
      volumeMl: (accessionData?.tubeCount || req.tubeCount || 2) * 2.0,
      assignedTests: req.selectedTestIds || ['test-cbc'],
      aliquotCount: accessionData?.tubeCount || req.tubeCount || 2,
      chainOfCustody: [
        {
          id: `coc-${Date.now()}`,
          timestamp: now,
          fromUser: req.orderingPhysicianOrPI,
          toUser: user.name,
          action: `Physical Reception & Accessioning of TRF ${req.requisitionNumber} [Category: ${category}]`,
          reason: 'Accessioning Verification & Barcode Assignment',
          signatureHash: user.signatureHash || 'e982137498a87b1c345987123abcdef987123456789abcdef987123456789abc',
          temperatureAtTransfer: accessionData?.storageTemp || '+4.0°C',
        },
      ],
      notes: accessionData?.notes || req.clinicalNotes,
    };

    setSamples((prev) => [newSample, ...prev]);
    setSelectedSample(newSample);

    // Sync to Supabase
    limsService.createSample(newSample);
    limsService.updateRequisitionStatus(req.id, 'RECEIVED');
    limsService.updateRequisitionCategory(req.id, category);

    // Update Requisition Status to RECEIVED with Patient Category and OR#
    setRequisitions((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'RECEIVED', patientCategory: category, orNumber: effectiveOr || r.orNumber } : r))
    );

    // Create Test Orders
    (req.selectedTestIds || ['test-cbc']).forEach((testId) => {
      const def = testDefinitions.find((d) => d.id === testId);
      if (def) {
        const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const newOrder: TestOrder = {
          id: orderId,
          sampleId: newSample.id,
          sampleBarcode: newSample.barcode,
          patientOrSourceName: newSample.patientOrSourceName,
          testDefinitionId: def.id,
          testCode: def.code,
          testName: def.name,
          priority: newSample.priority,
          status: 'QUEUED',
          assignedAnalyst: user.name,
          instrumentId: def.defaultInstrumentId,
          results: {},
        };
        setTestOrders((prev) => [newOrder, ...prev]);
      }
    });

    addToast({
      type: 'success',
      title: 'SPECIMEN ACCESSIONED',
      message: `Requisition ${req.requisitionNumber} received as [${category}]. Barcode ${barcode} created and dispatched to queue.`,
      duration: 5000,
    });

    addNotification({
      type: 'ACCESSIONED',
      title: 'SPECIMEN ACCESSIONED & BARCODED',
      message: `Specimen for ${req.patientOrSubjectName} received as [${category}]. Barcode ${barcode} assigned to Cold Vault (${accessionData?.storageTemp || '+4°C'}).`,
      priority: accessionData?.priority || req.priority || 'ROUTINE',
      reqId: req.id,
      caseNo: req.caseNo || req.externalRef,
      patientName: req.patientOrSubjectName,
      targetTab: 'sample-detail',
    });

    setCurrentTab('sample-detail');
  };

  const handleAddSample = (newSample: Sample) => {
    setSamples((prev) => [newSample, ...prev]);
    setSelectedSample(newSample);
    setCurrentTab('sample-detail');
  };

  const handleDepleteReagent = (reagentId: string, volumeUsedMl: number) => {
    setReagents((prev) =>
      prev.map((r) =>
        r.id === reagentId
          ? {
              ...r,
              volumeRemainingMl: Math.max(0, r.volumeRemainingMl - volumeUsedMl),
            }
          : r
      )
    );
  };

  const handleToggleLockReagent = (reagentId: string) => {
    setReagents((prev) =>
      prev.map((r) =>
        r.id === reagentId ? { ...r, isLocked: !r.isLocked } : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-[#181b20] flex flex-col font-sans">
      {/* 1. Exact Top Navbar Header */}
      <TopNavbar
        currentTab={currentTab}
        tabs={tabsForRole(user.roleType)}
        showCreate={hasPermission(user, 'canCreateRequest')}
        showAdminTools={user.roleType === 'ADMIN'}
        onSelectTab={(tab) => {
          if (canOpenTab(user.roleType, tab)) setCurrentTab(tab);
        }}
        onOpenNewModal={() => {
          if (hasPermission(user, 'canCreateRequest')) setIsNewRequisitionModalOpen(true);
        }}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onDeleteNotification={handleDeleteNotification}
        onSelectNotification={(notif) => {
          if (notif.targetTab === 'submissions' && user.roleType === 'CASHIER') {
            setCurrentTab('payments');
          } else if (notif.targetTab && canOpenTab(user.roleType, notif.targetTab)) {
            setCurrentTab(notif.targetTab);
          }
          if (notif.caseNo) {
            const foundSample = samples.find(
              (s) => (s.externalId || '').toLowerCase() === (notif.caseNo || '').toLowerCase()
            );
            if (foundSample) {
              setSelectedSample(foundSample);
            }
          }
        }}
      />

      {/* 2. Main Page View Container */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Home Overview */}
        {currentTab === 'home' && (
          <HomeDashboardView
            samples={samples}
            testOrders={testOrders}
            instruments={INITIAL_INSTRUMENTS}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectSample={(sample) => {
              setSelectedSample(sample);
              setCurrentTab('sample-detail');
            }}
          />
        )}

        {/* Create Lab Test Request (Dedicated Tab) */}
        {currentTab === 'create-request' && (
          <CreateRequisitionView
            testDefinitions={testDefinitions}
            examinationCatalog={examinations}
            onSubmitRequisition={handleAddRequisition}
            priorRequisitions={requisitions}
            allowQueueLink={canOpenTab(user.roleType, 'submissions')}
            onCancel={() => {
              if (canOpenTab(user.roleType, 'submissions')) setCurrentTab('submissions');
            }}
          />
        )}

        {/* Submissions & Lab Test Requests (Requisition Portal) */}
        {(currentTab === 'submissions' || currentTab === 'payments') && (
          <SubmissionsView
            variant={currentTab === 'payments' ? 'payments' : 'queue'}
            requisitions={requisitions}
            onOpenNewRequisition={
              hasPermission(user, 'canCreateRequest') ? () => setCurrentTab('create-request') : undefined
            }
            onSelectRequisition={(req) => {
              // Find matching sample or synthesize sample from requisition
              const reqCase = (req.caseNo || '').trim().toLowerCase();
              const reqNum = (req.requisitionNumber || '').trim().toLowerCase();
              const reqPatient = (req.patientOrSubjectName || '').trim().toLowerCase();

              let sample = samples.find((s) => {
                const sExt = (s.externalId || '').trim().toLowerCase();
                const sPatient = (s.patientOrSourceName || '').trim().toLowerCase();
                return (reqCase && sExt === reqCase) || 
                       (reqNum && sExt === reqNum) || 
                       (reqPatient && sPatient && (sPatient.includes(reqPatient) || reqPatient.includes(sPatient)));
              });

              if (!sample) {
                const category = req.patientCategory || 'OPD';
                const idNum = Math.floor(1000 + Math.random() * 9000);
                const dobText = req.patientDob ? ` (DOB: ${req.patientDob})` : '';
                const specimenRaw = (req.specimenTypes?.[0] || '').toLowerCase();
                const matchedType: Sample['sampleType'] = specimenRaw.includes('serum') 
                  ? 'Serum' 
                  : specimenRaw.includes('urine') 
                  ? 'Urine' 
                  : specimenRaw.includes('plasma') 
                  ? 'Plasma' 
                  : specimenRaw.includes('water') 
                  ? 'Drinking Water' 
                  : 'Whole Blood';

                const cleanExams = req.kindOfExamination && req.kindOfExamination.length > 0
                  ? req.kindOfExamination
                  : req.selectedTestNames && req.selectedTestNames.length > 0
                  ? req.selectedTestNames
                  : ['CBC WITH PLATELET COUNT'];

                sample = {
                  id: `smp-${req.id || Date.now()}`,
                  barcode: `SMP-2026-${idNum}`,
                  externalId: req.caseNo || req.requisitionNumber || `CASE-${idNum}`,
                  sampleType: matchedType,
                  matrix: req.specimenTypes?.[0] || 'K2-EDTA Anticoagulated Whole Blood',
                  patientOrSourceName: `${req.patientOrSubjectName || 'Unknown'}${dobText}`,
                  patientCategory: category,
                  collectionDate: req.requestDate || new Date().toISOString().split('T')[0],
                  receivedDate: new Date().toISOString().split('T')[0],
                  holdTimeDeadline: req.tatDeadline,
                  priority: req.priority || 'ROUTINE',
                  status: req.status === 'COMPLETED' ? 'APPROVED' : req.status === 'IN_TESTING' ? 'TESTING' : 'ACCESSIONED',
                  storageLocation: {
                    facility: 'Central Laboratory',
                    room: 'Rm 102 - Cold Vault',
                    unit: 'Main Freezer',
                    rack: 'RK000001',
                    box: 'BX000026',
                    well: 'A01',
                    temperature: '+4°C',
                  },
                  preservationStatus: 'Cold Chain Validated & Inspected',
                  volumeMl: (req.tubeCount || 2) * 2.0,
                  assignedTests: cleanExams,
                  aliquotCount: req.tubeCount || 2,
                  chainOfCustody: [
                    {
                      id: `coc-${Date.now()}`,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      fromUser: req.orderingPhysicianOrPI || 'Ordering Physician',
                      toUser: user?.name || 'Medical Technologist',
                      action: `Electronic Requisition Intake & Accessioning [Category: ${category}]`,
                      reason: 'Intake Verification & Clinical Testing Assignment',
                      signatureHash: user?.signatureHash || 'e982137498a87b1c345987123abcdef987123456789abc',
                      temperatureAtTransfer: '+4.0°C',
                    },
                  ],
                  notes: req.clinicalNotes,
                };
              }
              setSelectedSample(sample);
              setCurrentTab('sample-detail');
            }}
            onReceiveAndAccession={handleReceiveAndAccession}
            onUpdatePatientCategory={handleUpdateRequisitionCategory}
            onViewRequisitionSlip={(req) => {
              addToast({
                type: 'info',
                title: 'REQUEST SLIP READY',
                message: `Electronic Test Requisition Form (TRF) opened for ${req.requisitionNumber}. Use Print from the slip dialog.`,
                duration: 3500,
              });
            }}
            onViewPaymentSlip={(req) => setOpdPaymentModalReq(req)}
            onSettlePayment={hasPermission(user, 'canAssignOrNumber') ? handleSettlePayment : undefined}
            onSaveResults={handleSaveTestResults}
            storedResults={storedResults}
            storedMedTechInfo={storedMedTechInfo}
            currentUserName={user.name}
            permissions={user.permissions}
          />
        )}

        {/* Examinations Master Catalog (Dedicated Tab) */}
        {currentTab === 'examinations' && (
          <ExaminationsView
            examinations={examinations}
            onUpdateExamination={handleUpdateExamination}
            onAssignForm={handleAssignExaminationForm}
            onAddExamination={handleAddExamination}
            onDeleteExamination={handleDeleteExamination}
            onResetToDefault={handleResetCatalog}
            onNavigateToTemplates={(code) => setCurrentTab('result-templates')}
          />
        )}

        {/* Printable Result Forms (paper-style lab reports) */}
        {currentTab === 'result-forms' && (
          <ResultFormsView currentUserName={user.name} />
        )}

        {/* Diagnostic Result Templates & Parameters Admin Editor (Dedicated Tab) */}
        {currentTab === 'result-templates' && (
          <ResultTemplatesView
            examinations={examinations}
            templates={templates}
            onUpdateTemplates={handleUpdateTemplates}
            onLogAudit={(action, reason) => {
              handleAppendAuditLog({
                tableName: 'examination_templates',
                recordId: 'TEMPLATES_SCHEMA',
                action: action.includes('RESET') ? 'OVERRIDE' : 'UPDATE',
                user: `${user.name} (${user.role})`,
                userRole: user.role,
                ipAddress: '10.0.14.88',
                reasonForChange: reason,
              });
            }}
            currentUserName={user.name}
          />
        )}

        {/* Samples List View (Screenshot 2: Today's Samples) */}
        {currentTab === 'samples' && (
          <SamplesListView
            samples={samples}
            onSelectSample={(sample) => {
              setSelectedSample(sample);
              setCurrentTab('sample-detail');
            }}
            onOpenNewModal={() => setIsNewSampleModalOpen(true)}
            onPrintLabels={() => {
              setCurrentTab('sample-detail');
              addToast({
                type: 'info',
                title: 'LABEL PRINT QUEUE',
                message: 'Opened specimen detail for barcode sticker printing.',
                duration: 3500,
              });
            }}
            onFreezeSamples={() => {
              addToast({
                type: 'success',
                title: 'SAMPLES FROZEN',
                message: 'Moved selected samples into -80°C Cryo-Freezer vault.',
                duration: 4000,
              });
            }}
            onThawSamples={() => {
              addToast({
                type: 'info',
                title: 'THAW CYCLE STARTED',
                message: 'Initiated controlled water-bath thaw cycle for testing.',
                duration: 4000,
              });
            }}
            onImportSamples={() => {
              addToast({
                type: 'info',
                title: 'IMPORT NOT AVAILABLE',
                message: 'CSV/Excel sample manifest import is not enabled in this build.',
                duration: 4000,
              });
            }}
          />
        )}

        {/* Sample Detail View (Accurate with Patient Diagnostic Request) */}
        {currentTab === 'sample-detail' && (() => {
          const currentSample = selectedSample || samples[0];
          const matchedReq = currentSample ? requisitions.find((r) => {
            const sExt = (currentSample.externalId || '').trim().toLowerCase();
            const sPatient = (currentSample.patientOrSourceName || '').trim().toLowerCase();
            const rCase = (r.caseNo || '').trim().toLowerCase();
            const rNum = (r.requisitionNumber || '').trim().toLowerCase();
            const rPatient = (r.patientOrSubjectName || '').trim().toLowerCase();
            return (rCase && sExt === rCase) || 
                   (rNum && sExt === rNum) || 
                   (rPatient && sPatient && (sPatient.includes(rPatient) || rPatient.includes(sPatient)));
          }) : null;

          return (
            <ErrorBoundary
              fallbackTitle="Error Loading Patient / Specimen Details"
              onReset={() => setCurrentTab('submissions')}
            >
              <SampleDetailView
                sample={currentSample}
                requisition={matchedReq}
                storedResults={
                  matchedReq
                    ? lookupStoredRecord(storedResults, matchedReq.id, matchedReq.requisitionNumber)
                    : undefined
                }
                storedMedTech={
                  matchedReq
                    ? lookupStoredRecord(storedMedTechInfo, matchedReq.id, matchedReq.requisitionNumber)
                    : undefined
                }
                onBack={() => setCurrentTab('submissions')}
                onDeleteSample={(id) => {
                  setSamples((prev) => prev.filter((s) => s.id !== id));
                  setCurrentTab('samples');
                }}
                onSelectProtocol={() => setCurrentTab('protocols')}
                onNavigateToBox={() => setCurrentTab('boxes')}
                onNavigateToSample={(id) => {
                  const found = samples.find((s) => s.id === id);
                  if (found) setSelectedSample(found);
                }}
                onPrintLabel={() => {
                  addToast({
                    type: 'success',
                    title: 'LABEL SENT TO PRINTER',
                    message: `Cryo-label for ${currentSample?.barcode || 'specimen'} queued to Zebra ZD620.`,
                    duration: 4000,
                  });
                }}
                onSaveResults={handleSaveTestResults}
                onOpenCoA={() => {
                  if (!matchedReq) return;
                  if (!hasPermission(user, 'canReleaseCoA') && !hasPermission(user, 'canEnterResults')) {
                    addToast({
                      type: 'error',
                      title: 'PERMISSION DENIED',
                      message: permissionDeniedMessage(user, 'canReleaseCoA'),
                      duration: 6000,
                    });
                    return;
                  }
                  setDetailCoAModalReq(matchedReq);
                }}
                currentUserName={user?.name}
              />
            </ErrorBoundary>
          );
        })()}

        {/* Batch Detail View (Screenshot 3: Batch BT000000 with Donut Chart) */}
        {(currentTab === 'batches' || currentTab === 'projects') && (
          <BatchDetailView
            batchId="BT000000"
            batchName="TWA Batch"
            onEditBatch={() => {
              addToast({
                type: 'info',
                title: 'BATCH EDITOR',
                message: 'Batch parameter editor is not available in this build yet.',
                duration: 4000,
              });
            }}
            onDeleteBatch={() => {
              addToast({
                type: 'warning',
                title: 'BATCH DELETE BLOCKED',
                message: 'Batch delete is disabled in the demo environment.',
                duration: 4000,
              });
            }}
            onCloneBatch={() => {
              addToast({
                type: 'success',
                title: 'BATCH CLONED',
                message: 'Batch BT000000 cloned to BT000001 (local demo).',
                duration: 4000,
              });
            }}
            onNavigateToSample={(id) => {
              const found = samples.find((s) => s.id === id);
              if (found) {
                setSelectedSample(found);
                setCurrentTab('sample-detail');
              }
            }}
          />
        )}

        {/* Plates 96-Well SBS View */}
        {(currentTab === 'plates' || currentTab === 'libraries') && (
          <PlatesView
            samples={samples}
            onExecuteBatch={() => setCurrentTab('batches')}
          />
        )}

        {/* Boxes Storage Grid View */}
        {currentTab === 'boxes' && (
          <BoxesView
            samples={samples}
            onSelectSample={(sample) => {
              setSelectedSample(sample);
              setCurrentTab('sample-detail');
            }}
          />
        )}

        {/* Protocols & Testing Engine */}
        {currentTab === 'protocols' && (
          <ProtocolsView
            testDefinitions={testDefinitions}
          />
        )}

        {/* QC Analytics & Levey-Jennings */}
        {currentTab === 'qc-analytics' && (
          <QCAnalyticsView
            qcRuns={qcRuns}
            onAddQCRun={(run) => setQcRuns((prev) => [...prev, run])}
          />
        )}

        {/* Inventory View */}
        {currentTab === 'inventory' && (
          <InventoryTableView
            reagents={reagents}
            onDepleteReagent={handleDepleteReagent}
            onToggleLockReagent={handleToggleLockReagent}
          />
        )}

        {/* Certificate of Analysis Deliverables */}
        {currentTab === 'coa-reports' && (
          <CoAReportsView
            testOrders={testOrders}
            samples={samples}
            testDefinitions={testDefinitions}
          />
        )}

        {/* Audit Trail View */}
        {currentTab === 'audit-trail' && (
          <AuditTrailTableView
            auditLogs={auditLogs}
            onAddAuditLog={handleAppendAuditLog}
            currentUser={{ name: user.name, role: user.role }}
          />
        )}

        {/* Instruments & Hardware IoT View */}
        {currentTab === 'instruments' && (
          <InstrumentsView
            instruments={INITIAL_INSTRUMENTS}
          />
        )}
      </main>

      {/* 1. New Requisition / Lab Test Request Modal */}
      <NewRequisitionModal
        isOpen={isNewRequisitionModalOpen}
        onClose={() => setIsNewRequisitionModalOpen(false)}
        testDefinitions={testDefinitions}
        examinationCatalog={examinations}
        onSubmitRequisition={handleAddRequisition}
      />

      {/* 2. OPD Order of Payment / Cashier Partial Receipt Modal */}
      <OrderOfPaymentModal
        isOpen={!!opdPaymentModalReq}
        onClose={() => setOpdPaymentModalReq(null)}
        requisition={opdPaymentModalReq}
        onSettlePayment={hasPermission(user, 'canAssignOrNumber') ? handleSettlePayment : undefined}
      />

      {/* 3. New Sample Intake Modal */}
      <NewSampleModal
        isOpen={isNewSampleModalOpen}
        onClose={() => setIsNewSampleModalOpen(false)}
        onAddSample={handleAddSample}
      />

      {/* 4. Diagnostic Result Entry Modal (from Sample Details) */}
      <ResultEntryModal
        isOpen={!!detailResultModalReq}
        onClose={() => setDetailResultModalReq(null)}
        requisition={detailResultModalReq}
        savedExamResults={
          detailResultModalReq
            ? lookupStoredRecord(storedResults, detailResultModalReq.id, detailResultModalReq.requisitionNumber)
            : undefined
        }
        savedRemarks={
          detailResultModalReq
            ? lookupStoredRecord(storedMedTechInfo, detailResultModalReq.id, detailResultModalReq.requisitionNumber)?.remarks
            : undefined
        }
        onSaveResults={(reqId, resultsData, isFinalize, medTechInfo, options) => {
          handleSaveTestResults(reqId, resultsData, isFinalize, medTechInfo, options);
          if (isFinalize && detailResultModalReq) {
            setDetailResultModalReq((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
          }
        }}
        onViewCoA={(req) => {
          setDetailResultModalReq(null);
          setDetailCoAModalReq(req);
        }}
        currentUserName={user.name}
      />

      {/* 5. Official Certificate of Analysis (CoA) Report Modal (from Sample Details) */}
      <CoAReportModal
        isOpen={!!detailCoAModalReq}
        onClose={() => setDetailCoAModalReq(null)}
        requisition={detailCoAModalReq}
        examResults={
          detailCoAModalReq
            ? lookupStoredRecord(storedResults, detailCoAModalReq.id, detailCoAModalReq.requisitionNumber)
            : undefined
        }
        medTechInfo={
          detailCoAModalReq
            ? lookupStoredRecord(storedMedTechInfo, detailCoAModalReq.id, detailCoAModalReq.requisitionNumber)
            : undefined
        }
      />

      {/* 6. Screen Lock / Workstation Security Modal */}
      <LockScreenModal />

      {/* 7. Global Toast Alert Notifications */}
      <ToastAlert toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainLimsContent />
    </AuthProvider>
  );
}

export default App;
