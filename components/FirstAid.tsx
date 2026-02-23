
import React, { useState, useMemo } from 'react';
import { FirstAidLogEntry, User } from '../types';
import { Stethoscope, Plus, MapPin, Clock, X, Trash2, Calendar, User as UserIcon } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const FirstAid: React.FC = () => {
  const { firstAidLogs, currentUser, addFirstAid, deleteFirstAid } = useAppData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'Injury' | 'Illness' | 'Near Miss'>('Injury');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [outcome, setOutcome] = useState<FirstAidLogEntry['outcome']>('Returned to Work');

  const filteredLogs = useMemo(() => {
    return firstAidLogs.filter(log => 
        log.personName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return b.timestamp - a.timestamp;
    });
  }, [firstAidLogs, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addFirstAid({
          id: `fa_${Date.now()}`,
          date, time, personName, type, description, treatment,
          treatedBy: currentUser?.name || 'SYS',
          location, outcome, timestamp: Date.now()
      });
      setIsModalOpen(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Stethoscope className="text-rose-600" size={28} /> Personnel Health Log
                </h1>
                <p className="text-slate-500 text-sm font-medium">Official first aid and safety event registry for personnel.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest">
                <Plus size={18}/> Record Occurrence
            </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Personnel</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Occurrence Narrative</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status / Outcome</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-rose-500 hover:shadow-md relative z-0 hover:z-10 cursor-default">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-800 text-sm">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                    <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> {log.time}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-xs font-black text-slate-900 uppercase block mb-1">{log.personName}</span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><MapPin size={10}/> {log.location}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md line-clamp-2 italic border-l-2 border-slate-100 pl-3">"{log.description}"</p>
                                    <div className="text-[9px] font-black text-emerald-600 uppercase mt-2 tracking-widest">ADMINISTERED: {log.treatment || 'Observation Only'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                        log.type === 'Injury' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                        log.type === 'Near Miss' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-900 text-white border-slate-800'
                                    }`}>
                                        {log.type}
                                    </span>
                                    <div className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">{log.outcome}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { if(window.confirm("Permanently purge health record?")) deleteFirstAid(log.id) }} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Trash2 size={14}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Staff Health Registry History</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div><h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">Record Occurrence</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health & Safety Registry</p></div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1 transition-colors"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl shadow-inner border border-slate-200 space-y-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Name</label><input type="text" required value={personName} onChange={e => setPersonName(e.target.value)} className={inputClass} placeholder="Full Legal Name"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                                    <select value={type} onChange={e => setType(e.target.value as any)} className={inputClass}><option value="Injury">Injury</option><option value="Illness">Illness</option><option value="Near Miss">Near Miss</option></select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Outcome</label>
                                    <select value={outcome} onChange={e => setOutcome(e.target.value as any)} className={inputClass}>
                                        <option value="Returned to Work">Returned to Work</option>
                                        <option value="Restricted Duties">Restricted Duties</option>
                                        <option value="Monitoring">Monitoring (On Site)</option>
                                        <option value="Sent Home">Sent Home</option>
                                        <option value="GP Visit">GP / Medical Advice</option>
                                        <option value="Hospital">Hospital</option>
                                        <option value="Ambulance Called">Ambulance Called</option>
                                        <option value="Refused Treatment">Refused Treatment</option>
                                        <option value="None">None / Resolved</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Location</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="e.g. Flight Arena"/></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Treatment Action</label><input type="text" value={treatment} onChange={e => setTreatment(e.target.value)} className={inputClass} placeholder="e.g. Wound Cleaned"/></div>
                        </div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Incident Narrative</label><textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} resize-none h-24 font-medium`} placeholder="Detailed account of what happened..."/></div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Commit to Registry</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default FirstAid;
