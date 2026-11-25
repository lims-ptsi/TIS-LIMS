import React from 'react';
import {
  Home,
  FilePlus,
  Inbox,
  FlaskConical,
  List,
  BarChart2,
  CreditCard,
  TestTubes,
  Users,
  FileText,
  TrendingUp,
  Microscope,
  LayoutTemplate,
  ShieldCheck,
  Layers,
  Grid3X3,
  Box,
  BookOpen,
  Activity,
  Package,
  PackageCheck,
  Cpu,
  HeartPulse,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { APP_NAME } from '../brand/LabTisBrand';
import { isAppRole, tabsForRole, type AppRole, type NavTab } from '../../data/roleAccess';

const TAB_ICONS: Record<string, LucideIcon> = {
  home: Home,
  'create-request': FilePlus,
  'lab-requests': Inbox,
  'testing-queue': FlaskConical,
  'pickup-management': PackageCheck,
  'all-requests': List,
  'analytics-reports': BarChart2,
  payments: CreditCard,
  samples: TestTubes,
  'patient-records': Users,
  'result-forms': FileText,
  'coa-reports': TrendingUp,
  examinations: Microscope,
  'result-templates': LayoutTemplate,
  'audit-trail': ShieldCheck,
  'account-management': UserCog,
  batches: Layers,
  projects: Layers,
  plates: Grid3X3,
  libraries: BookOpen,
  boxes: Box,
  protocols: BookOpen,
  'qc-analytics': Activity,
  inventory: Package,
  instruments: Cpu,
};

const LAB_EXTRA_TABS: NavTab[] = [
  { id: 'batches', label: 'Batches' },
  { id: 'plates', label: 'Plates' },
  { id: 'boxes', label: 'Storage boxes' },
  { id: 'protocols', label: 'Protocols' },
  { id: 'qc-analytics', label: 'QC analytics' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'instruments', label: 'Instruments' },
];

function sidebarTabsForRole(role: string | undefined): NavTab[] {
  if (!isAppRole(role)) return [];
  const base = tabsForRole(role);
  const baseIds = new Set(base.map((t) => t.id));
  const extras =
    role === 'ADMIN' ? LAB_EXTRA_TABS.filter((t) => !baseIds.has(t.id)) : [];
  return [...base, ...extras];
}

function resolveActiveTab(currentTab: string): string {
  if (currentTab === 'sample-detail') return 'patient-records';
  if (currentTab === 'submissions') return 'lab-requests';
  if (currentTab === 'projects') return 'batches';
  if (currentTab === 'libraries') return 'plates';
  return currentTab;
}

interface AppSidebarProps {
  currentTab: string;
  role: string | undefined;
  onSelectTab: (tab: string) => void;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  role,
  onSelectTab,
  className = '',
}) => {
  const items = sidebarTabsForRole(role);
  const activeTab = resolveActiveTab(currentTab);

  return (
    <aside
      className={`print:hidden relative flex flex-col w-[15.5rem] shrink-0 h-screen max-h-screen h-dvh max-h-dvh overflow-hidden sticky top-0 bg-gradient-to-b from-[#0a2240] via-[#0c2a4d] to-[#081a33] text-slate-100 border-r border-[#0a2240] ${className}`}
    >
      <div className="shrink-0 px-4 pt-6 pb-5 border-b border-white/10">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex flex-col items-center justify-center w-full cursor-pointer group text-center"
          title={APP_NAME}
        >
          <img
            src="/labtis.png"
            alt={APP_NAME}
            className="h-[4.25rem] w-auto max-w-[88%] object-contain brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity"
          />
          <span className="mt-3 block text-[10px] leading-snug text-slate-300/90 max-w-[13rem]">
            Laboratory Information Management System
          </span>
        </button>
      </div>

      <nav
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-0.5 overscroll-y-contain"
        aria-label="Main menu"
      >
        {items.map((item) => {
          const Icon = TAB_ICONS[item.id] || FileText;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[13px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#0878e8] text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

      </nav>

      <div className="relative shrink-0 w-full">
        <div className="relative h-12 w-full pointer-events-none" aria-hidden>
          <svg
            className="absolute bottom-0 left-0 w-full h-10 text-white/[0.12]"
            viewBox="0 0 248 40"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,28 C41,6 82,34 124,20 C165,6 207,32 248,18 L248,40 L0,40 Z"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-full h-12 text-[#0176d3]/25"
            viewBox="0 0 248 48"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,32 C62,12 93,38 124,26 C155,14 186,36 248,22 L248,48 L0,48 Z"
            />
          </svg>
        </div>
        <div className="relative z-[1] px-3 pb-4 pt-0">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm shadow-lg shadow-black/20">
          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-[#0176d3]/20 flex items-center justify-center shrink-0 text-sky-300">
              <HeartPulse className="w-5 h-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 text-[10px] leading-snug text-slate-300">
              <p className="font-semibold text-white text-[11px]">PTSI Laboratory Information System</p>
              <p className="mt-1 text-slate-400">Accurate · Reliable · Trusted</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
};

export { sidebarTabsForRole };
