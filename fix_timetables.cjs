const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function fix() {
  // Fix timetables: set teacher_id to the actual usr_teacher ID (for the default teacher@cynexai.com login)
  // The timetables were seeded with 'usr_teacher' which IS a valid user ID - that's fine
  // The real teacher (Venkatesh) has ID bb621c0a-...
  // So timetables for 10:00 AM (the batch 1 - Data Science) should belong to Venkatesh
  
  // Check current timetables
  const tt = await client.execute("SELECT id, teacher_id, day_of_week, start_time, batch_id FROM timetables");
  console.log('=== CURRENT TIMETABLES ===');
  tt.rows.forEach(r => console.log(`  ${r.id}: teacher=${r.teacher_id} | batch=${r.batch_id} | ${r.day_of_week} ${r.start_time}`));

  // Update timetables that have batch_id matching 'Data Science' pattern to use real Venkatesh ID
  // Actually, let's just add timetable entries for the real teachers and keep usr_teacher ones too
  // First, check if there are timetables for Venkatesh already
  const venkateshId = 'bb621c0a-5da8-44b8-a486-d0229d13dc90';
  
  // Update existing timetables - assign first 5 (10am slots) to Venkatesh and keep rest for usr_teacher
  const r1 = await client.execute({
    sql: "UPDATE timetables SET teacher_id = ? WHERE teacher_id = 'usr_teacher' AND start_time LIKE '10:%'",
    args: [venkateshId]
  });
  console.log(`\nMoved 10am timetables to real Venkatesh: ${r1.rowsAffected}`);

  // Verify
  const tt2 = await client.execute("SELECT id, teacher_id, day_of_week, start_time FROM timetables LIMIT 10");
  console.log('\n=== UPDATED TIMETABLES ===');
  tt2.rows.forEach(r => console.log(`  teacher=${r.teacher_id} | ${r.day_of_week} ${r.start_time}`));
}

fix().catch(console.error);
