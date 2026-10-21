import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  ChevronDown, 
  Building2, 
  Radio, 
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../data/roleAccess';

interface UserProfileDropdownProps {
  onOpenSwitchPersonaModal?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = () => {
  const { user, logout, lockScreen, facility, terminalInfo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: User Pill with Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-all cursor-pointer shadow-sm group"
        title="Active User Profile & Session"
      >
        <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-bold text-[10px] text-white shadow-sm border border-white`}>
          {user.avatarInitials}
        </div>
        
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1 leading-tight">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {user.name}
            </span>
            <ShieldCheck className="w-3 h-3 text-cyan-600 shrink-0" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono leading-tight">
            {roleLabel(user.roleType)}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-800 animate-fadeIn">
          {/* Header Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white relative">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-extrabold text-base text-white border-2 border-white/20 shadow-lg shrink-0`}>
                {user.avatarInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-cyan-400/20 text-cyan-300 rounded border border-cyan-400/40">
                    21 CFR PIN: {user.electronicSignaturePin}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">{user.title}</p>
                <p className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">{user.department}</p>
              </div>
            </div>

            {/* Clearance Level Banner */}
            <div className="mt-3 p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-[10px] font-mono text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Award className="w-3.5 h-3.5" />
                {user.securityLevelLabel.split('·')[0]}
              </span>
              <span className="text-slate-400">{user.badgeNumber}</span>
            </div>
          </div>

              {/* Session / Facility Info */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Facility
                  </span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[150px]" title={facility.name}>
                    {facility.name.split(' ')[0]} {facility.name.split(' ')[1]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    Workstation
                  </span>
                  <span className="font-mono text-slate-700">{terminalInfo.terminalId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    lockScreen();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-amber-600 flex items-center gap-2 transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Lock Benchtop Terminal (Screen Lock)</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out of LIMS Platform</span>
                </button>
              </div>

          {/* Footer Timestamp */}
          <div className="px-3 py-2 bg-slate-100 text-center text-[10px] text-slate-400 font-mono border-t border-slate-200">
            Session Encrypted · 21 CFR Part 11 Compliant
          </div>
        </div>
      )}
    </div>
  );
};
