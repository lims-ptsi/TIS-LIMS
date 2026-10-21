import React, { useState } from 'react';
import { 
  Grid, 
  Search, 
  Star, 
  Plus, 
  HelpCircle, 
  Settings, 
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { UserProfileDropdown } from '../auth/UserProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { LimsNotification } from '../../types/lims';

interface TopNavbarProps {
  currentTab: string;
  tabs: { id: string; label: string }[];
  showCreate?: boolean;
  showAdminTools?: boolean;
  onSelectTab: (tab: string) => void;
  onOpenNewModal: () => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  notifications?: LimsNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onSelectNotification?: (notif: LimsNotification) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  tabs,
  showCreate = false,
  showAdminTools = false,
  onSelectTab,
  onOpenNewModal,
  globalSearch,
  onGlobalSearchChange,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onClearAllNotifications = () => {},
  onDeleteNotification = () => {},
  onSelectNotification = () => {},
}) => {
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const navItems = tabs;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#d8dde6] shadow-sm print:hidden">
      {/* Top Global Utility Row */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#e5e7eb] bg-white">
        {/* Left: 9-Dot Launcher & App Name */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAppLauncher(!showAppLauncher)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="App Launcher"
          >
            <Grid className="w-5 h-5 text-slate-700" />
          </button>

          {/* 4 Colored Squares Logo */}
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
            <div className="w-2 h-2 rounded-[2px] bg-[#0176d3]"></div>
            <div className="w-2 h-2 rounded-[2px] bg-[#00a1e0]"></div>
            <div className="w-2 h-2 rounded-[2px] bg-[#2e844a]"></div>
            <div className="w-2 h-2 rounded-[2px] bg-[#4bca81]"></div>
          </div>

          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectTab(tabs[0]?.id || 'home')}>
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Sample Management
            </span>
          </div>
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
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-md bg-white border border-[#d8dde6] text-slate-800 placeholder-slate-400 focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Right: Action Utilities */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <button className="p-1.5 rounded hover:bg-slate-100 cursor-pointer" title="Favorites">
            <Star className="w-4 h-4 text-slate-500" />
          </button>
          {showCreate && (
            <button
              onClick={onOpenNewModal}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Create New Requisition Request"
            >
              <Plus className="w-4 h-4 text-slate-700" />
            </button>
          )}
          <button className="p-1.5 rounded hover:bg-slate-100 cursor-pointer" title="System Status: Normal (+4°C Validated)">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 cursor-pointer" title="Help & ISO 15189 Documentation">
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </button>
          
          {/* Real-time Interactive Notification Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
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

      {/* Main Tab Bar Row */}
      <div className="flex items-center justify-between px-4 bg-white overflow-x-auto text-xs font-medium">
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

        {/* Right side edit pencil icon */}
        {showAdminTools && (
          <div className="pl-3">
            <button className="p-1 text-slate-400 hover:text-slate-700" title="Customize Tabs">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
