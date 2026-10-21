import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationDrawer } from './NotificationDrawer';
import { useAuth } from '../../context/AuthContext';
import { Info, Sparkles, RefreshCw, LogOut } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { currentUser, role, logout } = useAuth();
  const { resetDemoData } = useData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Demo Context Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
            <Sparkles className="w-3 h-3 text-amber-400" /> PROTOTYPE MODE
          </span>
          <span className="text-slate-300 text-xs hidden sm:inline">
            Active Role: <strong className="text-white capitalize">{currentUser.name}</strong> ({role.replace('_', ' ')})
          </span>
          <span className="text-slate-500 text-[11px] hidden md:inline">
            · Browser localStorage Persistence · Offline-Capable Prototype
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to initial factory state? Any custom additions will be cleared.')) {
                resetDemoData();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset demo data back to original state"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>

          <span className="text-slate-700 text-xs">|</span>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300 hover:text-white hover:bg-rose-600 px-2.5 py-0.5 rounded border border-rose-500/40 transition-all cursor-pointer shadow-xs"
            title="Log out of current session"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Workspace with Header and Sidebar */}
      <Header
        currentView={currentView}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
