import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getClassFlowData, saveQaResponse, markClassWatched } from '../../lib/api/student';
import { ArrowLeft, Play, CheckCircle, Lock, Code2, BookOpen, Clock, Star, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'mcq' | 'code';
  question_text: string;
  options_json: string;
  correct_answer_idx: number;
  boilerplate_json?: string;
}

export default function ClassFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const classId = searchParams.get('classId') || '';

  const [classData, setClassData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasWatched, setHasWatched] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Q&A state
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [codeAnswer, setCodeAnswer] = useState('');
  const [qaComplete, setQaComplete] = useState(false);
  const [score, setScore] = useState(0);

  // Watch timer
  const watchStartRef = useRef<number | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const REQUIRED_WATCH_SECONDS = 5 * 60; // 5 min for dev (30 min in prod)

  useEffect(() => {
    if (!classId || !user) return;
    getClassFlowData(classId, user.id).then(data => {
      setClassData(data.classData);
      setQuestions(data.questions || []);
      setHasWatched(data.hasWatched);
      setHasAnswered(data.hasAnswered);
      setLoading(false);
    });
  }, [classId, user?.id]);

  // Watch timer logic
  useEffect(() => {
    if (hasWatched) return;
    let interval: ReturnType<typeof setInterval>;
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === 'onStateChange' && e.data.info === 1) {
        // YouTube playing
        watchStartRef.current = Date.now();
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
          setWatchedSeconds(prev => {
            const next = prev + 1;
            if (next >= REQUIRED_WATCH_SECONDS && user && !hasWatched) {
              markClassWatched(user.id, classId).then(() => setHasWatched(true));
              clearInterval(interval);
            }
            return next;
          });
        }, 1000);
      } else if (e.data?.event === 'onStateChange' && (e.data.info === 2 || e.data.info === 0)) {
        clearInterval(interval);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => { window.removeEventListener('message', handleMessage); clearInterval(interval); };
  }, [hasWatched, classId, user?.id]);

  const handleSelectAnswer = (questionId: string, idx: number) => {
    if (submittedAnswers[questionId] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: idx }));
  };

  const handleSubmitAnswer = async (q: Question) => {
    if (selectedAnswers[q.id] === undefined && q.type !== 'code') return;
    const isCorrect = q.type === 'mcq'
      ? selectedAnswers[q.id] === q.correct_answer_idx
      : true; // code answers are always "submitted"

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

    if (currentQIdx < questions.length - 1) {
      setTimeout(() => setCurrentQIdx(i => i + 1), 800);
    } else {
      setQaComplete(true);
      setHasAnswered(true);
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

  const watchPct = Math.min(100, (watchedSeconds / REQUIRED_WATCH_SECONDS) * 100);
  const currentQ = questions[currentQIdx];
  const parsedOptions = currentQ ? (() => { try { return JSON.parse(currentQ.options_json || '[]'); } catch { return []; } })() : [];

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
          {hasWatched && <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 font-bold px-3 py-1.5 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3" /> Watched</span>}
          {hasAnswered && <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1.5 rounded-full border border-blue-500/20"><Star className="w-3 h-3" /> Completed</span>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Video Section */}
        {classData.youtube_video_id ? (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${classData.youtube_video_id}?enablejsapi=1&modestbranding=1&rel=0&origin=${window.location.origin}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={classData.title}
              />
            </div>
            {!hasWatched && (
              <div className="p-4 bg-surface border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Watch Progress</span>
                  <span className="text-xs font-bold text-primary">{Math.floor(watchedSeconds / 60)}m / 5m required</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${watchPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Watch at least 5 minutes to unlock Q&A and earn coins.</p>
              </div>
            )}
          </div>
        ) : classData.meet_link ? (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Live Class</h3>
            <p className="text-muted-foreground text-sm mb-4">This is a live class. Join via Google Meet.</p>
            <a href={classData.meet_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity">
              <Play className="w-4 h-4" /> Join Live Class
            </a>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No video available for this class yet.</p>
          </div>
        )}

        {/* AI Summary */}
        {classData.ai_summary && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-primary" /> Class Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{classData.ai_summary}</p>
          </div>
        )}

        {/* Q&A Section */}
        {questions.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-foreground/[0.02]">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Post-Class Q&A
                {questions.length > 0 && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">
                    {qaComplete ? `${score}/${questions.length} correct` : `${currentQIdx + 1} of ${questions.length}`}
                  </span>
                )}
              </h2>
            </div>

            {!hasWatched && !hasAnswered ? (
              <div className="p-6 text-center">
                <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm font-medium">Watch at least 5 minutes of the class to unlock Q&A.</p>
              </div>
            ) : hasAnswered && !qaComplete ? (
              <div className="p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-foreground">You've already completed the Q&A for this class!</p>
                <p className="text-muted-foreground text-sm mt-1">+5 coins per correct answer were awarded.</p>
              </div>
            ) : qaComplete ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-1">Q&A Complete!</h3>
                <p className="text-muted-foreground text-sm mb-3">You scored {score} out of {questions.length}</p>
                <p className="text-yellow-500 font-bold">+{score * 5} coins earned! 🪙</p>
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
                ) : currentQ.type === 'code' ? (
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
        )}
      </div>
    </div>
  );
}
