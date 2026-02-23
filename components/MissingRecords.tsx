
import React, { useState, useMemo } from 'react';
import { Animal, AnimalCategory, LogType } from '../types';
import { AlertOctagon, CheckCircle2, Scale, Utensils, Calendar } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

const MissingRecords: React.FC = () => {
  const { animals } = useAppData();
  
  const [daysToCheck, setDaysToCheck] = useState<number>(7);
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'ALL'>('ALL');

  const filteredAnimals = useMemo(() => {
    return selectedCategory === 'ALL' 
        ? animals 
        : animals.filter(a => a.category === selectedCategory);
  }, [animals, selectedCategory]);

  const missingRecordsAnalysis = useMemo(() => {
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = 0; i < daysToCheck; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          dates.unshift(d.toISOString().split('T')[0]);
      }

      return filteredAnimals.map(animal => {
          let missingCount = 0;
          let weightCount = 0;
          let feedCount = 0;
          const logs = animal.logs || [];
          
          const timeline = dates.map(date => {
              const hasWeight = logs.some(l => l.type === LogType.WEIGHT && l.date.startsWith(date));
              const hasFeed = logs.some(l => l.type === LogType.FEED && l.date.startsWith(date));
              const hasAny = logs.some(l => l.date.startsWith(date));

              if (hasWeight) weightCount++;
              if (hasFeed) feedCount++;
              if (!hasAny) missingCount++;

              return { date, present: hasAny };
          });

          const completionRate = Math.round(((daysToCheck - missingCount) / daysToCheck) * 100);
          const missingDates = timeline.filter(t => !t.present).map(t => t.date);

          return {
              animal,
              timeline,
              missingCount,
              weightCount,
              feedCount,
              completionRate,
              missingDates
          };
      }).sort((a, b) => b.missingCount - a.missingCount);

  }, [daysToCheck, filteredAnimals]);

  const totalMissingDays = useMemo(() => {
      return missingRecordsAnalysis?.reduce((acc, curr) => acc + curr.missingCount, 0) || 0;
  }, [missingRecordsAnalysis]);

  const inputClass = "w-full px-3 py-2 bg-white text-slate-800 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all uppercase tracking-wider";

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-300">
          <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <AlertOctagon className="text-rose-500" size={28} /> Missing Records
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Identify collection monitoring gaps for the selected period.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Section</label>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as AnimalCategory | 'ALL')}
                            className={inputClass}
                        >
                            <option value="ALL">All Sections</option>
                            {Object.values(AnimalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 md:w-32">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Period (Days)</label>
                        <input 
                            type="number" 
                            min="1" max="30"
                            value={daysToCheck}
                            onChange={(e) => setDaysToCheck(Number.parseInt(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex-1 md:w-48 bg-rose-50 border-2 border-rose-100 rounded-xl p-3 text-center">
                        <label className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Audit Alert</label>
                        <div className="text-rose-900 font-black text-sm flex justify-between items-center px-2">
                            <span className="text-[10px]">TOTAL BLANKS</span>
                            <span className="text-2xl">{totalMissingDays}</span>
                        </div>
                    </div>
                </div>
          </div>
      </div>

      <div className="space-y-4">
          {missingRecordsAnalysis?.map((item) => (
              <div key={item.animal.id} className="bg-white rounded-xl shadow-sm border-2 border-slate-300 p-4 md:p-6 transition-all hover:shadow-md hover:border-slate-400 group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-center gap-4">
                          <img src={item.animal.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold text-slate-900">{item.animal.name}</h3>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                    item.completionRate === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    item.completionRate > 70 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    {item.completionRate}% RATING
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.animal.species}</p>
                          </div>
                      </div>
                      {item.missingCount > 0 && (
                          <span className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-900/20">
                              {item.missingCount} MISSING LOGS
                          </span>
                      )}
                      {item.missingCount === 0 && (
                          <span className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                              <CheckCircle2 size={16} /> DATA COMPLETE
                          </span>
                      )}
                  </div>

                  <div className="flex items-center gap-6 mb-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Scale size={16} className="text-emerald-500" /> 
                            <span>Weights: <span className="text-slate-900">{item.weightCount}</span>/{daysToCheck}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Utensils size={16} className="text-orange-500" /> 
                            <span>Feeds: <span className="text-slate-900">{item.feedCount}</span>/{daysToCheck}</span>
                        </div>
                  </div>

                  {/* Timeline Visualization */}
                  <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 shadow-inner">
                      <div className="flex gap-1.5 h-10 w-full mb-3">
                          {item.timeline.map((day, idx) => (
                              <div 
                                key={idx}
                                title={`${day.date}: ${day.present ? 'Data Present' : 'No Records'}`}
                                className={`flex-1 rounded-md transition-all ${
                                    day.present ? 'bg-emerald-500 shadow-sm' : 'bg-rose-200 border-2 border-rose-300'
                                }`}
                              />
                          ))}
                      </div>
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Calendar size={12}/> {new Date(item.timeline[0].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                               {new Date(item.timeline[item.timeline.length - 1].date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} <Calendar size={12}/>
                          </span>
                      </div>
                  </div>
              </div>
          ))}
          {missingRecordsAnalysis?.length === 0 && (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-300 rounded-3xl text-slate-400">
                  <AlertOctagon size={48} className="mx-auto mb-4 opacity-20"/>
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Auditor Pool Empty</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default MissingRecords;
