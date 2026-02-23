
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, ListTodo, Map, CalendarClock, CloudSun, 
  ArrowLeftRight, ShieldAlert, AlertTriangle, Stethoscope, Heart, Wrench, 
  AlertOctagon, Clock, Settings, LogOut, Menu, Power, 
  ChevronLeft, ChevronRight, Maximize, Minimize,
  HelpCircle, FileText, Calendar, ClipboardCheck, Wifi, WifiOff,
  Type, Minus, Plus
} from 'lucide-react';
import { UserRole, User, TimeLogEntry, UserPermissions, OrganisationProfile } from '../types';
import { useAppData } from '../hooks/useAppData';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeView, onNavigate, fontScale, setFontScale
}) => {
  const { 
    currentUser, logout, activeShift, clockIn, clockOut, orgProfile, isOffline 
  } = useAppData();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
              console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          }
      }
  };
  
  const p: UserPermissions = {
    dashboard: true, dailyLog: true, tasks: true, medical: isAdmin, 
    movements: isAdmin, safety: isAdmin, maintenance: true, settings: isAdmin,
    flightRecords: true, feedingSchedule: isAdmin, attendance: true, 
    holidayApprover: isAdmin,
    attendanceManager: isAdmin, missingRecords: isAdmin,
    reports: isAdmin, rounds: true,
    ...(currentUser?.permissions || {})
  };

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label, permission }: { view: string, icon: any, label: string, permission: boolean }) => {
      if (!permission) return null;
      const isActive = activeView === view;
      return (
        <button 
          onClick={() => handleNavigate(view)}
          title={isSidebarCollapsed ? label : ''}
          className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group relative w-full ${
            isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border-r-4 border-emerald-500' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-r-4 border-transparent'
          } ${isSidebarCollapsed ? 'justify-center px-0 border-r-0' : ''}`}
        >
          <Icon size={20} className={`transition-colors shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden text-sm font-medium">{label}</span>}
          
          {isSidebarCollapsed && isActive && (
             <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l"></div>
          )}
        </button>
      );
  };

  const SectionHeader = ({ title }: { title: string }) => {
    if (isSidebarCollapsed) return <div className="h-4"></div>;
    return (
        <div className="px-6 pt-6 pb-2 text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{title}</p>
        </div>
    );
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-[#1c1c1e] text-slate-300 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} no-print shadow-xl md:shadow-none`}>
      <div className={`h-14 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-slate-800`}>
          {!isSidebarCollapsed && <span className="font-bold text-white tracking-tight">KOA Manager</span>}
          {orgProfile?.logoUrl ? (
              <img src={orgProfile.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg bg-white/10" />
          ) : (
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-emerald-500 border border-slate-700">K</div>
          )}
      </div>

      {/* Connectivity Status Bar */}
      <div className={`px-4 py-2 border-b border-slate-800/50 flex items-center gap-2 ${isOffline ? 'bg-rose-900/20' : 'bg-emerald-900/10'}`}>
          {isOffline ? (
              <WifiOff size={14} className="text-rose-500" />
          ) : (
              <Wifi size={14} className="text-emerald-500" />
          )}
          {!isSidebarCollapsed && (
              <span className={`text-[9px] font-black uppercase tracking-widest ${isOffline ? 'text-rose-500' : 'text-emerald-500/70'}`}>
                  {isOffline ? 'Offline - Data Caching' : 'Online - Secure Sync'}
              </span>
          )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <SectionHeader title="Main Menu" />
        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" permission={p.dashboard} />
        <NavItem view="daily" icon={ClipboardList} label="Daily Log" permission={p.dailyLog} />
        <NavItem view="rounds" icon={ClipboardCheck} label="Rounds & Checks" permission={p.rounds} />
        <NavItem view="tasks" icon={ListTodo} label="To-Do List" permission={p.tasks} />
        <NavItem view="flight_records" icon={Map} label="Flight Records & GPS" permission={p.flightRecords} />
        <NavItem view="schedule" icon={CalendarClock} label="Feeding Schedule" permission={p.feedingSchedule} />
        <NavItem view="weather" icon={CloudSun} label="Weather" permission={true} />

        <SectionHeader title="Administration" />
        <NavItem view="reports" icon={FileText} label="Reports & Audits" permission={p.reports} />
        <NavItem view="movements" icon={ArrowLeftRight} label="Stock Movements" permission={p.movements} />
        <NavItem view="drills" icon={ShieldAlert} label="Emergency Drills" permission={p.safety} />
        <NavItem view="incidents" icon={AlertTriangle} label="Incidents & Issues" permission={p.safety} />
        <NavItem view="first_aid" icon={Stethoscope} label="Health & Safety Log" permission={p.safety} />
        <NavItem view="health" icon={Heart} label="Animal Medical" permission={p.medical} />
        <NavItem view="maintenance" icon={Wrench} label="Site Maintenance" permission={p.maintenance} />
        <NavItem view="missing_records" icon={AlertOctagon} label="Missing Records" permission={p.missingRecords} />

        <SectionHeader title="HR & Systems" />
        <NavItem view="timesheets" icon={Clock} label="Time Sheets" permission={p.attendance} />
        <NavItem view="holidays" icon={Calendar} label="Holiday Registry" permission={true} />
        {isAdmin && <NavItem view="settings" icon={Settings} label="Settings" permission={p.settings} />}
        <NavItem view="help" icon={HelpCircle} label="Help & Support" permission={true} />

        <div className={`mt-6 mb-2 px-4 space-y-2`}>
            {!isSidebarCollapsed && (
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button 
                        onClick={() => setFontScale(Math.max(70, fontScale - 10))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-1 flex justify-center"
                        title="Decrease Font Size"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="flex items-center gap-1 text-slate-500 font-bold text-xs px-2">
                        <Type size={14} />
                        <span>{fontScale}%</span>
                    </div>
                    <button 
                        onClick={() => setFontScale(Math.min(150, fontScale + 10))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-1 flex justify-center"
                        title="Increase Font Size"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            {!isSidebarCollapsed && (
                <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    <span className="text-xs font-black uppercase tracking-widest">{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
                </button>
            )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/50 bg-[#18181a]">
        {!isSidebarCollapsed ? (
            <>
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-black text-xs text-white border border-slate-600 shrink-0">
                        {currentUser?.initials || '--'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate text-left">{currentUser?.name || 'Unknown'}</p>
                        <p className="text-[9px] font-black text-emerald-500 truncate uppercase tracking-widest text-left">{currentUser?.jobPosition || currentUser?.role || 'Guest'}</p>
                    </div>
                    <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={16}/></button>
                </div>

                {activeShift ? (
                    <button onClick={clockOut} className="w-full bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all">
                        <Power size={14}/> CLOCK OUT
                    </button>
                ) : (
                    <button onClick={clockIn} className="w-full bg-emerald-600 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/20">
                        <Clock size={14}/> START SHIFT
                    </button>
                )}
            </>
        ) : (
            <div className="flex flex-col items-center gap-4">
                 <button onClick={logout} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Logout">
                    <LogOut size={16}/>
                 </button>
                 {activeShift ? (
                    <button onClick={clockOut} className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center hover:bg-amber-500/30 transition-colors" title="Clock Out">
                        <Power size={16}/>
                    </button>
                 ) : (
                    <button onClick={clockIn} className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-50 transition-colors" title="Clock In">
                        <Clock size={16}/>
                    </button>
                 )}
            </div>
        )}
      </div>
      
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="w-full h-8 bg-[#151516] flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors border-t border-slate-800"
      >
          {isSidebarCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-900">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] md:hidden no-print" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[80] transform transition-all duration-300 ease-in-out md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} no-print`}>
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden print:overflow-visible">
        
        <header className="md:hidden h-14 bg-[#1c1c1e] border-b border-slate-800 flex items-center justify-between px-4 z-50 no-print shadow-md">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300 p-2 -ml-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Menu size={24} />
              </button>
              
              <button 
                onClick={toggleFullscreen} 
                className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-800"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
          </div>
          <div className="flex items-center gap-2">
              {orgProfile?.logoUrl && <img src={orgProfile.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />}
              <span className="text-sm font-bold text-white">KOA Manager</span>
          </div>
          <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center font-black text-[10px] text-white border border-slate-600">{currentUser?.initials || '--'}</div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-200 print:bg-white print:overflow-visible safe-area-pb">
          {children}
        </div>
      </main>
    </div>
  );
};
export default Layout;
