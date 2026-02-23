import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { ArrowRight, User as UserIcon, ShieldCheck, AlertCircle, Loader2, ChevronLeft, Delete } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const LoginScreen: React.FC = () => {
  const { users, login, orgProfile } = useAppData();
  
  const [step, setStep] = useState<'initials' | 'pin'>('initials');
  const [initialsInput, setInitialsInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const logoSrc = orgProfile?.logoUrl || '/logo.png';
  const orgName = orgProfile?.name || 'Kent Owl Academy';

  const handleInitialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (users.length === 0) {
        setError('Registry loading...');
        return;
    }

    const cleanInitials = initialsInput.trim().toUpperCase();
    const user = users.find(u => u.initials.toUpperCase() === cleanInitials);
    
    if (user) {
        if (user.active === false) {
            setError('Account Suspended');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setSelectedUser(user);
        setStep('pin');
        setError('');
        setPin('');
        setFailedAttempts(0);
    } else {
        setError('User not found');
        setFailedAttempts(prev => prev + 1);
        setTimeout(() => setError(''), 2000);
    }
  };

  const handlePinInput = useCallback((input: string) => {
      if (!selectedUser) return;

      if (input === 'DEL') {
          setPin(prev => prev.slice(0, -1));
          return;
      }

      if (input === 'CLR') {
          setPin('');
          return;
      }

      setPin(prev => {
          if (prev.length < 4) {
              const newPin = prev + input;
              if (newPin.length === 4) {
                  setTimeout(() => {
                      if (newPin === selectedUser.pin) {
                          login(selectedUser);
                      } else {
                          setError('Invalid PIN');
                          setFailedAttempts(prev => prev + 1);
                          setPin('');
                          setTimeout(() => setError(''), 2000);
                      }
                  }, 200);
              }
              return newPin;
          }
          return prev;
      });
  }, [selectedUser, login]);

  useEffect(() => {
      if (step !== 'pin') return;

      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key >= '0' && e.key <= '9') {
              handlePinInput(e.key);
          } else if (e.key === 'Backspace') {
              handlePinInput('DEL');
          } else if (e.key === 'Escape' || e.key === 'Delete') {
              handlePinInput('CLR');
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handlePinInput]);

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-[200] overflow-y-auto">
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
         
         <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500 my-auto">
             
             <div className="pt-8 pb-6 px-6 text-center bg-gradient-to-b from-white to-slate-50/50">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-100 border border-slate-50">
                    <img src={logoSrc} alt="Logo" className="w-auto h-10 object-contain" />
                 </div>
                 
                 <h1 className="text-lg font-bold text-slate-900 tracking-tight">{orgName}</h1>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Management System</p>
             </div>

             <div className="px-6 pb-8">
                 {step === 'initials' ? (
                     <form onSubmit={handleInitialsSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Identify Yourself</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20}/>
                                </div>
                                <input 
                                    type="text" 
                                    value={initialsInput} 
                                    onChange={(e) => setInitialsInput(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-300 text-center text-base font-bold rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all uppercase tracking-[0.2em]"
                                    placeholder="INITIALS" 
                                    maxLength={3} 
                                    autoFocus
                                    disabled={users.length === 0}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={!initialsInput || users.length === 0} 
                            className="w-full bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest py-3 rounded-xl hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {users.length === 0 ? <Loader2 className="animate-spin" size={16} /> : 'Continue'} 
                            {users.length > 0 && <ArrowRight size={16} />}
                        </button>

                        {error && (
                            <div className="flex items-center justify-center gap-2 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-1 bg-rose-50 py-3 rounded-lg">
                                <AlertCircle size={14}/> {error}
                            </div>
                        )}

                        {failedAttempts >= 2 && !showHints && (
                            <button 
                                type="button"
                                onClick={() => setShowHints(true)}
                                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Need help getting in?
                            </button>
                        )}

                        {showHints && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in slide-in-from-bottom-2">
                                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-2">Default Accounts:</p>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-emerald-700">Initials: <span className="font-black">DM</span> | PIN: <span className="font-black">8888</span></p>
                                    <p className="text-[10px] font-bold text-emerald-700">Initials: <span className="font-black">BT</span> | PIN: <span className="font-black">1234</span></p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const dm = users.find(u => u.initials === 'DM');
                                        if (dm) login(dm);
                                        else if (users.length > 0) login(users[0]);
                                    }}
                                    className="mt-3 w-full py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-emerald-700 transition-all"
                                >
                                    Emergency Bypass
                                </button>
                            </div>
                        )}
                     </form>
                 ) : (
                     <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-black text-lg border-4 border-white shadow-sm">
                                {selectedUser?.initials}
                            </div>
                            <div className="text-center">
                                <p className="text-slate-900 font-bold text-base">{selectedUser?.name}</p>
                                <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{selectedUser?.jobPosition || selectedUser?.role}</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-3 py-1">
                            {[0,1,2,3].map(i => (
                                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-slate-900 scale-125' : 'bg-slate-200'}`} />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                            {[1,2,3,4,5,6,7,8,9].map(val => (
                                <button 
                                    key={val} type="button" 
                                    onClick={() => handlePinInput(val.toString())}
                                    className="w-full aspect-square rounded-xl font-bold text-lg bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center border border-transparent hover:border-slate-100"
                                >
                                    {val}
                                </button>
                            ))}
                            <button onClick={() => setStep('initials')} className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-90">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => handlePinInput('0')} className="w-full aspect-square rounded-xl font-bold text-lg bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center border border-transparent hover:border-slate-100">
                                0
                            </button>
                            <button onClick={() => handlePinInput('DEL')} className="w-full aspect-square rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90">
                                <Delete size={18} />
                            </button>
                        </div>
                        
                        {error && <p className="text-rose-500 text-xs font-bold text-center animate-pulse">{error}</p>}
                     </div>
                 )}
             </div>

             <div className="bg-slate-50 py-4 px-8 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <ShieldCheck size={12} className="text-emerald-500" /> Secure Environment
             </div>
         </div>
    </div>
  );
};

export default LoginScreen;