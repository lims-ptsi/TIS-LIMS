import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck,
  Mail,
  Trash2, 
  FileText, 
  Barcode, 
  Activity, 
  Receipt, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  X,
  Sparkles
} from 'lucide-react';
import { LimsNotification } from '../../types/lims';
import { getSoundEnabled, setSoundEnabled } from '../../utils/notificationSound';
import { useAuth } from '../../context/AuthContext';
import { isAppRole } from '../../data/roleAccess';
import { filterNotificationsForRole } from '../../utils/workflowNotifications';

interface NotificationDropdownProps {
  notifications: LimsNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onMarkAllAsRead: () => void;
  onMarkAllAsUnread: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onSelectNotification: (notif: LimsNotification) => void;
}

const formatTitle = (title: string): string => {
  if (!title) return 'Notification';
  if (title === title.toUpperCase()) {
    return title
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/\(or#\)/i, '(OR#)')
      .replace(/\(coa Release\)/i, '(CoA Release)')
      .replace(/\bOpd\b/i, 'OPD');
  }
  return title;
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onMarkAllAsUnread,
  onClearAll,
  onDeleteNotification,
  onSelectNotification,
}) => {
  const { user } = useAuth();
  const role = isAppRole(user?.roleType) ? user.roleType : null;
  const visibleNotifications = filterNotificationsForRole(notifications, role);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REQUESTS' | 'RESULTS'>('ALL');
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [dismissBanner, setDismissBanner] = useState(false);
  const [permissionState, setPermissionState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const readCount = visibleNotifications.filter((n) => n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
  };

  const handleRequestDesktopPermission = () => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then((res) => {
        setPermissionState(res);
        if (res === 'granted' || res === 'denied') {
          setDismissBanner(true);
        }
      });
    }
  };

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'REQUESTS') return n.type === 'NEW_REQUEST' || n.type === 'ACCESSIONED';
    if (filter === 'RESULTS') return n.type === 'RESULTS_READY';
    return true;
  });

  const getIcon = (type: LimsNotification['type']) => {
    switch (type) {
      case 'NEW_REQUEST':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0176d3] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'ACCESSIONED':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Barcode className="w-3.5 h-3.5" />
          </div>
        );
      case 'RESULTS_READY':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
        );
      case 'PAYMENT_SETTLED':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Receipt className="w-3.5 h-3.5" />
          </div>
        );
      case 'STAT_ALERT':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-slate-100 relative transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[390px] sm:w-[420px] max-w-[95vw] bg-white rounded-xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0176d3] text-[10px] font-semibold border border-blue-100/70 font-mono">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                  soundOn
                    ? 'bg-blue-50 text-[#0176d3] border-blue-200/80 hover:bg-blue-100'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
                title={soundOn ? 'Sound alerts on (click to mute)' : 'Sound alerts muted (click to enable)'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {readCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsUnread}
                  className="p-1.5 rounded-md text-slate-500 hover:text-[#0176d3] hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                  title="Mark all as unread"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Alert Permission Banner (Compact & Dismissible) */}
          {permissionState !== 'granted' && !dismissBanner && (
            <div className="px-3.5 py-1.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 truncate pr-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate text-[10.5px]">Enable desktop alerts for incoming requests?</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRequestDesktopPermission}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded text-[10px] cursor-pointer transition-colors"
                >
                  Enable
                </button>
                <button
                  type="button"
                  onClick={() => setDismissBanner(true)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Clean Segmented Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 bg-slate-50/60 text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              All ({visibleNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setFilter('REQUESTS')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filter === 'REQUESTS'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              Requests
            </button>
            <button
              type="button"
              onClick={() => setFilter('RESULTS')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filter === 'RESULTS'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              Results
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onSelectNotification(notif);
                    setIsOpen(false);
                  }}
                  className={`px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/90 transition-colors cursor-pointer group relative ${
                    !notif.read ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  {/* Clean Icon */}
                  {getIcon(notif.type)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-800 truncate">
                        {formatTitle(notif.title)}
                      </span>
                      {notif.priority === 'STAT' && (
                        <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[8.5px] font-mono font-bold">
                          STAT
                        </span>
                      )}
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0176d3] shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                      <span>{notif.timestamp}</span>
                      {notif.caseNo && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-medium">{notif.caseNo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {notif.read ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsUnread(notif.id);
                        }}
                        className="p-1 text-slate-400 hover:text-[#0176d3] rounded hover:bg-blue-50 cursor-pointer"
                        title="Mark as unread"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notif.id);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notif.id);
                      }}
                      className="p-1 text-slate-300 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 px-4 text-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-semibold text-slate-800">All caught up</div>
                <p className="text-[11px] text-slate-400">
                  No {filter === 'UNREAD' ? 'unread ' : ''}notifications at this moment.
                </p>
              </div>
            )}
          </div>

          {/* Clean Footer */}
          {visibleNotifications.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10.5px]">
                Audio alerts: <strong className={soundOn ? 'font-medium text-emerald-600' : 'text-slate-400'}>{soundOn ? 'Active' : 'Muted'}</strong>
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium text-[10.5px] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
