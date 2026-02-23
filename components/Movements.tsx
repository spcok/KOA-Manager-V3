
import React, { useState, useMemo } from 'react';
import { Animal, LogType, LogEntry, User } from '../types';
import { ArrowLeftRight, Edit2, Trash2, Plus, X, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const Movements: React.FC = () => {
  const { animals, updateAnimal, currentUser } = useAppData();
  
  const [filterType, setFilterType] = useState<'ALL' | 'Acquisition' | 'Disposition' | 'Transfer'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<{ log: LogEntry, animalId: string } | null>(null);
  
  const [formAnimalId, setFormAnimalId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'Acquisition' | 'Disposition' | 'Transfer'>('Transfer');
  const [formSource, setFormSource] = useState('');
  const [formDest, setFormDest] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const movementLogs = useMemo(() => {
      const allLogs = animals.flatMap(animal => 
          (animal.logs || [])
            .filter(l => l.type === LogType.MOVEMENT)
            .map(log => ({ ...log, animal }))
      );
      const filtered = filterType === 'ALL' ? allLogs : allLogs.filter(l => l.movementType === filterType);
      
      return filtered.sort((a, b) => {
          const dateComp = b.date.localeCompare(a.date);
          if (dateComp !== 0) return dateComp;
          return b.timestamp - a.timestamp;
      });
  }, [animals, filterType]);

  const openModal = (logWrapper?: { log: LogEntry, animal: Animal }) => {
      if (logWrapper) {
          setEditingLog({ log: logWrapper.log, animalId: logWrapper.animal.id });
          setFormAnimalId(logWrapper.animal.id);
          setFormDate(logWrapper.log.date.split('T')[0]);
          setFormType(logWrapper.log.movementType || 'Transfer');
          setFormSource(logWrapper.log.movementSource || '');
          setFormDest(logWrapper.log.movementDestination || '');
          setFormNotes(logWrapper.log.notes || '');
      } else {
          setEditingLog(null);
          setFormAnimalId('');
          setFormDate(new Date().toISOString().split('T')[0]);
          setFormType('Transfer');
          setFormSource('');
          setFormDest('');
          setFormNotes('');
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formAnimalId || !updateAnimal) return;
      const animal = animals.find(a => a.id === formAnimalId);
      if (!animal) return;

      const movementLog: LogEntry = {
          id: editingLog ? editingLog.log.id : `mv_${Date.now()}`,
          date: formDate,
          type: LogType.MOVEMENT,
          value: `${formType}: ${formSource || 'Internal'} to ${formDest || 'Internal'}`,
          notes: formNotes,
          timestamp: editingLog ? editingLog.log.timestamp : Date.now(),
          userInitials: editingLog ? editingLog.log.userInitials : (currentUser?.initials || 'SYS'),
          movementType: formType,
          movementSource: formSource,
          movementDestination: formDest
      };

      let updatedLogs = [...(animal.logs || [])];
      if (editingLog) updatedLogs = updatedLogs.map(l => l.id === editingLog.log.id ? movementLog : l);
      else updatedLogs.unshift(movementLog);

      updateAnimal({ ...animal, location: formDest || animal.location, logs: updatedLogs });
      setIsModalOpen(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <ArrowLeftRight className="text-slate-600" size={28} /> Statutory Stock Ledger
                </h1>
                <p className="text-slate-500 text-sm font-medium">Record of collection acquisitions and dispositions (ZLA Section 9).</p>
             </div>
             <button onClick={() => openModal()} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest">
                <Plus size={18}/> Record Transit
             </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transit Vector</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {movementLogs.map(log => {
                            const isAcq = log.movementType === 'Acquisition';
                            const isDisp = log.movementType === 'Disposition';
                            return (
                                <tr key={log.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500 hover:shadow-md relative z-0 hover:z-10 cursor-default">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-800 text-sm">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                        <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest flex items-center gap-1"><UserIcon size={10}/> {log.userInitials}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{log.animal.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{log.animal.species}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            isAcq ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            isDisp ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-slate-900 text-white border-slate-800'
                                        }`}>
                                            {log.movementType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-3">
                                            {log.movementSource || 'Internal'} 
                                            <ArrowRight size={12} className="text-slate-300" /> 
                                            {log.movementDestination || 'Internal'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal({ log, animal: log.animal })} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Edit2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">Record Transit</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock Ledger Entry</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="bg-slate-50 shadow-inner p-4 rounded-xl border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Animal</label>
                                <select required value={formAnimalId} onChange={e => setFormAnimalId(e.target.value)} className={inputClass}>
                                    <option value="">-- Choose Subject --</option>
                                    {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className={inputClass}/></div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                                    <select value={formType} onChange={e => setFormType(e.target.value as any)} className={inputClass}>
                                        <option value="Transfer">Internal</option>
                                        <option value="Acquisition">Acquisition</option>
                                        <option value="Disposition">Disposition</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Origin Point</label><input type="text" value={formSource} onChange={e => setFormSource(e.target.value)} className={inputClass} placeholder="Source"/></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Terminal Point</label><input type="text" required value={formDest} onChange={e => setFormDest(e.target.value)} className={inputClass} placeholder="Destination"/></div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">
                            Commit to Ledger
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Movements;
