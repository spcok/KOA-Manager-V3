
import React, { useState } from 'react';
import { Animal, LogType, LogEntry, HealthRecordType, User } from '../types';
import { Biohazard, AlertTriangle, Plus, X, ArrowRight, ShieldCheck, Thermometer } from 'lucide-react';

interface QuarantineProps {
  animals: Animal[];
  onUpdateAnimal: (animal: Animal) => void;
  currentUser?: User | null;
}

const Quarantine: React.FC<QuarantineProps> = ({ animals, onUpdateAnimal, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Move to Quarantine Form
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const quarantineAnimals = animals.filter(a => a.isQuarantine);
  const healthyAnimals = animals.filter(a => !a.isQuarantine && !a.archived);

  const handleMoveToQuarantine = (e: React.FormEvent) => {
      e.preventDefault();
      const animal = animals.find(a => a.id === selectedAnimalId);
      if (!animal) return;

      const log: LogEntry = {
          id: `q_${Date.now()}`,
          date,
          type: LogType.HEALTH,
          healthType: HealthRecordType.QUARANTINE,
          value: 'Moved to Quarantine',
          notes: `Reason: ${reason}`,
          userInitials: currentUser?.initials || 'SYS',
          timestamp: Date.now()
      };

      const updatedAnimal = {
          ...animal,
          isQuarantine: true,
          quarantineStartDate: date,
          quarantineReason: reason,
          logs: [log, ...(animal.logs || [])]
      };

      onUpdateAnimal(updatedAnimal);
      setIsModalOpen(false);
      setSelectedAnimalId('');
      setReason('');
  };

  const handleRelease = (animal: Animal) => {
      if (!window.confirm(`Release ${animal.name} from quarantine?`)) return;

      const log: LogEntry = {
          id: `q_rel_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: LogType.HEALTH,
          healthType: HealthRecordType.RELEASE,
          value: 'Released from Quarantine',
          notes: 'Cleared for return to normal activities.',
          userInitials: currentUser?.initials || 'SYS',
          timestamp: Date.now()
      };

      const updatedAnimal = {
          ...animal,
          isQuarantine: false,
          quarantineStartDate: undefined,
          quarantineReason: undefined,
          logs: [log, ...(animal.logs || [])]
      };

      onUpdateAnimal(updatedAnimal);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
             <div>
                <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
                    <Biohazard className="text-amber-600" /> Quarantine & Isolation
                </h1>
                <p className="text-stone-500">Manage animals in medical isolation or new arrivals.</p>
             </div>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-700 shadow-sm"
             >
                 <Plus size={18}/> Add to Quarantine
             </button>
        </div>

        {quarantineAnimals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quarantineAnimals.map(animal => (
                    <div key={animal.id} className="bg-amber-50 border-2 border-amber-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-amber-100 p-3 border-b border-amber-200 flex justify-between items-center">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <AlertTriangle size={18}/> {animal.name}
                            </h3>
                            <span className="text-xs font-bold bg-white text-amber-800 px-2 py-1 rounded-full border border-amber-200">
                                {animal.species}
                            </span>
                        </div>
                        <div className="p-4 flex-1">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-amber-700 uppercase mb-1">Reason for Isolation</p>
                                <p className="text-sm text-stone-800 font-medium bg-white p-2 rounded border border-amber-100">
                                    {animal.quarantineReason || "No reason specified."}
                                </p>
                            </div>
                            <div className="flex justify-between items-center text-sm text-amber-800 mb-4">
                                <span className="flex items-center gap-1"><Biohazard size={14}/> Since:</span>
                                <span className="font-bold">{new Date(animal.quarantineStartDate || Date.now()).toLocaleDateString()}</span>
                            </div>
                            
                            {/* Latest Vitals Snapshot */}
                            <div className="bg-white rounded-lg p-3 border border-amber-100 mb-2">
                                <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Latest Vitals</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1 text-stone-600">
                                        <Thermometer size={12}/> 
                                        {(animal.logs || []).find(l => l.type === LogType.TEMPERATURE)?.temperature || '-'}°C
                                    </div>
                                    <div className="text-right font-bold text-stone-700">
                                        {(animal.logs || []).find(l => l.type === LogType.WEIGHT)?.value || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-white border-t border-amber-100">
                            <button 
                                onClick={() => handleRelease(animal)}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                                <ShieldCheck size={16}/> Medical Release
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-stone-200 text-stone-400">
                <ShieldCheck size={48} className="mb-4 opacity-20 text-emerald-500" />
                <p className="font-medium text-lg">No animals currently in isolation.</p>
                <p className="text-sm">Facility is clear.</p>
            </div>
        )}

        {isModalOpen && (
            <div className="fixed inset-0 bg-stone-900/0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <Biohazard className="text-amber-600"/> Isolate Animal
                    </h2>
                    <form onSubmit={handleMoveToQuarantine} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Select Animal</label>
                            <select 
                                required 
                                value={selectedAnimalId} 
                                onChange={e => setSelectedAnimalId(e.target.value)} 
                                className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm"
                            >
                                <option value="">-- Choose --</option>
                                {healthyAnimals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Isolation Date</label>
                            <input 
                                type="date" 
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Reason / Condition</label>
                            <textarea 
                                required
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm h-24 resize-none"
                                placeholder="e.g. New arrival protocol, Showing signs of Avian Influenza..."
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-stone-500 font-bold hover:bg-stone-50 rounded-lg">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700">Confirm Isolation</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Quarantine;
