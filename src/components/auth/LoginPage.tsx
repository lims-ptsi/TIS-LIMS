import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_ROLES, AppRole } from '../../data/roleAccess';
import { APP_NAME, APP_TAGLINE } from '../brand/LabTisBrand';

const STARTERS: { username: string; password: string; label: string }[] = [
  { username: 'staff', password: 'staff', label: 'Staff' },
  { username: 'cashier', password: 'cashier', label: 'Cashier' },
  { username: 'lab', password: 'lab', label: 'Lab' },
  { username: 'admin', password: 'admin', label: 'Admin' },
];

export const LoginPage: React.FC = () => {
  const {
    login,
    loginWithGoogle,
    isSsoLoading,
    isSupabaseAuthAvailable,
    ssoError,
    clearSsoError,
    register,
    terminalInfo,
  } = useAuth();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AppRole>('STAFF');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedRole = APP_ROLES.find((item) => item.id === role);

  const switchMode = (next: 'signin' | 'create') => {
    setMode(next);
    setErrorMessage(null);
    clearSsoError();
    setIsSuccess(false);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    clearSsoError();
    const res = await loginWithGoogle();
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const displayedError = errorMessage || ssoError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        if (password !== confirmPassword) {
          setErrorMessage('The two passwords do not match.');
          return;
        }
        const result = await register({ name: fullName, username, password, role });
        if (!result.success) {
          setErrorMessage(result.error || 'Could not create the account.');
          return;
        }
        setIsSuccess(true);
        return;
      }

      const result = await login({
        usernameOrEmail: username,
        password,
        facility: 'PTSI Central Laboratory',
        workstation: terminalInfo?.terminalId || 'WS-LAB-01',
        rememberWorkstation: true,
      });
      if (result.success) setIsSuccess(true);
      else setErrorMessage(result.error || 'Invalid username or password.');
    } catch {
      setErrorMessage('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f3f5f8] text-[#181b20] flex flex-col justify-between font-sans selection:bg-[#0176d3] selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-[#d8dde6] rounded-xl shadow-md p-6 sm:p-8">
          <div className="text-center mb-5">
            <img src="/labtis.png" alt={APP_NAME} className="h-16 w-auto mx-auto object-contain" />
            {mode === 'create' ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 mt-4">Create account</h1>
                <p className="text-xs text-slate-500 mt-1">
                  The role decides which screens this person can open.
                </p>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 mb-5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-1.5 text-xs font-semibold rounded-md ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`py-1.5 text-xs font-semibold rounded-md ${mode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Create account
            </button>
          </div>

          {displayedError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{displayedError}</div>
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mode === 'create' ? 'Account created. Opening your desk...' : 'Signed in. Opening your desk...'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'create' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ana Reyes"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#d8dde6] text-slate-800 placeholder-slate-400 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus={mode === 'signin'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. staff"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-[#d8dde6] text-slate-800 placeholder-slate-400 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-lg bg-white border border-[#d8dde6] text-slate-800 placeholder-slate-400 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type the password again"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#d8dde6] text-slate-800 placeholder-slate-400 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#d8dde6] text-slate-800 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none"
                  >
                    {APP_ROLES.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  {selectedRole && (
                    <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">{selectedRole.description}</p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0176d3] hover:bg-[#014486] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'create' ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'create' ? 'Create account' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'signin' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white px-2.5 text-slate-400">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSsoLoading || isSubmitting || isSuccess || !isSupabaseAuthAvailable}
                title={
                  isSupabaseAuthAvailable
                    ? 'Sign in with a Google account linked by an administrator'
                    : 'Configure Supabase environment variables to enable Google SSO'
                }
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 border border-[#d8dde6] text-slate-700 font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSsoLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-[11px] text-slate-500 mb-2 text-center">Ready-made desks</p>
                <div className="grid grid-cols-2 gap-2">
                  {STARTERS.map((item) => (
                    <button
                      key={item.username}
                      type="button"
                      onClick={() => {
                        setUsername(item.username);
                        setPassword(item.password);
                        setErrorMessage(null);
                        clearSsoError();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
                    >
                      <div className="text-[11px] font-semibold text-slate-800">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.username} / {item.password}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-[#d8dde6] bg-white">
        {APP_NAME} · {APP_TAGLINE}
      </footer>
    </div>
  );
};
