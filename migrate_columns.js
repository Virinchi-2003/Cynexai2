import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  await db.execute('ALTER TABLE students ADD COLUMN preferred_mode TEXT').catch(() => console.log('preferred_mode exists'));
  await db.execute('ALTER TABLE students ADD COLUMN classes_attended_json TEXT').catch(() => console.log('classes_attended_json exists'));
  
  // also set prudvi classes to offline
  const res = await db.execute("SELECT u.id, s.id as sid FROM users u JOIN students s ON u.email = s.portal_login_email WHERE u.name LIKE '%Prudvi%'");
  for (const row of res.rows) {
      console.log('Updating Prudvi:', row.id);
      await db.execute({ sql: "UPDATE students SET preferred_mode = 'Offline' WHERE portal_login_email = (SELECT email FROM users WHERE id = ?)", args: [row.id] });
  }
  
  console.log('Migration done.');
}

run().catch(console.error);
