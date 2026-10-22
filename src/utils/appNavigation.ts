const STORAGE_KEY = 'labtis_app_nav';

export type PersistedAppNav = {
  userId: string;
  tab: string;
  sampleId?: string;
};

export function readAppNav(): PersistedAppNav | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAppNav;
    if (!parsed?.userId || !parsed?.tab) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAppNav(state: PersistedAppNav): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAppNav(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
