const test = require('node:test');
const assert = require('node:assert');
const { processVoiceTurn, generateInitialQuestionVoice } = require('./voiceLogic');

test('processVoiceTurn should throw error if keys are missing', async () => {
    try {
        await processVoiceTurn(Buffer.from('dummy'), "[]", "context", 1, 'aura-asteria-en', null, null);
        assert.fail("Should have thrown an error");
    } catch (e) {
        assert.match(e.message, /Missing API keys/);
    }
});

test('processVoiceTurn should return transcription and audio buffer', async () => {
    const result = await processVoiceTurn(
        Buffer.from('dummy'), 
        "[]", 
        "context", 
        1, 
        'aura-asteria-en', 
        'fake_groq', 
        'fake_deepgram', 
        {
            mockGroqTranscribe: async () => 'student text',
            mockGroqChat: async () => 'ai text',
            mockDeepgram: async () => Buffer.from('audio_data')
        }
    );
    
    assert.strictEqual(result.transcript, 'student text');
    assert.strictEqual(result.aiResponse, 'ai text');
    assert.ok(result.audioBuffer instanceof Buffer);
});

test('generateInitialQuestionVoice should return audio buffer and ai text', async () => {
    const result = await generateInitialQuestionVoice(
        "Welcome to the interview", 
        'aura-asteria-en', 
        'fake_groq',
        'fake_deepgram', 
        {
            mockDeepgram: async () => {
                return {
                    audioBuffer: Buffer.from('audio_data_initial'),
                    aiText: 'Mock Intro'
                };
            }
        }
    );
    
    assert.ok(result.audioBuffer instanceof Buffer);
    assert.strictEqual(result.audioBuffer.toString(), 'audio_data_initial');
    assert.strictEqual(result.aiText, 'Mock Intro');
});
