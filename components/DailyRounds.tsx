
import React, { useState, useMemo, useEffect } from 'react';
import { Animal, Incident, IncidentType, IncidentSeverity, AnimalCategory } from '../types';
import { 
    ClipboardCheck, Sun, Moon, Check, X, Droplets, Lock, 
    Heart, AlertTriangle, ShieldCheck, PenTool, Loader2, Calendar as CalendarIcon
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

interface CheckState {
    isAlive?: boolean;
    isWatered: boolean;
    isSecure: boolean;
    healthIssue?: string;
    securityIssue?: string;
}

interface DailyRoundsProps {
    viewDate: string;
    setViewDate: (date: string) => void;
}

const DailyRounds: React.FC<DailyRoundsProps> = ({ viewDate, setViewDate }) => {
    // FIX: Get all data from useAppData context instead of props.
    const { animals, currentUser, addSiteLog, addIncident, siteLogs } = useAppData();

    const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
    const [activeTab, setActiveTab] = useState<AnimalCategory>(AnimalCategory.OWLS);
    const [checks, setChecks] = useState<Record<string, CheckState>>({});
    const [generalNotes, setGeneralNotes] = useState('');
    const [signingInitials, setSigningInitials] = useState(currentUser?.initials || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPastRound, setIsPastRound] = useState(false);
    
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'HEALTH' | 'SECURITY'>('HEALTH');
    const [reportAnimalId, setReportAnimalId] = useState<string | null>(null);
    const [issueText, setIssueText] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (Object.keys(checks).length === 0 && viewDate === new Date().toISOString().split('T')[0]) {
            setRoundType(hour >= 12 ? 'Evening' : 'Morning');
        }
    }, []);

    useEffect(() => {
        const existingLog = siteLogs.find(log => 
            log.date === viewDate && 
            log.title === `${roundType} Round: ${activeTab}`
        );

        if (existingLog) {
            try {
                const data = JSON.parse(existingLog.description);
                setChecks(data.details || {});
                setGeneralNotes(data.notes || '');
                setSigningInitials(data.signedBy || '');
                setIsPastRound(true);
            } catch (e) {
                console.error("Failed to parse existing round data", e);
                setChecks({});
                setGeneralNotes('');
                setSigningInitials(currentUser?.initials || '');
                setIsPastRound(false);
            }
        } else {
            setChecks({});
            setGeneralNotes('');
            setSigningInitials(currentUser?.initials || '');
            setIsPastRound(false);
        }
    }, [viewDate, roundType, activeTab, siteLogs, currentUser?.initials]);

    const categoryAnimals = useMemo(() => {
        return animals.filter(a => !a.archived && a.category === activeTab);
    }, [animals, activeTab]);

    const totalAnimals = categoryAnimals.length;
    const completedChecks = categoryAnimals.reduce((acc, animal) => {
        const check = checks[animal.id];
        if (!check) return acc;
        if (check.isAlive === false) return acc + 1; 
        if (check.isAlive === undefined) return acc;
        
        const isSecureChecked = check.isSecure || !!check.securityIssue;
        const isWateredChecked = check.isWatered;

        if (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS) {
            if (isSecureChecked) return acc + 1;
        } else {
            if (isWateredChecked && isSecureChecked) return acc + 1;
        }
        return acc;
    }, 0);
    
    const progress = Math.round((completedChecks / (totalAnimals || 1)) * 100);
    const isComplete = totalAnimals > 0 && completedChecks === totalAnimals;

    const isNoteRequired = useMemo(() => {
        if (activeTab !== AnimalCategory.OWLS && activeTab !== AnimalCategory.RAPTORS) return false;
        
        const hasUnwateredBird = categoryAnimals.some(a => {
            const c = checks[a.id];
            const isChecked = c && (c.isSecure || c.securityIssue);
            return isChecked && c.isAlive && !c.isWatered;
        });

        return hasUnwateredBird && !generalNotes.trim();
    }, [activeTab, categoryAnimals, checks, generalNotes]);

    const toggleWater = (id: string) => {
        setChecks(prev => ({
            ...prev,
            [id]: { ...prev[id] || { isAlive: undefined, isWatered: false, isSecure: false }, isWatered: !prev[id]?.isWatered }
        }));
    };

    const toggleSecure = (id: string) => {
        const current = checks[id]?.isSecure ?? false;
        if (current) {
            setReportType('SECURITY');
            setReportAnimalId(id);
            setIssueText('');
            setReportModalOpen(true);
        } else {
            setChecks(prev => ({
                ...prev,
                [id]: { ...prev[id] || { isAlive: undefined, isWatered: false, isSecure: false }, isSecure: true, securityIssue: undefined }
            }));
        }
    };

    const handleHealthToggle = (id: string) => {
        const current = checks[id]?.isAlive;
        if (current === true) {
            setReportType('HEALTH');
            setReportAnimalId(id);
            setIssueText('');
            setReportModalOpen(true);
        } else {
            setChecks(prev => ({ ...prev, [id]: { ...prev[id] || { isWatered: false, isSecure: false }, isAlive: true, healthIssue: undefined } }));
        }
    };

    const confirmIssue = () => {
        if (!reportAnimalId || !issueText) return;
        
        setChecks(prev => ({
            ...prev,
            [reportAnimalId]: { 
                ...prev[reportAnimalId] || { isAlive: undefined, isWatered: false, isSecure: false },
                ...(reportType === 'HEALTH' 
                    ? { isAlive: false, healthIssue: issueText } 
                    : { isSecure: false, securityIssue: issueText, isWatered: prev[reportAnimalId]?.isWatered ?? false })
            }
        }));
        setReportModalOpen(false);
        setReportAnimalId(null);
    };

    const handleSignOff = () => {
        if (!isComplete || !signingInitials || isNoteRequired || isPastRound) return;
        setIsSubmitting(true);
        const timestamp = Date.now();
        const dateStr = viewDate;

        categoryAnimals.forEach(animal => {
            const check = checks[animal.id];
            if (!check) return;
            const issueType = check.isAlive === false ? 'Injury' : (!check.isSecure ? 'Security' : null);
            if (issueType) {
                addIncident({
                    id: `inc_round_${timestamp}_${animal.id}`,
                    date: dateStr,
                    time: new Date().toLocaleTimeString(),
                    type: issueType as IncidentType,
                    animalId: animal.id,
                    description: `Detected during ${roundType} Round (${activeTab}): ${check.healthIssue || check.securityIssue}`,
                    location: animal.location || 'Unknown',
                    severity: IncidentSeverity.HIGH,
                    status: 'Open',
                    reportedBy: signingInitials,
                    timestamp: timestamp
                });
            }
        });

        addSiteLog({
            id: `round_${activeTab}_${timestamp}`,
            date: dateStr,
            title: `${roundType} Round: ${activeTab}`,
            description: JSON.stringify({
                type: roundType, section: activeTab, staff: currentUser?.name || 'Unknown', signedBy: signingInitials, userId: currentUser?.id || 'unknown',
                totalChecked: totalAnimals, issuesFound: categoryAnimals.filter(a => checks[a.id]?.isAlive === false || checks[a.id]?.securityIssue).length,
                notes: generalNotes, details: checks
            }),
            location: `${activeTab} Section`, priority: 'Medium', status: 'Completed', loggedBy: signingInitials, timestamp: timestamp
        });
        
        alert(`${activeTab} section signed off successfully.`);
        setGeneralNotes('');
        setIsSubmitting(false);
    };

    const tabs = Object.values(AnimalCategory);

    return (
        <div className="flex flex-col min-h-full bg-slate-100 animate-in fade-in duration-300">
            <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <ClipboardCheck className="text-emerald-600" size={24} /> Daily Rounds
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <CalendarIcon size={14} className="text-slate-400" />
                            <input 
                                type="date" 
                                value={viewDate}
                                onChange={(e) => setViewDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <button onClick={() => setRoundType('Morning')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${roundType === 'Morning' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Sun size={16} /> Morning</button>
                        <button onClick={() => setRoundType('Evening')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${roundType === 'Evening' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Moon size={16} /> Evening</button>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-2.5 text-center rounded-lg text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab ? 'bg-slate-800 text-white border-slate-600 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}>{tab}</button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-3 pb-64">
                {categoryAnimals.length === 0 ? (
                    <div className="text-center py-12 opacity-50"><p className="font-bold text-slate-400 text-sm">No animals in this section.</p></div>
                ) : (
                    categoryAnimals.map(animal => {
                        const state = checks[animal.id] || { isAlive: undefined, isWatered: false, isSecure: false };
                        const isDone = (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS) 
                            ? (state.isAlive !== undefined && (state.isSecure || !!state.securityIssue))
                            : (state.isAlive !== undefined && state.isWatered && (state.isSecure || !!state.securityIssue));
                        
                        return (
                            <div key={animal.id} className={`bg-white border-2 rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-4 transition-all ${isDone ? 'border-emerald-100 shadow-sm' : (state.isAlive === false || state.securityIssue) ? 'border-rose-100 bg-rose-50' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img src={animal.imageUrl} alt={animal.name} className="hidden md:block w-12 h-12 rounded-lg object-cover bg-slate-200 shadow-sm shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 text-sm truncate">{animal.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{animal.location}</p>
                                        {state.isAlive === false && (<span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit"><AlertTriangle size={10}/> HEALTH</span>)}
                                        {state.securityIssue && (<span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit"><ShieldCheck size={10}/> ALERT</span>)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 md:gap-4 shrink-0">
                                    <button onClick={() => handleHealthToggle(animal.id)} disabled={isPastRound} className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 transition-all ${state.isAlive === true ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : state.isAlive === false ? 'border-rose-200 bg-rose-100 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-300'} disabled:opacity-50`}>
                                        <Heart size={20} fill={state.isAlive === true ? "currentColor" : "none"} className="md:w-5 md:h-5"/>
                                        <span className="text-[7px] md:text-[8px] font-black uppercase mt-0.5 hidden md:block">{state.isAlive === true ? 'WELL' : state.isAlive === false ? 'SICK' : 'HEALTH'}</span>
                                    </button>
                                    <button onClick={() => toggleWater(animal.id)} disabled={state.isAlive === false || isPastRound} className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 transition-all ${state.isWatered ? 'border-blue-100 bg-blue-50 text-blue-500' : 'border-slate-100 bg-slate-50 text-slate-300'} disabled:opacity-50`}>
                                        {state.isWatered ? <Check size={24} className="md:w-6 md:h-6" strokeWidth={4} /> : <Droplets size={20} className="md:w-5 md:h-5"/>}
                                        <span className="text-[7px] md:text-[8px] font-black uppercase mt-0.5 hidden md:block">WATER</span>
                                    </button>
                                    <button onClick={() => toggleSecure(animal.id)} disabled={state.isAlive === false || isPastRound} className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 transition-all ${state.isSecure ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : (state.securityIssue ? 'border-rose-200 bg-rose-100 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-300')} disabled:opacity-50`}>
                                        {state.isSecure ? <Check size={24} className="md:w-6 md:h-6" strokeWidth={4} /> : (!!state.securityIssue ? <X size={24} className="md:w-6 md:h-6" strokeWidth={4} /> : <Lock size={20} className="md:w-5 md:h-5"/>)}
                                        <span className="text-[7px] md:text-[8px] font-black uppercase mt-0.5 hidden md:block">{state.isSecure ? 'SAFE' : (!!state.securityIssue ? 'RISK' : 'SECURE')}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bg-white border-t-2 border-slate-200 p-4 fixed bottom-0 left-0 md:left-64 right-0 z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"><div className="max-w-4xl mx-auto space-y-4"><div><div className="flex justify-between items-end mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab} Section Progress</span><span className={`text-xs font-black ${isComplete ? 'text-emerald-600' : 'text-slate-800'}`}>{completedChecks} / {totalAnimals} Checked</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><div className="flex gap-2"><input type="text" placeholder="Your Initials" maxLength={3} value={signingInitials} onChange={(e) => setSigningInitials(e.target.value.toUpperCase())} disabled={isPastRound} className="w-16 bg-slate-50 border-2 border-slate-200 rounded-xl px-2 py-3 text-center text-sm font-black uppercase focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50" /><input type="text" placeholder={isNoteRequired ? "MANDATORY: Why were waters skipped?" : "Section Notes..."} value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} disabled={isPastRound} className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-colors disabled:opacity-50 ${isNoteRequired ? 'bg-amber-50 border-amber-300 focus:border-amber-500 placeholder-amber-400 text-amber-800' : 'bg-slate-50 border-slate-200 focus:border-slate-400'}`}/></div>{currentUser?.signature && signingInitials && (<div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 opacity-80"><PenTool size={12} className="text-slate-400"/><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2">DIGITAL SIG:</span><img src={currentUser.signature} alt="Sig" className="h-6 w-auto mix-blend-multiply" /></div>)}</div><button onClick={handleSignOff} disabled={!isComplete || isSubmitting || !signingInitials || isNoteRequired || isPastRound} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 h-full">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18}/>} {isPastRound ? 'Signed Off' : `Verify & Sign Off ${activeTab}`}</button></div></div></div>
            {reportModalOpen && (<div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95"><div className={`p-4 border-b flex items-center gap-3 ${reportType === 'HEALTH' ? 'bg-rose-50 border-rose-100' : 'bg-orange-50 border-orange-100'}`}>{reportType === 'HEALTH' ? <AlertTriangle className="text-rose-600" size={24} /> : <Lock className="text-orange-600" size={24}/>}<h2 className={`font-black text-lg uppercase tracking-tight ${reportType === 'HEALTH' ? 'text-rose-900' : 'text-orange-900'}`}>{reportType === 'HEALTH' ? 'Report Health Issue' : 'Aviary Security Alert'}</h2></div><div className="p-6 space-y-4"><p className="text-sm font-medium text-slate-600">You are flagging <strong>{animals.find(a => a.id === reportAnimalId)?.name}</strong>. {reportType === 'SECURITY' ? ' Please describe the security or maintenance fault preventing secure lock-up.' : ' Please describe the health observation.'}</p><div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mandatory Report Notes</label><textarea autoFocus value={issueText} onChange={(e) => setIssueText(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm font-medium h-32 resize-none focus:border-slate-400 focus:outline-none" placeholder="Details required..."/></div><div className="flex gap-3"><button onClick={() => setReportModalOpen(false)} className="flex-1 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button><button onClick={confirmIssue} disabled={!issueText} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 ${reportType === 'HEALTH' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}`}>Confirm Issue</button></div></div></div></div>)}
        </div>
    );
};

export default DailyRounds;
    