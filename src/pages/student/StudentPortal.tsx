import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Zap,
  Trophy,
  Calendar,
  ChevronRight,
  Bell,
  Flame,
  Coins,
  Video,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import {
  getStudentDashboardData,
  getAnnouncements,
  StudentDashboardData,
  Announcement,
} from '../../lib/api/student';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  // timeStr may be "HH:MM:SS" or "HH:MM"
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayH = hour % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, gradient = 'from-blue-500 to-indigo-600', height = 'h-2' }: {
  pct: number;
  gradient?: string;
  height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-foreground/10 rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ─── Announcements Marquee ────────────────────────────────────────────────────

function AnnouncementsBanner({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;
  const text = announcements.map((a) => `📢 ${a.title}`).join('   •   ');

  return (
    <div className="relative flex items-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 px-4 py-2.5 gap-3">
      <div className="flex-shrink-0 flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
        <Bell className="w-3.5 h-3.5" />
        News
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee inline-block text-sm text-foreground/80 font-medium">
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Course Hero ──────────────────────────────────────────────────────────────

function CourseHeroCard({ course, modules }: { course: any; modules: any[] }) {
  const totalClasses = modules.reduce((s, m) => s + (m.totalClasses || 0), 0);
  const completedClasses = modules.reduce((s, m) => s + (m.completedClasses || 0), 0);
  const overallPct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20">
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Current Course</p>
              <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">
                {course.title || course.name || 'Your Course'}
              </h2>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-3xl font-black text-white">{overallPct}%</span>
            <p className="text-white/60 text-[10px] font-semibold uppercase">Complete</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/70 font-medium">
            <span>{completedClasses} of {totalClasses} classes done</span>
            <span>{modules.length} modules</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gamification Stats ───────────────────────────────────────────────────────

function GamificationRow({ streak, coins }: { streak: number; coins: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Streak */}
      <GlassCard className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5 pointer-events-none rounded-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-2xl font-black text-orange-400 leading-none">{streak}</p>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mt-0.5">Day Streak</p>
          </div>
        </div>
        <p className="text-muted-foreground text-[11px] mt-2 relative">Keep it going! Study daily.</p>
      </GlassCard>

      {/* Coins */}
      <GlassCard className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 pointer-events-none rounded-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🪙</span>
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-400 leading-none">{coins}</p>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mt-0.5">Coins</p>
          </div>
        </div>
        <p className="text-muted-foreground text-[11px] mt-2 relative">Earn more by answering Q&amp;A.</p>
      </GlassCard>
    </div>
  );
}

// ─── Upcoming Class Card ──────────────────────────────────────────────────────

function UpcomingClassCard({ cls }: { cls: any }) {
  const navigate = useNavigate();
  const isLive = cls.type === 'live';

  const handleJoin = () => {
    if (isLive && cls.meet_link) {
      window.open(cls.meet_link, '_blank', 'noopener,noreferrer');
    } else if (cls.module_id) {
      navigate(`/student/module/${cls.module_id}`);
    } else {
      navigate(`/student/module/${cls.id}`);
    }
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <h3 className="text-foreground font-bold text-sm">Upcoming Class</h3>
        {isLive && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground font-semibold text-base line-clamp-2 mb-1.5">
            {cls.title || 'Upcoming Session'}
          </p>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(cls.date)}
            </span>
            {cls.start_time && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {formatTime(cls.start_time)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleJoin}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
        >
          {isLive ? <Video className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {isLive ? 'Join' : 'View'}
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod, index }: { mod: any; index: number }) {
  const navigate = useNavigate();
  const pct = mod.progressPct ?? 0;
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
  ];
  const grad = gradients[index % gradients.length];

  return (
    <button
      onClick={() => navigate(`/student/module/${mod.id}`)}
      className="w-full text-left group"
    >
      <GlassCard className="p-4 hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-md`}
          >
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {mod.title || mod.name || `Module ${index + 1}`}
            </p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              {mod.completedClasses ?? 0}/{mod.totalClasses ?? 0} classes
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className={`text-sm font-black bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>
              {pct}%
            </span>
          </div>
        </div>
        <ProgressBar pct={pct} gradient={grad} />
      </GlassCard>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center mb-5">
        <BookOpen className="w-9 h-9 text-blue-400" />
      </div>
      <h3 className="text-foreground font-bold text-xl mb-2">No Course Yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Your course hasn&apos;t been set up yet. Contact your coordinator to get started.
      </p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-foreground font-bold text-lg mb-1">Failed to load</h3>
      <p className="text-muted-foreground text-sm mb-4">Could not fetch your dashboard data.</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentPortal() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [dash, ann] = await Promise.all([
        getStudentDashboardData(user.id),
        getAnnouncements(),
      ]);
      setDashData(dash);
      setAnnouncements(ann);
    } catch (e) {
      console.error('StudentPortal load error:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="p-6">
        <ErrorState onRetry={loadData} />
      </div>
    );
  }

  // ── No course ──
  if (!dashData?.course) {
    return (
      <div className="p-6">
        <AnnouncementsBanner announcements={announcements} />
        <EmptyState />
      </div>
    );
  }

  const { course, gamification, modules, upcomingClass } = dashData;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

      {/* ── Announcements Banner ── */}
      <AnnouncementsBanner announcements={announcements} />

      {/* ── Greeting ── */}
      <div>
        <p className="text-muted-foreground text-sm font-medium">
          Welcome back,{' '}
          <span className="text-foreground font-bold">{user?.name?.split(' ')[0] ?? 'Student'}</span> 👋
        </p>
        <h1 className="text-foreground text-2xl font-black mt-0.5 leading-tight">Your Dashboard</h1>
      </div>

      {/* ── Course Hero ── */}
      <CourseHeroCard course={course} modules={modules} />

      {/* ── Gamification Stats ── */}
      <GamificationRow streak={gamification.streak} coins={gamification.coins} />

      {/* ── Upcoming Class ── */}
      {upcomingClass && <UpcomingClassCard cls={upcomingClass} />}

      {/* ── Modules Grid ── */}
      {modules.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-bold text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Modules
            </h2>
            <span className="text-muted-foreground text-xs font-medium">{modules.length} total</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((mod, i) => (
              <ModuleCard key={mod.id ?? i} mod={mod} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── No modules yet ── */}
      {modules.length === 0 && (
        <GlassCard className="p-6 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No modules have been added to your course yet.</p>
        </GlassCard>
      )}

      {/* ── Bottom spacer for mobile nav ── */}
      <div className="h-4" />
    </div>
  );
}
