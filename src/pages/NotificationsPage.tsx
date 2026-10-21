import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Bell, Sparkles, AlertTriangle, ClipboardCheck, Award, Check } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NotificationsPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customization': return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'delay': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'inspection': return <ClipboardCheck className="w-4 h-4 text-sky-600" />;
      case 'handover': return <Award className="w-4 h-4 text-emerald-600" />;
      default: return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <span>In-App Notifications & Alerts Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of milestone completions, schedule variance warnings, and customer decisions
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-2xs"
        >
          Mark All as Read
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['all', 'milestone', 'delay', 'customization', 'inspection', 'handover'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat} Alerts
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No notifications in this category.
          </div>
        ) : (
          filtered.map(notif => {
            let timeStr = 'Recently';
            try {
              timeStr = formatDistanceToNow(parseISO(notif.timestamp), { addSuffix: true });
            } catch {
              timeStr = 'Recently';
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
                }}
                className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition-all ${
                  notif.isRead
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-amber-50/50 border-amber-300 shadow-2xs hover:bg-amber-50'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-slate-100 shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{notif.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">{timeStr}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 self-center" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
