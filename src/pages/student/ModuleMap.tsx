import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getModuleMapData } from '../../lib/api/student';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const NODE_SPACING = 140;
const AMPLITUDE = 90;

function calculatePath(nodesLength: number) {
  if (nodesLength === 0) return '';
  let d = `M 0,80 `;
  for (let i = 1; i < nodesLength; i++) {
    const prevY = (i - 1) * NODE_SPACING + 80;
    const prevX = Math.sin((i - 1) * 0.8) * AMPLITUDE;
    const currY = i * NODE_SPACING + 80;
    const currX = Math.sin(i * 0.8) * AMPLITUDE;
    const cp1y = prevY + NODE_SPACING / 2;
    const cp2y = currY - NODE_SPACING / 2;
    d += `C ${prevX},${cp1y} ${currX},${cp2y} ${currX},${currY} `;
  }
  return d;
}

function calculateCompletedPath(nodesLength: number, currentLevel: number) {
  if (nodesLength === 0 || currentLevel <= 0) return '';
  let d = `M 0,80 `;
  const drawUntil = Math.min(currentLevel, nodesLength - 1);
  for (let i = 1; i <= drawUntil; i++) {
    const prevY = (i - 1) * NODE_SPACING + 80;
    const prevX = Math.sin((i - 1) * 0.8) * AMPLITUDE;
    const currY = i * NODE_SPACING + 80;
    const currX = Math.sin(i * 0.8) * AMPLITUDE;
    const cp1y = prevY + NODE_SPACING / 2;
    const cp2y = currY - NODE_SPACING / 2;
    d += `C ${prevX},${cp1y} ${currX},${cp2y} ${currX},${currY} `;
  }
  return d;
}

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
  node, state, onClose, onGo
}: {
  node: VirtualNode;
  state: NodeState;
  onClose: () => void;
  onGo: () => void;
}) {
  let kind: keyof typeof KIND_CONFIG = 'video';
  if (node.stepType === 'qa') kind = 'quiz';
  if (node.stepType === 'coding') kind = 'code';
  
  const cfg = KIND_CONFIG[kind];
  const isClickable = state !== 'locked';
  const dateStr = formatDate(node.classItem.date, node.classItem.start_time);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl candy-panel border-4 border-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        {/* Top accent bar */}

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
              <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight line-clamp-2">{node.title}</h3>
            </div>
          </div>

          {/* Meta */}
          {dateStr && (
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-white/70">
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
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20">
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
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 dark:text-white/30">
                <NodeIcons.lock size={14} /> Complete previous classes to unlock
              </span>
            )}
          </div>

          {/* Action */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors dark:text-white/60 dark:border-white/10 dark:hover:bg-white/5"
            >
              Close
            </button>
            <button
              onClick={onGo}
              disabled={!isClickable}
              className={`flex-1 py-3 rounded-full text-sm font-black text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                isClickable ? 'candy-btn-blue' : 'bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-zinc-500 shadow-none border-none'
              }`}
            >
              {state === 'completed' ? 'Review' : state === 'current' ? 'Start ▶' : 'Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Virtual Node Types ────────────────────────────────────────────────────────
interface VirtualNode {
  id: string;
  classId: string;
  stepType: 'video' | 'qa' | 'coding';
  title: string;
  isCompleted: boolean;
  classItem: ClassItem;
}

// ─── Single Node ──────────────────────────────────────────────────────────────

function MapNode({
  node, state, index, totalNodes, onClick
}: {
  node: VirtualNode;
  state: NodeState;
  index: number;
  totalNodes: number;
  onClick: () => void;
}) {

  // Map stepType to kind config
  let kind: keyof typeof KIND_CONFIG = 'video';
  if (node.stepType === 'qa') kind = 'quiz';
  if (node.stepType === 'coding') kind = 'code';
  
  const cfg = KIND_CONFIG[kind];

  const sizes = {
    completed: 'w-16 h-16 md:w-20 md:h-20',
    current:   'w-20 h-20 md:w-24 md:h-24',
    locked:    'w-14 h-14 md:w-16 md:h-16',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node button */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={onClick}
          disabled={state === 'locked'}
          className={`
            ${sizes[state]} rounded-full flex items-center justify-center
            transition-all duration-300 relative select-none
            ${state !== 'locked' ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default opacity-50'}
            ${state === 'completed' ? 'candy-btn-green' : state === 'current' ? 'candy-btn border-4' : 'bg-slate-300 border-4 border-slate-400 dark:bg-zinc-700 dark:border-zinc-800'}
          `}
        >
          {/* Pulsing ring for current */}
          {state === 'current' && (
            <span
              className="absolute -inset-2 rounded-full animate-ping opacity-30 border-4 border-[#ff71ce]"
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
        <div className="mt-2 text-center max-w-[110px] candy-panel !rounded-xl !p-2 !border-2">
          <p
            className="text-[10px] font-black uppercase tracking-wide mb-0.5"
            style={{ color: state === 'locked' ? '#555' : cfg.labelColor }}
          >
            {cfg.label}
          </p>
          <p
            className="text-[11px] font-bold leading-tight line-clamp-2 text-slate-800 dark:text-slate-200"
          >
            {node.title}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ModuleMap() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState<any>(null);
  const [virtualNodes, setVirtualNodes] = useState<VirtualNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<VirtualNode | null>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (virtualNodes.length > 0) {
      gsap.fromTo('.map-node', 
        { scale: 0, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.05 }
      );
    }
  }, { scope: mapContainer, dependencies: [virtualNodes] });

  useEffect(() => {
    if (!moduleId) return;
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    getModuleMapData(moduleId, user.id)
      .then((data: any) => {
        setModuleData(data.moduleData);
        
        const isItModule = data.moduleData?.is_it_module === 1;
        const vNodes: VirtualNode[] = [];
        
        data.classes.forEach((c: any) => {
          vNodes.push({
            id: `${c.id}-video`,
            classId: c.id,
            stepType: 'video',
            title: c.title,
            isCompleted: data.completedLessonIds.has(c.id),
            classItem: c
          });
          
          vNodes.push({
            id: `${c.id}-qa`,
            classId: c.id,
            stepType: 'qa',
            title: `Q&A: ${c.title}`,
            isCompleted: data.completedQaIds.has(c.id),
            classItem: c
          });
          
          if (isItModule) {
            vNodes.push({
              id: `${c.id}-coding`,
              classId: c.id,
              stepType: 'coding',
              title: `Coding: ${c.title}`,
              isCompleted: data.completedCodingIds.has(c.id),
              classItem: c
            });
          }
        });
        
        setVirtualNodes(vNodes);
      })
      .catch(e => { console.error(e); setError('Failed to load module.'); })
      .finally(() => setLoading(false));
  }, [moduleId, navigate]);

  const currentIdx = virtualNodes.findIndex(n => !n.isCompleted);
  const currentLevel = currentIdx === -1 ? virtualNodes.length : currentIdx;
  const completedCount = virtualNodes.filter(n => n.isCompleted).length;
  const pct = virtualNodes.length > 0 ? Math.round((completedCount / virtualNodes.length) * 100) : 0;

  const handleNodeClick = (node: VirtualNode) => setSelectedNode(node);
  const handleGo = () => {
    if (!selectedNode) return;
    const { classId, stepType } = selectedNode;
    setSelectedNode(null);
    navigate(`/student/class-flow?classId=${classId}&step=${stepType}`);
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
    <div className="min-h-screen candy-map-bg">
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-30 px-4 py-3 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-white/20 shadow-sm"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/student')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-all candy-panel !border-2 !p-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base text-slate-900 dark:text-white truncate">{moduleData?.title ?? 'Module'}</h1>
            <p className="text-slate-600 dark:text-white/60 text-[11px] font-medium">{completedCount}/{virtualNodes.length} steps · {pct}% complete</p>
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
          <div className="candy-panel p-4 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
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
      {virtualNodes.length === 0 && (
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
      {virtualNodes.length > 0 && (
        <div className="max-w-xl mx-auto px-4 pt-6 pb-32" ref={mapContainer}>
          {/* Start Banner */}
          <div
            className="text-center mb-8 py-4 rounded-2xl relative z-10"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.2)' }}
          >
            <p className="text-indigo-400/60 text-[11px] font-black uppercase tracking-widest">Quest Map · {virtualNodes.length} Levels</p>
          </div>

          {/* Map Area */}
          <div className="relative w-full mx-auto pb-32" style={{ height: `${(virtualNodes.length - 1) * NODE_SPACING + 160}px` }}>
            {/* SVG Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ left: '50%', overflow: 'visible' }}>
              <path
                d={calculatePath(virtualNodes.length)}
                fill="none"
                stroke="var(--erp-border)"
                strokeWidth="14"
                strokeDasharray="0 28"
                strokeLinecap="round"
                className="opacity-40"
              />
              <path
                d={calculateCompletedPath(virtualNodes.length, currentLevel)}
                fill="none"
                stroke="#00c77a"
                strokeWidth="14"
                strokeLinecap="round"
                className="opacity-90"
              />
            </svg>
            
            {virtualNodes.map((node, i) => {
              const x = Math.sin(i * 0.8) * AMPLITUDE;
              const y = i * NODE_SPACING + 80;
              const state = i < currentLevel ? 'completed' : i === currentLevel ? 'current' : 'locked';
              return (
                <div key={node.id} className="absolute map-node z-10" style={{ left: `calc(50% + ${x}px)`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}>
                  <MapNode
                    node={node}
                    state={state}
                    index={i}
                    totalNodes={virtualNodes.length}
                    onClick={() => handleNodeClick(node)}
                  />
                </div>
              );
            })}
          </div>

          {/* Finish banner */}
          {pct === 100 && (
            <div
              className="mt-10 text-center py-8 rounded-3xl relative z-10"
              style={{ background: 'radial-gradient(circle, rgba(0, 199, 122, 0.15), transparent)', border: '1px solid rgba(0, 199, 122, 0.3)' }}
            >
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-[#00c77a] font-black text-xl">Module Complete!</h3>
              <p className="text-white/40 text-sm mt-1">You've mastered all {virtualNodes.length} steps</p>
            </div>
          )}
        </div>
      )}

      {/* ── Popup ── */}
      {selectedNode && (
        <NodePopup
          node={selectedNode}
          state={
            virtualNodes.findIndex(n => n.id === selectedNode.id) < currentLevel ? 'completed' :
            virtualNodes.findIndex(n => n.id === selectedNode.id) === currentLevel ? 'current' : 'locked'
          }
          onClose={() => setSelectedNode(null)}
          onGo={handleGo}
        />
      )}
    </div>
  );
}
