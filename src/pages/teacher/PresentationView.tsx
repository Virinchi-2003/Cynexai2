import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { client } from '../../lib/turso';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Code, ArrowLeft, ArrowRight, Pencil, Eraser } from 'lucide-react';

type DrawTool = 'pen' | 'eraser';

export default function PresentationView() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');

  const [slides, setSlides] = useState<string[]>([]);
  const [slide, setSlide] = useState(1);
  const [mode, setMode] = useState<'slides' | 'code'>('slides');
  const [code, setCode] = useState('# Live Code Editor\n\ndef solution():\n    pass\n\nprint(solution())');
  const [loading, setLoading] = useState(true);

  // Drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawSize, setDrawSize] = useState(4);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (classId) fetchSlides();
  }, [classId]);

  // Sync from parent window (teacher dashboard)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cynexai_live_slide' && e.newValue) {
        setSlide(parseInt(e.newValue, 10));
      }
      if (e.key === 'cynexai_live_mode' && e.newValue) {
        setMode(e.newValue as 'slides' | 'code');
      }
      if (e.key === 'cynexai_live_clear_canvas') {
        clearCanvas();
      }
    };
    window.addEventListener('storage', handleStorage);
    // Initial read
    const s = localStorage.getItem('cynexai_live_slide');
    if (s) setSlide(parseInt(s, 10));
    const m = localStorage.getItem('cynexai_live_mode');
    if (m) setMode(m as 'slides' | 'code');
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchSlides = async () => {
    if (!client) { setLoading(false); return; }
    try {
      const res = await client.execute({
        sql: 'SELECT ai_ppt_markdown FROM classes WHERE id = ?',
        args: [classId!]
      });
      if (res.rows.length > 0 && res.rows[0].ai_ppt_markdown) {
        const raw = res.rows[0].ai_ppt_markdown as string;
        setSlides(raw.split('---').map(s => s.trim()).filter(Boolean));
      }
    } catch (e) {
      console.error(e);
    } finally {
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
    lastPoint.current = getCanvasPoint(e);
    setIsDrawing(true);
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
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
  }, [isDrawing, drawTool, drawColor, drawSize]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const changeSlide = (n: number) => {
    const next = Math.max(1, Math.min(n, slides.length));
    setSlide(next);
    localStorage.setItem('cynexai_live_slide', next.toString());
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
      Loading presentation...
    </div>
  );

  const currentSlide = slides[slide - 1] || '# Slide not found';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans select-none">

      {/* Minimal control bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-white/5 absolute top-0 left-0 right-0 z-30">
        <div className="flex gap-2">
          <button onClick={() => setMode('slides')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'slides' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <BookOpen className="w-4 h-4" /> Slides
          </button>
          <button onClick={() => setMode('code')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Code className="w-4 h-4" /> Code & Draw
          </button>
        </div>

        {mode === 'slides' && slides.length > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={() => changeSlide(slide - 1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-300 w-20 text-center">{slide} / {slides.length}</span>
            <button onClick={() => changeSlide(slide + 1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'code' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawTool('pen')} className={`w-8 h-8 rounded-lg flex items-center justify-center ${drawTool === 'pen' ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`}>
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setDrawTool('eraser')} className={`w-8 h-8 rounded-lg flex items-center justify-center ${drawTool === 'eraser' ? 'bg-indigo-600' : 'bg-white/10 hover:bg-white/20'}`}>
              <Eraser className="w-4 h-4" />
            </button>
            {['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ffffff'].map(c => (
              <button key={c} onClick={() => { setDrawColor(c); setDrawTool('pen'); }}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: drawColor === c ? 'white' : 'transparent' }}
              />
            ))}
            <input type="range" min={2} max={16} value={drawSize} onChange={e => setDrawSize(+e.target.value)} className="w-20 accent-indigo-500" />
            <button onClick={clearCanvas} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20">Clear</button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 relative mt-14">
        {mode === 'slides' ? (
          <div className="absolute inset-0 flex items-center justify-center p-16 bg-gradient-to-br from-[#0d0d2e] via-[#0f0f1f] to-[#0a0a0f]">
            <div className="prose prose-invert prose-2xl max-w-5xl w-full text-center">
              <ReactMarkdown>{currentSlide}</ReactMarkdown>
            </div>
            {/* Slide dots */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => changeSlide(i + 1)}
                  className={`h-2 rounded-full transition-all ${slide === i + 1 ? 'bg-indigo-400 w-8' : 'bg-white/20 w-2 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#0a0a0f]">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-transparent text-green-400 font-mono p-10 text-xl resize-none outline-none z-0"
              spellCheck={false}
            />
            <canvas
              ref={canvasRef}
              width={3840}
              height={2160}
              className="absolute inset-0 z-10 w-full h-full"
              style={{ touchAction: 'none', cursor: drawTool === 'eraser' ? 'cell' : 'crosshair' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
