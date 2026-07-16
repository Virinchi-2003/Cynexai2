import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  const res = await db.execute("SELECT u.name, s.course, s.classes_attended_json, s.topic_completed FROM users u JOIN students s ON u.email = s.portal_login_email WHERE s.course LIKE '%Data Science%'");
  
  for (const row of res.rows) {
    let progress = 'No data';
    if (row.classes_attended_json) {
      try {
        const parsed = JSON.parse(row.classes_attended_json);
        progress = Object.entries(parsed).map(([k, v]) => `${k}: ${v} classes`).join(', ');
      } catch(e) {}
    }
    console.log(`Student: ${row.name}`);
    console.log(`Course: ${row.course}`);
    console.log(`Topic Completed (from Excel): ${row.topic_completed || 'None'}`);
    console.log(`Progress Data: ${progress}`);
    console.log('---');
  }
}

run().catch(console.error);
