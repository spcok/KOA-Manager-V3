
import React from 'react';
import { Table2 } from 'lucide-react';

const ReportViewer = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
      <Table2 size={48} className="opacity-20 mb-4" />
      <p className="text-xs font-black uppercase tracking-widest">Report Viewer</p>
      <p className="text-[10px] mt-1">Select a report type from the menu to load data.</p>
    </div>
  );
};

export default ReportViewer;
