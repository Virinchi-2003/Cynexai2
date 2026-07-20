const fs = require('fs');

let content = fs.readFileSync('src/lib/api/student.ts', 'utf8');

const regex = /export async function getInitialInterviewAudio[\s\S]*?export async function spendCoins/m;

const newImplementation = `
async function textToSpeech(text: string, voice: string): Promise<string> {
  const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_VOICE_API;
  if (!DEEPGRAM_API_KEY) throw new Error("Missing Deepgram API Key");

  // Map local Piper voices to Deepgram voices
  const voiceMap: Record<string, string> = {
    'en_US-libritts_r-medium': 'aura-asteria-en',
    'en_GB-alan-medium': 'aura-orion-en',
    'en_US-amy-medium': 'aura-stella-en',
    'en_US-l2arctic-medium': 'aura-zeus-en',
    'aura-asteria-en': 'aura-asteria-en'
  };
  const targetVoice = voiceMap[voice] || 'aura-asteria-en';

  const response = await fetch(\`https://api.deepgram.com/v1/speak?model=\${targetVoice}&encoding=mp3\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Token \${DEEPGRAM_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) throw new Error('Deepgram TTS failed');

  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return \`data:audio/mp3;base64,\${base64}\`;
}

async function speechToText(audioBlob: Blob): Promise<string> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_VOICE_API;
  if (!GROQ_API_KEY) throw new Error("Missing Groq API Key");

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${GROQ_API_KEY}\`
    },
    body: formData
  });

  if (!response.ok) throw new Error('Groq STT failed');
  const data = await response.json();
  return data.text || '';
}

async function generateChatResponse(messages: any[]): Promise<string> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_VOICE_API;
  if (!GROQ_API_KEY) throw new Error("Missing Groq API Key");

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${GROQ_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 150
    })
  });

  if (!response.ok) throw new Error('Groq LLM failed');
  const data = await response.json();
  return data.choices[0]?.message?.content || 'Okay, I understand.';
}

export async function getInitialInterviewAudio(context: string, voice: string): Promise<{ aiResponse: string, audioBase64: string }> {
  try {
    const messages = [
      { role: 'system', content: 'You are an expert interviewer. Start the interview by briefly greeting the candidate and asking them to introduce themselves. Keep it under 2 sentences.' },
      { role: 'user', content: context }
    ];
    
    const aiResponse = await generateChatResponse(messages);
    const audioBase64 = await textToSpeech(aiResponse, voice);
    
    return { aiResponse, audioBase64 };
  } catch (e) {
    console.error("Initial audio error:", e);
    throw e;
  }
}

export async function processVoiceInterview(audioBlob: Blob, chatHistory: any[], context: string, turnCount: number, voice: string = 'aura-asteria-en'): Promise<{ transcript: string, aiResponse: string, audioBase64: string }> {
  try {
    // 1. STT
    const transcript = await speechToText(audioBlob);
    
    // 2. LLM
    const messages = [
      { role: 'system', content: \`You are an expert interviewer. The candidate is interviewing for a position. Context: \${context}. Keep responses conversational, concise (1-3 sentences max), and ask one relevant follow-up question.\` },
      ...chatHistory.map(h => ({ role: h.role === 'student' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: transcript }
    ];
    const aiResponse = await generateChatResponse(messages);
    
    // 3. TTS
    const audioBase64 = await textToSpeech(aiResponse, voice);
    
    return { transcript, aiResponse, audioBase64 };
  } catch (e) {
    console.error("Process voice interview error:", e);
    throw e;
  }
}

export async function spendCoins`;

content = content.replace(regex, newImplementation);
fs.writeFileSync('src/lib/api/student.ts', content, 'utf8');
console.log('Done replacing API logic in student.ts');
