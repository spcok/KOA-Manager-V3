
import React, { useState } from 'react';
import { Task, Animal, LogType, User, SiteLogEntry } from '../types';
import { CheckCircle2, Circle, Plus, Calendar, User as UserIcon, AlertCircle, ListTodo, X, Check, ClipboardList, UserCheck } from 'lucide-react';
import AddEntryModal from './AddEntryModal';
import { useAppData } from '../hooks/useAppData';

const Tasks: React.FC = () => {
  const { 
    tasks, animals, addTask, updateTask, deleteTask, users = [], currentUser, updateAnimal 
  } = useAppData();

  const [filter, setFilter] = useState<'assigned' | 'pending' | 'completed'>('assigned');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimalForEntry, setSelectedAnimalForEntry] = useState<Animal | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);

  // Form State for new task
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<LogType>(LogType.GENERAL);
  const [newAnimalId, setNewAnimalId] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAssignedTo, setNewAssignedTo] = useState(currentUser?.id || '');

  const filteredTasks = tasks.filter(t => {
      if (filter === 'assigned') return !t.completed && (t.assignedTo === currentUser?.id);
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const handleTaskClick = (task: Task) => {
      if (task.completed) {
          if (window.confirm("Re-open task?")) updateTask({ ...task, completed: false });
          return;
      }
      if (task.type === LogType.HEALTH && task.animalId) {
          const animal = animals.find(a => a.id === task.animalId);
          if (animal) { 
              setCompletingTask(task);
              setSelectedAnimalForEntry(animal);
              setShowEntryModal(true);
              return;
          }
      }
      if (window.confirm(`Complete: ${task.title}?`)) {
          updateTask({ ...task, completed: true });
      }
  };

  const handleCreateTask = (e: React.FormEvent) => {
      e.preventDefault();
      const task: Task = {
          id: `task_${Date.now()}`,
          title: newTitle,
          type: newType,
          animalId: newAnimalId || undefined,
          dueDate: newDueDate,
          completed: false,
          recurring: false,
          assignedTo: newAssignedTo || undefined
      };
      addTask(task);
      setShowAddModal(false);
      setNewTitle('');
      setNewAnimalId('');
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-400";

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <ListTodo className="text-slate-600" size={28} /> Duty Rota
                </h1>
                <p className="text-slate-500 text-sm font-medium">Section Care Tasks & Assignments</p>
             </div>
             <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all hover:bg-black font-black uppercase text-xs tracking-widest flex items-center gap-2"
             >
                <Plus size={18} /> Add Duty
             </button>
        </div>

        <div className="flex bg-white p-1 rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden w-full md:w-auto self-start inline-flex">
            {[
                { id: 'assigned', label: 'My Tasks' },
                { id: 'pending', label: 'All Tasks' },
                { id: 'completed', label: 'Completed' }
            ].map(f => (
                <button 
                    key={f.id} 
                    onClick={() => setFilter(f.id as any)} 
                    className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filter === f.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    {f.label}
                </button>
            ))}
        </div>

        <div className="space-y-3 pb-24">
            {filteredTasks.length > 0 ? filteredTasks.map(task => {
                const animal = animals.find(a => a.id === task.animalId);
                const isOverdue = !task.completed && task.dueDate < new Date().toISOString().split('T')[0];
                const assignedUser = users?.find(u => u.id === task.assignedTo);

                return (
                    <div key={task.id} className={`bg-white rounded-2xl border-2 border-slate-300 border-l-4 overflow-hidden shadow-sm transition-all active:scale-[0.99] flex items-stretch hover:shadow-md ${isOverdue ? 'hover:border-l-rose-500 border-l-rose-500/20' : 'hover:border-l-emerald-500 border-l-transparent'} ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex-1 p-5 cursor-pointer" onClick={() => handleTaskClick(task)}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200 tracking-widest">{task.type}</span>
                                {isOverdue && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 tracking-widest flex items-center gap-1"><AlertCircle size={10}/> Overdue</span>}
                                {assignedUser && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-50 text-slate-500 tracking-widest border border-slate-200 flex items-center gap-1"><UserIcon size={8}/> {assignedUser.initials}</span>}
                            </div>
                            <h3 className="font-bold text-base text-slate-900 leading-tight mb-2 uppercase tracking-tight">{task.title}</h3>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                                {animal && <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{animal.name}</span>}
                            </div>
                        </div>
                        <button onClick={() => handleTaskClick(task)} className={`w-20 flex flex-col items-center justify-center transition-all border-l-2 border-slate-100 ${task.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300 hover:bg-slate-50'}`}>
                            {task.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                        </button>
                    </div>
                );
            }) : (
                <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Rota Cleared</p>
                </div>
            )}
        </div>

        {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-0 animate-in zoom-in-95 border-2 border-slate-300 overflow-hidden">
                    <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Add Duty</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Rota Assignment Registry</p>
                        </div>
                        <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 p-1"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleCreateTask} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Duty Description
                                <input 
                                    type="text" required value={newTitle} 
                                    onChange={e => { if(newTitle !== e.target.value) setNewTitle(e.target.value); }} 
                                    className={inputClass} 
                                    placeholder="e.g. Annual Health Check"
                                />
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Duty Type
                                    <select value={newType} onChange={e => { const val = e.target.value as any; if(newType !== val) setNewType(val); }} className={inputClass}>
                                        {Object.values(LogType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Subject
                                    <select value={newAnimalId} onChange={e => { if(newAnimalId !== e.target.value) setNewAnimalId(e.target.value); }} className={inputClass}>
                                        <option value="">No specific animal</option>
                                        {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Due Date
                                    <input type="date" required value={newDueDate} onChange={e => { if(newDueDate !== e.target.value) setNewDueDate(e.target.value); }} className={inputClass} />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned To
                                    <select value={newAssignedTo} onChange={e => { if(newAssignedTo !== e.target.value) setNewAssignedTo(e.target.value); }} className={inputClass}>
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.initials})</option>)}
                                    </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-4 flex gap-3">
                            <UserCheck className="text-emerald-600 shrink-0" size={18} />
                            <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase">
                                Once committed, this duty will appear in the staff member's personal dashboard and statutory rota.
                            </p>
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                            <Check size={18}/> Commit to Rota
                        </button>
                    </form>
                </div>
            </div>
        )}

        {showEntryModal && selectedAnimalForEntry && (
            <AddEntryModal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} onSave={(entry) => {
                updateAnimal?.({ ...selectedAnimalForEntry, logs: [entry, ...selectedAnimalForEntry.logs] });
                updateTask({ ...completingTask!, completed: true });
                setShowEntryModal(false);
            }} animal={selectedAnimalForEntry} initialType={completingTask?.type || LogType.HEALTH} foodOptions={{} as any} feedMethods={[]}/>
        )}
    </div>
  );
};

export default Tasks;
