import React, { useState, useMemo } from 'react';
import { TimeLogEntry, User, UserRole } from '../types';
import { Clock, Calendar, ArrowRight, Timer, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const TimeSheets: React.FC = () => {
    const { timeLogs, currentUser, users, deleteTimeLog } = useAppData();
    
    const [filterUserId, setFilterUserId] = useState<string>('ALL');
    const [filterDate, setFilterDate] = useState<string>('');
    const [editingLog, setEditingLog] = useState<TimeLogEntry | null>(null);

    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const filteredLogs = useMemo(() => {
        return [...timeLogs].filter(log => {
            const userMatch = filterUserId === 'ALL' || log.userId === filterUserId;
            const dateMatch = !filterDate || log.date === filterDate;
            return userMatch && dateMatch;
        }).sort((a, b) => b.startTime - a.startTime);
    }, [timeLogs, filterUserId, filterDate]);

    const formatDuration = (mins?: number) => {
        if (mins === undefined || mins === null) return 'Duty Active';
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        return `${hrs}h ${m}m`;
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Permanently remove this attendance record from the statutory ledger?")) {
            deleteTimeLog?.(id);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <Clock className="text-slate-600" size={28} /> Attendance Ledger
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Official record of personnel presence and operational hours.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                        <select 
                            value={filterUserId} 
                            onChange={(e) => setFilterUserId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                        >
                            <option value="ALL">Entire Team</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 md:w-40">
                        <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Log</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duty Duration</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right print:hidden">Admin</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map(log => {
                                const isActive = log.status === 'Active';
                                return (
                                    <tr key={log.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500 hover:shadow-md relative z-0 hover:z-10">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-[10px] border border-white shadow-sm">
                                                    {log.userName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{log.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 text-sm">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                            <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> Registry Key: {log.id.slice(-6)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 font-mono text-[10px] font-black text-slate-500">
                                                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">{new Date(log.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <ArrowRight size={12} className="text-slate-300" />
                                                <span className={isActive ? 'text-slate-300 italic' : 'bg-slate-50 px-2 py-1 rounded border border-slate-200'}>
                                                    {log.endTime ? new Date(log.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                <Timer size={12}/> {formatDuration(log.durationMinutes)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                isActive ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right print:hidden">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        disabled
                                                        className="p-2 text-slate-300 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                                        title="Edit Log (Disabled)"
                                                    >
                                                        <Edit2 size={14}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(log.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Attendance Records Found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TimeSheets;