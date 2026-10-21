import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { Sample, TestOrder } from '../types/lims';

const REQUISITIONS_STORAGE_KEY = 'lims_requisitions_v2';
const SAMPLES_STORAGE_KEY = 'lims_samples_v2';
const TEST_ORDERS_STORAGE_KEY = 'lims_test_orders_v2';
const TEST_RESULTS_STORAGE_KEY = 'lims_test_results_v1';

export interface PersistedTestResults {
  results: Record<string, any>;
  medtech: Record<string, any>;
  updatedAt: Record<string, string>;
}

/** Stable map key so a result row survives a requisition id change after a database reload. */
export function requisitionNumberKey(requisitionNumber?: string | null): string {
  const num = (requisitionNumber || '').trim();
  return num ? `rn:${num}` : '';
}

export function lookupStoredRecord<T>(
  map: Record<string, T> | undefined,
  id?: string | null,
  requisitionNumber?: string | null
): T | undefined {
  if (!map) return undefined;
  if (id && map[id] != null) return map[id];
  const numberKey = requisitionNumberKey(requisitionNumber);
  if (numberKey && map[numberKey] != null) return map[numberKey];
  return undefined;
}

// Known legacy sample IDs to purge
const LEGACY_REQ_IDS = new Set(['req-101', 'req-102', 'req-103', 'req-104', 'req-105']);
const LEGACY_SAMPLE_IDS = new Set(['smp-001', 'smp-002', 'smp-003', 'smp-004']);
const LEGACY_ORDER_IDS = new Set(['ord-001', 'ord-002', 'ord-003', 'ord-004']);

/**
 * Load requisitions from persistent storage, filtering out legacy sample mock entries.
 */
export function loadStoredRequisitions(): LabTestRequisition[] {
  try {
    const raw = localStorage.getItem(REQUISITIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r && !LEGACY_REQ_IDS.has(r.id));
      }
    }
  } catch (e) {
    console.warn('Failed to load requisitions from localStorage:', e);
  }
  return [];
}

/**
 * Save requisitions to persistent storage.
 */
export function saveStoredRequisitions(reqs: LabTestRequisition[]): void {
  try {
    localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.warn('Failed to save requisitions to localStorage:', e);
  }
}

/**
 * Load samples from persistent storage.
 */
export function loadStoredSamples(): Sample[] {
  try {
    const raw = localStorage.getItem(SAMPLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => s && !LEGACY_SAMPLE_IDS.has(s.id));
      }
    }
  } catch (e) {
    console.warn('Failed to load samples from localStorage:', e);
  }
  return [];
}

/**
 * Save samples to persistent storage.
 */
export function saveStoredSamples(samples: Sample[]): void {
  try {
    localStorage.setItem(SAMPLES_STORAGE_KEY, JSON.stringify(samples));
  } catch (e) {
    console.warn('Failed to save samples to localStorage:', e);
  }
}

/**
 * Load test orders from persistent storage.
 */
export function loadStoredTestOrders(): TestOrder[] {
  try {
    const raw = localStorage.getItem(TEST_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((o) => o && !LEGACY_ORDER_IDS.has(o.id));
      }
    }
  } catch (e) {
    console.warn('Failed to load test orders from localStorage:', e);
  }
  return [];
}

/**
 * Save test orders to persistent storage.
 */
export function saveStoredTestOrders(orders: TestOrder[]): void {
  try {
    localStorage.setItem(TEST_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save test orders to localStorage:', e);
  }
}

const EMPTY_TEST_RESULTS: PersistedTestResults = {
  results: {},
  medtech: {},
  updatedAt: {},
};

export function loadStoredTestResults(): PersistedTestResults {
  try {
    const raw = localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_TEST_RESULTS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_TEST_RESULTS };
    return {
      results: parsed.results && typeof parsed.results === 'object' ? parsed.results : {},
      medtech: parsed.medtech && typeof parsed.medtech === 'object' ? parsed.medtech : {},
      updatedAt: parsed.updatedAt && typeof parsed.updatedAt === 'object' ? parsed.updatedAt : {},
    };
  } catch (e) {
    console.warn('Failed to load test results from localStorage:', e);
    return { ...EMPTY_TEST_RESULTS };
  }
}

export function saveStoredTestResults(data: PersistedTestResults): void {
  try {
    localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save test results to localStorage:', e);
  }
}
