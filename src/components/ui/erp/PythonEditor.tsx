import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './Button';

// Expose pyodide globally
declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    pyodide: any;
  }
}

interface PythonEditorProps {
  initialCode?: string;
  onChange?: (code: string) => void;
  onRunSuccess?: () => void;
}

export const PythonEditor: React.FC<PythonEditorProps> = ({ 
  initialCode = "print('Hello from CynexAI!')",
  onChange,
  onRunSuccess
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Pyodide on mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
        // Load the script dynamically if not present
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
        }

        // Initialize pyodide
        if (!window.pyodide) {
          window.pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });
          // Load micropip to allow installing packages like numpy/pandas
          await window.pyodide.loadPackage('micropip');
        }
        setIsReady(true);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setOutput("Error: Failed to initialize Python environment. Check your internet connection.");
      } finally {
        setIsInitializing(false);
      }
    };
    initPyodide();
  }, []);

  const handleRunCode = async () => {
    if (!window.pyodide) return;
    setIsRunning(true);
    setOutput("Running...\n");
    
    // Create custom stdout and stderr capture
    let stdoutBuffer = "";
    let stderrBuffer = "";

    window.pyodide.setStdout({ batched: (msg: string) => stdoutBuffer += msg + "\n" });
    window.pyodide.setStderr({ batched: (msg: string) => stderrBuffer += msg + "\n" });

    try {
      // First, scan for imports that might need micropip installation
      const imports = [];
      if (code.includes('import numpy') || code.includes('from numpy')) imports.push('numpy');
      if (code.includes('import pandas') || code.includes('from pandas')) imports.push('pandas');
      if (code.includes('import matplotlib') || code.includes('from matplotlib')) imports.push('matplotlib');
      if (code.includes('import sklearn') || code.includes('from sklearn')) imports.push('scikit-learn');

      if (imports.length > 0) {
        setOutput((prev) => prev + `Installing dependencies: ${imports.join(', ')} (this may take a moment)...\n`);
        const micropip = window.pyodide.pyimport('micropip');
        for (const pkg of imports) {
          await micropip.install(pkg);
        }
      }

      await window.pyodide.runPythonAsync(code);
      setOutput((prev) => prev + stdoutBuffer + (stderrBuffer ? `\nErrors:\n${stderrBuffer}` : ''));
      
      // If code executed completely without throwing exception
      if (!stderrBuffer) {
        onRunSuccess?.();
      }
    } catch (err: any) {
      // Catch syntax errors or runtime exceptions
      setOutput((prev) => prev + stdoutBuffer + `\nException:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      onChange?.(value);
    }
  };

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-background w-full h-[500px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-bold text-slate-400 ml-2 font-mono">main.py</span>
        </div>
        <div className="flex items-center gap-2">
          {isInitializing && (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
              <Loader2 className="w-3 h-3 animate-spin" /> Initializing Python VM...
            </span>
          )}
          <Button 
            variant="primary" 
            onClick={handleRunCode} 
            disabled={!isReady || isRunning}
            className="h-8 text-xs flex items-center gap-2 px-4 bg-green-600 hover:bg-green-500 border-none text-white"
          >
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
            {isRunning ? 'Running' : 'Run Code'}
          </Button>
        </div>
      </div>

      {/* Split View: Editor and Output */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Editor Area */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        </div>

        {/* Terminal Output */}
        <div className="h-1/3 min-h-[150px] border-t border-slate-800 bg-[#1e1e1e] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Terminal Output</span>
            <button onClick={() => setOutput('')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-sm">
            {output ? (
              <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
            ) : (
              <span className="text-slate-600 italic">No output yet. Click 'Run Code' to execute.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
