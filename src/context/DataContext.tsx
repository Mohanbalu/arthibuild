import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  PackageType,
  PropertyStatus,
  TaskStatus
} from '../types';
import { StorageService } from '../services/storage';
import { STANDARD_ACTIVITIES, PACKAGE_DEFINITIONS } from '../constants/constructionData';
import { calculatePropertyDeliveryForecast, calculatePropertyProgress } from '../services/estimationEngine';
import { addDays, format, parseISO } from 'date-fns';

interface DataContextType {
  projects: ConstructionProject[];
  properties: Property[];
  tasks: ConstructionTask[];
  photos: ConstructionPhoto[];
  customizations: CustomizationRequest[];
  inspections: QualityInspection[];
  handovers: HandoverRecord[];
  notifications: InAppNotification[];
  forecastLogs: DeliveryForecastLog[];
  
  // Project Actions
  addProject: (project: Omit<ConstructionProject, 'id' | 'progress'>) => ConstructionProject;
  updateProject: (id: string, updates: Partial<ConstructionProject>) => void;
  deleteProject: (id: string) => void;

  // Property Actions
  addProperty: (property: Omit<Property, 'id' | 'overallProgress' | 'verifiedProgress' | 'delayDays' | 'createdAt'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Task Actions
  addTask: (task: Omit<ConstructionTask, 'id' | 'approvalStatus' | 'progressNotes' | 'photoUrls'>) => ConstructionTask;
  updateTask: (id: string, updates: Partial<ConstructionTask>) => { success: boolean; error?: string };
  verifyTaskMilestone: (id: string, verifiedBy: string) => void;
  deleteTask: (id: string) => void;

  // Photo Actions
  addPhoto: (photo: Omit<ConstructionPhoto, 'id' | 'uploadedAt'>) => void;
  deletePhoto: (id: string) => void;

  // Customization Workflow
  submitCustomization: (request: Omit<CustomizationRequest, 'id' | 'requestDate' | 'status' | 'appliedToSchedule'>) => void;
  reviewCustomization: (id: string, estimatedCost: number, scheduleImpactDays: number, managerRemarks: string, reviewerName: string) => void;
  customerDecisionCustomization: (id: string, decision: 'Approved' | 'Rejected', customerRemarks: string) => void;

  // Quality Inspection
  createInspection: (inspection: Omit<QualityInspection, 'id' | 'status' | 'items'>, itemTitles?: string[]) => QualityInspection;
  updateInspectionItem: (inspectionId: string, itemId: string, updates: { status: 'Pass' | 'Fail' | 'Not Applicable'; remarks?: string; defectPhotoUrl?: string }) => void;
  signOffInspection: (inspectionId: string, signOffBy: string, remarks?: string) => void;

  // Handover Workflow
  createHandoverRecord: (propertyId: string) => HandoverRecord;
  executeHandover: (handoverId: string, customerSignName: string, repSignName: string) => void;

  // Notifications
  addNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Data Management
  resetDemoData: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => { success: boolean; message: string };
  recalculateAllForecasts: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  StorageService.init();

  const [projects, setProjects] = useState<ConstructionProject[]>(() => StorageService.getProjects());
  const [properties, setProperties] = useState<Property[]>(() => StorageService.getProperties());
  const [tasks, setTasks] = useState<ConstructionTask[]>(() => StorageService.getTasks());
  const [photos, setPhotos] = useState<ConstructionPhoto[]>(() => StorageService.getPhotos());
  const [customizations, setCustomizations] = useState<CustomizationRequest[]>(() => StorageService.getCustomizations());
  const [inspections, setInspections] = useState<QualityInspection[]>(() => StorageService.getInspections());
  const [handovers, setHandovers] = useState<HandoverRecord[]>(() => StorageService.getHandovers());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => StorageService.getNotifications());
  const [forecastLogs, setForecastLogs] = useState<DeliveryForecastLog[]>(() => StorageService.getForecastLogs());

  // Save to localStorage when state changes
  useEffect(() => { StorageService.saveProjects(projects); }, [projects]);
  useEffect(() => { StorageService.saveProperties(properties); }, [properties]);
  useEffect(() => { StorageService.saveTasks(tasks); }, [tasks]);
  useEffect(() => { StorageService.savePhotos(photos); }, [photos]);
  useEffect(() => { StorageService.saveCustomizations(customizations); }, [customizations]);
  useEffect(() => { StorageService.saveInspections(inspections); }, [inspections]);
  useEffect(() => { StorageService.saveHandovers(handovers); }, [handovers]);
  useEffect(() => { StorageService.saveNotifications(notifications); }, [notifications]);
  useEffect(() => { StorageService.saveForecastLogs(forecastLogs); }, [forecastLogs]);

  // Notification helper
  const addNotification = useCallback((notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: InAppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Recalculate property progress and delivery forecasts
  const syncPropertyProgressAndForecast = useCallback((targetPropertyId: string) => {
    setProperties(prevProps => {
      return prevProps.map(prop => {
        if (prop.id !== targetPropertyId) return prop;

        const propTasks = tasks.filter(t => t.propertyId === prop.id);
        const { overallProgress, verifiedProgress } = calculatePropertyProgress(prop, propTasks);
        const forecast = calculatePropertyDeliveryForecast(prop, propTasks, customizations);

        // Derive updated status if not already handed over
        let updatedStatus: PropertyStatus = prop.status;
        if (prop.status !== 'Handed Over') {
          if (overallProgress === 100) {
            updatedStatus = 'Ready for Handover';
          } else if (overallProgress >= 90) {
            updatedStatus = 'Quality Inspection';
          } else if (overallProgress >= 70) {
            updatedStatus = 'Finishing';
          } else if (overallProgress >= 50) {
            updatedStatus = 'Services';
          } else if (overallProgress >= 30) {
            updatedStatus = 'Masonry';
          } else if (overallProgress >= 15) {
            updatedStatus = 'Structure';
          } else if (overallProgress > 0) {
            updatedStatus = 'Foundation';
          }
        }

        return {
          ...prop,
          overallProgress,
          verifiedProgress,
          status: updatedStatus,
          currentEstimatedDate: forecast.calculatedEstimatedDate,
          delayDays: Math.max(0, forecast.varianceFromCommittedDays),
          delayReason: forecast.primaryDelayReason
        };
      });
    });
  }, [tasks, customizations]);

  // Project Actions
  const addProject = (projectData: Omit<ConstructionProject, 'id' | 'progress'>): ConstructionProject => {
    const id = `PRJ-${String(projects.length + 1).padStart(2, '0')}`;
    const newProject: ConstructionProject = {
      ...projectData,
      id,
      progress: 0
    };
    setProjects(prev => [...prev, newProject]);
    addNotification({
      title: 'New Construction Project Registered',
      message: `Project "${newProject.name}" (${newProject.type}) has been created at ${newProject.location}.`,
      category: 'system',
      targetRoles: ['admin', 'project_manager'],
      projectId: newProject.id
    });
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<ConstructionProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setProperties(prev => prev.filter(p => p.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  // Property Actions with auto-generation of package-specific construction tasks
  const addProperty = (propertyData: Omit<Property, 'id' | 'overallProgress' | 'verifiedProgress' | 'delayDays' | 'createdAt'>): Property => {
    const id = `PROP-${Date.now().toString(36).toUpperCase()}`;
    const newProperty: Property = {
      ...propertyData,
      id,
      overallProgress: 0,
      verifiedProgress: 0,
      delayDays: 0,
      createdAt: format(new Date(), 'yyyy-MM-dd')
    };

    // Auto-generate construction tasks based on the selected package & included activities
    const generatedTasks: ConstructionTask[] = [];
    const activitiesToGenerate = STANDARD_ACTIVITIES.filter(act => 
      newProperty.includedActivities.includes(act.id)
    );

    let rollingStartDate = parseISO(newProperty.createdAt);

    activitiesToGenerate.forEach((act, idx) => {
      const plannedFinish = addDays(rollingStartDate, act.defaultDurationDays);
      const taskId = `TSK-${id}-${idx + 1}`;
      const prevTaskId = idx > 0 ? `TSK-${id}-${idx}` : undefined;

      generatedTasks.push({
        id: taskId,
        title: `${act.name} (${newProperty.unitNumber})`,
        description: act.description,
        stageId: act.stageId,
        stageName: act.stageName,
        activityId: act.id,
        projectId: newProperty.projectId,
        propertyId: id,
        unitNumber: newProperty.unitNumber,
        assignedTo: 'Arthi Project Team',
        plannedStartDate: format(rollingStartDate, 'yyyy-MM-dd'),
        plannedFinishDate: format(plannedFinish, 'yyyy-MM-dd'),
        status: idx === 0 ? 'In Progress' : 'Not Started',
        priority: act.stageId <= 3 ? 'Critical' : 'Medium',
        dependencies: prevTaskId ? [prevTaskId] : [],
        weight: act.stageId <= 3 ? 12 : 7,
        progressNotes: [`Task automatically scheduled for ${newProperty.packageType}.`],
        photoUrls: [],
        approvalStatus: 'Pending Verification'
      });

      // Increment rolling start date
      rollingStartDate = addDays(plannedFinish, 1);
    });

    setProperties(prev => [...prev, newProperty]);
    setTasks(prev => [...prev, ...generatedTasks]);

    addNotification({
      title: 'New Property Unit Registered',
      message: `${newProperty.unitNumber} registered under ${newProperty.packageType} for customer ${newProperty.customerName}. Generated ${generatedTasks.length} contractual tasks.`,
      category: 'milestone',
      targetRoles: ['admin', 'project_manager', 'site_coordinator'],
      propertyId: id,
      projectId: newProperty.projectId
    });

    return newProperty;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.propertyId !== id));
    setPhotos(prev => prev.filter(ph => ph.propertyId !== id));
  };

  // Task Actions with dependency validation
  const addTask = (taskData: Omit<ConstructionTask, 'id' | 'approvalStatus' | 'progressNotes' | 'photoUrls'>): ConstructionTask => {
    const id = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const newTask: ConstructionTask = {
      ...taskData,
      id,
      approvalStatus: 'Pending Verification',
      progressNotes: ['Task created in schedule.'],
      photoUrls: []
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<ConstructionTask>): { success: boolean; error?: string } => {
    const existing = tasks.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Task not found' };

    // Dependency validation: cannot complete task if prerequisite dependencies are not completed
    if (updates.status === 'Completed' && existing.dependencies && existing.dependencies.length > 0) {
      const incompletePrereqs = tasks.filter(t => 
        existing.dependencies.includes(t.id) && t.status !== 'Completed'
      );
      if (incompletePrereqs.length > 0) {
        return {
          success: false,
          error: `Cannot complete task: Prerequisite task "${incompletePrereqs[0].title}" is still ${incompletePrereqs[0].status}. Please complete dependencies first.`
        };
      }
    }

    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.status === 'Completed' && !updated.actualCompletionDate) {
          updated.actualCompletionDate = format(new Date(), 'yyyy-MM-dd');
        }
        return updated;
      });
      return next;
    });

    // Notify if blocked
    if (updates.status === 'Blocked') {
      addNotification({
        title: 'Task Blocked Alert',
        message: `Task "${existing.title}" is blocked: ${updates.blockedReason || 'Prerequisite / material delay'}.`,
        category: 'delay',
        targetRoles: ['admin', 'project_manager'],
        propertyId: existing.propertyId,
        projectId: existing.projectId
      });
    }

    // Trigger sync for property
    setTimeout(() => {
      syncPropertyProgressAndForecast(existing.propertyId);
    }, 50);

    return { success: true };
  };

  const verifyTaskMilestone = (id: string, verifiedBy: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: 'Completed',
        approvalStatus: 'Verified by PM',
        approvedBy: verifiedBy,
        approvedAt: format(new Date(), 'yyyy-MM-dd')
      };
    }));

    addNotification({
      title: 'Milestone Verified by PM',
      message: `Task "${task.title}" verified and approved by ${verifiedBy}.`,
      category: 'milestone',
      targetRoles: ['customer', 'site_coordinator'],
      propertyId: task.propertyId,
      projectId: task.projectId
    });

    setTimeout(() => {
      syncPropertyProgressAndForecast(task.propertyId);
    }, 50);
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) {
      setTimeout(() => syncPropertyProgressAndForecast(task.propertyId), 50);
    }
  };

  // Photo Actions
  const addPhoto = (photoData: Omit<ConstructionPhoto, 'id' | 'uploadedAt'>) => {
    const id = `PHT-${Date.now().toString(36).toUpperCase()}`;
    const newPhoto: ConstructionPhoto = {
      ...photoData,
      id,
      uploadedAt: new Date().toISOString()
    };
    setPhotos(prev => [newPhoto, ...prev]);

    // Attach to task if taskId provided
    if (newPhoto.taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === newPhoto.taskId) {
          return {
            ...t,
            photoUrls: [...t.photoUrls, newPhoto.photoUrl]
          };
        }
        return t;
      }));
    }

    addNotification({
      title: 'Site Photograph Uploaded',
      message: `${photoData.uploadedBy} uploaded a photo for ${photoData.unitNumber} (${photoData.stageName}): "${photoData.caption}".`,
      category: 'milestone',
      targetRoles: ['customer', 'admin', 'project_manager'],
      propertyId: photoData.propertyId,
      projectId: photoData.projectId
    });
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Customization Workflow
  const submitCustomization = (requestData: Omit<CustomizationRequest, 'id' | 'requestDate' | 'status' | 'appliedToSchedule'>) => {
    const id = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const newRequest: CustomizationRequest = {
      ...requestData,
      id,
      requestDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Submitted',
      appliedToSchedule: false
    };

    setCustomizations(prev => [newRequest, ...prev]);

    addNotification({
      title: 'New Customization Request',
      message: `${newRequest.customerName} requested ${newRequest.category} change for ${newRequest.unitNumber}: "${newRequest.title}".`,
      category: 'customization',
      targetRoles: ['admin', 'project_manager'],
      propertyId: newRequest.propertyId,
      projectId: newRequest.projectId
    });
  };

  const reviewCustomization = (
    id: string, 
    estimatedCost: number, 
    scheduleImpactDays: number, 
    managerRemarks: string, 
    reviewerName: string
  ) => {
    setCustomizations(prev => prev.map(req => {
      if (req.id !== id) return req;
      return {
        ...req,
        status: 'Awaiting Customer Approval',
        estimatedCost,
        scheduleImpactDays,
        managerRemarks,
        reviewedBy: reviewerName,
        reviewedAt: format(new Date(), 'yyyy-MM-dd')
      };
    }));

    const req = customizations.find(r => r.id === id);
    if (req) {
      addNotification({
        title: 'Customization Proposal Ready for Your Review',
        message: `Your request "${req.title}" has been reviewed. Cost estimate: ₹${estimatedCost.toLocaleString()} | Schedule impact: ${scheduleImpactDays} days. Please review and approve in your portal.`,
        category: 'customization',
        targetRoles: ['customer'],
        propertyId: req.propertyId,
        projectId: req.projectId
      });
    }
  };

  const customerDecisionCustomization = (
    id: string, 
    decision: 'Approved' | 'Rejected', 
    customerRemarks: string
  ) => {
    const req = customizations.find(r => r.id === id);
    if (!req) return;

    const property = properties.find(p => p.id === req.propertyId);

    setCustomizations(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: decision,
        customerApprovedAt: decision === 'Approved' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        customerRemarks,
        appliedToSchedule: decision === 'Approved'
      };
    }));

    if (decision === 'Approved' && property) {
      // Automatically adjust property delivery forecast and log change
      const prevDate = property.currentEstimatedDate;
      const newEstimatedDate = format(
        addDays(parseISO(prevDate), req.scheduleImpactDays),
        'yyyy-MM-dd'
      );

      const newLog: DeliveryForecastLog = {
        id: `FCLOG-${Date.now()}`,
        propertyId: property.id,
        calculatedAt: new Date().toISOString(),
        previousEstimatedDate: prevDate,
        newEstimatedDate,
        varianceDays: req.scheduleImpactDays,
        reason: `Customer approved customization (${req.title}) adding ${req.scheduleImpactDays} days for execution.`,
        triggerEvent: `Customization Approved (${req.id})`
      };

      setForecastLogs(prev => [newLog, ...prev]);

      // Update property
      setProperties(prev => prev.map(p => {
        if (p.id !== property.id) return p;
        return {
          ...p,
          currentEstimatedDate: newEstimatedDate,
          delayDays: p.delayDays + req.scheduleImpactDays,
          delayReason: `Approved customization (${req.title}) added ${req.scheduleImpactDays} days.`
        };
      }));

      // Add task for the customization to tracking
      const customTask: ConstructionTask = {
        id: `TSK-CUSTOM-${Date.now().toString(36)}`,
        title: `Customization: ${req.title} (${req.category})`,
        description: `${req.description} [Approved Cost: ₹${req.estimatedCost.toLocaleString()}]`,
        stageId: 8,
        stageName: 'Flooring',
        activityId: 'ACT-CUSTOM',
        projectId: req.projectId,
        propertyId: req.propertyId,
        unitNumber: req.unitNumber,
        assignedTo: 'Specialized Contractor',
        plannedStartDate: format(new Date(), 'yyyy-MM-dd'),
        plannedFinishDate: format(addDays(new Date(), Math.max(3, req.scheduleImpactDays)), 'yyyy-MM-dd'),
        status: 'In Progress',
        priority: 'High',
        dependencies: [],
        weight: 6,
        progressNotes: [`Customization approved on ${format(new Date(), 'yyyy-MM-dd')}. Material dispatched.`],
        photoUrls: [],
        approvalStatus: 'Pending Verification',
        isCustomizationImpact: true
      };
      setTasks(prev => [...prev, customTask]);

      addNotification({
        title: 'Customization Approved & Schedule Updated',
        message: `${req.customerName} approved customization "${req.title}". Schedule adjusted by +${req.scheduleImpactDays} days. New delivery target: ${newEstimatedDate}.`,
        category: 'customization',
        targetRoles: ['admin', 'project_manager', 'site_coordinator'],
        propertyId: req.propertyId,
        projectId: req.projectId
      });
    } else {
      addNotification({
        title: 'Customization Proposal Declined',
        message: `${req.customerName} declined proposal for "${req.title}". No schedule adjustment applied.`,
        category: 'customization',
        targetRoles: ['admin', 'project_manager'],
        propertyId: req.propertyId,
        projectId: req.projectId
      });
    }
  };

  // Quality Inspection
  const createInspection = (
    inspectionData: Omit<QualityInspection, 'id' | 'status' | 'items'>, 
    itemTitles?: string[]
  ): QualityInspection => {
    const id = `INSP-${Date.now().toString(36).toUpperCase()}`;
    const defaultChecklistTitles = itemTitles || [
      'Structural and column alignment check',
      'Plastering surface level and corner vertical plumb',
      'Plumbing pipeline pressure and zero leakage test',
      'Electrical earthing continuity and insulation resistance',
      'Doors and windows locking operation and weather seal',
      'Tile hollow sound test and joint grouting inspection',
      'Wall paint sheen uniformity and zero touchup defects'
    ];

    const items = defaultChecklistTitles.map((t, idx) => ({
      id: `CHK-${id}-${idx + 1}`,
      category: 'General',
      title: t,
      description: 'Comprehensive multi-point tolerance check.',
      status: 'Pending' as const,
      isMandatory: true
    }));

    const newInspection: QualityInspection = {
      ...inspectionData,
      id,
      status: 'Scheduled',
      items
    };

    setInspections(prev => [newInspection, ...prev]);

    addNotification({
      title: 'Quality Inspection Scheduled',
      message: `${inspectionData.inspectionType} scheduled on ${inspectionData.scheduledDate} for ${inspectionData.unitNumber}.`,
      category: 'inspection',
      targetRoles: ['site_coordinator', 'project_manager', 'customer'],
      propertyId: inspectionData.propertyId,
      projectId: inspectionData.projectId
    });

    return newInspection;
  };

  const updateInspectionItem = (
    inspectionId: string, 
    itemId: string, 
    updates: { status: 'Pass' | 'Fail' | 'Not Applicable'; remarks?: string; defectPhotoUrl?: string }
  ) => {
    setInspections(prev => prev.map(insp => {
      if (insp.id !== inspectionId) return insp;
      const updatedItems = insp.items.map(it => it.id === itemId ? { ...it, ...updates } : it);
      
      const hasFails = updatedItems.some(i => i.status === 'Fail');
      const allDone = updatedItems.every(i => i.status !== 'Pending');

      let status = insp.status;
      if (allDone) {
        status = hasFails ? 'Failed with Defects' : 'Passed';
      } else {
        status = 'In Progress';
      }

      return {
        ...insp,
        items: updatedItems,
        status
      };
    }));
  };

  const signOffInspection = (inspectionId: string, signOffBy: string, remarks?: string) => {
    const insp = inspections.find(i => i.id === inspectionId);
    if (!insp) return;

    setInspections(prev => prev.map(i => {
      if (i.id !== inspectionId) return i;
      return {
        ...i,
        status: 'Passed',
        completedDate: format(new Date(), 'yyyy-MM-dd'),
        signOffDate: format(new Date(), 'yyyy-MM-dd'),
        signedOffBy: signOffBy,
        overallRemarks: remarks || i.overallRemarks
      };
    }));

    addNotification({
      title: 'Quality Inspection Passed & Signed Off',
      message: `${insp.inspectionType} for ${insp.unitNumber} signed off by ${signOffBy}. Unit cleared for handover readiness.`,
      category: 'inspection',
      targetRoles: ['admin', 'project_manager', 'customer'],
      propertyId: insp.propertyId,
      projectId: insp.projectId
    });
  };

  // Handover Workflow
  const createHandoverRecord = (propertyId: string): HandoverRecord => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) throw new Error('Property not found');

    const id = `HO-${property.id.replace('PROP-', '')}`;
    const newRecord: HandoverRecord = {
      id,
      propertyId,
      unitNumber: property.unitNumber,
      projectId: property.projectId,
      customerName: property.customerName,
      customerEmail: property.customerEmail,
      packageType: property.packageType,
      readyDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Ready for Signoff',
      allTasksCompleted: property.overallProgress >= 95,
      mandatoryInspectionsPassed: true,
      zeroDefectsRemaining: true,
      clearanceNotes: 'All contractual milestones verified, statutory certificates received, zero snagging defects.'
    };

    setHandovers(prev => [newRecord, ...prev.filter(h => h.propertyId !== propertyId)]);
    return newRecord;
  };

  const executeHandover = (handoverId: string, customerSignName: string, repSignName: string) => {
    const record = handovers.find(h => h.id === handoverId);
    if (!record) return;

    const certId = `CERT-ARTHI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    setHandovers(prev => prev.map(h => {
      if (h.id !== handoverId) return h;
      return {
        ...h,
        status: 'Handed Over',
        handoverDate: todayStr,
        handoverCertificateId: certId,
        signedByCustomer: customerSignName,
        signedByRepresentative: repSignName
      };
    }));

    // Update Property status to Handed Over
    setProperties(prev => prev.map(p => {
      if (p.id !== record.propertyId) return p;
      return {
        ...p,
        status: 'Handed Over',
        handoverDate: todayStr,
        handoverRemarks: `Formal key handover executed. Possession certificate #${certId} granted to ${customerSignName}.`
      };
    }));

    addNotification({
      title: 'Property Handed Over Successfully! 🎉',
      message: `Formal possession of ${record.unitNumber} granted to ${customerSignName}. Certificate #${certId} issued.`,
      category: 'handover',
      targetRoles: ['admin', 'project_manager', 'site_coordinator', 'customer'],
      propertyId: record.propertyId,
      projectId: record.projectId
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const resetDemoData = () => {
    StorageService.resetDemoData();
    setProjects(StorageService.getProjects());
    setProperties(StorageService.getProperties());
    setTasks(StorageService.getTasks());
    setPhotos(StorageService.getPhotos());
    setCustomizations(StorageService.getCustomizations());
    setInspections(StorageService.getInspections());
    setHandovers(StorageService.getHandovers());
    setNotifications(StorageService.getNotifications());
    setForecastLogs(StorageService.getForecastLogs());
  };

  const exportJSON = () => StorageService.exportDataJSON();

  const importJSON = (json: string) => {
    const res = StorageService.importDataJSON(json);
    if (res.success) {
      setProjects(StorageService.getProjects());
      setProperties(StorageService.getProperties());
      setTasks(StorageService.getTasks());
      setPhotos(StorageService.getPhotos());
      setCustomizations(StorageService.getCustomizations());
      setInspections(StorageService.getInspections());
      setHandovers(StorageService.getHandovers());
      setNotifications(StorageService.getNotifications());
      setForecastLogs(StorageService.getForecastLogs());
    }
    return res;
  };

  const recalculateAllForecasts = () => {
    properties.forEach(p => syncPropertyProgressAndForecast(p.id));
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        properties,
        tasks,
        photos,
        customizations,
        inspections,
        handovers,
        notifications,
        forecastLogs,
        addProject,
        updateProject,
        deleteProject,
        addProperty,
        updateProperty,
        deleteProperty,
        addTask,
        updateTask,
        verifyTaskMilestone,
        deleteTask,
        addPhoto,
        deletePhoto,
        submitCustomization,
        reviewCustomization,
        customerDecisionCustomization,
        createInspection,
        updateInspectionItem,
        signOffInspection,
        createHandoverRecord,
        executeHandover,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetDemoData,
        exportJSON,
        importJSON,
        recalculateAllForecasts
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
