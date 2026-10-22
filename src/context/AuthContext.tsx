import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, LaboratoryFacility } from '../types/auth';
import { LAB_FACILITIES } from '../mock/authPersonas';
import { loadAccounts, saveAccounts, StoredAccount } from '../data/accountStore';
import { AppRole, buildAccountUser, isAppRole, permissionsForRole } from '../data/roleAccess';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isScreenLocked: boolean;
  facility: LaboratoryFacility;
  setFacility: (facility: LaboratoryFacility) => void;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (input: {
    name: string;
    username: string;
    password: string;
    role: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAs: (persona: AuthUser) => void;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pinOrPassword: string) => boolean;
  facilities: LaboratoryFacility[];
  personas: AuthUser[];
  terminalInfo: {
    terminalId: string;
    ipAddress: string;
    systemVersion: string;
    complianceStandard: string;
    lastSecurityCheck: string;
  };
}

const STORAGE_KEY_USER = 'aegis_lims_active_user';
const STORAGE_KEY_LOCKED = 'aegis_lims_screen_locked';
const STORAGE_KEY_FACILITY = 'aegis_lims_facility';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readSession(): AuthUser | null {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser) as AuthUser;
    if (!isAppRole(parsed?.roleType)) return null;
    return { ...parsed, permissions: permissionsForRole(parsed.roleType) };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facilities] = useState<LaboratoryFacility[]>(LAB_FACILITIES);
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => loadAccounts());
  const [facility, setFacility] = useState<LaboratoryFacility>(LAB_FACILITIES[0]);

  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LOCKED) === 'true';
    } catch {
      return false;
    }
  });

  const terminalInfo = {
    terminalId: 'WS-LAB-CHEM-04',
    ipAddress: '10.0.14.88 (Subnet LAB-VLAN-2)',
    systemVersion: 'LAB-TIS',
    complianceStandard: 'FDA 21 CFR Part 11 / ISO 15189 / CLIA',
    lastSecurityCheck: '2026-10-07 08:00:00 (PASSED)',
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOCKED, isScreenLocked ? 'true' : 'false');
  }, [isScreenLocked]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 280));

    const query = credentials.usernameOrEmail.trim().toLowerCase();
    const account = accounts.find(
      (item) => item.user.username.toLowerCase() === query || item.user.email.toLowerCase() === query
    );

    if (!account) {
      return { success: false, error: 'No account uses that username. Create one, or use staff, cashier, lab, or admin.' };
    }

    if (credentials.password !== account.password) {
      return { success: false, error: 'That password does not match this account.' };
    }

    const nextUser = { ...account.user, permissions: permissionsForRole(account.user.roleType as AppRole) };
    setUser(nextUser);
    setIsScreenLocked(false);
    return { success: true };
  };

  const register = async (input: {
    name: string;
    username: string;
    password: string;
    role: AppRole;
  }): Promise<{ success: boolean; error?: string }> => {
    const name = input.name.trim();
    const username = input.username.trim().toLowerCase();
    const password = input.password;
    if (name.length < 2) return { success: false, error: 'Enter the person\'s full name.' };
    if (!/^[a-z0-9._-]{3,}$/.test(username)) {
      return { success: false, error: 'Username needs at least 3 letters or numbers, with no spaces.' };
    }
    if (password.length < 4) return { success: false, error: 'Password needs at least 4 characters.' };
    if (accounts.some((item) => item.user.username === username)) {
      return { success: false, error: 'That username is already in use. Sign in instead.' };
    }

    const account: StoredAccount = {
      password,
      user: buildAccountUser({ name, username, role: input.role }),
    };
    const next = [...accounts, account];
    setAccounts(next);
    saveAccounts(next);
    setUser(account.user);
    setIsScreenLocked(false);
    return { success: true };
  };

  const loginAs = (persona: AuthUser) => {
    setUser(persona);
    setIsScreenLocked(false);
  };

  const logout = () => {
    setUser(null);
    setIsScreenLocked(false);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const lockScreen = () => {
    setIsScreenLocked(true);
  };

  const unlockScreen = (pinOrPassword: string): boolean => {
    if (!user) return false;
    const cleanInput = pinOrPassword.trim();
    if (
      cleanInput === user.electronicSignaturePin ||
      cleanInput === user.username ||
      accounts.some((item) => item.user.id === user.id && item.password === cleanInput)
    ) {
      setIsScreenLocked(false);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isScreenLocked,
        facility,
        setFacility,
        login,
        register,
        loginAs,
        logout,
        lockScreen,
        unlockScreen,
        facilities,
        personas: accounts.map((item) => item.user),
        terminalInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
