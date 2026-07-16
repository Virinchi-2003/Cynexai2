import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  console.log("Migrating Turso CRM tables...");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS crm_leads (
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
    console.log("crm_leads table verified/created.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        student_id TEXT,
        user_id TEXT,
        type TEXT,
        content TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("crm_activities table verified/created.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS crm_stage_history (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        old_stage TEXT,
        new_stage TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("crm_stage_history table verified/created.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS demos (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        scheduled_at TEXT,
        status TEXT,
        notes TEXT
      )
    `);
    console.log("demos table verified/created.");

    // Check if courses table has sales_pitch columns
    const columns = await client.execute("PRAGMA table_info(courses)");
    const cols = columns.rows.map(r => r.name);
    
    if (!cols.includes("sales_pitch_summary")) {
      console.log("Adding sales_pitch_summary to courses...");
      await client.execute("ALTER TABLE courses ADD COLUMN sales_pitch_summary TEXT");
    }
    if (!cols.includes("sales_pitch_script")) {
      console.log("Adding sales_pitch_script to courses...");
      await client.execute("ALTER TABLE courses ADD COLUMN sales_pitch_script TEXT");
    }
    
    console.log("Done updating schema!");
  } catch(e) {
    console.error("Migration failed:", e);
  }
}

main();
