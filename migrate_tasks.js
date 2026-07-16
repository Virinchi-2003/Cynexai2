import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log("Migrating tasks table...");
    
    try {
      await client.execute(`ALTER TABLE tasks ADD COLUMN task_type TEXT CHECK(task_type IN ('One-Time', 'Daily', 'Yes/No', 'Number')) DEFAULT 'One-Time'`);
      console.log("Added task_type column.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) console.log("task_type column already exists.");
      else throw e;
    }

    try {
      await client.execute(`ALTER TABLE tasks ADD COLUMN target_number INTEGER`);
      console.log("Added target_number column.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) console.log("target_number column already exists.");
      else throw e;
    }

    try {
      await client.execute(`ALTER TABLE tasks ADD COLUMN current_number INTEGER DEFAULT 0`);
      console.log("Added current_number column.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) console.log("current_number column already exists.");
      else throw e;
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
