import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { client } from '../../lib/turso';
import {
  Home, MapPin, ClipboardList, Trophy, Mic2,
  Gift, Briefcase, Bell, ChevronRight, Zap, Star,
  Flame, Coins, LogOut, X, Moon, Sun
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

interface GamificationData {
  streak: number;
  coins: number;
  completedClasses: number;
  totalClasses: number;
  level: number;
  xpPct: number;
  badgeCount: number;
  notifications: number;
}

const NAV_ITEMS = [
  { to: '/student',            icon: Home,          label: 'Dashboard'    },
  { to: '/student/attendance', icon: ClipboardList, label: 'Attendance'   },
  { to: '/student/leaderboard',icon: Trophy,        label: 'Leaderboard'  },
  { to: '/student/interview',  icon: Mic2,          label: 'Mock Interview'},
  { to: '/student/referrals',  icon: Gift,          label: 'Refer & Earn' },
  { to: '/student/career',     icon: Briefcase,     label: 'Career'       },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const [data, setData] = useState<GamificationData>({
    streak: 0, coins: 0, completedClasses: 0, totalClasses: 1,
    level: 1, xpPct: 0, badgeCount: 0, notifications: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) return;
    fetchGamification();
  }, [user?.id]);


  const fetchGamification = async () => {
    if (!client) return;
    try {
      const [studRow, progRow, badgeRow, notifRow] = await Promise.all([
        client.execute({ sql: 'SELECT streak, coins FROM students WHERE id = ? LIMIT 1', args: [user!.id] }),
        client.execute({ sql: `SELECT COUNT(*) as done FROM student_progress WHERE student_id = ? AND completed = 1`, args: [user!.id] }),
        client.execute({ sql: `SELECT COUNT(*) as cnt FROM badges WHERE student_id = ?`, args: [user!.id] }),
        client.execute({ sql: `SELECT COUNT(*) as cnt FROM announcements WHERE is_active = 1`, args: [] }),
      ]);
      const streak = Number(studRow.rows[0]?.streak ?? 0);
      const coins  = Number(studRow.rows[0]?.coins  ?? 0);
      const done   = Number(progRow.rows[0]?.done   ?? 0);
      const badges = Number(badgeRow.rows[0]?.cnt   ?? 0);
      const notifs = Number(notifRow.rows[0]?.cnt   ?? 0);
      const level  = Math.floor(done / 10) + 1;
      const xpPct  = ((done % 10) / 10) * 100;
      setData({ streak, coins, completedClasses: done, totalClasses: Math.max(done, 1), level, xpPct, badgeCount: badges, notifications: notifs });
    } catch (e) { /* silent */ }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const levelColors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-orange-500 to-red-600'];
  const levelGrad = levelColors[(data.level - 1) % levelColors.length];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${levelGrad} flex items-center justify-center shadow-lg`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-foreground font-bold text-base leading-tight">CynexAI Learn</h2>
            <p className="text-muted-foreground text-[11px] font-medium">Your Learning Portal</p>
          </div>
        </div>
      </div>

      {/* Student Profile Quick Card */}
      <div className="mx-3 mt-4 p-3 rounded-2xl bg-foreground/5 border border-foreground/10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${levelGrad} flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold text-sm truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${levelGrad} text-white`}>
                LVL {data.level}
              </span>
              <span className="text-muted-foreground text-[10px]">Data Science</span>
            </div>
          </div>
          <div className="relative ml-auto flex-shrink-0">
            <button className="w-8 h-8 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
            {data.notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {data.notifications}
              </span>
            )}
          </div>
        </div>
        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground font-bold">XP Progress</span>
            <span className="text-[10px] text-muted-foreground font-bold">{data.completedClasses % 10}/10 classes</span>
          </div>
          <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${levelGrad} transition-all duration-700`}
              style={{ width: `${data.xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2 text-center">
          <div className="text-lg">🔥</div>
          <div className="text-orange-400 font-bold text-sm leading-none">{data.streak}</div>
          <div className="text-[9px] text-orange-500/70 font-bold uppercase tracking-wide">Streak</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2 text-center">
          <div className="text-lg">🪙</div>
          <div className="text-yellow-400 font-bold text-sm leading-none">{data.coins}</div>
          <div className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-wide">Coins</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2 text-center">
          <div className="text-lg">🎖️</div>
          <div className="text-purple-400 font-bold text-sm leading-none">{data.badgeCount}</div>
          <div className="text-[9px] text-purple-500/70 font-bold uppercase tracking-wide">Badges</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-2">Menu</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to}
              onClick={() => { navigate(to); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                active
                  ? `bg-gradient-to-r ${levelGrad} text-white shadow-lg shadow-blue-500/20`
                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom — Ask AI + Logout */}
      <div className="p-3 border-t border-border/50 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground text-sm font-medium transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => navigate('/student')}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r ${levelGrad} text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity`}
        >
          <Zap className="w-4 h-4" />
          Ask AI Tutor
          <span className="ml-auto bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            1 <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
          </span>
        </button>
        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-surface border-r border-border flex-col transition-colors duration-500">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-surface border-r border-border flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border flex-shrink-0 transition-colors duration-500">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${levelGrad} flex items-center justify-center`}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-foreground font-bold">CynexAI Learn</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-orange-400 text-sm font-bold">🔥 {data.streak}</span>
            <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">🪙 {data.coins}</span>
          </div>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex justify-around px-1 transition-colors duration-200"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: '64px' }}>
          {NAV_ITEMS.slice(0, 4).map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors min-w-[48px] ${
                  active ? 'text-erp-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-9 h-6 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-erp-primary/12' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="leading-none">{label.split(' ')[0]}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors min-w-[48px] text-muted-foreground"
          >
            <div className="w-9 h-6 flex items-center justify-center rounded-lg transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </div>
            <span className="leading-none">Menu</span>
          </button>
        </div>

        {/* Page Content — extra bottom padding for fixed nav */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
