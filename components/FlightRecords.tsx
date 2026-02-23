
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Animal, LogType, LogEntry } from '../types';
import { Map as MapIcon, Plane, Thermometer, Wind, Activity, X, Maximize2, AlertOctagon, CloudSun } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

// Declare Leaflet globally as it is loaded via CDN
declare global {
  interface Window {
    L: any;
  }
}

interface GPSStats {
  maxSpeedKph: number;
  maxAltMeters: number;
  totalDistanceKm: number;
  durationSec: number;
  path: [number, number][]; // Lat, Lon
}

// Simple GPX Parser Helper
const parseGPX = (gpxContent: string): GPSStats | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");
    const trkpts = xmlDoc.querySelectorAll('trkpt');
    
    if (trkpts.length === 0) return null;

    const path: [number, number][] = [];
    let maxAlt = -Infinity;
    let totalDist = 0;
    let maxSpeed = 0;
    let startTime: number | null = null;
    let endTime: number | null = null;

    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let prevTime: number | null = null;

    // Helper for Haversine distance in meters
    const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    };

    trkpts.forEach((pt) => {
        const lat = Number.parseFloat(pt.getAttribute('lat') || '0');
        const lon = Number.parseFloat(pt.getAttribute('lon') || '0');
        const ele = Number.parseFloat(pt.querySelector('ele')?.textContent || '0');
        const timeStr = pt.querySelector('time')?.textContent;
        const time = timeStr ? new Date(timeStr).getTime() : null;

        path.push([lat, lon]);
        if (ele > maxAlt) maxAlt = ele;

        if (prevLat !== null && prevLon !== null) {
            const d = getDist(prevLat, prevLon, lat, lon);
            totalDist += d;

            if (prevTime !== null && time !== null) {
                const dt = (time - prevTime) / 1000; // seconds
                if (dt > 0) {
                    const speed = (d / dt) * 3.6; // kph
                    if (speed > maxSpeed && speed < 150) maxSpeed = speed; // filter anomalies
                }
            }
        }

        if (startTime === null && time !== null) startTime = time;
        if (time !== null) endTime = time;

        prevLat = lat;
        prevLon = lon;
        prevTime = time;
    });

    const durationSec = (startTime && endTime) ? (endTime - startTime) / 1000 : 0;

    return {
        maxSpeedKph: maxSpeed,
        maxAltMeters: maxAlt === -Infinity ? 0 : maxAlt,
        totalDistanceKm: totalDist / 1000,
        durationSec,
        path
    };
  } catch (e) {
    console.error("GPX Parsing Error", e);
    return null;
  }
};

const FlightRecords: React.FC = () => {
    const { animals } = useAppData();
    const [selectedLog, setSelectedLog] = useState<{log: LogEntry, animal: Animal, stats: GPSStats | null} | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);

    const flightLogs = useMemo(() => {
        const logs: {log: LogEntry, animal: Animal}[] = [];
        animals.forEach(a => {
            (a.logs || []).forEach(l => {
                if (l.type === LogType.FLIGHT) {
                    logs.push({ log: l, animal: a });
                }
            });
        });
        return logs.sort((a, b) => b.log.timestamp - a.log.timestamp);
    }, [animals]);

    // Handle GPX loading
    useEffect(() => {
        if (selectedLog && selectedLog.log.gpsUrl && !selectedLog.stats) {
            const loadGpx = async () => {
                let content = '';
                if (selectedLog.log.gpsUrl?.trim().startsWith('<')) {
                    content = selectedLog.log.gpsUrl;
                } else if (selectedLog.log.gpsUrl) {
                    try {
                       const res = await fetch(selectedLog.log.gpsUrl);
                       content = await res.text();
                    } catch (e) { console.error("Failed to fetch GPX", e); }
                }

                if (content) {
                    const stats = parseGPX(content);
                    setSelectedLog(prev => prev ? ({ ...prev, stats }) : null);
                }
            };
            loadGpx();
        }
    }, [selectedLog]);

    // Handle Map
    useEffect(() => {
        if (selectedLog && selectedLog.stats && mapRef.current && window.L) {
            if (!leafletMap.current) {
                leafletMap.current = window.L.map(mapRef.current);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(leafletMap.current);
            }
            
            const map = leafletMap.current;
            // Clear previous layers
            map.eachLayer((layer: any) => {
                if (!layer._url) map.removeLayer(layer); // Keep tiles, remove others
            });

            if (selectedLog.stats.path.length > 0) {
                const polyline = window.L.polyline(selectedLog.stats.path, {color: 'red'}).addTo(map);
                map.fitBounds(polyline.getBounds());
            }
        }
    }, [selectedLog]);

    // Cleanup map on unmount
    useEffect(() => {
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        }
    }, []);

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}m ${s}s`;
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <MapIcon className="text-slate-600" size={28} /> Flight Telemetry
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">GPS Analysis & Flight Logs</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* LOGS LIST */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Recent Flights</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {flightLogs.map((item) => (
                            <div 
                                key={item.log.id}
                                onClick={() => setSelectedLog({ log: item.log, animal: item.animal, stats: null })}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedLog?.log.id === item.log.id ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={item.animal.imageUrl} className="w-full h-full object-cover" alt={item.animal.name}/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs uppercase">{item.animal.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold">{new Date(item.log.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">{item.animal.species}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                                    <span className="flex items-center gap-1"><Activity size={12}/> {item.log.flightQuality || 'N/A'}</span>
                                    <span className="flex items-center gap-1"><Plane size={12}/> {item.log.flightDuration || '-'}m</span>
                                </div>
                            </div>
                        ))}
                        {flightLogs.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Flight Records Found</div>
                        )}
                    </div>
                </div>

                {/* MAP & STATS */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
                    {selectedLog ? (
                        <>
                            {/* Stats Bar */}
                            <div className="grid grid-cols-4 gap-4 shrink-0">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MAX SPEED</p>
                                    <p className="text-xl font-black text-slate-800">{selectedLog.stats ? selectedLog.stats.maxSpeedKph.toFixed(1) : '-'} <span className="text-xs text-slate-400">km/h</span></p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MAX ALTITUDE</p>
                                    <p className="text-xl font-black text-slate-800">{selectedLog.stats ? selectedLog.stats.maxAltMeters.toFixed(0) : '-'} <span className="text-xs text-slate-400">m</span></p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DISTANCE</p>
                                    <p className="text-xl font-black text-slate-800">{selectedLog.stats ? selectedLog.stats.totalDistanceKm.toFixed(2) : '-'} <span className="text-xs text-slate-400">km</span></p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DURATION</p>
                                    <p className="text-xl font-black text-slate-800">{selectedLog.stats ? formatDuration(selectedLog.stats.durationSec) : (selectedLog.log.flightDuration ? `${selectedLog.log.flightDuration}m` : '-')}</p>
                                </div>
                            </div>

                            {/* Map Container */}
                            <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-slate-300 shadow-inner relative overflow-hidden">
                                {selectedLog.log.gpsUrl ? (
                                    <div ref={mapRef} className="w-full h-full z-0" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <AlertOctagon size={48} className="mb-2 opacity-20"/>
                                        <p className="text-xs font-black uppercase tracking-widest">No GPS Data Attached</p>
                                    </div>
                                )}
                                
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-lg max-w-xs z-10">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2">Flight Notes</h4>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                                        "{selectedLog.log.notes || 'No notes recorded.'}"
                                    </p>
                                    {selectedLog.log.weatherDesc && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                                            <CloudSun size={14}/> {selectedLog.log.weatherDesc}
                                            {selectedLog.log.windSpeed && <span className="flex items-center gap-1 ml-2"><Wind size={14}/> {selectedLog.log.windSpeed} mph</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                            <Plane size={64} className="mb-4 opacity-20"/>
                            <p className="text-sm font-black uppercase tracking-widest">Select a flight log to view telemetry</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightRecords;
