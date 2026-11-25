import React, { useEffect, useState } from 'react';
import { AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppRole, isAppRole, roleLabel } from '../../data/roleAccess';
import { limsService } from '../../services/limsService';
import { APP_NAME, APP_TAGLINE } from '../brand/LabTisBrand';

export function getInviteTokenFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite')?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function isInviteAcceptUrl(): boolean {
  return Boolean(getInviteTokenFromUrl());
}

function clearInviteQueryParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    // ignore
  }
}

export const InviteAcceptView: React.FC = () => {
  const { acceptInviteAccount, isSupabaseAuthAvailable, isSsoLoading, ssoError } = useAuth();
  const token = getInviteTokenFromUrl() || '';

  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        if (active) {
          setInviteError('Missing invitation token.');
          setLoading(false);
        }
        return;
      }
      const row = await limsService.fetchAccountInvite(token);
      if (!active) return;
      if (!row) {
        setInviteError('This invite link is invalid or no longer exists.');
        setLoading(false);
        return;
      }
      if (row.used_at) {
        setInviteError('This invite link has already been used. Please sign in with Google.');
        setLoading(false);
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        setInviteError('This invite link has expired. Ask an administrator for a new invite.');
        setLoading(false);
        return;
      }

      setInviteEmail(row.email);
      setInviteName((row.name || '').trim());
      setInviteRole(isAppRole(row.role) ? row.role : 'STAFF');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleGoogleAccept = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await acceptInviteAccount({
        token,
        name: inviteName,
        username: '',
        email: inviteEmail,
        role: inviteRole,
        useGoogleSso: true,
      });
      if (!res.success) {
        setActionError(res.error || 'Could not start Google Sign-In.');
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = actionError || ssoError;

  return (
    <div className="min-h-screen w-full bg-[#f3f5f8] text-[#181b20] flex flex-col justify-between font-sans">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-[#d8dde6] rounded-xl shadow-md p-6 sm:p-8">
          <div className="text-center mb-6">
            <img src="/labtis.png" alt={APP_NAME} className="h-14 w-auto mx-auto object-contain" />
            <h1 className="text-xl font-bold text-slate-900 mt-4">Accept invitation</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with Google to activate your {APP_NAME} account
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Verifying invite link...</div>
          ) : inviteError ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{inviteError}</div>
              </div>
              <button
                type="button"
                onClick={clearInviteQueryParam}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0176d3] hover:bg-[#014486] text-white font-semibold text-xs cursor-pointer"
              >
                Go to Sign in
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-xs space-y-2">
                {inviteName ? (
                  <div className="font-semibold text-slate-900 text-sm">{inviteName}</div>
                ) : null}
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-[#0176d3] shrink-0" />
                  <span className="font-mono font-semibold break-all">{inviteEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0176d3] shrink-0" />
                  <span>
                    Assigned desk role: <strong className="text-slate-900">{roleLabel(inviteRole)}</strong>
                  </span>
                </div>
              </div>

              {displayedError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{displayedError}</div>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleAccept}
                disabled={submitting || isSsoLoading || !isSupabaseAuthAvailable}
                className="w-full py-3 px-4 rounded-lg bg-white hover:bg-slate-50 border border-[#d8dde6] text-slate-800 font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || isSsoLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                    </svg>
                    <span>Sign in with Google ({inviteEmail})</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Only the invited Google account (<span className="font-mono">{inviteEmail}</span>) can activate this invitation.
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-[#d8dde6] bg-white">
        {APP_NAME} · {APP_TAGLINE}
      </footer>
    </div>
  );
};
