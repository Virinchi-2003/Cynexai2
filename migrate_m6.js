import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url) {
  console.error("VITE_TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const client = createClient({
  url: url,
  authToken: authToken,
});

async function migrate() {
  console.log("Starting migration...");

  try {
    // Disable foreign keys temporarily
    await client.execute('PRAGMA foreign_keys=off;');
    console.log("Foreign keys disabled.");

    // Rename old tasks table
    await client.execute('ALTER TABLE tasks RENAME TO tasks_old;');
    console.log("Renamed tasks to tasks_old.");

    // Create new tasks table
    await client.execute(`
      CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          assignee_id TEXT,
          created_by TEXT,
          priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
          due_date TEXT,
          status TEXT DEFAULT 'To Do',
          task_type TEXT CHECK(task_type IN ('One-Time', 'Daily', 'Yes/No', 'Number')) DEFAULT 'One-Time',
          target_number INTEGER,
          current_number INTEGER DEFAULT 0,
          related_entity TEXT,
          start_date TEXT,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created new tasks table.");

    // Copy data
    await client.execute(`
      INSERT INTO tasks (id, title, description, assignee_id, created_by, priority, due_date, status, task_type, target_number, current_number, related_entity, start_date, tags, created_at, updated_at)
      SELECT id, title, description, assignee_id, created_by, priority, due_date, status, task_type, target_number, current_number, related_entity, NULL, NULL, created_at, updated_at
      FROM tasks_old;
    `);
    console.log("Copied data from tasks_old to tasks.");

    // Drop old table
    await client.execute('DROP TABLE tasks_old;');
    console.log("Dropped tasks_old.");

    // Re-enable foreign keys
    await client.execute('PRAGMA foreign_keys=on;');
    console.log("Foreign keys enabled.");

    // Create task_dependencies table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          depends_on_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);
    console.log("Created task_dependencies table.");

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
