import { createClient } from '@libsql/client';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  const tasksSql = `
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT,
    created_by TEXT,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    due_date TEXT,
    status TEXT CHECK(status IN ('To Do', 'In Progress', 'Review', 'Done')) DEFAULT 'To Do',
    related_entity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

  const settingsSql = `
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    setting_group TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_group, key)
);`;

  try {
    // Drop old tasks table if it exists (since we changed the schema completely)
    await client.execute('DROP TABLE IF EXISTS tasks;');
    await client.execute(tasksSql);
    await client.execute(settingsSql);
    console.log("Tables created successfully.");
    
    // Append to schema.sql
    fs.appendFileSync('schema.sql', '\n' + tasksSql + '\n' + settingsSql + '\n');
    console.log("Appended to schema.sql");
  } catch (e) {
    console.error("Error creating tables:", e);
  }
}

run();
