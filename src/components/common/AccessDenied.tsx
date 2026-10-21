import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDefaultDashboardForRole, ROLE_ALLOWED_VIEWS, ROLE_META_DATA } from '../../services/permissions';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2, User, RefreshCw, Compass } from 'lucide-react';
import { UserRole } from '../../types';

interface AccessDeniedProps {
  requestedView: string;
  onNavigate: (view: string, id?: string) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requestedView, onNavigate }) => {
  const { currentUser, role, switchUser, availableUsers } = useAuth();
  const currentRoleMeta = ROLE_META_DATA[role] || ROLE_META_DATA.admin;
  const defaultDashboard = getDefaultDashboardForRole(role);

  // Find roles that CAN access this requested view
  const authorizedRoles = (Object.keys(ROLE_ALLOWED_VIEWS) as UserRole[]).filter(r => 
    ROLE_ALLOWED_VIEWS[r].includes(requestedView)
  );

  const viewReadableNames: Record<string, string> = {
    'admin-dashboard': 'Executive Admin Dashboard',
    'pm-dashboard': 'Project Manager Dashboard',
    'coordinator-dashboard': 'Site Coordinator Dashboard',
    'customer-portal': 'Customer Property Portal',
    'dashboard': 'Primary Dashboard',
    'map-view': 'GIS Map & Hierarchy',
    'hierarchy': 'Location Hierarchy',
    'projects': 'Projects & Sites Portfolio',
    'project-detail': 'Project Details',
    'buildings': 'Building & Wing Explorer',
    'properties': 'Units & Property Management',
    'property-detail': 'Property Unit Dossier',
    'tasks': 'Task Board & Kanban',
    'timeline': 'Schedule & Gantt Timeline',
    'site-update': 'Site Progress Log',
    'gallery': 'Photo Gallery',
    'delivery': 'Delivery Forecasting Engine',
    'customizations': 'Customization Requests',
    'inspections': 'Quality Audits & Snagging',
    'handovers': 'Handover Clearance',
    'customers': 'Customer Directory',
    'users': 'Team & Role Governance',
    'reports': 'Reports & Executive Analytics',
    'settings': 'System Settings',
    'notifications': 'In-App Notifications'
  };

  const readableViewName = viewReadableNames[requestedView] || requestedView;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl border border-rose-200 shadow-lg overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 border-b border-rose-900/50 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-medium border border-rose-500/30 mb-2">
                  <Lock className="w-3 h-3" /> Security Access Restricted
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Access Denied
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  You do not have administrative clearance to access the <strong className="text-white">{readableViewName}</strong> module.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Detail Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Authorization Context
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Logged-in User</span>
                <strong className="text-slate-900 font-semibold">{currentUser.name}</strong>
                <span className="text-slate-400 text-[11px] block">{currentUser.email}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Assigned Role</span>
                <strong className="text-slate-900 font-semibold capitalize">{role.replace('_', ' ')}</strong>
                <span className="text-slate-400 text-[11px] block">{currentRoleMeta.portalName}</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {currentRoleMeta.description}
            </p>
          </div>

          {/* Permitted Roles Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700">
              Clearance Policy for "{readableViewName}":
            </h3>
            <p className="text-xs text-slate-500">
              Under enterprise data isolation rules, this screen is restricted strictly to the following authorized profile(s):
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {authorizedRoles.map(r => {
                const meta = ROLE_META_DATA[r];
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{meta ? meta.portalName : r}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => onNavigate(defaultDashboard)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {currentRoleMeta.portalName}</span>
            </button>

            <div className="text-xs text-slate-500 text-center sm:text-right">
              Need access? Contact your Arthi Construction administrator.
            </div>
          </div>

          {/* Demo Testing Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 bg-slate-50/70 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> Prototype Test: Switch to Authorized Profile
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Demo Mode</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableUsers.map(user => {
                const isUserSelected = user.id === currentUser.id;
                const canAccess = ROLE_ALLOWED_VIEWS[user.role]?.includes(requestedView);
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user);
                      if (canAccess) {
                        onNavigate(requestedView);
                      } else {
                        onNavigate(getDefaultDashboardForRole(user.role));
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isUserSelected 
                        ? 'bg-slate-200/60 border-slate-300 font-semibold' 
                        : canAccess 
                        ? 'bg-white hover:bg-emerald-50/50 border-emerald-200 text-slate-800' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</div>
                    </div>
                    {canAccess ? (
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        Can Access
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Restricted
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
