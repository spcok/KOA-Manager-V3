
import React from 'react';
import { FileText, Download } from 'lucide-react';

const ReportDocument = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
      <div className="p-4 bg-white rounded-full shadow-sm mb-4">
        <FileText size={32} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Document Preview</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-6">
        This view is a placeholder for the live document renderer. Please use the <strong>Export</strong> button to generate the full statutory .docx file.
      </p>
      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
        <Download size={12} />
        EXPORT FUNCTIONALITY ACTIVE
      </div>
    </div>
  );
};

export default ReportDocument;
