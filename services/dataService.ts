
import { supabase } from './supabaseClient';
import { Animal, AnimalCategory, Task, User, UserRole, SiteLogEntry, Contact, OrganisationProfile, Incident, FirstAidLogEntry, TimeLogEntry, GlobalDocument, AuditLogEntry, LocalBackupConfig, LocalBackupEntry, HolidayRequest, SystemPreferences, LogEntry } from '../types';
import { DEFAULT_FOOD_OPTIONS, DEFAULT_FEED_METHODS, MOCK_ANIMALS, DEFAULT_SYSTEM_PREFERENCES, DEFAULT_EVENT_TYPES, DEFAULT_LOCAL_BACKUP_CONFIG } from '../constants';
import { RealtimeChannel } from '@supabase/supabase-js';

export const DEFAULT_USERS: User[] = [
    { 
        id: '00000000-0000-0000-0000-000000000001', name: 'Duty Manager', initials: 'DM', role: UserRole.ADMIN, pin: '8888',
        jobPosition: 'Duty Manager',
        active: true,
        permissions: { 
            dashboard: true, dailyLog: true, tasks: true, medical: true, movements: true, 
            safety: true, maintenance: true, settings: true,
            flightRecords: true, feedingSchedule: true, attendance: true, attendanceManager: true, 
            holidayApprover: true, missingRecords: true, reports: true, rounds: true
        }
    },
    { 
        id: '00000000-0000-0000-0000-000000000002', name: 'Bird Team', initials: 'BT', role: UserRole.VOLUNTEER, pin: '1234',
        jobPosition: 'Keeper',
        active: true,
        permissions: { 
            dashboard: true, dailyLog: true, tasks: true, medical: false, movements: false, 
            safety: false, maintenance: true, settings: false,
            flightRecords: true, feedingSchedule: false, attendance: true, attendanceManager: false, 
            holidayApprover: false, missingRecords: false, reports: false, rounds: true
        }
    }
];

const CACHE_KEYS = {
    ANIMALS: 'koa_cache_animals_v2',
    TASKS: 'koa_cache_tasks_v2',
    USERS: 'koa_cache_users_v2',
    SITE_LOGS: 'koa_cache_site_logs_v2',
    INCIDENTS: 'koa_cache_incidents_v2',
    FIRST_AID: 'koa_cache_first_aid_v2',
    TIME_LOGS: 'koa_cache_time_logs_v2',
    HOLIDAYS: 'koa_cache_holidays_v2',
    SETTINGS: 'koa_cache_settings_prefix_v2_'
};

const getLocal = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

const setLocal = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn("Storage full, attempting to clear non-critical cache...");
            localStorage.removeItem(CACHE_KEYS.SITE_LOGS);
            localStorage.removeItem(CACHE_KEYS.FIRST_AID);
            localStorage.removeItem(CACHE_KEYS.TIME_LOGS);
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (retryError) {
                console.warn(`Cache quota exceeded for ${key}. Item will not be cached offline.`);
            }
        } else {
            console.warn("Storage unavailable", e);
        }
    }
};

const handleSupabaseError = (error: any, context: string) => {
    if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.code === '42P01') {
        console.warn(`[Statutory Records] Table for ${context} is pending creation.`);
        return true; 
    }
    console.error(`[Supabase Critical] ${context}:`, error);
    return false;
};

// Helper to ensure ID is a valid UUID
const ensureUuid = (id: string): string => {
    if (!id) return crypto.randomUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
    
    // Create a deterministic UUID from any string
    // This ensures that the same legacy ID always maps to the same UUID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert hash to a hex string and pad/truncate to 32 chars
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // We use a fixed prefix and the hash to create a valid UUID format
    const padded = `000000000000000000000000${hex}`.slice(-32);
    
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
};

// Helper to convert camelCase to snake_case for DB
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      let value = obj[key];
      
      // Special handling for IDs during migration/save
      if ((key === 'id' || key.endsWith('Id') || key.endsWith('_id')) && value != null && typeof value !== 'boolean') {
          value = ensureUuid(String(value));
      }
      
      result[snakeKey] = toSnakeCase(value);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper to convert snake_case to camelCase from DB
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const dataService = {
    subscribeToAnimals: (onUpdate: (eventType: string, animal: Animal | string) => void): RealtimeChannel => {
        return supabase
            .channel('animals-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, async (payload) => {
                if (payload.eventType === 'DELETE') {
                    onUpdate('DELETE', payload.old.id);
                } else {
                    // Fetch full animal with logs and documents
                    const { data } = await supabase
                        .from('animals')
                        .select('*, animal_logs(*), global_documents(*)')
                        .eq('id', payload.new.id)
                        .single();
                    if (data) {
                        const animal = toCamelCase(data);
                        animal.logs = animal.animalLogs || [];
                        delete animal.animalLogs;
                        animal.documents = animal.globalDocuments || [];
                        delete animal.globalDocuments;
                        onUpdate(payload.eventType, animal as Animal);
                    }
                }
            })
            .subscribe();
    },

    fetchAnimals: async (): Promise<Animal[]> => {
        try {
            const { data, error } = await supabase
                .from('animals')
                .select('*, animal_logs(*), global_documents(*)');
            
            if (error) throw error;
            
            const animals = (data || []).map((row: any) => {
                const animal = toCamelCase(row);
                animal.logs = animal.animalLogs || [];
                delete animal.animalLogs;
                animal.documents = animal.globalDocuments || [];
                delete animal.globalDocuments;
                return animal;
            });
            
            // Strip heavy nested data before caching to prevent QuotaExceededError
            const lightweightAnimals = animals.map((a: any) => ({
                id: a.id,
                name: a.name,
                species: a.species,
                category: a.category,
                location: a.location,
                imageUrl: a.imageUrl,
                ringNumber: a.ringNumber,
                microchip: a.microchip,
                archived: a.archived,
                isGroup: a.isGroup,
                displayOrder: a.displayOrder,
                // Omit heavy text fields like description, criticalHusbandryNotes, logs, documents
                logs: [],
                documents: []
            }));
            
            setLocal(CACHE_KEYS.ANIMALS, lightweightAnimals);
            return animals;
        } catch (e) {
            handleSupabaseError(e, 'fetchAnimals');
            return getLocal(CACHE_KEYS.ANIMALS, MOCK_ANIMALS);
        }
    },

    saveAnimal: async (animal: Animal): Promise<void> => {
        try {
            const { logs, documents, globalDocuments, ...animalData } = animal as any;
            const dbAnimal = toSnakeCase(animalData);
            dbAnimal.updated_at = new Date().toISOString();

            const { error } = await supabase.from('animals').upsert(dbAnimal);
            if (error) throw error;

            // Handle logs separately if provided
            if (logs && logs.length > 0) {
                const animalUuid = ensureUuid(String(animal.id));
                const dbLogs = logs.map(l => ({ 
                    ...toSnakeCase(l), 
                    animal_id: animalUuid 
                }));
                const { error: logsError } = await supabase.from('animal_logs').upsert(dbLogs);
                if (logsError) throw logsError;
            }
        } catch (error) {
            handleSupabaseError(error, 'saveAnimal');
            throw error;
        }
    },

    saveAnimalsBulk: async (animals: Animal[]): Promise<void> => {
        try {
            const dbAnimals = animals.map(a => {
                const { logs, documents, globalDocuments, ...animalData } = a as any;
                return { ...toSnakeCase(animalData), updated_at: new Date().toISOString() };
            });
            const { error } = await supabase.from('animals').upsert(dbAnimals);
            if (error) throw error;

            // Bulk save logs
            const allLogs = animals.flatMap(a => {
                const animalUuid = ensureUuid(String(a.id));
                return (a.logs || []).map((l, idx) => {
                    const log = { ...l };
                    // Ensure logs have a deterministic ID to prevent duplicates on multiple migrations
                    if (!log.id) {
                        log.id = `log_${animalUuid}_${log.timestamp || log.date || idx}_${log.type || 'unknown'}`;
                    }
                    return { 
                        ...toSnakeCase(log), 
                        animal_id: animalUuid 
                    };
                });
            });
            
            if (allLogs.length > 0) {
                const { error: logsError } = await supabase.from('animal_logs').upsert(allLogs);
                if (logsError) throw logsError;
            }
        } catch (error) {
            handleSupabaseError(error, 'saveAnimalsBulk');
            throw error;
        }
    },

    deleteAnimal: async (id: string): Promise<void> => {
        const { error } = await supabase.from('animals').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteAnimal');
    },

    fetchUsers: async (): Promise<User[]> => {
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            
            if (data && data.length > 0) {
                const users = data.map(row => {
                    const camel = toCamelCase(row);
                    // Fallback for old schema where data was in 'json' column
                    if (row.json && !camel.pin) {
                        return { ...toCamelCase(row.json), id: row.id };
                    }
                    return camel;
                });
                setLocal(CACHE_KEYS.USERS, users);
                return users;
            } else {
                // Seed database with default users if empty
                console.log('[DataService] Seeding default users...');
                await dataService.saveUsers(DEFAULT_USERS);
                setLocal(CACHE_KEYS.USERS, DEFAULT_USERS);
                return DEFAULT_USERS;
            }
        } catch (e) {
            handleSupabaseError(e, 'fetchUsers');
            return getLocal(CACHE_KEYS.USERS, DEFAULT_USERS);
        }
    },

    saveUsers: async (users: User[]): Promise<void> => {
        const rows = users.map(u => {
            const snake = toSnakeCase(u);
            
            // Handle legacy data where user details might be in a 'json' field
            const legacyData = (u as any).json || {};
            
            const row = {
                ...snake,
                name: snake.name || legacyData.name || 'Unknown User',
                initials: snake.initials || legacyData.initials || '??',
                role: snake.role || legacyData.role || 'Volunteer',
                pin: snake.pin || legacyData.pin || '1234', // Default PIN for legacy users
                updated_at: new Date().toISOString()
            };
            
            return row;
        });
        const { error } = await supabase.from('users').upsert(rows);
        if (error) throw error;
    },

    importAnimals: async (animals: Animal[]): Promise<void> => {
        await dataService.saveAnimalsBulk(animals);
    },

    fetchTasks: async (): Promise<Task[]> => {
        try {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) throw error;
            const tasks = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.TASKS, tasks);
            return tasks;
        } catch (e) {
            handleSupabaseError(e, 'fetchTasks');
            return getLocal(CACHE_KEYS.TASKS, []);
        }
    },

    saveTasks: async (tasks: Task[]): Promise<void> => {
        const rows = tasks.map(t => ({ ...toSnakeCase(t), updated_at: new Date().toISOString() }));
        const { error } = await supabase.from('tasks').upsert(rows);
        if (error) throw error;
    },
    
    deleteTask: async (id: string): Promise<void> => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    },

    fetchSiteLogs: async (): Promise<SiteLogEntry[]> => {
        try {
            const { data, error } = await supabase.from('site_logs').select('*');
            if (error) throw error;
            const logs = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.SITE_LOGS, logs);
            return logs;
        } catch (e) {
            handleSupabaseError(e, 'fetchSiteLogs');
            return getLocal(CACHE_KEYS.SITE_LOGS, []);
        }
    },

    saveSiteLog: async (log: SiteLogEntry): Promise<void> => {
        const { error } = await supabase.from('site_logs').upsert({ ...toSnakeCase(log), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteSiteLog: async (id: string): Promise<void> => {
        const { error } = await supabase.from('site_logs').delete().eq('id', id);
        if (error) throw error;
    },

    fetchIncidents: async (): Promise<Incident[]> => {
        try {
            const { data, error } = await supabase.from('incidents').select('*');
            if (error) throw error;
            const incidents = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.INCIDENTS, incidents);
            return incidents;
        } catch (e) {
            handleSupabaseError(e, 'fetchIncidents');
            return getLocal(CACHE_KEYS.INCIDENTS, []);
        }
    },

    saveIncident: async (incident: Incident): Promise<void> => {
        const { error } = await supabase.from('incidents').upsert({ ...toSnakeCase(incident), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteIncident: async (id: string): Promise<void> => {
        const { error } = await supabase.from('incidents').delete().eq('id', id);
        if (error) throw error;
    },

    fetchFirstAidLogs: async (): Promise<FirstAidLogEntry[]> => {
        try {
            const { data, error } = await supabase.from('first_aid_logs').select('*');
            if (error) throw error;
            const logs = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.FIRST_AID, logs);
            return logs;
        } catch (e) {
            handleSupabaseError(e, 'fetchFirstAidLogs');
            return getLocal(CACHE_KEYS.FIRST_AID, []);
        }
    },

    saveFirstAidLog: async (log: FirstAidLogEntry): Promise<void> => {
        const { error } = await supabase.from('first_aid_logs').upsert({ ...toSnakeCase(log), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteFirstAidLog: async (id: string): Promise<void> => {
        const { error } = await supabase.from('first_aid_logs').delete().eq('id', id);
        if (error) throw error;
    },

    fetchTimeLogs: async (): Promise<TimeLogEntry[]> => {
        try {
            const { data, error } = await supabase.from('time_logs').select('*');
            if (error) throw error;
            const logs = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.TIME_LOGS, logs);
            return logs;
        } catch (e) {
            handleSupabaseError(e, 'fetchTimeLogs');
            return getLocal(CACHE_KEYS.TIME_LOGS, []);
        }
    },

    saveTimeLog: async (log: TimeLogEntry): Promise<void> => {
        const { error } = await supabase.from('time_logs').upsert({ ...toSnakeCase(log), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteTimeLog: async (id: string): Promise<void> => {
        const { error } = await supabase.from('time_logs').delete().eq('id', id);
        if (error) throw error;
    },

    fetchHolidayRequests: async (): Promise<HolidayRequest[]> => {
        try {
            const { data, error } = await supabase.from('holiday_requests').select('*');
            if (error) throw error;
            const logs = (data || []).map(toCamelCase);
            setLocal(CACHE_KEYS.HOLIDAYS, logs);
            return logs;
        } catch (e) {
            handleSupabaseError(e, 'fetchHolidayRequests');
            return getLocal(CACHE_KEYS.HOLIDAYS, []);
        }
    },

    saveHolidayRequest: async (req: HolidayRequest): Promise<void> => {
        const { error } = await supabase.from('holiday_requests').upsert({ ...toSnakeCase(req), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteHolidayRequest: async (id: string): Promise<void> => {
        const { error } = await supabase.from('holiday_requests').delete().eq('id', id);
        if (error) throw error;
    },

    fetchGlobalDocuments: async (): Promise<GlobalDocument[]> => {
        const { data, error } = await supabase.from('global_documents').select('*');
        if (error) { handleSupabaseError(error, 'fetchGlobalDocuments'); return []; }
        return (data || []).map(toCamelCase);
    },

    saveGlobalDocument: async (doc: GlobalDocument): Promise<void> => {
        const { error } = await supabase.from('global_documents').upsert({ ...toSnakeCase(doc), updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    deleteGlobalDocument: async (id: string): Promise<void> => {
        const { error } = await supabase.from('global_documents').delete().eq('id', id);
        if (error) throw error;
    },

    fetchAuditLogs: async (): Promise<AuditLogEntry[]> => {
        const { data, error } = await supabase.from('audit_logs').select('*');
        if (error) { handleSupabaseError(error, 'fetchAuditLogs'); return []; }
        return (data || []).map(toCamelCase);
    },

    saveAuditLog: async (entry: AuditLogEntry): Promise<void> => {
        const { error } = await supabase.from('audit_logs').upsert({ ...toSnakeCase(entry), created_at: new Date().toISOString() });
        if (error) throw error;
    },

    fetchLocalBackups: async (): Promise<LocalBackupEntry[]> => {
        // Local backups might still use the old JSON format for simplicity, or we update it.
        // Let's keep it as JSON in the DB since it's just a dump.
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'local_backups').single();
        if (error && error.code !== 'PGRST116') { handleSupabaseError(error, 'fetchLocalBackups'); return []; }
        return data ? data.value : [];
    },

    saveLocalBackup: async (entry: LocalBackupEntry): Promise<void> => {
        const backups = await dataService.fetchLocalBackups();
        backups.push(entry);
        await dataService.saveSettingsKey('local_backups', backups);
    },

    deleteLocalBackup: async (id: string): Promise<void> => {
        const backups = await dataService.fetchLocalBackups();
        const filtered = backups.filter(b => b.id !== id);
        await dataService.saveSettingsKey('local_backups', filtered);
    },

    fetchSettingsKey: async (key: string, defaultValue: any): Promise<any> => {
        try {
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
            if (error && error.code !== 'PGRST116') throw error;
            const value = data ? data.value : defaultValue;
            setLocal(`${CACHE_KEYS.SETTINGS}${key}`, value);
            return value;
        } catch (e) {
            handleSupabaseError(e, `fetchSettings:${key}`);
            return getLocal(`${CACHE_KEYS.SETTINGS}${key}`, defaultValue);
        }
    },

    saveSettingsKey: async (key: string, value: any): Promise<void> => {
        const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) throw error;
    },

    fetchFoodOptions: async () => dataService.fetchSettingsKey('food_options', DEFAULT_FOOD_OPTIONS),
    saveFoodOptions: async (val: any) => dataService.saveSettingsKey('food_options', val),

    fetchFeedMethods: async () => dataService.fetchSettingsKey('feed_methods', DEFAULT_FEED_METHODS),
    saveFeedMethods: async (val: any) => dataService.saveSettingsKey('feed_methods', val),

    fetchEventTypes: async () => dataService.fetchSettingsKey('event_types', DEFAULT_EVENT_TYPES),
    saveEventTypes: async (val: string[]) => dataService.saveSettingsKey('event_types', val),

    fetchLocations: async () => dataService.fetchSettingsKey('locations', []),
    saveLocations: async (val: string[]) => dataService.saveSettingsKey('locations', val),

    fetchContacts: async () => dataService.fetchSettingsKey('contacts', []),
    saveContacts: async (val: Contact[]) => dataService.saveSettingsKey('contacts', val),

    fetchOrgProfile: async () => dataService.fetchSettingsKey('org_profile', null),
    saveOrgProfile: async (val: OrganisationProfile) => dataService.saveSettingsKey('org_profile', val),

    fetchLocalBackupConfig: async (): Promise<LocalBackupConfig> => dataService.fetchSettingsKey('local_backup_config', DEFAULT_LOCAL_BACKUP_CONFIG),
    saveLocalBackupConfig: async (val: LocalBackupConfig) => dataService.saveSettingsKey('local_backup_config', val),

    fetchSystemPreferences: async (): Promise<SystemPreferences> => dataService.fetchSettingsKey('system_preferences', DEFAULT_SYSTEM_PREFERENCES),
    saveSystemPreferences: async (val: SystemPreferences) => dataService.saveSettingsKey('system_preferences', val),
};
