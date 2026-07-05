import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/erp/Button';
import {
  Video, Mic, Share2, StopCircle, ArrowRight, ArrowLeft, Maximize2, Play,
  Code, Sparkles, Loader2, ExternalLink, Radio, Youtube, Pencil, Eraser,
  ChevronDown, BookOpen, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../lib/turso';
import { generateAIMaterials, generatePostClassSummary } from '../../lib/aiGenerator';
import ReactMarkdown from 'react-markdown';

type DrawTool = 'pen' | 'eraser';
type PanelMode = 'slides' | 'code';

interface ClassRow {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  ai_ppt_markdown: string | null;
  ai_script: string | null;
  ai_keypoints: string | null;
  youtube_video_id: string | null;
}

export default function LiveStreamDashboard() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classData, setClassData] = useState<ClassRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassPicker, setShowClassPicker] = useState(false);

  // ── Live state ───────────────────────────────────────────────────────────────
  const [isLive, setIsLive] = useState(false);
  const [ending, setEnding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);

  // ── Presentation state ───────────────────────────────────────────────────────
  const [panelMode, setPanelMode] = useState<PanelMode>('slides');
  const [slide, setSlide] = useState(1);
  const [code, setCode] = useState('# Python Class 1\n\ndef greet(name):\n    return f"Hello, {name}! Welcome to CynexAI"\n\nprint(greet("HITEC City"))');

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
    if (!client) { setLoading(false); return; }
    try {
      const res = await client.execute(
        "SELECT id, title, description, type, status, ai_ppt_markdown, ai_script, ai_keypoints, youtube_video_id FROM classes WHERE status != 'completed' ORDER BY order_index ASC LIMIT 50"
      );
      const rows = res.rows as unknown as ClassRow[];
      setClasses(rows);
      if (rows.length > 0) setClassData(rows[0]);
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setLoading(false);
    }
  };

  // ── AI Materials ─────────────────────────────────────────────────────────────
  const handleGenerateMaterials = async () => {
    if (!classData || !client) return;
    setGenerating(true);
    try {
      const { ppt, script, keypoints } = await generateAIMaterials(
        classData.title,
        classData.description || ''
      );
      await client.execute({
        sql: 'UPDATE classes SET ai_ppt_markdown = ?, ai_script = ?, ai_keypoints = ? WHERE id = ?',
        args: [ppt, script, keypoints, classData.id]
      });
      const updated = { ...classData, ai_ppt_markdown: ppt, ai_script: script, ai_keypoints: keypoints };
      setClassData(updated);
      setClasses(prev => prev.map(c => c.id === classData.id ? updated : c));
    } catch (e) {
      console.error(e);
      alert('AI generation failed. Check your OpenRouter API key in aiGenerator.ts');
    } finally {
      setGenerating(false);
    }
  };

  // ── Class Actions ────────────────────────────────────────────────────────────
  const handleStartClass = async () => {
    if (!classData || !client) return;
    // Mark as live in DB
    await client.execute({
      sql: "UPDATE classes SET type = 'live', status = 'in_progress' WHERE id = ?",
      args: [classData.id]
    });
    // Broadcast to students via localStorage (polling)
    localStorage.setItem('cynexai_live_class_id', classData.id);
    localStorage.setItem('cynexai_live_slide', '1');
    localStorage.setItem('cynexai_live_mode', 'slides');
    // Open Jitsi in separate window for screensharing - STRIP UNDERSCORES/DASHES
    const jitsiRoom = `CynexAIClass${classData.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    window.open(`https://meet.jit.si/${jitsiRoom}`, '_blank');
    setIsLive(true);
  };

  const handleEndClass = async () => {
    if (!classData || !client) return;
    setEnding(true);
    try {
      // Generate AI post-class summary
      const summary = await generatePostClassSummary(
        classData.title,
        classData.ai_keypoints || 'No keypoints generated.'
      );
      // Save everything
      await client.execute({
        sql: "UPDATE classes SET status = 'completed', ai_summary = ?, youtube_video_id = ? WHERE id = ?",
        args: [summary, ytUrl || null, classData.id]
      });
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

        {/* Class Selector */}
        <div className="p-4 border-b border-white/5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Active Class</div>
          <button
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-left transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-bold text-sm truncate">{classData.title}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showClassPicker ? 'rotate-180' : ''}`} />
          </button>

          {showClassPicker && (
            <div className="mt-2 bg-[#1a1a28] border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => { setClassData(cls); setShowClassPicker(false); setSlide(1); setIsLive(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm font-bold hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${cls.id === classData.id ? 'text-indigo-400' : 'text-slate-300'}`}
                >
                  {cls.id === classData.id && <span className="text-indigo-400 mr-2">▶</span>}
                  {cls.title}
                </button>
              ))}
            </div>
          )}
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
            <Button
              onClick={handleStartClass}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white border-green-800 font-bold"
            >
              <Play className="w-4 h-4" /> Start Live Class (Jitsi)
            </Button>
          )}

          {isLive && (
            <>
              <button
                onClick={() => window.open(`https://meet.jit.si/CynexAI-Class-${classData.id}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                <Video className="w-4 h-4" /> Rejoin Jitsi
              </button>
              <button
                onClick={() => window.open('https://studio.youtube.com/channel/UC/livestreaming', '_blank')}
                className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                <Youtube className="w-4 h-4" /> Open YouTube Studio
              </button>
              <button
                onClick={() => setShowEndModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                <StopCircle className="w-4 h-4" /> End Class & Save
              </button>
            </>
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
            <div className="absolute inset-0 bg-[#0a0a0f]">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent text-green-400 font-mono p-6 text-sm resize-none outline-none z-0"
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
