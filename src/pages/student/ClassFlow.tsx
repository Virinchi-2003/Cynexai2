import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getClassFlowData, saveQaResponse, markClassWatched, submitOnlineAttendance } from '../../lib/api/student';
import { ArrowLeft, Play, CheckCircle, Lock, Code2, BookOpen, Clock, Star, AlertCircle, Wifi, Video, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactPlayer from 'react-player';
import { formatYoutubeUrl } from '../../lib/videoUtils';
import { PythonEditor } from '../../components/ui/erp/PythonEditor';


interface Question {
  id: string;
  type: 'mcq' | 'code';
  question_text: string;
  options_json: string;
  correct_answer_idx: number;
  boilerplate_json?: string;
}

const REQUIRED_WATCH_SECONDS = 15 * 60; // 15 minutes for live attendance

export default function ClassFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const classId = searchParams.get('classId') || '';
  const currentStep = searchParams.get('step') || 'video'; // video, qa, coding

  const [classData, setClassData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stepQuestions, setStepQuestions] = useState<Question[]>([]);
  const [hasWatched, setHasWatched] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showMaterials, setShowMaterials] = useState(true);

  // Q&A state
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [codeAnswer, setCodeAnswer] = useState('');
  const [qaComplete, setQaComplete] = useState(false);
  const [score, setScore] = useState(0);

  // Watch timer (for recorded YouTube classes)
  const watchStartRef = useRef<number | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const REQUIRED_VIDEO_SECONDS = 5 * 60; // 5 min for video completion unlock

  // Live attendance timer (15 min for live classes)
  const liveStartRef = useRef<number | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classId || !user) return;
    getClassFlowData(classId, user.id).then(data => {
      setClassData(data.classData);
      setQuestions(data.questions || []);
      setHasWatched(data.hasWatched);
      const filteredQs = (data.questions || []).filter((q: Question) => 
        currentStep === 'coding' ? q.type === 'code' || q.type === 'coding' : q.type === 'mcq'
      );
      setStepQuestions(filteredQs);
      
      // Check if all questions for THIS step are answered
      const stepAnswered = filteredQs.length > 0 && filteredQs.every((q: Question) => 
        data.answeredQuestionIds.includes(q.id)
      );
      setHasAnswered(stepAnswered);
      if (stepAnswered) {
        setQaComplete(true);
      }
      setLoading(false);
    });
  }, [classId, user?.id, currentStep]);

  // Start live attendance timer when class is live type and loaded
  useEffect(() => {
    if (!classData || !user) return;
    const isLive = classData.type === 'live' || classData.meet_link;
    if (!isLive || attendanceMarked) return;

    // Start counting when student is on the page
    liveStartRef.current = Date.now();
    liveIntervalRef.current = setInterval(() => {
      setLiveSeconds(prev => {
        const next = prev + 1;
        if (next >= REQUIRED_WATCH_SECONDS && user && !attendanceMarked) {
          // Auto-mark attendance
          submitOnlineAttendance(user.id, classId).then(result => {
            if (result.success) {
              setAttendanceMarked(true);
            }
          });
          if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [classData, user?.id, attendanceMarked]);

  // YouTube watch timer - REMOVED 5 MIN REQUIREMENT
  useEffect(() => {
    // We now use a manual "Mark as Completed" button
  }, []);

  const handleSelectAnswer = (questionId: string, idx: number) => {
    if (submittedAnswers[questionId] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: idx }));
  };

  const handleSubmitAnswer = async (q: Question) => {
    if (selectedAnswers[q.id] === undefined && q.type !== 'code') return;
    const isCorrect = q.type === 'mcq'
      ? selectedAnswers[q.id] === q.correct_answer_idx
      : true;

    setSubmittedAnswers(prev => ({ ...prev, [q.id]: isCorrect }));
    if (isCorrect) setScore(s => s + 1);

    if (user) {
      await saveQaResponse({
        studentId: user.id,
        classId,
        questionId: q.id,
        answerIdx: selectedAnswers[q.id],
        isCorrect,
        codeAnswer: q.type === 'code' ? codeAnswer : undefined
      });
    }

    if (currentQIdx < stepQuestions.length - 1) {
      setTimeout(() => setCurrentQIdx(i => i + 1), 800);
    } else {
      setQaComplete(true);
      setHasAnswered(true);
      
      // Auto-redirect from QA to Coding if coding step exists
      if (currentStep === 'qa' && questions.some((q: Question) => q.type === 'code' || q.type === 'coding')) {
        setTimeout(() => {
          navigate(`/student/class-flow?classId=${classId}&step=coding`);
        }, 1500);
      }
    }
  };

  const handleMarkVideoCompleted = async () => {
    if (!user || !classId) return;
    await markClassWatched(user.id, classId);
    setHasWatched(true);
    // Auto-redirect to QA node
    if (questions.some((q: Question) => q.type === 'mcq')) {
      navigate(`/student/class-flow?classId=${classId}&step=qa`);
    } else {
      // Return to map if no QA
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">Class not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold hover:underline flex items-center gap-1 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isLiveClass = !classData.youtube_video_id && (classData.type === 'live' || classData.meet_link);
  const isRecordedClass = !isLiveClass;
  const livePct = Math.min(100, (liveSeconds / REQUIRED_WATCH_SECONDS) * 100);
  const liveMinLeft = Math.max(0, Math.ceil((REQUIRED_WATCH_SECONDS - liveSeconds) / 60));
  const currentQ = stepQuestions[currentQIdx];
  const parsedOptions = currentQ ? (() => { try { return JSON.parse(currentQ.options_json || '[]'); } catch { return []; } })() : [];

  // Parse AI materials from ai_script or ai_ppt_markdown
  const aiMaterials = classData.ai_script || classData.ai_ppt_markdown || null;

  return (
    <div className="min-h-screen candy-map-bg p-4 md:p-8" ref={container}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-all candy-panel !border-2 !p-0 shadow-none"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs text-slate-800 dark:text-white/80 font-bold uppercase tracking-wider">Class</p>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">{classData.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Class type badge */}
          {isLiveClass ? (
            <span className="flex items-center gap-1 text-xs bg-red-500/10 text-red-500 font-bold px-3 py-1.5 rounded-full border border-red-500/20">
              <Wifi className="w-3 h-3 animate-pulse" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1.5 rounded-full border border-blue-500/20">
              <Video className="w-3 h-3" /> Recorded
            </span>
          )}
          {hasWatched && <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 font-bold px-3 py-1.5 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3" /> Watched</span>}
          {attendanceMarked && <span className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 font-bold px-3 py-1.5 rounded-full border border-purple-500/20"><CheckCircle className="w-3 h-3" /> Attendance ✓</span>}
          {hasAnswered && <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1.5 rounded-full border border-blue-500/20"><Star className="w-3 h-3" /> Completed</span>}
        </div>
      </div>

      <div className={`mx-auto ${currentStep === 'video' && classData?.ai_study_guide ? 'max-w-7xl lg:grid lg:grid-cols-3 lg:gap-8' : 'max-w-4xl space-y-6'}`}>

        {/* ── MAIN CONTENT AREA ── */}
        <div className={currentStep === 'video' && classData?.ai_study_guide ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
        {/* ── VIDEO STEP ── */}
        {currentStep === 'video' && (
          <>
            {/* ── RECORDED CLASS: YouTube Video ── */}
            {isRecordedClass && (
              <>
                {classData.youtube_video_id ? (
                  <div className="candy-panel overflow-hidden mb-6 flow-panel">
                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {(() => {
                        const rawUrl = classData.youtube_video_id || '';
                        let videoId = '';
                        const match = rawUrl.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|v=))([\w-]{11})/);
                        if (match && match[1]) {
                          videoId = match[1];
                        } else if (/^[\w-]{11}$/.test(rawUrl.trim())) {
                          videoId = rawUrl.trim();
                        }

                        if (videoId) {
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0`}
                              className="absolute inset-0 w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        } else {
                          return (
                            <div className="text-slate-400 flex flex-col items-center">
                              <AlertCircle className="w-8 h-8 mb-2" />
                              <p>Invalid YouTube URL</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    <div className="p-4 bg-slate-50/70 dark:bg-black/50 border-t border-slate-200 dark:border-white/20 flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Finished watching?</p>
                      <button
                        onClick={handleMarkVideoCompleted}
                        className={`px-6 py-2 text-sm transition-all ${
                          hasWatched ? 'bg-green-500/10 text-green-500 border border-green-500/20 font-bold rounded-xl' : 'candy-btn'
                        }`}
                        disabled={hasWatched}
                      >
                        {hasWatched ? 'Completed ✓' : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="candy-panel bg-amber-50/90 dark:bg-amber-900/40 p-6 text-center border-amber-400 flow-panel">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-black text-amber-800 dark:text-amber-400 text-lg mb-1">Video Not Available Yet</h3>
                    <p className="text-amber-700 dark:text-amber-200 text-sm font-bold">The recording for this class hasn't been uploaded. Please check back later or contact your instructor.</p>
                  </div>
                )}
              </>
            )}

            {/* ── LIVE CLASS: Join Flow + Attendance Timer ── */}
            {isLiveClass && (
          <div className="candy-panel overflow-hidden mb-6 flow-panel">
            {/* Live join area */}
            {classData.meet_link ? (
              <div className="p-6 text-center border-b border-slate-200 dark:border-white/20 bg-white/50 dark:bg-black/30">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <Wifi className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">Live Class in Session</h3>
                <p className="text-slate-600 dark:text-white/60 text-sm mb-4 font-bold">Stay on this page for 15 minutes to mark your attendance automatically.</p>
                <a
                  href={classData.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="candy-btn px-6 py-3 text-sm"
                >
                  <Play className="w-4 h-4 fill-white" /> Join Live Class
                </a>
              </div>
            ) : (
              <div className="p-6 text-center border-b border-slate-200 dark:border-white/20 bg-white/50 dark:bg-black/30">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">Live Class Scheduled</h3>
                <p className="text-slate-600 dark:text-white/60 text-sm font-bold">The live link will be available when the class starts.</p>
              </div>
            )}

            {/* 15-min attendance timer */}
            <div className="p-4 bg-slate-50/70 dark:bg-black/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-slate-700 dark:text-white/70 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Attendance Progress
                </span>
                {attendanceMarked ? (
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Marked!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-primary">
                    {liveMinLeft} min remaining
                  </span>
                )}
              </div>
              <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${attendanceMarked ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}
                  style={{ width: `${attendanceMarked ? 100 : livePct}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-white/60 font-bold mt-2">
                {attendanceMarked
                  ? '✅ Attendance marked! Great job attending this live class.'
                  : 'Stay on this page for 15 minutes to automatically mark attendance.'}
              </p>
            </div>
          </div>
        )}

        {/* ── External Class Notes / Document ── */}
        {classData.doc_url && (
          <div className="candy-panel p-5 flex items-center justify-between mb-6 flow-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Class Document / Notes</h3>
                <p className="text-sm text-slate-600 dark:text-white/60 font-bold">External study materials attached by the instructor.</p>
              </div>
            </div>
            <a 
              href={classData.doc_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="candy-btn-blue px-4 py-2"
            >
              Open Document
            </a>
          </div>
        )}

            {classData.ai_summary && (
              <div className="candy-panel p-5 mt-6 mb-6 flow-panel">
                <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-primary" /> Class Summary</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-bold">{classData.ai_summary}</p>
              </div>
            )}
          </>
        )}

        {/* ── Q&A / CODING STEP ── */}
        {(currentStep === 'qa' || currentStep === 'coding') && (
          stepQuestions.length > 0 ? (
            <div className="candy-panel overflow-hidden flow-panel">
              <div className="p-5 border-b border-slate-200 dark:border-white/20 bg-slate-50/50 dark:bg-black/30">
                <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {currentStep === 'qa' ? 'Post-Class Q&A' : 'Coding Challenge'}
                  <span className="ml-auto text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">
                    {qaComplete ? `${score}/${stepQuestions.length} correct` : `${currentQIdx + 1} of ${stepQuestions.length}`}
                  </span>
                </h2>
              </div>

              {hasAnswered && !qaComplete ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-foreground">You've already completed this section!</p>
                  <p className="text-muted-foreground text-sm mt-1">+5 coins per correct answer were awarded.</p>
                </div>
              ) : qaComplete ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-yellow-200">
                    <Star className="w-8 h-8 text-white fill-white" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xl mb-1">Section Complete!</h3>
                  <p className="text-slate-600 dark:text-white/60 text-sm mb-3 font-bold">You scored {score} out of {stepQuestions.length}</p>
                  <p className="text-yellow-500 font-black text-lg">+{score * 5} coins earned! 🪙</p>
                  <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 candy-btn-blue text-sm">
                    Return to Quest Map
                  </button>
                </div>
              ) : currentQ ? (
                <div className="p-5 bg-white/70 dark:bg-black/50">
                  <p className="font-black text-slate-900 dark:text-white text-base mb-4">{currentQIdx + 1}. {currentQ.question_text}</p>

                  {currentQ.type === 'mcq' && parsedOptions.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {parsedOptions.map((opt: string, idx: number) => {
                        const isSelected = selectedAnswers[currentQ.id] === idx;
                        const isSubmitted = submittedAnswers[currentQ.id] !== undefined;
                        const isCorrect = idx === currentQ.correct_answer_idx;
                        let btnClass = 'border-border text-foreground';
                        if (isSubmitted) {
                          if (isCorrect) btnClass = 'border-green-500 bg-green-500/10 text-green-400';
                          else if (isSelected) btnClass = 'border-red-500 bg-red-500/10 text-red-400';
                        } else if (isSelected) {
                          btnClass = 'border-primary bg-primary/10 text-primary';
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectAnswer(currentQ.id, idx)}
                            className={`w-full text-left p-3 min-h-[44px] rounded-xl border-2 font-medium text-sm transition-all ${btnClass} hover:border-primary/50`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (currentQ.type === 'code' || currentQ.type === 'coding') ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">Python Code Editor:</span>
                        </div>
                      </div>
                      <PythonEditor
                        initialCode={currentQ.boilerplate_json || "def solution():\\n    # Write your code here\\n    pass"}
                        onChange={setCodeAnswer}
                        onRunSuccess={() => {
                          // Allow submission after a successful run without exceptions
                        }}
                      />
                    </div>
                  ) : null}

                  <button
                    onClick={() => handleSubmitAnswer(currentQ)}
                    disabled={submittedAnswers[currentQ.id] !== undefined || (currentQ.type === 'code' && !codeAnswer.trim())}
                    className="w-full py-3 candy-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittedAnswers[currentQ.id] !== undefined ? 'Submitted ✓' : 'Submit Answer'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="candy-panel p-8 text-center mt-6 flow-panel">
              <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4 opacity-50" />
              <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">No Questions Available</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm mb-6 font-bold">There are no {currentStep === 'qa' ? 'Q&A' : 'coding'} questions generated for this class yet.</p>
              <button 
                onClick={() => navigate(-1)} 
                className="candy-btn-blue px-6 py-2"
              >
                Return to Quest Map
              </button>
            </div>
          )
        )}
        </div>

        {/* ── RIGHT SIDEBAR: STUDY GUIDE ── */}
        {currentStep === 'video' && classData?.ai_study_guide && (
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="candy-panel p-5 sticky top-8 flow-panel flex flex-col" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
              <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 shrink-0">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Student Study Guide
              </h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-white/50 dark:bg-black/30 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed font-bold">
                    {classData.ai_study_guide}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
