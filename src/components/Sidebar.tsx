import React from 'react';
import { 
  LayoutDashboard, 
  Barcode, 
  Grid3X3, 
  FileSpreadsheet, 
  LineChart, 
  FlaskRound, 
  PackageSearch, 
  FileText, 
  Cpu, 
  ShieldAlert,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  statCount: number;
  pendingReviewCount: number;
  qcWarningCount: number;
  lowReagentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  statCount,
  pendingReviewCount,
  qcWarningCount,
  lowReagentCount,
}) => {
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'dashboard',
          label: 'Operations Center',
          icon: LayoutDashboard,
          badge: statCount > 0 ? `${statCount} STAT` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'accessioning',
          label: 'Sample Accessioning & CoC',
          icon: Barcode,
        },
        {
          id: 'plate-worklist',
          label: '96-Well Microplate Builder',
          icon: Grid3X3,
        },
        {
          id: 'results-entry',
          label: 'Results & Delta Checks',
          icon: FileSpreadsheet,
          badge: pendingReviewCount > 0 ? `${pendingReviewCount} Rev` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      title: 'QUALITY & METHODS',
      items: [
        {
          id: 'qc-analytics',
          label: 'Statistical QA/QC (Westgard)',
          icon: LineChart,
          badge: qcWarningCount > 0 ? `${qcWarningCount} Alert` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'test-catalog',
          label: 'Dynamic Test & Formula Master',
          icon: FlaskRound,
        },
        {
          id: 'coa-reports',
          label: 'Certificates of Analysis (CoA)',
          icon: FileText,
        },
      ],
    },
    {
      title: 'EQUIPMENT & COMPLIANCE',
      items: [
        {
          id: 'inventory',
          label: 'Reagent & Lot Inventory',
          icon: PackageSearch,
          badge: lowReagentCount > 0 ? `${lowReagentCount} Low` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'instruments',
          label: 'Instrument Interfacing & IoT',
          icon: Cpu,
        },
        {
          id: 'audit-trail',
          label: '21 CFR Part 11 Audit Trail',
          icon: ShieldAlert,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto">
      <div className="p-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/60 text-cyan-200 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-full font-mono ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Widget */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50 m-2 rounded-xl">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Server Engine Status
          </span>
          <span className="font-mono text-emerald-400">99.98% SLA</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full w-[98%] rounded-full"></div>
        </div>
        <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-mono">
          <span>TimescaleDB & Redis</span>
          <span>Latency: 1.4ms</span>
        </div>
      </div>
    </aside>
  );
};
