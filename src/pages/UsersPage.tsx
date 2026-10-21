import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, CheckCircle2, Lock, ArrowRight, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface UsersPageProps {
  onNavigate: (view: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const { availableUsers, currentUser, switchUser } = useAuth();

  const roleDefinitions: { role: UserRole; title: string; permissions: string[] }[] = [
    {
      role: 'admin',
      title: 'Admin — Arthi',
      permissions: [
        'Full portfolio access (all projects and units)',
        'Create, edit, and delete projects and buildings',
        'Configure construction finishing packages (A, B, C, D)',
        'Manage team members, coordinators, and contractors',
        'Execute final possession signoffs and handovers'
      ]
    },
    {
      role: 'project_manager',
      title: 'Project Manager',
      permissions: [
        'Manage assigned construction projects and schedules',
        'Create and assign tasks with dependencies',
        'Verify submitted milestone completions and approve progress',
        'Review customer customization requests and quote cost/delay',
        'Conduct and sign off quality audits'
      ]
    },
    {
      role: 'site_coordinator',
      title: 'Site Coordinator',
      permissions: [
        'View assigned active job sites and property units',
        'Fast daily site progress logging and checklist updates',
        'Upload site photographs with browser local previews',
        'Flag blocked tasks, supply shortages, and material delays'
      ]
    },
    {
      role: 'customer',
      title: 'Customer (Homebuyer)',
      permissions: [
        'Access strictly assigned property unit portal',
        'Track contractual milestones and PM-verified progress',
        'View site photographs and estimated delivery countdown',
        'Submit customization requests and approve/decline quotes'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>User Roles & Access Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access matrix and demo account profile switcher
          </p>
        </div>
      </div>

      {/* Demo Advisory Banner */}
      <div className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs space-y-1">
        <div className="text-amber-400 font-bold flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>Demo Authentication Architecture</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          ArthiBuild employs client-side role-based routing and permissions for rapid evaluation without third-party credentials. Switch between roles below to experience the system from the perspective of an executive, project lead, field engineer, or property customer.
        </p>
      </div>

      {/* Active Demo Users Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Configured Demo User Profiles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableUsers.map(user => {
            const isCurrent = user.id === currentUser.id;
            const roleDef = roleDefinitions.find(r => r.role === user.role);

            return (
              <div
                key={user.id}
                className={`p-5 rounded-xl border bg-white shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isCurrent ? 'border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-6 h-6 m-2.5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{user.title}</p>
                        <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-700">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Active Role
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600 font-mono">
                    <div>Email: <strong className="text-slate-800">{user.email}</strong></div>
                    <div>Phone: <strong className="text-slate-800">{user.phone}</strong></div>
                  </div>

                  {roleDef && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700">Privilege Scope:</div>
                      <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc pl-4">
                        {roleDef.permissions.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {isCurrent ? (
                    <div className="w-full py-2 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Currently Logged In</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        switchUser(user);
                        if (user.role === 'customer') {
                          onNavigate('customer-portal');
                        } else {
                          onNavigate('dashboard');
                        }
                      }}
                      className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <span>Switch to this Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
