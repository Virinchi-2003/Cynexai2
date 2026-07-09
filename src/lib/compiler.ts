export type Language = 'python' | 'javascript' | 'java' | 'sqlite3';

export async function executeCode(code: string, language: Language): Promise<string> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800));

  try {
    if (language === 'javascript') {
      // Safely evaluate JS in browser memory
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
    
    // Simulated compilation for non-JS languages
    const lowerCode = code.toLowerCase();
    
    if (language === 'python') {
      if (lowerCode.includes('print')) {
        const matches = code.match(/print\((["'])(.*?)\1\)/g);
        if (matches) {
          return matches.map(m => m.replace(/print\((["'])(.*?)\1\)/, '$2')).join('\n');
        }
        return "Python execution simulated successfully.";
      }
      if (lowerCode.includes('error') || lowerCode.includes('raise')) {
        return "Traceback (most recent call last):\n  File \"main.py\", line 1, in <module>\nRuntimeError: Simulated error";
      }
      return "Python script executed successfully.";
    }
    
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
