
export type SortOption = 'alpha-asc' | 'alpha-desc' | 'custom';

export enum UserRole {
  ADMIN = 'Admin',
  VOLUNTEER = 'Volunteer'
}

export enum AnimalCategory {
  OWLS = 'Owls',
  RAPTORS = 'Raptors',
  MAMMALS = 'Mammals',
  EXOTICS = 'Exotics'
}

export enum LogType {
  WEIGHT = 'Weight',
  FEED = 'Feed',
  HEALTH = 'Health',
  FLIGHT = 'Flight',
  ENRICHMENT = 'Enrichment',
  WEATHERING = 'Weathering',
  TRAINING = 'Training',
  TEMPERATURE = 'Temperature',
  MISTING = 'Misting',
  WATER = 'Water',
  EGG = 'Egg',
  GENERAL = 'General',
  MOVEMENT = 'Movement',
  EVENT = 'Event'
}

export enum HealthRecordType {
  OBSERVATION = 'Observation',
  MEDICATION = 'Medication',
  QUARANTINE = 'Quarantine',
  RELEASE = 'Release'
}

export enum HealthCondition {
  HEALTHY = 'Healthy',
  MONITORING = 'Monitoring',
  DECEASED = 'Deceased'
}

export enum HazardRating {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum ConservationStatus {
  LC = 'LC',
  NT = 'NT',
  VU = 'VU',
  EN = 'EN',
  CR = 'CR',
  EW = 'EW',
  EX = 'EX',
  DD = 'DD',
  NE = 'NE',
  NC = 'NC'
}

export enum ShellQuality {
  NORMAL = 'Normal',
  THIN = 'Thin',
  SOFT = 'Soft',
  ROUGH = 'Rough'
}

export enum EggOutcome {
  INCUBATOR = 'Incubator',
  HATCHED = 'Hatched',
  BROKEN = 'Broken',
  INFERTILE = 'Infertile'
}

export enum IncidentType {
  INJURY = 'Injury',
  SECURITY = 'Security',
  OTHER = 'Other'
}

export enum IncidentSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface UserPermissions {
  dashboard: boolean;
  dailyLog: boolean;
  tasks: boolean;
  medical: boolean;
  movements: boolean;
  safety: boolean;
  maintenance: boolean;
  settings: boolean;
  flightRecords: boolean;
  feedingSchedule: boolean;
  attendance: boolean;
  attendanceManager: boolean;
  holidayApprover: boolean;
  missingRecords: boolean;
  reports: boolean;
  rounds: boolean;
}

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole | string;
  jobPosition?: string;
  pin: string;
  active: boolean;
  permissions?: UserPermissions;
  signature?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogEntry {
  id: string;
  animalId?: string;
  date: string;
  type: LogType;
  value: string;
  notes?: string;
  timestamp: number;
  userInitials: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Type specific
  weightGrams?: number;
  feedMethod?: string;
  hasCast?: boolean;
  
  healthType?: HealthRecordType;
  condition?: HealthCondition;
  bcs?: number;
  featherCondition?: string;
  medicationName?: string;
  medicationBatch?: string;
  medicationDosage?: string;
  medicationRoute?: string;
  medicationFrequency?: string;
  medicationEndDate?: string;
  prescribedBy?: string;
  causeOfDeath?: string;
  disposalMethod?: string;

  temperature?: number;
  baskingTemp?: number;
  coolTemp?: number;
  
  weatherDesc?: string;
  windSpeed?: number;
  flightDuration?: number;
  flightQuality?: string;
  gpsUrl?: string;
  
  movementType?: 'Acquisition' | 'Disposition' | 'Transfer';
  movementSource?: string;
  movementDestination?: string;
  
  weatheringStart?: string;
  weatheringEnd?: string;
  
  eggCount?: number;
  eggWeight?: number;
  shellQuality?: ShellQuality;
  eggOutcome?: EggOutcome;

  // Event specific
  eventType?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventDuration?: number; // minutes
  eventAnimalIds?: string[];
}

export interface GlobalDocument {
  id: string;
  name: string;
  category: 'Licensing' | 'Insurance' | 'Protocol' | 'Safety';
  url: string;
  uploadDate: string;
  expiryDate?: string;
  notes?: string;
  animalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  latinName?: string;
  category: AnimalCategory;
  dob?: string;
  isDobUnknown?: boolean;
  sex?: 'Male' | 'Female' | 'Unknown';
  location: string;
  description?: string;
  specialRequirements?: string;
  criticalHusbandryNotes?: string[];
  toxicity?: string;
  imageUrl?: string;
  distributionMapUrl?: string;
  
  weightUnit: 'g' | 'oz' | 'lbs_oz';
  summerWeight?: number;
  winterWeight?: number;
  flyingWeight?: number;
  
  ringNumber?: string;
  microchip?: string;
  hasNoId?: boolean;
  
  arrivalDate?: string;
  origin?: string;
  sire?: string;
  dam?: string;
  
  isVenomous?: boolean;
  hazardRating?: HazardRating;
  redListStatus?: ConservationStatus;
  
  targetDayTemp?: number;
  targetNightTemp?: number;
  targetBaskingTemp?: number;
  targetCoolTemp?: number;
  targetHumidityMin?: number;
  targetHumidityMax?: number;
  mistingFrequency?: string;
  waterType?: string;
  
  logs?: LogEntry[]; // Optional, fetched separately or joined
  documents?: GlobalDocument[]; // Optional, fetched separately or joined
  
  archived?: boolean;
  isQuarantine?: boolean;
  quarantineStartDate?: string;
  quarantineReason?: string;
  displayOrder?: number;
  isGroup?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  type: LogType;
  animalId?: string;
  dueDate?: string;
  completed: boolean;
  recurring: boolean;
  assignedTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteLogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  cost?: number;
  loggedBy: string;
  timestamp: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Incident {
  id: string;
  date: string;
  time: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  status: string;
  reportedBy: string;
  timestamp: number;
  actionsTaken?: string;
  animalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FirstAidLogEntry {
  id: string;
  date: string;
  time: string;
  personName: string;
  type: 'Injury' | 'Illness' | 'Near Miss';
  description: string;
  treatment: string;
  treatedBy: string;
  location: string;
  outcome: 'Returned to Work' | 'Restricted Duties' | 'Sent Home' | 'GP Visit' | 'Hospital' | 'Ambulance Called' | 'Refused Treatment' | 'Monitoring' | 'None';
  timestamp: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeLogEntry {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  date: string;
  status: 'Active' | 'Completed';
  endTime?: number;
  durationMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HolidayRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface OrganisationProfile {
  name: string;
  address: string;
  licenceNumber: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  websiteUrl: string;
  adoptionUrl: string;
}

export interface SystemPreferences {
  unitSystem: 'Metric' | 'Imperial';
  tempUnit: 'C' | 'F';
  dashboardDensity: 'Compact' | 'Standard' | 'Comfortable';
  brandColour: string;
  sessionTimeoutMinutes: number;
  autoPurgeDays: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  userId?: string;
  details: string;
  createdAt?: string;
}

export interface LocalBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  retentionCount: number;
}

export interface LocalBackupEntry {
  id: string;
  timestamp: number;
  size: number;
  data: string;
}
