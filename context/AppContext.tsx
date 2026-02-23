
import { createContext } from 'react';
import { Animal, AnimalCategory, Task, User, SiteLogEntry, Incident, FirstAidLogEntry, OrganisationProfile, Contact, SortOption, TimeLogEntry, HolidayRequest, SystemPreferences } from '../types';

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  animals: Animal[];
  tasks: Task[];
  siteLogs: SiteLogEntry[];
  incidents: Incident[];
  firstAidLogs: FirstAidLogEntry[];
  timeLogs: TimeLogEntry[];
  holidayRequests: HolidayRequest[];
  foodOptions: Record<AnimalCategory, string[]>;
  feedMethods: Record<AnimalCategory, string[]>;
  eventTypes: string[];
  locations: string[];
  contacts: Contact[];
  orgProfile: OrganisationProfile | null;
  systemPreferences: SystemPreferences;
  sortOption: SortOption;
  isOrderLocked: boolean;
  activeShift: TimeLogEntry | null;
  isOffline: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  setSortOption: (opt: SortOption) => void;
  toggleOrderLock: (locked: boolean) => void;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  
  // Data Mutations
  updateAnimal: (animal: Animal) => void;
  addAnimal: (animal: Animal) => void;
  deleteAnimal: (id: string) => void;
  reorderAnimals: (animals: Animal[]) => void;
  
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  
  addSiteLog: (log: SiteLogEntry) => void;
  deleteSiteLog: (id: string) => void;
  
  addIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  deleteIncident: (id: string) => void;
  
  addFirstAid: (log: FirstAidLogEntry) => void;
  deleteFirstAid: (id: string) => void;
  
  updateUsers: (users: User[]) => void;
  
  updateFoodOptions: (opts: Record<AnimalCategory, string[]>) => void;
  updateFeedMethods: (methods: Record<AnimalCategory, string[]>) => void;
  updateEventTypes: (types: string[]) => void;
  updateLocations: (locs: string[]) => void;
  updateContacts: (contacts: Contact[]) => void;
  updateOrgProfile: (profile: OrganisationProfile) => void;
  updateSystemPreferences: (prefs: SystemPreferences) => void;
  
  addHoliday: (req: HolidayRequest) => void;
  updateHoliday: (req: HolidayRequest) => void;
  deleteHoliday: (id: string) => void;
  deleteTimeLog: (id: string) => void;
  
  importAnimals: (animals: Animal[]) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
