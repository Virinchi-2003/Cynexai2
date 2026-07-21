require('dotenv').config({ path: require('fs').existsSync('.env.prod') ? '.env.prod' : '.env' });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  console.log('Checking live student_progress table structure...');
  
  const info = await client.execute('PRAGMA table_info(student_progress)');
  const existingCols = info.rows.map(r => r.name);
  console.log('Existing columns:', existingCols);

  const columnsToAdd = [
    { name: 'attendance_score', type: 'REAL', default: '0' },
    { name: 'course_progress_percentage', type: 'REAL', default: '0' },
    { name: 'quiz_scores', type: 'TEXT', default: "'[]'" },
    { name: 'coins_spent', type: 'INTEGER', default: '0' },
    { name: 'leaderboard_rank', type: 'INTEGER', default: null },
    { name: 'last_updated', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
  ];

  for (const col of columnsToAdd) {
    if (!existingCols.includes(col.name)) {
      let sql = `ALTER TABLE student_progress ADD COLUMN ${col.name} ${col.type}`;
      if (col.default !== null) sql += ` DEFAULT ${col.default}`;
      try {
        await client.execute(sql);
        console.log(`✓ Added column: ${col.name}`);
      } catch (e) {
        console.error(`✗ Failed to add ${col.name}:`, e.message);
      }
    } else {
      console.log(`  Already exists: ${col.name}`);
    }
  }

  // Now check if the old lesson_id column exists (old schema)
  // and whether we need to seed a manager-level row per student
  const hasLessonId = existingCols.includes('lesson_id');
  if (hasLessonId) {
    console.log('\n⚠️  Old schema detected (lesson_id column exists).');
    console.log('The table is used for per-lesson tracking (not per-student overview).');
    console.log('\nCreating a separate manager_student_progress table for overview tracking...');
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS manager_student_progress (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES erp_users(id) ON DELETE CASCADE,
        attendance_score REAL DEFAULT 0,
        course_progress_percentage REAL DEFAULT 0,
        quiz_scores TEXT DEFAULT '[]',
        coins_spent INTEGER DEFAULT 0,
        leaderboard_rank INTEGER,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id)
      )
    `);
    console.log('✓ Created manager_student_progress table');

    // Seed rows for existing students
    const students = await client.execute(`
      SELECT id, name FROM erp_users WHERE role = 'Student'
    `);
    console.log(`\nFound ${students.rows.length} students. Seeding progress rows...`);

    for (const student of students.rows) {
      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO manager_student_progress (id, student_id) VALUES (?, ?)`,
          args: [crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID(), student.id]
        });
        console.log(`  ✓ Seeded: ${student.name}`);
      } catch (e) {
        console.error(`  ✗ Failed for ${student.name}:`, e.message);
      }
    }
  }

  console.log('\nDone!');
}

run().catch(console.error);
