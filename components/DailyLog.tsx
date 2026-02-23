
import React, { useState, useOptimistic } from 'react';
import { Animal, AnimalCategory, LogType, LogEntry } from '../types';
import { ClipboardList, Check, Droplets, ChevronLeft, ChevronRight, Plus, Thermometer, Scale, Utensils, ArrowRight } from 'lucide-react';
import { formatWeightDisplay } from '../services/weightUtils';
import AddEntryModal from './AddEntryModal';
import { useAppData } from '../hooks/useAppData';

interface DailyLogProps {
  activeCategory: AnimalCategory;
  setActiveCategory: (cat: AnimalCategory) => void;
  viewDate: string;
  setViewDate: (date: string) => void;
}

const DailyLog: React.FC<DailyLogProps> = ({ activeCategory, setActiveCategory, viewDate, setViewDate }) => {
  // FIX: Get data from context instead of props
  const { 
    animals, updateAnimal, foodOptions, feedMethods, eventTypes, 
    sortOption, setSortOption, currentUser 
  } = useAppData();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [logType, setLogType] = useState<LogType>(LogType.WEIGHT);
  const [editingLog, setEditingLog] = useState<LogEntry | undefined>(undefined);

  const [optimisticAnimals, setOptimisticAnimals] = useOptimistic(
    animals,
    (state: Animal[], newLogAction: { animalId: string, log: LogEntry }) => {
        return state.map(animal => {
            if (animal.id === newLogAction.animalId) {
                const newLogs = [newLogAction.log, ...(animal.logs || []).filter(l => l.id !== newLogAction.log.id)];
                return { ...animal, logs: newLogs };
            }
            return animal;
        });
    }
  );

  const filteredAndSortedAnimals = [...optimisticAnimals]
    .filter(a => a.category === activeCategory && !a.archived)
    .sort((a, b) => {
        if (sortOption === 'alpha-asc') return a.name.localeCompare(b.name);
        if (sortOption === 'alpha-desc') return b.name.localeCompare(a.name);
        if (sortOption === 'custom') return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        return 0;
    });

  const getTodayLog = (animal: Animal, type: LogType): LogEntry | undefined => {
    return (animal.logs || []).find(log => log.date.startsWith(viewDate) && log.type === type);
  };

  const handleCellClick = (animalId: string, type: LogType, existingLog?: LogEntry) => {
    setSelectedAnimalId(animalId);
    setLogType(type);
    setEditingLog(existingLog);
    setModalOpen(true);
  };

  const handleQuickCheck = (animal: Animal, type: LogType) => {
      const existingLog = getTodayLog(animal, type);
      if (existingLog) return; 

      const newEntry: LogEntry = {
          id: `${type.toLowerCase()}_${Date.now()}`,
          date: `${viewDate}T${new Date().toTimeString().slice(0, 5)}:00`,
          type: type,
          value: `Completed - ${type}`,
          userInitials: currentUser?.initials || '??',
          timestamp: Date.now()
      };
      
      setOptimisticAnimals({ animalId: animal.id, log: newEntry });
      updateAnimal({ ...animal, logs: [newEntry, ...(animal.logs || [])] });
  };

  const cycleSort = () => {
      if (sortOption === 'alpha-asc') setSortOption('alpha-desc');
      else if (sortOption === 'alpha-desc') setSortOption('custom');
      else setSortOption('alpha-asc');
  };

  const isExotic = activeCategory === AnimalCategory.EXOTICS;
  // Adjusted padding for mobile to allow more space
  const cellPadding = isExotic ? "px-2 md:px-4 py-3" : "px-2 md:px-5 py-4";
  const headerFontSize = isExotic ? "text-[9px]" : "text-[10px]";

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight"><ClipboardList size={28} /> Daily Operations</h1>
          <p className="text-slate-500 text-sm font-medium">Mandatory husbandry logs for {viewDate}.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-2 border-slate-200 rounded-lg bg-white px-3 py-1.5 justify-center shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Sort</span>
                <button type="button" onClick={cycleSort} className={`text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${sortOption === 'custom' ? 'text-emerald-600' : ''}`}>
                    {sortOption.replace('-', ' ')}
                    <ArrowRight size={12} className={sortOption === 'alpha-desc' ? 'rotate-90' : sortOption === 'alpha-asc' ? '-rotate-90' : 'rotate-0'}/>
                </button>
            </div>
            <div className="flex items-center bg-white p-1 rounded-xl border-2 border-slate-300 shadow-sm">
                <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-900"><ChevronLeft size={18}/></button>
                <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-800 font-black text-[10px] w-32 text-center p-0 uppercase"/>
                <button type="button" onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-slate-400 hover:text-slate-900"><ChevronRight size={18}/></button>
            </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* FIX: Explicitly cast Object.values(AnimalCategory) to string array to fix 'unknown' type error in JSX mapping. */}
        {(Object.values(AnimalCategory) as string[]).map((cat) => (
            <button key={String(cat)} type="button" onClick={() => setActiveCategory(cat as AnimalCategory)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{cat}</button>
        ))}
      </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className={`${cellPadding} ${headerFontSize} font-black text-slate-500 uppercase`}>Identity</th>
                            <th className={`${cellPadding} ${headerFontSize} font-black text-slate-500 uppercase`}>{isExotic ? 'Gradient' : 'Live Wt'}</th>
                            {!isExotic && <th className={`${cellPadding} ${headerFontSize} font-black text-slate-500 uppercase`}>Envir.</th>}
                            <th className={`${cellPadding} ${headerFontSize} font-black text-slate-500 uppercase`}>Intake</th>
                            {isExotic && <th className={`${cellPadding} ${headerFontSize} font-black text-slate-500 uppercase text-center`}>Tasks</th>}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredAndSortedAnimals.map(animal => {
                            const logs = {
                                weight: getTodayLog(animal, LogType.WEIGHT),
                                feed: getTodayLog(animal, LogType.FEED),
                                temp: getTodayLog(animal, LogType.TEMPERATURE),
                                mist: getTodayLog(animal, LogType.MISTING),
                                water: getTodayLog(animal, LogType.WATER),
                            };
                            return (
                                <tr key={animal.id} className="bg-white hover:bg-slate-50/50 group border-l-4 border-l-transparent hover:border-l-emerald-500">
                                    <td className={`${cellPadding} border-b border-slate-100`}>
                                        <div className="flex items-center gap-2">
                                            <img src={animal.imageUrl} alt="" className="hidden md:block w-8 h-8 rounded-full object-cover border-2 border-slate-200 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 uppercase text-xs md:text-sm break-words whitespace-normal leading-tight">{animal.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase break-words whitespace-normal leading-tight">{animal.species}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`${cellPadding} border-b border-slate-100`}>
                                        <button type="button" onClick={() => handleCellClick(animal.id, isExotic ? LogType.TEMPERATURE : LogType.WEIGHT, isExotic ? logs.temp : logs.weight)} className={`w-full flex items-center justify-between min-h-[2.5rem] px-2 -mx-2 rounded-xl border-2 hover:border-emerald-200 hover:bg-emerald-50/50 text-left ${!(isExotic ? logs.temp : logs.weight) ? 'border-dashed border-slate-200' : 'border-transparent'}`}>
                                            <div className="min-w-0">
                                                {isExotic ? (logs.temp ? <span><Thermometer size={12}/> {logs.temp.baskingTemp}°/{logs.temp.coolTemp}°</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Gradient</span>) : (logs.weight ? <span><Scale size={14}/> {formatWeightDisplay(logs.weight.weightGrams, animal.weightUnit)}</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Weight</span>)}
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 shrink-0 ml-1">{logs.weight ? <Check size={14} /> : <Plus size={14} />}</div>
                                        </button>
                                    </td>
                                    {!isExotic && <td className={`${cellPadding} border-b border-slate-100`}><button type="button" onClick={() => handleCellClick(animal.id, LogType.TEMPERATURE, logs.temp)} className={`w-full flex items-center justify-between min-h-[2.5rem] px-2 -mx-2 rounded-xl border-2 hover:border-emerald-200 hover:bg-emerald-50/50 text-left ${!logs.temp ? 'border-dashed border-slate-200' : 'border-transparent'}`}><div className="min-w-0">{logs.temp ? <span><Thermometer size={14}/> {logs.temp.temperature}°C</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Temp</span>}</div><div className="opacity-0 group-hover:opacity-100 shrink-0 ml-1">{logs.temp ? <Check size={14} /> : <Plus size={14} />}</div></button></td>}
                                    <td className={`${cellPadding} border-b border-slate-100`}><button type="button" onClick={() => handleCellClick(animal.id, LogType.FEED, logs.feed)} className={`w-full flex items-center justify-between min-h-[2.5rem] px-2 -mx-2 rounded-xl border-2 hover:border-emerald-200 hover:bg-emerald-50/50 text-left ${!logs.feed ? 'border-dashed border-slate-200' : 'border-transparent'}`}><div className="min-w-0">{logs.feed ? <span className="font-black text-emerald-700 uppercase truncate block"><Utensils size={10} className="inline mr-1"/>{logs.feed.value}</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Intake</span>}</div><div className="opacity-0 group-hover:opacity-100 shrink-0 ml-1">{logs.feed ? <Check size={14} /> : <Plus size={14} />}</div></button></td>
                                    {isExotic && <td className={`${cellPadding} text-center border-b border-slate-100`}><div className="flex justify-center gap-4"><button type="button" onClick={() => handleQuickCheck(animal, LogType.MISTING)}><Droplets className={logs.mist ? 'text-emerald-500' : 'text-slate-200 hover:text-emerald-300'} /></button><button type="button" onClick={() => handleQuickCheck(animal, LogType.WATER)}><Check className={logs.water ? 'text-blue-500' : 'text-slate-200 hover:text-blue-300'} /></button></div></td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

      {modalOpen && selectedAnimalId && (
          <AddEntryModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            onSave={(entry) => {
                const animal = animals.find(a => a.id === selectedAnimalId);
                if (animal) {
                    setOptimisticAnimals({ animalId: animal.id, log: entry });
                    updateAnimal({ ...animal, logs: [entry, ...(animal.logs || []).filter(l => l.id !== entry.id)] });
                }
            }} 
            animal={animals.find(a => a.id === selectedAnimalId)!} 
            initialType={logType} 
            existingLog={editingLog}
            foodOptions={foodOptions}
            feedMethods={feedMethods[activeCategory]}
            eventTypes={eventTypes}
            initialDate={viewDate}
            onUpdateAnimal={updateAnimal}
            allAnimals={animals}
          />
      )}
    </div>
  );
};

export default DailyLog;
