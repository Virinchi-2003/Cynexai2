import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
});

export async function runMigration(client) {
  console.log('Starting migration m1_1...');

  // 1. tasks: add student_id, lead_id and foreign keys
  try {
    const tableInfo = await client.execute("PRAGMA table_info(tasks);");
    const hasStudentId = tableInfo.rows.some(r => r.name === 'student_id');

    if (!hasStudentId) {
      console.log('Recreating tasks to add foreign keys and columns...');
      
      await client.execute('PRAGMA foreign_keys=off;');
      await client.execute('BEGIN TRANSACTION;');
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS tasks_new (
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
            lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
            student_id TEXT REFERENCES erp_users(id) ON DELETE CASCADE,
            start_date TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignee_id) REFERENCES erp_users(id),
            FOREIGN KEY (created_by) REFERENCES erp_users(id)
        );
      `);
      
      await client.execute(`
        INSERT INTO tasks_new (id, title, description, assignee_id, created_by, priority, due_date, status, task_type, target_number, current_number, related_entity, start_date, tags, created_at, updated_at)
        SELECT id, title, description, assignee_id, created_by, priority, due_date, status, task_type, target_number, current_number, related_entity, start_date, tags, created_at, updated_at FROM tasks;
      `);
      
      await client.execute('DROP TABLE tasks;');
      await client.execute('ALTER TABLE tasks_new RENAME TO tasks;');
      
      await client.execute('COMMIT;');
      await client.execute('PRAGMA foreign_keys=on;');
      console.log('Recreated tasks successfully.');
    } else {
      console.log('tasks already up to date.');
    }
  } catch (e) {
    console.error('Error modifying tasks:', e);
    try { await client.execute('ROLLBACK;'); } catch (_) {}
    await client.execute('PRAGMA foreign_keys=on;');
  }

  // 2. crm_activities: make lead_id nullable and add student_id
  try {
    const tableInfo = await client.execute("PRAGMA table_info(crm_activities);");
    const hasStudentId = tableInfo.rows.some(r => r.name === 'student_id');
    const leadIdRow = tableInfo.rows.find(r => r.name === 'lead_id');
    const isLeadIdNotNull = leadIdRow && leadIdRow.notnull === 1;

    if (!hasStudentId || isLeadIdNotNull) {
      console.log('Recreating crm_activities to add student_id and make lead_id nullable...');
      
      // Use transaction
      await client.execute('PRAGMA foreign_keys=off;');
      await client.execute('BEGIN TRANSACTION;');
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS crm_activities_new (
          id TEXT PRIMARY KEY,
          lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
          student_id TEXT REFERENCES erp_users(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES erp_users(id),
          type TEXT CHECK(type IN ('Call', 'Email', 'Meeting', 'Note')) NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.execute(`
        INSERT INTO crm_activities_new (id, lead_id, user_id, type, content, created_at)
        SELECT id, lead_id, user_id, type, content, created_at FROM crm_activities;
      `);
      
      await client.execute('DROP TABLE crm_activities;');
      await client.execute('ALTER TABLE crm_activities_new RENAME TO crm_activities;');
      
      await client.execute('COMMIT;');
      await client.execute('PRAGMA foreign_keys=on;');
      console.log('Recreated crm_activities successfully.');
    } else {
      console.log('crm_activities already up to date.');
    }
  } catch (e) {
    console.error('Error modifying crm_activities:', e);
    await client.execute('ROLLBACK;');
    await client.execute('PRAGMA foreign_keys=on;');
  }

  console.log('Migration m1_1 complete.');
}

// Only run automatically if executed directly (e.g. node migrate_m1_1.js)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration(client).catch(console.error);
}
