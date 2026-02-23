
import React, { useState, useMemo, useTransition } from 'react';
// Fix: Changed OrganizationProfile to OrganisationProfile
import { Animal, LogType, LogEntry, HealthRecordType, HealthCondition, AnimalCategory, Task, User, UserRole, OrganisationProfile, ShellQuality } from '../types';
import { Heart, Activity, Calendar, Save, Upload, FileText, AlertCircle, Plus, X, Filter, RotateCcw, Clock, User as UserIcon, Edit2, Trash2, Skull, Printer, Biohazard, ShieldCheck, Thermometer, AlertTriangle, Pill, ClipboardList, ArrowRight, Sparkles, Loader2, Check, BarChart3, Egg } from 'lucide-react';
import { analyzeHealthHistory, analyzeCollectionHealth } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import AddEntryModal from './AddEntryModal';
import MedicalRecordModal from './MedicalRecordModal';
import Quarantine from './Quarantine';
// FIX: Import useAppData hook to get data from context.
import { useAppData } from '../hooks/useAppData';

interface HealthProps {
  onSelectAnimal: (animal: Animal) => void;
}

const Health: React.FC<HealthProps> = ({ onSelectAnimal }) => {
  // FIX: Get data and actions from useAppData context instead of props.
  const { animals, updateAnimal, tasks, addTask, updateTask, deleteTask, users, currentUser, orgProfile } = useAppData();

  const [activeTab, setActiveTab] = useState<'medical' | 'quarantine' | 'mar' | 'repro'>('medical');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Repro Logic
  const [isEggLogOpen, setIsEggLogOpen] = useState(false);
  const [eggLogAnimal, setEggLogAnimal] = useState<Animal | null>(null);

  // React 19 Transitions for AI
  const [isPendingAi, startTransitionAi] = useTransition();
  const [isPendingBrief, startTransitionBrief] = useTransition();
  
  const [aiInsight, setAiInsight] = useState<{animalId: string, text: string} | null>(null);
  const [collectionBrief, setCollectionBrief] = useState<string | null>(null);

  // Filter State
  const [filterCategory, setFilterCategory] = useState<AnimalCategory | 'ALL'>('ALL');
  const [filterAnimalId, setFilterAnimalId] = useState<string>('ALL');

  // Record Editing State
  const [editingLog, setEditingLog] = useState<LogEntry | undefined>(undefined);
  const [editingAnimal, setEditingAnimal] = useState<Animal | undefined>(undefined);

  const handleGenerateAiInsight = (animal: Animal) => {
    startTransitionAi(async () => {
        const text = await analyzeHealthHistory(animal);
        setAiInsight({ animalId: animal.id, text });
    });
  };

  const handleGenerateCollectionBrief = () => {
      startTransitionBrief(async () => {
          const brief = await analyzeCollectionHealth(animals);
          setCollectionBrief(brief);
      });
  };

  const handleEditLog = (log: LogEntry & { animal: Animal }) => {
    setEditingLog(log);
    setEditingAnimal(log.animal);
    setIsModalOpen(true);
  };

  const handleDeleteLog = (logId: string, animal: Animal) => {
    if (window.confirm('Permanently purge clinical record?')) {
        const updatedLogs = (animal.logs || []).filter(l => l.id !== logId);
        updateAnimal({ ...animal, logs: updatedLogs });
    }
  };

  const handleSaveMedicalRecord = (healthLog: LogEntry, animalId: string, isDeceased: boolean) => {
      const animal = animals.find(a => a.id === animalId);
      if (animal) {
          updateAnimal({ 
              ...animal, 
              logs: [healthLog, ...(animal.logs || [])], 
              archived: isDeceased 
          });
      }
  };

  const recentHealthLogs = useMemo(() => {
    // Filter animals first to reduce search space
    const relevantAnimals = animals.filter(a => 
        (filterCategory === 'ALL' || a.category === filterCategory) &&
        (filterAnimalId === 'ALL' || a.id === filterAnimalId)
    );

    const logs: (LogEntry & { animal: Animal })[] = [];
    for (const animal of relevantAnimals) {
        const alogs = animal.logs || [];
        for (const log of alogs) {
            if (log.type === LogType.HEALTH) {
                logs.push({ ...log, animal });
            }
        }
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [animals, filterCategory, filterAnimalId]);

  const upcomingChecks = useMemo(() => {
      if (!tasks) return [];
      return tasks.filter(t => t.type === LogType.HEALTH && !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks]);

  const quarantineAnimals = useMemo(() => animals.filter(a => a.isQuarantine), [animals]);

  // Logic for Reproduction Tab
  const breedingFemales = useMemo(() => {
      return animals.filter(a => 
          a.sex === 'Female' && 
          !a.archived &&
          (filterCategory === 'ALL' || a.category === filterCategory)
      );
  }, [animals, filterCategory]);

  const getReproStats = (animal: Animal) => {
      const currentYear = new Date().getFullYear();
      const eggLogs = (animal.logs || []).filter(l => l.type === LogType.EGG);
      const seasonCount = eggLogs
          .filter(l => new Date(l.date).getFullYear() === currentYear)
          .reduce((acc, l) => acc + (l.eggCount || 0), 0);
      const lastClutch = eggLogs.length > 0 ? eggLogs[0].date : null;
      return { seasonCount, lastClutch, totalLogs: eggLogs.length };
  };

  const inputClass = "w-full px-3 py-2 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 transition-all";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Heart className="text-rose-500" fill="currentColor" /> Medical Centre
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Statutory veterinary diagnostics and collection-wide health tracking.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={handleGenerateCollectionBrief} 
                disabled={isPendingBrief}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-black"
            >
                {isPendingBrief ? <Loader2 size={16} className="animate-spin"/> : <BarChart3 size={16}/>} Morning Briefing
            </button>
            <button onClick={() => { setEditingLog(undefined); setEditingAnimal(undefined); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
                <Plus size={16} /> New Record
            </button>
        </div>
      </div>

      <div className="flex gap-2 border-b-2 border-slate-200 mb-4 overflow-x-auto scrollbar-hide">
          {[
              { id: 'medical', label: 'Clinical Ledger', icon: FileText },
              { id: 'mar', label: 'MAR Charts', icon: Pill },
              { id: 'quarantine', label: 'Isolation Station', icon: Biohazard },
              { id: 'repro', label: 'Reproduction', icon: Egg }
          ].map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 whitespace-nowrap -mb-[2px] ${activeTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  <tab.icon size={16}/> {tab.label}
              </button>
          ))}
      </div>

      {/* ... (Existing Medical/Quarantine/MAR tabs remain the same content-wise) ... */}
      
      {activeTab === 'medical' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-left-2 duration-300">
              <div className="lg:col-span-3 space-y-5">
                    {collectionBrief && (
                         <div className="bg-slate-900 border-l-8 border-emerald-500 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group animate-in slide-in-from-top-4">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-100 transition-opacity">
                                <Activity size={160} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-emerald-400">
                                        <ShieldCheck size={14}/> Curator's Health Audit Brief
                                    </h3>
                                    <button onClick={() => setCollectionBrief(null)} className="text-white/40 hover:text-white"><X size={20}/></button>
                                </div>
                                <div className="prose prose-sm prose-invert max-w-none font-medium leading-relaxed">
                                    <ReactMarkdown>{collectionBrief}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    {aiInsight && (
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group animate-in zoom-in-95">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sparkles size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Sparkles size={14}/> Subject Clinical Analysis: {animals.find(a => a.id === aiInsight.animalId)?.name}
                                    </h3>
                                    <button onClick={() => setAiInsight(null)} className="text-white/60 hover:text-white"><X size={16}/></button>
                                </div>
                                <div className="prose prose-sm prose-invert max-w-none font-medium leading-relaxed">
                                    <ReactMarkdown>{aiInsight.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-slate-200 flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Section Filter</label>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className={inputClass}>
                                <option value="ALL">Entire Collection</option>
                                {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Patient Search</label>
                            <select value={filterAnimalId} onChange={(e) => setFilterAnimalId(e.target.value)} className={inputClass}>
                                <option value="ALL">All Active Patients</option>
                                {animals.filter(a => filterCategory === 'ALL' || a.category === filterCategory).map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-300 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">BCS Gauging</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Snapshot</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentHealthLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group relative">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800 text-sm">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{log.healthType}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{log.animal.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{log.animal.species}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.bcs ? (
                                                    <div className="flex flex-col gap-1 w-24">
                                                        <div className="flex justify-between text-[9px] font-black text-slate-400">
                                                            <span>BODY COND.</span>
                                                            <span className={log.bcs < 3 || log.bcs > 8 ? 'text-rose-600' : 'text-emerald-600'}>{log.bcs}/10</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                            <div className={`h-full ${log.bcs < 3 || log.bcs > 8 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${log.bcs * 10}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-300 font-bold">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-xs font-medium text-slate-600 italic line-clamp-1 mb-2">"{log.value}"</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                                        log.condition === HealthCondition.HEALTHY ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                        log.condition === HealthCondition.MONITORING ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {log.condition}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                      onClick={() => handleGenerateAiInsight(log.animal)}
                                                      disabled={isPendingAi}
                                                      className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                                      title="AI Clinical Diagnostic"
                                                    >
                                                        {isPendingAi ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                                    </button>
                                                    <button onClick={() => handleEditLog(log)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all" title="Edit Entry">
                                                        <Edit2 size={14}/>
                                                    </button>
                                                    <button onClick={() => handleDeleteLog(log.id, log.animal)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all" title="Delete Entry">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                    <button onClick={() => onSelectAnimal(log.animal)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all" title="View Patient File">
                                                        <ArrowRight size={14}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
              </div>
              
              <div className="lg:col-span-1 space-y-6">
                  {/* ... (Sidebar Widgets remain) ... */}
                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl border-2 border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 border-b-2 border-white/5 pb-4">
                          <Clock size={16} className="text-emerald-500"/> Clinical Rota
                      </h3>
                      <div className="space-y-4">
                          {upcomingChecks.map(task => (
                              <div key={task.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{new Date(task.dueDate).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</span>
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                  </div>
                                  <p className="font-black text-xs uppercase tracking-tight mb-1 text-white">{animals.find(a => a.id === task.animalId)?.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight group-hover:text-white transition-colors">{task.title}</p>
                              </div>
                          ))}
                          {upcomingChecks.length === 0 && (
                              <div className="text-center py-10 opacity-20"><ClipboardList size={48} className="mx-auto mb-2"/><p className="text-[10px] font-black uppercase tracking-widest">No Active Rota</p></div>
                          )}
                      </div>
                  </div>

                  <div className="bg-amber-50 rounded-[2rem] p-6 border-2 border-amber-200 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-amber-900 border-b border-amber-200 pb-4">
                          <Biohazard size={16} className="text-amber-600"/> Isolation Area
                      </h3>
                      <div className="space-y-3">
                          {quarantineAnimals.map(a => (
                              <div key={a.id} onClick={() => onSelectAnimal(a)} className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-xl hover:shadow-md cursor-pointer transition-all">
                                  <div>
                                      <p className="text-xs font-black uppercase text-amber-950">{a.name}</p>
                                      <p className="text-[9px] font-bold text-amber-600 uppercase">{a.species}</p>
                                  </div>
                                  <ArrowRight size={14} className="text-amber-300"/>
                              </div>
                          ))}
                          {quarantineAnimals.length === 0 && (
                               <div className="text-center py-8 opacity-40"><ShieldCheck size={32} className="mx-auto mb-2 text-emerald-600"/><p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Area Sterile</p></div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'quarantine' && (
          <Quarantine animals={animals} onUpdateAnimal={updateAnimal} currentUser={currentUser} />
      )}

      {activeTab === 'mar' && (
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
                  <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
                      <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">
                          <Pill className="text-blue-600" size={20}/> Medication Administration Records (MAR)
                      </h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Active Treatment Schedules</p>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white border-b-2 border-slate-100">
                              <tr>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication / Instruction</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {tasks?.filter(t => t.type === LogType.HEALTH && !t.completed).map(task => (
                                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 text-xs font-bold text-slate-700 font-mono">
                                          {new Date(task.dueDate).toLocaleDateString('en-GB')}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="font-black text-xs uppercase text-slate-900">{animals.find(a => a.id === task.animalId)?.name || 'Unknown'}</span>
                                      </td>
                                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                          {task.title}
                                          {task.notes && <span className="block text-xs text-slate-400 italic mt-1">{task.notes}</span>}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest border border-blue-200">
                                              Scheduled
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {(!tasks || tasks.filter(t => t.type === LogType.HEALTH && !t.completed).length === 0) && (
                                  <tr>
                                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                          No Active MAR Entries
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* REPRODUCTION TAB */}
      {activeTab === 'repro' && (
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="flex justify-between items-center bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
                  <div>
                      <h3 className="text-lg font-black text-purple-900 uppercase tracking-tight flex items-center gap-2">
                          <Egg size={20} className="text-purple-600"/> Reproductive Management
                      </h3>
                      <p className="text-xs text-purple-600 font-bold uppercase tracking-widest mt-1">Breeding Female Registry</p>
                  </div>
                  <div className="flex gap-2">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="px-3 py-2 bg-white text-purple-900 border border-purple-200 rounded-lg text-xs font-bold focus:outline-none">
                            <option value="ALL">All Sections</option>
                            {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                  </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b-2 border-slate-200">
                          <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Season Total</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Latest Activity</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Quick Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {breedingFemales.map(animal => {
                              const stats = getReproStats(animal);
                              return (
                                  <tr key={animal.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-4">
                                          <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{animal.name}</div>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase">ID: {animal.ringNumber || animal.microchip || 'N/A'}</div>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                                          {animal.species}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              <span className="text-lg font-black text-purple-700">{stats.seasonCount}</span>
                                              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Eggs</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          {stats.lastClutch ? (
                                              <span className="text-xs font-bold text-slate-700">{new Date(stats.lastClutch).toLocaleDateString('en-GB')}</span>
                                          ) : (
                                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No Recent Data</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                              onClick={() => { setEggLogAnimal(animal); setIsEggLogOpen(true); }}
                                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2"
                                          >
                                              <Plus size={12}/> Log Clutch
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                          {breedingFemales.length === 0 && (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">No female subjects found in current filter.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODALS */}
      {editingLog && editingAnimal && isModalOpen && (
          <AddEntryModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setEditingLog(undefined); setEditingAnimal(undefined); }} 
            onSave={(entry) => {
                const updatedLogs = editingAnimal.logs.map(l => l.id === entry.id ? entry : l);
                updateAnimal({ ...editingAnimal, logs: updatedLogs });
                setIsModalOpen(false);
                setEditingLog(undefined);
                setEditingAnimal(undefined);
            }} 
            onDelete={(id) => handleDeleteLog(id, editingAnimal)}
            animal={editingAnimal} 
            initialType={editingLog.type} 
            existingLog={editingLog} 
            foodOptions={{} as any} 
            feedMethods={[]} 
          />
      )}

      {/* QUICK ADD MODAL (MEDICAL) */}
      {!editingLog && isModalOpen && (
          <MedicalRecordModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveMedicalRecord}
            animals={animals}
            currentUser={currentUser}
          />
      )}

      {/* QUICK ADD MODAL (EGG) */}
      {isEggLogOpen && eggLogAnimal && (
          <AddEntryModal
              isOpen={isEggLogOpen}
              onClose={() => { setIsEggLogOpen(false); setEggLogAnimal(null); }}
              onSave={(entry) => {
                 const updatedLogs = [entry, ...(eggLogAnimal.logs || [])];
                 updateAnimal({ ...eggLogAnimal, logs: updatedLogs });
                 // Note: AddEntryModal automatically calls onClose after onSave if implemented correctly, but we manage state here too.
                 setIsEggLogOpen(false);
                 setEggLogAnimal(null);
              }}
              animal={eggLogAnimal}
              initialType={LogType.EGG}
              foodOptions={{} as any}
              feedMethods={[]}
          />
      )}
    </div>
  );
};

export default Health;