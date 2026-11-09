import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  ChevronDown,
  Building2,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../data/roleAccess';

interface UserProfileDropdownProps {
  onOpenSwitchPersonaModal?: () => void;
}

function sessionDetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        <Icon className="w-3 h-3 shrink-0 text-slate-400" aria-hidden />
        {label}
      </div>
      <p
        className={`mt-0.5 text-xs text-slate-800 truncate ${mono ? 'font-mono' : 'font-medium'}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = () => {
  const { user, logout, lockScreen, facility, terminalInfo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const role = roleLabel(user.roleType);
  const subtitle = [user.title, user.department].filter(Boolean).join(' · ');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-all cursor-pointer shadow-sm group"
        title="Active User Profile & Session"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div
          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-bold text-[10px] text-white shadow-sm border border-white`}
        >
          {user.avatarInitials}
        </div>

        <div className="hidden sm:flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1 leading-tight min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {user.name}
            </span>
            <ShieldCheck className="w-3 h-3 text-slate-500 shrink-0" aria-hidden />
          </div>
          <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[150px]">
            {role}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden text-slate-800 animate-fadeIn"
        >
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-3">
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-bold text-sm text-white shrink-0 ring-2 ring-slate-100`}
              >
                {user.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{user.name}</h4>
                {subtitle ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {subtitle}
                  </p>
                ) : null}
                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {role}
                </span>
              </div>
            </div>

            <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              <div>
                <dt className="text-slate-500">Badge</dt>
                <dd className="font-mono text-slate-700 truncate" title={user.badgeNumber}>
                  {user.badgeNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">E-sign PIN</dt>
                <dd className="font-mono text-slate-700">{user.electronicSignaturePin}</dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-3 grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/80">
            {sessionDetailRow({
              icon: Building2,
              label: 'Facility',
              value: facility.name,
            })}
            {sessionDetailRow({
              icon: Monitor,
              label: 'Workstation',
              value: terminalInfo.terminalId,
              mono: true,
            })}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                lockScreen();
              }}
              className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Lock terminal</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="group w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-rose-600" />
              <span>Sign out</span>
            </button>
          </div>

          <p className="px-4 py-2.5 text-[10px] text-slate-400 text-center border-t border-slate-100 bg-slate-50/50">
            Encrypted session · 21 CFR Part 11
          </p>
        </div>
      )}
    </div>
  );
};
