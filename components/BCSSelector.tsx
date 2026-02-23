
import React from 'react';

interface BCSSelectorProps {
    value: number;
    onChange: (val: number) => void;
}

export const BCSSelector: React.FC<BCSSelectorProps> = ({ value, onChange }) => {
    const options = [
        { score: 1, label: 'Emaciated', desc: 'Keel sharp, no muscle', path: "M 50 10 L 50 80 M 50 10 Q 20 20 20 80 M 50 10 Q 80 20 80 80" }, // Sharp Triangle
        { score: 2, label: 'Lean', desc: 'Keel prominent, slight muscle', path: "M 50 10 L 50 80 M 50 10 Q 15 30 20 80 M 50 10 Q 85 30 80 80" },
        { score: 3, label: 'Ideal', desc: 'Keel smooth, good muscle', path: "M 50 15 L 50 70 M 50 15 Q 10 40 20 80 M 50 15 Q 90 40 80 80" }, // Round
        { score: 4, label: 'Overweight', desc: 'Keel hard to feel', path: "M 50 30 L 50 60 M 50 30 Q 5 50 20 80 M 50 30 Q 95 50 80 80" }, // Flat top
        { score: 5, label: 'Obese', desc: 'Keel in depression', path: "M 50 40 L 50 50 M 50 40 Q 0 40 20 80 M 50 40 Q 100 40 80 80" } // Convex
    ];

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end px-2">
                {options.map((opt) => (
                    <button
                        key={opt.score}
                        type="button"
                        onClick={() => onChange(opt.score)}
                        className={`flex flex-col items-center gap-2 group transition-all relative ${value === opt.score ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                        <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shadow-sm transition-all ${
                            value === opt.score 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-2 ring-emerald-200 ring-offset-2' 
                            : 'bg-white border-slate-200 text-slate-400 group-hover:border-emerald-300'
                        }`}>
                            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                                <path d={opt.path} />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${value === opt.score ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {opt.score} - {opt.label}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-600 font-medium">
                    {options.find(o => o.score === value)?.desc || 'Select a score'}
                </p>
            </div>
        </div>
    );
};
