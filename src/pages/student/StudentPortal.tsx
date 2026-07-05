import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlayCircle, Star, Lock, Zap, Compass, Video, FileText, CheckCircle, Radio, Bell, X } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { client } from '../../lib/turso';

interface LiveBanner {
  classId: string;
  title: string;
}

export default function StudentPortal() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [liveBanner, setLiveBanner] = useState<LiveBanner | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    fetchStudentData();
    startLivePolling();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // Poll every 15 seconds for a live class signal
  const startLivePolling = () => {
    const check = async () => {
      if (!client) return;
      try {
        const res = await client.execute(
          "SELECT id, title FROM classes WHERE type = 'live' AND status = 'in_progress' LIMIT 1"
        );
        if (res.rows.length > 0) {
          const cls = res.rows[0] as any;
          setLiveBanner({ classId: cls.id as string, title: cls.title as string });
        } else {
          setLiveBanner(null);
        }
      } catch (e) {
        // silent — fallback to localStorage
        const liveId = localStorage.getItem('cynexai_live_class_id');
        if (liveId) {
          setLiveBanner({ classId: liveId, title: 'Live class in progress' });
        }
      }
    };
    check(); // immediate
    pollRef.current = window.setInterval(check, 15000);
  };

  const fetchStudentData = async () => {
    if (!client) { setLoading(false); return; }
    try {
      // Get first active course
      const courseRes = await client.execute(
        "SELECT * FROM courses ORDER BY created_at ASC LIMIT 1"
      );
      if (courseRes.rows.length === 0) { setLoading(false); return; }
      const activeCourse = courseRes.rows[0];
      setCourse(activeCourse);

      // Get modules for this course via junction table
      const modRes = await client.execute({
        sql: `SELECT m.*, cmm.order_index as map_order
              FROM modules m
              JOIN course_module_mapping cmm ON m.id = cmm.module_id
              WHERE cmm.course_id = ?
              ORDER BY cmm.order_index ASC`,
        args: [activeCourse.id]
      });

      // Get classes for all these modules
      const clsRes = await client.execute({
        sql: `SELECT id, title, type, status, order_index, module_id
              FROM classes
              WHERE module_id IN (
                SELECT module_id FROM course_module_mapping WHERE course_id = ?
              )
              ORDER BY order_index ASC`,
        args: [activeCourse.id]
      });

      const modulesData = modRes.rows.map(m => ({
        ...m,
        classes: clsRes.rows.filter(c => c.module_id === m.id)
      }));

      setModules(modulesData);

      // Load progress from localStorage
      const savedProgress = JSON.parse(localStorage.getItem('student_progress') || '{}');
      setProgress(savedProgress);

    } catch (e) {
      console.error('Failed to load student data', e);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = (classId: string) => {
    const updated = { ...progress, [classId]: true };
    setProgress(updated);
    localStorage.setItem('student_progress', JSON.stringify(updated));
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[#58CC02]">
      <div className="text-white font-bold text-xl animate-pulse">Loading your journey...</div>
    </div>
  );

  if (!course) return (
    <div className="flex h-full items-center justify-center bg-[#0F172A] text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No course assigned yet</h2>
        <p className="text-slate-400">Contact your admin to enroll you in a course.</p>
      </div>
    </div>
  );

  const totalClasses = modules.reduce((sum, m) => sum + m.classes.length, 0);
  const completedClasses = modules.reduce((sum, m) =>
    sum + m.classes.filter((c: any) => progress[c.id] || c.status === 'completed').length, 0);
  const progressPct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  // Find the next unlocked class (first not completed)
  let nextClassFound = false;

  return (
    <div className="flex-1 overflow-y-auto bg-[#58CC02] relative flex flex-col pb-32">

      {/* ── Live Class Banner ──────────────────────────────────────── */}
      {liveBanner && (
        <div className="sticky top-0 z-50 bg-red-500 shadow-lg shadow-red-500/30">
          <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              <div>
                <p className="font-bold text-white text-sm leading-tight">Live Class: {liveBanner.title}</p>
                <p className="text-red-100 text-xs">Your teacher has started — join now!</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/student/class-flow?classId=${liveBanner.classId}`)}
              className="bg-white text-red-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-red-50 transition-colors shrink-0"
            >
              Join Live
            </button>
          </div>
        </div>
      )}

      {/* ── Gamified Header ───────────────────────────────────────── */}
      <div className="w-full max-w-md mx-auto pt-6 px-6 flex justify-between items-center text-white font-bold text-xl sticky top-0 z-40 bg-[#58CC02]/95 backdrop-blur pb-4">
        <div className="flex items-center gap-1.5">
          <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          <span>{completedClasses * 10}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Compass className="w-6 h-6 fill-red-400 text-white" />
          <span>5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-6 h-6 fill-blue-400 text-blue-300" />
          <span>{Math.min(completedClasses + 1, 7)}</span>
        </div>
      </div>

      {/* ── Course Title & Progress ───────────────────────────────── */}
      <div className="w-full max-w-md mx-auto pt-2 pb-4 text-center text-white px-6">
        <h1 className="text-3xl font-display font-bold mb-1">{course.title}</h1>
        <p className="text-white/80 font-bold mb-5 text-sm">Master this skill to level up your career</p>

        {/* Progress bar */}
        <div className="relative h-10 mb-2">
          <div className="absolute top-1/2 -translate-y-1/2 left-12 right-12 h-4 bg-black/20 rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 left-12 h-4 bg-white rounded-full transition-all duration-500"
            style={{ width: `calc(${progressPct}% * (100% - 96px) / 100)` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-yellow-400 rounded-lg p-1.5 text-sm shadow-lg transition-all duration-500"
            style={{ left: `calc(48px + ${progressPct}% * (100% - 96px) / 100)` }}
          >🚀</div>
        </div>
        <div className="flex justify-between items-center px-2 text-white/80 text-sm font-bold">
          <span>Progress</span>
          <span>{completedClasses}/{totalClasses} classes</span>
        </div>
      </div>

      {/* ── Learning Path ─────────────────────────────────────────── */}
      <div className="w-full max-w-md mx-auto relative flex-1 flex flex-col items-center px-4">
        {/* Winding SVG path */}
        <svg className="absolute top-0 left-0 w-full h-[150%] z-0 opacity-30 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 1000">
          <path d="M50 0 C 90 100, 10 200, 50 300 C 90 400, 10 500, 50 600 C 90 700, 10 800, 50 900 L50 1000" fill="none" stroke="#46A302" strokeWidth="12" strokeLinecap="round" />
        </svg>

        <div className="relative z-10 w-full flex flex-col gap-6 pb-32">
          {modules.map((mod, modIdx) => (
            <div key={mod.id} className="mb-6">
              {/* Module Header */}
              <div className="bg-black/20 text-white rounded-2xl p-4 mb-6 text-center backdrop-blur-sm border border-white/10">
                <h3 className="font-bold text-lg">{mod.title}</h3>
                <p className="text-white/70 text-xs mt-1">
                  {mod.classes.filter((c: any) => progress[c.id] || c.status === 'completed').length}/{mod.classes.length} complete
                </p>
              </div>

              <div className="flex flex-col gap-10">
                {mod.classes.map((cls: any, clsIdx: number) => {
                  const isDone = progress[cls.id] || cls.status === 'completed';
                  const isLiveClass = cls.type === 'live' && cls.status === 'in_progress';
                  const isNext = !nextClassFound && !isDone;
                  if (isNext) nextClassFound = true;

                  // Zigzag alignment
                  const pos = clsIdx % 4;
                  const align = pos === 0 ? 'items-start pl-6' : pos === 2 ? 'items-end pr-6' : 'items-center';

                  return (
                    <div key={cls.id} className={`flex flex-col w-full relative ${align}`}>

                      {/* "Start Here" bubble */}
                      {isNext && (
                        <div className="absolute -top-10 animate-bounce bg-white text-slate-800 font-bold px-4 py-2 rounded-xl shadow-xl border-b-4 border-slate-200 z-20 text-sm whitespace-nowrap">
                          {isLiveClass ? '🔴 Live Now!' : 'Start Here!'}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-200" />
                        </div>
                      )}

                      {/* Live pulse ring */}
                      {isLiveClass && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-400/40 z-0 w-24 h-24" />
                      )}

                      <div
                        className={`rounded-full border-b-[6px] flex items-center justify-center cursor-pointer hover:scale-105 active:border-b-0 active:translate-y-1 transition-all relative z-10
                          ${isDone
                            ? 'w-20 h-20 bg-green-400 border-green-600'
                            : isLiveClass
                              ? 'w-24 h-24 bg-red-500 border-red-700 shadow-[0_0_0_8px_rgba(239,68,68,0.2)] ring-8 ring-red-500/30 border-b-[8px]'
                              : isNext
                                ? 'w-24 h-24 bg-yellow-400 border-yellow-600 shadow-[0_0_0_8px_rgba(255,255,255,0.2)] ring-8 ring-yellow-400/50 border-b-[8px]'
                                : 'w-20 h-20 bg-white/30 border-white/20 opacity-80'
                          }`}
                        onClick={() => {
                          if (isNext || isDone || isLiveClass) {
                            navigate(`/student/class-flow?classId=${cls.id}`);
                          }
                        }}
                      >
                        <div className={`rounded-full flex items-center justify-center shadow-inner
                          ${isDone ? 'w-16 h-16 bg-green-300' : isLiveClass ? 'w-20 h-20 bg-red-400' : isNext ? 'w-20 h-20 bg-yellow-300' : 'w-16 h-16 bg-white/20'}`}
                        >
                          {isDone ? (
                            <CheckCircle className="w-8 h-8 text-green-700" fill="currentColor" />
                          ) : isLiveClass ? (
                            <Radio className="w-10 h-10 text-white animate-pulse" />
                          ) : isNext ? (
                            <PlayCircle className="w-10 h-10 text-yellow-700" fill="currentColor" />
                          ) : cls.type === 'video' ? (
                            <Video className="w-6 h-6 text-white/60" />
                          ) : (
                            <Lock className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                      </div>

                      <span className="text-white font-bold mt-3 text-center text-xs leading-tight drop-shadow-md bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-sm max-w-[110px]">
                        {cls.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Completion Trophy */}
          {progressPct === 100 && (
            <div className="text-center py-8 bg-black/20 rounded-3xl border border-white/10 backdrop-blur">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">Course Complete!</h2>
              <p className="text-white/80 text-sm">You've mastered {course.title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
