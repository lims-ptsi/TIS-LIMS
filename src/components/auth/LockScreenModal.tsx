import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  ShieldAlert, 
  LogOut, 
  FlaskConical, 
  AlertCircle, 
  CheckCircle2, 
  Fingerprint,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LockScreenModal: React.FC = () => {
  const { user, isScreenLocked, unlockScreen, logout, terminalInfo } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isScreenLocked || !user) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsUnlocking(true);

    setTimeout(() => {
      const success = unlockScreen(pinInput);
      if (!success) {
        setError(true);
        setIsUnlocking(false);
      } else {
        setPinInput('');
        setIsUnlocking(false);
      }
    }, 400);
  };

  const handleQuickPin = (pin: string) => {
    setPinInput(pin);
    setTimeout(() => {
      unlockScreen(pin);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 font-sans text-white animate-fadeIn">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        
        {/* Lock Icon and Header */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30 mb-4 border border-cyan-400/40">
            <Lock className="w-8 h-8" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">
              !
            </span>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-white">
            Benchtop Terminal Locked
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {terminalInfo.terminalId} · 21 CFR Part 11 Inactivity Lock
          </p>
        </div>

        {/* Locked User Info */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 text-left">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0 border border-white/20`}>
            {user.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-300 truncate">{user.title}</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">{user.department}</div>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span>Enter 21 CFR Signature PIN / Password</span>
              <button
                type="button"
                onClick={() => handleQuickPin(user.electronicSignaturePin)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline"
              >
                Auto-fill PIN: {user.electronicSignaturePin}
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                autoFocus
                required
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setError(false);
                }}
                placeholder={`PIN (e.g. ${user.electronicSignaturePin} or 'demo')`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-center tracking-widest text-base"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Incorrect PIN or password. Try &ldquo;{user.electronicSignaturePin}&rdquo; or &ldquo;demo&rdquo;.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUnlocking ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Terminal & Resume</span>
              </>
            )}
          </button>
        </form>

        {/* Switch User / Logout Option */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Not {user.name.split(' ')[0]}?</span>
          <button
            type="button"
            onClick={logout}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
