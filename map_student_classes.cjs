const XLSX = require('xlsx');
const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  const filePath = path.join(__dirname, 'Student_Data.xlsx');
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  console.log(`Found ${rows.length} students in Excel`);

  // Get all students from DB by email
  const dbStudents = await client.execute(
    "SELECT id, email, name FROM users WHERE LOWER(role) IN ('student')"
  );
  const emailToId = {};
  for (const row of dbStudents.rows) {
    emailToId[row.email.toLowerCase().trim()] = row.id;
  }
  console.log(`Found ${dbStudents.rows.length} students in DB`);

  // Get the "Class N" modules which represent each individual class session
  // These are mod_class_1 through mod_class_14 mapped to course_ds_101
  const classModules = await client.execute(
    "SELECT id, title, sequence_order FROM modules WHERE id LIKE 'mod_class_%' ORDER BY sequence_order ASC"
  );
  console.log(`Found ${classModules.rows.length} class modules (mod_class_*)`);
  
  // Build a map: class number -> module_id
  // mod_class_1 = class 1, mod_class_2 = class 2, etc.
  const classNumToModuleId = {};
  for (const m of classModules.rows) {
    const match = m.id.match(/mod_class_(\d+)/);
    if (match) {
      classNumToModuleId[parseInt(match[1])] = m.id;
    }
  }

  // Get classes inside each module (each mod_class_N should have one class)
  const allClasses = await client.execute(
    "SELECT id, module_id, order_index FROM classes ORDER BY order_index ASC"
  );
  
  // Map module_id -> first class in that module
  const moduleToFirstClass = {};
  for (const cls of allClasses.rows) {
    if (!moduleToFirstClass[cls.module_id]) {
      moduleToFirstClass[cls.module_id] = cls.id;
    }
  }

  const courseId = 'course_ds_101'; // The course using mod_class_* modules

  let mapped = 0;
  let skipped = 0;

  // Process unique students (by email, avoid duplicates from the Excel's multiple batch sections)
  const processedEmails = new Set();

  for (const row of rows) {
    const email = (row['Gmails'] || '').toLowerCase().trim();
    const classesCompleted = parseInt(row['Class Number (Modules Data)']) || 0;
    const studentName = row['Names'];

    if (!email || processedEmails.has(email)) continue;
    processedEmails.add(email);

    const studentId = emailToId[email];
    if (!studentId) {
      console.log(`  NOT IN DB: ${studentName} (${email})`);
      skipped++;
      continue;
    }

    // Mark class 1 through classesCompleted as completed in student_progress
    let insertedCount = 0;
    for (let classNum = 1; classNum <= classesCompleted; classNum++) {
      const moduleId = classNumToModuleId[classNum];
      if (!moduleId) continue;
      
      // The lesson_id is the module_id itself (since student_progress.lesson_id = class/module id)
      // Use both module id and first class id in that module
      const lessonId = moduleToFirstClass[moduleId] || moduleId;

      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO student_progress (id, student_id, lesson_id, completed, score) 
                VALUES (?, ?, ?, 1, 100)`,
          args: [`prog_${studentId}_${classNum}`, studentId, lessonId]
        });
        insertedCount++;
      } catch (e) {
        if (!e.message.includes('UNIQUE')) {
          console.log(`  Error for ${email} class ${classNum}:`, e.message);
        }
      }
    }

    // Ensure student is in onboardings for this course
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO onboardings (id, student_name, email, phone, course_id, batch_id, fee_paid, joining_date, status, lead_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `onboard_${studentId}`,
          studentName,
          email,
          row['Phone number'] ? String(row['Phone number']) : '',
          courseId,
          `Batch ${row['Batch'] || 1}`,
          row['Fee'] || 0,
          '',
          row['Status'] || 'Ongoing',
          null
        ]
      });
    } catch (e) { /* ignore */ }

    console.log(`  ✓ ${studentName} (${email}): ${insertedCount}/${classesCompleted} classes marked complete`);
    mapped++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Mapped: ${mapped}, Skipped: ${skipped}`);

  // Verify
  const total = await client.execute("SELECT COUNT(*) as c FROM student_progress");
  console.log(`Total student_progress rows in DB: ${total.rows[0].c}`);
}

main().catch(console.error);
