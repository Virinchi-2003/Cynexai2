import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { client } from '../../lib/turso';
import {
  Home, ClipboardCheck, Trophy, Mic2, Gift, Briefcase,
  Flame, Coins, Shield, GraduationCap, LogOut, Moon, Sun,
  Menu, X, ChevronRight, Zap, Bell,
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

const NAV_ITEMS = [
  { to: '/student',             icon: Home,          label: 'Dashboard',     short: 'Home'      },
  { to: '/student/attendance',  icon: ClipboardCheck, label: 'Attendance',   short: 'Attend'    },
  { to: '/student/leaderboard', icon: Trophy,         label: 'Leaderboard',  short: 'Rank'      },
  { to: '/student/interview',   icon: Mic2,           label: 'AI Interview', short: 'Interview' },
  { to: '/student/referrals',   icon: Gift,           label: 'Rewards',      short: 'Rewards'   },
  { to: '/student/career',      icon: Briefcase,      label: 'Career',       short: 'Career'    },
];

// Bottom nav shows first 5 items
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
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
        client.execute({ sql: 'SELECT streak, coins FROM students WHERE id = ? LIMIT 1', args: [user!.id] })
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

  const isActive = (to: string) => {
    if (to === '/student') return location.pathname === '/student';
    return location.pathname.startsWith(to);
  };

  // ── Sidebar inner content ──────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-base leading-tight" style={{ color: '#06b6d4' }}>CynexAI</p>
          <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Student Portal</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mx-3 mt-4 p-4 rounded-2xl" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)' }}>
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 relative"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 16px rgba(6,182,212,0.4)' }}>
            {initials}
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2" style={{ borderColor: '#0d1526' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{user?.name ?? 'Student'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white"
                style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}>
                LVL {data.level}
              </span>
            </div>
          </div>
          {data.notifications > 0 && (
            <div className="relative">
              <Bell className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {data.notifications}
              </span>
            </div>
          )}
        </div>

        {/* XP bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span>XP Progress</span>
            <span>{data.completedClasses % 10}/10</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.xpPct}%`, background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }} />
          </div>
        </div>
      </div>

      {/* Stat Chips */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Flame,  value: data.streak,    label: 'Streak', color: '#f97316' },
          { icon: Coins,  value: data.coins,     label: 'Coins',  color: '#f59e0b' },
          { icon: Shield, value: data.badgeCount, label: 'Badges', color: '#8b5cf6' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="rounded-xl py-2.5 text-center" style={{ background: `${color}09`, border: `1px solid ${color}22` }}>
            <Icon className="w-4 h-4 mx-auto mb-0.5" style={{ color }} />
            <div className="text-sm font-black leading-none" style={{ color }}>{value}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: `${color}70` }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-black uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Navigation</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <button
              key={to}
              onClick={() => { navigate(to); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative"
              style={{
                background: active ? 'rgba(6,182,212,0.12)' : 'transparent',
                color: active ? '#06b6d4' : 'rgba(255,255,255,0.45)',
                borderLeft: active ? '2px solid #06b6d4' : '2px solid transparent',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#050814', color: '#e2e8f0' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col" style={{ background: '#0d1526', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile: Full-screen Menu Overlay ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 flex flex-col z-10" style={{ background: '#0d1526', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#0d1526', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-sm" style={{ color: '#06b6d4' }}>CynexAI</span>
          </button>

          {/* Mobile stat pills */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Flame className="w-3.5 h-3.5" />
              {data.streak}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Coins className="w-3.5 h-3.5" />
              {data.coins}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div
          className="md:hidden flex-shrink-0 flex justify-around items-center px-2"
          style={{
            background: 'rgba(13,21,38,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            height: '64px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
          {BOTTOM_NAV.map(({ to, icon: Icon, short }) => {
            const active = isActive(to);
            return (
              <button key={to} onClick={() => navigate(to)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ minWidth: '52px', color: active ? '#06b6d4' : 'rgba(255,255,255,0.3)' }}>
                <div className="w-8 h-6 flex items-center justify-center rounded-lg transition-all"
                  style={{ background: active ? 'rgba(6,182,212,0.12)' : 'transparent' }}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[9px] font-bold leading-none">{short}</span>
                {active && <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />}
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl"
            style={{ minWidth: '52px', color: 'rgba(255,255,255,0.3)' }}>
            <div className="w-8 h-6 flex items-center justify-center">
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <span className="text-[9px] font-bold leading-none">More</span>
          </button>
        </div>

      </div>
    </div>
  );
}
