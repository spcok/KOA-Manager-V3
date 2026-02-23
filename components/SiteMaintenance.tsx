
import React, { useState, useMemo } from 'react';
import { SiteLogEntry, User } from '../types';
import { Wrench, Plus, Filter, FileText, CheckCircle, Clock, AlertTriangle, Trash2, Calendar, MapPin, PoundSterling, X, Printer, Edit2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const SiteMaintenance: React.FC = () => {
  const { siteLogs, currentUser, addSiteLog, deleteSiteLog } = useAppData();
  
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Pending' | 'In Progress' | 'Completed'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [cost, setCost] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredLogs = useMemo(() => {
    let result = [...(siteLogs || [])];
    if (filterStatus !== 'ALL') {
        result = result.filter(l => l.status === filterStatus);
    }
    // Sort by date descending (newest first)
    return result.sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return b.timestamp - a.timestamp;
    });
  }, [siteLogs, filterStatus]);

  const handleOpenModal = (log?: SiteLogEntry) => {
      if (log) {
          setEditingId(log.id);
          setTitle(log.title);
          setLocation(log.location);
          setDescription(log.description);
          setPriority(log.priority);
          setStatus(log.status);
          setCost(log.cost !== undefined ? log.cost.toString() : '');
          setLogDate(log.date);
      } else {
          setEditingId(null);
          setTitle('');
          setLocation('');
          setDescription('');
          setPriority('Medium');
          setStatus('Pending');
          setCost('');
          setLogDate(new Date().toISOString().split('T')[0]);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const entry: SiteLogEntry = {
          id: editingId || `maint_${Date.now()}`,
          date: logDate,
          title,
          description,
          location,
          priority,
          status,
          cost: cost !== '' ? Number.parseFloat(cost) : undefined,
          loggedBy: editingId ? (siteLogs.find(l => l.id === editingId)?.loggedBy || currentUser.initials) : currentUser.initials,
          timestamp: editingId ? (siteLogs.find(l => l.id === editingId)?.timestamp || Date.now()) : Date.now()
      };
      addSiteLog(entry);
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('Permanently remove maintenance record?')) {
          deleteSiteLog(id);
      }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
            <Wrench className="text-slate-600" size={28} /> Infrastructure Log
          </h1>
          <p className="text-slate-500 text-sm font-medium">Track repairs, facility upgrades, and maintenance costs.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => handleOpenModal()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 text-xs font-black uppercase tracking-widest"
            >
                <Plus size={16} /> New Entry
            </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border-2 border-slate-300 shadow-sm overflow-x-auto print:hidden w-full md:w-auto self-start inline-flex">
          {[
              { id: 'ALL', label: 'All Records' },
              { id: 'Pending', label: 'Pending' },
              { id: 'In Progress', label: 'Active' },
              { id: 'Completed', label: 'Closed' }
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      filterStatus === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b-2 border-slate-200">
                      <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Task & Location</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Budget</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right print:hidden">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors break-inside-avoid group">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600 align-top">
                                  <div className="font-bold text-slate-800">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                  <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">OFFICER: {log.loggedBy}</div>
                              </td>
                              <td className="px-6 py-4 align-top">
                                  <div className="font-black text-slate-900 uppercase tracking-tight mb-1">{log.title}</div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2"><MapPin size={10}/> {log.location}</div>
                                  <p className="text-slate-600 leading-relaxed font-medium line-clamp-2 italic">"{log.description}"</p>
                              </td>
                              <td className="px-6 py-4 align-top">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                      log.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                      log.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                      {log.priority}
                                  </span>
                              </td>
                              <td className="px-6 py-4 align-top">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                      log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                      log.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                      'bg-slate-900 text-white border-slate-800'
                                  }`}>
                                      {log.status === 'Completed' && <CheckCircle size={10}/>}
                                      {log.status === 'In Progress' && <Clock size={10} className="animate-pulse"/>}
                                      {log.status === 'Pending' && <AlertTriangle size={10}/>}
                                      {log.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right align-top">
                                  <div className="text-slate-900 font-black flex items-center justify-end gap-1">
                                      <PoundSterling size={14} className="text-slate-300"/>
                                      {log.cost !== undefined ? log.cost.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right align-top print:hidden">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleOpenModal(log)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Edit2 size={14}/></button>
                                      <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"><Trash2 size={14}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Maintenance History</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                  <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm">
                      <div><h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">{editingId ? 'Edit Record' : 'New Entry'}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Infrastructure Registry</p></div>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl shadow-inner border border-slate-200 space-y-4">
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Task Title</label><input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Aviary 4 Mesh Repair"/></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={logDate} onChange={e => setLogDate(e.target.value)} className={inputClass}/></div>
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Priority</label><select value={priority} onChange={e => setPriority(e.target.value as any)} className={inputClass}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Site Location</label><input type="text" required value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="Area ID"/></div>
                          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Status</label><select value={status} onChange={e => setStatus(e.target.value as any)} className={inputClass}><option value="Pending">Pending</option><option value="In Progress">Active</option><option value="Completed">Closed</option></select></div>
                      </div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Financial Cost (£)</label><input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className={inputClass} placeholder="0.00"/></div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Narrative</label><textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} resize-none h-24 font-medium`} placeholder="Detailed account of work completed or required..."/></div>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Commit to Registry</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SiteMaintenance;
