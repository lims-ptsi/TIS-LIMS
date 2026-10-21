import type { AuthUser } from '../types/auth';
import { AppRole, buildAccountUser, isAppRole, permissionsForRole } from './roleAccess';

const ACCOUNTS_KEY = 'aegis_lims_accounts_v1';

export interface StoredAccount {
  user: AuthUser;
  password: string;
}

const STARTER: { username: string; name: string; role: AppRole; password: string }[] = [
  { username: 'staff', name: 'Information Staff', role: 'STAFF', password: 'staff' },
  { username: 'cashier', name: 'Cashier', role: 'CASHIER', password: 'cashier' },
  { username: 'lab', name: 'Laboratory Staff', role: 'LAB_STAFF', password: 'lab' },
  { username: 'admin', name: 'Laboratory Admin', role: 'ADMIN', password: 'admin' },
];

function starterAccounts(): StoredAccount[] {
  return STARTER.map((item) => ({
    password: item.password,
    user: buildAccountUser({ name: item.name, username: item.username, role: item.role }),
  }));
}

export function loadAccounts(): StoredAccount[] {
  const seeded = starterAccounts();
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seeded;
    const byUsername = new Map<string, StoredAccount>();
    seeded.forEach((account) => byUsername.set(account.user.username, account));
    parsed.forEach((row) => {
      if (!row?.user?.username || !row.password) return;
      if (!isAppRole(row.user.roleType)) return;
      const user = {
        ...buildAccountUser({
          name: row.user.name || row.user.username,
          username: row.user.username,
          role: row.user.roleType,
        }),
        id: row.user.id || `usr-${row.user.username}`,
      };
      user.permissions = permissionsForRole(row.user.roleType);
      byUsername.set(user.username, { user, password: String(row.password) });
    });
    return Array.from(byUsername.values());
  } catch {
    return seeded;
  }
}

export function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
