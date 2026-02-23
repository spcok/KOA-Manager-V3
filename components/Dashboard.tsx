
import React, { useState, useMemo } from 'react';
import { Animal, AnimalCategory, LogType, LogEntry, UserRole, HazardRating } from '../types';
import { Search, Plus, Scale, Utensils, ChevronLeft, ChevronRight, GripVertical, ArrowRight, Heart, ChevronDown, ChevronUp, CheckCircle, AlertCircle, ClipboardCheck, Skull, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { formatWeightDisplay } from '../services/weightUtils';
import AnimalFormModal from './AnimalFormModal';
import { useAppData } from '../hooks/useAppData';

interface DashboardProps {
  onSelectAnimal: (animal: Animal) => void;
  activeTab: AnimalCategory;
  setActiveTab: (category: AnimalCategory) => void;
  viewDate: string;
  setViewDate: (date: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    onSelectAnimal, activeTab, setActiveTab, viewDate, setViewDate
}) => {
  const {
    animals, currentUser, addAnimal, reorderAnimals, locations, 
    sortOption, setSortOption, isOrderLocked, toggleOrderLock, tasks
  } = useAppData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateAnimalModalOpen, setIsCreateAnimalModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [areTasksOpen, setAreTasksOpen] = useState(false);

  const animalStats = useMemo(() => {
      const catAnimals = animals.filter(a => a.category === activeTab && !a.archived);
      const total = catAnimals.length;
      let weighed = 0;
      let fed = 0;
      
      const animalData = new Map<string, {
          todayWeight?: LogEntry,
          latestWeight?: LogEntry,
          todayFeed?: LogEntry,
          previousWeight?: LogEntry
      }>();

      for (const animal of catAnimals) {
          const logs = animal.logs || [];
          const weights: LogEntry[] = [];
          const feeds: LogEntry[] = [];
          
          for (const l of logs) {
              if (l.type === LogType.WEIGHT) weights.push(l);
              else if (l.type === LogType.FEED) feeds.push(l);
          }

          weights.sort((a, b) => b.timestamp - a.timestamp);
          const todayWeight = weights.find(l => l.date.startsWith(viewDate));
          const todayFeed = feeds.find(l => l.date.startsWith(viewDate));
          
          if (todayWeight) weighed++;
          if (todayFeed) fed++;

          animalData.set(animal.id, { 
              todayWeight, 
              latestWeight: weights[0], 
              todayFeed, 
              previousWeight: weights.find(l => !l.date.startsWith(viewDate))
          });
      }

      return { total, weighed, fed, animalData };
  }, [animals, activeTab, viewDate]);

  const taskStats = useMemo(() => ({
      pendingTasks: (tasks || []).filter(t => !t.completed && t.type !== LogType.HEALTH),
      pendingHealth: (tasks || []).filter(t => !t.completed && t.type === LogType.HEALTH)
  }), [tasks]);

  const filteredAnimals = useMemo(() => {
    let result = animals
      .filter(a => a.category === activeTab && !a.archived && a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (sortOption === 'alpha-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === 'alpha-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOption === 'custom') result.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    
    return result;
  }, [animals, activeTab, searchTerm, sortOption]);

  const handleDragStart = (index: number) => {
      if (isOrderLocked) return;
      setDraggedIndex(index);
      if (sortOption !== 'custom') setSortOption('custom');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index || isOrderLocked) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex || !reorderAnimals || isOrderLocked) {
          setDraggedIndex(null);
          return;
      }
      const reordered = [...filteredAnimals];
      const [draggedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, draggedItem);
      reorderAnimals(reordered);
      setDraggedIndex(null);
  };
  
  const cycleSort = () => {
      if (sortOption === 'alpha-asc') setSortOption('alpha-desc');
      else if (sortOption === 'alpha-desc') setSortOption('custom');
      else setSortOption('alpha-asc');
  };

  const getWeightDisplay = (log?: LogEntry, unit: 'g' | 'oz' | 'lbs_oz' = 'g') => log ? (log.weightGrams ? formatWeightDisplay(log.weightGrams, unit) : log.value) : '-';
  const getDateDisplay = (log?: LogEntry) => log ? new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() : '';
  const getTimeDisplay = (log?: LogEntry) => log ? new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  return (
    <div className="p-3 md:p-8 pb-24 space-y-4 md:space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-widest opacity-60">Overview of {animalStats.total} active animals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          <div className="bg-emerald-600 rounded-[1.5rem] overflow-hidden shadow-xl relative group text-white border-2 border-emerald-700">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-800/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 h-1.5 md:h-2 bg-emerald-800/30 w-full">
                  <div className="h-full bg-white/40 transition-all duration-700" style={{ width: `${(animalStats.weighed / (animalStats.total || 1)) * 100}%` }}></div>
              </div>
              <div className="p-5 md:p-8 relative z-10 flex justify-between items-center">
                  <div>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80 mb-1">Weighed Today</p>
                      <div className="flex items-baseline gap-1">
                          <span className="text-3xl md:text-5xl font-black tracking-tighter tabular-nums">{animalStats.weighed}</span>
                          <span className="text-sm md:text-xl opacity-60 font-black">/{animalStats.total}</span>
                      </div>
                  </div>
                  <Scale className="text-white/10 w-24 h-24 absolute -right-4 -bottom-6 rotate-12" />
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg">
                      <Scale size={28} className="text-white"/>
                  </div>
              </div>
          </div>

          <div className="bg-orange-500 rounded-[1.5rem] overflow-hidden shadow-xl relative group text-white border-2 border-orange-600">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-800/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 h-1.5 md:h-2 bg-orange-800/30 w-full">
                  <div className="h-full bg-white/40 transition-all duration-700" style={{ width: `${(animalStats.fed / (animalStats.total || 1)) * 100}%` }}></div>
              </div>
              <div className="p-5 md:p-8 relative z-10 flex justify-between items-center">
                  <div>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80 mb-1">Fed Today</p>
                      <div className="flex items-baseline gap-1">
                          <span className="text-3xl md:text-5xl font-black tracking-tighter tabular-nums">{animalStats.fed}</span>
                          <span className="text-sm md:text-xl opacity-60 font-black">/{animalStats.total}</span>
                      </div>
                  </div>
                  <Utensils className="text-white/10 w-24 h-24 absolute -right-4 -bottom-6 rotate-12" />
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg">
                      <Utensils size={28} className="text-white"/>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          <div className="bg-white border-2 border-slate-300 rounded-[1.5rem] overflow-hidden shadow-sm">
              <button onClick={() => setAreTasksOpen(!areTasksOpen)} className="w-full flex justify-between items-center p-4 md:p-5 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200"><ClipboardCheck size={18} /></div><span className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">Duties & To-Dos</span></div>
                  <div className="flex items-center gap-3"><span className="bg-slate-200 text-slate-800 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full">{taskStats.pendingTasks.length}</span>{areTasksOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}</div>
              </button>
              {areTasksOpen && (
                  <div className="p-4 md:p-5 bg-white border-t-2 border-slate-100 max-h-64 overflow-y-auto scrollbar-hide animate-in slide-in-from-top-4">
                      {taskStats.pendingTasks.length > 0 ? (
                          <div className="space-y-2">{taskStats.pendingTasks.map(t => (<div key={t.id} className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-colors"><div className="mt-0.5"><AlertCircle size={16} className="text-amber-500"/></div><div><p className="text-xs md:text-sm font-black text-slate-800 uppercase leading-tight">{t.title}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">DUE: {new Date(t.dueDate).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</p></div></div>))}</div>
                      ) : (
                          <div className="text-center py-10 md:py-14 text-slate-300 flex flex-col items-center"><CheckCircle size={40} className="mb-4 text-emerald-500 opacity-20"/><p className="text-xs font-black uppercase tracking-[0.2em]">All Duties Satisfied</p></div>
                      )}
                  </div>
              )}
          </div>

          <div className="bg-white border-2 border-slate-300 rounded-[1.5rem] overflow-hidden shadow-sm">
              <button onClick={() => setAreTasksOpen(!areTasksOpen)} className="w-full flex justify-between items-center p-4 md:p-5 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-200"><Heart size={18} /></div><span className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">Health Rota</span></div>
                  <div className="flex items-center gap-3"><span className="bg-slate-200 text-slate-800 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full">{taskStats.pendingHealth.length}</span>{areTasksOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}</div>
              </button>
              {areTasksOpen && (
                  <div className="p-4 md:p-5 bg-white border-t-2 border-slate-100 max-h-64 overflow-y-auto scrollbar-hide animate-in slide-in-from-top-4">
                      {taskStats.pendingHealth.length > 0 ? (
                          <div className="space-y-2">{taskStats.pendingHealth.map(t => (<div key={t.id} className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-200 transition-colors"><div className="mt-0.5"><Heart size={16} className="text-rose-500"/></div><div><p className="text-xs md:text-sm font-black text-slate-800 uppercase leading-tight">{t.title}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">MANDATORY: {new Date(t.dueDate).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</p></div></div>))}</div>
                      ) : (
                          <div className="text-center py-10 md:py-14 text-slate-300 flex flex-col items-center"><Heart size={40} className="mb-4 text-rose-300 opacity-20"/><p className="text-xs font-black uppercase tracking-[0.2em]">Collection Stable</p></div>
                      )}
                  </div>
              )}
          </div>
      </div>

      <div className="flex flex-col gap-3 md:bg-white md:p-3 md:rounded-[1.5rem] md:border-2 md:border-slate-300 md:shadow-sm">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-1">
              {Object.values(AnimalCategory).map((cat) => (
                  <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] rounded-xl transition-all whitespace-nowrap border-2 ${activeTab === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{cat}</button>
              ))}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full">
                <div className="flex items-center bg-white border-2 border-slate-200 rounded-xl px-2 w-full sm:w-auto shadow-sm">
                    <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-700"><ChevronLeft size={20}/></button>
                    <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="px-2 py-2 text-xs font-black text-slate-800 bg-transparent border-none focus:ring-0 uppercase tracking-[0.15em] flex-1 text-center w-40" />
                    <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-700"><ChevronRight size={20}/></button>
                </div>
                <div className="relative w-full sm:flex-1 shadow-sm min-w-[200px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search Subject Registry..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider focus:border-emerald-500 focus:outline-none transition-colors"/></div>
                <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl bg-white px-4 py-2 w-full sm:w-auto justify-center shadow-sm whitespace-nowrap">
                    <div className="flex items-center gap-1 mr-2 border-r-2 border-slate-100 pr-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort</span><button type="button" onClick={cycleSort} className={`text-slate-700 flex items-center gap-1.5 text-[10px] font-black uppercase transition-all ${sortOption === 'custom' ? 'text-emerald-600' : ''}`}>{sortOption.replace('-', ' ')}<ArrowRight size={14} className={`transition-transform duration-300 ${sortOption === 'alpha-desc' ? 'rotate-90' : sortOption === 'alpha-asc' ? '-rotate-90' : 'rotate-0'}`}/></button></div>
                    {sortOption === 'custom' && (<button type="button" onClick={() => toggleOrderLock(!isOrderLocked)} className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${isOrderLocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`} title={isOrderLocked ? "Order Locked" : "Order Unlocked"}>{isOrderLocked ? <Lock size={14} /> : <Unlock size={14} />}<span className="text-[10px] font-black uppercase tracking-widest">{isOrderLocked ? 'Locked' : 'Unlock'}</span></button>)}
                </div>
          </div>
      </div>

      <div className="bg-white border-2 border-slate-300 rounded-[1.5rem] overflow-hidden shadow-xl relative">
          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-slate-100 border-b-2 border-slate-200">
                      <tr>
                          {sortOption === 'custom' && !isOrderLocked && <th className="w-10 border-b border-slate-200 sticky left-0 z-20 bg-slate-100"></th>}
                          <th className={`px-4 md:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky z-20 bg-slate-100 shadow-[4px_0_10px_rgba(0,0,0,0.05)] ${sortOption === 'custom' && !isOrderLocked ? 'left-10' : 'left-0'}`}>Subject Identity</th>
                          <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Scientific Name</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center md:text-left">Statutory Wt</th>
                          <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">History</th>
                          <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Weight</th>
                          <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right md:text-left">Intake State</th>
                          <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Location</th>
                      </tr>
                  </thead>
                  <tbody className="text-xs md:text-sm">
                      {filteredAnimals.map((animal, index) => {
                          const d = animalStats.animalData.get(animal.id);
                          const isHighHazard = animal.hazardRating === HazardRating.HIGH || animal.isVenomous;
                          const isMedHazard = animal.hazardRating === HazardRating.MEDIUM;
                          
                          return (
                              <tr 
                                key={animal.id} 
                                draggable={sortOption === 'custom' && !isOrderLocked} 
                                onDragStart={() => handleDragStart(index)} 
                                onDragOver={(e) => handleDragOver(e, index)} 
                                onDrop={(e) => handleDrop(e, index)} 
                                onClick={() => onSelectAnimal(animal)}
                                className={`bg-white hover:bg-emerald-50/60 group border-l-8 transition-all cursor-pointer ${draggedIndex === index ? 'opacity-40' : ''} ${d?.todayWeight ? 'border-l-emerald-500' : 'border-l-slate-100'}`}
                              >
                                  {sortOption === 'custom' && !isOrderLocked && (<td className="px-3 text-slate-300 group-hover:text-slate-400 border-b border-slate-100 sticky left-0 z-10 bg-inherit transition-colors"><GripVertical size={20} /></td>)}
                                  <td className={`px-4 md:px-6 py-4 border-b border-slate-100 sticky z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.03)] transition-colors group-hover:bg-emerald-50/60 ${sortOption === 'custom' && !isOrderLocked ? 'left-10' : 'left-0'}`}>
                                      <div className="flex items-center gap-3">
                                          <div className="hidden lg:block w-10 h-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                              <img src={animal.imageUrl} className="w-full h-full object-cover" alt={animal.name} />
                                          </div>
                                          <div className="min-w-0">
                                              <p className="font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{animal.name}</p>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{animal.species}</span>
                                                  {isHighHazard && (<span title="Hazard Class High" className="text-rose-600 shrink-0 animate-pulse"><Skull size={10}/></span>)}
                                                  {isMedHazard && !isHighHazard && (<span title="Hazard Class Medium" className="text-amber-500 shrink-0"><AlertTriangle size={10}/></span>)}
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="hidden lg:table-cell px-6 py-4 border-b border-slate-100">
                                      <span className="text-[10px] font-black px-3 py-1 rounded-lg border-2 border-slate-100 bg-slate-50 text-slate-500 italic tracking-wider whitespace-nowrap">{animal.latinName || '-'}</span>
                                  </td>
                                  <td className="px-4 py-4 border-b border-slate-100 text-center md:text-left">
                                      <span className={`text-sm font-black tabular-nums tracking-tight ${d?.todayWeight ? "text-emerald-700" : "text-slate-300"}`}>
                                          {getWeightDisplay(d?.todayWeight, animal.weightUnit)}
                                      </span>
                                  </td>
                                  <td className="hidden lg:table-cell px-6 py-4 border-b border-slate-100">
                                      {d?.previousWeight ? (
                                          <div className="flex flex-col gap-0.5">
                                              <span className="font-black text-slate-500 text-[11px] tracking-tight">{getWeightDisplay(d.previousWeight, animal.weightUnit)}</span>
                                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{getDateDisplay(d.previousWeight)}</span>
                                          </div>
                                      ) : (<span className="text-slate-200 text-[9px] font-black uppercase tracking-widest">N/A</span>)}
                                  </td>
                                  <td className="hidden lg:table-cell px-6 py-4 border-b border-slate-100">
                                      {(animal.flyingWeight || animal.winterWeight) ? (
                                          <div className="flex flex-col gap-1 leading-none">
                                              {animal.flyingWeight && <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">FLT: {formatWeightDisplay(animal.flyingWeight, animal.weightUnit)}</span>}
                                              {animal.winterWeight && <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">WIN: {formatWeightDisplay(animal.winterWeight, animal.weightUnit)}</span>}
                                          </div>
                                      ) : <span className="text-slate-200">--</span>}
                                  </td>
                                  <td className="px-4 py-4 border-b border-slate-100 text-right md:text-left">
                                      {d?.todayFeed ? (
                                          <div className="flex flex-col gap-0.5 md:items-start items-end">
                                              <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight leading-tight">{d.todayFeed.value}</span>
                                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                                  <span className="font-bold text-emerald-600 text-[9px] uppercase tracking-widest">{getTimeDisplay(d.todayFeed)}</span>
                                              </div>
                                          </div>
                                      ) : (<span className="text-slate-200 text-[9px] font-black uppercase tracking-widest">NIL INTAKE</span>)}
                                  </td>
                                  <td className="hidden md:table-cell px-6 py-4 text-right border-b border-slate-100">
                                      <div className="flex flex-col items-end">
                                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{animal.location}</span>
                                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">STATION</span>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
      
      {isCreateAnimalModalOpen && (
          <AnimalFormModal isOpen={isCreateAnimalModalOpen} onClose={() => setIsCreateAnimalModalOpen(false)} onSave={addAnimal} locations={locations} />
      )}
      
      {currentUser?.role === UserRole.ADMIN && (
          <button onClick={(e) => { e.stopPropagation(); setIsCreateAnimalModalOpen(true); }} className="fixed bottom-6 right-6 md:bottom-12 md:right-12 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 z-40 font-black uppercase text-xs tracking-[0.2em] group border-4 border-white">
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300"/> Add Animal
          </button>
      )}
    </div>
  );
};

export default Dashboard;
