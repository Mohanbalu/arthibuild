import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Bell, HardHat, ChevronDown, CheckCircle2, User, LogOut } from 'lucide-react';
import { UserRole } from '../../types';
import { getDefaultDashboardForRole } from '../../services/permissions';

interface HeaderProps {
  currentView: string;
  onOpenNotifications: () => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenNotifications,
  onNavigate
}) => {
  const { currentUser, switchUser, availableUsers, logout } = useAuth();
  const { notifications } = useData();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roleLabels: Record<UserRole, { title: string; color: string }> = {
    admin: { title: 'Admin — Arthi', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    project_manager: { title: 'Project Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    site_coordinator: { title: 'Site Coordinator', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    customer: { title: 'Customer Portal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  };

  const getBreadcrumbTitle = (view: string) => {
    switch (view) {
      case 'admin-dashboard': return 'Executive Admin Command Center';
      case 'pm-dashboard': return 'Project Manager Dashboard';
      case 'coordinator-dashboard': return 'Site Coordinator Dashboard';
      case 'customer-portal': return 'Client Property Portal';
      case 'dashboard': return 'Command Center Overview';
      case 'projects': return 'Projects Portfolio';
      case 'project-detail': return 'Project Details';
      case 'buildings': return 'Building & Floor Explorer';
      case 'properties': return 'Units & Properties';
      case 'property-detail': return 'Unit Detail & Scope';
      case 'tasks': return 'Construction Task Board';
      case 'timeline': return 'Gantt Schedule & Critical Path';
      case 'site-update': return 'Site Daily Log & Photos';
      case 'gallery': return 'Site Photo Gallery';
      case 'delivery': return 'Delivery Forecasting Engine';
      case 'customizations': return 'Customization Requests';
      case 'inspections': return 'Quality Audits & Snagging';
      case 'handovers': return 'Clearance & Handover';
      case 'customers': return 'Customer Directory';
      case 'users': return 'Team & Roles';
      case 'reports': return 'Analytics & Progress Curves';
      case 'settings': return 'System & Data Management';
      case 'customer-portal': return 'Customer Property Portal';
      default: return 'Overview';
    }
  };

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between gap-8 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate(getDefaultDashboardForRole(currentUser.role))}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shadow-xs group-hover:bg-slate-800 transition-colors">
            <img src="/images/logo.png" alt="ArthiBuild Logo" className="w-full h-full object-contain" />
          </div>
          <div className="whitespace-nowrap">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
              ArthiBuild
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-normal">
              CMS v1.0
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Breadcrumb context (single line) */}
      <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap overflow-hidden">
        <span className="text-slate-400">Arthi Construction</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{getBreadcrumbTitle(currentView)}</span>
      </div>

      {/* Zone 3: 1-2 primary actions, notifications & active role switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications trigger */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="In-App Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Account / Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <User className="w-4 h-4 text-slate-200" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User selector & Logout Popover */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in-50 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="text-xs font-semibold text-slate-900">Signed in as {currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentUser.email}
                  </div>
                </div>

                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Demo Account
                </div>

                <div className="space-y-1">
                  {availableUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    const roleBadge = roleLabels[user.role];
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUser(user);
                          setUserMenuOpen(false);
                          onNavigate(getDefaultDashboardForRole(user.role));
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-slate-100/90 font-medium'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0 overflow-hidden mt-0.5">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-4 h-4 m-1 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {user.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-mono ${roleBadge.color}`}>
                            {roleBadge.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Public Website & Explicit Logout Action */}
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('home');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>View Public Portfolio</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      onNavigate('home');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Standalone Quick Logout button on header - prominent & always visible */}
        <button
          onClick={() => {
            logout();
            onNavigate('home');
          }}
          className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 hover:border-rose-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Log out of session"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
