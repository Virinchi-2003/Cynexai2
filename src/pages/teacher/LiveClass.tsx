import React, { useState } from 'react';
import { Button } from '../../components/ui/erp/Button';
import { Card } from '../../components/ui/erp/Card';
import { Mic, Video as VideoIcon, MonitorUp, Users, Presentation, MessageSquare, QrCode } from 'lucide-react';

export default function LiveClass() {
  const [isLive, setIsLive] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <div className="w-16 md:w-20 bg-slate-950 flex flex-col items-center py-6 gap-6 border-r border-slate-800">
        <Button variant="ghost" className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
          <Mic className="w-6 h-6" />
        </Button>
        <Button variant="ghost" className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
          <VideoIcon className="w-6 h-6" />
        </Button>
        <Button variant="ghost" className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
          <MonitorUp className="w-6 h-6" />
        </Button>
        
        <div className="flex-1"></div>
        
        <Button 
          variant="ghost" 
          className="p-3 rounded-xl hover:bg-blue-900/50 text-blue-400"
          onClick={() => setShowQR(!showQR)}
          title="Show Attendance QR"
        >
          <QrCode className="w-6 h-6" />
        </Button>

        <Button 
          onClick={() => setIsLive(!isLive)}
          className={`p-3 rounded-xl ${isLive ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isLive ? <span className="text-xs font-bold">END</span> : <span className="text-xs font-bold">LIVE</span>}
        </Button>
      </div>

      {/* Main Studio View */}
      <div className="flex-1 flex flex-col p-4 gap-4 h-full">
        {/* Top Half: PPT & Video */}
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-[3] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
            {showQR ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  {/* Mock QR Code */}
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=cynexai-attendance-batch-1" alt="Attendance QR" />
                </div>
                <h3 className="text-2xl font-bold font-display text-white">Scan to mark attendance</h3>
                <p className="text-slate-400">Offline students only. Online students tracked via Meet.</p>
                <Button onClick={() => setShowQR(false)}>Close</Button>
              </div>
            ) : (
              <>
                <Presentation className="w-16 h-16 text-slate-700 absolute opacity-20" />
                <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-xs font-bold text-slate-300 backdrop-blur-sm">
                  Screen Share / PPT View
                </div>
                {isLive && (
                  <div className="absolute top-4 right-4 bg-red-500 animate-pulse px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    LIVE
                  </div>
                )}
                
                {/* Mock PPT Content */}
                <div className="text-center z-10 p-8">
                  <h1 className="text-4xl font-display font-bold text-white mb-6">Introduction to React Components</h1>
                  <ul className="text-2xl text-slate-300 text-left space-y-4 max-w-2xl mx-auto list-disc pl-8">
                    <li>What is a Component?</li>
                    <li>Functional vs Class Components</li>
                    <li>Props & State basics</li>
                    <li>Component Lifecycle (Hooks)</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 relative flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-700" />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                Teacher Camera
              </div>
            </div>
            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Chat (34)</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                <div className="text-sm"><span className="font-bold text-blue-300">Rahul:</span> Sir, what is JSX?</div>
                <div className="text-sm"><span className="font-bold text-green-300">Priya:</span> Audio is breaking slightly</div>
                <div className="text-sm"><span className="font-bold text-yellow-300">Amit:</span> Present!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Half: Script & Keypoints */}
        <div className="h-64 flex gap-4">
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              AI Keypoints & Regional Examples
            </h3>
            <div className="flex-1 overflow-y-auto text-slate-300 text-sm space-y-4 pr-2">
              <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-xl">
                <strong className="text-white block mb-1">Analogy for Components:</strong>
                "Think of React components like Lego blocks. Just like you use different blocks to build a house, you use components to build a UI."
              </div>
              <div className="bg-purple-900/20 border border-purple-900/50 p-3 rounded-xl">
                <strong className="text-white block mb-1">Local Context (Hyderabad/Telangana):</strong>
                "Imagine ordering Biryani. The 'Biryani' is the parent component. The 'Raitha' and 'Salan' are child components passed as props!"
              </div>
            </div>
          </div>
          
          <div className="flex-[2] bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
              Full Script Auto-scroller
            </h3>
            <div className="flex-1 overflow-y-auto text-slate-300 font-serif text-lg leading-relaxed pr-6 border-l-2 border-slate-800 pl-4">
              <p className="mb-4">Welcome everyone to our first deep dive into React. Today we are going to look at the core building blocks of any React application: Components.</p>
              <p className="mb-4 text-white font-bold bg-white/5 py-1 px-2 rounded -ml-2">Now, what exactly is a component? In simple terms, a component is a JavaScript function that returns some HTML.</p>
              <p className="mb-4 opacity-50">Back in the day, we used to write massive HTML files with thousands of lines of code. It was a nightmare to maintain. React solved this by letting us break down the UI into small, reusable pieces.</p>
              <p className="mb-4 opacity-50">Let's look at the example on the screen. We have a 'Header' component, a 'Sidebar' component, and a 'MainContent' component. By putting them together...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
