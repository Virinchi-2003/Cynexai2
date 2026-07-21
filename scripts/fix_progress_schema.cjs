const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Dropping old manager_student_progress table...");
  await client.execute("DROP TABLE IF EXISTS manager_student_progress");

  console.log("Creating manager_student_progress table...");
  
  await client.execute(`
    CREATE TABLE manager_student_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      attendance_score INTEGER DEFAULT 0,
      course_progress_percentage INTEGER DEFAULT 0,
      quiz_scores TEXT DEFAULT '[]',
      coins_spent INTEGER DEFAULT 0,
      leaderboard_rank INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✓ Created manager_student_progress table");

  // Fetch students from the actual 'students' table
  const result = await client.execute(`
    SELECT s.id, COALESCE(s.name, (SELECT name FROM users u WHERE u.email = s.portal_login_email)) as name
    FROM students s
  `);
  
  const students = result.rows;
  console.log(`\nFound ${students.length} students in the 'students' table. Seeding progress rows...`);

  for (const stu of students) {
    if (!stu.id) continue;
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO manager_student_progress 
              (id, student_id, attendance_score, course_progress_percentage, coins_spent, leaderboard_rank) 
              VALUES (?, ?, 0, 0, 0, 0)`,
        args: [`msp_${stu.id}`, stu.id]
      });
      console.log(`  ✓ Seeded: ${stu.name || stu.id}`);
    } catch (e) {
      console.error(`  ✗ Failed to seed ${stu.name || stu.id}:`, e.message);
    }
  }

  console.log("\nDone!");
}

run().catch(console.error);
