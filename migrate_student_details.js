import { createClient } from '@libsql/client';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  console.log("Migrating schema...");
  try {
    await db.execute("ALTER TABLE students ADD COLUMN batch_number TEXT");
  } catch (e) { console.log(e.message); }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN course TEXT");
  } catch (e) { console.log(e.message); }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN topic_completed TEXT");
  } catch (e) { console.log(e.message); }

  console.log("Reading Excel...");
  const workbook = xlsx.readFile('Student_Data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  let updated = 0;
  for (const row of data) {
    if (!row['ID'] || !row['Gmails']) continue;
    const email = row['Gmails'].trim();
    const batch = row['Batch'] ? String(row['Batch']) : '';
    const course = row['Course'] ? String(row['Course']) : '';
    const topic = row['Topic Completed'] ? String(row['Topic Completed']) : '';

    try {
      const res = await db.execute({
        sql: "UPDATE students SET batch_number = ?, course = ?, topic_completed = ? WHERE portal_login_email = ?",
        args: [batch, course, topic, email]
      });
      if (res.rowsAffected > 0) updated++;
    } catch (e) {
      console.error(`Failed to update ${email}:`, e.message);
    }
  }
  
  console.log(`Updated ${updated} students with details.`);
}

run().catch(console.error);
