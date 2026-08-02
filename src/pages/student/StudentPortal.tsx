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
  Shield,
  Video,
  Loader2,
  AlertCircle,
  Play,
  Lock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  X,
  AlarmClock,
} from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import {
  getStudentDashboardData,
  getAnnouncements,
  StudentDashboardData,
  Announcement,
} from '../../lib/api/student';
import { gsap } from 'gsap';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAnnouncementExpired(ann: Announcement): boolean {
  if (!ann.title?.startsWith('⏰')) return false;
  
  const timeMatch = ann.body?.match(/🕐 New Time: ([\d:]+)/);
  const dateMatch = ann.body?.match(/📆 New Date: ([\d-]+)/);
  
  if (timeMatch) {
    const classTime = timeMatch[1];
    let classDateStr = dateMatch ? dateMatch[1] : ann.created_at?.split('T')[0];
    if (!classDateStr) classDateStr = new Date().toISOString().split('T')[0];
    
    // Parse the new class date and time
    const classDate = new Date(`${classDateStr}T${classTime}:00`);
    if (!isNaN(classDate.getTime())) {
      // If the scheduled time is in the past, it's expired
      return classDate < new Date();
    }
  }
  return false;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayH = hour % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="stroke-slate-200 dark:stroke-white/[0.06]"
        strokeWidth={6}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ringGrad)"
        strokeWidth={6}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  pct,
  gradient = 'from-cyan-500 to-violet-500',
  height = 'h-1.5',
}: {
  pct: number;
  gradient?: string;
  height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ─── Announcements Banner ─────────────────────────────────────────────────────

function AnnouncementsBanner({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;
  const text = announcements.map((a) => a.title).join('   •   ');

  return (
    <div className="flex items-center overflow-hidden candy-panel px-4 py-2.5 gap-3">
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
        <span className="text-cyan-600 dark:text-cyan-400 font-bold text-[10px] uppercase tracking-widest">
          News
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="whitespace-nowrap animate-marquee inline-block text-sm text-slate-700 dark:text-[#94a3b8] font-medium">
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Notification Popup ───────────────────────────────────────────

function ReschedulePopup({ announcements, onDismiss }: { announcements: Announcement[]; onDismiss: (id: string) => void }) {
  const rescheduleAnns = announcements.filter(a => a.title?.startsWith('⏰'));
  const [currentIdx, setCurrentIdx] = React.useState(0);
  if (rescheduleAnns.length === 0) return null;
  const ann = rescheduleAnns[currentIdx];
  if (!ann) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md candy-panel overflow-hidden animate-slide-down">
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/20">
          <AlarmClock className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span className="flex-1 font-bold text-orange-700 dark:text-orange-400 text-sm">{ann.title}</span>
          <button
            onClick={() => {
              onDismiss(ann.id);
              if (currentIdx < rescheduleAnns.length - 1) setCurrentIdx(i => i + 1);
            }}
            className="w-7 h-7 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-orange-500" />
          </button>
        </div>
        <div className="px-4 py-3">
          <pre className="text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{ann.body}</pre>
        </div>
        {rescheduleAnns.length > 1 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-400 text-center">
            {currentIdx + 1} of {rescheduleAnns.length} notifications
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course Hero Card ─────────────────────────────────────────────────────────

function CourseHeroCard({ course, modules }: { course: any; modules: any[] }) {
  const totalClasses = modules.reduce((s, m) => s + (m.totalClasses || 0), 0);
  const completedClasses = modules.reduce((s, m) => s + (m.completedClasses || 0), 0);
  const overallPct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  return (
    <div className="relative overflow-hidden candy-panel p-5">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-100 dark:bg-cyan-500/[0.07] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-violet-100 dark:bg-violet-500/[0.07] blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-cyan-600 dark:text-cyan-400/80 text-[10px] font-bold uppercase tracking-widest">
              Current Course
            </p>
          </div>
          <h2 className="text-slate-900 dark:text-[#e2e8f0] font-black text-lg leading-tight line-clamp-2 mb-3">
            {course.title || course.name || 'Your Course'}
          </h2>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-[#94a3b8] text-xs font-medium">
                {completedClasses} of {totalClasses} classes
              </span>
              <span className="text-slate-900 dark:text-[#e2e8f0] text-xs font-bold">{modules.length} modules</span>
            </div>
            <ProgressBar pct={overallPct} height="h-2" />
          </div>
        </div>

        {/* Right: ring + pct */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="relative">
            <ProgressRing pct={overallPct} size={76} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-slate-900 dark:text-[#e2e8f0] text-base font-black leading-none">
                {overallPct}%
              </span>
            </div>
          </div>
          <span className="text-slate-500 dark:text-[#475569] text-[9px] font-bold uppercase tracking-wider">
            Complete
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Gamification Stat Cards ──────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  iconColor,
  bgGrad,
  borderColor,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  sublabel: string;
  iconColor: string;
  bgGrad: string;
  borderColor: string;
}) {
  return (
    <div className={`relative overflow-hidden candy-panel p-4 stat-card`}>
      <div className={`absolute inset-0 ${bgGrad} pointer-events-none rounded-2xl opacity-50 dark:opacity-100`} />
      <div className="relative flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl ${bgGrad} border ${borderColor} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className={`text-2xl font-black ${iconColor} leading-none tabular-nums`}>{value}</p>
          <p className="text-slate-600 dark:text-[#94a3b8] text-[11px] font-bold uppercase tracking-wide mt-0.5">
            {label}
          </p>
        </div>
      </div>
      <p className="text-slate-500 dark:text-[#475569] text-[11px] mt-2.5 relative leading-snug">{sublabel}</p>
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
    <div className="candy-panel p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-slate-900 dark:text-[#e2e8f0] font-bold text-sm flex-1">Upcoming Class</h3>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-slate-900 dark:text-[#e2e8f0] font-semibold text-sm line-clamp-2 mb-2 leading-snug">
            {cls.title || 'Upcoming Session'}
          </p>
          <div className="flex items-center gap-3 text-slate-500 dark:text-[#475569] text-xs font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(cls.date)}
            </span>
            {cls.start_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(cls.start_time)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleJoin}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-opacity duration-150 ${
            isLive
              ? 'candy-btn'
              : 'candy-btn-blue'
          }`}
        >
          {isLive ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {isLive ? 'Join' : 'View'}
        </button>
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod, index }: { mod: any; index: number }) {
  const navigate = useNavigate();
  const pct = mod.progressPct ?? 0;

  const cardGradients = [
    { lightFrom: 'from-cyan-50', lightTo: 'to-blue-50', from: 'dark:from-cyan-500/20', to: 'dark:to-blue-600/10', border: 'border-cyan-200 dark:border-cyan-500/20', bar: 'from-cyan-500 to-blue-500', icon: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-500/15' },
    { lightFrom: 'from-violet-50', lightTo: 'to-purple-50', from: 'dark:from-violet-500/20', to: 'dark:to-purple-600/10', border: 'border-violet-200 dark:border-violet-500/20', bar: 'from-violet-500 to-purple-500', icon: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-500/15' },
    { lightFrom: 'from-emerald-50', lightTo: 'to-teal-50', from: 'dark:from-emerald-500/20', to: 'dark:to-teal-600/10', border: 'border-emerald-200 dark:border-emerald-500/20', bar: 'from-emerald-500 to-teal-500', icon: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-500/15' },
    { lightFrom: 'from-orange-50', lightTo: 'to-red-50', from: 'dark:from-orange-500/20', to: 'dark:to-red-500/10', border: 'border-orange-200 dark:border-orange-500/20', bar: 'from-orange-500 to-red-500', icon: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-500/15' },
    { lightFrom: 'from-pink-50', lightTo: 'to-rose-50', from: 'dark:from-pink-500/20', to: 'dark:to-rose-500/10', border: 'border-pink-200 dark:border-pink-500/20', bar: 'from-pink-500 to-rose-500', icon: 'text-pink-600 dark:text-pink-400', iconBg: 'bg-pink-100 dark:bg-pink-500/15' },
    { lightFrom: 'from-amber-50', lightTo: 'to-yellow-50', from: 'dark:from-amber-500/20', to: 'dark:to-yellow-500/10', border: 'border-amber-200 dark:border-amber-500/20', bar: 'from-amber-500 to-yellow-500', icon: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-500/15' },
  ];

  const c = cardGradients[index % cardGradients.length];

  // Determine module status
  const isCompleted = pct >= 100;
  const isLocked = pct === 0 && mod.completedClasses === 0;
  const StatusIcon = isCompleted ? CheckCircle2 : isLocked ? Lock : Play;
  const statusColor = isCompleted ? 'text-emerald-500 dark:text-emerald-400' : isLocked ? 'text-slate-400 dark:text-[#475569]' : c.icon;

  return (
    <button
      onClick={() => navigate(`/student/module/${mod.id}`)}
      className="w-full text-left group module-card"
    >
      <div
        className={`relative candy-panel p-4 transition-all duration-200 hover:-translate-y-1 hover:brightness-110 cursor-pointer`}
      >
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${c.lightFrom} ${c.lightTo} ${c.from} ${c.to} rounded-2xl pointer-events-none opacity-50 dark:opacity-100`} />

        <div className="relative">
          {/* Top row */}
          <div className="flex items-start gap-3 mb-3">
            {/* Number badge */}
            <div
              className={`w-9 h-9 rounded-xl ${c.iconBg} border ${c.border} flex items-center justify-center flex-shrink-0 text-[13px] font-black ${c.icon}`}
            >
              {index + 1}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <p className={`text-slate-900 dark:text-[#e2e8f0] font-bold text-sm leading-tight line-clamp-2 group-hover:${c.icon} transition-colors`}>
                {mod.title || mod.name || `Module ${index + 1}`}
              </p>
              <p className="text-slate-500 dark:text-[#475569] text-[11px] mt-0.5 font-medium">
                {mod.completedClasses ?? 0}/{mod.totalClasses ?? 0} classes
                {(mod.questionsAnswered ?? 0) > 0 && ` · ${mod.questionsAnswered} Q&A`}
                {(mod.codeExerciseCount ?? 0) > 0 && ` · ${mod.codeExerciseCount} exercises`}
              </p>
            </div>

            {/* Status icon + pct */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <StatusIcon className={`w-4 h-4 ${statusColor}`} strokeWidth={2.5} />
              <span className={`text-xs font-black ${c.icon}`}>{pct}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar pct={pct} gradient={c.bar} height="h-1.5" />
        </div>
      </div>
    </button>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  meta,
}: {
  icon: React.ElementType;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-slate-900 dark:text-[#e2e8f0] font-bold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" strokeWidth={2.5} />
        {title}
      </h2>
      {meta && <span className="text-slate-500 dark:text-[#475569] text-xs font-medium">{meta}</span>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-cyan-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center mb-5">
        <BookOpen className="w-9 h-9 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-slate-900 dark:text-[#e2e8f0] font-bold text-xl mb-2">No Course Yet</h3>
      <p className="text-slate-600 dark:text-[#94a3b8] text-sm max-w-xs leading-relaxed">
        Your course hasn&apos;t been set up yet. Contact your coordinator to get started.
      </p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-slate-900 dark:text-[#e2e8f0] font-bold text-lg mb-1">Failed to load</h3>
      <p className="text-slate-600 dark:text-[#94a3b8] text-sm mb-5">Could not fetch your dashboard data.</p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 candy-btn-blue text-sm"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-slate-600 dark:text-[#94a3b8] text-sm font-medium">Loading your dashboard…</p>
      </div>
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
  const [dismissedAnnIds, setDismissedAnnIds] = useState<Set<string>>(new Set());
  const portalContainer = React.useRef<HTMLDivElement>(null);

  const handleDismiss = (id: string) => setDismissedAnnIds(prev => new Set([...prev, id]));

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const u = getCurrentUser();
      if (!u) {
        navigate('/login');
        return;
      }
      const [dashResult, annsResult] = await Promise.all([
        getStudentDashboardData(u.id).catch(() => ({
          course: null,
          gamification: { streak: 0, coins: 0 },
          modules: [],
          upcomingClass: null,
        })),
        getAnnouncements().catch(() => []),
      ]);
      const activeAnns = annsResult.filter((a: Announcement) => !isAnnouncementExpired(a));
      setDashData(dashResult as StudentDashboardData);
      setAnnouncements(activeAnns);
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
  if (loading) return <LoadingState />;

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
      <div className="p-4 md:p-6 space-y-4">
        <AnnouncementsBanner announcements={announcements} />
        <EmptyState />
      </div>
    );
  }

  const { course, gamification, modules, upcomingClass } = dashData;
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="candy-map-bg min-h-screen" ref={portalContainer}>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {/* ── Reschedule Popup Notifications ── */}
        <ReschedulePopup
          announcements={announcements.filter(a => !dismissedAnnIds.has(a.id))}
          onDismiss={handleDismiss}
        />

        {/* ── Announcements Banner ── */}
        {announcements.length > 0 && (
          <div className="mb-5">
            <AnnouncementsBanner announcements={announcements} />
          </div>
        )}

        {/* ── Greeting ── */}
        <div className="mb-5 px-1">
          <p className="text-slate-600 dark:text-[#94a3b8] text-sm font-medium">
            Welcome back,{' '}
            <span className="text-slate-900 dark:text-[#e2e8f0] font-bold">{firstName}</span>
          </p>
          <h1 className="text-slate-900 dark:text-[#e2e8f0] text-2xl font-black mt-0.5 leading-tight">
            Your Dashboard
          </h1>
        </div>

        {/* ══ Two-column desktop layout ══ */}
        <div className="flex flex-col md:flex-row gap-4 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Course Hero */}
            <CourseHeroCard course={course} modules={modules} />

            {/* Gamification stats (mobile: visible here; desktop: shown in right col) */}
            <div className="md:hidden grid grid-cols-3 gap-2">
              <div className="candy-panel p-3 flex flex-col items-center gap-1">
                <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" strokeWidth={2.5} />
                <span className="text-orange-500 dark:text-orange-400 text-xl font-black leading-none tabular-nums">
                  {gamification.streak}
                </span>
                <span className="text-slate-500 dark:text-[#475569] text-[9px] font-bold uppercase tracking-wider">Streak</span>
              </div>
              <div className="candy-panel p-3 flex flex-col items-center gap-1">
                <Coins className="w-5 h-5 text-amber-500 dark:text-amber-400" strokeWidth={2.5} />
                <span className="text-amber-500 dark:text-amber-400 text-xl font-black leading-none tabular-nums">
                  {gamification.coins}
                </span>
                <span className="text-slate-500 dark:text-[#475569] text-[9px] font-bold uppercase tracking-wider">Coins</span>
              </div>
              <div className="candy-panel p-3 flex flex-col items-center gap-1">
                <Trophy className="w-5 h-5 text-violet-500 dark:text-violet-400" strokeWidth={2.5} />
                <span className="text-violet-500 dark:text-violet-400 text-xl font-black leading-none tabular-nums">0</span>
                <span className="text-slate-500 dark:text-[#475569] text-[9px] font-bold uppercase tracking-wider">Trophies</span>
              </div>
            </div>

            {/* Modules */}
            {modules.length > 0 ? (
              <section>
                <SectionHeading
                  icon={BookOpen}
                  title="Modules"
                  meta={`${modules.length} total`}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {modules.map((mod, i) => (
                    <ModuleCard key={mod.id ?? i} mod={mod} index={i} />
                  ))}
                </div>
              </section>
            ) : (
              <div className="candy-panel p-6 text-center">
                <Trophy className="w-8 h-8 text-slate-400 dark:text-[#475569] mx-auto mb-2" />
                <p className="text-slate-600 dark:text-[#94a3b8] text-sm">No modules have been added to your course yet.</p>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (desktop only) ── */}
          <div className="w-full md:w-80 flex-shrink-0 space-y-4">

            {/* Gamification stats */}
            <div className="hidden md:block space-y-3">
              <SectionHeading icon={Zap} title="Your Stats" />
              <StatCard
                icon={Flame}
                value={gamification.streak}
                label="Day Streak"
                sublabel="Study daily to keep your streak alive."
                iconColor="text-orange-500 dark:text-orange-400"
                bgGrad="bg-orange-50 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-transparent"
                borderColor="border-orange-200 dark:border-orange-500/20"
              />
              <StatCard
                icon={Coins}
                value={gamification.coins}
                label="Coins"
                sublabel="Earn more by completing Q&A sessions."
                iconColor="text-amber-500 dark:text-amber-400"
                bgGrad="bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/10 dark:to-transparent"
                borderColor="border-amber-200 dark:border-amber-500/20"
              />
              <StatCard
                icon={TrendingUp}
                value={modules.reduce((s, m) => s + (m.completedClasses || 0), 0)}
                label="Classes Done"
                sublabel="Total across all course modules."
                iconColor="text-cyan-500 dark:text-cyan-400"
                bgGrad="bg-cyan-50 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:to-transparent"
                borderColor="border-cyan-200 dark:border-cyan-500/20"
              />
            </div>

            {/* Upcoming Class */}
            {upcomingClass && (
              <div>
                <SectionHeading icon={Calendar} title="Upcoming Class" />
                <UpcomingClassCard cls={upcomingClass} />
              </div>
            )}

            {/* Announcements card (desktop) */}
            {announcements.length > 0 && (
              <div className="hidden md:block">
                <SectionHeading icon={Bell} title="Announcements" meta={`${announcements.length}`} />
                <div className="candy-panel divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {announcements.slice(0, 4).map((ann, i) => (
                    <div key={ann.id ?? i} className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 flex-shrink-0" />
                        <p className="text-slate-600 dark:text-[#94a3b8] text-xs font-medium leading-snug line-clamp-2">
                          {ann.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick tip card */}
            <div className="hidden md:flex items-start gap-3 candy-panel p-4">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/25 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-[#e2e8f0] text-xs font-bold mb-0.5">Pro Tip</p>
                <p className="text-slate-500 dark:text-[#475569] text-[11px] leading-snug">
                  Complete at least one class daily to maintain your streak and earn bonus coins.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacer for mobile nav */}
        <div className="h-6" />
      </div>
    </div>
  );
}
