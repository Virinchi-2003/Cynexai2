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
  { to: '/student/leaderboard', icon: Trophy,         label: 'Leaderboard',  short: 'Rank', comingSoon: true },
  { to: '/student/interview',   icon: Mic2,           label: 'AI Interview', short: 'Interview', comingSoon: true },
  { to: '/student/referrals',   icon: Gift,           label: 'Rewards',      short: 'Rewards', comingSoon: true },
  { to: '/student/career',      icon: Briefcase,      label: 'Career',       short: 'Career', comingSoon: true },
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
    pageBg:      '#000000',
    sidebarBg:   '#0a0a0a',
    border:      'rgba(255,255,255,0.05)',
    tabBarBg:    'rgba(10,10,10,0.97)',
    profileCard: 'rgba(255,255,255,0.02)',
    profileBorder: 'rgba(255,255,255,0.05)',
    navSectionLabel: 'rgba(255,255,255,0.2)',
    navMuted:    'rgba(255,255,255,0.35)',
    navActive:   '#06b6d4',
    navActiveBg: 'rgba(6,182,212,0.12)',
    text:        '#ffffff',
    textMuted:   'rgba(255,255,255,0.4)',
    avatarBorder: '#0a0a0a',
    xpTrack:     'rgba(255,255,255,0.08)',
    closeBtn:    'rgba(255,255,255,0.07)',
    closeBtnTxt: 'rgba(255,255,255,0.6)',
    inactiveTab: 'rgba(255,255,255,0.3)',
  } : {
    pageBg:      '#f1f5f9',
    sidebarBg:   '#ffffff',
    border:      'rgba(0,0,0,0.07)',
    tabBarBg:    'rgba(255,255,255,0.97)',
    profileCard: 'rgba(6,182,212,0.05)',
    profileBorder: 'rgba(6,182,212,0.15)',
    navSectionLabel: '#94a3b8',
    navMuted:    '#64748b',
    navActive:   '#0891b2',
    navActiveBg: 'rgba(8,145,178,0.08)',
    text:        '#0f172a',
    textMuted:   '#64748b',
    avatarBorder: '#ffffff',
    xpTrack:     'rgba(0,0,0,0.08)',
    closeBtn:    'rgba(0,0,0,0.05)',
    closeBtnTxt: '#475569',
    inactiveTab: '#94a3b8',
  };

  // ── Sidebar content (shared between desktop + mobile overlay) ─────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-base leading-tight" style={{ color: '#06b6d4' }}>CynexAI</p>
          <p className="text-[10px] font-bold" style={{ color: T.textMuted }}>Student Portal</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-3 mt-4 p-4 rounded-2xl"
        style={{ background: T.profileCard, border: `1px solid ${T.profileBorder}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 relative"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 16px rgba(6,182,212,0.4)' }}>
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: T.avatarBorder }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: T.text }}>{user?.name ?? 'Student'}</p>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white inline-block mt-0.5"
              style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}>
              LVL {data.level}
            </span>
          </div>
          {data.notifications > 0 && (
            <div className="relative flex-shrink-0">
              <Bell className="w-4 h-4" style={{ color: T.navMuted }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {data.notifications}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold" style={{ color: T.textMuted }}>
            <span>Level Progress</span>
            <span>{data.completedClasses % 10}/10 classes</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.xpTrack }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.xpPct}%`, background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }} />
          </div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Flame,  value: data.streak,     label: 'Streak', color: '#f97316' },
          { icon: Coins,  value: data.coins,       label: 'Coins',  color: '#f59e0b' },
          { icon: Shield, value: data.badgeCount,  label: 'Badges', color: '#8b5cf6' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="rounded-xl py-2.5 text-center"
            style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
            <Icon className="w-4 h-4 mx-auto mb-0.5" style={{ color }} />
            <div className="text-sm font-black leading-none" style={{ color }}>{value}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: T.textMuted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-2 min-h-0">
        <p className="text-[10px] font-black uppercase tracking-widest px-3 mb-3 text-slate-400 dark:text-slate-500">Navigation</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label, comingSoon }) => {
          const active = isActive(to);
          return (
            <button key={to}
              onClick={() => { if (!comingSoon) { navigate(to); setMobileMenuOpen(false); } }}
              disabled={comingSoon}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-150 min-h-[44px] ${
                comingSoon
                  ? 'opacity-60 cursor-not-allowed text-slate-400 dark:text-white/30 hover:bg-transparent'
                  : active 
                    ? 'candy-btn-blue shadow-md text-white' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white hover:bg-black/5 active:scale-95'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={active ? 3 : 2} />
              <span className="flex-1 text-left flex items-center gap-2">
                {label}
                {comingSoon && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Soon</span>
                )}
              </span>
              {active && !comingSoon && <ChevronRight className="w-4 h-4 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-1 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ color: T.navMuted }}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => { localStorage.removeItem('cynexai_user'); navigate('/login'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:text-red-400 transition-colors"
          style={{ color: T.navMuted }}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: T.pageBg, color: T.text }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col candy-panel !rounded-l-none !border-y-0 !border-l-0 bg-white dark:bg-black z-20">
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
                  <span className="absolute top-0 right-0 text-[8px] bg-slate-200 dark:bg-white/20 px-1 py-[1px] rounded font-bold uppercase z-10 text-slate-600 dark:text-white/80">Soon</span>
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
