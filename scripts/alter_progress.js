import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS student_progress (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL REFERENCES erp_users(id) ON DELETE CASCADE,
          attendance_score REAL DEFAULT 0,
          course_progress_percentage REAL DEFAULT 0,
          quiz_scores TEXT DEFAULT '[]',
          coins_spent INTEGER DEFAULT 0,
          leaderboard_rank INTEGER,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("student_progress table created successfully!");
  } catch (err) {
    console.error(err);
  }
}
run();
