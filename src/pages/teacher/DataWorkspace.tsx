import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/erp/Button';

export const DataWorkspace: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const importExcel = () => {
    setLoading(true);
    setTimeout(() => {
      setDataLoaded(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#0d0d14] flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-slate-300">Spreadsheet & Data Viewer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={importExcel} disabled={loading} className="h-8 px-3 text-xs font-bold bg-green-600 hover:bg-green-500 text-white">
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} 
            Import Excel / CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col p-6 items-center justify-center">
        {!dataLoaded ? (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <FileSpreadsheet className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Data Imported</h2>
            <p className="text-slate-400 mb-6 text-sm">Import an Excel or CSV file to display data dynamically for the class to follow along.</p>
          </div>
        ) : (
          <div className="w-full h-full bg-white text-black rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">A1</span>
              <input type="text" className="flex-1 border border-slate-300 px-2 py-0.5 text-sm" value="ID" readOnly />
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 w-10 bg-slate-200"></th>
                    <th className="border border-slate-300 px-4 py-1 text-center font-normal w-32">A</th>
                    <th className="border border-slate-300 px-4 py-1 text-center font-normal w-48">B</th>
                    <th className="border border-slate-300 px-4 py-1 text-center font-normal w-32">C</th>
                    <th className="border border-slate-300 px-4 py-1 text-center font-normal">D</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1', 'ID', 'Name', 'Department', 'Salary'],
                    ['2', '101', 'Alice Johnson', 'Engineering', '$120,000'],
                    ['3', '102', 'Bob Smith', 'Marketing', '$85,000'],
                    ['4', '103', 'Carol White', 'Sales', '$95,000'],
                    ['5', '104', 'David Brown', 'HR', '$75,000'],
                    ['6', '', '', '', ''],
                    ['7', '', '', '', ''],
                    ['8', '', '', '', ''],
                    ['9', '', '', '', ''],
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="border border-slate-300 bg-slate-100 text-center text-xs text-slate-500">{row[0]}</td>
                      <td className="border border-slate-300 px-2 py-1">{row[1]}</td>
                      <td className="border border-slate-300 px-2 py-1">{row[2]}</td>
                      <td className="border border-slate-300 px-2 py-1">{row[3]}</td>
                      <td className="border border-slate-300 px-2 py-1">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
