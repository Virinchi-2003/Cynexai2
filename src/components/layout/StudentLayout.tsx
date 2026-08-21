import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { client } from '../../lib/turso';
import {
  Home, ClipboardCheck, Mic2, Gift, Briefcase,
  GraduationCap, LogOut, Moon, Sun,
  Menu, X, ChevronRight, CheckCircle2,
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
  { to: '/student/interview',   icon: Mic2,           label: 'AI Interview', short: 'Interview' },
  { to: '/student/referrals',   icon: Gift,           label: 'Rewards',      short: 'Rewards'   },
  { to: '/student/career',      icon: Briefcase,      label: 'Career',       short: 'Career'    },
];

const BOTTOM_NAV = NAV_ITEMS;

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
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">

      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center gap-3 flex-shrink-0 border-b border-slate-200/70 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)' }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-base leading-tight tracking-tight text-slate-900 dark:text-white">Cynex<span className="text-indigo-600 dark:text-indigo-400">AI</span></p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Executive Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-4 space-y-4 min-h-0">
        <nav className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2 text-slate-400">Navigation</p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, comingSoon }) => {
            const active = isActive(to);
            return (
              <button key={to}
                onClick={() => { navigate(to); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border-l-4 border-indigo-600 dark:border-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1 text-left flex items-center justify-between">
                  <span>{label}</span>
                  {comingSoon && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold uppercase tracking-wider text-slate-500">Soon</span>
                  )}
                </span>
                {active && !comingSoon && <ChevronRight className="w-3.5 h-3.5 opacity-60 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Movin-style Pinned User Profile (Bottom Left) */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex-shrink-0 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-sm">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 relative shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate text-slate-900 dark:text-white leading-tight">{user?.name ?? 'Student'}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email ?? 'student@cynexai.com'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors">
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => { localStorage.removeItem('cynexai_user'); navigate('/login'); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {data.completedClasses} Classes Done
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
