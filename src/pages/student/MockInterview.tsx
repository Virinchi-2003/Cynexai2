import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { Mic, Square, Volume2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MockInterview() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState("Hello! I'm your AI interviewer. Today we'll test your knowledge on SQL. Are you ready?");
  const [isAiSpeaking, setIsAiSpeaking] = useState(true);

  // Simulate AI speaking initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAiSpeaking(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsAiSpeaking(true);
      // Simulate AI response
      setTimeout(() => {
        setTranscript("Yes, I am ready.");
        setAiResponse("Great. Can you explain the difference between a LEFT JOIN and an INNER JOIN?");
        setTimeout(() => setIsAiSpeaking(false), 4000);
      }, 1000);
    } else {
      setIsRecording(true);
      setTranscript("Listening...");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col h-full">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-2">
              <Mic className="w-8 h-8 text-blue-500" /> AI Mock Interview
            </h1>
            <p className="text-slate-400 mt-1">SQL Basics • 5 Minute Session</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/student')} className="text-slate-400">Exit</Button>
        </div>

        {/* AI Avatar / Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12 py-8 relative">
          
          {/* AI Circle */}
          <div className="relative">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isAiSpeaking ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.4)] scale-110' : 'border-slate-700 bg-slate-800 scale-100'}`}>
              {isAiSpeaking ? (
                <div className="flex gap-2 items-center h-12">
                  <div className="w-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0ms] h-4"></div>
                  <div className="w-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_200ms] h-8"></div>
                  <div className="w-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_400ms] h-12"></div>
                  <div className="w-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_200ms] h-8"></div>
                  <div className="w-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0ms] h-4"></div>
                </div>
              ) : (
                <Volume2 className="w-12 h-12 text-slate-500" />
              )}
            </div>
            
            {/* AI Speech Bubble */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 w-64 md:w-80 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center text-slate-200 shadow-xl font-medium z-10 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-slate-800">
              {aiResponse}
            </div>
          </div>

          <div className="h-32"></div> {/* Spacer for absolute bubble */}

          {/* User Controls */}
          <div className="w-full flex flex-col items-center gap-6 mt-auto">
            {transcript && !isRecording && transcript !== "Listening..." && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm italic max-w-sm w-full text-center">
                "{transcript}"
              </div>
            )}
            
            <button 
              onClick={toggleRecording}
              disabled={isAiSpeaking}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isAiSpeaking ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' :
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-lg'
              }`}
            >
              {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-sm font-bold text-slate-400">
              {isAiSpeaking ? 'AI is speaking...' : isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
            </p>
          </div>

        </div>
        
        <div className="mt-4 border-t border-slate-800 pt-4 flex justify-end">
           <Button onClick={() => navigate('/student')} className="bg-green-600 hover:bg-green-500 text-white">
             Finish Interview <Check className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>
    </div>
  );
}
