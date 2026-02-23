
import React, { useState, useMemo } from 'react';
import { SiteLogEntry, User, TimeLogEntry } from '../types';
import { ShieldAlert, Plus, Clock, Users, Timer, X, Trash2, CheckCircle2, UserCheck, Check, Calendar } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const SafetyDrills: React.FC = () => {
  const { siteLogs, timeLogs, users, addSiteLog, deleteSiteLog, currentUser } = useAppData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDrill, setViewingDrill] = useState<SiteLogEntry | null>(null);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [drillType, setDrillType] = useState('Fire');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [verifiedUserIds, setVerifiedUserIds] = useState<Set<string>>(new Set());

  const drillLogs = useMemo(() => {
      if (!siteLogs) return [];
      return siteLogs.filter(l => l.title && l.title.includes('Drill')).sort((a, b) => b.timestamp - a.timestamp);
  }, [siteLogs]);

  const getOnSitePersonnel = (drillDate: string, drillTime: string) => {
      try {
          const drillTimestamp = new Date(`${drillDate}T${drillTime}`).getTime();
          if (isNaN(drillTimestamp)) return [];
          return timeLogs.filter(log => {
              const shiftDate = log.date;
              if (shiftDate !== drillDate) return false;
              const start = log.startTime;
              const end = log.endTime || Date.now();
              return drillTimestamp >= start && drillTimestamp <= end;
          });
      } catch (e) { return []; }
  };

  const currentOnSite = useMemo(() => getOnSitePersonnel(date, time), [date, time, timeLogs]);

  const toggleVerification = (userId: string) => {
      setVerifiedUserIds(prev => {
          const next = new Set(prev);
          if (next.has(userId)) next.delete(userId);
          else next.add(userId);
          return next;
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const verifiedList = currentOnSite.filter(p => verifiedUserIds.has(p.userId)).map(p => p.userName).join(', ');
      const missingList = currentOnSite.filter(p => !verifiedUserIds.has(p.userId)).map(p => p.userName).join(', ');

      const newLog: SiteLogEntry = {
          id: `drill_${Date.now()}`,
          date,
          title: `${drillType} Drill`,
          location: 'Site Wide',
          priority: 'High',
          status: 'Completed',
          description: JSON.stringify({
              time: time,
              duration: duration,
              totalOnSite: currentOnSite.length,
              verifiedNames: verifiedList,
              missingNames: missingList,
              performanceNotes: notes
          }),
          loggedBy: currentUser?.initials || 'SYS',
          timestamp: new Date(`${date}T${time}`).getTime()
      };

      addSiteLog(newLog);
      setIsModalOpen(false);
      setDuration('');
      setNotes('');
      setVerifiedUserIds(new Set());
  };

  const parseDrillDesc = (desc: string) => {
      try { return JSON.parse(desc); } catch (e) { return { performanceNotes: desc, verifiedNames: '', totalOnSite: 0, time: '00:00', duration: '0' }; }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <ShieldAlert className="text-emerald-600" size={28} /> Emergency Readiness Log
                </h1>
                <p className="text-slate-500 text-sm font-medium">Statutory readiness audits and cross-referenced roll calls.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest">
                <Plus size={18}/> Log Drill Event
            </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evacuation Audit</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {drillLogs.map(log => {
                            const data = parseDrillDesc(log.description);
                            const verifiedCount = data.verifiedNames ? data.verifiedNames.split(',').filter(Boolean).length : 0;
                            const isFullyAccounted = verifiedCount >= data.totalOnSite && data.totalOnSite > 0;
                            
                            return (
                                <tr key={log.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500 hover:shadow-md relative z-0 hover:z-10">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-800 text-sm">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> {data.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-xs font-black text-slate-900 uppercase block mb-1">{log.title}</span>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Timer size={10}/> {data.duration}m Duration</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            isFullyAccounted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                            {verifiedCount} / {data.totalOnSite} Personnel Cleared
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewingDrill(log)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><UserCheck size={16}/></button>
                                            <button onClick={() => deleteSiteLog(log.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {drillLogs.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Statutory Drill History</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Log Readiness Drill</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statutory Safety Audit</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                        <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border-2 border-slate-200 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alarm Trigger Time</label><input type="time" required value={time} onChange={e => setTime(e.target.value)} className={inputClass}/></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Drill Classification</label>
                                    <select value={drillType} onChange={e => setDrillType(e.target.value)} className={inputClass}>
                                        <option value="Fire">Fire Evacuation</option>
                                        <option value="Escape">Animal Escape Protocol</option>
                                        <option value="Intruder">Security / Lockdown</option>
                                        <option value="Power">Critical Utility Failure</option>
                                    </select>
                                </div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Evac Duration (Mins)</label><input type="number" required value={duration} onChange={e => setDuration(e.target.value)} className={inputClass}/></div>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Active Staff Roll Call</h3>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-sm">{verifiedUserIds.size} / {currentOnSite.length} Present</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentOnSite.map((p) => (
                                    <button key={p.id} type="button" onClick={() => toggleVerification(p.userId)} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${verifiedUserIds.has(p.userId) ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                        <span className="text-xs font-bold">{p.userName}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${verifiedUserIds.has(p.userId) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>{verifiedUserIds.has(p.userId) && <Check size={12}/>}</div>
                                    </button>
                                ))}
                                {currentOnSite.length === 0 && (
                                     <div className="col-span-2 py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No personnel clocked-in at this timestamp.</p>
                                     </div>
                                )}
                            </div>
                        </div>

                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Performance Observations</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} resize-none h-24 font-medium`} placeholder="Record readiness speed, compliance errors, or equipment issues..."/></div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">Commit & Seal Audit</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default SafetyDrills;
