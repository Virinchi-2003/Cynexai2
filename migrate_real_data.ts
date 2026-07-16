import * as XLSX from 'xlsx';
import { createClient } from '@libsql/client';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;
const encryptPassword = (p: string) => CryptoJS.AES.encrypt(p, SECRET_KEY as string).toString();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL!,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN!
});

function readSheet(file: string) {
  const buf = fs.readFileSync(file);
  return XLSX.read(buf);
}

// --- Teacher ID mapping ---
const TEACHER_MAP: Record<string, string> = {
  'venkatesh': 'usr_venkatesh',
  'prudhvi': 'usr_prudhvi',
  'leonard': 'usr_manager',
};
function getTeacherId(name: string): string {
  const key = (name || '').toLowerCase().trim();
  for (const [k, v] of Object.entries(TEACHER_MAP)) {
    if (key.includes(k)) return v;
  }
  return 'usr_venkatesh'; // default
}

async function run() {
  console.log('\n====================================');
  console.log(' CynexAI — Real Data Migration');
  console.log('====================================\n');

  // ------------------------------------------------
  // STEP 1: WIPE OLD MOCK DATA
  // ------------------------------------------------
  console.log('Step 1: Clearing old mock data...');
  const wipeStmts = [
    'DELETE FROM student_progress',
    'DELETE FROM classes',
    'DELETE FROM course_module_mapping',
    'DELETE FROM modules',
    'DELETE FROM timetable_slots',
  ];
  for (const sql of wipeStmts) {
    try { await client.execute(sql); } catch(e) {}
  }
  console.log('✓ Old data cleared.\n');

  // ------------------------------------------------
  // STEP 2: ENSURE COURSE EXISTS
  // ------------------------------------------------
  const COURSE_ID = 'course_ds_ai';
  await client.execute({ sql: 'DELETE FROM courses WHERE id = ?', args: [COURSE_ID] });
  await client.execute({
    sql: 'INSERT INTO courses (id, title, description, price, status) VALUES (?, ?, ?, ?, ?)',
    args: [COURSE_ID, 'Data Science with AI', 'Comprehensive Data Science Program', 45000, 'published']
  });

  // ------------------------------------------------
  // STEP 3: SEED CURRICULUM FROM Modules Data.xlsx
  // ------------------------------------------------
  console.log('Step 2: Seeding curriculum from Modules Data.xlsx...');
  const modulesWb = readSheet('Modules Data.xlsx');
  const moduleSheets = modulesWb.SheetNames; // Python, AI, ML, SQL, etc.

  // Teacher assignments for modules
  const MODULE_TEACHER_MAP: Record<string, string> = {
    'SQL': 'usr_venkatesh',
    'Python': 'usr_prudhvi',
    'ML': 'usr_venkatesh',
    'AI': 'usr_venkatesh',
    'Excel': 'usr_venkatesh',
    'SDLC': 'usr_venkatesh',
    'Power BI': 'usr_venkatesh',
    'Softskills': 'usr_venkatesh',
  };

  let totalClasses = 0;
  const moduleIds: Record<string, string> = {};

  for (let i = 0; i < moduleSheets.length; i++) {
    const sheetName = moduleSheets[i];
    const moduleId = `mod_${sheetName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    moduleIds[sheetName] = moduleId;
    const teacherId = MODULE_TEACHER_MAP[sheetName] || 'usr_venkatesh';

    await client.execute({
      sql: 'INSERT INTO modules (id, title, description, instructor_id) VALUES (?, ?, ?, ?)',
      args: [moduleId, sheetName, `${sheetName} module for the Data Science with AI course`, teacherId]
    });

    await client.execute({
      sql: 'INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)',
      args: [COURSE_ID, moduleId, i]
    });

    // Parse classes from this sheet
    const ws = modulesWb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws) as Array<Record<string, any>>;

    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      const classLabel = String(row['Class'] || `Class ${j + 1}`).replace('Class ', '').trim();
      const classNum = parseInt(classLabel) || (j + 1);
      const classId = `${moduleId}_class_${classNum}`;
      const topics = row['Topics'] ? String(row['Topics']) : `${sheetName} - Class ${classNum}`;
      const title = `Class ${classNum}`;

      await client.execute({
        sql: 'INSERT INTO classes (id, module_id, title, description, type, status, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [classId, moduleId, title, topics, 'live', 'upcoming', classNum]
      });
      totalClasses++;
    }

    console.log(`  ✓ Module "${sheetName}": ${rows.length} classes`);
  }
  console.log(`\n✓ ${moduleSheets.length} modules, ${totalClasses} total classes seeded.\n`);

  // ------------------------------------------------
  // STEP 4: SEED TIMETABLE & STUDENT PROGRESS FROM Student_Data.xlsx
  // ------------------------------------------------
  console.log('Step 3: Seeding timetable and student progress from Student_Data.xlsx...');
  const studentWb = readSheet('Student_Data.xlsx');
  const studentWs = studentWb.Sheets[studentWb.SheetNames[0]];
  const students = XLSX.utils.sheet_to_json(studentWs) as Array<Record<string, any>>;

  // Create timetable_slots table if it doesn't exist
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS timetable_slots (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        day_of_week TEXT,
        start_time TEXT,
        end_time TEXT,
        course_name TEXT,
        teacher_id TEXT,
        timing TEXT
      )
    `);
  } catch(e) {}

  // Group students by Batch + Teacher + Timing for timetable
  const timetableGroups: Record<string, { batch: string | number, teacher: string, timing: string, module: string }> = {};
  for (const s of students) {
    const batch = s['Batch'];
    const teacher = (s['Updated Teacher'] || s['Teacher'] || '').toString();
    const timing = (s['Updated Timing'] || s['Timing'] || '').toString();
    const module = (s['Modules'] || '').toString();
    const key = `${batch}__${teacher}__${timing}`;
    if (!timetableGroups[key]) {
      timetableGroups[key] = { batch, teacher, timing, module };
    }
  }

  // Insert timetable slots (Mon-Fri)
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let slotCount = 0;
  for (const [key, g] of Object.entries(timetableGroups)) {
    const teacherId = getTeacherId(g.teacher);
    const [startRaw, endRaw] = g.timing.split('-');
    const start = (startRaw || '10').replace('am','').replace('pm','').trim();
    const end = (endRaw || '11').replace('am','').replace('pm','').trim();

    for (const day of DAYS) {
      const slotId = `slot_b${g.batch}_${day}_${teacherId}_${start}`.replace(/[^a-z0-9_]/gi, '');
      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO timetable_slots (id, batch_id, day_of_week, start_time, end_time, course_name, teacher_id, timing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [slotId, `Batch ${g.batch}`, day, start, end, g.module, teacherId, g.timing]
        });
        slotCount++;
      } catch(e) {}
    }
  }
  console.log(`  ✓ ${slotCount} timetable slots created.`);

  // ------------------------------------------------
  // STEP 5: STUDENT PROGRESS
  // ------------------------------------------------
  let progressCount = 0;
  for (const s of students) {
    const email = ((s['Gmails'] || '')).toString().toLowerCase().trim();
    const currentModule = (s['Modules'] || '').toString();
    const classesCompleted = parseInt(String(s['Classes completed'] || s['Class Number (Modules Data)'] || 0)) || 0;
    
    if (!email || !currentModule || classesCompleted === 0) continue;

    // Find the user in DB
    const userRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (userRes.rows.length === 0) {
      // Try by student portal email (cai-style)
      const id = (s['ID'] || '').toString().toLowerCase();
      const portalEmail = `${id}@student.cynexai.com`;
      const altRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [portalEmail] });
      if (altRes.rows.length === 0) continue;
      const userId = altRes.rows[0].id as string;
      const moduleId = moduleIds[currentModule];
      if (!moduleId) continue;
      
      for (let c = 1; c <= classesCompleted; c++) {
        const classId = `${moduleId}_class_${c}`;
        const progId = `prog_${userId}_${classId}`;
        try {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO student_progress (id, student_id, lesson_id, completed, score) VALUES (?, ?, ?, 1, 100)',
            args: [progId, userId, classId]
          });
          progressCount++;
        } catch(e) {}
      }
    } else {
      const userId = userRes.rows[0].id as string;
      const moduleId = moduleIds[currentModule];
      if (!moduleId) continue;
      
      for (let c = 1; c <= classesCompleted; c++) {
        const classId = `${moduleId}_class_${c}`;
        const progId = `prog_${userId}_${classId}`;
        try {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO student_progress (id, student_id, lesson_id, completed, score) VALUES (?, ?, ?, 1, 100)',
            args: [progId, userId, classId]
          });
          progressCount++;
        } catch(e) {}
      }
    }
  }
  console.log(`  ✓ ${progressCount} student progress records inserted.`);
  console.log(`\n✓ Timetable and progress seeded for ${students.length} students.\n`);

  // ------------------------------------------------
  // STEP 6: VERIFY
  // ------------------------------------------------
  console.log('Step 4: Verifying...');
  const modCount = await client.execute('SELECT COUNT(*) as cnt FROM modules');
  const classCount = await client.execute('SELECT COUNT(*) as cnt FROM classes');
  const progCount = await client.execute('SELECT COUNT(*) as cnt FROM student_progress');
  const slotCountRes = await client.execute('SELECT COUNT(*) as cnt FROM timetable_slots');
  const venkateshSlots = await client.execute({ sql: 'SELECT batch_id, day_of_week, start_time, timing FROM timetable_slots WHERE teacher_id = ? LIMIT 5', args: ['usr_venkatesh'] });

  console.log(`\n  Modules in DB:          ${modCount.rows[0].cnt}`);
  console.log(`  Classes in DB:          ${classCount.rows[0].cnt}`);
  console.log(`  Student Progress rows:  ${progCount.rows[0].cnt}`);
  console.log(`  Timetable Slots:        ${slotCountRes.rows[0].cnt}`);
  console.log(`\n  Venkatesh's first 5 timetable slots:`);
  for (const r of venkateshSlots.rows) {
    console.log(`    - ${r.batch_id} | ${r.day_of_week} | ${r.timing}`);
  }

  console.log('\n====================================');
  console.log('  Migration Complete! ✅');
  console.log('====================================\n');
}

run().catch(console.error);
