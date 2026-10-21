import React from 'react';
import { useData } from '../../context/DataContext';
import { X, Check, Bell, AlertTriangle, Sparkles, ClipboardCheck, Award } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customization':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'inspection':
        return <ClipboardCheck className="w-4 h-4 text-sky-600" />;
      case 'handover':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'milestone':
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Notifications & Alerts</h3>
            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              {notifications.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-50"
              title="Mark all as read"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map(notif => {
              let timeFormatted = 'Recently';
              try {
                timeFormatted = formatDistanceToNow(parseISO(notif.timestamp), { addSuffix: true });
              } catch {
                timeFormatted = 'Recently';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.category === 'customization') onNavigate('customizations');
                    else if (notif.category === 'inspection') onNavigate('inspections');
                    else if (notif.category === 'handover') onNavigate('handovers');
                    else if (notif.category === 'delay') onNavigate('delivery');
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    notif.isRead
                      ? 'bg-white border-slate-200/80 hover:bg-slate-50'
                      : 'bg-amber-50/50 border-amber-200/80 shadow-2xs hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono mt-2">
                        {timeFormatted}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 text-center">
          In-App Notifications persist in your browser localStorage
        </div>
      </div>
    </div>
  );
};
