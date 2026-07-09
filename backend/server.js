require('dotenv').config({ path: '../.env' }); // load parent .env

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(bodyParser.json());

// --- Turso Database ---
const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || '',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
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

whatsapp.initialize();

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

app.get('/', (req, res) => {
  res.status(200).send('CynexAI Backend API is running with WhatsApp Automation.');
});

app.listen(PORT, () => {
  console.log(`Node.js backend server running on http://localhost:${PORT}`);
});
