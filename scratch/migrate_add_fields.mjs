import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Adding grad_year...');
    await client.execute('ALTER TABLE crm_leads ADD COLUMN grad_year TEXT;');
  } catch(e) { console.log(e.message); }
  
  try {
    console.log('Adding qualification...');
    await client.execute('ALTER TABLE crm_leads ADD COLUMN qualification TEXT;');
  } catch(e) { console.log(e.message); }
  
  try {
    console.log('Adding it_background...');
    await client.execute('ALTER TABLE crm_leads ADD COLUMN it_background TEXT;');
  } catch(e) { console.log(e.message); }

  try {
    console.log('Adding preferred_mode...');
    await client.execute('ALTER TABLE crm_leads ADD COLUMN preferred_mode TEXT;');
  } catch(e) { console.log(e.message); }

  try {
    console.log('Adding location...');
    await client.execute('ALTER TABLE crm_leads ADD COLUMN location TEXT;');
  } catch(e) { console.log(e.message); }
  
  console.log('Migration complete!');
}
run();
