import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../../lib/auth';
import { getLastMockInterview, saveMockInterview, getStudentDashboardData, processVoiceInterview, getInitialInterviewAudio } from '../../lib/api/student';
import { Mic, Loader2, CheckCircle, Clock, Star, Play, Settings, XCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Avatar2D } from '../../components/ui/Avatar2D';
import { getGamificationSettings } from '../../lib/api/gamification';
import { spendCoins } from '../../lib/api/student';

const COOLDOWN_DAYS = 5;
const COIN_REWARD = 20;

const VOICES = [
  { id: 'aura-asteria-en', name: '🇮🇳 Priya (Indian HR Female)', desc: 'Warm & professional' },
  { id: 'aura-orion-en', name: '🇮🇳 Arjun (Indian HR Male)', desc: 'Authoritative & clear' },
  { id: 'aura-helios-en', name: '🌐 Vikram (International Male)', desc: 'MNC style' },
  { id: 'aura-angus-en', name: '🌐 Meera (International Female)', desc: 'Senior management' },
];

const SPEEDS = [
  { label: '0.75x (Slower)', value: 0.75 },
  { label: '1.0x (Normal)', value: 1.0 },
  { label: '1.25x (Fast)', value: 1.25 },
  { label: '1.5x (Very Fast)', value: 1.5 },
];

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

type Phase = 'cooldown' | 'setup' | 'interview' | 'complete';

export default function MockInterview() {
  const user = getCurrentUser();
  const [phase, setPhase] = useState<Phase>('setup');
  const [loading, setLoading] = useState(true);
  const [cooldownDaysLeft, setCooldownDaysLeft] = useState(0);
  const [coinsAvailable, setCoinsAvailable] = useState(0);
  const [interviewCost, setInterviewCost] = useState(50);
  
  // Context
  const [studentContext, setStudentContext] = useState<string>('Student in training');
  const [targetJobRole, setTargetJobRole] = useState<string>('');
  
  // Settings
  const [voice, setVoice] = useState(VOICES[0].id);
  const [speed, setSpeed] = useState(SPEEDS[1].value);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  
  // Voice AI States
  const [processingAI, setProcessingAI] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  // Conversation State
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [turnCount, setTurnCount] = useState(1);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [showChatLog, setShowChatLog] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [lastInterview, dashData, gameSettings] = await Promise.all([
        getLastMockInterview(user.id),
        getStudentDashboardData(user.id).catch(() => ({ modules: [], course: null, gamification: { streak: 0, coins: 0 }, upcomingClass: null })),
        getGamificationSettings().catch(() => [])
      ]);

      const costSetting = gameSettings.find(s => s.task_type === 'ai_interview_cost');
      const cost = costSetting ? costSetting.reward_amount : 50;
      setInterviewCost(cost);
      setCoinsAvailable(dashData?.gamification?.coins || 0);

      // Build context
      let contextStr = "Student taking a mock interview.";
      if (dashData?.modules && dashData.modules.length > 0) {
        const completedMods = dashData.modules.filter((m: any) => m.completedClasses > 0).map((m: any) => m.title);
        if (completedMods.length > 0) {
          contextStr = `Student has completed the following modules: ${completedMods.join(", ")}.`;
        } else {
          contextStr = `Student is just starting their course.`;
        }
      }
      setStudentContext(contextStr);

      setPhase('setup');
      setLoading(false);
    };
    init();
  }, [user?.id]);

  const playAudioBase64 = (base64Str: string) => {
    if (!base64Str) { setIsAvatarSpeaking(false); return; }
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
      // textToSpeech already returns full data URI — don't double-prefix
      const audioUrl = base64Str.startsWith('data:') ? base64Str : `data:audio/mp3;base64,${base64Str}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioPlayerRef.current = audio;

      // Must set speaking BEFORE play() so UI updates instantly
      setIsAvatarSpeaking(true);
      audio.onended = () => setIsAvatarSpeaking(false);
      audio.onerror = (e) => {
        console.error('Audio element error:', e);
        setIsAvatarSpeaking(false);
        setTtsAvailable(false);
      };
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Audio play() rejected:', e);
          setIsAvatarSpeaking(false);
          // Autoplay blocked - user interaction needed
          if (e.name === 'NotAllowedError') {
            console.warn('Autoplay blocked. Audio will play on next user interaction.');
          } else {
            setTtsAvailable(false);
          }
        });
      }
    } catch (e) {
      console.error('Audio error:', e);
      setIsAvatarSpeaking(false);
      setTtsAvailable(false);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const startInterview = async () => {
    if (coinsAvailable < interviewCost) {
      alert(`You need ${interviewCost} coins to start an interview.`);
      return;
    }

    if (!user) return;
    setProcessingAI(true);
    const spent = await spendCoins(user.id, interviewCost);
    if (!spent) {
      alert("Failed to deduct coins. Please try again.");
      setProcessingAI(false);
      return;
    }

    setCoinsAvailable(prev => prev - interviewCost);
    setPhase('interview');
    setChatHistory([]);
    setTurnCount(1);
    setTtsAvailable(true); // reset on new session
    
    try {
      const { aiResponse, audioBase64 } = await getInitialInterviewAudio(studentContext, voice, targetJobRole);
      setChatHistory([{ role: 'ai', content: aiResponse }]);
      playAudioBase64(audioBase64);
    } catch (err) {
      console.error("Initial audio error", err);
      // Fallback: still show the interview with text-only mode
      setChatHistory([{ role: 'ai', content: "Hello! Welcome. I'm Priya Sharma from HR. Please take a seat and tell me a bit about yourself — your background and what you've been studying recently." }]);
      setTtsAvailable(false);
    } finally {
      setProcessingAI(false);
    }
  };

  const startRecording = async () => {
    // Prevent recording while AI is speaking
    if (isAvatarSpeaking || processingAI) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
        await handleAudioSubmission(audioBlob);
      };
    }
  };

  const handleAudioSubmission = async (audioBlob: Blob) => {
    setProcessingAI(true);
    
    try {
      const { transcript, aiResponse, audioBase64 } = await processVoiceInterview(
        audioBlob, 
        chatHistory, 
        studentContext, 
        turnCount,
        voice,
        targetJobRole
      );
      
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: transcript },
        { role: 'ai', content: aiResponse }
      ];
      setChatHistory(newHistory);
      setTurnCount(prev => prev + 1);
      
      if (audioBase64) {
        playAudioBase64(audioBase64);
      }
    } catch (err: any) {
      console.error('AI Processing error:', err);
      // Show specific error if it's about audio quality
      const isAudioErr = err?.message?.includes('understand');
      const fallbackMsg = isAudioErr 
        ? 'I did not quite catch that. Could you please repeat yourself more clearly?'
        : 'I see. That is interesting. Could you elaborate a bit more on that?';
      setChatHistory(prev => [...prev, { role: 'ai', content: fallbackMsg }]);
      if (!isAudioErr) setTtsAvailable(false);
    } finally {
      setProcessingAI(false);
    }
  };

  const finishInterview = async () => {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setIsAvatarSpeaking(false);
    
    setPhase('complete');
    if (!user) return;
    
    // Calculate a rough score based on turn count (max 10 for full points)
    let score = Math.min((turnCount / 10) * 10, 10);
    if (score < 5) score = 5; // Minimum effort score

    // Give 5 coins for every interaction turn (cap at 50 to prevent abuse)
    const calculatedCoins = Math.min(turnCount * 5, 50);

    await saveMockInterview({
      studentId: user.id,
      transcript: JSON.stringify(chatHistory),
      feedback: "Completed dynamic AI interview.",
      score: score,
      coinsAwarded: calculatedCoins
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (phase === 'cooldown') {
    return (
      <div className="flex min-h-screen candy-map-bg items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6 candy-panel p-8 !border-2">
          <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-white dark:bg-black/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10">
            <Clock className="w-12 h-12 text-slate-400 dark:text-white/30" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Rest and Prepare</h2>
            <p className="text-slate-600 dark:text-white/60 font-bold">
              You recently completed a mock interview. Take some time to review your feedback and prepare.
            </p>
          </div>
          <div className="candy-panel p-6 !border-2 bg-white/50 dark:bg-black/30">
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">{cooldownDaysLeft}</div>
            <div className="text-sm text-slate-500 dark:text-white/40 uppercase tracking-wider font-black">Days until next interview</div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen candy-map-bg p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-2 candy-panel p-6 bg-white/70 dark:bg-black/50 !border-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">🇮🇳 HR Interview Simulator</h1>
            <p className="text-slate-600 dark:text-white/70 font-bold">Practice with an AI Indian HR interviewer — just like the real thing.</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-black">Powered by Groq LLaMA 3.3</span>
              <span className="text-xs bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-black">Deepgram TTS</span>
            </div>
          </div>

          <div className="candy-panel p-6 md:p-8 space-y-8 !border-2">
            {/* Economy Banner */}
            <div className="flex items-center justify-between p-4 candy-panel bg-white/50 dark:bg-black/30 !border-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-500 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Your Balance</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{coinsAvailable} Coins</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Session Cost</p>
                <p className={`text-xl font-black ${coinsAvailable >= interviewCost ? 'text-purple-600 dark:text-purple-400' : 'text-red-500'}`}>
                  -{interviewCost} Coins
                </p>
              </div>
            </div>

          <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">
                <Settings className="w-4 h-4" /> Interviewer Persona
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`candy-panel p-4 text-left transition-all !border-2 ${
                      voice === v.id 
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-900/30 dark:border-purple-400' 
                        : 'bg-white/50 dark:bg-black/30 border-slate-200 dark:border-white/10 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-black text-slate-900 dark:text-white text-sm">{v.name}</div>
                    <div className="text-xs text-slate-500 dark:text-white/50 mt-0.5 font-bold">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Speaking Speed
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SPEEDS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSpeed(s.value)}
                    className={`candy-panel p-3 text-center text-sm font-black transition-all !border-2 ${
                      speed === s.value 
                        ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' 
                        : 'bg-white/50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-cyan-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">
                Target Job Role
              </label>
              <input
                type="text"
                placeholder="e.g., Data Scientist, Frontend Developer, HR Manager..."
                value={targetJobRole}
                onChange={(e) => setTargetJobRole(e.target.value)}
                className="w-full candy-panel !border-2 px-4 py-3 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-purple-400 transition-all bg-white/50 dark:bg-black/30"
              />
              <p className="text-xs font-bold text-slate-500 dark:text-white/50">The AI will adapt its questions for this specific role based on your course progress.</p>
            </div>

            <button
              onClick={startInterview}
              disabled={coinsAvailable < interviewCost || targetJobRole.trim() === ''}
              className="w-full py-4 candy-btn-blue text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-current" /> 
              {coinsAvailable < interviewCost ? 'Not Enough Coins' : targetJobRole.trim() === '' ? 'Enter Job Role to Start' : 'Spend Coins & Enter Room'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    // Rough score calculation based on turn count (assume each turn is a point up to 10)
    let score = Math.min((turnCount / 10) * 10, 10);
    if (score < 5) score = 5;

    return (
      <div className="min-h-screen candy-map-bg p-4 flex items-center justify-center">
        <div className="max-w-xl w-full candy-panel p-8 text-center space-y-6 !border-2">
          <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-200 dark:border-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Interview Complete</h2>
            <p className="text-slate-600 dark:text-white/60 font-bold">Great job! Here is how you did.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="candy-panel p-6 bg-white/50 dark:bg-black/30 !border-2">
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-slate-900 dark:text-white mb-1">
                {score.toFixed(1)} <span className="text-lg font-bold text-slate-500 dark:text-white/40">/ 10</span>
              </div>
              <div className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">Overall Score</div>
            </div>
            <div className="candy-panel p-6 bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 !border-2">
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-yellow-600 dark:text-yellow-500 mb-1">
                +{Math.min(turnCount * 5, 50)} <Star className="w-6 h-6 fill-current" />
              </div>
              <div className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-wider">Coins Earned</div>
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="w-full py-4 candy-btn text-slate-900 dark:text-white font-bold hover:bg-white dark:bg-black transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Active Interview Phase
  return (
    <div className="h-[calc(100vh-4rem)] bg-black flex flex-col relative overflow-hidden page-container">
      {/* Background Scenery (subtle) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-2xl scale-110"
        style={{ backgroundImage: 'url(/interview-bg.png)' }}
      />
      
      {/* TTS unavailable banner */}
      {!ttsAvailable && (
        <div className="absolute top-0 left-0 w-full z-50 bg-amber-500/90 backdrop-blur-md text-black px-4 py-2 text-center text-sm font-bold shadow-lg">
          🔇 Audio unavailable — running in text-only mode. Read AI responses below.
        </div>
      )}

      {/* Top Left Header (Google Meet style but Candy) */}
      <div className="absolute top-4 left-4 z-40 candy-panel bg-white/70 dark:bg-black/50 backdrop-blur-md px-4 py-2 !border-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
          <Avatar2D isSpeaking={false} size={32} gender={voice.includes('asteria') ? 'female' : 'male'} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Mock Interview</p>
          <p className="text-xs font-bold text-slate-600 dark:text-white/60">{targetJobRole || 'General Role'}</p>
        </div>
      </div>

      {/* Self View PiP */}
      <div className="absolute bottom-28 right-4 md:right-8 z-40 w-28 h-40 md:w-48 md:h-64 candy-panel overflow-hidden !border-2 shadow-2xl flex items-center justify-center">
        {/* Simulate webcam view with a placeholder */}
        <div className="absolute inset-0 bg-slate-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center mb-2">
            <span className="text-xl">👤</span>
          </div>
          <span className="text-xs font-black">You</span>
        </div>
        {/* Small mic indicator in PiP */}
        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md backdrop-blur-sm">
          {isRecording ? <Mic className="w-3 h-3 text-red-500 animate-pulse" /> : <Mic className="w-3 h-3 text-zinc-400" />}
        </div>
      </div>

      {/* Main Avatar Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full h-full pb-32 px-4">
        <div className={`transition-all duration-500 ease-in-out ${isAvatarSpeaking ? 'scale-110 drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'scale-100'}`}>
          <Avatar2D isSpeaking={isAvatarSpeaking} size={280} gender={voice.includes('asteria') ? 'female' : 'male'} />
        </div>
        
        {/* Status Indicator (Thinking/Speaking) */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest candy-panel px-5 py-2.5 !border-2 shadow-xl bg-white/70 dark:bg-zinc-900/80">
          {processingAI ? (
            <><Loader2 className="w-4 h-4 text-purple-500 animate-spin" /><span className="text-purple-600 dark:text-purple-400">Thinking...</span></>
          ) : isAvatarSpeaking ? (
            <><div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /><span className="text-cyan-600 dark:text-cyan-400">Interviewer Speaking</span></>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Your Turn (Hold Mic to Speak)</span></>
          )}
        </div>
      </div>

      {/* Captions / Subtitles Overlay (Only show if chat log is hidden) */}
      {chatHistory.length > 0 && !showChatLog && (
        <div className="absolute bottom-28 left-0 w-full px-4 z-20 flex justify-center pointer-events-none">
          <div className="max-w-3xl w-full bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <p className="text-[10px] md:text-xs text-purple-400 font-bold uppercase tracking-widest mb-2 opacity-80">Interviewer says:</p>
            <p className="text-base md:text-xl lg:text-2xl text-white font-medium leading-relaxed tracking-wide">
              {chatHistory.filter(m => m.role === 'ai').slice(-1)[0]?.content || ''}
            </p>
          </div>
        </div>
      )}

      {/* Chat Log Drawer */}
      <div 
        className={`absolute top-0 right-0 h-[calc(100vh-8rem)] w-full md:w-96 z-50 transform transition-transform duration-300 ease-in-out candy-panel !rounded-none !border-y-0 !border-r-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl flex flex-col ${
          showChatLog ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b-2 border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" /> Interview Log
          </h3>
          <button 
            onClick={() => setShowChatLog(false)}
            className="p-2 candy-btn !min-h-[32px] rounded-xl flex items-center justify-center"
          >
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 ml-1">
                {msg.role === 'user' ? 'You' : 'Interviewer'}
              </span>
              <div className={`p-3 rounded-2xl max-w-[85%] text-sm font-bold shadow-md ${
                msg.role === 'user' 
                  ? 'bg-purple-500 text-white rounded-br-none' 
                  : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-zinc-700 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Google Meet Style Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-4 bg-zinc-900/90 backdrop-blur-2xl px-6 py-4 rounded-full border border-zinc-700/50 shadow-2xl">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAvatarSpeaking || processingAI}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all select-none group ${
              isAvatarSpeaking || processingAI
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : isRecording
                ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-95'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white active:scale-95'
            }`}
            title={isRecording ? "Click to Send" : "Click to Speak"}
          >
            {processingAI ? (
              <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin" />
            ) : (
              <Mic className={`w-6 h-6 md:w-7 md:h-7 ${isRecording ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            )}
          </button>
          
          <button
            onClick={() => setShowChatLog(!showChatLog)}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 group ${
              showChatLog ? 'bg-purple-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
            title="Toggle Chat Log"
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={finishInterview}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 group"
            title="End Interview"
          >
            <XCircle className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
