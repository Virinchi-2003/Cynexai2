import { createClient } from '@libsql/client';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import moment from 'moment';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
  console.log("Migrating schema...");
  try {
    await db.execute("ALTER TABLE students ADD COLUMN joining_date TEXT");
  } catch (e) { console.log(e.message); }

  console.log("Reading Excel...");
  const workbook = xlsx.readFile('Student_Data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  let updated = 0;
  for (const row of data) {
    const email = row['Gmails']?.trim();
    if (!email) continue;
    
    // Excel dates might be numbers or strings
    let joinDateStr = '';
    const rawDate = row['Joining date'];
    if (rawDate) {
      if (typeof rawDate === 'number') {
        // Excel epoch is 1900-01-01
        const excelDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
        joinDateStr = excelDate.toISOString().split('T')[0];
      } else {
        // Try parsing string if it's DD/MM/YYYY or DD-MM-YYYY
        const m = moment(rawDate, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'], true);
        if (m.isValid()) {
            joinDateStr = m.format('YYYY-MM-DD');
        } else {
            joinDateStr = String(rawDate);
        }
      }
    }
    
    if (joinDateStr) {
        try {
          const res = await db.execute({
            sql: "UPDATE students SET joining_date = ? WHERE portal_login_email = ?",
            args: [joinDateStr, email]
          });
          if (res.rowsAffected > 0) updated++;
        } catch (e) {
          console.error(`Failed to update ${email}:`, e.message);
        }
    }
  }
  
  console.log(`Updated ${updated} students with joining date.`);
}

run().catch(console.error);
