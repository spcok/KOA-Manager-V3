
import React, { useState, useMemo } from 'react';
import { Incident, IncidentType, IncidentSeverity, Animal, User } from '../types';
import { ShieldAlert, Plus, Calendar, Clock, X, AlertTriangle, MapPin, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const Incidents: React.FC = () => {
  const { incidents, animals, currentUser, addIncident, updateIncident, deleteIncident } = useAppData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'ALL'>('ALL');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<IncidentType>(IncidentType.OTHER);
  const [severity, setSeverity] = useState<IncidentSeverity>(IncidentSeverity.MEDIUM);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const filteredIncidents = useMemo(() => {
    return incidents
      .filter(inc => {
        const matchesSearch = inc.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             inc.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'ALL' || inc.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
          const dateComp = b.date.localeCompare(a.date);
          if (dateComp !== 0) return dateComp;
          return b.timestamp - a.timestamp;
      });
  }, [incidents, searchTerm, filterSeverity]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addIncident({
          id: `inc_${Date.now()}`,
          date, 
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 
          type, 
          severity, 
          description,
          location: location || 'Site Wide', 
          status: 'Open', 
          reportedBy: currentUser?.initials || 'SYS', 
          timestamp: Date.now()
      });
      setIsModalOpen(false);
      setDescription('');
      setLocation('');
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <ShieldAlert className="text-rose-600" size={28} /> Statutory Incident Log
                </h1>
                <p className="text-slate-500 text-sm font-medium">Compliance records for health, safety, and security events.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest">
                <Plus size={18}/> New Occurrence
            </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event & Location</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Official Narrative</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredIncidents.map(incident => {
                            const isCritical = incident.severity === IncidentSeverity.CRITICAL || incident.severity === IncidentSeverity.HIGH;
                            return (
                                <tr key={incident.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500 hover:shadow-md relative z-0 hover:z-10 cursor-default">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-800 text-sm">{new Date(incident.date).toLocaleDateString('en-GB')}</div>
                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> {incident.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-xs font-black text-slate-900 uppercase block mb-1">{incident.type}</span>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest"><MapPin size={10}/> {incident.location}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md line-clamp-2 italic border-l-2 border-slate-100 pl-3">"{incident.description}"</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-900 text-white border-slate-800'
                                        }`}>
                                            {isCritical && <AlertTriangle size={10} />}
                                            {incident.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { if(window.confirm("Purge incident record?")) deleteIncident(incident.id) }} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredIncidents.length === 0 && (
                             <tr><td colSpan={5} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Incident History</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div><h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">New Occurrence</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Compliance Registry</p></div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1 transition-colors"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl shadow-inner border border-slate-200 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                                    <select value={type} onChange={e => setType(e.target.value as any)} className={inputClass}>
                                        {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Occurrence Location</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="Site Area"/></div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Risk Severity</label>
                                <select value={severity} onChange={e => setSeverity(e.target.value as any)} className={inputClass}>
                                    {Object.values(IncidentSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Official Account / Description</label><textarea required value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} resize-none h-32 font-medium`} placeholder="Detailed narrative..."/></div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Commit to Ledger</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Incidents;
