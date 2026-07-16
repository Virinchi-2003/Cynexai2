import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../../lib/auth';
import { getLastMockInterview, saveMockInterview, getStudentDashboardData, processVoiceInterview, getInitialInterviewAudio } from '../../lib/api/student';
import { Mic, Loader2, CheckCircle, Clock, Star, Play, Settings, XCircle } from 'lucide-react';
import { Avatar2D } from '../../components/ui/Avatar2D';

const COOLDOWN_DAYS = 5;
const COIN_REWARD = 20;

const VOICES = [
  { id: 'aura-asteria-en', name: 'US Female (Asteria)' },
  { id: 'aura-orion-en', name: 'US Male (Orion)' },
  { id: 'aura-helios-en', name: 'UK Male (Helios)' },
  { id: 'aura-angus-en', name: 'Irish Male (Angus)' },
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
  
  // Context
  const [studentContext, setStudentContext] = useState<string>('Student in training');
  
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [lastInterview, dashData] = await Promise.all([
        getLastMockInterview(user.id),
        getStudentDashboardData(user.id).catch(() => ({ modules: [], course: null, gamification: { streak: 0, coins: 0 }, upcomingClass: null }))
      ]);

      if (lastInterview) {
        const daysSince = daysBetween(new Date(lastInterview.created_at), new Date());
        if (daysSince < COOLDOWN_DAYS) {
          setCooldownDaysLeft(COOLDOWN_DAYS - daysSince);
          setPhase('cooldown');
          setLoading(false);
          return;
        }
      }

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
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audioUrl = `data:audio/mp3;base64,${base64Str}`;
    const audio = new Audio(audioUrl);
    audio.playbackRate = speed;
    audioPlayerRef.current = audio;

    audio.onplay = () => setIsAvatarSpeaking(true);
    audio.onended = () => setIsAvatarSpeaking(false);
    audio.onerror = () => setIsAvatarSpeaking(false);
    
    audio.play().catch(e => console.error("Audio play error", e));
  };

  const startInterview = async () => {
    setPhase('interview');
    setChatHistory([]);
    setTurnCount(1);
    setProcessingAI(true);
    
    try {
      const { aiResponse, audioBase64 } = await getInitialInterviewAudio(studentContext, voice);
      setChatHistory([{ role: 'ai', content: aiResponse }]);
      playAudioBase64(audioBase64);
    } catch (err) {
      console.error("Initial audio error", err);
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
        voice
      );
      
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: transcript },
        { role: 'ai', content: aiResponse }
      ];
      setChatHistory(newHistory);
      setTurnCount(prev => prev + 1);
      
      playAudioBase64(audioBase64);
    } catch (err) {
      console.error('AI Processing error:', err);
      alert('Failed to process interview turn. Please try again.');
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

    await saveMockInterview({
      studentId: user.id,
      transcript: JSON.stringify(chatHistory),
      feedback: "Completed dynamic AI interview.",
      score: score,
      coinsAwarded: COIN_REWARD
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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <Clock className="w-12 h-12 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Rest and Prepare</h2>
            <p className="text-zinc-400">
              You recently completed a mock interview. Take some time to review your feedback and prepare.
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="text-4xl font-bold text-white mb-2">{cooldownDaysLeft}</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Days until next interview</div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Virtual Interview</h1>
            <p className="text-zinc-400">Configure your interviewer settings before we begin.</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-8 shadow-2xl">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                <Settings className="w-4 h-4" /> Interviewer Voice
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      voice === v.id 
                        ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-medium">{v.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Speaking Speed
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SPEEDS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSpeed(s.value)}
                    className={`p-3 rounded-2xl border text-center text-sm transition-all ${
                      speed === s.value 
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startInterview}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Enter Interview Room
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
      <div className="min-h-[calc(100vh-4rem)] bg-black p-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Interview Complete</h2>
            <p className="text-zinc-400">Great job! Here is how you did.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-1">
                {score.toFixed(1)} <span className="text-lg text-zinc-500">/ 10</span>
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Overall Score</div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-yellow-500 mb-1">
                +{COIN_REWARD} <Star className="w-6 h-6 fill-current" />
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Coins Earned</div>
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Active Interview Phase
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Scenery */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm scale-105"
        style={{ backgroundImage: 'url(/interview-bg.png)' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Main Interview UI */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-12 p-4">
        
        {/* Status Indicator & End Button */}
        <div className="absolute top-4 w-full px-4 flex justify-between items-center max-w-4xl">
          <div className="bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-2">
            {processingAI ? (
              <>
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Thinking</span>
              </>
            ) : isAvatarSpeaking ? (
              <>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Speaking</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Listening</span>
              </>
            )}
          </div>
          
          <button 
            onClick={finishInterview}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">End</span>
          </button>
        </div>

        {/* Central Avatar Focus */}
        <div className="flex flex-col items-center gap-8 mt-16">
          <Avatar2D isSpeaking={isAvatarSpeaking} size={280} gender={voice.includes('asteria') ? 'female' : 'male'} />
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isAvatarSpeaking || processingAI}
              className={`w-full h-20 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all select-none ${
                isAvatarSpeaking || processingAI
                  ? 'bg-zinc-800/80 backdrop-blur-md text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : isRecording
                  ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-95'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-500/30 active:scale-95 border border-purple-400/30'
              }`}
            >
              {isRecording ? (
                <>
                  <Mic className="w-6 h-6 animate-pulse" /> Release to Send
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" /> Hold to Speak
                </>
              )}
            </button>
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              {isAvatarSpeaking || processingAI ? "Please wait..." : "Your Turn"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
