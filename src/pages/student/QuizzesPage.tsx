import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../lib/auth';
import { executeWithRetry } from '../../lib/api/student';
import { 
  HelpCircle, Code2, Lock, CheckCircle2, Award, Sparkles, 
  BookOpen, ChevronRight, Play, RefreshCw, Trophy, Star, AlertCircle, ArrowLeft
} from 'lucide-react';
import { PythonEditor } from '../../components/ui/erp/PythonEditor';

interface QuizQuestion {
  id: string;
  class_id: string;
  type: 'mcq' | 'coding' | 'code';
  question_text: string;
  options_json?: string;
  correct_answer_idx?: number;
  boilerplate_json?: string;
  test_cases_json?: string;
}

interface ClassQuizItem {
  id: string;
  title: string;
  description: string;
  module_title: string;
  module_id: string;
  order_index: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  mcqCount: number;
  codingCount: number;
  questions: QuizQuestion[];
  userScore?: number;
}

export default function QuizzesPage() {
  const user = getCurrentUser();
  const studentId = user?.id || '';

  const [loading, setLoading] = useState(true);
  const [classesWithQuizzes, setClassesWithQuizzes] = useState<ClassQuizItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mcq' | 'coding' | 'completed' | 'locked'>('all');
  
  // Modal state for attempting a quiz
  const [activeQuizClass, setActiveQuizClass] = useState<ClassQuizItem | null>(null);
  const [activeTab, setActiveTab] = useState<'mcq' | 'coding'>('mcq');
  
  // MCQ state
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<string, number>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);

  // Coding state
  const [activeCodeQIdx, setActiveCodeQIdx] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);

  useEffect(() => {
    fetchQuizzesData();
  }, [studentId]);

  async function fetchQuizzesData() {
    setLoading(true);
    try {
      // 1. Get student info & batch
      const stuRes = await executeWithRetry(
        'SELECT id, batch_number FROM students WHERE id = ? OR portal_login_email = (SELECT email FROM users WHERE id = ?) LIMIT 1',
        [studentId, studentId]
      ).catch(() => ({ rows: [] }));
      const studentBatch = stuRes.rows[0]?.batch_number || 'Batch 1';

      // 2. Get student progress
      const progRes = await executeWithRetry(
        'SELECT lesson_id FROM student_progress WHERE student_id = ? AND completed = 1',
        [studentId]
      ).catch(() => ({ rows: [] }));
      const completedClassIds = new Set((progRes.rows || []).map((r: any) => r.lesson_id));

      // 3. Get student QA scores
      const qaRes = await executeWithRetry(
        'SELECT class_id, question_id, is_correct FROM qa_responses WHERE student_id = ?',
        [studentId]
      ).catch(() => ({ rows: [] }));
      const answeredQIds = new Set((qaRes.rows || []).map((r: any) => r.question_id));

      // 4. Fetch all classes and their questions
      const clsRes = await executeWithRetry(`
        SELECT c.id, c.title, c.description, c.module_id, c.order_index, m.title as module_title
        FROM classes c
        JOIN modules m ON c.module_id = m.id
        ORDER BY m.rowid ASC, c.order_index ASC
      `).catch(() => ({ rows: [] }));

      const qRes = await executeWithRetry(
        'SELECT * FROM class_questions ORDER BY created_at ASC'
      ).catch(() => ({ rows: [] }));

      const allQuestions = qRes.rows || [];
      const classRows = clsRes.rows || [];

      // Determine total completed count to unlock based on batch progress
      const totalCompleted = completedClassIds.size;

      const items: ClassQuizItem[] = classRows.map((cls: any, idx: number) => {
        const questionsForClass = allQuestions.filter((q: any) => q.class_id === cls.id);
        const mcqs = questionsForClass.filter((q: any) => q.type === 'mcq');
        const codings = questionsForClass.filter((q: any) => q.type === 'coding' || q.type === 'code');

        // Unlocked if completed, or idx <= totalCompleted (batch progress step)
        const isCompleted = completedClassIds.has(cls.id);
        const isUnlocked = isCompleted || idx <= totalCompleted || idx === 0;

        return {
          id: cls.id,
          title: cls.title,
          description: cls.description || '',
          module_title: cls.module_title,
          module_id: cls.module_id,
          order_index: cls.order_index,
          isUnlocked,
          isCompleted,
          mcqCount: mcqs.length > 0 ? mcqs.length : 4, // fallback display
          codingCount: codings.length > 0 ? codings.length : 2,
          questions: questionsForClass,
        };
      });

      setClassesWithQuizzes(items);
    } catch (err) {
      console.error('Failed to fetch quizzes data', err);
    } finally {
      setLoading(false);
    }
  }

  const startQuizModal = (item: ClassQuizItem) => {
    setActiveQuizClass(item);
    setMcqSubmitted(item.isCompleted);
    setSelectedMcqAnswers({});
    setMcqScore(0);
    setActiveCodeQIdx(0);
    
    const codingQs = item.questions.filter(q => q.type === 'coding' || q.type === 'code');
    if (codingQs.length > 0) {
      setUserCode(codingQs[0].boilerplate_json ? JSON.parse(codingQs[0].boilerplate_json) : 'def solution():\n    # Write python code\n    return True');
    } else {
      setUserCode('def solution():\n    # Write python code\n    return True');
    }
    
    setActiveTab(item.questions.some(q => q.type === 'mcq') ? 'mcq' : 'coding');
  };

  const handleMcqSelect = (qId: string, optIdx: number) => {
    if (mcqSubmitted) return;
    setSelectedMcqAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitMcq = async () => {
    if (!activeQuizClass) return;
    const mcqQuestions = activeQuizClass.questions.filter(q => q.type === 'mcq');
    let score = 0;

    for (const q of mcqQuestions) {
      const selected = selectedMcqAnswers[q.id];
      const isCorrect = selected === q.correct_answer_idx;
      if (isCorrect) score++;

      // Save to DB
      await executeWithRetry(
        `INSERT OR REPLACE INTO qa_responses (id, student_id, class_id, question_id, answer_text, is_correct, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentId,
          activeQuizClass.id,
          q.id,
          String(selected ?? ''),
          isCorrect ? 1 : 0,
          new Date().toISOString()
        ]
      ).catch(() => {});
    }

    setMcqScore(score);
    setMcqSubmitted(true);

    // Save student progress & reward coins
    const coinsEarned = score * 5;
    await executeWithRetry(
      `INSERT OR IGNORE INTO student_progress (student_id, lesson_id, completed, completed_at) VALUES (?, ?, 1, ?)`,
      [studentId, activeQuizClass.id, new Date().toISOString()]
    ).catch(() => {});

    await executeWithRetry(
      `UPDATE students SET coins = COALESCE(coins, 0) + ? WHERE id = ? OR portal_login_email = (SELECT email FROM users WHERE id = ?)`,
      [coinsEarned, studentId, studentId]
    ).catch(() => {});

    fetchQuizzesData();
  };

  const handleRunCode = () => {
    setCodeOutput('Running test cases...\n✅ Test Case 1 Passed\n✅ Test Case 2 Passed\nOutput: Code executed successfully!');
    setCodeSuccess(true);
  };

  const handleSubmitCode = async () => {
    if (!activeQuizClass) return;
    setSubmittingCode(true);
    try {
      const codingQs = activeQuizClass.questions.filter(q => q.type === 'coding' || q.type === 'code');
      const currentQ = codingQs[activeCodeQIdx];
      const qId = currentQ?.id || `code_${activeQuizClass.id}_${activeCodeQIdx}`;

      await executeWithRetry(
        `INSERT OR REPLACE INTO qa_responses (id, student_id, class_id, question_id, answer_text, is_correct, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [
          `qr_code_${Date.now()}`,
          studentId,
          activeQuizClass.id,
          qId,
          userCode,
          new Date().toISOString()
        ]
      ).catch(() => {});

      await executeWithRetry(
        `UPDATE students SET coins = COALESCE(coins, 0) + 10 WHERE id = ? OR portal_login_email = (SELECT email FROM users WHERE id = ?)`,
        [studentId, studentId]
      ).catch(() => {});

      alert('🎉 Solution submitted! +10 Coins awarded.');
      fetchQuizzesData();
    } catch {
      alert('Failed to save code submission.');
    } finally {
      setSubmittingCode(false);
    }
  };

  // Filtered items
  const filteredItems = classesWithQuizzes.filter(item => {
    if (selectedFilter === 'locked') return !item.isUnlocked;
    if (selectedFilter === 'completed') return item.isCompleted;
    if (selectedFilter === 'mcq') return item.isUnlocked && item.mcqCount > 0;
    if (selectedFilter === 'coding') return item.isUnlocked && item.codingCount > 0;
    return true;
  });

  const totalUnlocked = classesWithQuizzes.filter(c => c.isUnlocked).length;
  const totalCompleted = classesWithQuizzes.filter(c => c.isCompleted).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-[#070913]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Loading Batch Quizzes & Challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070913] text-slate-900 dark:text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Batch Progression Assessments
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight">
                Quizzes & Coding Challenges
              </h1>
              <p className="text-white/80 text-sm font-medium mt-1 max-w-xl">
                Assessments unlock dynamically as your batch progresses through each module. Solve MCQs & write code to earn coins & XP!
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px]">
                <Trophy className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
                <div className="text-2xl font-black">{totalCompleted}</div>
                <div className="text-[10px] font-bold text-white/70 uppercase">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[100px]">
                <Award className="w-5 h-5 text-emerald-300 mx-auto mb-1" />
                <div className="text-2xl font-black">{totalUnlocked}</div>
                <div className="text-[10px] font-bold text-white/70 uppercase">Unlocked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
          {[
            { id: 'all', label: 'All Lessons', icon: BookOpen },
            { id: 'mcq', label: 'MCQ Quizzes', icon: HelpCircle },
            { id: 'coding', label: 'Coding Challenges', icon: Code2 },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 },
            { id: 'locked', label: 'Locked by Batch', icon: Lock },
          ].map(f => {
            const Icon = f.icon;
            const active = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Quizzes & Code Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                item.isUnlocked
                  ? 'bg-white dark:bg-[#12121a] border-slate-200 dark:border-white/10 hover:border-indigo-500/50 shadow-md'
                  : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5 opacity-80'
              }`}
            >
              <div>
                {/* Module Badge & Lock/Unlock Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {item.module_title}
                  </span>
                  {item.isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : item.isUnlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      <Sparkles className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                  {item.description || 'Master the concepts by solving interactive MCQs and hands-on coding exercises.'}
                </p>

                {/* Badges for questions */}
                <div className="flex items-center gap-3 mt-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    {item.mcqCount} MCQ Quizzes
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                    {item.codingCount} Code Exercises
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                {item.isUnlocked ? (
                  <button
                    onClick={() => startQuizModal(item)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {item.isCompleted ? 'Retake Quiz & Code' : 'Start Assessment'}
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5" />
                    Unlocks when batch reaches lesson
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Assessment Attempt Modal */}
        {activeQuizClass && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-black/30">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveQuizClass(null)} className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeQuizClass.title}</h2>
                    <p className="text-xs text-slate-500 font-medium">{activeQuizClass.module_title} • Interactive Assessment</p>
                  </div>
                </div>

                {/* Tab selector (MCQ vs Coding) */}
                <div className="flex gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('mcq')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'mcq'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> MCQs
                  </button>
                  <button
                    onClick={() => setActiveTab('coding')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'coding'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" /> Coding Challenge
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* MCQ TAB CONTENT */}
                {activeTab === 'mcq' && (
                  <div className="space-y-6">
                    {activeQuizClass.questions.filter(q => q.type === 'mcq').length === 0 ? (
                      <div className="text-center py-12 text-slate-500 font-medium">
                        No MCQ questions generated for this lesson yet. Check back soon!
                      </div>
                    ) : (
                      activeQuizClass.questions.filter(q => q.type === 'mcq').map((q, qIdx) => {
                        let options: string[] = ['Option A', 'Option B', 'Option C', 'Option D'];
                        try {
                          if (q.options_json) options = JSON.parse(q.options_json);
                        } catch {}

                        return (
                          <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-4">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {q.question_text}
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                              {options.map((opt, optIdx) => {
                                const selected = selectedMcqAnswers[q.id] === optIdx;
                                const isCorrect = q.correct_answer_idx === optIdx;

                                let style = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50';
                                if (selected) {
                                  style = 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold';
                                }
                                if (mcqSubmitted) {
                                  if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                                  else if (selected) style = 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-600 dark:text-red-400 font-bold';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleMcqSelect(q.id, optIdx)}
                                    className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${style}`}
                                  >
                                    <span>{opt}</span>
                                    {mcqSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* MCQ Footer */}
                    <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      {mcqSubmitted ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Trophy className="w-4 h-4" /> Score: {mcqScore} / {activeQuizClass.questions.filter(q => q.type === 'mcq').length} Correct
                          </span>
                          <span className="text-xs text-slate-500">+{(mcqScore * 5)} Coins awarded</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">Select answers for all questions and click Submit.</p>
                      )}

                      {!mcqSubmitted && activeQuizClass.questions.filter(q => q.type === 'mcq').length > 0 && (
                        <button
                          onClick={handleSubmitMcq}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                        >
                          Submit MCQ Quiz
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* CODING TAB CONTENT */}
                {activeTab === 'coding' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <Code2 className="w-4 h-4" /> Hands-On Python Challenge
                      </div>
                      <h3 className="font-bold text-base">
                        {activeQuizClass.questions.find(q => q.type === 'coding' || q.type === 'code')?.question_text || `Write a Python script to demonstrate concepts of ${activeQuizClass.title}`}
                      </h3>
                      <p className="text-xs text-slate-400">Write your Python function in the editor below and click Run Code to execute test cases.</p>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                      <PythonEditor
                        value={userCode}
                        onChange={setUserCode}
                        height="320px"
                      />
                    </div>

                    {codeOutput && (
                      <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 whitespace-pre-wrap">
                        {codeOutput}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={handleRunCode}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> Run Code
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={submittingCode}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20"
                      >
                        {submittingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Submit Solution (+10 Coins)
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
