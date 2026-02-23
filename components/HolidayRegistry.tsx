
import React, { useState, useMemo } from 'react';
import { HolidayRequest, UserRole } from '../types';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Trash2, Check, X, Info } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const HolidayRegistry: React.FC = () => {
    const { holidayRequests, currentUser, addHoliday, updateHoliday, deleteHoliday } = useAppData();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const canApprove = currentUser.permissions?.holidayApprover || currentUser.role === UserRole.ADMIN;

    const filteredRequests = useMemo(() => {
        if (canApprove) return holidayRequests;
        return holidayRequests.filter(r => r.userId === currentUser.id);
    }, [holidayRequests, currentUser.id, canApprove]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newReq: HolidayRequest = {
            id: `hol_${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            startDate,
            endDate,
            notes,
            status: 'Pending',
            timestamp: Date.now()
        };
        addHoliday(newReq);
        setIsModalOpen(false);
        setStartDate('');
        setEndDate('');
        setNotes('');
    };

    const handleStatusUpdate = (req: HolidayRequest, status: 'Approved' | 'Rejected') => {
        updateHoliday({
            ...req,
            status,
            approvedBy: currentUser.name
        });
    };

    const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 focus:outline-none transition-all placeholder-slate-400";

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <Calendar className="text-emerald-600" size={28} /> Holiday Registry
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Official records of staff leave and availability.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95 font-black uppercase text-xs tracking-widest">
                    <Plus size={18}/> Request Leave
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Dates</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.map(req => {
                                const isPending = req.status === 'Pending';
                                const isApproved = req.status === 'Approved';
                                const isRejected = req.status === 'Rejected';
                                const isOwner = req.userId === currentUser.id;
                                
                                return (
                                    <tr key={req.id} className="bg-white hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500 relative">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{req.userName}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                                {new Date(req.startDate).toLocaleDateString('en-GB')}
                                                <span className="text-slate-300">→</span>
                                                {new Date(req.endDate).toLocaleDateString('en-GB')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-500 font-medium italic">"{req.notes || 'N/A'}"</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                isPending ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {isPending && <Clock size={10} />}
                                                {isApproved && <CheckCircle size={10} />}
                                                {isRejected && <XCircle size={10} />}
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {canApprove && isPending && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(req, 'Approved')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm transition-all" title="Approve"><Check size={14}/></button>
                                                        <button onClick={() => handleStatusUpdate(req, 'Rejected')} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-sm transition-all" title="Reject"><X size={14}/></button>
                                                    </>
                                                )}
                                                
                                                {(canApprove || (isOwner && isPending)) && (
                                                    <button 
                                                        onClick={() => { if(window.confirm("Purge holiday request from the registry?")) deleteHoliday(req.id) }} 
                                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete Request"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredRequests.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nil Leave Registry Records</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                        <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Request Leave</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Leave Registry Application</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                        <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                        <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Reason</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Optional notes for the manager..." />
                                </div>
                            </div>
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-4 flex gap-3">
                                <Info className="text-emerald-600 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase">
                                    Note: Your request will be submitted to a Duty Manager for authorization.
                                </p>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayRegistry;
