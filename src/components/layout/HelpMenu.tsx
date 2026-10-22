import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_ROLES, isAppRole } from '../../data/roleAccess';

interface HelpMenuProps {
  currentTab: string;
  tabs: { id: string; label: string }[];
  onSelectTab: (tab: string) => void;
}

const SCREEN_HELP: Record<string, string> = {
  home: 'Today’s counts, the three request steps, and the latest requests are on this screen. Begin opens the form. A row opens the queue only when this desk is allowed to work that request.',
  'create-request': 'Step 1 is the patient. OPD goes to the cashier. PhilHealth, Indigent, Corporate, Employee, and Projects go to the laboratory. Step 2 is the date, case number, and physician. Step 3 is the examinations. Choose at least one, then submit.',
  submissions: 'Receive a request that is ready for the laboratory, then enter the result. PhilHealth, Indigent, Corporate, Employee, and Projects arrive here. OPD arrives after the cashier assigns the receipt.',
  payments: 'Only OPD requests are listed. Assign the official receipt after the patient pays. Other categories go to the laboratory and do not appear here.',
  samples: 'Print the specimen QR label for a received request.',
  'patient-records': 'Search every patient and open their full lab visit history, specimens, and results.',
  'result-forms': 'Open the paper form for an examination. A blank form is a preview. It is not saved as a patient result.',
  'coa-reports': 'Open a released report and print it.',
  examinations: 'The examination catalog, form assignment, and prices.',
  'result-templates': 'The fields used when a result is entered.',
  'audit-trail': 'Who changed a request or a result.',
  'sample-detail': 'The record for one specimen. Labels, custody, and the result are on this screen.',
  instruments: 'Analyzer connection and calibration dates. An overdue date is also listed under the triangle in the top bar.',
};

const DESK_HELP: Record<string, string> = {
  STAFF: 'The information desk creates a lab test request. It does not receive a specimen, enter a result, or assign a receipt.',
  CASHIER: 'The cashier assigns the official receipt for OPD only. Other categories go to the laboratory. This desk does not create a request, receive a specimen, or enter a result.',
  LAB_STAFF: 'The laboratory creates a request, receives the specimen, enters the result, and prints the label and the report. It does not assign the official receipt.',
  ADMIN: 'Administration can open every screen, including the catalog, result templates, and the audit trail.',
};

export const HelpMenu: React.FC<HelpMenuProps> = ({
  currentTab,
  tabs,
  onSelectTab,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const role = isAppRole(user?.roleType) ? user.roleType : null;
  const roleName = APP_ROLES.find((item) => item.id === role)?.label || 'Staff';
  const current = tabs.find((tab) => tab.id === currentTab);
  const screenText = SCREEN_HELP[currentTab] || 'Use the screens listed for this desk. A screen stays closed when this role is not allowed to open it.';

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`p-1.5 rounded cursor-pointer ${open ? 'bg-sky-50 text-[#0176d3]' : 'hover:bg-slate-100 text-slate-500'}`}
        title="Help"
        aria-expanded={open}
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#d8dde6] rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Help</div>
            <div className="text-[11px] font-semibold text-slate-600">{roleName}</div>
          </div>

          <div className="px-3 py-2.5 border-b border-slate-100">
            <div className="text-sm font-medium text-slate-900">This desk</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{DESK_HELP[role || 'STAFF']}</p>
          </div>

          <div className="px-3 py-2.5 border-b border-slate-100">
            <div className="text-sm font-medium text-slate-900">{current?.label || 'This screen'}</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{screenText}</p>
          </div>

          <div className="px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Open a screen</div>
            <div className="mt-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setOpen(false);
                  }}
                  className={`block w-full text-left py-1.5 text-sm cursor-pointer hover:text-[#0176d3] ${
                    tab.id === currentTab ? 'text-[#0176d3] font-semibold' : 'text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            The star pins a screen for this username. The triangle lists the cold vault and analyzer calibration.
          </div>
        </div>
      )}
    </div>
  );
};
