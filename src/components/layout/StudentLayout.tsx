import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { client } from '../../lib/turso';
import {
  Home, ClipboardCheck, Trophy, Mic2, Gift, Briefcase,
  Flame, Coins, Shield, GraduationCap, LogOut, Moon, Sun,
  Menu, X, ChevronRight, Bell,
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

interface GamificationData {
  streak: number;
  coins: number;
  completedClasses: number;
  level: number;
  xpPct: number;
  badgeCount: number;
  notifications: number;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  short: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/student',             icon: Home,           label: 'Dashboard',    short: 'Home'      },
  { to: '/student/attendance',  icon: ClipboardCheck, label: 'Attendance',   short: 'Attend'    },
  { to: '/student/leaderboard', icon: Trophy,         label: 'Leaderboard',  short: 'Rank'      },
  { to: '/student/interview',   icon: Mic2,           label: 'AI Interview', short: 'Interview' },
  { to: '/student/referrals',   icon: Gift,           label: 'Rewards',      short: 'Rewards'   },
  { to: '/student/career',      icon: Briefcase,      label: 'Career',       short: 'Career'    },
];

const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getCurrentUser();
  const { isDark, toggleTheme } = useTheme();

  const [data, setData] = useState<GamificationData>({
    streak: 0, coins: 0, completedClasses: 0,
    level: 1, xpPct: 0, badgeCount: 0, notifications: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchGamification();
  }, [user?.id]);

  const fetchGamification = async () => {
    if (!client) return;
    try {
      const [studRow, progRow, badgeRow, notifRow] = await Promise.all([
        client.execute({ sql: 'SELECT streak, coins FROM students WHERE id = ? OR portal_login_email = (SELECT email FROM users WHERE id = ?) LIMIT 1', args: [user!.id, user!.id] })
          .catch(() => ({ rows: [] })),
        client.execute({ sql: 'SELECT COUNT(*) as done FROM student_progress WHERE student_id = ? AND completed = 1', args: [user!.id] })
          .catch(() => ({ rows: [] })),
        client.execute({ sql: 'SELECT COUNT(*) as cnt FROM badges WHERE student_id = ?', args: [user!.id] })
          .catch(() => ({ rows: [] })),
        client.execute({ sql: 'SELECT COUNT(*) as cnt FROM announcements WHERE is_active = 1', args: [] })
          .catch(() => ({ rows: [] })),
      ]);
      const streak = Number((studRow.rows[0] as any)?.streak ?? 0);
      const coins  = Number((studRow.rows[0] as any)?.coins  ?? 0);
      const done   = Number((progRow.rows[0] as any)?.done   ?? 0);
      const badges = Number((badgeRow.rows[0] as any)?.cnt   ?? 0);
      const notifs = Number((notifRow.rows[0] as any)?.cnt   ?? 0);
      const level  = Math.floor(done / 10) + 1;
      const xpPct  = ((done % 10) / 10) * 100;
      setData({ streak, coins, completedClasses: done, level, xpPct, badgeCount: badges, notifications: notifs });
    } catch { /* silent */ }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const isActive = (to: string) => to === '/student' ? location.pathname === '/student' : location.pathname.startsWith(to);

  // ── Theme-aware palette ────────────────────────────────────────────────────
  const T = isDark ? {
    pageBg:      '#030712',
    sidebarBg:   '#0f172a',
    border:      'rgba(255,255,255,0.08)',
    tabBarBg:    'rgba(15,23,42,0.97)',
    profileCard: 'rgba(79,70,229,0.08)',
    profileBorder: 'rgba(79,70,229,0.2)',
    navSectionLabel: '#64748b',
    navMuted:    '#94a3b8',
    navActive:   '#6366f1',
    navActiveBg: 'rgba(99,102,241,0.15)',
    text:        '#f8fafc',
    textMuted:   '#64748b',
    avatarBorder: '#0f172a',
    xpTrack:     'rgba(255,255,255,0.08)',
    closeBtn:    'rgba(255,255,255,0.1)',
    closeBtnTxt: 'rgba(255,255,255,0.8)',
    inactiveTab: 'rgba(255,255,255,0.4)',
  } : {
    pageBg:      '#f8fafc',
    sidebarBg:   '#ffffff',
    border:      '#e2e8f0',
    tabBarBg:    'rgba(255,255,255,0.97)',
    profileCard: 'rgba(79,70,229,0.04)',
    profileBorder: 'rgba(79,70,229,0.12)',
    navSectionLabel: '#94a3b8',
    navMuted:    '#475569',
    navActive:   '#4f46e5',
    navActiveBg: 'rgba(79,70,229,0.08)',
    text:        '#0f172a',
    textMuted:   '#64748b',
    avatarBorder: '#ffffff',
    xpTrack:     '#e2e8f0',
    closeBtn:    'rgba(0,0,0,0.05)',
    closeBtnTxt: '#475569',
    inactiveTab: '#94a3b8',
  };

  // ── Sidebar content (shared between desktop + mobile overlay) ─────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)' }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-base leading-tight tracking-tight text-slate-900 dark:text-white">Cynex<span className="text-indigo-600 dark:text-indigo-400">AI</span></p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Student Portal</p>
        </div>
      </div>

      {/* Scrollable middle content (scrollbar hidden) */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-3 space-y-3 min-h-0">
        {/* Compact Profile & Stats Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 relative shadow-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{user?.name ?? 'Student'}</p>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white inline-block mt-0.5 shadow-sm"
                style={{ background: 'linear-gradient(90deg, #4f46e5, #3b82f6)' }}>
                LVL {data.level}
              </span>
            </div>
            {data.notifications > 0 && (
              <div className="relative flex-shrink-0">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                  {data.notifications}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Level Progress</span>
              <span>{data.completedClasses % 10}/10 classes</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${data.xpPct}%`, background: 'linear-gradient(90deg, #4f46e5, #3b82f6)' }} />
            </div>
          </div>

          {/* Embedded Stat Bar */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            {[
              { icon: Flame,  value: data.streak,     label: 'Streak', color: '#f97316' },
              { icon: Coins,  value: data.coins,       label: 'Coins',  color: '#f59e0b' },
              { icon: Shield, value: data.badgeCount,  label: 'Badges', color: '#6366f1' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="rounded-lg py-1 px-1 text-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-center gap-1">
                  <Icon className="w-3 h-3" style={{ color }} />
                  <span className="text-xs font-black tabular-nums" style={{ color }}>{value}</span>
                </div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5 text-slate-400">Navigation</p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, comingSoon }) => {
            const active = isActive(to);
            return (
              <button key={to}
                onClick={() => { navigate(to); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1 text-left flex items-center justify-between">
                  <span>{label}</span>
                  {comingSoon && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Soon</span>
                  )}
                </span>
                {active && !comingSoon && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions (Fixed at bottom, no overlap) */}
      <div className="p-3 space-y-1 flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => { localStorage.removeItem('cynexai_user'); navigate('/login'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: T.pageBg, color: T.text }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile overlay menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 flex flex-col z-10 candy-panel !rounded-l-none !border-y-0 !border-l-0 bg-white dark:bg-black">
            <button onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 candy-btn !min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-center z-50 shadow-md">
              <X className="w-5 h-5 text-white" strokeWidth={3} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: T.sidebarBg, borderBottom: `1px solid ${T.border}` }}>
          <button onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-sm" style={{ color: '#06b6d4' }}>CynexAI</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
              <Flame className="w-3.5 h-3.5" />{data.streak}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Coins className="w-3.5 h-3.5" />{data.coins}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden flex-shrink-0 flex justify-around items-center px-2 candy-panel !rounded-t-3xl !rounded-b-none !border-b-0 !border-x-0 !shadow-[0_-10px_25px_rgba(0,0,0,0.15)] bg-white dark:bg-black z-30 relative"
          style={{
            height: '80px',
            paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          }}>
          {BOTTOM_NAV.map(({ to, icon: Icon, short, comingSoon }) => {
            const active = isActive(to);
            return (
              <button key={to} onClick={() => { if (!comingSoon) navigate(to); }}
                disabled={comingSoon}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all min-h-[44px] mx-0.5 relative
                  ${comingSoon ? 'opacity-50 cursor-not-allowed' : active ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white active:scale-95'}
                `}
              >
                <div className={`w-12 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${active && !comingSoon ? 'candy-btn-blue shadow-lg !min-h-[40px] !border' : ''}`}>
                  <Icon className="w-6 h-6" strokeWidth={active && !comingSoon ? 3 : 2} />
                </div>
                <span className={`text-[10px] font-black leading-none ${active && !comingSoon ? 'text-[#0096ff] dark:text-[#01cdfe]' : ''}`}>{short}</span>
                {comingSoon && (
                  <span className="absolute top-0 right-0 text-[8px] bg-slate-200 dark:bg-white dark:bg-black/20 px-1 py-[1px] rounded font-bold uppercase z-10 text-slate-600 dark:text-white/80">Soon</span>
                )}
              </button>
            );
          })}
          <button onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all active:scale-95 min-h-[44px] mx-0.5 text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white"
          >
            <div className="w-12 h-10 flex items-center justify-center">
              <Menu className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black leading-none">More</span>
          </button>
        </div>

      </div>
    </div>
  );
}
