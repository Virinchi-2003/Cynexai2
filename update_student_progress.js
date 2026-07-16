import { createClient } from '@libsql/client';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  console.log("Reading Excel...");
  const workbook = xlsx.readFile('Student_Data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const progressMap = {};

  for (const row of data) {
    const email = row['Gmails']?.trim();
    if (!email) continue;
    const topic = row['Topic Completed'];
    let classes = row['Classes completed'];
    
    let module = 'General';
    if (topic) {
      if (['Operators intro', 'Datatypes completed', 'Slicing process', 'Oops', 'Libraries comp'].includes(topic)) {
        module = 'Python';
      } else if (['Sql statements', 'filtering', 'Windows Functions'].includes(topic)) {
        module = 'SQL';
      }
    }
    
    if (!progressMap[email]) progressMap[email] = {};

    if (classes !== undefined && classes !== null && classes !== '') {
      classes = Number(classes);
      if (!progressMap[email][module] || progressMap[email][module] < classes) {
        progressMap[email][module] = classes;
      }
    } else {
      if (progressMap[email][module] === undefined) {
        progressMap[email][module] = 0;
      }
    }
  }

  let updated = 0;
  for (const [email, progress] of Object.entries(progressMap)) {
    try {
      const jsonStr = JSON.stringify(progress);
      const res = await db.execute({
        sql: "UPDATE students SET classes_attended_json = ? WHERE portal_login_email = ?",
        args: [jsonStr, email]
      });
      if (res.rowsAffected > 0) updated++;
    } catch (e) {
      console.error(`Failed to update ${email}:`, e.message);
    }
  }
  
  console.log(`Updated progress for ${updated} students.`);
}

run().catch(console.error);
