const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  console.log(`Connecting to ${process.env.VITE_TURSO_DATABASE_URL}`);
  
  const columnsToAdd = [
    { name: 'attendance_num', type: 'INTEGER DEFAULT 0' },
    { name: 'attendance_den', type: 'INTEGER DEFAULT 0' },
    { name: 'quiz_num', type: 'INTEGER DEFAULT 0' },
    { name: 'quiz_den', type: 'INTEGER DEFAULT 0' },
    { name: 'interview_num', type: 'INTEGER DEFAULT 0' },
    { name: 'interview_den', type: 'INTEGER DEFAULT 0' },
    { name: 'coding_num', type: 'INTEGER DEFAULT 0' },
    { name: 'coding_den', type: 'INTEGER DEFAULT 0' },
    { name: 'course_progress_num', type: 'INTEGER DEFAULT 0' },
    { name: 'course_progress_den', type: 'INTEGER DEFAULT 0' },
  ];

  for (const col of columnsToAdd) {
    try {
      await client.execute(`ALTER TABLE manager_student_progress ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column: ${col.name}`);
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log(`  Already exists: ${col.name}`);
      } else {
        console.error(`✗ Failed to add ${col.name}:`, e.message);
      }
    }
  }

  console.log("\nAuto-syncing data for all students...");
  
  // Get all students
  const res = await client.execute("SELECT id FROM students");
  const students = res.rows;
  
  for (const stu of students) {
    const sId = stu.id;
    let attNum = 0, attDen = 0, quizNum = 0, quizDen = 0, intNum = 0, intDen = 0, codNum = 0, codDen = 0, cpNum = 0, cpDen = 0;

    try {
      const qRes = await client.execute({ sql: `SELECT SUM(score) as num, SUM(totalQuestions) as den FROM test_results WHERE studentId = ? AND testTitle LIKE '%quiz%'`, args: [sId] });
      quizNum = qRes.rows[0]?.num || 0; quizDen = qRes.rows[0]?.den || 0;
    } catch(e) {}

    try {
      const iRes = await client.execute({ sql: `SELECT SUM(score) as num, COUNT(*) * 100 as den FROM mock_interviews WHERE student_id = ?`, args: [sId] });
      intNum = iRes.rows[0]?.num || 0; intDen = iRes.rows[0]?.den || 0;
    } catch(e) {}

    try {
      const cRes = await client.execute({ sql: `SELECT SUM(score) as num, SUM(totalQuestions) as den FROM test_results WHERE studentId = ? AND testTitle NOT LIKE '%quiz%'`, args: [sId] });
      codNum = cRes.rows[0]?.num || 0; codDen = cRes.rows[0]?.den || 0;
    } catch(e) {}

    try {
      // Try student_id first, fallback to user_id for local DB
      let aRes = await client.execute({ sql: `SELECT COUNT(*) as num FROM attendance_logs WHERE student_id = ?`, args: [sId] }).catch(async () => {
        return await client.execute({ sql: `SELECT COUNT(*) as num FROM attendance_logs WHERE user_id = ?`, args: [sId] });
      });
      attNum = aRes.rows[0]?.num || 0; attDen = attNum > 0 ? 100 : 0;
    } catch(e) {}

    try {
      const cpRes = await client.execute({ sql: `SELECT COUNT(*) as num FROM student_progress WHERE student_id = ? AND completed = 1`, args: [sId] });
      cpNum = cpRes.rows[0]?.num || 0; cpDen = cpNum > 0 ? 50 : 0;
    } catch(e) {}

    await client.execute({
      sql: `UPDATE manager_student_progress SET
        attendance_num = ?, attendance_den = ?,
        quiz_num = ?, quiz_den = ?,
        interview_num = ?, interview_den = ?,
        coding_num = ?, coding_den = ?,
        course_progress_num = ?, course_progress_den = ?
        WHERE student_id = ?`,
      args: [
        attNum, attDen, quizNum, quizDen, intNum, intDen, codNum, codDen, cpNum, cpDen, sId
      ]
    });
  }

  console.log("✓ Data synced.");
}

run().catch(console.error);
