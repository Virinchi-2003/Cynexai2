import React, { useEffect, useState } from 'react';
import { getSQLTestResults, SQLTestResult } from '../../lib/api/assessment';
import { getCurrentUser } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function TestResults() {
  const [results, setResults] = useState<SQLTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<SQLTestResult | null>(null);
  
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Only allow managers or CEO to view results
    if (user?.role !== 'Manager' && user?.role !== 'CEO' && user?.role !== 'Teacher') {
      // In a real app, you might strictly block it, but for demo:
      // navigate('/');
    }
    
    getSQLTestResults().then(data => {
      setResults(data);
      setLoading(false);
    });
  }, [user, navigate]);

  if (loading) return <div className="p-10 text-center">Loading results...</div>;

  const formatDate = (ds: string) => {
    if (!ds) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(ds));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Assessment Results Dashboard</h1>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Back to CRM</button>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 overflow-hidden h-[calc(100vh-70px)]">
        
        {/* Left column: List of submissions */}
        <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Submissions ({results.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">No test submissions yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map(r => (
                  <li 
                    key={r.id} 
                    onClick={() => setSelectedResult(r)}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedResult?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900">{r.student_name}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">Batch {r.batch}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span>
                      <span className="text-sm font-bold text-green-600">MCQ Score: {r.score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column: Detailed View */}
        <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {selectedResult ? (
            <>
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedResult.student_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">Batch {selectedResult.batch} &bull; Submitted: {formatDate(selectedResult.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 uppercase tracking-wide font-bold">MCQ Auto-Score</div>
                    <div className="text-3xl font-black text-blue-600">{selectedResult.score}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg mb-4 border-b border-gray-300 pb-2">Submitted Answers</h3>
                <div className="space-y-6">
                  {(() => {
                    let answers = {};
                    try {
                      answers = JSON.parse(selectedResult.answers_json || '{}');
                    } catch(e) {}
                    
                    return Object.entries(answers).map(([qId, ans]) => (
                      <div key={qId} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                        <div className="text-xs font-mono text-gray-500 mb-2">Question ID: {qId}</div>
                        {qId.includes('_q') ? (
                          // SQL Query formatting
                          <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto whitespace-pre-wrap">{ans as string}</pre>
                        ) : (
                          // Short Answer or MCQ formatting
                          <div className="text-gray-800 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-100">{ans as string}</div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-10 text-center flex-col gap-4">
              <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <p>Select a submission from the left panel to view detailed answers.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
