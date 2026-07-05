require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

let url = process.env.VITE_TURSO_DATABASE_URL;
if (url && url.startsWith('libsql://')) {
  url = url.replace('libsql://', 'https://');
}
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function migrate() {
  try {
    console.log('Migrating Turso Database...');
    
    // 1. Add instructor_id to modules (ignoring error if it already exists)
    try {
      await client.execute('ALTER TABLE modules ADD COLUMN instructor_id TEXT REFERENCES erp_users(id)');
      console.log('Added instructor_id to modules');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('instructor_id already exists on modules');
      } else {
        console.error('Error adding column to modules:', e.message);
      }
    }

    try {
      await client.execute('ALTER TABLE course_modules ADD COLUMN instructor_id TEXT REFERENCES erp_users(id)');
      console.log('Added instructor_id to course_modules');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('instructor_id already exists on course_modules');
      } else {
        console.error('Error adding column to course_modules:', e.message);
      }
    }

    // 2. We can't easily ALTER TABLE CHECK constraints in SQLite without recreating the table.
    // However, SQLite allows inserting values that violate the check constraint if we don't enforce it, or if it's already there. 
    // Wait, Turso (libsql) might enforce it. Let's just recreate the classes and course_classes tables if needed, or simply let it be (SQLite CHECK constraints are checked on INSERT/UPDATE).
    // Actually, in SQLite, you must create a new table, copy data, drop old, rename new.
    // Let's do that for `classes` and `course_classes`.
    
    console.log('Migrating classes table check constraint...');
    await client.execute('PRAGMA foreign_keys=off;');
    
    // Migrate classes
    await client.execute(`
      CREATE TABLE IF NOT EXISTS classes_new (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        youtube_video_id TEXT,
        meet_link TEXT,
        type TEXT CHECK(type IN ('video', 'reading', 'quiz', 'code', 'live', 'assignment', 'practice', 'interview')) NOT NULL DEFAULT 'video',
        ai_ppt_markdown TEXT,
        ai_script TEXT,
        ai_keypoints TEXT,
        ai_summary TEXT,
        status TEXT CHECK(status IN ('draft', 'scheduled', 'in_progress', 'published', 'completed')) DEFAULT 'draft',
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
      )
    `);
    await client.execute('INSERT INTO classes_new SELECT * FROM classes');
    await client.execute('DROP TABLE classes');
    await client.execute('ALTER TABLE classes_new RENAME TO classes');

    await client.execute('PRAGMA foreign_keys=on;');
    
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.close();
  }
}

migrate();
