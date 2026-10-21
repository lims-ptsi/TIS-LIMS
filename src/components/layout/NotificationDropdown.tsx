import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  FileText, 
  Barcode, 
  Activity, 
  Receipt, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  X,
  Sparkles
} from 'lucide-react';
import { LimsNotification } from '../../types/lims';
import { getSoundEnabled, setSoundEnabled, triggerDesktopNotification } from '../../utils/notificationSound';

interface NotificationDropdownProps {
  notifications: LimsNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onSelectNotification: (notif: LimsNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onSelectNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REQUESTS' | 'RESULTS'>('ALL');
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [permissionState, setPermissionState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      });
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'REQUESTS') return n.type === 'NEW_REQUEST' || n.type === 'ACCESSIONED';
    if (filter === 'RESULTS') return n.type === 'RESULTS_READY';
    return true;
  });

  const getIcon = (type: LimsNotification['type']) => {
    switch (type) {
      case 'NEW_REQUEST':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[#0176d3] shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'ACCESSIONED':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Barcode className="w-4 h-4" />
          </div>
        );
      case 'RESULTS_READY':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        );
      case 'PAYMENT_SETTLED':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        );
      case 'STAT_ALERT':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Bell className="w-4 h-4" />
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
        className="p-1.5 rounded-md hover:bg-slate-100 relative transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
        title="Notifications & Live Activity"
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0176d3]/10 text-[#0176d3] flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Real-time clinical intake &amp; testing alerts
                </span>
              </div>
            </div>

            {/* Quick Utility Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                  soundOn
                    ? 'bg-blue-50 text-[#0176d3] border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
                title={soundOn ? 'Sound alerts enabled (Click to mute)' : 'Sound alerts muted (Click to enable)'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer text-xs"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Alert Permission Banner (If Not Granted) */}
          {permissionState !== 'granted' && (
            <div className="px-3.5 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Enable desktop popups for new requests?</span>
              </span>
              <button
                type="button"
                onClick={handleRequestDesktopPermission}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] cursor-pointer shadow-2xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('REQUESTS')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filter === 'REQUESTS'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Requests
            </button>
            <button
              type="button"
              onClick={() => setFilter('RESULTS')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filter === 'RESULTS'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Results
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onSelectNotification(notif);
                    setIsOpen(false);
                  }}
                  className={`p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group relative ${
                    !notif.read ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {/* Icon */}
                  {getIcon(notif.type)}

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {notif.title}
                      </span>
                      {notif.priority === 'STAT' && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-mono font-bold">
                          STAT
                        </span>
                      )}
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#0176d3] shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-tight mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{notif.timestamp}</span>
                      {notif.caseNo && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{notif.caseNo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete / Dismiss Single item */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(notif.id);
                    }}
                    className="absolute right-2 top-2 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-200 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-800">All caught up!</div>
                <p className="text-[11px] text-slate-500">
                  No {filter === 'UNREAD' ? 'unread ' : ''}notifications at this moment.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono text-[10px]">
                Audio alerts: <strong className={soundOn ? 'text-emerald-700' : 'text-slate-400'}>{soundOn ? 'Active' : 'Muted'}</strong>
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
