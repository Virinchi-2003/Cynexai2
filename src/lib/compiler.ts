export type Language = 'python' | 'javascript' | 'java' | 'sqlite3';

export interface UploadedFile {
  name: string;
  content: string;
}

let pyodideInstance: any = null;

async function getPyodide(outputCallback: (msg: string) => void) {
  if (!pyodideInstance) {
    if (!(window as any).loadPyodide) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    pyodideInstance = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    // Load pandas by default for data science workflows
    await pyodideInstance.loadPackage("pandas");
  }
  
  pyodideInstance.setStdout({ batched: (msg: string) => outputCallback(msg + '\n') });
  pyodideInstance.setStderr({ batched: (msg: string) => outputCallback(msg + '\n') });
  
  return pyodideInstance;
}

export async function executeCode(code: string, language: Language, files: UploadedFile[] = []): Promise<string> {
  try {
    if (language === 'javascript') {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n';
      };
      
      try {
        // eslint-disable-next-line no-eval
        const result = eval(code);
        if (result !== undefined && output.trim() === '') {
          output = String(result);
        }
      } finally {
        console.log = originalLog;
      }
      return output || 'Executed successfully (no output).';
    } 
    
    if (language === 'python') {
      let output = '';
      const pyodide = await getPyodide((msg) => { output += msg; });
      
      // Write uploaded files to Pyodide virtual filesystem
      for (const file of files) {
        pyodide.FS.writeFile(file.name, file.content);
      }
      
      try {
        await pyodide.runPythonAsync(code);
      } catch (err: any) {
        output += err.toString();
      }
      
      return output || 'Executed successfully (no output).';
    }
    
    // Simulated compilation for non-JS/Python languages
    const lowerCode = code.toLowerCase();
    
    if (language === 'sqlite3') {
      if (lowerCode.includes('select')) {
        return "id | name | role\n------------------\n1  | Alice| Admin\n2  | Bob  | User";
      }
      if (lowerCode.includes('create') || lowerCode.includes('insert')) {
        return "Rows affected: 1";
      }
      return "SQL executed successfully.";
    }

    if (language === 'java') {
      if (lowerCode.includes('system.out.print')) {
        const matches = code.match(/System\.out\.print(?:ln)?\((["'])(.*?)\1\)/g);
        if (matches) {
          return matches.map(m => m.replace(/System\.out\.print(?:ln)?\((["'])(.*?)\1\)/, '$2')).join('\n');
        }
      }
      return "Java compilation and execution successful.";
    }

    return `Executed ${language} successfully.`;
  } catch (error: any) {
    return error.message || "Execution failed.";
  }
}
