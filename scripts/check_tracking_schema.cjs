const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  const tables = [
    'attendance_logs', 'classes_attended_json', 'students', 'test_results', 
    'mock_interviews', 'qa_responses', 'student_performance', 'student_progress'
  ];
  for (const table of tables) {
    try {
      const res = await client.execute(`PRAGMA table_info(${table})`);
      if (res.rows.length > 0) {
        console.log(`\n--- ${table} ---`);
        console.log(res.rows.map(r => r.name).join(', '));
      }
    } catch(e) {}
  }
}
run().catch(console.error);
