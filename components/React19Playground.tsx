
import React, { useState, useActionState, useOptimistic, useTransition, use, Suspense, memo } from 'react';
import { ArrowLeft, Activity, Zap, Database, ShieldCheck, AlertTriangle, Loader2, Send, Server, Cpu } from 'lucide-react';

// --- Types ---
interface PlaygroundProps {
  onBack: () => void;
}

// --- MOCK SERVER ACTIONS (Simulated) ---

// 1. Reliability Action
async function updateUserProfile(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const shouldFail = formData.get('shouldFail') === 'on';
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Latency

  if (shouldFail) {
    return { 
      success: false, 
      message: 'Server Error: Database connection timeout (Simulated 500)', 
      timestamp: Date.now() 
    };
  }

  return { 
    success: true, 
    message: `Profile updated successfully for user: ${username}`, 
    timestamp: Date.now() 
  };
}

// 2. Efficiency Action
async function postComment(message: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2s Latency
  if (message.includes('fail')) throw new Error('Simulated Rejection');
  return message;
}

// 3. Data Fetching Resource (Cache Simulation)
const resourceCache = new Map<string, Promise<any>>();

const fetchData = (key: string) => {
  if (!resourceCache.has(key)) {
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve({ 
          id: key, 
          status: 'Active', 
          data: Array.from({ length: 5 }, (_, i) => `Metric ${key}-${i + 1}`) 
        });
      }, 1500);
    });
    resourceCache.set(key, promise);
  }
  return resourceCache.get(key)!;
};

// --- SUB-COMPONENTS ---

const SafeForm = () => {
  // REQUIREMENT: useActionState
  const [state, formAction, isPending] = useActionState(updateUserProfile, { 
    success: false, 
    message: '', 
    timestamp: 0 
  });

  const [failToggle, setFailToggle] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShieldCheck size={20}/></div>
        <div>
          <h3 className="font-bold text-slate-800">Reliability Lab</h3>
          <p className="text-xs text-slate-500">useActionState & useFormStatus</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
          <input name="username" type="text" defaultValue="AdminUser" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 transition-all" />
        </div>

        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
          <input type="checkbox" name="shouldFail" checked={failToggle} onChange={e => setFailToggle(e.target.checked)} className="w-5 h-5 accent-rose-500" />
          <span className="text-sm font-bold text-slate-700">Simulate Server Error (500)</span>
        </label>

        <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-black transition-all"
        >
           {isPending ? <Loader2 className="animate-spin" size={18}/> : <Server size={18}/>}
           {isPending ? 'Committing...' : 'Update Profile'}
        </button>

        {state.message && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {state.success ? <ShieldCheck size={18}/> : <AlertTriangle size={18}/>}
            {state.message}
          </div>
        )}
      </form>
    </div>
  );
};

// Efficiency: Optimistic Feed
const LiveComments = () => {
  const [messages, setMessages] = useState<{id: number, text: string, pending?: boolean}[]>([
    { id: 1, text: "System Online" },
    { id: 2, text: "Metrics Loaded" }
  ]);
  
  // REQUIREMENT: useOptimistic
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [
      ...state,
      { id: Date.now(), text: newMessage, pending: true }
    ]
  );

  const formAction = async (formData: FormData) => {
    const text = formData.get('message') as string;
    if (!text) return;

    // Trigger optimistic update
    addOptimisticMessage(text);
    
    // Actual Mutation
    try {
      await postComment(text);
      setMessages(prev => [...prev, { id: Date.now(), text }]);
    } catch (e) {
      alert("Failed to post: Reverting UI");
      // React automatically reverts optimistic state on re-render if state isn't updated
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Zap size={20}/></div>
        <div>
          <h3 className="font-bold text-slate-800">Efficiency Lab</h3>
          <p className="text-xs text-slate-500">useOptimistic UI Patterns</p>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-xl p-4 space-y-2 overflow-y-auto max-h-[300px]">
        {optimisticMessages.map((msg, idx) => (
          <div key={idx} className={`p-3 rounded-lg text-sm font-medium flex justify-between items-center ${msg.pending ? 'bg-white border-2 border-slate-200 opacity-70' : 'bg-white shadow-sm border border-slate-100'}`}>
            <span>{msg.text}</span>
            {msg.pending && <Loader2 size={14} className="animate-spin text-slate-400"/>}
          </div>
        ))}
      </div>

      <form action={formAction} className="flex gap-2">
        <input name="message" placeholder="Type 'fail' to test rollback..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 transition-all" />
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all"><Send size={20}/></button>
      </form>
    </div>
  );
};

// Performance: Stress Grid
const HeavyGrid = memo(({ query }: { query: string }) => {
  const items = Array.from({ length: 5000 }, (_, i) => `Item ${i} - ${Math.random().toString(36).substring(7)}`);
  const filtered = items.filter(i => i.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 h-64 overflow-y-auto pr-2">
      {filtered.map((item, idx) => (
        <div key={idx} className="h-8 bg-emerald-50 border border-emerald-100 rounded text-[10px] flex items-center justify-center text-emerald-800 truncate px-1">
          {item}
        </div>
      ))}
      {filtered.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">No matches found in 5,000 items</div>}
    </div>
  );
});

const StressTest = () => {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  
  // REQUIREMENT: useTransition
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val); // Update input immediately
    startTransition(() => {
      setDeferredQuery(val); // Defer list update
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Cpu size={20}/></div>
        <div>
          <h3 className="font-bold text-slate-800">Performance Lab</h3>
          <p className="text-xs text-slate-500">useTransition (5,000 Items)</p>
        </div>
      </div>

      <div className="relative">
        <input 
          value={query} 
          onChange={handleChange} 
          placeholder="Filter 5,000 items immediately..." 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
        />
        {isPending && <div className="absolute right-3 top-3"><Loader2 size={20} className="animate-spin text-emerald-500"/></div>}
      </div>

      <HeavyGrid query={deferredQuery} />
      <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
        Rendering {deferredQuery ? 'Filtered' : 'All'} Nodes {isPending ? '(Calculating...)' : '(Idle)'}
      </p>
    </div>
  );
};

// Data Fetching: Modern Suspense
const DataView = ({ resourceKey }: { resourceKey: string }) => {
  // REQUIREMENT: use(Promise)
  // Note: In real app, promise creation should be memoized or outside render.
  // Here we use a singleton cache helper.
  const data = use(fetchData(resourceKey));

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <span>ID: {data.id}</span>
        <span className="text-emerald-600">{data.status}</span>
      </div>
      <div className="space-y-1">
        {data.data.map((item: string, i: number) => (
          <div key={i} className="bg-slate-800 text-slate-300 p-2 rounded text-xs font-mono">{item}</div>
        ))}
      </div>
    </div>
  );
};

const ModernDataLab = () => {
  const [key, setKey] = useState('Alpha');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-full">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Database size={20}/></div>
        <div>
          <h3 className="font-bold text-slate-800">Suspense Lab</h3>
          <p className="text-xs text-slate-500">use(Promise) & Boundaries</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['Alpha', 'Beta', 'Gamma'].map(k => (
          <button 
            key={k} 
            onClick={() => setKey(k)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${key === k ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Load {k}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl p-4 min-h-[160px]">
        {/* REQUIREMENT: Suspense Boundary */}
        <Suspense fallback={
          <div className="h-full flex flex-col items-center justify-center text-purple-400 gap-2">
            <Loader2 size={24} className="animate-spin"/>
            <span className="text-[10px] font-black uppercase tracking-widest">Streaming Data...</span>
          </div>
        }>
          <DataView resourceKey={key} />
        </Suspense>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---

const React19Playground: React.FC<PlaygroundProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <ArrowLeft size={20}/>
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Activity className="text-emerald-500"/> React 19 Benchmark Lab
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance & Reliability Testbed</p>
            </div>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded text-[10px] font-mono text-slate-500 font-bold">
            v19.0.0 (Canary)
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SafeForm />
          <LiveComments />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <StressTest />
          </div>
          <div className="lg:col-span-1">
            <ModernDataLab />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React19Playground;
