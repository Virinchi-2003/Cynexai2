import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getClassForPresentation, updateClassMaterials } from '../../lib/api/teacher';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Code, ArrowLeft, ArrowRight, Pencil, Eraser, Loader2, Wand2, MousePointer2, PlayCircle, Cast, MonitorPlay } from 'lucide-react';
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

  // Slide scaling
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideScale, setSlideScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const c = slideContainerRef.current;
      if (!c) return;
      setSlideScale(Math.min(c.clientWidth / 1600, c.clientHeight / 900) * 0.95);
    };
    updateScale();
    const t = setTimeout(updateScale, 100);
    const obs = new ResizeObserver(updateScale);
    if (slideContainerRef.current) obs.observe(slideContainerRef.current);
    window.addEventListener('resize', updateScale);
    return () => { clearTimeout(t); obs.disconnect(); window.removeEventListener('resize', updateScale); };
  }, [mode]);

  // Editor State
  const [code, setCode] = useState('# Live Code Editor\n\ndef solution():\n    pass\n\nprint("Hello from CynexAI!")');
  const [language, setLanguage] = useState<Language>('python');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  // Draw vs Type
  const [isDrawMode, setIsDrawMode] = useState(false);

  // Screen Cast
  const [isCasting, setIsCasting] = useState(false);
  const castStreamRef = useRef<MediaStream | null>(null);
  const handleCast = async () => {
    if (isCasting) {
      castStreamRef.current?.getTracks().forEach(t => t.stop());
      castStreamRef.current = null;
      setIsCasting(false);
      return;
    }
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
      castStreamRef.current = stream;
      setIsCasting(true);
      stream.getVideoTracks()[0].onended = () => { setIsCasting(false); castStreamRef.current = null; };
    } catch (e) {
      // user cancelled
    }
  };

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
        <div className="flex gap-2 items-center">
          <button onClick={() => updateMode('slides')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'slides' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <BookOpen className="w-4 h-4" /> Slides
          </button>
          <button onClick={() => updateMode('code')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'code' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Code className="w-4 h-4" /> Code & Draw
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Cast / Screen Share */}
          <button
            onClick={handleCast}
            title={isCasting ? 'Stop casting' : 'Cast / Share this screen'}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isCasting ? 'bg-green-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            {isCasting ? <><MonitorPlay className="w-4 h-4" /> Casting…</> : <><Cast className="w-4 h-4" /> Cast</>}
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
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0B0B1A] via-[#0F172A] to-[#0A0F1C]" ref={slideContainerRef}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Positioning wrapper */}
            <div style={{
              position: 'absolute',
              width: '1600px',
              height: '900px',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${slideScale})`,
              transformOrigin: 'center center',
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '1600px', height: '900px', position: 'absolute', top: 0, left: 0 }}
                  className="bg-[#f5e4dd] border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden p-8"
                >
                  {/* Retro Background Grid */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                  {/* Decorative Folders */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-0">
                    {['bg-[#f4a7a1]', 'bg-[#a3c9c4]', 'bg-[#f2c180]', 'bg-[#e77a71]', 'bg-[#a3c9c4]'].map((color, idx) => (
                      <div key={idx} className={`w-14 h-12 ${color} border-2 border-black relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                        <div className={`absolute -top-3 left-0 w-6 h-3 ${color} border-2 border-black border-b-0`} />
                      </div>
                    ))}
                  </div>

                  {/* Main Content Window */}
                  <div className="ml-28 flex-1 bg-[#f5e4dd] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative z-10 overflow-hidden">
                    <div className="h-10 border-b-4 border-black flex items-center justify-end px-4 gap-2 bg-[#f4a7a1]">
                      <div className="w-5 h-5 border-2 border-black bg-white" />
                      <div className="w-5 h-5 border-2 border-black bg-white" />
                      <div className="w-5 h-5 border-2 border-black bg-white flex items-center justify-center font-bold text-xs">X</div>
                    </div>
                    <div className="flex-1 px-14 py-10 flex flex-col justify-center items-center text-center overflow-hidden">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 style={{fontSize:'64px', fontWeight:900, textTransform:'uppercase', letterSpacing:'-2px', marginBottom:'32px', lineHeight:1.1, wordBreak:'break-word', color:'#000'}} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{fontSize:'40px', fontWeight:800, textTransform:'uppercase', marginBottom:'24px', lineHeight:1.2, wordBreak:'break-word', color:'#000'}} {...props} />,
                          p:  ({node, ...props}) => <p  style={{fontSize:'28px', fontWeight:600, marginBottom:'16px', lineHeight:1.5, wordBreak:'break-word', color:'#111', maxWidth:'1200px'}} {...props} />,
                          ul: ({node, ...props}) => <ul style={{listStyle:'none', padding:0, margin:'16px 0', width:'100%', maxWidth:'1300px'}} {...props} />,
                          li: ({node, ...props}) => (
                            <li style={{display:'flex', alignItems:'flex-start', gap:'16px', padding:'14px 20px', background:'rgba(255,255,255,0.5)', border:'2px solid #000', boxShadow:'4px 4px 0 #000', marginBottom:'12px', fontSize:'26px', fontWeight:700, wordBreak:'break-word', color:'#000'}}>
                              <span style={{width:'16px', height:'16px', minWidth:'16px', background:'#e77a71', border:'2px solid #000', display:'inline-block', marginTop:'6px'}} />
                              <span {...props} />
                            </li>
                          ),
                          img: ({node, ...props}) => <img style={{border:'4px solid #000', boxShadow:'8px 8px 0 #000', maxHeight:'300px', objectFit:'cover', margin:'0 auto 24px'}} {...props} />
                        }}
                      >{currentSlide}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, i) => (
                <button key={i} onClick={() => changeSlide(i + 1)}
                  className={`h-2 rounded-full transition-all duration-300 ${slide === i + 1 ? 'bg-[#e77a71] w-8' : 'bg-white/20 w-2 hover:bg-white/40'}`}
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
