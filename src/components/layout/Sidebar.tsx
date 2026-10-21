import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getDefaultDashboardForRole, ROLE_META_DATA } from '../../services/permissions';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Home,
  KanbanSquare,
  CalendarDays,
  Camera,
  Clock,
  Sliders,
  ClipboardCheck,
  Award,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  Sparkles,
  FileText,
  LogOut,
  Compass,
  HardHat,
  Play
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed
}) => {
  const { role, currentUser, logout } = useAuth();
  const { customizations, tasks } = useData();

  // Metrics for badges
  const pendingCustomizations = customizations.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;

  const roleMeta = ROLE_META_DATA[role] || ROLE_META_DATA.admin;

  // 1. Admin Portal Navigation Groups
  const adminNavGroups: NavGroup[] = [
    {
      title: 'Core Portfolio',
      items: [
        { id: 'admin-dashboard', label: 'Executive Command Center', icon: LayoutDashboard },
        { id: 'map-view', label: 'GIS Map & Hierarchy', icon: Compass },
        { id: 'projects', label: 'Projects & Sites', icon: Building2 },
        { id: 'buildings', label: 'Building Explorer', icon: Layers },
        { id: 'properties', label: 'Units & Properties', icon: Home }
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'tasks', label: 'Task Kanban', icon: KanbanSquare, badge: blockedTasks > 0 ? blockedTasks : undefined, badgeColor: 'bg-rose-500' },
        { id: 'timeline', label: 'Schedule & Timeline', icon: CalendarDays },
        { id: 'site-update', label: 'Site Daily Log', icon: FileText },
        { id: 'gallery', label: 'Photo Gallery', icon: Camera }
      ]
    },
    {
      title: 'Delivery & QA',
      items: [
        { id: 'delivery', label: 'Delivery Forecast', icon: Clock },
        { 
          id: 'customizations', 
          label: 'Customizations', 
          icon: Sliders, 
          badge: pendingCustomizations > 0 ? pendingCustomizations : undefined, 
          badgeColor: 'bg-amber-500' 
        },
        { id: 'inspections', label: 'Quality Inspections', icon: ClipboardCheck },
        { id: 'handovers', label: 'Handover Clearance', icon: Award }
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'customers', label: 'Customer Directory', icon: Users },
        { id: 'users', label: 'Team & Roles', icon: ShieldCheck },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings }
      ]
    }
  ];

  // 2. Project Manager Portal Navigation Groups
  const pmNavGroups: NavGroup[] = [
    {
      title: 'Project Management',
      items: [
        { id: 'pm-dashboard', label: 'PM Dashboard', icon: LayoutDashboard },
        { id: 'map-view', label: 'Assigned Locations', icon: Compass },
        { id: 'projects', label: 'My Assigned Projects', icon: Building2 },
        { id: 'properties', label: 'Managed Units', icon: Home }
      ]
    },
    {
      title: 'Schedules & Field',
      items: [
        { id: 'tasks', label: 'Task Kanban', icon: KanbanSquare, badge: blockedTasks > 0 ? blockedTasks : undefined, badgeColor: 'bg-rose-500' },
        { id: 'timeline', label: 'Gantt Schedule', icon: CalendarDays },
        { id: 'gallery', label: 'Site Photos', icon: Camera },
        { id: 'site-update', label: 'Daily Field Log', icon: FileText }
      ]
    },
    {
      title: 'Governance & Delivery',
      items: [
        { 
          id: 'customizations', 
          label: 'Customization Review', 
          icon: Sliders, 
          badge: pendingCustomizations > 0 ? pendingCustomizations : undefined, 
          badgeColor: 'bg-amber-500' 
        },
        { id: 'inspections', label: 'Quality Sign-Offs', icon: ClipboardCheck },
        { id: 'delivery', label: 'Delivery Forecast', icon: Clock },
        { id: 'handovers', label: 'Handover Clearance', icon: Award },
        { id: 'reports', label: 'Project Reports', icon: BarChart3 }
      ]
    }
  ];

  // 3. Site Coordinator Portal Navigation Groups
  const coordinatorNavGroups: NavGroup[] = [
    {
      title: 'Field Operations',
      items: [
        { id: 'coordinator-dashboard', label: 'Coordinator Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'My Supervised Sites', icon: Building2 },
        { id: 'tasks', label: 'Today\'s Task Checklist', icon: Play, badge: blockedTasks > 0 ? blockedTasks : undefined, badgeColor: 'bg-rose-500' },
        { id: 'site-update', label: 'Site Progress Log', icon: FileText }
      ]
    },
    {
      title: 'Field Media & Quality',
      items: [
        { id: 'gallery', label: 'Upload Site Photos', icon: Camera },
        { id: 'inspections', label: 'Quality Punch-Lists', icon: ClipboardCheck },
        { id: 'notifications', label: 'Site Alerts', icon: Sparkles }
      ]
    }
  ];

  // 4. Customer / Client Portal Navigation Groups
  const customerNavGroups: NavGroup[] = [
    {
      title: 'My Residence',
      items: [
        { id: 'customer-portal', label: 'My Property Portal', icon: Home },
        { id: 'timeline', label: 'Construction Milestones', icon: CalendarDays },
        { id: 'gallery', label: 'Site Photographs', icon: Camera },
        { id: 'customizations', label: 'Customization Requests', icon: Sliders },
        { id: 'handovers', label: 'Possession Certificate', icon: Award },
        { id: 'notifications', label: 'Alerts & Messages', icon: Sparkles }
      ]
    }
  ];

  // Pick navigation groups based on active role
  const activeNavGroups: NavGroup[] = 
    role === 'admin' ? adminNavGroups :
    role === 'project_manager' ? pmNavGroups :
    role === 'site_coordinator' ? coordinatorNavGroups : customerNavGroups;

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Role-Specific Portal Header Badge */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          {role === 'customer' ? (
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          ) : role === 'project_manager' ? (
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : role === 'site_coordinator' ? (
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <HardHat className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          )}

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${roleMeta.badgeTextColor}`}>
                {roleMeta.portalName}
              </span>
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {activeNavGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                {group.title}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              // Handle dashboard aliases
              const isItemActive = 
                currentView === item.id || 
                (item.id === 'admin-dashboard' && currentView === 'dashboard') ||
                (item.id === 'pm-dashboard' && currentView === 'dashboard') ||
                (item.id === 'coordinator-dashboard' && currentView === 'dashboard') ||
                (item.id === 'dashboard' && (currentView === 'admin-dashboard' || currentView === 'pm-dashboard' || currentView === 'coordinator-dashboard'));

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isItemActive
                      ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={() => onNavigate('home')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Visit Public Website & Portfolio"
        >
          <Home className="w-4 h-4 shrink-0 text-amber-400" />
          {!collapsed && <span>Public Portfolio</span>}
        </button>

        <button
          onClick={() => {
            logout();
            onNavigate('home');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/30 hover:border-rose-600 transition-all cursor-pointer shadow-xs"
          title="Logout of ArthiBuild"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="px-1 pt-1.5 text-[11px] text-slate-500 border-t border-slate-800/60 flex items-center justify-between font-mono">
            <span>ArthiBuild CMS</span>
            <span className="text-[10px] text-slate-500 font-sans">Role Secured</span>
          </div>
        )}
      </div>
    </aside>
  );
};
