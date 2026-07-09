import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getClassForPresentation, updateClassMaterials } from '../../lib/api/teacher';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Code, ArrowLeft, ArrowRight, Pencil, Eraser, Loader2, Wand2, MousePointer2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIMaterials } from '../../lib/aiGenerator';
import { executeCode, Language } from '../../lib/compiler';

type DrawTool = 'pen' | 'eraser';

export default function PresentationView() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');

  const [slides, setSlides] = useState<string[]>([]);
  const [slide, setSlide] = useState(1);
  const [mode, setMode] = useState<'slides' | 'code'>('slides');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor State
  const [code, setCode] = useState('# Live Code Editor\n\ndef solution():\n    pass\n\nprint("Hello from CynexAI!")');
  const [language, setLanguage] = useState<Language>('python');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  // Draw vs Type
  const [isDrawMode, setIsDrawMode] = useState(false); // false = typing, true = drawing

  // Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawSize, setDrawSize] = useState(4);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (classId) fetchSlides();
  }, [classId]);

  // Sync to/from parent window (teacher dashboard / localStorage)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cynexai_live_slide' && e.newValue) setSlide(parseInt(e.newValue, 10));
      if (e.key === 'cynexai_live_mode' && e.newValue) setMode(e.newValue as 'slides' | 'code');
      if (e.key === 'cynexai_live_clear_canvas') clearCanvas();
    };
    window.addEventListener('storage', handleStorage);
    const s = localStorage.getItem('cynexai_live_slide');
    if (s) setSlide(parseInt(s, 10));
    const m = localStorage.getItem('cynexai_live_mode');
    if (m) setMode(m as 'slides' | 'code');
    const l = localStorage.getItem('cynexai_live_lang');
    if (l) setLanguage(l as Language);
    const c = localStorage.getItem('cynexai_live_code');
    if (c) setCode(c);
    const o = localStorage.getItem('cynexai_live_output');
    if (o) setOutput(o);

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchSlides = async () => {
    if (!classId) { setLoading(false); return; }
    try {
      const cls = await getClassForPresentation(classId);
      if (cls && cls.ai_ppt_markdown) {
        setSlides(cls.ai_ppt_markdown.split('---').map((s: string) => s.trim()).filter(Boolean));
        setLoading(false);
      } else if (cls) {
        setIsGenerating(true);
        const aiContent = await generateAIMaterials(cls.title as string, cls.description as string);
        await updateClassMaterials(classId, aiContent.ppt, aiContent.script, aiContent.keypoints);
        setSlides(aiContent.ppt.split('---').map(s => s.trim()).filter(Boolean));
        setIsGenerating(false);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    lastPoint.current = getCanvasPoint(e);
    setIsDrawing(true);
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !isDrawMode) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y);
    ctx.lineTo(pt.x, pt.y);
    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = drawSize * 8;
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
  }, [isDrawing, drawTool, drawColor, drawSize, isDrawMode]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.setItem('cynexai_live_clear_canvas', Date.now().toString());
  };

  const changeSlide = (n: number) => {
    const next = Math.max(1, Math.min(n, slides.length));
    setSlide(next);
    localStorage.setItem('cynexai_live_slide', next.toString());
  };

  const updateMode = (m: 'slides' | 'code') => {
    setMode(m);
    localStorage.setItem('cynexai_live_mode', m);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    localStorage.setItem('cynexai_live_code', newCode);
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setLanguage(newLang);
    localStorage.setItem('cynexai_live_lang', newLang);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    localStorage.setItem('cynexai_live_output', 'Running...');
    
    try {
      const result = await executeCode(code, language);
      setOutput(result);
      localStorage.setItem('cynexai_live_output', result);
    } catch (e: any) {
      setOutput(e.message || 'Error executing code');
      localStorage.setItem('cynexai_live_output', e.message || 'Error');
    } finally {
      setIsRunning(false);
    }
  };

  if (isGenerating) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <Wand2 className="w-12 h-12 text-purple-400 animate-pulse" />
      <h2 className="text-2xl font-display font-bold">CynexAI is generating your slides...</h2>
      <p className="text-slate-400 max-w-md text-center">Creating beautiful markdown presentations, teacher scripts, and keypoints.</p>
    </div>
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> Loading presentation...
    </div>
  );

  const currentSlide = slides[slide - 1] || '# Slide not found';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans select-none">
      {/* Minimal control bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-white/5 absolute top-0 left-0 right-0 z-30">
        <div className="flex gap-2">
          <button onClick={() => updateMode('slides')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'slides' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <BookOpen className="w-4 h-4" /> Slides
          </button>
          <button onClick={() => updateMode('code')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'code' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Code className="w-4 h-4" /> Code & Draw
          </button>
        </div>

        {mode === 'slides' && slides.length > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={() => changeSlide(slide - 1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-300 w-20 text-center font-mono">{slide} / {slides.length}</span>
            <button onClick={() => changeSlide(slide + 1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'code' && (
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
              <select 
                value={language} 
                onChange={handleLangChange}
                className="bg-slate-800 text-white text-xs font-bold rounded-lg px-2 py-1.5 border border-slate-700 outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="sqlite3">SQL</option>
              </select>
              <button 
                onClick={runCode} disabled={isRunning}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />} Run
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Type vs Draw toggle */}
              <button onClick={() => setIsDrawMode(false)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!isDrawMode ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`} title="Type Mode">
                <MousePointer2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsDrawMode(true)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDrawMode && drawTool === 'pen' ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`} title="Pen Tool">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsDrawMode(true); setDrawTool('eraser'); }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDrawMode && drawTool === 'eraser' ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`} title="Eraser Tool">
                <Eraser className="w-4 h-4" />
              </button>

              {isDrawMode && (
                <>
                  {['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ffffff'].map(c => (
                    <button key={c} onClick={() => { setDrawColor(c); setDrawTool('pen'); }}
                      className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: drawColor === c ? 'white' : 'transparent' }}
                    />
                  ))}
                  <input type="range" min={2} max={16} value={drawSize} onChange={e => setDrawSize(+e.target.value)} className="w-20 accent-indigo-500 ml-2" />
                </>
              )}
              <button onClick={clearCanvas} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 ml-2 transition-colors">Clear Drawing</button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 relative mt-14 bg-[#0A0F1C]">
        {mode === 'slides' ? (
          <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-[#0B0B1A] via-[#0F172A] to-[#0A0F1C]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1.02 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-16 shadow-2xl relative z-10"
              >
                <div className="prose prose-invert prose-2xl max-w-none 
                  prose-headings:font-display prose-headings:font-bold prose-headings:text-indigo-300
                  prose-h1:text-6xl prose-h1:mb-8 prose-h1:tracking-tight prose-h1:text-center
                  prose-h2:text-4xl prose-h2:mb-6 prose-h2:text-white
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-li:text-slate-300 prose-li:marker:text-indigo-500
                  prose-strong:text-white prose-strong:font-bold">
                  <ReactMarkdown>{currentSlide}</ReactMarkdown>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, i) => (
                <button key={i} onClick={() => changeSlide(i + 1)}
                  className={`h-2 rounded-full transition-all duration-300 ${slide === i + 1 ? 'bg-indigo-500 w-8 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/20 w-2 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col lg:flex-row">
            
            {/* Left side: Code Editor & Canvas overlay */}
            <div className="relative flex-1 bg-[#0d1117] border-r border-slate-700/50">
              <textarea
                value={code}
                onChange={handleCodeChange}
                className="absolute inset-0 w-full h-full bg-transparent text-emerald-400 font-mono p-10 text-xl resize-none outline-none custom-scrollbar"
                spellCheck={false}
                style={{ zIndex: isDrawMode ? 0 : 20 }} 
              />
              <canvas
                ref={canvasRef}
                width={3840}
                height={2160}
                className={`absolute inset-0 w-full h-full ${isDrawMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{ touchAction: 'none', cursor: drawTool === 'eraser' ? 'cell' : 'crosshair', zIndex: 10 }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
              />
            </div>
            
            {/* Right side: Execution Output */}
            <div className="w-full lg:w-1/3 bg-[#0a0a0f] flex flex-col">
              <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Output ({language})</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">{output}</pre>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
