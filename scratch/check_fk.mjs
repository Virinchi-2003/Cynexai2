import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

try {
  const r2 = await client.execute("SELECT sql FROM sqlite_schema WHERE name = 'crm_stage_history'");
  console.log('History schema:', r2.rows[0].sql);
  
  const r3 = await client.execute("PRAGMA foreign_key_list(crm_stage_history)");
  console.log('Foreign keys:', r3.rows);
} catch(e) {
  console.error('Error:', e.message);
}
