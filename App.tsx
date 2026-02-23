
import React, { useState, Suspense, useEffect } from 'react';
import { Animal, AnimalCategory } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DailyLog from './components/DailyLog';
import Tasks from './components/Tasks';
import FlightRecords from './components/FlightRecords';
import Schedule from './components/Schedule';
import WeatherView from './components/WeatherView';
import Movements from './components/Movements';
import SafetyDrills from './components/SafetyDrills';
import Incidents from './components/Incidents';
import FirstAid from './components/FirstAid';
import Health from './components/Health';
import SiteMaintenance from './components/SiteMaintenance';
import MissingRecords from './components/MissingRecords';
import Settings from './components/Settings';
import LoginScreen from './components/LoginScreen';
import AnimalProfile from './components/AnimalProfile';
import TimeSheets from './components/TimeSheets';
import HelpCenter from './components/HelpCenter';
import Reports from './components/Reports';
import HolidayRegistry from './components/HolidayRegistry';
import DailyRounds from './components/DailyRounds';
import React19Playground from './components/React19Playground';
import { useAppData } from './hooks/useAppData';
import { Loader2 } from 'lucide-react';
import DiagnosticOverlay from './components/DiagnosticOverlay';
import { AppProvider } from './components/AppProvider';

const AppContent: React.FC = () => {
  const { currentUser, animals } = useAppData();

  const [view, setView] = useState<string>('dashboard');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AnimalCategory>(AnimalCategory.OWLS);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [fontScale, setFontScale] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  // Robust selection logic: ensure ID comparison is safe (string vs string)
  const selectedAnimal = selectedAnimalId 
    ? animals.find(a => String(a.id) === String(selectedAnimalId)) 
    : null;

  const selectAnimalAndNavigate = (animal: Animal) => {
    setSelectedAnimalId(String(animal.id));
    setView('animal_profile');
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        <DiagnosticOverlay />
      </>
    );
  }

  return (
    <div>
      <Layout 
        activeView={view} 
        onNavigate={setView}
        fontScale={fontScale}
        setFontScale={setFontScale}
      >
        {view === 'dashboard' && (
          <Dashboard 
            onSelectAnimal={selectAnimalAndNavigate} 
            activeTab={activeCategory} 
            setActiveTab={setActiveCategory} 
            viewDate={viewDate} 
            setViewDate={setViewDate} 
          />
        )}
        {view === 'timesheets' && <TimeSheets />}
        {view === 'holidays' && <HolidayRegistry />}
        
        {/* CRITICAL FIX: Ensure view rendering is robust even if data is loading */}
        {view === 'animal_profile' && (
          selectedAnimal ? (
            <AnimalProfile 
              animal={selectedAnimal} 
              onBack={() => { setView('dashboard'); setSelectedAnimalId(null); }} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 p-20">
               <Loader2 className="animate-spin text-emerald-600" size={48} />
               <p className="font-black uppercase tracking-widest text-xs">Locating Animal File...</p>
               <button onClick={() => setView('dashboard')} className="text-emerald-600 font-bold underline">Return to Dashboard</button>
            </div>
          )
        )}

        {view === 'daily' && <DailyLog activeCategory={activeCategory} setActiveCategory={setActiveCategory} viewDate={viewDate} setViewDate={setViewDate} />}
        {view === 'rounds' && <DailyRounds viewDate={viewDate} setViewDate={setViewDate} />}
        {view === 'tasks' && <Tasks />}
        {view === 'flight_records' && <FlightRecords />}
        {view === 'schedule' && <Schedule />}
        {view === 'weather' && <WeatherView />}
        {view === 'health' && <Health onSelectAnimal={selectAnimalAndNavigate} />}
        {view === 'movements' && <Movements />}
        {view === 'drills' && <SafetyDrills />}
        {view === 'incidents' && <Incidents />}
        {view === 'first_aid' && <FirstAid />}
        {view === 'maintenance' && <SiteMaintenance />}
        {view === 'missing_records' && <MissingRecords />}
        {view === 'reports' && <Reports />}
        {view === 'settings' && <Settings onLaunchBenchmark={() => setView('benchmark')} />}
        {view === 'help' && <HelpCenter />}
        {view === 'benchmark' && <React19Playground onBack={() => setView('settings')} />}
      </Layout>
      <DiagnosticOverlay />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
          <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Authorising Secure Environment...</p>
      </div>
    }>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Suspense>
  );
};

export default App;
