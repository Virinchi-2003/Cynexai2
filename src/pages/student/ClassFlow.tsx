import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getClassFlowData, saveQaResponse, markClassWatched, submitOnlineAttendance } from '../../lib/api/student';
import { ArrowLeft, Play, CheckCircle, Lock, Code2, BookOpen, Clock, Star, AlertCircle, Wifi, Video, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactPlayer from 'react-player';

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

  useEffect(() => {
    if (!classId || !user) return;
    getClassFlowData(classId, user.id).then(data => {
      setClassData(data.classData);
      setQuestions(data.questions || []);
      setHasWatched(data.hasWatched);
      setHasAnswered(data.hasAnswered);
      
      const filteredQs = (data.questions || []).filter((q: Question) => 
        currentStep === 'coding' ? q.type === 'code' || q.type === 'coding' : q.type === 'mcq'
      );
      setStepQuestions(filteredQs);
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

  const isLiveClass = classData.type === 'live' || (!classData.youtube_video_id && classData.meet_link);
  const isRecordedClass = !isLiveClass;
  const livePct = Math.min(100, (liveSeconds / REQUIRED_WATCH_SECONDS) * 100);
  const liveMinLeft = Math.max(0, Math.ceil((REQUIRED_WATCH_SECONDS - liveSeconds) / 60));
  const currentQ = stepQuestions[currentQIdx];
  const parsedOptions = currentQ ? (() => { try { return JSON.parse(currentQ.options_json || '[]'); } catch { return []; } })() : [];

  // Parse AI materials from ai_script or ai_ppt_markdown
  const aiMaterials = classData.ai_script || classData.ai_ppt_markdown || null;

  return (
    <div className="min-h-full bg-background p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-foreground/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Class</p>
          <h1 className="text-xl font-bold text-foreground">{classData.title}</h1>
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

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── VIDEO STEP ── */}
        {currentStep === 'video' && (
          <>
            {/* ── RECORDED CLASS: YouTube Video ── */}
            {isRecordedClass && (
              <>
                {classData.youtube_video_id ? (
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      <ReactPlayer
                        url={`https://www.youtube.com/watch?v=${(() => {
                          try {
                            const url = (classData.youtube_video_id || '').trim();
                            if (url.length === 11 && !url.includes('/')) return url;
                            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
                            const match = url.match(regExp);
                            if (match && match[2].length === 11) return match[2];
                            try {
                              const urlObj = new URL(url);
                              const v = urlObj.searchParams.get('v');
                              if (v && v.length === 11) return v;
                            } catch(e) {}
                            return url;
                          } catch(e) {
                            return classData.youtube_video_id;
                          }
                        })()}`}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true}
                        config={{
                          youtube: {
                            playerVars: {
                              modestbranding: 1,
                              rel: 0,
                              showinfo: 0,
                              fs: 1
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="p-4 bg-surface border-t border-border flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Finished watching?</p>
                      <button
                        onClick={handleMarkVideoCompleted}
                        className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                          hasWatched ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                        disabled={hasWatched}
                      >
                        {hasWatched ? 'Completed ✓' : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-bold text-amber-800 text-lg mb-1">Video Not Available Yet</h3>
                    <p className="text-amber-700 text-sm">The recording for this class hasn't been uploaded. Please check back later or contact your instructor.</p>
                  </div>
                )}
              </>
            )}

            {/* ── LIVE CLASS: Join Flow + Attendance Timer ── */}
            {isLiveClass && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Live join area */}
            {classData.meet_link ? (
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">Live Class in Session</h3>
                <p className="text-muted-foreground text-sm mb-4">Stay on this page for 15 minutes to mark your attendance automatically.</p>
                <a
                  href={classData.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Play className="w-4 h-4 fill-white" /> Join Live Class
                </a>
              </div>
            ) : (
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">Live Class Scheduled</h3>
                <p className="text-muted-foreground text-sm">The live link will be available when the class starts.</p>
              </div>
            )}

            {/* 15-min attendance timer */}
            <div className="p-4 bg-surface">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
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
              <p className="text-xs text-muted-foreground mt-2">
                {attendanceMarked
                  ? '✅ Attendance marked! Great job attending this live class.'
                  : 'Stay on this page for 15 minutes to automatically mark attendance.'}
              </p>
            </div>
          </div>
        )}

        {/* ── External Class Notes / Document ── */}
        {classData.doc_url && (
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Class Document / Notes</h3>
                <p className="text-sm text-muted-foreground">External study materials attached by the instructor.</p>
              </div>
            </div>
            <a 
              href={classData.doc_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              Open Document
            </a>
          </div>
        )}

        {/* ── AI Materials (inline for all class types) ── */}
        {aiMaterials && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowMaterials(prev => !prev)}
              className="w-full p-5 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors"
            >
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Class Notes & Topics
              </h2>
              {showMaterials ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showMaterials && (
              <div className="px-5 pb-5 border-t border-border">
                <div className="mt-4 bg-background rounded-xl p-4 border border-border">
                  <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{aiMaterials}</pre>
                </div>
              </div>
            )}
          </div>
        )}

            {/* ── AI Summary ── */}
            {classData.ai_summary && (
              <div className="bg-surface border border-border rounded-2xl p-5 mt-6">
                <h2 className="font-bold text-foreground flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-primary" /> Class Summary</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{classData.ai_summary}</p>
              </div>
            )}
          </>
        )}

        {/* ── Q&A / CODING STEP ── */}
        {(currentStep === 'qa' || currentStep === 'coding') && (
          stepQuestions.length > 0 ? (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border bg-foreground/[0.02]">
                <h2 className="font-bold text-foreground flex items-center gap-2">
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Star className="w-8 h-8 text-white fill-white" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-1">Section Complete!</h3>
                  <p className="text-muted-foreground text-sm mb-3">You scored {score} out of {stepQuestions.length}</p>
                  <p className="text-yellow-500 font-bold">+{score * 5} coins earned! 🪙</p>
                  <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-surface border border-border rounded-xl font-bold hover:bg-foreground/5 transition-colors">
                    Return to Quest Map
                  </button>
                </div>
              ) : currentQ ? (
                <div className="p-5">
                  <p className="font-bold text-foreground text-base mb-4">{currentQIdx + 1}. {currentQ.question_text}</p>

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
                            className={`w-full text-left p-3 rounded-xl border-2 font-medium text-sm transition-all ${btnClass} hover:border-primary/50`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (currentQ.type === 'code' || currentQ.type === 'coding') ? (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Write your code answer:</span>
                      </div>
                      <textarea
                        value={codeAnswer}
                        onChange={e => setCodeAnswer(e.target.value)}
                        rows={8}
                        className="w-full bg-background border border-border rounded-xl p-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary resize-y"
                        placeholder="// Write your solution here..."
                      />
                    </div>
                  ) : null}

                  <button
                    onClick={() => handleSubmitAnswer(currentQ)}
                    disabled={submittedAnswers[currentQ.id] !== undefined}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittedAnswers[currentQ.id] !== undefined ? 'Submitted ✓' : 'Submit Answer'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-lg mt-6">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-bold text-foreground text-lg mb-1">No Questions Available</h3>
              <p className="text-muted-foreground text-sm mb-6">There are no {currentStep === 'qa' ? 'Q&A' : 'coding'} questions generated for this class yet.</p>
              <button 
                onClick={() => navigate(-1)} 
                className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md"
              >
                Return to Quest Map
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
