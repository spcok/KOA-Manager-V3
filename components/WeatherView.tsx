
import React, { useEffect, useState, useTransition } from 'react';
import { getFullWeather, FullWeatherData } from '../services/weatherService';
import { analyzeFlightWeather } from '../services/geminiService';
import { 
    CloudSun, Wind, CloudRain, Sun, 
    Cloud, CloudLightning, Snowflake, Navigation, 
    Sparkles, Loader2, ShieldAlert, CheckCircle2, CloudFog, RefreshCw, Play,
    Thermometer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WeatherView: React.FC = () => {
  const [data, setData] = useState<FullWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // AI Advisor State
  const [isPendingAi, startTransitionAi] = useTransition();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // 1. Fetch Data with Cleanup
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      const weather = await getFullWeather();
      if (isMounted) {
          setData(weather);
          if (weather && weather.daily.length > 0) {
              setSelectedDate(weather.daily[0].date);
          }
          setIsLoading(false);
      }
    };
    loadData();

    return () => { isMounted = false; };
  }, []);

  const handleGenerateAiAnalysis = () => {
      if (!data) return;
      startTransitionAi(async () => {
          const filteredHourly = data.hourly.filter(h => h.time.startsWith(selectedDate));
          const analysis = await analyzeFlightWeather(filteredHourly);
          setAiAnalysis(analysis);
      });
  };

  useEffect(() => { setAiAnalysis(null); }, [selectedDate]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-3">
            <Loader2 size={48} className="animate-spin text-emerald-600" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Initializing Telemetry...</p>
        </div>
    );
  }

  if (!data) return <div className="p-12 text-center text-slate-400 font-bold">STATION OFFLINE</div>;

  const { current, daily, hourly } = data;
  const selectedHourly = hourly.filter(h => h.time.startsWith(selectedDate));

  const WeatherIcon = ({ code, size = 24, className = "" }: { code: number, size?: number, className?: string }) => {
     if (code === 0) return <Sun size={size} className={`text-yellow-400 ${className}`} />;
     if (code <= 3) return <CloudSun size={size} className={`text-slate-400 ${className}`} />;
     if (code <= 48) return <CloudFog size={size} className={`text-slate-400 ${className}`} />;
     if (code <= 67) return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
     if (code <= 77) return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
     if (code <= 82) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
     if (code <= 99) return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
     return <Cloud size={size} className={`text-slate-400 ${className}`} />;
  };

  const isFrostRisk = current.temperature < 4;
  const isWindRisk = current.windGust > 18 || current.windSpeed > 15;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-32">
      
      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
             <CloudSun className="text-emerald-600" size={32} /> Meteorological Station
           </h1>
           <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Kent Owl Academy • Flight Safety Briefing</p>
        </div>

        <div className="flex flex-wrap gap-3">
            {isFrostRisk && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border-2 border-blue-200">
                    <Snowflake size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">FROST RISK</span>
                </div>
            )}
            {isWindRisk && (
                <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border-2 border-rose-200">
                    <Wind size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">WIND WARNING</span>
                </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border-2 border-emerald-200">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">STATION ACTIVE</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* SIDEBAR: LIVE & AI */}
          <div className="xl:col-span-4 space-y-6">
              {/* CURRENT WEATHER CARD */}
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -mr-10 -mt-10 rounded-full"></div>
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Local Telemetry</p>
                              <h1 className="text-7xl font-black tracking-tighter tabular-nums">{Math.round(current.temperature)}<span className="text-3xl text-slate-500">°C</span></h1>
                          </div>
                          <WeatherIcon code={current.weatherCode} size={64} className="filter drop-shadow-lg" />
                      </div>
                      <p className="text-xl font-black uppercase tracking-tight mb-6">{current.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">WIND SPEED</p>
                              <p className="text-xl font-black">{current.windSpeed}<span className="text-[10px] opacity-40 ml-1">MPH</span></p>
                              <div className="flex items-center gap-1 mt-1 opacity-60">
                                  <Navigation size={10} style={{transform: `rotate(${current.windDirection}deg)`}}/>
                                  <span className="text-[8px] font-bold uppercase">{current.windDirection}°</span>
                              </div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">GUSTS</p>
                              <p className="text-xl font-black text-rose-400">{current.windGust}<span className="text-[10px] opacity-40 ml-1">MPH</span></p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase">PEAK</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* AI ADVISOR CARD */}
              <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-xl overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles className="text-emerald-500" size={16}/> Flight AI Advisor
                          </h2>
                      </div>
                      <button 
                        onClick={handleGenerateAiAnalysis}
                        disabled={isPendingAi}
                        className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg font-black uppercase text-[8px] tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isPendingAi ? <Loader2 size={10} className="animate-spin"/> : aiAnalysis ? <RefreshCw size={10}/> : <Play size={10}/>}
                        {aiAnalysis ? 'Update Audit' : 'Run Audit'}
                      </button>
                  </div>

                  <div className="p-5 overflow-y-auto max-h-64 scrollbar-thin">
                      {!aiAnalysis && !isPendingAi ? (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-300 text-center">
                              <ShieldAlert size={32} className="mb-2 opacity-20" />
                              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Safety Analysis Pending</p>
                              <p className="text-[8px] font-medium mt-1">Cross-reference forecast with flight protocols.</p>
                          </div>
                      ) : isPendingAi ? (
                          <div className="flex flex-col items-center justify-center py-10 space-y-2">
                              <Loader2 size={32} className="animate-spin text-emerald-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Analyzing Atmos...</p>
                          </div>
                      ) : (
                          <div className="prose prose-slate prose-sm max-w-none animate-in fade-in duration-300">
                               <ReactMarkdown 
                                components={{
                                    h3: ({node, ...props}) => <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2 border-b border-emerald-100 pb-1" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 text-slate-700 font-bold text-[11px] space-y-1" {...props} />,
                                    p: ({node, ...props}) => <p className="text-[11px] font-medium text-slate-600 leading-relaxed mb-3" {...props} />,
                                    strong: ({node, ...props}) => <strong className="text-slate-900 font-black" {...props} />
                                }}
                              >
                                  {aiAnalysis}
                              </ReactMarkdown>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* MAIN: FORECAST TABLE */}
          <div className="xl:col-span-8 space-y-6">
              
              {/* DATE TABS */}
              <div className="bg-white p-2 rounded-2xl border-2 border-slate-300 shadow-sm flex gap-1 overflow-x-auto scrollbar-hide">
                  {daily.slice(0, 7).map(day => (
                      <button 
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl flex flex-col items-center transition-all ${
                            day.date === selectedDate ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{new Date(day.date).toLocaleDateString('en-GB', {weekday: 'short'})}</span>
                          <span className="text-sm font-black tabular-nums">{new Date(day.date).getDate()} {new Date(day.date).toLocaleDateString('en-GB', {month: 'short'}).toUpperCase()}</span>
                          <div className="mt-2 flex items-center gap-1">
                              <WeatherIcon code={day.weatherCode} size={14} />
                              <span className="text-[10px] font-bold">{Math.round(day.maxTemp)}°</span>
                          </div>
                      </button>
                  ))}
              </div>

              {/* HOURLY TABLE */}
              <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hourly Operational Matrix</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-Resolution Micro-Telemetry Forecast</p>
                        </div>
                        <div className="text-right">
                             <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                                {new Date(selectedDate).toLocaleDateString('en-GB', { dateStyle: 'long' })}
                             </span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b-2 border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Temp (°C)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Wind / Gust (MPH)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Precip %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedHourly.map((hour, idx) => {
                                    const dateObj = new Date(hour.time);
                                    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                    const isDaytime = dateObj.getHours() >= 7 && dateObj.getHours() <= 20;
                                    
                                    return (
                                        <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${!isDaytime ? 'bg-slate-50/30' : 'bg-white'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-black text-slate-900 text-sm tabular-nums">{timeStr}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <WeatherIcon code={hour.weatherCode} size={20} />
                                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[120px]">{hour.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-base font-black text-slate-800 tabular-nums">{Math.round(hour.temp)}°</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Navigation 
                                                            size={14} 
                                                            style={{transform: `rotate(${hour.windDirection}deg)`}} 
                                                            className="text-blue-500"
                                                        />
                                                        <span className="text-base font-black text-slate-900 tabular-nums">{Math.round(hour.windSpeed)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-rose-500 uppercase leading-none">GUSTS</span>
                                                        <span className={`text-[11px] font-black tabular-nums ${hour.windGust > 18 ? 'text-rose-600' : 'text-slate-800'}`}>
                                                            {Math.round(hour.windGust)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-12 hidden sm:block">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${hour.precipProb > 50 ? 'bg-blue-500' : hour.precipProb > 20 ? 'bg-blue-300' : 'bg-slate-300'}`}
                                                            style={{ width: `${hour.precipProb}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-black tabular-nums ${hour.precipProb > 50 ? 'text-blue-600' : 'text-slate-400'}`}>{hour.precipProb}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WeatherView;
