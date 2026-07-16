import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Turning off FK checks temporarily...');
    await client.execute('PRAGMA foreign_keys=OFF');

    console.log('Creating new table without CHECK constraint...');
    await client.execute(`
      CREATE TABLE crm_leads_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        course_interest TEXT,
        source TEXT,
        status TEXT,
        assigned_to TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    console.log('Copying data...');
    await client.execute('INSERT INTO crm_leads_new SELECT id, name, email, phone, course_interest, source, status, assigned_to, notes, created_at, updated_at FROM crm_leads');

    console.log('Dropping old table...');
    await client.execute('DROP TABLE crm_leads');

    console.log('Renaming new table...');
    await client.execute('ALTER TABLE crm_leads_new RENAME TO crm_leads');

    console.log('Turning FK checks back on...');
    await client.execute('PRAGMA foreign_keys=ON');

    console.log('Done fixing constraint!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
