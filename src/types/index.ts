export type UserRole = 'admin' | 'project_manager' | 'site_coordinator' | 'customer';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  demoPassword?: string;
  role: UserRole;
  phone: string;
  title: string;
  assignedProjectIds?: string[];
  assignedPropertyId?: string; // For customer role
  avatarUrl?: string;
}

export type ProjectType = 'Apartment Complex' | 'Villa Community' | 'Individual Villa' | 'Independent House';

export type ProjectStatus = 'Planning' | 'In Progress' | 'Finishing' | 'Handover Phase' | 'Completed' | 'Delayed';

export interface BuildingWing {
  id: string;
  projectId: string;
  name: string; // e.g. "Tower A", "North Wing", "Block 1"
  floorsCount: number;
  totalUnits: number;
}

export interface FloorInfo {
  id: string;
  buildingId: string;
  floorNumber: number; // 0 = Ground, 1 = 1st, etc.
  floorName: string; // e.g., "Ground Floor", "Level 4"
}

export interface ConstructionActivity {
  id: string;
  name: string;
  stageId: number;
  stageName: string;
  description: string;
  defaultDurationDays: number;
  isMandatoryForPackageA: boolean; // Structure Only
  isMandatoryForPackageB: boolean; // Semi-Finished
  isMandatoryForPackageC: boolean; // Fully Finished
}

export type PackageType = 'Package A: Structure Only' | 'Package B: Semi-Finished' | 'Package C: Fully Finished' | 'Package D: Custom Package';

export type PropertyStatus = 
  | 'Planning' 
  | 'Foundation' 
  | 'Structure' 
  | 'Masonry' 
  | 'Plastering' 
  | 'Services' 
  | 'Finishing' 
  | 'Quality Inspection' 
  | 'Ready for Handover' 
  | 'Handed Over';

export interface Property {
  id: string; // e.g. "PROP-EH-A101"
  unitNumber: string; // e.g. "A-101", "Villa 12", "House 4B"
  projectId: string;
  projectName: string;
  siteName?: string;
  state: string;
  city: string;
  locality: string;
  buildingId?: string;
  buildingName?: string;
  floorNumber?: number;
  propertyType: 'Apartment' | 'Villa' | 'Independent House';
  areaSqFt: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  packageType: PackageType;
  packageDescription: string;
  includedActivities: string[]; // Activity IDs included in contract
  excludedActivities: string[]; // Activity IDs explicitly excluded
  originalCommittedDate: string; // YYYY-MM-DD
  currentEstimatedDate: string; // YYYY-MM-DD
  status: PropertyStatus;
  assignedCoordinatorId: string;
  assignedCoordinatorName: string;
  overallProgress: number; // 0-100% calculated
  verifiedProgress: number; // 0-100% verified by PM
  delayDays: number;
  delayReason?: string;
  handoverDate?: string;
  handoverRemarks?: string;
  createdAt: string;
}

export interface ConstructionProject {
  id: string;
  name: string;
  code: string; // e.g. "EH-2026"
  type: ProjectType;
  state: string; // e.g. "Tamil Nadu", "Karnataka"
  city: string; // e.g. "Chennai", "Coimbatore", "Bengaluru"
  locality: string; // e.g. "OMR - Sholinganallur", "Anna Nagar West"
  location: string; // combined display location e.g. "OMR Tech Corridor, Chennai"
  address: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  projectManagerId: string;
  projectManagerName: string;
  assignedCoordinatorIds: string[];
  startDate: string;
  plannedCompletionDate: string;
  status: ProjectStatus;
  totalUnits: number;
  buildings: BuildingWing[];
  coverImage?: string;
  progress: number;
}

export interface LocationFilterState {
  state: string; // 'all' or specific state name
  city: string; // 'all' or specific city name
  locality: string; // 'all' or specific locality name
  projectId: string; // 'all' or specific project/site ID
  propertyType: string; // 'all' or specific property type
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Awaiting Approval' | 'Blocked' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ConstructionTask {
  id: string;
  title: string;
  description: string;
  stageId: number;
  stageName: string;
  activityId: string;
  projectId: string;
  propertyId: string; // Belongs to specific property unit
  unitNumber: string;
  assignedTo: string; // Contractor or Engineer name
  assignedToPhone?: string;
  plannedStartDate: string;
  plannedFinishDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[]; // Task IDs that must be completed first
  weight: number; // Weight in progress calculation (1-10)
  completionPercentage?: number; // Measured completion percentage (0 - 100)
  buildingId?: string; // Optional building/wing ID for apartment complexes
  progressNotes: string[];
  photoUrls: string[];
  approvalStatus: 'Pending Verification' | 'Verified by PM' | 'Requires Rework';
  approvedBy?: string;
  approvedAt?: string;
  isCustomizationImpact?: boolean;
  blockedReason?: string;
}

export interface ConstructionPhoto {
  id: string;
  projectId: string;
  projectName: string;
  propertyId: string;
  unitNumber: string;
  stageId: number;
  stageName: string;
  taskId?: string;
  caption: string;
  notes: string;
  photoUrl: string; // Local base64 data URL
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
}

export type CustomizationStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Awaiting Customer Approval' 
  | 'Approved' 
  | 'Rejected' 
  | 'Completed';

export type CustomizationCategory = 
  | 'Flooring' 
  | 'Painting' 
  | 'Lighting' 
  | 'Electrical Points' 
  | 'Kitchen' 
  | 'Bathroom Fixtures' 
  | 'Interior Design' 
  | 'Other';

export interface CustomizationRequest {
  id: string;
  propertyId: string;
  unitNumber: string;
  projectId: string;
  customerId: string;
  customerName: string;
  category: CustomizationCategory;
  title: string;
  description: string;
  referenceImageUrl?: string;
  requestDate: string;
  status: CustomizationStatus;
  estimatedCost: number; // in currency INR / USD
  scheduleImpactDays: number; // days added to delivery forecast
  managerRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  customerApprovedAt?: string;
  customerRemarks?: string;
  appliedToSchedule: boolean;
}

export interface InspectionChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'Pass' | 'Fail' | 'Not Applicable' | 'Pending';
  remarks?: string;
  defectPhotoUrl?: string;
  correctiveAction?: string;
  assignedTo?: string;
  reinspectedAt?: string;
  isMandatory: boolean;
}

export interface QualityInspection {
  id: string;
  propertyId: string;
  unitNumber: string;
  projectId: string;
  inspectionType: 'Pre-Plastering' | 'Pre-Flooring' | 'Electrical & Plumbing' | 'Pre-Handover Snagging' | 'Final Clearance';
  scheduledDate: string;
  completedDate?: string;
  inspectorName: string;
  status: 'Scheduled' | 'In Progress' | 'Passed' | 'Failed with Defects' | 'Reinspected & Cleared';
  items: InspectionChecklistItem[];
  overallRemarks?: string;
  signOffDate?: string;
  signedOffBy?: string;
}

export interface HandoverRecord {
  id: string;
  propertyId: string;
  unitNumber: string;
  projectId: string;
  customerName: string;
  customerEmail: string;
  packageType: PackageType;
  readyDate: string;
  handoverDate?: string;
  status: 'Pending Clearance' | 'Ready for Signoff' | 'Handed Over';
  allTasksCompleted: boolean;
  mandatoryInspectionsPassed: boolean;
  zeroDefectsRemaining: boolean;
  clearanceNotes: string;
  handoverCertificateId?: string;
  keyHandoverPhotoUrl?: string;
  signedByCustomer?: string;
  signedByRepresentative?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  category: 'milestone' | 'delay' | 'customization' | 'inspection' | 'handover' | 'system';
  targetRoles: UserRole[];
  propertyId?: string;
  projectId?: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface DeliveryForecastLog {
  id: string;
  propertyId: string;
  calculatedAt: string;
  previousEstimatedDate: string;
  newEstimatedDate: string;
  varianceDays: number;
  reason: string;
  triggerEvent: string;
}
