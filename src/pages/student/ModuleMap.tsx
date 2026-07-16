import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getModuleMapData } from '../../lib/api/student';

interface ClassItem {
  id: string;
  title: string;
  type: string;
  status: string;
  order_index: number;
  youtube_video_id: string | null;
  meet_link: string | null;
  date: string | null;
  start_time: string | null;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
}

type NodeState = 'completed' | 'current' | 'locked';

function getNodeState(
  cls: ClassItem,
  completedSet: Set<string>,
  currentId: string | null
): NodeState {
  if (completedSet.has(cls.id)) return 'completed';
  if (cls.id === currentId) return 'current';
  return 'locked';
}

function formatDate(date: string | null, startTime: string | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (startTime) return `${dateStr} · ${startTime}`;
    return dateStr;
  } catch {
    return date;
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M6.5 5.5a1 1 0 011.5-.866l7 4a1 1 0 010 1.732l-7 4A1 1 0 016.5 13.5v-8z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0L2.586 11l5.707-5.707a1 1 0 011.414 1.414L5.414 11l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 11a1 1 0 011-1h13a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

// ── Node Component ────────────────────────────────────────────────────────────

interface ClassNodeProps {
  cls: ClassItem;
  state: NodeState;
  isLast: boolean;
  onClick: () => void;
}

function ClassNode({ cls, state, isLast, onClick }: ClassNodeProps) {
  const isClickable = state === 'completed' || state === 'current';
  const dateStr = formatDate(cls.date, cls.start_time);

  const circleBase =
    'relative flex items-center justify-center w-14 h-14 rounded-full border-4 shrink-0 transition-all duration-200 select-none';
  const circleStyles: Record<NodeState, string> = {
    completed:
      'bg-green-500 border-green-600 text-white shadow-lg shadow-green-200',
    current:
      'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-200 animate-pulse-slow',
    locked:
      'bg-muted border-border text-muted-foreground',
  };

  const typeBadge: Record<string, string> = {
    live: 'bg-orange-100 text-orange-700 border border-orange-200',
    recorded: 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  const badgeClass =
    typeBadge[cls.type?.toLowerCase()] ??
    'bg-gray-100 text-gray-600 border border-gray-200';

  return (
    <div className="flex gap-4 items-start">
      {/* Left: circle + connector */}
      <div className="flex flex-col items-center">
        <button
          onClick={isClickable ? onClick : undefined}
          disabled={!isClickable}
          aria-label={cls.title}
          className={`${circleBase} ${circleStyles[state]} ${
            isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-60'
          }`}
        >
          {state === 'completed' && <CheckIcon />}
          {state === 'current' && <PlayIcon />}
          {state === 'locked' && <LockIcon />}

          {/* Outer ring for current */}
          {state === 'current' && (
            <span className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-50" />
          )}
        </button>

        {/* Connector line */}
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[2.5rem] mt-1 ${
              state === 'completed' ? 'bg-green-400' : 'bg-border'
            }`}
          />
        )}
      </div>

      {/* Right: info */}
      <div
        className={`pb-8 pt-2 flex-1 min-w-0 ${isLast ? 'pb-2' : ''}`}
        onClick={isClickable ? onClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}
          >
            {cls.type || 'class'}
          </span>
          {state === 'locked' && (
            <span className="text-xs text-muted-foreground">Locked</span>
          )}
        </div>
        <p
          className={`font-semibold text-sm leading-snug ${
            isClickable ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {cls.title}
        </p>
        {dateStr && (
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
        )}
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{completed} of {total} completed</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ModuleMap() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    getModuleMapData(moduleId, user.id)
      .then(({ moduleData: md, classes: cls, completedLessonIds }) => {
        setModuleData(md as ModuleData | null);
        setClasses(cls as ClassItem[]);
        setCompletedIds(completedLessonIds as Set<string>);
      })
      .catch((e) => {
        console.error(e);
        setError('Failed to load module. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [moduleId, navigate]);

  // Determine current class: first uncompleted in order
  const currentClass = classes.find((c) => !completedIds.has(c.id)) ?? null;
  const completedCount = classes.filter((c) => completedIds.has(c.id)).length;

  const handleClassClick = (cls: ClassItem) => {
    navigate(`/student/class-flow?classId=${cls.id}`);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading module…</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="px-5 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/student')}
          className="p-2 rounded-lg hover:bg-surface transition text-muted-foreground hover:text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeftIcon />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-base sm:text-lg truncate leading-tight">
            {moduleData?.title ?? 'Module'}
          </h1>
          {classes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {completedCount} / {classes.length} classes
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Module meta */}
        {moduleData && (
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            {moduleData.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {moduleData.description}
              </p>
            )}
            {classes.length > 0 && (
              <ProgressBar completed={completedCount} total={classes.length} />
            )}
          </div>
        )}

        {/* Class path */}
        {classes.length === 0 ? (
          // Empty state
          <div className="bg-surface border border-border rounded-2xl p-10 text-center space-y-2">
            <div className="text-4xl mb-2">📭</div>
            <p className="font-semibold text-foreground">No classes yet</p>
            <p className="text-sm text-muted-foreground">
              Classes for this module haven't been added yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">
              Class Path
            </h2>
            <div className="pl-1">
              {classes.map((cls, idx) => {
                const state = getNodeState(cls, completedIds, currentClass?.id ?? null);
                return (
                  <ClassNode
                    key={cls.id}
                    cls={cls}
                    state={state}
                    isLast={idx === classes.length - 1}
                    onClick={() => handleClassClick(cls)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
