import { UserRole, UserProfile, ConstructionProject, Property } from '../types';

export const ROLE_ALLOWED_VIEWS: Record<UserRole, string[]> = {
  admin: [
    'dashboard',
    'admin-dashboard',
    'map-view',
    'hierarchy',
    'projects',
    'project-detail',
    'buildings',
    'properties',
    'property-detail',
    'tasks',
    'timeline',
    'site-update',
    'gallery',
    'delivery',
    'customizations',
    'inspections',
    'handovers',
    'customers',
    'users',
    'reports',
    'settings',
    'notifications',
    'customer-portal'
  ],
  project_manager: [
    'dashboard',
    'pm-dashboard',
    'map-view',
    'hierarchy',
    'projects',
    'project-detail',
    'buildings',
    'properties',
    'property-detail',
    'tasks',
    'timeline',
    'site-update',
    'gallery',
    'delivery',
    'customizations',
    'inspections',
    'handovers',
    'reports',
    'notifications'
  ],
  site_coordinator: [
    'dashboard',
    'coordinator-dashboard',
    'projects',
    'project-detail',
    'buildings',
    'properties',
    'property-detail',
    'tasks',
    'site-update',
    'gallery',
    'inspections',
    'notifications'
  ],
  customer: [
    'dashboard',
    'customer-portal',
    'timeline',
    'gallery',
    'customizations',
    'notifications',
    'handovers',
    'property-detail'
  ]
};

export const ROLE_DEFAULT_DASHBOARDS: Record<UserRole, string> = {
  admin: 'admin-dashboard',
  project_manager: 'pm-dashboard',
  site_coordinator: 'coordinator-dashboard',
  customer: 'customer-portal'
};

export function hasViewPermission(role: UserRole, view: string): boolean {
  if (view === 'home' || view === 'login') return true;
  if (role === 'admin') return true;
  const allowed = ROLE_ALLOWED_VIEWS[role] || [];
  return allowed.includes(view);
}

export function getDefaultDashboardForRole(role: UserRole): string {
  return ROLE_DEFAULT_DASHBOARDS[role] || 'dashboard';
}

export interface RoleMeta {
  role: UserRole;
  title: string;
  portalName: string;
  badgeColor: string;
  badgeTextColor: string;
  description: string;
  scopeDescription: string;
}

export const ROLE_META_DATA: Record<UserRole, RoleMeta> = {
  admin: {
    role: 'admin',
    title: 'Managing Director / Administrator',
    portalName: 'Admin Portal',
    badgeColor: 'bg-purple-950/80 border-purple-700/60',
    badgeTextColor: 'text-purple-300',
    description: 'Full portfolio-wide administrative control, multi-state oversight, budgeting, team assignments, and system settings.',
    scopeDescription: 'Full portfolio across all States, Cities, and Sites'
  },
  project_manager: {
    role: 'project_manager',
    title: 'Principal Project Manager',
    portalName: 'Project Manager Portal',
    badgeColor: 'bg-blue-950/80 border-blue-700/60',
    badgeTextColor: 'text-blue-300',
    description: 'Delivery estimation, task milestone sign-off, customization pricing review, and scheduling across assigned projects.',
    scopeDescription: 'Assigned construction projects & associated properties'
  },
  site_coordinator: {
    role: 'site_coordinator',
    title: 'Lead Site Civil Coordinator',
    portalName: 'Site Coordinator Portal',
    badgeColor: 'bg-amber-950/80 border-amber-700/60',
    badgeTextColor: 'text-amber-300',
    description: 'Daily field tasks, construction progress logging, field photo uploads, and punch-list inspections for assigned sites.',
    scopeDescription: 'Assigned construction sites & permitted daily tasks'
  },
  customer: {
    role: 'customer',
    title: 'Verified Home Buyer',
    portalName: 'Client Portal',
    badgeColor: 'bg-emerald-950/80 border-emerald-700/60',
    badgeTextColor: 'text-emerald-300',
    description: 'Personalized private property progress, customization requests, milestone updates, and possession certification.',
    scopeDescription: 'Own private registered property and location dossier'
  }
};

/**
 * Filter projects according to user's assigned role and location scope
 */
export function getScopedProjects(user: UserProfile, allProjects: ConstructionProject[]): ConstructionProject[] {
  if (!user || user.role === 'admin') return allProjects;

  const assignedSet = new Set(user.assignedProjectIds || []);

  if (user.role === 'project_manager') {
    return allProjects.filter(p => assignedSet.has(p.id) || p.projectManagerId === user.id);
  }

  if (user.role === 'site_coordinator') {
    return allProjects.filter(p => assignedSet.has(p.id) || p.assignedCoordinatorIds?.includes(user.id));
  }

  if (user.role === 'customer') {
    return allProjects.filter(p => assignedSet.has(p.id));
  }

  return allProjects;
}

/**
 * Filter properties according to user's assigned role and property ownership
 */
export function getScopedProperties(user: UserProfile, allProperties: Property[], allProjects?: ConstructionProject[]): Property[] {
  if (!user || user.role === 'admin') return allProperties;

  if (user.role === 'customer') {
    const targetPropertyId = user.assignedPropertyId || 'PROP-EH-A301';
    return allProperties.filter(p => p.id === targetPropertyId || p.customerId === user.id);
  }

  const assignedSet = new Set(user.assignedProjectIds || []);
  const scopedProjects = allProjects ? getScopedProjects(user, allProjects) : [];
  const scopedProjIds = new Set(scopedProjects.map(p => p.id));

  if (user.role === 'project_manager') {
    return allProperties.filter(p => scopedProjIds.has(p.projectId) || assignedSet.has(p.projectId));
  }

  if (user.role === 'site_coordinator') {
    return allProperties.filter(p => 
      scopedProjIds.has(p.projectId) || 
      p.assignedCoordinatorId === user.id || 
      assignedSet.has(p.projectId)
    );
  }

  return allProperties;
}

/**
 * Action permission validation
 */
export function canPerformAction(
  user: UserProfile, 
  action: 'manage_projects' | 'manage_users' | 'verify_milestones' | 'quote_customizations' | 'decide_customization' | 'sign_handover' | 'edit_settings'
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  switch (action) {
    case 'manage_projects':
    case 'manage_users':
    case 'edit_settings':
      return false;
    case 'verify_milestones':
    case 'quote_customizations':
      return user.role === 'project_manager';
    case 'decide_customization':
      return user.role === 'customer';
    case 'sign_handover':
      return user.role === 'project_manager';
    default:
      return false;
  }
}
