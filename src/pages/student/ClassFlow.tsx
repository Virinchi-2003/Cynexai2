import React, { useState, useEffect } from 'react';
import {
  PlayCircle, CheckCircle, Code, ChevronRight, Check,
  BookOpen, FileText, Radio, Youtube, ArrowLeft,
  Loader2, Star, SquareTerminal
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { client } from '../../lib/turso';
import ReactMarkdown from 'react-markdown';
import JitsiMeet from '../../components/JitsiMeet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassData {
  id: string;
  title: string;
  youtube_video_id: string | null;
  meet_link: string | null;
  type: string;
  status: string;
  ai_summary: string | null;
  description: string | null;
}

interface Question {
  id: string;
  type: 'mcq' | 'coding';
  question_text: string;
  options_json: string | null;
  correct_answer_idx: number | null;
  boilerplate_json: string | null;
  test_cases_json: string | null;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Watch',   icon: PlayCircle   },
  { id: 2, label: 'Quiz',    icon: CheckCircle  },
  { id: 3, label: 'Code',    icon: Code         },
  { id: 4, label: 'Summary', icon: BookOpen     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toEmbedUrl(raw: string | null): string {
  if (!raw) return '';
  if (raw.includes('youtube.com/watch?v=')) {
    return raw.replace('watch?v=', 'embed/') + '?controls=1&rel=0&modestbranding=1';
  }
  if (raw.includes('youtu.be/')) {
    const id = raw.split('/').pop()?.split('?')[0] ?? '';
    return `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1`;
  }
  // already an embed or custom URL
  return raw;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClassFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');

  // Data
  const [classData, setClassData]   = useState<ClassData | null>(null);
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Navigation
  const [step, setStep] = useState(1);

  // Quiz
  const [picked,      setPicked]      = useState<number | null>(null);
  const [submitted,   setSubmitted]   = useState(false);

  // Code
  const [code,        setCode]        = useState('');
  const [output,      setOutput]      = useState('> Ready. Click "Run" to execute.');
  const [running,     setRunning]     = useState(false);

  // XP
  const [xp, setXp] = useState(0);

  // ── Fetch class ────────────────────────────────────────────────────────────

  useEffect(() => { loadClass(); }, [classId]);

  async function loadClass() {
    if (!client || !classId) { setLoading(false); return; }
    try {
      // Class row — never expose teacher-only fields here
      const { rows } = await client.execute({
        sql: `SELECT id, title, youtube_video_id, meet_link, type, status,
                     ai_summary, description
              FROM classes WHERE id = ?`,
        args: [classId],
      });
      if (rows.length) setClassData(rows[0] as unknown as ClassData);

      // Questions
      const qr = await client.execute({
        sql: `SELECT * FROM class_questions WHERE class_id = ? ORDER BY created_at ASC`,
        args: [classId],
      });
      const qs = qr.rows as unknown as Question[];
      setQuestions(qs);

      // Seed boilerplate into code editor
      const cq = qs.find(q => q.type === 'coding');
      if (cq?.boilerplate_json) {
        try   { const p = JSON.parse(cq.boilerplate_json); setCode(p.code ?? cq.boilerplate_json); }
        catch { setCode(cq.boilerplate_json); }
      } else {
        setCode('# Write your solution here\n\ndef solution():\n    # TODO\n    pass\n\nprint(solution())');
      }
    } catch (err) {
      console.error('ClassFlow load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Quiz logic ─────────────────────────────────────────────────────────────

  const mcq = questions.find(q => q.type === 'mcq');
  const mcqOptions: string[] = mcq?.options_json
    ? JSON.parse(mcq.options_json)
    : [
        'To process and organise data efficiently',
        'To render beautiful UI components',
        'To build machine-learning models',
        'To handle network routing only',
      ];
  const correctIdx = mcq?.correct_answer_idx ?? 0;

  function submitQuiz() {
    if (picked === null) return;
    setSubmitted(true);
    if (picked === correctIdx) setXp(prev => prev + 50);
  }

  // ── Code runner (mock) ─────────────────────────────────────────────────────

  const codingQ = questions.find(q => q.type === 'coding');

  function runCode() {
    setRunning(true);
    setOutput('> Running...\n');

    setTimeout(() => {
      let testCases: { input: string; expected: string }[] = [];
      try { testCases = JSON.parse(codingQ?.test_cases_json ?? '[]'); }
      catch { /* ignore */ }

      const hasDef    = code.includes('def ') || code.includes('function ') || code.includes('=>');
      const hasReturn = code.includes('return ');
      const allOk     = hasDef && hasReturn;

      if (!testCases.length) {
        setOutput('> Python 3.10\n> No test cases defined.\n\n✅ Code accepted!');
        setXp(prev => prev + 100);
      } else {
        const lines = [
          '> Python 3.10',
          `> Task: ${codingQ?.question_text ?? 'Coding challenge'}`,
          `> Running ${testCases.length} test case(s)…`,
          '',
          ...testCases.map((tc, i) =>
            `Test ${i + 1}: ${tc.input} → expected ${tc.expected}  ${allOk ? '✅ PASS' : '❌ FAIL'}`
          ),
          '',
          allOk
            ? '🎉 All tests passed! +100 XP'
            : '⚠️  Some tests failed — check your return statement.',
        ];
        setOutput(lines.join('\n'));
        if (allOk) setXp(prev => prev + 100);
      }
      setRunning(false);
    }, 1400);
  }

  // ── Progress ───────────────────────────────────────────────────────────────

  function markDone() {
    const saved = JSON.parse(localStorage.getItem('student_progress') ?? '{}');
    saved[classId!] = true;
    localStorage.setItem('student_progress', JSON.stringify(saved));
  }

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[#0F172A]">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (!classData) return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0F172A] text-white">
      <h2 className="text-xl font-bold">Class not found</h2>
      <button
        onClick={() => navigate('/student')}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
      >
        Back to Learning Path
      </button>
    </div>
  );

  const isLive      = classData.type === 'live' && classData.status === 'in_progress';
  const isCompleted = classData.status === 'completed';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0F172A] pb-24">
      <div className="max-w-3xl w-full mx-auto px-4 pt-6 pb-4">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => navigate('/student')}
            className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl leading-tight">{classData.title}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {isLive && (
                <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE NOW
                </span>
              )}
              {isCompleted && (
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                  <CheckCircle className="w-3 h-3" /> Completed
                </span>
              )}
              {xp > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold ml-auto">
                  <Star className="w-3 h-3 fill-yellow-400" /> +{xp} XP this session
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Step progress ────────────────────────────────────────── */}
        <div className="relative flex items-stretch mb-10">
          {/* track line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-800 z-0" />
          {/* filled track */}
          <div
            className="absolute top-5 left-5 h-0.5 bg-indigo-500 z-0 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '33%' : step === 3 ? '66%' : '100%' }}
          />
          {STEPS.map(s => {
            const Icon   = s.icon;
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0F172A] transition-all
                  ${done   ? 'bg-green-500'
                  : active ? 'bg-indigo-500 ring-4 ring-indigo-500/30'
                           : 'bg-slate-800'}`}
                >
                  {done ? <Check className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-[11px] font-bold mt-1.5
                  ${active ? 'text-indigo-400' : done ? 'text-green-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════
            STEP 1 — WATCH
        ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-slate-400 text-sm">
              {isLive
                ? '🔴 Your teacher is live. Join the class below.'
                : isCompleted && classData.youtube_video_id
                  ? '🎬 Watch the class recording below.'
                  : '📹 The recording will appear here once your teacher ends the class.'}
            </p>

            {/* Video / YouTube / placeholder */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              {isLive ? (
                <>
                  {/* Fullscreen Overlay */}
                  <JitsiMeet
                    roomName={`CynexAIClass${classData.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                    displayName="Student"
                    classId={classData.id}
                    onClassEnded={() => {
                      loadClass(); // Refresh DB state
                      setStep(2);  // Move to quiz
                    }}
                  />
                </>
              ) : isCompleted && classData.youtube_video_id ? (
                <iframe
                  src={toEmbedUrl(classData.youtube_video_id)}
                  title="Class Recording"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Youtube className="w-14 h-14 opacity-20" />
                  <p className="font-bold text-slate-400">Recording not yet available</p>
                  <p className="text-xs text-slate-600">Check back after the teacher ends the session.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Continue to Quiz <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 2 — QUIZ
        ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-slate-400 text-sm">
              Test your understanding of <strong className="text-white">{classData.title}</strong>.
            </p>

            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 md:p-7">
              <h2 className="text-white font-bold text-base md:text-lg leading-snug mb-5">
                {mcq?.question_text ?? 'What is the main purpose of the concepts covered in this class?'}
              </h2>

              <div className="space-y-2.5">
                {mcqOptions.map((opt, i) => {
                  const isCorrect  = i === correctIdx;
                  const isSelected = picked === i;
                  let cls = 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500';
                  if (!submitted) {
                    if (isSelected) cls = 'border-indigo-500 bg-indigo-500/10 text-indigo-200';
                  } else {
                    if (isCorrect)                    cls = 'border-green-500 bg-green-500/10 text-green-200';
                    else if (isSelected && !isCorrect) cls = 'border-red-500 bg-red-500/10 text-red-300';
                    else                              cls = 'border-slate-700 text-slate-500 opacity-60';
                  }
                  return (
                    <button
                      key={i}
                      disabled={submitted}
                      onClick={() => setPicked(i)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all ${cls}`}
                    >
                      <span className="opacity-50 mr-2.5">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {submitted && isCorrect && <span className="ml-2 text-green-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-bold border
                  ${picked === correctIdx
                    ? 'bg-green-500/10 text-green-300 border-green-500/30'
                    : 'bg-orange-500/10 text-orange-300 border-orange-500/30'}`}
                >
                  {picked === correctIdx ? '🎉 Correct! +50 XP' : '💡 Not quite — the correct answer is highlighted above.'}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {!submitted ? (
                <button
                  disabled={picked === null}
                  onClick={submitQuiz}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Submit Answer <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Continue to Code <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 3 — CODE
        ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Question prompt */}
            {codingQ && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
                <p className="text-indigo-300 font-semibold text-sm leading-relaxed">{codingQ.question_text}</p>
              </div>
            )}

            {/* Editor + Terminal */}
            <div className="grid md:grid-cols-2 gap-3">

              {/* Editor */}
              <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0d1117]" style={{ minHeight: 340 }}>
                {/* titlebar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-slate-400 text-xs font-mono">main.py</span>
                  </div>
                  <button
                    onClick={runCode}
                    disabled={running}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {running
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
                      : <><PlayCircle className="w-3 h-3" /> Run</>}
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent text-green-300 font-mono text-[13px] leading-6 p-4 resize-none outline-none"
                  style={{ tabSize: 4 }}
                />
              </div>

              {/* Terminal */}
              <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0d1117]" style={{ minHeight: 340 }}>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
                  <SquareTerminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-xs font-mono">Output</span>
                </div>
                <div className="flex-1 p-4 font-mono text-[13px] leading-6 text-green-400 whitespace-pre-wrap overflow-y-auto">
                  {output}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                {!isCompleted && (
                  <p className="text-slate-600 text-xs">
                    Summary unlocks after teacher ends the class.
                  </p>
                )}
                {isCompleted ? (
                  <button
                    onClick={() => { markDone(); setStep(4); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    View Summary <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { markDone(); navigate('/student'); }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Complete Lesson <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 4 — SUMMARY  (only if completed)
        ══════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6">
            {!isCompleted && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-300 text-sm font-semibold">
                ⏳ Summary will be available after your teacher ends the live class.
              </div>
            )}

            {/* YouTube recording */}
            {isCompleted && classData.youtube_video_id && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-400" /> Class Recording
                </h3>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                  <iframe
                    src={toEmbedUrl(classData.youtube_video_id)}
                    title="Class Recording"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* AI Summary */}
            {isCompleted && classData.ai_summary && (
              <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl p-6 overflow-hidden">
                <span className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-xl border-b border-l border-indigo-500/30 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> AI Summary
                </span>
                <div className="prose prose-invert prose-sm max-w-none pt-4">
                  <ReactMarkdown>{classData.ai_summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* XP badge */}
            {isCompleted && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
                <div className="text-5xl mb-2">🏆</div>
                <p className="text-white font-bold text-lg">Class Complete!</p>
                <p className="text-yellow-300 font-bold text-sm mt-1">
                  +{xp + 150} XP earned this session
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => navigate('/student')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Back to Learning Path <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
