import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getModuleMapData } from '../../lib/api/student';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  description?: string | null;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
}

type NodeState = 'completed' | 'current' | 'locked';

function getNodeState(cls: ClassItem, completedSet: Set<string>, currentId: string | null): NodeState {
  if (completedSet.has(cls.id)) return 'completed';
  if (cls.id === currentId) return 'current';
  return 'locked';
}

// Classify node type for icon and style
function getNodeKind(cls: ClassItem): 'video' | 'live' | 'quiz' | 'code' | 'lesson' {
  const t = (cls.type || '').toLowerCase();
  if (t === 'live') return 'live';
  if (t === 'quiz' || t === 'qa' || t === 'q&a') return 'quiz';
  if (t === 'code' || t === 'exercise' || t === 'coding') return 'code';
  if (cls.youtube_video_id) return 'video';
  return 'lesson';
}

function formatDate(date: string | null, startTime: string | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (startTime) {
      const [h, m] = startTime.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return `${dateStr} · ${hour % 12 || 12}:${m} ${ampm}`;
    }
    return dateStr;
  } catch { return date; }
}

// ─── SVG Node Icons ───────────────────────────────────────────────────────────

const NodeIcons = {
  video: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="5,3 19,12 5,21" fill="currentColor" />
    </svg>
  ),
  live: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M6.3 6.3a8 8 0 0 0 0 11.4" strokeLinecap="round" />
      <path d="M17.7 6.3a8 8 0 0 1 0 11.4" strokeLinecap="round" />
    </svg>
  ),
  quiz: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 10c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2-3 2.5-3 4" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  code: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="16,18 22,12 16,6" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="8,6 2,12 8,18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lesson: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="14" y2="12" />
      <line x1="7" y1="16" x2="11" y2="16" />
    </svg>
  ),
  check: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Node style config ────────────────────────────────────────────────────────

const KIND_CONFIG = {
  video:  { color: '#6366f1', bg: '#6366f120', label: 'Video',    labelColor: '#818cf8' },
  live:   { color: '#ef4444', bg: '#ef444420', label: 'Live',     labelColor: '#f87171' },
  quiz:   { color: '#f59e0b', bg: '#f59e0b20', label: 'Q&A',      labelColor: '#fbbf24' },
  code:   { color: '#10b981', bg: '#10b98120', label: 'Coding',   labelColor: '#34d399' },
  lesson: { color: '#8b5cf6', bg: '#8b5cf620', label: 'Lesson',   labelColor: '#a78bfa' },
};

// ─── Popup Card ───────────────────────────────────────────────────────────────

function NodePopup({
  cls, state, onClose, onGo
}: {
  cls: ClassItem;
  state: NodeState;
  onClose: () => void;
  onGo: () => void;
}) {
  const kind = getNodeKind(cls);
  const cfg = KIND_CONFIG[kind];
  const isClickable = state !== 'locked';
  const dateStr = formatDate(cls.date, cls.start_time);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-surface, #1a1a2e)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)` }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}40` }}
            >
              {state === 'completed'
                ? <NodeIcons.check size={24} />
                : React.createElement(NodeIcons[kind as keyof typeof NodeIcons] || NodeIcons.lesson, { size: 24 })
              }
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1"
                style={{ background: cfg.bg, color: cfg.labelColor }}
              >
                {cfg.label}
              </span>
              <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{cls.title}</h3>
            </div>
          </div>

          {/* Meta */}
          {dateStr && (
            <div className="flex items-center gap-2 mb-4 text-sm text-white/50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateStr}
            </div>
          )}

          {/* Status badge */}
          <div className="mb-5">
            {state === 'completed' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <NodeIcons.check size={14} /> Completed
              </span>
            )}
            {state === 'current' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: cfg.color }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color }} />
                Ready to start
              </span>
            )}
            {state === 'locked' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white/30">
                <NodeIcons.lock size={14} /> Complete previous classes to unlock
              </span>
            )}
          </div>

          {/* Action */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onGo}
              disabled={!isClickable}
              className="flex-1 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: isClickable ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` : '#333' }}
            >
              {state === 'completed' ? 'Review' : state === 'current' ? 'Start ▶' : 'Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Node ──────────────────────────────────────────────────────────────

function MapNode({
  cls, state, index, totalNodes, onClick
}: {
  cls: ClassItem;
  state: NodeState;
  index: number;
  totalNodes: number;
  onClick: () => void;
}) {
  const kind = getNodeKind(cls);
  const cfg = KIND_CONFIG[kind];
  const isLast = index === totalNodes - 1;

  // Zigzag: alternate left/right columns
  // Pattern: center, right, center, left, center, right...
  const zigzag = [0, 1, 0, -1]; // 0=center, 1=right, -1=left
  const offset = zigzag[index % 4];

  const sizes = {
    completed: 'w-16 h-16 md:w-20 md:h-20',
    current:   'w-20 h-20 md:w-24 md:h-24',
    locked:    'w-14 h-14 md:w-16 md:h-16',
  };

  return (
    <div className="flex flex-col items-center" style={{ marginLeft: `${offset * 60}px` }}>
      {/* Node button */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={onClick}
          disabled={state === 'locked'}
          className={`
            ${sizes[state]} rounded-full flex items-center justify-center
            transition-all duration-300 relative select-none
            ${state !== 'locked' ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default opacity-50'}
          `}
          style={{
            background: state === 'locked'
              ? '#1e1e2e'
              : state === 'completed'
              ? `radial-gradient(circle at 30% 30%, #34d39950, #10b981)`
              : `radial-gradient(circle at 30% 30%, ${cfg.color}dd, ${cfg.color})`,
            border: state === 'locked'
              ? '3px solid #2a2a3e'
              : state === 'completed'
              ? '3px solid #10b981'
              : `3px solid ${cfg.color}`,
            boxShadow: state === 'current'
              ? `0 0 0 8px ${cfg.color}25, 0 8px 32px ${cfg.color}40`
              : state === 'completed'
              ? '0 4px 20px #10b98140'
              : 'none',
          }}
        >
          {/* Pulsing ring for current */}
          {state === 'current' && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ border: `3px solid ${cfg.color}` }}
            />
          )}

          {/* Star badge for completed */}
          {state === 'completed' && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-lg">
              ⭐
            </span>
          )}

          {/* Icon */}
          <span
            className="relative z-10"
            style={{ color: state === 'locked' ? '#555' : 'white' }}
          >
            {state === 'completed'
              ? <NodeIcons.check size={state === 'current' ? 28 : 22} />
              : state === 'locked'
              ? <NodeIcons.lock size={18} />
              : React.createElement(NodeIcons[kind as keyof typeof NodeIcons] || NodeIcons.lesson, {
                  size: state === 'current' ? 28 : 22
                })
            }
          </span>
        </button>

        {/* Label below node */}
        <div className="mt-2 text-center max-w-[100px]">
          <p
            className="text-[11px] font-black uppercase tracking-wide mb-0.5"
            style={{ color: state === 'locked' ? '#555' : cfg.labelColor }}
          >
            {cfg.label}
          </p>
          <p
            className="text-[12px] font-semibold leading-tight line-clamp-2"
            style={{ color: state === 'locked' ? '#444' : 'rgba(255,255,255,0.8)' }}
          >
            {cls.title}
          </p>
        </div>
      </div>

      {/* Connector to next node */}
      {!isLast && (
        <div className="flex flex-col items-center mt-3 mb-1" style={{ gap: '3px' }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: state === 'completed' ? '#10b981' : '#2a2a3e',
                opacity: state === 'completed' ? 1 - i * 0.15 : 0.5,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ModuleMap() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCls, setSelectedCls] = useState<ClassItem | null>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleId) return;
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    getModuleMapData(moduleId, user.id)
      .then(({ moduleData: md, classes: cls, completedLessonIds }) => {
        setModuleData(md as ModuleData | null);
        setClasses(cls as ClassItem[]);
        setCompletedIds(completedLessonIds as Set<string>);
      })
      .catch(e => { console.error(e); setError('Failed to load module.'); })
      .finally(() => setLoading(false));
  }, [moduleId, navigate]);

  const currentClass = classes.find(c => !completedIds.has(c.id)) ?? null;
  const completedCount = classes.filter(c => completedIds.has(c.id)).length;
  const pct = classes.length > 0 ? Math.round((completedCount / classes.length) * 100) : 0;

  const handleNodeClick = (cls: ClassItem) => setSelectedCls(cls);
  const handleGo = () => {
    if (!selectedCls) return;
    setSelectedCls(null);
    navigate(`/student/class-flow?classId=${selectedCls.id}`);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-indigo-500/20 animate-spin" />
          </div>
          <p className="text-white/50 text-sm font-medium">Loading your quest map…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0d1a' }}>
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #111128 100%)' }}>
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3"
        style={{ background: 'rgba(13,13,26,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/student')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base text-white truncate">{moduleData?.title ?? 'Module'}</h1>
            <p className="text-white/40 text-[11px] font-medium">{completedCount}/{classes.length} classes · {pct}% complete</p>
          </div>
          {/* Progress pill */}
          <div
            className="px-3 py-1 rounded-full text-sm font-black"
            style={{
              background: pct === 100 ? '#10b98120' : '#6366f120',
              color: pct === 100 ? '#34d399' : '#818cf8',
              border: `1px solid ${pct === 100 ? '#10b98140' : '#6366f140'}`
            }}
          >
            {pct}%
          </div>
        </div>

        {/* XP progress bar */}
        <div className="max-w-lg mx-auto mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
        </div>
      </div>

      {/* ── Module Description ── */}
      {moduleData?.description && (
        <div className="max-w-lg mx-auto px-4 pt-5">
          <div
            className="rounded-2xl p-4 text-sm text-white/50 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {moduleData.description}
          </div>
        </div>
      )}

      {/* ── Kind Legend ── */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex flex-wrap gap-2">
        {(Object.entries(KIND_CONFIG) as [string, typeof KIND_CONFIG[keyof typeof KIND_CONFIG]][]).map(([key, cfg]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.labelColor, border: `1px solid ${cfg.color}30` }}
          >
            {cfg.label}
          </span>
        ))}
      </div>

      {/* ── Empty state ── */}
      {classes.length === 0 && (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No classes yet</h3>
          <p className="text-white/40 text-sm">Classes for this module haven't been added yet. Check back soon!</p>
        </div>
      )}

      {/* ── Candy Crush Map ── */}
      {classes.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-6 pb-32">
          {/* Start Banner */}
          <div
            className="text-center mb-8 py-4 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.2)' }}
          >
            <p className="text-indigo-400/60 text-[11px] font-black uppercase tracking-widest">Quest Map · {classes.length} Levels</p>
          </div>

          {/* Nodes */}
          <div className="flex flex-col items-center gap-2" ref={currentNodeRef}>
            {classes.map((cls, idx) => {
              const state = getNodeState(cls, completedIds, currentClass?.id ?? null);
              return (
                <MapNode
                  key={cls.id}
                  cls={cls}
                  state={state}
                  index={idx}
                  totalNodes={classes.length}
                  onClick={() => handleNodeClick(cls)}
                />
              );
            })}
          </div>

          {/* Finish banner */}
          {pct === 100 && (
            <div
              className="mt-10 text-center py-8 rounded-3xl"
              style={{ background: 'radial-gradient(circle, #10b98115, transparent)', border: '1px solid #10b98130' }}
            >
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-emerald-400 font-black text-xl">Module Complete!</h3>
              <p className="text-white/40 text-sm mt-1">You've mastered all {classes.length} classes</p>
            </div>
          )}
        </div>
      )}

      {/* ── Popup ── */}
      {selectedCls && (
        <NodePopup
          cls={selectedCls}
          state={getNodeState(selectedCls, completedIds, currentClass?.id ?? null)}
          onClose={() => setSelectedCls(null)}
          onGo={handleGo}
        />
      )}
    </div>
  );
}
