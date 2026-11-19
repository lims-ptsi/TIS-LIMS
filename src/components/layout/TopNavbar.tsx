import React, { useState } from 'react';
import { 
  Grid, 
  Search, 
  Plus, 
  Settings, 
  Edit3,
} from 'lucide-react';
import { LabTisBrand } from '../brand/LabTisBrand';
import { UserProfileDropdown } from '../auth/UserProfileDropdown';
import { FavoritesMenu } from './FavoritesMenu';
import { HelpMenu } from './HelpMenu';
import { SystemStatusMenu } from './SystemStatusMenu';
import { NotificationDropdown } from './NotificationDropdown';
import { LimsNotification, InstrumentDevice, Sample } from '../../types/lims';

interface TopNavbarProps {
  currentTab: string;
  tabs: { id: string; label: string }[];
  /** When true, horizontal tab strip is hidden (sidebar owns navigation). */
  sidebarNav?: boolean;
  onOpenMobileNav?: () => void;
  showCreate?: boolean;
  showAdminTools?: boolean;
  onSelectTab: (tab: string) => void;
  onOpenNewModal: () => void;
  instruments?: InstrumentDevice[];
  samples?: Sample[];
  onOpenInstruments?: () => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  notifications?: LimsNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkNotificationAsUnread?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onMarkAllNotificationsAsUnread?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onSelectNotification?: (notif: LimsNotification) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  tabs,
  sidebarNav = false,
  onOpenMobileNav,
  showCreate = false,
  showAdminTools = false,
  onSelectTab,
  onOpenNewModal,
  instruments = [],
  samples = [],
  onOpenInstruments,
  globalSearch,
  onGlobalSearchChange,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkNotificationAsUnread = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onMarkAllNotificationsAsUnread = () => {},
  onClearAllNotifications = () => {},
  onDeleteNotification = () => {},
  onSelectNotification = () => {},
}) => {
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const navItems = tabs;

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 bg-white border-b border-[#d8dde6] shadow-sm print:hidden">
      {/* Top Global Utility Row */}
      <div className="flex items-center justify-between px-4 py-2 bg-white">
        {/* Left: mobile menu / brand when no sidebar */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => (sidebarNav ? onOpenMobileNav?.() : setShowAppLauncher(!showAppLauncher))}
            className="lg:hidden p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Menu"
          >
            <Grid className="w-5 h-5 text-slate-700" />
          </button>

          {!sidebarNav ? (
            <button
              type="button"
              className="flex items-center cursor-pointer"
              onClick={() => onSelectTab(tabs[0]?.id || 'home')}
              title="LAB-TIS"
            >
              <LabTisBrand markClassName="h-11 w-auto" showName={false} />
            </button>
          ) : (
            <span className="hidden sm:block text-sm font-semibold text-slate-800 truncate">
              {currentTab === 'sample-detail'
                ? 'Patient & specimen'
                : navItems.find((t) => t.id === currentTab)?.label || 'Lab-TIS'}
            </span>
          )}
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients, case numbers, barcodes, tests..."
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-white border border-[var(--lims-border)] text-slate-800 placeholder-slate-400 focus:border-[#0878e8] focus:ring-2 focus:ring-[#0878e8]/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Action Utilities */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <FavoritesMenu currentTab={currentTab} tabs={tabs} onSelectTab={onSelectTab} />
          {showCreate && (
            <button
              onClick={onOpenNewModal}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Create New Requisition Request"
            >
              <Plus className="w-4 h-4 text-slate-700" />
            </button>
          )}
          <SystemStatusMenu
            instruments={instruments}
            samples={samples}
            onOpenInstruments={onOpenInstruments}
          />
          <HelpMenu currentTab={currentTab} tabs={tabs} onSelectTab={onSelectTab} />
          
          {/* Real-time Interactive Notification Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAsUnread={onMarkNotificationAsUnread}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onMarkAllAsUnread={onMarkAllNotificationsAsUnread}
            onClearAll={onClearAllNotifications}
            onDeleteNotification={onDeleteNotification}
            onSelectNotification={onSelectNotification}
          />

          {showAdminTools && (
            <button className="p-1.5 rounded hover:bg-slate-100 cursor-pointer" title="Setup & Configuration">
              <Settings className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* User Profile Dropdown & E-Sign Auth Status */}
          <div className="ml-1 pl-2 border-l border-slate-200">
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      {!sidebarNav ? (
        <div className="flex items-center justify-between px-4 bg-white overflow-x-auto text-xs font-medium border-t border-slate-100">
          <div className="flex items-center">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1 px-3.5 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'text-[#0176d3] border-[#0176d3] font-semibold bg-blue-50/40'
                      : 'text-slate-700 border-transparent hover:text-[#0176d3] hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {showAdminTools ? (
            <div className="pl-3">
              <button className="p-1 text-slate-400 hover:text-slate-700" title="Customize Tabs">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!sidebarNav && showAppLauncher ? (
        <div className="lg:hidden border-t border-slate-200 bg-white px-2 py-2 flex flex-wrap gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                setShowAppLauncher(false);
              }}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 text-slate-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
};
