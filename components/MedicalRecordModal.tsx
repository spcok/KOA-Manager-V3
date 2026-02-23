
import React, { useState } from 'react';
import { Animal, LogType, LogEntry, HealthRecordType, HealthCondition, User } from '../types';
import { X, Check, Pill, Skull } from 'lucide-react';
import { BCSSelector } from './BCSSelector';

interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: LogEntry, animalId: string, isDeceased: boolean) => void;
  animals: Animal[];
  preSelectedAnimalId?: string;
  currentUser?: User | null;
}

const MedicalRecordModal: React.FC<MedicalRecordModalProps> = ({ 
  isOpen, onClose, onSave, animals, preSelectedAnimalId, currentUser 
}) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(preSelectedAnimalId || '');
  const [recordType, setRecordType] = useState<HealthRecordType>(HealthRecordType.OBSERVATION);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState<HealthCondition>(HealthCondition.HEALTHY);
  const [logEntry, setLogEntry] = useState('');
  const [bcs, setBcs] = useState(3);
  const [featherCondition, setFeatherCondition] = useState('');
  const [initials, setInitials] = useState(currentUser?.initials || '');
  
  const [medName, setMedName] = useState('');
  const [medBatch, setMedBatch] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medRoute, setMedRoute] = useState('');
  const [medFrequency, setMedFrequency] = useState('SID');
  const [medEndDate, setMedEndDate] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');

  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');

  const inputClass = "w-full px-3 py-2 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 transition-all";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId) return;

    const now = Date.now();
    const isDeceased = condition === HealthCondition.DECEASED;
    let valueStr = logEntry || recordType;
    if (isDeceased) valueStr = 'DECEASED';
    else if (recordType === HealthRecordType.MEDICATION) valueStr = `${medName} (${medDosage})`;

    const healthLog: LogEntry = {
      id: `h_${now}`,
      date: date,
      type: LogType.HEALTH,
      value: valueStr,
      notes: isDeceased ? `Cause: ${causeOfDeath}. Disposal: ${disposalMethod}. Notes: ${logEntry}` : logEntry,
      timestamp: now,
      healthType: recordType,
      condition: condition,
      bcs: bcs,
      featherCondition: featherCondition,
      userInitials: initials,
      medicationName: recordType === HealthRecordType.MEDICATION ? medName : undefined,
      medicationBatch: recordType === HealthRecordType.MEDICATION ? medBatch : undefined,
      medicationDosage: recordType === HealthRecordType.MEDICATION ? medDosage : undefined,
      medicationRoute: recordType === HealthRecordType.MEDICATION ? medRoute : undefined,
      medicationFrequency: recordType === HealthRecordType.MEDICATION ? medFrequency : undefined,
      medicationEndDate: recordType === HealthRecordType.MEDICATION ? medEndDate : undefined,
      prescribedBy: recordType === HealthRecordType.MEDICATION ? prescribedBy : undefined,
      causeOfDeath: isDeceased ? causeOfDeath : undefined,
      disposalMethod: isDeceased ? disposalMethod : undefined
    };

    onSave(healthLog, selectedAnimalId, isDeceased);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Clinical Registry</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Statutory Health Record</p>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors p-1"><X size={28}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject Patient</label>
                        <select required value={selectedAnimalId} onChange={e => setSelectedAnimalId(e.target.value)} className={inputClass} disabled={!!preSelectedAnimalId}>
                            <option value="">-- Choose Subject --</option>
                            {animals.filter(a => !a.archived || a.id === preSelectedAnimalId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Clinical Category</label>
                            <select value={recordType} onChange={e => setRecordType(e.target.value as any)} className={inputClass}>
                                {Object.values(HealthRecordType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Condition Status</label>
                            <select value={condition} onChange={e => setCondition(e.target.value as any)} className={inputClass}>
                                {Object.values(HealthCondition).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* VISUAL BCS */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Body Condition Score (Keel)</label>
                        <BCSSelector value={bcs} onChange={setBcs} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Feather/Coat Status</label>
                        <input type="text" value={featherCondition} onChange={e => setFeatherCondition(e.target.value)} className={inputClass} placeholder="Excellent/Molt/Worn"/>
                    </div>
                </div>

                {recordType === HealthRecordType.MEDICATION && (
                    <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-2">
                         <div className="flex items-center gap-2 text-blue-800 font-black text-[10px] uppercase mb-2">
                             <Pill size={14}/> Medication Parameters
                         </div>
                         <input type="text" placeholder="Pharmacological Name" required value={medName} onChange={e => setMedName(e.target.value)} className={inputClass}/>
                         <div className="grid grid-cols-2 gap-2">
                             <input type="text" placeholder="Dosage (e.g. 0.5ml)" value={medDosage} onChange={e => setMedDosage(e.target.value)} className={inputClass}/>
                             <input type="text" placeholder="Route (e.g. Oral)" value={medRoute} onChange={e => setMedRoute(e.target.value)} className={inputClass}/>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                              <select value={medFrequency} onChange={e => setMedFrequency(e.target.value)} className={inputClass}>
                                  <option value="SID">SID (Once Daily)</option>
                                  <option value="BID">BID (Twice Daily)</option>
                                  <option value="TID">TID (Three Times Daily)</option>
                                  <option value="EOD">EOD (Every Other Day)</option>
                                  <option value="Pulse">Pulse Dosing</option>
                              </select>
                              <input type="text" placeholder="Authorizing Vet" value={prescribedBy} onChange={e => setPrescribedBy(e.target.value)} className={inputClass}/>
                         </div>
                    </div>
                )}

                {condition === HealthCondition.DECEASED && (
                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-2">
                         <div className="flex items-center gap-2 text-rose-800 font-black text-[10px] uppercase mb-2">
                             <Skull size={14}/> End of Life Protocol
                         </div>
                         <input type="text" placeholder="Primary Cause of Death" required value={causeOfDeath} onChange={e => setCauseOfDeath(e.target.value)} className={inputClass}/>
                         <input type="text" placeholder="Disposal Method (e.g. Cremation/Incineration)" required value={disposalMethod} onChange={e => setDisposalMethod(e.target.value)} className={inputClass}/>
                         <div className="p-3 bg-rose-900/10 rounded-xl text-[9px] font-bold text-rose-900 uppercase">
                             WARNING: This action will archive the animal's record and remove them from the active stock ledger.
                         </div>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Clinical Narrative / Notes</label>
                    <textarea required value={logEntry} onChange={e => setLogEntry(e.target.value)} className={`${inputClass} resize-none h-28`} placeholder="Detail physical signs, behavioural changes, or diagnostics..."/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Auth. Initials</label><input type="text" required maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className={inputClass}/></div>
                </div>
                
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                  <Check size={18}/> Commit to Statutory Ledger
                </button>
            </form>
        </div>
    </div>
  );
};

export default MedicalRecordModal;
