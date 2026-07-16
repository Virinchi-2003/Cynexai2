import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function cleanAndVerify() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN!
  });

  // Remove junk slots where batch_id looks wrong (e.g. "Batch Batch", "Batch undefined")
  const del1 = await client.execute("DELETE FROM timetable_slots WHERE batch_id LIKE '%Batch Batch%'");
  const del2 = await client.execute("DELETE FROM timetable_slots WHERE batch_id LIKE '%undefined%'");
  const del3 = await client.execute("DELETE FROM timetable_slots WHERE course_name IS NULL OR course_name = ''");
  console.log('Cleaned junk slots.');

  // Show what remains
  const res = await client.execute('SELECT DISTINCT batch_id, teacher_id, timing, course_name FROM timetable_slots ORDER BY batch_id');
  console.log('\nClean timetable_slots:');
  for (const r of res.rows) {
    console.log(` - ${r.batch_id} | ${r.teacher_id} | ${r.timing} | ${r.course_name}`);
  }
}

cleanAndVerify().catch(console.error);
