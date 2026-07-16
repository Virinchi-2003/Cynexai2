import React, { useState } from 'react';
import { Play, Database, Upload, Loader2, Table } from 'lucide-react';
import { Button } from '../../components/ui/erp/Button';

export const SqlWorkspace: React.FC = () => {
  const [query, setQuery] = useState('-- Interactive SQL Terminal\n\nSELECT * FROM general_dataset LIMIT 10;');
  const [output, setOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  const loadDataset = () => {
    setDatasetLoaded(true);
    setOutput('Dataset "general_dataset" (Sales, Users, Products) loaded successfully into memory. You can now query it.');
  };

  const runQuery = async () => {
    setIsExecuting(true);
    setOutput(null);
    
    // Mocking execution delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!datasetLoaded) {
      setOutput('Error: No dataset loaded. Please upload or load a dataset first.');
    } else {
      if (query.toLowerCase().includes('select')) {
        setOutput('Results:\n\nid | name | amount | category\n---|------|--------|---------\n1  | Item A | 100  | Electronics\n2  | Item B | 150  | Books\n3  | Item C | 200  | Clothing');
      } else {
        setOutput('Query executed successfully. 0 rows returned.');
      }
    }
    setIsExecuting(false);
  };

  return (
    <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold text-slate-300">SQL Terminal</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!datasetLoaded ? (
            <Button onClick={loadDataset} className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white">
              <Upload className="w-3.5 h-3.5 mr-2" /> Load General Dataset
            </Button>
          ) : (
            <div className="px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400">general_dataset loaded</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col border-b border-white/5">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-blue-300 font-mono p-6 text-sm resize-none outline-none z-10 relative"
          spellCheck={false}
        />
      </div>

      <div className="shrink-0 h-48 bg-[#0d0d14] relative z-20 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#11111a]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Query Results</span>
          <Button
            onClick={runQuery}
            disabled={isExecuting}
            className="h-8 px-4 text-xs font-bold bg-green-600 hover:bg-green-500 text-white"
          >
            {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
            {isExecuting ? 'Executing...' : 'Run Query'}
          </Button>
        </div>
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-black">
          {output ? (
            <pre className={output.includes('Error') ? 'text-red-400' : 'text-slate-300 whitespace-pre-wrap'}>{output}</pre>
          ) : (
            <span className="text-slate-600 italic">Run a query to see results here...</span>
          )}
        </div>
      </div>
    </div>
  );
};
