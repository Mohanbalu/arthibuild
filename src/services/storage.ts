import { 
  ConstructionProject, 
  Property, 
  ConstructionTask, 
  ConstructionPhoto, 
  CustomizationRequest, 
  QualityInspection, 
  HandoverRecord, 
  InAppNotification, 
  DeliveryForecastLog,
  UserProfile 
} from '../types';
import { 
  DEMO_USERS, 
  INITIAL_PROJECTS, 
  INITIAL_PROPERTIES, 
  INITIAL_TASKS, 
  INITIAL_PHOTOS, 
  INITIAL_CUSTOMIZATIONS, 
  INITIAL_INSPECTIONS, 
  INITIAL_HANDOVERS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_FORECAST_LOGS 
} from './seedData';

const STORAGE_KEYS = {
  PROJECTS: 'arthibuild_projects_v1',
  PROPERTIES: 'arthibuild_properties_v1',
  TASKS: 'arthibuild_tasks_v1',
  PHOTOS: 'arthibuild_photos_v1',
  CUSTOMIZATIONS: 'arthibuild_customizations_v1',
  INSPECTIONS: 'arthibuild_inspections_v1',
  HANDOVERS: 'arthibuild_handovers_v1',
  NOTIFICATIONS: 'arthibuild_notifications_v1',
  FORECAST_LOGS: 'arthibuild_forecast_logs_v1',
  AUTH_SESSION: 'arthibuild_auth_session_v1',
  CUSTOM_PACKAGES: 'arthibuild_custom_packages_v1'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  // Initialization
  init(): void {
    const storedProjects = safeGet<ConstructionProject[]>(STORAGE_KEYS.PROJECTS, []);
    const hasAndhraTelangana = storedProjects.some(p => p.state === 'Andhra Pradesh' || p.state === 'Telangana');
    if (!storedProjects || storedProjects.length === 0 || !storedProjects[0]?.state || storedProjects.length < INITIAL_PROJECTS.length || !hasAndhraTelangana) {
      safeSet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    }
    const storedProperties = safeGet<Property[]>(STORAGE_KEYS.PROPERTIES, []);
    const propHasAndhraTelangana = storedProperties.some(p => p.state === 'Andhra Pradesh' || p.state === 'Telangana');
    if (!storedProperties || storedProperties.length === 0 || !storedProperties[0]?.state || storedProperties.length < INITIAL_PROPERTIES.length || !propHasAndhraTelangana) {
      safeSet(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
    }
    const storedTasks = safeGet<ConstructionTask[]>(STORAGE_KEYS.TASKS, []);
    if (!storedTasks || storedTasks.length === 0 || storedTasks.length < INITIAL_TASKS.length) {
      safeSet(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PHOTOS)) {
      safeSet(STORAGE_KEYS.PHOTOS, INITIAL_PHOTOS);
    }
    const storedCustomizations = safeGet<CustomizationRequest[]>(STORAGE_KEYS.CUSTOMIZATIONS, []);
    const hasReq3WithCust2 = storedCustomizations.some(c => c.id === 'REQ-CUST-003' && c.customerId === 'usr-cust-2');
    if (!storedCustomizations || storedCustomizations.length === 0 || !hasReq3WithCust2) {
      safeSet(STORAGE_KEYS.CUSTOMIZATIONS, INITIAL_CUSTOMIZATIONS);
    }
    const storedProps = safeGet<Property[]>(STORAGE_KEYS.PROPERTIES, []);
    const hasVillaCust2 = storedProps.some(p => p.id === 'PROP-GV-V01' && p.customerId === 'usr-cust-2');
    if (!hasVillaCust2) {
      safeSet(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
      safeSet(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HANDOVERS)) {
      safeSet(STORAGE_KEYS.HANDOVERS, INITIAL_HANDOVERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FORECAST_LOGS)) {
      safeSet(STORAGE_KEYS.FORECAST_LOGS, INITIAL_FORECAST_LOGS);
    }
    // Clean up legacy auto-login key if exists
    localStorage.removeItem('arthibuild_current_user_v1');
  },

  // Projects
  getProjects(): ConstructionProject[] {
    return safeGet<ConstructionProject[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  },
  saveProjects(projects: ConstructionProject[]): void {
    safeSet(STORAGE_KEYS.PROJECTS, projects);
  },

  // Properties
  getProperties(): Property[] {
    return safeGet<Property[]>(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
  },
  saveProperties(properties: Property[]): void {
    safeSet(STORAGE_KEYS.PROPERTIES, properties);
  },

  // Tasks
  getTasks(): ConstructionTask[] {
    return safeGet<ConstructionTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },
  saveTasks(tasks: ConstructionTask[]): void {
    safeSet(STORAGE_KEYS.TASKS, tasks);
  },

  // Photos
  getPhotos(): ConstructionPhoto[] {
    return safeGet<ConstructionPhoto[]>(STORAGE_KEYS.PHOTOS, INITIAL_PHOTOS);
  },
  savePhotos(photos: ConstructionPhoto[]): void {
    safeSet(STORAGE_KEYS.PHOTOS, photos);
  },

  // Customizations
  getCustomizations(): CustomizationRequest[] {
    return safeGet<CustomizationRequest[]>(STORAGE_KEYS.CUSTOMIZATIONS, INITIAL_CUSTOMIZATIONS);
  },
  saveCustomizations(customizations: CustomizationRequest[]): void {
    safeSet(STORAGE_KEYS.CUSTOMIZATIONS, customizations);
  },

  // Inspections
  getInspections(): QualityInspection[] {
    return safeGet<QualityInspection[]>(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS);
  },
  saveInspections(inspections: QualityInspection[]): void {
    safeSet(STORAGE_KEYS.INSPECTIONS, inspections);
  },

  // Handovers
  getHandovers(): HandoverRecord[] {
    return safeGet<HandoverRecord[]>(STORAGE_KEYS.HANDOVERS, INITIAL_HANDOVERS);
  },
  saveHandovers(handovers: HandoverRecord[]): void {
    safeSet(STORAGE_KEYS.HANDOVERS, handovers);
  },

  // Notifications
  getNotifications(): InAppNotification[] {
    return safeGet<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifications: InAppNotification[]): void {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Forecast Logs
  getForecastLogs(): DeliveryForecastLog[] {
    return safeGet<DeliveryForecastLog[]>(STORAGE_KEYS.FORECAST_LOGS, INITIAL_FORECAST_LOGS);
  },
  saveForecastLogs(logs: DeliveryForecastLog[]): void {
    safeSet(STORAGE_KEYS.FORECAST_LOGS, logs);
  },

  // Auth Session Management
  getAuthSession(): UserProfile | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!item) return null;
      return JSON.parse(item) as UserProfile;
    } catch {
      return null;
    }
  },
  saveAuthSession(user: UserProfile | null): void {
    if (user) {
      safeSet(STORAGE_KEYS.AUTH_SESSION, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  },
  clearAuthSession(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  },

  // Backward compatibility
  getCurrentUser(): UserProfile | null {
    return this.getAuthSession();
  },
  setCurrentUser(user: UserProfile | null): void {
    this.saveAuthSession(user);
  },

  // Reset to initial demo seeds
  resetDemoData(): void {
    safeSet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    safeSet(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
    safeSet(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    safeSet(STORAGE_KEYS.PHOTOS, INITIAL_PHOTOS);
    safeSet(STORAGE_KEYS.CUSTOMIZATIONS, INITIAL_CUSTOMIZATIONS);
    safeSet(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS);
    safeSet(STORAGE_KEYS.HANDOVERS, INITIAL_HANDOVERS);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    safeSet(STORAGE_KEYS.FORECAST_LOGS, INITIAL_FORECAST_LOGS);
    // Note: Do not overwrite the current user's session during data reset
  },

  // Export all application state as clean JSON
  exportDataJSON(): string {
    const fullBackup = {
      app: 'ArthiBuild',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.getProjects(),
      properties: this.getProperties(),
      tasks: this.getTasks(),
      photos: this.getPhotos(),
      customizations: this.getCustomizations(),
      inspections: this.getInspections(),
      handovers: this.getHandovers(),
      notifications: this.getNotifications(),
      forecastLogs: this.getForecastLogs()
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  // Validate and import JSON backup
  importDataJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.projects || !data.properties || !data.tasks) {
        return { success: false, message: 'Invalid backup file: missing mandatory collections (projects, properties, tasks).' };
      }

      if (Array.isArray(data.projects)) safeSet(STORAGE_KEYS.PROJECTS, data.projects);
      if (Array.isArray(data.properties)) safeSet(STORAGE_KEYS.PROPERTIES, data.properties);
      if (Array.isArray(data.tasks)) safeSet(STORAGE_KEYS.TASKS, data.tasks);
      if (Array.isArray(data.photos)) safeSet(STORAGE_KEYS.PHOTOS, data.photos);
      if (Array.isArray(data.customizations)) safeSet(STORAGE_KEYS.CUSTOMIZATIONS, data.customizations);
      if (Array.isArray(data.inspections)) safeSet(STORAGE_KEYS.INSPECTIONS, data.inspections);
      if (Array.isArray(data.handovers)) safeSet(STORAGE_KEYS.HANDOVERS, data.handovers);
      if (Array.isArray(data.notifications)) safeSet(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
      if (Array.isArray(data.forecastLogs)) safeSet(STORAGE_KEYS.FORECAST_LOGS, data.forecastLogs);

      return { success: true, message: `Successfully imported backup with ${data.projects.length} projects and ${data.properties.length} properties.` };
    } catch (err: any) {
      return { success: false, message: `Failed to parse JSON file: ${err?.message || 'Unknown error'}` };
    }
  }
};
