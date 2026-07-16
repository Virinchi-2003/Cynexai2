const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function diagnose() {
  console.log('=== TEACHER ACCOUNTS ===');
  const teachers = await client.execute("SELECT id, name, email, role FROM users WHERE role = 'Teacher'");
  teachers.rows.forEach(r => console.log(`  id=${r.id} | ${r.name} | ${r.email}`));

  console.log('\n=== MODULES WITH instructor_id ===');
  const mods = await client.execute("SELECT id, title, instructor_id FROM modules WHERE instructor_id IS NOT NULL");
  mods.rows.forEach(r => console.log(`  mod=${r.id} | instructor_id=${r.instructor_id} | title=${r.title}`));

  console.log('\n=== CLASSES count by module ===');
  const cls = await client.execute("SELECT module_id, COUNT(*) as count, MIN(status) as status FROM classes GROUP BY module_id");
  cls.rows.forEach(r => console.log(`  module_id=${r.module_id} | classes=${r.count} | status=${r.status}`));

  console.log('\n=== TIMETABLES ===');
  const tt = await client.execute("SELECT id, teacher_id, day_of_week, start_time FROM timetables LIMIT 5");
  tt.rows.forEach(r => console.log(`  id=${r.id} | teacher=${r.teacher_id} | ${r.day_of_week} ${r.start_time}`));

  // What teacher.ts queries for TeacherDashboard - classes where instructor_id matches
  console.log('\n=== SIMULATING getActiveLiveClass(usr_teacher) ===');
  const resolvedId = 'usr_venkatesh';
  const liveClass = await client.execute({
    sql: `SELECT c.id, c.title, c.status, m.instructor_id
          FROM classes c
          JOIN modules m ON c.module_id = m.id
          WHERE m.instructor_id = ? AND c.status != 'completed'
          ORDER BY c.order_index ASC LIMIT 1`,
    args: [resolvedId]
  });
  console.log(liveClass.rows.length > 0 ? `  Found: ${JSON.stringify(liveClass.rows[0])}` : '  NONE FOUND for usr_venkatesh');

  // Try with usr_teacher directly
  const liveClass2 = await client.execute({
    sql: `SELECT c.id, c.title, c.status, m.instructor_id
          FROM classes c
          JOIN modules m ON c.module_id = m.id
          WHERE m.instructor_id = ?
          ORDER BY c.order_index ASC LIMIT 1`,
    args: ['usr_teacher']
  });
  console.log(liveClass2.rows.length > 0 ? `  Found for usr_teacher: ${JSON.stringify(liveClass2.rows[0])}` : '  NONE for usr_teacher');

  // Check what instructor_ids exist in modules
  const instructorIds = await client.execute("SELECT DISTINCT instructor_id FROM modules WHERE instructor_id IS NOT NULL");
  console.log('\n=== ALL instructor_ids in modules ===');
  instructorIds.rows.forEach(r => console.log(`  ${r.instructor_id}`));
}

diagnose().catch(console.error);
