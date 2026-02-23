
import React, { useState } from 'react';
import { 
  HelpCircle, FileText, Wifi, AlertTriangle, Database, Smartphone, Printer, 
  ChevronDown, ChevronUp, Wrench, ShieldCheck, User as UserIcon, Activity, 
  Settings, Clock, Scale, Utensils 
} from 'lucide-react';
import { UserRole } from '../types';
import { useAppData } from '../hooks/useAppData';

const HelpCenter: React.FC = () => {
  const { currentUser } = useAppData();
  const [openSection, setOpenSection] = useState<string | null>('general');

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isVolunteer = currentUser?.role === UserRole.VOLUNTEER;

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const Section = ({ id, title, icon: Icon, color = "bg-slate-100 text-slate-500", children }: any) => (
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={() => toggle(id)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${openSection === id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${openSection === id ? 'bg-emerald-100 text-emerald-700' : color}`}>
            <Icon size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        </div>
        {openSection === id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
      </button>
      {openSection === id && (
        <div className="p-6 border-t-2 border-slate-100 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg text-white">
          <HelpCircle size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Help & Support</h1>
          <p className="text-slate-500 font-medium">
            Welcome, {currentUser?.name}. 
            {isAdmin ? ' Accessing Administrator Knowledge Base.' : ' Accessing Volunteer Guide.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        
        <Section id="general" title="System Essentials" icon={Smartphone} color="bg-blue-50 text-blue-600">
          <div className="space-y-6 prose prose-slate max-w-none text-sm text-slate-600">
            <div>
                <h4 className="font-bold text-slate-800 text-base mb-2">Navigation Overview</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="bg-slate-50 p-3 rounded-lg border border-slate-200"><span className="font-black text-slate-700 block mb-1">Dashboard</span>Your home screen.</li>
                    <li className="bg-slate-50 p-3 rounded-lg border border-slate-200"><span className="font-black text-slate-700 block mb-1">Daily Log</span>Record weights, feeds, and checks.</li>
                    <li className="bg-slate-50 p-3 rounded-lg border border-slate-200"><span className="font-black text-slate-700 block mb-1">Tasks</span>Your specific To-Do list.</li>
                    <li className="bg-slate-50 p-3 rounded-lg border border-slate-200"><span className="font-black text-slate-700 block mb-1">Medical</span>View health records.</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2"><Clock size={16}/> Clocking In & Out</h4>
                <p>Use the buttons at the bottom of the sidebar to log your hours. This is mandatory for insurance and fire safety.</p>
            </div>
          </div>
        </Section>

        <Section id="husbandry" title="Husbandry Protocols" icon={Scale} color="bg-emerald-50 text-emerald-600">
          <div className="space-y-6 text-sm text-slate-600">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 text-base mb-2">Logging Daily Weights</h4>
                <ol className="list-decimal list-inside space-y-2 ml-1"><li>Navigate to <strong>Daily Log</strong>.</li><li>Ensure correct <strong>Category</strong>.</li><li>Tap the <strong>Weight</strong> cell.</li><li>Enter weight and Save.</li></ol>
            </div>
            <div><h4 className="font-bold text-slate-800 text-base mb-2">Feeding Logs</h4><p className="mb-2">Always record food <strong>after</strong> the animal has eaten.</p><ul className="list-disc list-inside space-y-1 ml-1"><li><strong>Raptors:</strong> Record quantity and type (e.g., "1 Chick"). Note casting.</li><li><strong>Mammals:</strong> Add multiple items (e.g., "Bowl of Veg" + "2 Eggs").</li><li><strong>Exotics:</strong> Use quick-tap icons for misting and water.</li></ul></div>
          </div>
        </Section>

        <Section id="safety" title="Health & Safety" icon={ShieldCheck} color="bg-rose-50 text-rose-600">
             <div className="space-y-4 text-sm text-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-l-4 border-rose-500 pl-4 py-1"><h5 className="font-bold text-slate-900">Incident Reporting</h5><p className="text-xs mt-1">Inform a Duty Manager immediately. Log in <strong>Incidents</strong> tab if authorized.</p></div>
                    <div className="border-l-4 border-amber-500 pl-4 py-1"><h5 className="font-bold text-slate-900">Hazardous Animals</h5><p className="text-xs mt-1">Animals marked HIGH RISK require senior staff supervision.</p></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4"><h5 className="font-bold text-slate-800 mb-2">First Aid</h5><p>Kits are in Prep Room and Office. All injuries must be recorded in the <strong>Health & Safety Log</strong>.</p></div>
             </div>
        </Section>

        {isAdmin && (
            <>
                <Section id="admin_compliance" title="Administrator: Compliance" icon={FileText} color="bg-purple-50 text-purple-600">
                    <div className="space-y-6 text-sm text-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-bold text-slate-900 mb-2">Stock Movements</h4><p className="mb-2">Use the <strong>Stock Movements</strong> tab for acquisitions, dispositions, and transfers.</p></div><div><h4 className="font-bold text-slate-900 mb-2">Annual Audits</h4><p className="mb-2">Go to <strong>Reports</strong> and select "Annual Audit".</p></div></div>
                        <div className="border-t border-slate-100 pt-4"><h4 className="font-bold text-slate-900 mb-2">Medical Records & Deceased Protocols</h4><p>To mark an animal as deceased: <strong>Medical Centre</strong> {'>'} <strong>New Record</strong> {'>'} Set Condition to <strong>Deceased</strong>. This archives the record.</p></div>
                    </div>
                </Section>
                <Section id="admin_system" title="Administrator: System Config" icon={Settings} color="bg-slate-800 text-white">
                    <div className="space-y-6 text-sm text-slate-600">
                        <div><h4 className="font-bold text-slate-900 mb-2">Managing Users</h4><p>Go to <strong>Settings {'>'} Access Control</strong> to add, edit permissions, or suspend users.</p></div>
                        <div><h4 className="font-bold text-slate-900 mb-2">Data Integrity & Backup</h4><p>Go to <strong>Settings {'>'} System Health</strong> to export backups and run diagnostics.</p></div>
                    </div>
                </Section>
            </>
        )}

        <Section id="troubleshoot" title="Troubleshooting" icon={Wrench} color="bg-orange-50 text-orange-600">
          <div className="space-y-6 text-sm text-slate-600">
            <div><h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Wifi size={16}/> Offline Mode</h4><p>The app works offline. Data syncs when connection is restored. Do not clear browser cache while offline.</p></div>
            <div><h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Activity size={16}/> Performance Issues</h4><p>Refresh the page or restart the app. Ensure you are on a modern browser like Chrome.</p></div>
            <div><h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Database size={16}/> Missing Data?</h4><p>Check if the animal has been Archived (Admin only) or if the Date Picker on Dashboard/Daily Log is correct.</p></div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default HelpCenter;
