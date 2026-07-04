import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Gift, Zap, Star } from 'lucide-react';
import { Button } from '../ui/erp/Button';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { to: '/student', icon: Trophy, label: 'Learning Path' },
    { to: '/student/referrals', icon: Gift, label: 'Refer & Earn' },
    { to: '/student/career', icon: Star, label: 'Career Center' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#0F172A] text-white font-sans">
      {/* Left Sidebar / Nav (Desktop) */}
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col p-4">
        <h2 className="text-2xl font-display font-bold text-blue-400 mb-8 px-2">CynexAI Learn</h2>
        
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Button
                key={item.to}
                variant="ghost"
                className={`justify-start border ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent'
                }`}
                onClick={() => navigate(item.to)}
              >
                <Icon className="w-5 h-5 mr-3" /> {item.label}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            className="justify-start text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
          >
            <Zap className="w-5 h-5 mr-3" /> Leaderboard
          </Button>
        </div>

        <div className="mt-auto">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-300">My Coins</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center text-orange-500 font-bold">
                  <svg className="w-4 h-4 mr-1 fill-orange-500" viewBox="0 0 24 24"><path d="M11.64,5.93h0l1.43,2.65,2.78,.4c.73,.11,.97,1.01,.39,1.44l-2.09,1.52,.51,3a.75.75,0,0,1-1.12,.81l-2.52-1.33-2.52,1.33a.75.75,0,0,1-1.12-.81l.51-3-2.09-1.52c-.58-.43-.34-1.33,.39-1.44l2.78-.4,1.43-2.65c.34-.64,1.25-.64,1.59,0Z"/></svg> 
                  12
                </span>
                <span className="flex items-center text-yellow-400 font-bold text-lg">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400" /> 1,240
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">Use coins to ask AI doubts!</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden w-full flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 z-20">
          <h1 className="text-xl font-display font-bold text-blue-400">CynexAI Learn</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
              <svg className="w-4 h-4 fill-orange-500" viewBox="0 0 24 24"><path d="M11.64,5.93h0l1.43,2.65,2.78,.4c.73,.11,.97,1.01,.39,1.44l-2.09,1.52,.51,3a.75.75,0,0,1-1.12,.81l-2.52-1.33-2.52,1.33a.75.75,0,0,1-1.12-.81l.51-3-2.09-1.52c-.58-.43-.34-1.33,.39-1.44l2.78-.4,1.43-2.65c.34-.64,1.25-.64,1.59,0Z"/></svg>
              12
            </div>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-sm">1,240</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden flex bg-slate-900 border-t border-slate-800 justify-around p-2 z-20">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex flex-col items-center gap-1 p-2 text-xs font-bold ${
                  isActive ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button className="flex flex-col items-center gap-1 p-2 text-xs font-bold text-slate-400" onClick={() => alert('Ask AI Modal Opened')}>
            <div className="relative">
              <Zap className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-slate-900 flex items-center justify-center">
                <Star className="w-2 h-2 text-slate-900 fill-slate-900" />
              </div>
            </div>
            <span>Ask AI</span>
          </button>
        </div>
        
        {/* Desktop Ask AI FAB */}
        <div className="hidden md:block absolute bottom-6 right-6 z-50">
          <Button 
            className="rounded-full shadow-lg h-14 px-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none"
            onClick={() => alert('Ask AI Modal Opened')}
          >
            <Zap className="w-5 h-5" />
            Ask AI 
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1 flex items-center">
              1 <Star className="w-3 h-3 ml-1 fill-yellow-400 text-yellow-400" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
