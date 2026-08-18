require('dotenv').config({ path: '../.env' }); // load parent .env
require('dotenv').config(); // load local .env if present

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@libsql/client');
const multer = require('multer');
const cron = require('node-cron');
const { processVoiceTurn, generateInitialQuestionVoice } = require('./voiceLogic');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(bodyParser.json());

// --- Turso Database ---
const tursoUrl = process.env.VITE_TURSO_DATABASE_URL || 'libsql://cynexai-portal-cynexai-new.aws-ap-south-1.turso.io';
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxOTUyNjcsImlkIjoiMDE5ZjZhNTItN2IwMS03Mzc2LWExMGUtNTViZGRiMzAwZTdlIiwia2lkIjoieUdPOElXY1J5RC1VX2J3UFlHWUJJMmlKZEp1R21CSDY5QzJQZzJUWmZhQSIsInJpZCI6IjcxYmEzODM5LTAyZDEtNDJiNS1hNDM5LTVlOWM4MGJkNGRhNSJ9.O2do8U63KLbS_pXwqivQRIYK1SncnMa1VRuePw6UFagpIIFodykzhY2cr6C_iYE83O86fUXhErbRPKfBMZtUAA';

let db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

db.execute('SELECT 1').catch((err) => {
  console.warn('[Backend DB] Cloud database BLOCKED/unreachable. Falling back to local SQLite file:cynexai.db');
  db = createClient({ url: 'file:cynexai.db' });
});


// --- WhatsApp Client ---
let qrCodeData = null;
let isWhatsAppReady = false;

const whatsapp = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

whatsapp.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrCodeData = qr;
    isWhatsAppReady = false;
});

whatsapp.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isWhatsAppReady = true;
    qrCodeData = null;
});

whatsapp.on('message', async (message) => {
    console.log(`Received message: ${message.body} from ${message.from}`);
    if (db && process.env.VITE_TURSO_DATABASE_URL) {
        try {
            await db.execute({
                sql: `INSERT INTO whatsapp_messages (id, lead_id, direction, message_body, timestamp) 
                      VALUES (?, ?, ?, ?, ?)`,
                args: [
                    message.id.id, 
                    message.from, 
                    'inbound', 
                    message.body, 
                    new Date().toISOString()
                ]
            });
            console.log('Saved message to Turso CRM');
        } catch (e) {
            console.error('Turso insert error', e);
        }
    }
});

whatsapp.initialize().catch(err => {
    console.error('WhatsApp client initialization failed:', err.message);
});

// --- API Endpoints ---
app.get('/api/whatsapp/status', (req, res) => {
    if (isWhatsAppReady) {
        return res.json({ status: 'ready' });
    }
    if (qrCodeData) {
        return res.json({ status: 'needs_login', qr: qrCodeData });
    }
    return res.json({ status: 'initializing' });
});

app.post('/api/whatsapp/send', async (req, res) => {
    if (!isWhatsAppReady) {
        return res.status(400).json({ error: 'WhatsApp is not ready' });
    }
    const { phone, message } = req.body;
    if (!phone || !message) {
         return res.status(400).json({ error: 'Phone and message are required' });
    }
    const formattedPhone = phone.replace(/\D/g, '') + '@c.us';
    try {
         await whatsapp.sendMessage(formattedPhone, message);
         res.json({ success: true });
    } catch(e) {
         res.status(500).json({ error: e.message });
    }
});

// Export Razorpay routes if needed later
app.post('/create-order', (req, res) => {
    res.status(200).json({ status: 'mock', orderId: 'ord_mock123' });
});


const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/voice-interview/start', async (req, res) => {
    try {
        const { context, voice = 'aura-asteria-en' } = req.body;

        const result = await generateInitialQuestionVoice(
            context || 'Student in training', 
            voice, 
            process.env.GROQ_VOICE_API,
            process.env.DEEPGRAM_VOICE_API
        );

        res.json({
            aiResponse: result.aiText,
            audioBase64: result.audioBuffer.toString('base64')
        });
    } catch (error) {
        console.error("Voice start error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/voice-interview', upload.single('audio'), async (req, res) => {
    try {
        const chatHistory = req.body?.chatHistory;
        const context = req.body?.context || 'Student in training';
        const turnCount = parseInt(req.body?.turnCount || '1', 10);
        const voice = req.body?.voice || 'aura-asteria-en';
        const audioBuffer = req.file?.buffer;

        if (!audioBuffer) return res.status(400).json({ error: 'No audio file provided' });

        const result = await processVoiceTurn(
            audioBuffer, 
            chatHistory, 
            context,
            turnCount,
            voice,
            process.env.GROQ_VOICE_API, 
            process.env.DEEPGRAM_VOICE_API
        );

        // Send audio buffer back as base64 and texts as headers, or just a JSON response with audio as base64 string
        res.json({
            transcript: result.transcript,
            aiResponse: result.aiResponse,
            audioBase64: result.audioBuffer.toString('base64')
        });

    } catch (error) {
        console.error("Voice interview error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
  res.status(200).send('CynexAI Backend API is running with WhatsApp Automation.');
});

// ─── Daily Task Midnight Cron Job ────────────────────────────────────────────
// Runs at 23:59:30 every night (IST) for ALL users — marks incomplete
// daily tasks as 'Missed' and creates fresh copies for the next day.
cron.schedule('30 59 23 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  console.log(`[CRON] Daily task rollover starting for date: ${today} → ${tomorrow}`);

  try {
    // 1. Fetch ALL incomplete daily tasks that are due today or earlier
    const result = await db.execute({
      sql: `SELECT * FROM tasks WHERE task_type = 'Daily' AND due_date <= ? AND status NOT IN ('Done', 'Excused', 'Missed')`,
      args: [today]
    });
    const incompleteDailies = result.rows;
    console.log(`[CRON] Found ${incompleteDailies.length} incomplete daily tasks to mark Missed`);

    // 2. Mark all as Missed
    for (const task of incompleteDailies) {
      await db.execute({
        sql: `UPDATE tasks SET status = 'Missed' WHERE id = ?`,
        args: [task.id]
      });
    }

    // 3. Find all daily tasks due today, group by (title + assignee_id)
    //    and create tomorrow's copy if one doesn't already exist
    const todayResult = await db.execute({
      sql: `SELECT * FROM tasks WHERE task_type = 'Daily' AND due_date = ?`,
      args: [today]
    });
    const todayTasks = todayResult.rows;

    // Group by title+assignee to avoid duplicates
    const seen = new Set();
    let created = 0;
    for (const task of todayTasks) {
      const key = `${task.title}__${task.assignee_id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Check if tomorrow's copy already exists
      const existsResult = await db.execute({
        sql: `SELECT id FROM tasks WHERE task_type = 'Daily' AND title = ? AND assignee_id = ? AND due_date = ?`,
        args: [task.title, task.assignee_id, tomorrow]
      });
      if (existsResult.rows.length > 0) continue;

      // Create tomorrow's copy
      const newId = 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO tasks (id, title, description, assignee_id, status, priority, due_date, project_id, related_entity, task_type, target_number, current_number, start_date, tags, recurrence_rule, created_by, lead_id, student_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'To Do', ?, ?, ?, ?, 'Daily', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newId,
          task.title,
          task.description || '',
          task.assignee_id,
          task.priority || 'Medium',
          tomorrow,
          task.project_id || null,
          task.related_entity || null,
          task.target_number || null,
          task.start_date || null,
          task.tags || null,
          task.recurrence_rule || null,
          task.created_by || null,
          task.lead_id || null,
          task.student_id || null,
          now,
          now
        ]
      });
      created++;
    }

    console.log(`[CRON] ✅ Daily rollover done — ${incompleteDailies.length} marked Missed, ${created} new tasks created for ${tomorrow}`);
  } catch (err) {
    console.error('[CRON] ❌ Daily task rollover failed:', err);
  }
}, {
  timezone: 'Asia/Kolkata' // IST
});

console.log('[CRON] Daily task rollover scheduled at 23:59:30 IST every night');
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Node.js backend server running on http://localhost:${PORT}`);
});
