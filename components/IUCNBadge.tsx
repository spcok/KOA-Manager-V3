
import React, { useMemo } from 'react';
import { ConservationStatus } from '../types';

interface IUCNBadgeProps {
    status?: ConservationStatus;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

// Interface for each IUCN configuration entry to support optional 'border'
interface IUCNConfigEntry {
    label: string;
    description: string;
    code: string;
    color: string;
    text: string;
    border?: string;
}

export const IUCNBadge: React.FC<IUCNBadgeProps> = ({ status, size = 'md', className = '' }) => {
    const config = useMemo(() => {
        const base: Record<ConservationStatus, IUCNConfigEntry> = {
            [ConservationStatus.LC]: { label: 'LEAST CONCERN', description: 'LEAST CONCERN', code: 'LC', color: 'bg-[#60B044]', text: 'text-white' },
            [ConservationStatus.NT]: { label: 'NEAR THREATENED', description: 'NEAR THREATENED', code: 'NT', color: 'bg-[#CCE226]', text: 'text-white' },
            [ConservationStatus.VU]: { label: 'VULNERABLE', description: 'VULNERABLE', code: 'VU', color: 'bg-[#F9E814]', text: 'text-slate-900' },
            [ConservationStatus.EN]: { label: 'ENDANGERED', description: 'ENDANGERED', code: 'EN', color: 'bg-[#F38121]', text: 'text-white' },
            [ConservationStatus.CR]: { label: 'CRITICALLY ENDANGERED', description: 'CRITICALLY ENDANGERED', code: 'CR', color: 'bg-[#D40000]', text: 'text-white' },
            [ConservationStatus.EW]: { label: 'EXTINCT IN WILD', description: 'EXTINCT IN WILD', code: 'EW', color: 'bg-[#542344]', text: 'text-white' },
            [ConservationStatus.EX]: { label: 'EXTINCT', description: 'EXTINCT', code: 'EX', color: 'bg-[#000000]', text: 'text-white' },
            [ConservationStatus.DD]: { label: 'DATA DEFICIENT', description: 'DATA DEFICIENT', code: 'DD', color: 'bg-[#D1D1D1]', text: 'text-white' },
            [ConservationStatus.NE]: { label: 'NOT EVALUATED', description: 'NOT EVALUATED', code: 'NE', color: 'bg-white', text: 'text-slate-900', border: 'border-slate-300' },
            [ConservationStatus.NC]: { label: 'NOT CHECKED', description: 'NOT CHECKED', code: 'NC', color: 'bg-[#E5E5E5]', text: 'text-slate-500' },
        };
        return base[status || ConservationStatus.NE] || base[ConservationStatus.NE];
    }, [status]);

    const sizeClasses = {
        sm: { container: 'w-12 h-12 p-1.5', label: 'text-[4px]', code: 'text-[8px]', logo: 'w-2 h-2', tail: 'top-1 right-1' },
        md: { container: 'w-20 h-20 p-2.5', label: 'text-[7px]', code: 'text-[12px]', logo: 'w-4 h-4', tail: 'top-2 right-2' },
        lg: { container: 'w-28 h-28 p-3.5', label: 'text-[9px]', code: 'text-[18px]', logo: 'w-5 h-5', tail: 'top-3 right-3' },
        xl: { container: 'w-36 h-36 p-4.5', label: 'text-[11px]', code: 'text-[24px]', logo: 'w-6 h-6', tail: 'top-4 right-4' }
    };

    const s = sizeClasses[size];

    return (
        <div className={`
            relative ${s.container} ${config.color} 
            rounded-full rounded-tr-[10%] shadow-lg 
            flex flex-col items-center justify-center text-center leading-tight 
            border-2 ${config.border || 'border-white/20'} 
            ${className}
        `}>
            {/* Small IUCN Logo elements in corner mimicking the CW/IUCN mark */}
            <div className={`absolute ${s.tail} flex flex-col items-center gap-0.5 opacity-60`}>
                <div className={`${s.logo} rounded-full border-[1px] ${config.text.includes('white') ? 'border-white/50' : 'border-slate-400'}`} />
                <div className={`text-[4px] font-black ${config.text} uppercase tracking-tighter`}>RED LIST</div>
            </div>
            
            <div className="flex flex-col items-center justify-center h-full pt-1">
                <span className={`${config.text} ${s.code} font-black tracking-tight mb-0.5`}>{config.code}</span>
                <span className={`${config.text} ${s.label} font-black uppercase tracking-widest max-w-[80%] opacity-90 leading-none`}>{config.description}</span>
            </div>
        </div>
    );
};
