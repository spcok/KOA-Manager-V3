
import React, { useState, use, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { dataService, DEFAULT_USERS } from '../services/dataService';
import { 
  Animal, AnimalCategory, Task, User, SiteLogEntry, Incident, 
  FirstAidLogEntry, OrganisationProfile, Contact, SortOption, TimeLogEntry, 
  HolidayRequest, SystemPreferences, LogType 
} from '../types';
import { DEFAULT_FOOD_OPTIONS, DEFAULT_FEED_METHODS, DEFAULT_SYSTEM_PREFERENCES, DEFAULT_EVENT_TYPES } from '../constants';
import { getFullWeather } from '../services/weatherService';

// --- Resource Loading ---
const FETCH_TIMEOUT = 30000; // 30s timeout for critical data (increased for large datasets)

const withTimeout = <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => {
            console.warn("[AppProvider] Fetch timeout reached, using fallback.");
            resolve(fallback);
        }, FETCH_TIMEOUT))
    ]);
};

const initialDataPromise = Promise.all([
  withTimeout(dataService.fetchAnimals(), []),
  withTimeout(dataService.fetchTasks(), []),
  withTimeout(dataService.fetchUsers(), DEFAULT_USERS),
  withTimeout(dataService.fetchSiteLogs(), []),
  withTimeout(dataService.fetchIncidents(), []),
  withTimeout(dataService.fetchFirstAidLogs(), []),
  withTimeout(dataService.fetchFoodOptions(), DEFAULT_FOOD_OPTIONS),
  withTimeout(dataService.fetchFeedMethods(), DEFAULT_FEED_METHODS),
  withTimeout(dataService.fetchLocations(), []),
  withTimeout(dataService.fetchContacts(), []),
  withTimeout(dataService.fetchOrgProfile(), null),
  withTimeout(dataService.fetchTimeLogs(), []),
  withTimeout(dataService.fetchHolidayRequests(), []),
  withTimeout(dataService.fetchSettingsKey('dashboard_sort', 'alpha-asc'), 'alpha-asc'),
  withTimeout(dataService.fetchSettingsKey('dashboard_locked', true), true),
  withTimeout(dataService.fetchSystemPreferences(), DEFAULT_SYSTEM_PREFERENCES),
  withTimeout(dataService.fetchEventTypes(), DEFAULT_EVENT_TYPES)
]).catch(err => {
    console.error("Critical Data Fetch Failure:", err);
    return Array(17).fill(null); 
});

const upsert = <T extends { id: string }>(items: T[], item: T): T[] => {
    const safeItems = items || [];
    const index = safeItems.findIndex((i) => i.id === item.id);
    if (index > -1) {
        const newItems = [...safeItems];
        newItems[index] = item;
        return newItems;
    }
    return [item, ...safeItems];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialData = use(initialDataPromise);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Robust initialization with guarded fallbacks
  const [animals, setAnimals] = useState<Animal[]>(initialData[0] || []);
  const [tasks, setTasks] = useState<Task[]>(initialData[1] || []);
  const [users, setUsers] = useState<User[]>(initialData[2] || []);
  const [siteLogs, setSiteLogs] = useState<SiteLogEntry[]>(initialData[3] || []);
  const [incidents, setIncidents] = useState<Incident[]>(initialData[4] || []);
  const [firstAidLogs, setFirstAidLogs] = useState<FirstAidLogEntry[]>(initialData[5] || []);
  const [foodOptions, setFoodOptions] = useState(initialData[6] || DEFAULT_FOOD_OPTIONS);
  const [feedMethods, setFeedMethods] = useState(initialData[7] || DEFAULT_FEED_METHODS);
  const [locations, setLocations] = useState(initialData[8] || []);
  const [contacts, setContacts] = useState(initialData[9] || []);
  const [orgProfile, setOrgProfile] = useState<OrganisationProfile | null>(initialData[10] || null);
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>(initialData[11] || []);
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>(initialData[12] || []);
  const [sortOption, setSortOptionState] = useState<SortOption>(initialData[13] as SortOption || 'alpha-asc');
  const [isOrderLocked, setIsOrderLocked] = useState<boolean>(!!initialData[14]);
  const [systemPreferences, setSystemPreferences] = useState(initialData[15] || DEFAULT_SYSTEM_PREFERENCES);
  const [eventTypes, setEventTypes] = useState(initialData[16] || DEFAULT_EVENT_TYPES);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<TimeLogEntry | null>(null);

  const animalsRef = useRef(animals);
  useEffect(() => { animalsRef.current = animals; }, [animals]);

  // Connectivity Listeners
  useEffect(() => {
    setIsInitializing(false);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Weather Sync (ZLA Compliance)
  useEffect(() => {
    if (isOffline || isInitializing) return;
    
    const checkWeatherSync = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentAnimals = animalsRef.current || [];
        const owls = currentAnimals.filter(a => a.category === AnimalCategory.OWLS);
        if (owls.length === 0) return;

        const lastSync = await dataService.fetchSettingsKey('owl_weather_sync_date', '');
        if (lastSync === todayStr) return;

        const weather = await getFullWeather();
        if (!weather) return;

        const targetTimePrefix = `${todayStr}T13:00`;
        const slot = weather.hourly.find(h => h.time.startsWith(targetTimePrefix));
        
        if (slot) {
            const updatedOwls = owls.map(owl => {
                const alreadyLogged = (owl.logs || []).some(l => l.date.startsWith(targetTimePrefix) && l.type === LogType.TEMPERATURE);
                if (alreadyLogged) return owl;
                return {
                    ...owl,
                    logs: [{
                        id: `weather_sync_${new Date().toISOString()}_${crypto.randomUUID()}`,
                        date: `${targetTimePrefix}:00`,
                        type: LogType.TEMPERATURE,
                        value: `${slot.temp}°C`,
                        temperature: slot.temp,
                        weatherDesc: slot.description,
                        notes: `Statutory 13:00 Telemetry Sync`,
                        userInitials: 'SYS',
                        timestamp: Date.now()
                    }, ...(owl.logs || [])]
                };
            });
            setAnimals(prev => {
                const map = new Map(updatedOwls.map(o => [o.id, o]));
                return prev.map(a => map.get(a.id) || a);
            });
            await dataService.saveAnimalsBulk(updatedOwls);
            await dataService.saveSettingsKey('owl_weather_sync_date', todayStr);
        }
    };
    const timer = setTimeout(checkWeatherSync, 10000);
    return () => clearTimeout(timer);
  }, [isOffline, isInitializing]);

  useEffect(() => {
    if (currentUser && (timeLogs || []).length > 0) {
      const active = timeLogs.find(l => l.userId === currentUser.id && l.status === 'Active');
      setActiveShift(active || null);
    } else {
      setActiveShift(null);
    }
  }, [currentUser, timeLogs]);

  const login = (user: User) => setCurrentUser(user);
  const logout = () => {
    setCurrentUser(null);
    setActiveShift(null);
  };

  const setSortOption = (opt: SortOption) => {
    setSortOptionState(opt);
    dataService.saveSettingsKey('dashboard_sort', opt);
  };

  const toggleOrderLock = (locked: boolean) => {
    setIsOrderLocked(locked);
    dataService.saveSettingsKey('dashboard_locked', locked);
  };

  const updateAnimal = useCallback(async (animal: Animal) => {
    if (isInitializing) return;
    let oldAnimal: Animal | undefined;
    setAnimals(prev => {
        oldAnimal = (prev || []).find(a => a.id === animal.id);
        return (prev || []).map(a => a.id === animal.id ? animal : a);
    });
    try {
        await dataService.saveAnimal(animal);
    } catch (error) {
        console.error("Failed to update animal", error);
        if (oldAnimal) {
            setAnimals(prev => (prev || []).map(a => a.id === animal.id ? oldAnimal! : a));
        }
        alert("Failed to update animal. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addAnimal = useCallback(async (animal: Animal) => {
    if (isInitializing) return;
    setAnimals(prev => [...(prev || []), animal]);
    try {
        await dataService.saveAnimal(animal);
    } catch (error) {
        console.error("Failed to add animal", error);
        setAnimals(prev => (prev || []).filter(a => a.id !== animal.id));
        alert("Failed to add animal. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteAnimal = useCallback(async (id: string) => {
    if (isInitializing) return;
    let oldAnimal: Animal | undefined;
    setAnimals(prev => {
        oldAnimal = (prev || []).find(a => a.id === id);
        return (prev || []).filter(a => a.id !== id);
    });
    try {
        await dataService.deleteAnimal(id);
    } catch (error) {
        console.error("Failed to delete animal", error);
        if (oldAnimal) {
            setAnimals(prev => [...(prev || []), oldAnimal!]);
        }
        alert("Failed to delete animal. Changes have been reverted.");
    }
  }, [isInitializing]);
  
  const reorderAnimals = useCallback(async (reordered: Animal[]) => {
    if (isInitializing) return;
    let previousState: Animal[] = [];
    const updatedWithOrder = (reordered || []).map((a, idx) => ({ ...a, displayOrder: idx }));
    setAnimals(prev => {
        previousState = prev;
        const map = new Map(updatedWithOrder.map(a => [a.id, a]));
        return (prev || []).map(a => map.get(a.id) || a);
    });
    try {
        await dataService.saveAnimalsBulk(updatedWithOrder);
    } catch (error) {
        console.error("Failed to reorder animals", error);
        setAnimals(previousState);
        alert("Failed to reorder animals. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addTask = useCallback(async (task: Task) => {
    if (isInitializing) return;
    setTasks(prev => upsert(prev, task));
    try {
        await dataService.saveTasks([task]);
    } catch (error) {
        console.error("Failed to add task", error);
        setTasks(prev => (prev || []).filter(t => t.id !== task.id));
        alert("Failed to add task. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addTasks = useCallback(async (newTasks: Task[]) => {
    if (isInitializing) return;
    setTasks(prev => [...(prev || []), ...newTasks]);
    try {
        await dataService.saveTasks(newTasks);
    } catch (error) {
        console.error("Failed to add tasks", error);
        const newIds = new Set(newTasks.map(t => t.id));
        setTasks(prev => (prev || []).filter(t => !newIds.has(t.id)));
        alert("Failed to add tasks. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateTask = useCallback(async (task: Task) => {
    if (isInitializing) return;
    let oldTask: Task | undefined;
    setTasks(prev => {
        oldTask = (prev || []).find(t => t.id === task.id);
        return (prev || []).map(t => t.id === task.id ? task : t);
    });
    try {
        await dataService.saveTasks([task]);
    } catch (error) {
        console.error("Failed to update task", error);
        if (oldTask) {
            setTasks(prev => (prev || []).map(t => t.id === task.id ? oldTask! : t));
        }
        alert("Failed to update task. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteTask = useCallback(async (id: string) => {
    if (isInitializing) return;
    let oldTask: Task | undefined;
    setTasks(prev => {
        oldTask = (prev || []).find(t => t.id === id);
        return (prev || []).filter(t => t.id !== id);
    });
    try {
        await dataService.deleteTask(id);
    } catch (error) {
        console.error("Failed to delete task", error);
        if (oldTask) {
            setTasks(prev => [...(prev || []), oldTask!]);
        }
        alert("Failed to delete task. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addSiteLog = useCallback(async (log: SiteLogEntry) => {
    if (isInitializing) return;
    let previousState: SiteLogEntry[] = [];
    setSiteLogs(prev => {
        previousState = prev;
        return upsert(prev, log);
    });
    try {
        await dataService.saveSiteLog(log);
    } catch (error) {
        console.error("Failed to add site log", error);
        setSiteLogs(previousState);
        alert("Failed to add site log. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteSiteLog = useCallback(async (id: string) => {
    if (isInitializing) return;
    let previousState: SiteLogEntry[] = [];
    setSiteLogs(prev => {
        previousState = prev;
        return (prev || []).filter(l => l.id !== id);
    });
    try {
        await dataService.deleteSiteLog(id);
    } catch (error) {
        console.error("Failed to delete site log", error);
        setSiteLogs(previousState);
        alert("Failed to delete site log. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addIncident = useCallback(async (inc: Incident) => {
    if (isInitializing) return;
    let previousState: Incident[] = [];
    setIncidents(prev => {
        previousState = prev;
        return upsert(prev, inc);
    });
    try {
        await dataService.saveIncident(inc);
    } catch (error) {
        console.error("Failed to add incident", error);
        setIncidents(previousState);
        alert("Failed to add incident. Changes have been reverted.");
    }
  }, [isInitializing]);
  
  const updateIncident = useCallback(async (inc: Incident) => {
    if (isInitializing) return;
    let previousState: Incident[] = [];
    setIncidents(prev => {
        previousState = prev;
        return (prev || []).map(i => i.id === inc.id ? inc : i);
    });
    try {
        await dataService.saveIncident(inc);
    } catch (error) {
        console.error("Failed to update incident", error);
        setIncidents(previousState);
        alert("Failed to update incident. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteIncident = useCallback(async (id: string) => {
    if (isInitializing) return;
    let previousState: Incident[] = [];
    setIncidents(prev => {
        previousState = prev;
        return (prev || []).filter(i => i.id !== id);
    });
    try {
        await dataService.deleteIncident(id);
    } catch (error) {
        console.error("Failed to delete incident", error);
        setIncidents(previousState);
        alert("Failed to delete incident. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addFirstAid = useCallback(async (log: FirstAidLogEntry) => {
    if (isInitializing) return;
    let previousState: FirstAidLogEntry[] = [];
    setFirstAidLogs(prev => {
        previousState = prev;
        return upsert(prev, log);
    });
    try {
        await dataService.saveFirstAidLog(log);
    } catch (error) {
        console.error("Failed to add first aid log", error);
        setFirstAidLogs(previousState);
        alert("Failed to add first aid log. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteFirstAid = useCallback(async (id: string) => {
    if (isInitializing) return;
    let previousState: FirstAidLogEntry[] = [];
    setFirstAidLogs(prev => {
        previousState = prev;
        return (prev || []).filter(l => l.id !== id);
    });
    try {
        await dataService.deleteFirstAidLog(id);
    } catch (error) {
        console.error("Failed to delete first aid log", error);
        setFirstAidLogs(previousState);
        alert("Failed to delete first aid log. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateUsers = useCallback(async (u: User[]) => {
    if (isInitializing) return;
    let previousState: User[] = [];
    setUsers(prev => {
        previousState = prev;
        return u;
    });
    try {
        await dataService.saveUsers(u);
    } catch (error) {
        console.error("Failed to update users", error);
        setUsers(previousState);
        alert("Failed to update users. Changes have been reverted.");
    }
  }, [isInitializing]);
  
  const updateFoodOptions = useCallback(async (opts: Record<AnimalCategory, string[]>) => {
    if (isInitializing) return;
    let previousState: Record<AnimalCategory, string[]> = {} as any;
    setFoodOptions(prev => {
        previousState = prev;
        return opts;
    });
    try {
        await dataService.saveFoodOptions(opts);
    } catch (error) {
        console.error("Failed to update food options", error);
        setFoodOptions(previousState);
        alert("Failed to update food options. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateFeedMethods = useCallback(async (methods: Record<AnimalCategory, string[]>) => {
    if (isInitializing) return;
    let previousState: Record<AnimalCategory, string[]> = {} as any;
    setFeedMethods(prev => {
        previousState = prev;
        return methods;
    });
    try {
        await dataService.saveFeedMethods(methods);
    } catch (error) {
        console.error("Failed to update feed methods", error);
        setFeedMethods(previousState);
        alert("Failed to update feed methods. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateEventTypes = useCallback(async (types: string[]) => {
    if (isInitializing) return;
    let previousState: string[] = [];
    setEventTypes(prev => {
        previousState = prev;
        return types;
    });
    try {
        await dataService.saveEventTypes(types);
    } catch (error) {
        console.error("Failed to update event types", error);
        setEventTypes(previousState);
        alert("Failed to update event types. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateLocations = useCallback(async (locs: string[]) => {
    if (isInitializing) return;
    let previousState: string[] = [];
    setLocations(prev => {
        previousState = prev;
        return locs;
    });
    try {
        await dataService.saveLocations(locs);
    } catch (error) {
        console.error("Failed to update locations", error);
        setLocations(previousState);
        alert("Failed to update locations. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateContacts = useCallback(async (cons: Contact[]) => {
    if (isInitializing) return;
    let previousState: Contact[] = [];
    setContacts(prev => {
        previousState = prev;
        return cons;
    });
    try {
        await dataService.saveContacts(cons);
    } catch (error) {
        console.error("Failed to update contacts", error);
        setContacts(previousState);
        alert("Failed to update contacts. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateOrgProfile = useCallback(async (p: OrganisationProfile) => {
    if (isInitializing) return;
    let previousState: OrganisationProfile | null = null;
    setOrgProfile(prev => {
        previousState = prev;
        return p;
    });
    try {
        await dataService.saveOrgProfile(p);
    } catch (error) {
        console.error("Failed to update org profile", error);
        setOrgProfile(previousState);
        alert("Failed to update org profile. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateSystemPreferences = useCallback(async (p: SystemPreferences) => {
    if (isInitializing) return;
    let previousState: SystemPreferences | null = null;
    setSystemPreferences(prev => {
        previousState = prev;
        return p;
    });
    try {
        await dataService.saveSystemPreferences(p);
    } catch (error) {
        console.error("Failed to update system preferences", error);
        if (previousState) setSystemPreferences(previousState);
        alert("Failed to update system preferences. Changes have been reverted.");
    }
  }, [isInitializing]);

  const clockIn = useCallback(async () => {
    if (isInitializing || !currentUser || activeShift) return;
    const newShift: TimeLogEntry = { 
        id: `shift_${Date.now()}`, userId: currentUser.id, userName: currentUser.name, 
        startTime: Date.now(), date: new Date().toISOString().split('T')[0], status: 'Active' 
    };
    let previousState: TimeLogEntry[] = [];
    setActiveShift(newShift);
    setTimeLogs(prev => {
        previousState = prev;
        return [newShift, ...(prev || [])];
    });
    try {
        await dataService.saveTimeLog(newShift);
    } catch (error) {
        console.error("Failed to clock in", error);
        setTimeLogs(previousState);
        setActiveShift(null);
        alert("Failed to clock in. Changes have been reverted.");
    }
  }, [currentUser, activeShift, isInitializing]);

  const clockOut = useCallback(async () => {
    if (isInitializing || !currentUser || !activeShift) return;
    const now = Date.now();
    if (now < activeShift.startTime) {
        alert("System clock drift detected. Cannot clock out with a negative duration.");
        return;
    }
    const diffMins = Math.floor((now - activeShift.startTime) / 60000);
    const completed: TimeLogEntry = { ...activeShift, endTime: now, durationMinutes: diffMins, status: 'Completed' };
    let previousState: TimeLogEntry[] = [];
    setActiveShift(null);
    setTimeLogs(prev => {
        previousState = prev;
        return (prev || []).map(l => l.id === activeShift.id ? completed : l);
    });
    try {
        await dataService.saveTimeLog(completed);
    } catch (error) {
        console.error("Failed to clock out", error);
        setTimeLogs(previousState);
        setActiveShift(activeShift);
        alert("Failed to clock out. Changes have been reverted.");
    }
  }, [currentUser, activeShift, isInitializing]);

  const deleteTimeLog = useCallback(async (id: string) => {
    if (isInitializing) return;
    let previousState: TimeLogEntry[] = [];
    setTimeLogs(prev => {
        previousState = prev;
        return (prev || []).filter(l => l.id !== id);
    });
    try {
        await dataService.deleteTimeLog(id);
    } catch (error) {
        console.error("Failed to delete time log", error);
        setTimeLogs(previousState);
        alert("Failed to delete time log. Changes have been reverted.");
    }
  }, [isInitializing]);

  const addHoliday = useCallback(async (req: HolidayRequest) => {
    if (isInitializing) return;
    let previousState: HolidayRequest[] = [];
    setHolidayRequests(prev => {
        previousState = prev;
        return [req, ...(prev || [])];
    });
    try {
        await dataService.saveHolidayRequest(req);
    } catch (error) {
        console.error("Failed to add holiday request", error);
        setHolidayRequests(previousState);
        alert("Failed to add holiday request. Changes have been reverted.");
    }
  }, [isInitializing]);

  const updateHoliday = useCallback(async (req: HolidayRequest) => {
    if (isInitializing) return;
    let previousState: HolidayRequest[] = [];
    setHolidayRequests(prev => {
        previousState = prev;
        return (prev || []).map(r => r.id === req.id ? req : r);
    });
    try {
        await dataService.saveHolidayRequest(req);
    } catch (error) {
        console.error("Failed to update holiday request", error);
        setHolidayRequests(previousState);
        alert("Failed to update holiday request. Changes have been reverted.");
    }
  }, [isInitializing]);

  const deleteHoliday = useCallback(async (id: string) => {
    if (isInitializing) return;
    let previousState: HolidayRequest[] = [];
    setHolidayRequests(prev => {
        previousState = prev;
        return (prev || []).filter(r => r.id !== id);
    });
    try {
        await dataService.deleteHolidayRequest(id);
    } catch (error) {
        console.error("Failed to delete holiday request", error);
        setHolidayRequests(previousState);
        alert("Failed to delete holiday request. Changes have been reverted.");
    }
  }, [isInitializing]);

  const importAnimals = useCallback(async (imported: Animal[]) => {
    if (isInitializing) return;
    let previousState: Animal[] = [];
    setAnimals(prev => {
        previousState = prev;
        return imported;
    });
    try {
        await dataService.importAnimals(imported);
    } catch (error) {
        console.error("Failed to import animals", error);
        setAnimals(previousState);
        alert("Failed to import animals. Changes have been reverted.");
    }
  }, [isInitializing]);

  const contextValue = {
    currentUser, users, animals, tasks, siteLogs, incidents, firstAidLogs, timeLogs,
    holidayRequests, foodOptions, feedMethods, eventTypes, locations, contacts,
    orgProfile, systemPreferences, sortOption, isOrderLocked, activeShift, isOffline,
    login, logout, setSortOption, toggleOrderLock, clockIn, clockOut,
    updateAnimal, addAnimal, deleteAnimal, reorderAnimals,
    addTask, addTasks, updateTask, deleteTask, addSiteLog, deleteSiteLog,
    addIncident, updateIncident, deleteIncident, addFirstAid, deleteFirstAid,
    updateUsers, updateFoodOptions, updateFeedMethods, updateEventTypes,
    updateLocations, updateContacts, updateOrgProfile, updateSystemPreferences,
    addHoliday, updateHoliday, deleteHoliday, deleteTimeLog, importAnimals
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
