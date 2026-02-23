import React, { useState, useRef } from 'react';
import { Activity, Bug, CheckCircle2, XCircle, Play, AlertTriangle, ShieldCheck, X, Terminal, RefreshCw } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { formatWeightDisplay } from '../services/weightUtils';
import { parseSmartCSV, parseCSVToAnimals } from '../services/csvService';
import { diagnosticsService, DiagnosticIssue } from '../services/diagnosticsService';
import { Animal, User, LogType, AnimalCategory, Task } from '../types';

interface TestResult {
  id: string;
  name: string;
  category: 'Security' | 'Logic' | 'State' | 'Performance';
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  duration?: number;
  logs: string[];
}

const DiagnosticOverlay: React.FC = () => {
  const { animals, users, tasks } = useAppData();

  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createTest = (id: string, name: string, category: TestResult['category']): TestResult => ({
    id, name, category, status: 'pending', logs: []
  });

  const log = (testId: string, message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];
    const logLine = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}`;
    setResults(prev => prev.map(r => r.id === testId ? { ...r, logs: [...r.logs, logLine] } : r));
  };

  const assert = (condition: boolean, msg: string, testId: string) => {
    if (!condition) {
        log(testId, `❌ ASSERTION FAILED: ${msg}`);
        throw new Error(msg);
    }
    log(testId, `✅ PASS: ${msg}`);
  };

  const runInputSanitization = async (testId: string) => {
    log(testId, "Starting Input Vector Analysis...");
    const xssVector = "<script>alert('pwned')</script>";
    const safeCsv = `Date,Name,Notes\n2024-01-01,Bird,${xssVector}`;
    log(testId, "Injecting XSS into CSV Parser...", xssVector);
    const parsed = parseSmartCSV(safeCsv, []);
    const note = parsed[0]?.logs[0]?.notes;
    assert(parsed.length > 0, "Parser survived malicious input", testId);
    assert(typeof note === 'string', "Data type integrity maintained", testId);
    assert(note === xssVector, "Content preserved without execution", testId);
    log(testId, "Testing Weight Formatter with Edge Types...");
    [{ input: null, expected: '' }, { input: undefined, expected: '' }, { input: NaN, expected: '' }, { input: Infinity, expected: '' }, { input: 0, expected: '0g' }].forEach(({ input, expected }) => {
        const res = formatWeightDisplay(input as any, 'g');
        assert(res === expected, `Input [${input}] handled safely. Got: '${res}'`, testId);
    });
    return "Security boundaries intact.";
  };

  const runLogicStressTest = async (testId: string) => {
    const ITERATIONS = 50;
    log(testId, `Starting CPU Stress Test: ${ITERATIONS} cycles...`);
    const start = performance.now();
    const heavyCSV = `Date,Name,Weight,Notes\n${Array(100).fill("2024-01-01,StressTest,500,Repeated line for load").join('\n')}`;
    for (let i = 0; i < ITERATIONS; i++) {
        formatWeightDisplay(Math.random() * 10000, 'lbs_oz');
        parseCSVToAnimals(heavyCSV);
        if (i % 10 === 0) log(testId, `Cycle ${i}/${ITERATIONS} complete...`);
    }
    const duration = performance.now() - start;
    const avg = duration / ITERATIONS;
    log(testId, `Total Duration: ${duration.toFixed(2)}ms, Avg per Cycle: ${avg.toFixed(2)}ms`);
    assert(avg < 50, "Performance within acceptable bounds (<50ms/op)", testId);
    return `Passed. Avg Load: ${avg.toFixed(2)}ms`;
  };

  const runStateAudit = async (testId: string) => {
    log(testId, `Auditing Live State: ${animals.length} Records, ${tasks.length} Tasks...`);
    if (animals.length === 0) return "No data to audit.";
    log(testId, "Checking for ID Collisions...");
    const ids = new Set();
    const duplicates = animals.filter(a => ids.has(a.id) || !ids.add(a.id));
    if (duplicates.length > 0) throw new Error(`State Integrity Failure: ${duplicates.length} Duplicate IDs`);
    log(testId, "ID Uniqueness Verified.");
    // Changed runDatabaseHealthCheck to runFullAudit to fix TS error
    const issues = diagnosticsService.runFullAudit(animals, tasks, users);
    let errors = 0, warnings = 0;
    issues.forEach(issue => {
        log(testId, `${issue.severity === 'Critical' ? 'CRITICAL' : 'WARN'}: ${issue.message}`);
        issue.severity === 'Critical' ? errors++ : warnings++;
    });
    if (errors > 0) throw new Error(`Audit Found ${errors} Critical State Errors`);
    return `Audit Complete. ${errors} Errors, ${warnings} Warnings.`;
  };

  const runSuite = async () => {
    setIsRunning(true);
    setActiveLogId(null);
    const suite = [
        createTest('sec_01', 'Input Sanitization & XSS', 'Security'),
        createTest('perf_01', 'Logic Stress Test (50x)', 'Performance'),
        createTest('state_01', 'Live Schema Validation', 'State'),
    ];
    setResults(suite);
    const runners = { 'sec_01': runInputSanitization, 'perf_01': runLogicStressTest, 'state_01': runStateAudit };

    for (const test of suite) {
        setResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'running' } : r));
        setActiveLogId(test.id);
        try {
            const start = performance.now();
            const msg = await runners[test.id as keyof typeof runners](test.id);
            const end = performance.now();
            setResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'pass', message: msg, duration: end - start } : r));
        } catch (e: any) {
            log(test.id, `FATAL ERROR: ${e.message}`);
            setResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'fail', message: e.message } : r));
        }
    }
    setIsRunning(false);
  };

  if (!isOpen) return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-4 left-4 z-[60] p-3 bg-slate-900 text-slate-500 hover:text-emerald-400 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-slate-700 opacity-50 hover:opacity-100 group" title="Open System Diagnostics">
          <Activity size={20} className="group-hover:animate-pulse" />
      </button>
  );

  const activeLogs = results.find(r => r.id === activeLogId)?.logs || [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-4"><div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Bug className="text-emerald-500" size={24} /></div><div><h2 className="text-lg font-bold text-slate-200 tracking-tight">System Integrity Engine</h2><p className="text-xs font-mono text-slate-500 mt-0.5 uppercase tracking-widest flex items-center gap-2">React v{React.version} <span className="text-slate-700">|</span> Memory: {animals.length} Nodes</p></div></div>
                <div className="flex gap-3"><button onClick={runSuite} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg transition-all">{isRunning ? <RefreshCw size={14} className="animate-spin"/> : <Play size={14} />} {isRunning ? 'Running...' : 'Run Diagnostics'}</button><button onClick={() => setIsOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2.5 rounded-lg transition-colors"><X size={20} /></button></div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 p-5 border-r border-slate-800 overflow-y-auto space-y-3">
                    {results.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4"><ShieldCheck size={64} className="opacity-20" /><p className="text-sm font-medium">Ready to verify system integrity.</p></div>) : results.map(res => (<div key={res.id} onClick={() => setActiveLogId(res.id)} className={`p-4 rounded-xl border transition-all cursor-pointer group ${activeLogId === res.id ? 'bg-slate-800/80 border-slate-600' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3">{res.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}{res.status === 'running' && <RefreshCw size={20} className="text-blue-500 animate-spin" />}{res.status === 'pass' && <CheckCircle2 size={20} className="text-emerald-500" />}{res.status === 'fail' && <XCircle size={20} className="text-rose-500" />}<div><h3 className={`text-sm font-bold ${res.status === 'fail' ? 'text-rose-400' : 'text-slate-200'}`}>{res.name}</h3><span className="text-[10px] font-black bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">{res.category}</span></div></div>{res.duration && <span className="text-[10px] font-mono text-slate-500">{res.duration.toFixed(0)}ms</span>}</div>{res.message && (<div className={`text-xs p-2 rounded-lg font-mono mt-2 ${res.status === 'fail' ? 'bg-rose-950/30 text-rose-300 border border-rose-900/50' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50'}`}>{res.status === 'fail' && <AlertTriangle size={12} className="inline mr-1.5 -mt-0.5"/>}{res.message}</div>)}</div>))}
                </div>
                <div className="w-1/2 flex flex-col bg-[#0c0c0c]">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Terminal size={12} /> Execution Log</h3>{activeLogId && <span className="text-[10px] font-mono text-emerald-600">{activeLogId}</span>}</div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5" ref={scrollRef}>
                        {activeLogs.length > 0 ? activeLogs.map((line, i) => (<div key={i} className={`break-all ${line.includes('FAIL') || line.includes('CRITICAL') ? 'text-rose-400' : line.includes('PASS') ? 'text-emerald-400' : line.includes('WARN') ? 'text-amber-400' : 'text-slate-400'}`}><span className="opacity-50 mr-2">{i+1}</span>{line}</div>)) : (<div className="text-slate-700 italic text-center mt-20">Select a test to view logs.</div>)}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DiagnosticOverlay;