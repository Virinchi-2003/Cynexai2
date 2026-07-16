import { createClient } from '@libsql/client';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const workbook = xlsx.readFile('Student_Data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('Excel Students:');
const validIds = new Set();
const validNames = new Set();
for (const row of data) {
  if (row['Student ID']) {
    validIds.add(row['Student ID'].toString().trim());
    validNames.add(row['Name'] ? row['Name'].trim() : '');
  }
}
console.log(`Loaded ${validIds.size} unique valid IDs from Excel`);

async function run() {
  const result = await db.execute("SELECT u.id, u.name, u.email, s.id as student_id FROM users u LEFT JOIN students s ON u.email = s.portal_login_email WHERE u.role = 'Student'");
  const rows = result.rows;
  
  const toDeleteUserIds = [];
  
  for (const row of rows) {
    let nameMatches = false;
    let idMatches = false;
    
    const rowName = row.name || '';
    const rowEmail = row.email || '';

    // Check against Excel valid names
    for (const validName of validNames) {
      if (validName && rowName.toLowerCase().includes(validName.toLowerCase())) {
        nameMatches = true;
        break;
      }
    }
    
    // Check against Excel valid IDs (from email)
    const emailIdMatch = rowEmail.match(/cai(\d+)@/i);
    if (emailIdMatch) {
      const potentialId = 'CAI' + emailIdMatch[1];
      if (validIds.has(potentialId)) {
        idMatches = true;
      }
    }

    // Identify duplicates or test students
    if (rowName.startsWith('Student CAI') || rowName.startsWith('Student test')) {
      if (!nameMatches && !idMatches) {
        toDeleteUserIds.push(row.id);
      }
    } else if (!nameMatches && !idMatches && rowName !== 'Geethanjali' && rowName !== 'G.Nikitha' && rowName !== 'G. Raja Gopal' && rowName !== 'Venkat') {
      toDeleteUserIds.push(row.id);
    }
  }
  
  console.log('\nDeleting the following user IDs (test students):', toDeleteUserIds.length);
  
  if (toDeleteUserIds.length > 0) {
    for (const id of toDeleteUserIds) {
      console.log('Deleting', id);
      try {
        await db.execute({ sql: "DELETE FROM students WHERE portal_login_email = (SELECT email FROM users WHERE id = ?)", args: [id] });
        await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
      } catch (e) {
        console.error('Error deleting', id, e);
      }
    }
    console.log('Cleanup complete.');
  } else {
    console.log('No test students found to delete.');
  }
}

run().catch(console.error);
