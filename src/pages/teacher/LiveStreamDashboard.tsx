import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/erp/Button';
import {
  Video, Mic, Share2, StopCircle, ArrowRight, ArrowLeft, Maximize2, Play,
  Code, Sparkles, Loader2, ExternalLink, Radio, Youtube, Pencil, Eraser,
  ChevronDown, BookOpen, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { generateAIMaterials, generatePostClassSummary } from '../../lib/aiGenerator';
import { executeCode, Language } from '../../lib/compiler';
import ReactMarkdown from 'react-markdown';
import { getInstructorClasses, updateClassMaterials, updateClassStatus, completeClassWithSummary, ClassRow } from '../../lib/api/teacher';

type DrawTool = 'pen' | 'eraser';
type PanelMode = 'slides' | 'code';

const parseTimeString = (timingStr: string) => {
  const [startStr, endStr] = timingStr.toLowerCase().split('-');
  if (!startStr || !endStr) return { start: 0, end: 0 };
  const isPm = endStr.includes('pm');
  const parsePart = (part: string) => {
    let raw = part.replace(/[a-z]/g, '');
    let [h, m] = raw.split(':');
    let hr = parseInt(h);
    let min = m ? parseInt(m) : 0;
    let isThisPm = isPm;
    if (part.includes('am')) isThisPm = false;
    if (part.includes('pm')) isThisPm = true;
    if (hr === 12 && !isThisPm) hr = 0;
    if (hr < 12 && isThisPm) hr += 12;
    return hr + min / 60;
  };
  return { start: parsePart(startStr), end: parsePart(endStr) };
};

export default function LiveStreamDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const classTimeParam = searchParams.get('time');
  const classDayParam = searchParams.get('day');
  const user = getCurrentUser();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [classData, setClassData] = useState<ClassRow | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Live state ───────────────────────────────────────────────────────────────
  const [isLive, setIsLive] = useState(false);
  const [ending, setEnding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);

  // ── Presentation state ───────────────────────────────────────────────────────
  const [panelMode, setPanelMode] = useState<PanelMode>('slides');
  const [slide, setSlide] = useState(1);
  const [code, setCode] = useState('# Code Editor\n\ndef demo():\n    print("Hello from CynexAI Studio!")\ndemo()');
  const [language, setLanguage] = useState<Language>('python');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // ── Drawing state ────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawSize, setDrawSize] = useState(3);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const classes = await getInstructorClasses(user.id, classIdParam || undefined);
      if (classes.length > 0) setClassData(classes[0]);
    } catch (e) {
      console.error('Failed to load class', e);
    } finally {
      setLoading(false);
    }
  };

  // ── AI Materials ─────────────────────────────────────────────────────────────
  const handleGenerateMaterials = async () => {
    if (!classData) return;
    setGenerating(true);
    try {
      const { ppt, script, keypoints } = await generateAIMaterials(
        classData.title,
        classData.description || ''
      );
      await updateClassMaterials(classData.id, ppt, script, keypoints);
      const updated = { ...classData, ai_ppt_markdown: ppt, ai_script: script, ai_keypoints: keypoints };
      setClassData(updated);
    } catch (e) {
      console.error(e);
      alert('AI generation failed. Check your OpenRouter API key in aiGenerator.ts');
    } finally {
      setGenerating(false);
    }
  };

  // ── Class Actions ────────────────────────────────────────────────────────────
  const handleStartClass = async () => {
    if (!classData) return;
    // Mark as live in DB
    await updateClassStatus(classData.id, 'in_progress', 'live');
    // Broadcast to students via localStorage (polling)
    localStorage.setItem('cynexai_live_class_id', classData.id);
    localStorage.setItem('cynexai_live_slide', '1');
    localStorage.setItem('cynexai_live_mode', 'slides');
    setIsLive(true);
  };

  const handleEndClass = async () => {
    if (!classData) return;
    setEnding(true);
    try {
      // Generate AI post-class summary
      const summary = await generatePostClassSummary(
        classData.title,
        classData.ai_keypoints || 'No keypoints generated.'
      );
      // Save everything
      await completeClassWithSummary(classData.id, summary, ytUrl || null);
      // Clear live signal
      localStorage.removeItem('cynexai_live_class_id');
      setIsLive(false);
      setShowEndModal(false);
      alert('Class ended! AI summary generated. Students can now view the recording and summary.');
      navigate('/teacher');
    } catch (e) {
      console.error(e);
      alert('Failed to end class. Please try again.');
    } finally {
      setEnding(false);
    }
  };

  // ── Slide Navigation ─────────────────────────────────────────────────────────
  const changeSlide = (n: number) => {
    setSlide(n);
    localStorage.setItem('cynexai_live_slide', n.toString());
  };

  const changePanelMode = (m: PanelMode) => {
    setPanelMode(m);
    localStorage.setItem('cynexai_live_mode', m);
  };

  const runCode = async () => {
    setIsExecuting(true);
    setOutput('Running code...');
    const result = await executeCode(code, language);
    setOutput(result);
    localStorage.setItem('cynexai_live_output', result);
    setIsExecuting(false);
  };

  useEffect(() => {
    localStorage.setItem('cynexai_live_code', code);
    localStorage.setItem('cynexai_live_lang', language);
  }, [code, language]);

  const openPopOut = () => {
    window.open(`/teacher/presentation-view?classId=${classData?.id}`, '_blank', 'width=1280,height=800,toolbar=no,menubar=no');
  };

  // ── Drawing ──────────────────────────────────────────────────────────────────
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    lastPoint.current = pt;
    setIsDrawing(true);
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y);
    ctx.lineTo(pt.x, pt.y);
    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = drawSize * 6;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    lastPoint.current = pt;
  }, [isDrawing, drawTool, drawColor, drawSize]);

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.setItem('cynexai_live_clear_canvas', Date.now().toString());
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const hasAI = !!classData?.ai_ppt_markdown;
  const slides = hasAI
    ? (classData!.ai_ppt_markdown as string).split('---').map(s => s.trim()).filter(Boolean)
    : [];
  const currentSlide = slides[slide - 1] || '# No slides yet';
  const keypoints = (classData?.ai_keypoints || '').split('\n').filter(Boolean);

  // ── Preparation Window Logic ──────────────────────────────────────────────────
  let canStartClass = true;
  let preparationMessage = '';

  if (classTimeParam && classDayParam && !isLive) {
    const today = new Date();
    let currentDay = today.getDay(); // 0 = Sun, 1 = Mon
    if (currentDay === 0) currentDay = 7; // Map Sun to 7

    if (parseInt(classDayParam) !== currentDay) {
      canStartClass = false;
      preparationMessage = 'This class is not scheduled for today. You are in preparation mode.';
    } else {
      const { start, end } = parseTimeString(classTimeParam);
      const currentHour = today.getHours() + today.getMinutes() / 60;
      
      if (currentHour < start - 0.25) { // 15 mins before
        canStartClass = false;
        preparationMessage = `Preparation Mode. Class starts at ${classTimeParam}. "Start Class" unlocks 15 mins before.`;
      } else if (currentHour > end) {
        canStartClass = false;
        preparationMessage = 'This class time has passed.';
      }
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      <span className="font-bold text-lg">Loading class environment...</span>
    </div>
  );

  if (!classData) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white flex-col gap-4">
      <AlertCircle className="w-12 h-12 text-yellow-400" />
      <h2 className="text-2xl font-bold">No classes available</h2>
      <p className="text-slate-400">Create classes in the Course CMS first.</p>
      <Button onClick={() => navigate('/teacher/cms')}>Open Course CMS</Button>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-white overflow-hidden font-sans">

      {/* ── Left Sidebar ─────────────────────────────────────────── */}
      <div className="hidden md:flex w-72 bg-[#111118] border-r border-white/5 flex-col shrink-0">

        {/* Class Info */}
        <div className="p-5 border-b border-white/5">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">{classData.module_title || 'Active Class'}</div>
          <div className="w-full flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-3 h-3 rounded-full shrink-0 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-bold text-base text-white truncate">{classData.title}</span>
            </div>
          </div>
        </div>

        {/* Live Viewer Count */}
        {isLive && (
          <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <div>
              <p className="text-red-400 font-bold text-sm">LIVE NOW</p>
              <p className="text-xs text-slate-400">Students can join the session</p>
            </div>
          </div>
        )}

        {/* Keypoints Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> AI Teaching Points
          </h3>
          {keypoints.length === 0 ? (
            <p className="text-slate-600 text-xs">Generate AI materials to see keypoints here.</p>
          ) : (
            <ul className="space-y-3">
              {keypoints.map((kp, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <ArrowRight className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                  <ReactMarkdown>{kp.replace(/^[-•*]\s*/, '')}</ReactMarkdown>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {!hasAI && (
            <Button
              onClick={handleGenerateMaterials}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white border-violet-800 font-bold"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating AI Materials...' : 'Generate AI Materials'}
            </Button>
          )}

          {hasAI && !isLive && (
            <div className="w-full flex flex-col gap-2">
              <Button
                onClick={handleStartClass}
                disabled={!canStartClass}
                className={`w-full flex items-center justify-center gap-2 font-bold ${
                  canStartClass 
                    ? 'bg-green-600 hover:bg-green-500 text-white border-green-800' 
                    : 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4" /> Start Live Class (Jitsi)
              </Button>
              {!canStartClass && preparationMessage && (
                <p className="text-[10px] text-center text-slate-400 leading-tight px-2">
                  {preparationMessage}
                </p>
              )}
            </div>
          )}

          {isLive && (
            <div className="flex flex-col gap-2">
              <div className="bg-black border border-white/10 rounded-xl overflow-hidden h-48 w-full relative">
                <iframe
                  src={`https://meet.jit.si/CynexAIClass${classData.id.replace(/[^a-zA-Z0-9]/g, '')}#config.prejoinPageEnabled=false&interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR=true`}
                  allow="camera; microphone; fullscreen; display-capture"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              <button
                onClick={() => setShowEndModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                <StopCircle className="w-4 h-4" /> End Class & Save
              </button>
            </div>
          )}

          {hasAI && !isLive && (
            <button
              onClick={handleGenerateMaterials}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 text-violet-400 hover:text-violet-300 font-bold text-xs py-2 transition-colors"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Regenerate AI Materials
            </button>
          )}
        </div>
      </div>

      {/* ── Main Stage ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top toolbar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/5">
          <div className="flex gap-1 bg-black/30 rounded-lg p-1">
            <button
              onClick={() => changePanelMode('slides')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${panelMode === 'slides' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> AI Slides
            </button>
            <button
              onClick={() => changePanelMode('code')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${panelMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Code className="w-3.5 h-3.5" /> Code & Draw
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Slide navigation */}
            {panelMode === 'slides' && hasAI && (
              <div className="flex items-center gap-2">
                <button onClick={() => changeSlide(Math.max(1, slide - 1))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-400 w-16 text-center">
                  {slide} / {Math.max(1, slides.length)}
                </span>
                <button onClick={() => changeSlide(Math.min(slides.length, slide + 1))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Drawing tools */}
            {panelMode === 'code' && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDrawTool('pen')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${drawTool === 'pen' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDrawTool('eraser')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${drawTool === 'eraser' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}><Eraser className="w-3.5 h-3.5" /></button>
                {['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#ffffff'].map(c => (
                  <button key={c} onClick={() => { setDrawColor(c); setDrawTool('pen'); }} className="w-5 h-5 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: drawColor === c ? 'white' : 'transparent' }} />
                ))}
                <input type="range" min={1} max={12} value={drawSize} onChange={e => setDrawSize(+e.target.value)} className="w-16 accent-indigo-500" />
                <button onClick={clearCanvas} className="text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Clear</button>
              </div>
            )}

            <button onClick={openPopOut} className="flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              <Maximize2 className="w-3.5 h-3.5" /> Pop-Out Screen
            </button>
          </div>
        </div>

        {/* Slide / Code Stage */}
        <div className="flex-1 relative overflow-hidden">
          {!hasAI ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d18] text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No AI materials yet</h2>
              <p className="text-slate-400 mb-8 max-w-md">Click "Generate AI Materials" to auto-create your presentation slides, teaching keypoints, and a teleprompter script for <strong className="text-white">{classData.title}</strong>.</p>
              <Button onClick={handleGenerateMaterials} disabled={generating} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 border-violet-800 text-white px-8 py-3 text-base font-bold">
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generating ? 'Generating...' : 'Generate AI Materials'}
              </Button>
            </div>
          ) : panelMode === 'slides' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d0d2e] via-[#0f0f1f] to-[#0d0d18] p-12">
              <div className="prose prose-invert prose-lg md:prose-xl max-w-4xl w-full text-center">
                <ReactMarkdown>{currentSlide}</ReactMarkdown>
              </div>
              {/* Slide progress dots */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => changeSlide(i + 1)}
                    className={`w-2 h-2 rounded-full transition-all ${slide === i + 1 ? 'bg-indigo-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col">
              <div className="flex-1 relative border-b border-white/5 flex">
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="flex-1 bg-transparent text-green-400 font-mono p-6 text-sm resize-none outline-none z-0"
                  spellCheck={false}
                  placeholder="// Write code here — students see this in real-time"
                />
                <canvas
                  ref={canvasRef}
                  width={2560}
                  height={1440}
                  className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none"
                  style={{ touchAction: 'none', cursor: drawTool === 'eraser' ? 'cell' : 'crosshair' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="shrink-0 h-40 bg-[#0d0d14] relative z-20 flex flex-col border-t border-white/5">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#11111a]">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                    className="bg-black/50 text-slate-300 text-xs font-bold px-3 py-1.5 rounded outline-none border border-white/10"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="sqlite3">SQL</option>
                  </select>
                  <Button
                    onClick={runCode}
                    disabled={isExecuting}
                    className="h-8 px-4 text-xs font-bold bg-green-600 hover:bg-green-500 text-white"
                  >
                    {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                    {isExecuting ? 'Running...' : 'Run Code'}
                  </Button>
                </div>
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
                  {output ? (
                    <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <span className="text-slate-600 italic">Terminal output will appear here...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teleprompter Script strip at bottom */}
        {hasAI && classData.ai_script && (
          <div className="shrink-0 h-24 bg-[#111118] border-t border-white/5 overflow-y-auto p-3 relative">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 sticky top-0">Teleprompter Script</div>
            <div className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap pr-2">
              {classData.ai_script}
            </div>
          </div>
        )}
      </div>

      {/* ── End Class Modal ───────────────────────────────────────── */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a28] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">End Class</h2>
            </div>
            <p className="text-slate-400 text-sm mb-5">
              Paste the YouTube recording URL so students can replay this class later. An AI summary will be auto-generated.
            </p>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">YouTube Recording URL (optional)</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleEndClass} disabled={ending} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {ending ? 'Saving...' : 'End & Generate Summary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
