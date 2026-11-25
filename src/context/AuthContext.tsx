import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AuthUser, LoginCredentials, LaboratoryFacility } from '../types/auth';
import { LAB_FACILITIES } from '../mock/authPersonas';
import {
  findAccountByEmail,
  loadAccounts,
  mergeRemoteAccounts,
  saveAccounts,
  StoredAccount,
} from '../data/accountStore';
import { AppRole, buildAccountUser, isAppRole, permissionsForRole } from '../data/roleAccess';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { limsService } from '../services/limsService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isScreenLocked: boolean;
  facility: LaboratoryFacility;
  setFacility: (facility: LaboratoryFacility) => void;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (options?: { loginHint?: string }) => Promise<{ success: boolean; error?: string }>;
  isSsoLoading: boolean;
  isSupabaseAuthAvailable: boolean;
  ssoError: string | null;
  clearSsoError: () => void;
  register: (input: {
    name: string;
    username: string;
    password: string;
    role: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  acceptInviteAccount: (input: {
    token: string;
    name: string;
    username: string;
    email: string;
    password?: string;
    role: AppRole;
    useGoogleSso?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAs: (persona: AuthUser) => void;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pinOrPassword: string) => boolean;
  facilities: LaboratoryFacility[];
  personas: AuthUser[];
  /** All stored sign-in accounts (admin tooling). */
  directoryAccounts: StoredAccount[];
  adminCreateAccount: (input: {
    name: string;
    username: string;
    email?: string;
    password?: string;
    role: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  adminUpdateAccount: (input: {
    username: string;
    name?: string;
    newUsername?: string;
    email?: string;
    password?: string;
    role?: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  adminDeleteAccount: (username: string) => Promise<{ success: boolean; error?: string }>;
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
const STORAGE_KEY_PENDING_INVITE = 'aegis_lims_pending_invite_v1';

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
  const accountsRef = useRef<StoredAccount[]>(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const [facility, setFacility] = useState<LaboratoryFacility>(LAB_FACILITIES[0]);
  const [user, setUser] = useState<AuthUser | null>(() => readSession());
  const [isSsoLoading, setIsSsoLoading] = useState<boolean>(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const clearSsoError = useCallback(() => setSsoError(null), []);

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

  const syncRemoteAccounts = useCallback(async (): Promise<StoredAccount[]> => {
    if (!limsService.isLive) return accountsRef.current;
    const remote = await limsService.fetchAccounts();
    if (!remote) return accountsRef.current;
    const merged = mergeRemoteAccounts(accountsRef.current, remote);
    accountsRef.current = merged;
    setAccounts(merged);
    saveAccounts(merged);
    return merged;
  }, []);

  const resolveGoogleSession = useCallback(
    async (email?: string | null, fullNameFromGoogle?: string | null) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        await supabase?.auth.signOut();
        setSsoError('Google did not return an email address for this account.');
        setIsSsoLoading(false);
        return;
      }

      setIsSsoLoading(true);
      try {
        // Check if returning from an email invite link
        let pendingRaw: string | null = null;
        try {
          pendingRaw = localStorage.getItem(STORAGE_KEY_PENDING_INVITE);
        } catch {
          pendingRaw = null;
        }

        if (pendingRaw) {
          let pending: { token: string; email: string; name?: string; role: AppRole } | null = null;
          try {
            pending = JSON.parse(pendingRaw);
          } catch {
            pending = null;
          }
          localStorage.removeItem(STORAGE_KEY_PENDING_INVITE);

          if (pending && pending.email.trim().toLowerCase() !== cleanEmail) {
            await supabase?.auth.signOut();
            setUser(null);
            setSsoError(
              `This invite link is only for ${pending.email}. You signed in with ${cleanEmail}.`
            );
            return;
          }

          if (pending) {
            const invite = await limsService.fetchAccountInvite(pending.token);
            if (!invite || invite.used_at || new Date(invite.expires_at).getTime() < Date.now()) {
              await supabase?.auth.signOut();
              setUser(null);
              setSsoError('This invite link is invalid, expired, or has already been used.');
              return;
            }

            const existing = findAccountByEmail(accountsRef.current, cleanEmail);
            if (!existing) {
              const displayName =
                pending.name?.trim() ||
                fullNameFromGoogle?.trim() ||
                cleanEmail.split('@')[0] ||
                'Lab User';
              const baseUsername =
                cleanEmail
                  .split('@')[0]
                  ?.replace(/[^a-z0-9._-]/gi, '')
                  .toLowerCase() || 'user';
              let candidate = baseUsername.length >= 3 ? baseUsername : `usr.${baseUsername}`;
              let suffix = 1;
              while (accountsRef.current.some((a) => a.user.username === candidate)) {
                candidate = `${baseUsername}${suffix++}`;
              }

              const role = isAppRole(invite.role) ? invite.role : pending.role;
              const newAccount: StoredAccount = {
                password: '',
                user: buildAccountUser({
                  name: displayName,
                  username: candidate,
                  role,
                  email: cleanEmail,
                }),
              };
              const nextAccounts = [...accountsRef.current, newAccount];
              accountsRef.current = nextAccounts;
              setAccounts(nextAccounts);
              saveAccounts(nextAccounts);
              await limsService.upsertAccount({
                username: candidate,
                name: displayName,
                email: cleanEmail,
                role,
                password: '',
                ssoProvider: 'google',
              });
            }

            await limsService.markAccountInviteUsed(pending.token);
          }
        }

        let pool = accountsRef.current;
        let matched = findAccountByEmail(pool, cleanEmail);
        if (!matched && limsService.isLive) {
          pool = await syncRemoteAccounts();
          matched = findAccountByEmail(pool, cleanEmail);
        }

        if (!matched) {
          await supabase?.auth.signOut();
          setUser(null);
          setSsoError(
            `Your Google account (${cleanEmail}) is not linked to any LIMS account. Ask an administrator to send you an email invite.`
          );
          return;
        }

        const nextUser: AuthUser = {
          ...matched.user,
          permissions: permissionsForRole(matched.user.roleType as AppRole),
        };
        setUser(nextUser);
        setIsScreenLocked(false);
        setSsoError(null);
      } finally {
        setIsSsoLoading(false);
      }
    },
    [syncRemoteAccounts]
  );

  useEffect(() => {
    let active = true;
    void syncRemoteAccounts();

    if (!supabase || !isSupabaseConfigured) {
      return () => {
        active = false;
      };
    }

    const client = supabase;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user?.email) {
        const metaName = (data.session.user.user_metadata?.full_name ||
          data.session.user.user_metadata?.name) as string | undefined;
        void resolveGoogleSession(data.session.user.email, metaName);
      }
    });

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const metaName = (session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name) as string | undefined;
        void resolveGoogleSession(session.user.email, metaName);
      } else if (event === 'SIGNED_OUT') {
        setIsSsoLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [resolveGoogleSession, syncRemoteAccounts]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 280));

    const query = credentials.usernameOrEmail.trim().toLowerCase();
    const account = accounts.find(
      (item) => item.user.username.toLowerCase() === query || item.user.email.toLowerCase() === query
    );

    if (!account) {
      return { success: false, error: 'No account uses that username. Create one, or use staff, cashier, lab, or admin.' };
    }

    if (!account.password) {
      return { success: false, error: 'This account uses Google Sign-In. Click "Sign in with Google" below.' };
    }

    if (credentials.password !== account.password) {
      return { success: false, error: 'That password does not match this account.' };
    }

    const nextUser = { ...account.user, permissions: permissionsForRole(account.user.roleType as AppRole) };
    setUser(nextUser);
    setIsScreenLocked(false);
    setSsoError(null);
    return { success: true };
  };

  const loginWithGoogle = async (options?: {
    loginHint?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use Google SSO.',
      };
    }
    setSsoError(null);
    setIsSsoLoading(true);
    try {
      const queryParams: Record<string, string> = {
        prompt: 'select_account',
      };
      if (options?.loginHint?.trim()) {
        queryParams.login_hint = options.loginHint.trim().toLowerCase();
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams,
        },
      });
      if (error) {
        setIsSsoLoading(false);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      setIsSsoLoading(false);
      return { success: false, error: err?.message || 'Could not start Google Sign-In.' };
    }
  };

  const assertAdmin = (): string | null => {
    if (!user || user.roleType !== 'ADMIN') return 'Only an administrator can manage accounts.';
    return null;
  };

  const createAccountRecord = async (
    input: {
      name: string;
      username: string;
      email?: string;
      password?: string;
      role: AppRole;
    },
    options: { signInAfter?: boolean; allowEmptyPasswordWithEmail?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    const name = input.name.trim();
    const username = input.username.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase() || '';
    const password = input.password || '';
    if (name.length < 2) return { success: false, error: 'Enter the person\'s full name.' };
    if (!/^[a-z0-9._-]{3,}$/.test(username)) {
      return { success: false, error: 'Username needs at least 3 letters or numbers, with no spaces.' };
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Enter a valid Google email address.' };
    }
    if (email && accounts.some((item) => item.user.email?.trim().toLowerCase() === email)) {
      return { success: false, error: 'That Google email is already linked to another account.' };
    }
    if (!options.allowEmptyPasswordWithEmail && password.length < 4) {
      return { success: false, error: 'Password needs at least 4 characters.' };
    }
    if (options.allowEmptyPasswordWithEmail && !email && password.length < 4) {
      return { success: false, error: 'Provide either a Google email or a password (at least 4 characters).' };
    }
    if (password && password.length < 4) {
      return { success: false, error: 'Password needs at least 4 characters.' };
    }
    if (accounts.some((item) => item.user.username === username)) {
      return { success: false, error: 'That username is already in use.' };
    }

    const account: StoredAccount = {
      password,
      user: buildAccountUser({ name, username, role: input.role, email: email || undefined }),
    };
    const next = [...accounts, account];
    setAccounts(next);
    saveAccounts(next);
    void limsService.upsertAccount({
      username,
      name,
      email: email || undefined,
      role: input.role,
      password,
    });
    if (options.signInAfter) {
      setUser(account.user);
      setIsScreenLocked(false);
    }
    return { success: true };
  };

  const adminCreateAccount = async (input: {
    name: string;
    username: string;
    email?: string;
    password?: string;
    role: AppRole;
  }): Promise<{ success: boolean; error?: string }> => {
    const denied = assertAdmin();
    if (denied) return { success: false, error: denied };
    return createAccountRecord(input, { signInAfter: false, allowEmptyPasswordWithEmail: true });
  };

  const adminUpdateAccount = async (input: {
    username: string;
    name?: string;
    newUsername?: string;
    email?: string;
    password?: string;
    role?: AppRole;
  }): Promise<{ success: boolean; error?: string }> => {
    const denied = assertAdmin();
    if (denied) return { success: false, error: denied };

    const original = input.username.trim().toLowerCase();
    const idx = accounts.findIndex((item) => item.user.username === original);
    if (idx < 0) return { success: false, error: 'Account not found.' };

    const nextName = (input.name ?? accounts[idx].user.name).trim();
    if (nextName.length < 2) return { success: false, error: 'Enter the person\'s full name.' };

    const nextUsername = (input.newUsername ?? original).trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,}$/.test(nextUsername)) {
      return { success: false, error: 'Username needs at least 3 letters or numbers, with no spaces.' };
    }
    if (nextUsername !== original && accounts.some((item) => item.user.username === nextUsername)) {
      return { success: false, error: 'That username is already in use.' };
    }

    const nextEmail = input.email !== undefined ? input.email.trim().toLowerCase() : accounts[idx].user.email;
    if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return { success: false, error: 'Enter a valid Google email address.' };
    }
    if (
      nextEmail &&
      accounts.some(
        (item, index) => index !== idx && item.user.email?.trim().toLowerCase() === nextEmail
      )
    ) {
      return { success: false, error: 'That Google email is already linked to another account.' };
    }

    const nextRole = (input.role ?? accounts[idx].user.roleType) as AppRole;
    if (!isAppRole(nextRole)) return { success: false, error: 'Choose a valid desk role.' };

    const password =
      input.password && input.password.trim().length > 0
        ? input.password
        : accounts[idx].password;
    if (password && password.length < 4) return { success: false, error: 'Password needs at least 4 characters.' };
    if (!nextEmail && (!password || password.length < 4)) {
      return { success: false, error: 'Provide either a Google email or a password (at least 4 characters).' };
    }

    const prior = accounts[idx];
    const updatedUser = {
      ...buildAccountUser({
        name: nextName,
        username: nextUsername,
        role: nextRole,
        email: nextEmail || undefined,
      }),
      id: prior.user.id,
    };
    updatedUser.permissions = permissionsForRole(nextRole);

    const next = [...accounts];
    next[idx] = { user: updatedUser, password };
    setAccounts(next);
    saveAccounts(next);
    if (nextUsername !== original) {
      void limsService.deleteAccount(original);
    }
    void limsService.upsertAccount({
      username: nextUsername,
      name: nextName,
      email: nextEmail || undefined,
      role: nextRole,
      password,
    });

    if (user?.username === original) {
      setUser(updatedUser);
    }
    return { success: true };
  };

  const adminDeleteAccount = async (username: string): Promise<{ success: boolean; error?: string }> => {
    const denied = assertAdmin();
    if (denied) return { success: false, error: denied };

    const key = username.trim().toLowerCase();
    if (!key) return { success: false, error: 'Account not found.' };
    if (user?.username === key) {
      return { success: false, error: 'You cannot delete the account you are signed in with.' };
    }
    const next = accounts.filter((item) => item.user.username !== key);
    if (next.length === accounts.length) return { success: false, error: 'Account not found.' };
    if (next.length === 0) return { success: false, error: 'At least one account must remain.' };

    setAccounts(next);
    saveAccounts(next);
    void limsService.deleteAccount(key);
    return { success: true };
  };

  const register = async (input: {
    name: string;
    username: string;
    password: string;
    role: AppRole;
  }): Promise<{ success: boolean; error?: string }> => {
    const created = await createAccountRecord(input, { signInAfter: true });
    if (!created.success && created.error === 'That username is already in use.') {
      return { success: false, error: 'That username is already in use. Sign in instead.' };
    }
    return created;
  };

  const acceptInviteAccount = async (input: {
    token: string;
    name: string;
    username: string;
    email: string;
    password?: string;
    role: AppRole;
    useGoogleSso?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const invite = await limsService.fetchAccountInvite(input.token);
    if (!invite) {
      return { success: false, error: 'This invite link is invalid or could not be found.' };
    }
    if (invite.used_at) {
      return { success: false, error: 'This invite link has already been used.' };
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'This invite link has expired. Ask an administrator for a new invite.' };
    }

    const role = isAppRole(invite.role) ? invite.role : input.role;
    localStorage.setItem(
      STORAGE_KEY_PENDING_INVITE,
      JSON.stringify({
        token: input.token,
        email: invite.email.trim().toLowerCase(),
        name: input.name?.trim() || invite.name || undefined,
        role,
      })
    );

    return loginWithGoogle({ loginHint: invite.email });
  };

  const loginAs = (persona: AuthUser) => {
    setUser(persona);
    setIsScreenLocked(false);
  };

  const logout = () => {
    setUser(null);
    setIsScreenLocked(false);
    localStorage.removeItem(STORAGE_KEY_USER);
    void supabase?.auth.signOut();
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
      accounts.some(
        (item) => item.user.id === user.id && item.password.length > 0 && item.password === cleanInput
      )
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
        loginWithGoogle,
        isSsoLoading,
        isSupabaseAuthAvailable: isSupabaseConfigured && !!supabase,
        ssoError,
        clearSsoError,
        register,
        acceptInviteAccount,
        loginAs,
        logout,
        lockScreen,
        unlockScreen,
        facilities,
        personas: accounts.map((item) => item.user),
        directoryAccounts: accounts,
        adminCreateAccount,
        adminUpdateAccount,
        adminDeleteAccount,
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
