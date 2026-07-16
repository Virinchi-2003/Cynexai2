const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../cynexai-website/cynexai.db');
const excelPath = path.resolve(__dirname, '../cynexai-website/Student_Data.xlsx');

const db = new sqlite3.Database(dbPath);

async function run() {
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log('Excel Students:');
  const validIds = new Set();
  const validNames = new Set();
  for (const row of data) {
    if (row['Student ID']) {
      validIds.add(row['Student ID'].trim());
      validNames.add(row['Name'] ? row['Name'].trim() : '');
      console.log(row['Student ID'], row['Name']);
    }
  }

  db.all("SELECT u.id, u.name, u.email, s.id as student_id FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.role = 'Student'", (err, rows) => {
    if (err) throw err;
    console.log('\nDB Students:');
    
    const toDeleteUserIds = [];
    
    for (const row of rows) {
      console.log(row);
      // We will delete students whose names start with "Student CAI" and aren't matched exactly with valid ones,
      // or duplicate ones.
      // Or any student not in the Excel list if they have a CAI ID.
      let nameMatches = false;
      let idMatches = false;
      
      // Attempt to check if name matches one in Excel
      for (const validName of validNames) {
        if (validName && row.name.toLowerCase().includes(validName.toLowerCase())) {
          nameMatches = true;
          break;
        }
      }
      
      // Attempt to check if email has CAI
      const emailIdMatch = row.email.match(/cai(\d+)@/i);
      if (emailIdMatch) {
        const potentialId = 'CAI' + emailIdMatch[1];
        if (validIds.has(potentialId)) {
          idMatches = true;
        }
      }

      // If it looks like a test user (Student CAI...) and is not an exact match to a real user in Excel, or is a duplicate:
      if (row.name.startsWith('Student CAI')) {
        toDeleteUserIds.push(row.id);
      } else if (!nameMatches && !idMatches && row.name !== 'Geethanjali') {
         // keep geethanjali as per some previous instructions, but let's see.
      }
    }
    
    console.log('\nDeleting the following user IDs (test students):', toDeleteUserIds);
    
    if (toDeleteUserIds.length > 0) {
      const placeholders = toDeleteUserIds.map(() => '?').join(',');
      db.run(`DELETE FROM students WHERE user_id IN (${placeholders})`, toDeleteUserIds, (err) => {
        if (err) console.error(err);
        db.run(`DELETE FROM users WHERE id IN (${placeholders})`, toDeleteUserIds, (err) => {
           if (err) console.error(err);
           console.log('Cleanup complete.');
        });
      });
    } else {
      console.log('No test students found to delete.');
    }
  });
}

run();
