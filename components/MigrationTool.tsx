import React, { useState } from 'react';
import { Database, Upload, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Animal, Task, User, SiteLogEntry, Incident, FirstAidLogEntry, TimeLogEntry, HolidayRequest, GlobalDocument } from '../types';

export const MigrationTool: React.FC = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<string>('');
    const [migrationProgress, setMigrationProgress] = useState<number>(0);
    const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
    const [pendingData, setPendingData] = useState<any>(null);
    const [fileName, setFileName] = useState<string>('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsedContent = JSON.parse(content);
                
                // Robust data extraction:
                // 1. Check for .data key
                // 2. Check if the root itself is what we want
                // 3. If .data is an array, we might need to handle it differently, 
                //    but usually it's an object with table keys.
                let actualData = parsedContent;
                if (parsedContent.data && typeof parsedContent.data === 'object' && !Array.isArray(parsedContent.data)) {
                    actualData = parsedContent.data;
                }
                
                setPendingData(actualData);
                setMigrationResult(null);
            } catch (error) {
                console.error("Failed to parse migration file:", error);
                setMigrationResult({ success: false, message: "Invalid file format. Please upload a valid JSON export." });
            }
        };
        reader.readAsText(file);
    };

    const performMigration = async () => {
        if (!pendingData) return;
        
        setIsMigrating(true);
        setMigrationResult(null);
        setMigrationProgress(0);

        try {
            const data = pendingData;
            
            const findDataKey = (targetKey: string): string | null => {
                const keys = Object.keys(data);
                const targetLower = targetKey.toLowerCase();
                
                // 1. Exact match
                if (data[targetKey]) return targetKey;
                
                // 2. Case-insensitive match
                const ciMatch = keys.find(k => k.toLowerCase() === targetLower);
                if (ciMatch) return ciMatch;
                
                // 3. Snake case match (e.g., animal_logs)
                const snakeTarget = targetKey.replace(/([A-Z])/g, "_$1").toLowerCase();
                const snakeMatch = keys.find(k => k.toLowerCase() === snakeTarget);
                if (snakeMatch) return snakeMatch;
                
                // 4. Plural/Singular match
                if (targetLower.endsWith('s')) {
                    const singular = targetLower.slice(0, -1);
                    const singMatch = keys.find(k => k.toLowerCase() === singular);
                    if (singMatch) return singMatch;
                } else {
                    const plural = targetLower + 's';
                    const plurMatch = keys.find(k => k.toLowerCase() === plural);
                    if (plurMatch) return plurMatch;
                }
                
                return null;
            };

            const steps = [
                { name: 'Users', key: 'users', action: dataService.saveUsers },
                { name: 'Animals', key: 'animals', action: dataService.saveAnimalsBulk },
                { name: 'Tasks', key: 'tasks', action: dataService.saveTasks },
                { name: 'Site Logs', key: 'siteLogs', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveSiteLog(item);
                }},
                { name: 'Incidents', key: 'incidents', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveIncident(item);
                }},
                { name: 'First Aid', key: 'firstAidLogs', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveFirstAidLog(item);
                }},
                { name: 'Time Logs', key: 'timeLogs', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveTimeLog(item);
                }},
                { name: 'Holidays', key: 'holidayRequests', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveHolidayRequest(item);
                }},
                { name: 'Documents', key: 'globalDocuments', action: async (items: any[]) => {
                    for (const item of items) await dataService.saveGlobalDocument(item);
                }}
            ];

            const activeSteps = steps
                .map(s => ({ ...s, actualKey: findDataKey(s.key) }))
                .filter(s => s.actualKey && Array.isArray(data[s.actualKey]) && data[s.actualKey].length > 0);
            
            const totalSteps = activeSteps.length;
            
            if (totalSteps === 0) {
                const foundKeys = Object.keys(data).join(', ');
                throw new Error(`No valid data arrays found. Detected keys: ${foundKeys || 'None'}. Expected keys like 'animals', 'users', etc.`);
            }

            let completedSteps = 0;

            for (const step of activeSteps) {
                setMigrationStatus(`Migrating ${step.name}...`);
                let items = data[step.actualKey!];
                
                // Data Cleaning & Mapping
                if (items && Array.isArray(items)) {
                    items = items.map((item: any, index: number) => {
                        const cleaned = { ...item };
                        
                        // Ensure ID exists and is deterministic if missing
                        if (!cleaned.id) {
                            const uniqueStr = `${step.key}_${cleaned.name || cleaned.title || cleaned.date || index}_${cleaned.timestamp || ''}`;
                            cleaned.id = uniqueStr;
                        }

                        // Global cleaning
                        if (cleaned.timestamp && !cleaned.date) {
                            cleaned.date = new Date(cleaned.timestamp).toISOString().split('T')[0];
                        }

                        // Convert empty strings to null for date and numeric fields to prevent Postgres errors
                        Object.keys(cleaned).forEach(key => {
                            if (cleaned[key] === "") {
                                const lowerKey = key.toLowerCase();
                                if (
                                    lowerKey.includes('date') || 
                                    lowerKey === 'dob' || 
                                    lowerKey.includes('temp') || 
                                    lowerKey.includes('weight') || 
                                    lowerKey.includes('humidity') || 
                                    lowerKey.includes('duration') || 
                                    lowerKey.includes('speed') || 
                                    lowerKey.includes('count') ||
                                    lowerKey.includes('cost') ||
                                    lowerKey.includes('bcs')
                                ) {
                                    cleaned[key] = null;
                                }
                            }
                        });

                        // Table specific cleaning
                        if (step.key === 'animals') {
                            // Map 'order' to 'displayOrder' (which becomes display_order)
                            if (cleaned.order !== undefined) {
                                cleaned.displayOrder = cleaned.order;
                                delete cleaned.order; // CRITICAL: Remove legacy key
                            }
                            
                            // Map legacy 'targetHumidity' to the new min/max fields
                            if (cleaned.targetHumidity !== undefined) {
                                if (cleaned.targetHumidityMin === undefined) cleaned.targetHumidityMin = cleaned.targetHumidity;
                                if (cleaned.targetHumidityMax === undefined) cleaned.targetHumidityMax = cleaned.targetHumidity;
                                delete cleaned.targetHumidity; // Remove legacy key
                            }

                            // Ensure category is present
                            if (!cleaned.category) cleaned.category = 'Other';
                        }

                        if (step.key === 'users') {
                            if (!cleaned.pin) cleaned.pin = '1234';
                            if (!cleaned.role) cleaned.role = 'Volunteer';
                        }
                        
                        return cleaned;
                    });
                }
                
                await step.action(items);
                
                completedSteps++;
                setMigrationProgress(Math.round((completedSteps / totalSteps) * 100));
            }

            setMigrationStatus('Migration Complete!');
            setMigrationResult({ success: true, message: "Legacy data successfully migrated to the new schema." });
            setPendingData(null);
            setFileName('');

        } catch (error: any) {
            console.error("Migration failed:", error);
            setMigrationResult({ 
                success: false, 
                message: error.message || "An unexpected error occurred during migration.",
                details: error
            });
        } finally {
            setIsMigrating(false);
        }
    };

    const getStats = () => {
        if (!pendingData) return null;
        
        const findDataKey = (targetKey: string): string | null => {
            const keys = Object.keys(pendingData);
            const targetLower = targetKey.toLowerCase();
            if (pendingData[targetKey]) return targetKey;
            const ciMatch = keys.find(k => k.toLowerCase() === targetLower);
            if (ciMatch) return ciMatch;
            const snakeTarget = targetKey.replace(/([A-Z])/g, "_$1").toLowerCase();
            const snakeMatch = keys.find(k => k.toLowerCase() === snakeTarget);
            if (snakeMatch) return snakeMatch;
            return null;
        };

        const uKey = findDataKey('users');
        const aKey = findDataKey('animals');
        const tKey = findDataKey('tasks');
        const sKey = findDataKey('siteLogs');
        const fKey = findDataKey('firstAidLogs');
        const iKey = findDataKey('incidents');

        return {
            users: uKey ? pendingData[uKey]?.length : 0,
            animals: aKey ? pendingData[aKey]?.length : 0,
            tasks: tKey ? pendingData[tKey]?.length : 0,
            logs: (sKey ? pendingData[sKey]?.length : 0) + (fKey ? pendingData[fKey]?.length : 0),
            incidents: iKey ? pendingData[iKey]?.length : 0
        };
    };

    const stats = getStats();

    return (
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
            <div className="border-b-2 border-slate-200 pb-6">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Database size={28} className="text-blue-600" /> Legacy Data Migration
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Import and map legacy JSON data into the new relational schema</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-8">
                <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <AlertTriangle className="text-blue-600 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Schema Upgrade Process</h4>
                        <p className="text-xs font-medium text-blue-800 leading-relaxed">
                            This tool reads a legacy JSON export and maps it into the new normalized PostgreSQL tables (e.g., separating animal logs into the <code className="bg-blue-100 px-1 rounded">animal_logs</code> table). 
                            Ensure you have a complete JSON export from the old system before proceeding.
                        </p>
                    </div>
                </div>

                {!isMigrating && !migrationResult && !pendingData && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                        <Upload size={48} className="text-slate-400 group-hover:text-blue-500 transition-colors mb-4" />
                        <h4 className="text-lg font-black text-slate-700 uppercase tracking-tight mb-2">Select Legacy JSON File</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to browse or drag and drop</p>
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                )}

                {pendingData && !isMigrating && !migrationResult && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Database className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{fileName}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready for integration</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setPendingData(null); setFileName(''); }}
                                className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline"
                            >
                                Remove
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'Users', value: stats?.users },
                                { label: 'Animals', value: stats?.animals },
                                { label: 'Tasks', value: stats?.tasks },
                                { label: 'Logs', value: stats?.logs },
                                { label: 'Incidents', value: stats?.incidents },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={performMigration}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            Start Data Integration <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {isMigrating && (
                    <div className="space-y-6 py-8">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <Loader2 size={48} className="text-blue-600 animate-spin" />
                            <div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{migrationStatus}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Please do not close this window</p>
                            </div>
                        </div>
                        
                        <div className="w-full max-w-md mx-auto space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Progress</span>
                                <span>{migrationProgress}%</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                    style={{ width: `${migrationProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {migrationResult && (
                    <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center space-y-4 ${migrationResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        {migrationResult.success ? (
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        ) : (
                            <AlertTriangle size={48} className="text-rose-500" />
                        )}
                        <div>
                            <h4 className={`text-lg font-black uppercase tracking-tight ${migrationResult.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                                {migrationResult.success ? 'Migration Successful' : 'Migration Failed'}
                            </h4>
                            <p className={`text-sm font-medium mt-2 ${migrationResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {migrationResult.message}
                            </p>
                        </div>
                        <button 
                            onClick={() => setMigrationResult(null)}
                            className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${migrationResult.success ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                        >
                            Acknowledge
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};