import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  console.log("Connecting to Turso Database...");

  try {
    const stmts = [
      "DROP TABLE IF EXISTS leads",
      "DROP TABLE IF EXISTS sales",
      "DROP TABLE IF EXISTS manager_approvals",
      "DROP TABLE IF EXISTS onboardings",
      "DROP TABLE IF EXISTS students",
      "DROP TABLE IF EXISTS courses",
      "DROP TABLE IF EXISTS modules",
      "DROP TABLE IF EXISTS course_module_mapping",
      "DROP TABLE IF EXISTS classes",
      "DROP TABLE IF EXISTS student_progress",
      "CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT, phone TEXT, course_interest TEXT, source TEXT, bucket_stage TEXT, assigned_to TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, lead_id TEXT, course_id TEXT, amount_paid REAL, total_fee REAL, payment_mode TEXT, transaction_ref TEXT, sales_rep_id TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS manager_approvals (id TEXT PRIMARY KEY, sale_id TEXT, status TEXT, approver_id TEXT, decided_at DATETIME)",
      "CREATE TABLE IF NOT EXISTS onboardings (id TEXT PRIMARY KEY, sale_id TEXT, batch_id TEXT, teacher_id TEXT, mode TEXT, joining_date DATETIME, remarks TEXT)",
      "CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, onboarding_id TEXT, student_code TEXT, portal_login_email TEXT, status TEXT)",
      "CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT, description TEXT, instructor_id TEXT, price REAL, status TEXT DEFAULT 'published', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS modules (id TEXT PRIMARY KEY, title TEXT, description TEXT, instructor_id TEXT)",
      "CREATE TABLE IF NOT EXISTS course_module_mapping (course_id TEXT, module_id TEXT, order_index INTEGER)",
      "CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, module_id TEXT, title TEXT, description TEXT, type TEXT, status TEXT, ai_ppt_markdown TEXT, ai_script TEXT, ai_keypoints TEXT, youtube_video_id TEXT, order_index INTEGER)",
      "CREATE TABLE IF NOT EXISTS student_progress (id TEXT PRIMARY KEY, student_id TEXT, lesson_id TEXT, completed INTEGER, score INTEGER)"
    ];
    
    for (const stmt of stmts) {
      try {
        await client.execute(stmt);
      } catch (e) {
        // ignore drop errors
      }
    }
    console.log("Schema verified and tables cleared.");

    const studentsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'students_seed.json'), 'utf-8'));
    const timetableData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/timetable.json'), 'utf-8'));

    const courseId = 'course_ds_ai';
    await client.execute({
      sql: 'INSERT INTO courses (id, title, description, price) VALUES (?, ?, ?, ?)',
      args: [courseId, 'Data Science with AI', 'Comprehensive data science program', 45000]
    });

    const insertedModules = new Set();
    
    console.log("Seeding Timetable classes...");
    let classCount = 0;
    for (const [teacherId, data] of Object.entries(timetableData)) {
      for (const cls of data.timetable) {
        const moduleName = cls.course; // mapping course name to module name
        const modId = 'mod_' + moduleName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!insertedModules.has(modId)) {
          try {
            await client.execute({
              sql: 'INSERT INTO modules (id, title, description, instructor_id) VALUES (?, ?, ?, ?)',
              args: [modId, moduleName, `Module covering ${moduleName}`, teacherId]
            });
            await client.execute({
              sql: 'INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)',
              args: [courseId, modId, insertedModules.size]
            });
          } catch (e) {}
          insertedModules.add(modId);
        }
        
        const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cls.day] || 'Day';
        const classId = `class_${cls.batchId}_${modId}_${cls.day}_${cls.time.replace(/[^a-z0-9]/gi, '')}`;
        try {
          await client.execute({
            sql: 'INSERT INTO classes (id, module_id, title, description, type, status, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [classId, modId, `${moduleName} Session - ${cls.batchName}`, `${dayStr} at ${cls.time}`, 'live', 'upcoming', classCount++]
          });
        } catch (e) {}
      }
    }

    console.log("Seeding Students and CRM chain...");
    for (const s of studentsData) {
      const leadId = `lead_${s.id}`;
      const saleId = `sale_${s.id}`;
      const apprId = `appr_${s.id}`;
      const onbId = `onb_${s.id}`;
      
      await client.execute({
        sql: 'INSERT INTO leads (id, name, phone, course_interest, source, bucket_stage, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [leadId, s.name, '9000000000', s.course, 'Excel Import', 'H', 'usr_dev_sales']
      });

      await client.execute({
        sql: 'INSERT INTO sales (id, lead_id, course_id, amount_paid, total_fee, payment_mode, transaction_ref, sales_rep_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [saleId, leadId, courseId, s.amount_paid, s.total_fee, 'Bank Transfer', 'EXCEL', 'usr_dev_sales']
      });

      await client.execute({
        sql: 'INSERT INTO manager_approvals (id, sale_id, status, approver_id) VALUES (?, ?, ?, ?)',
        args: [apprId, saleId, 'Approved', 'usr_dev_manager']
      });

      const dateStr = String(s.joining_date).substring(0, 10);
      await client.execute({
        sql: 'INSERT INTO onboardings (id, sale_id, batch_id, teacher_id, mode, joining_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [onbId, saleId, s.batch, 'usr_venkatesh', 'Online', dateStr, 'Imported from Excel']
      });

      const studentCode = s.id.includes('_') ? `CNX-26-${s.id.split('_')[1].padStart(4, '0')}` : s.id;
      const email = `${studentCode.toLowerCase()}@student.cynexai.com`;
      await client.execute({
        sql: 'INSERT INTO students (id, onboarding_id, student_code, portal_login_email, status) VALUES (?, ?, ?, ?, ?)',
        args: [s.id, onbId, studentCode, email, 'Active']
      });
    }

    console.log("Seeding complete!");

  } catch (err) {
    console.error("Fatal Error during seeding:", err);
  }
}

main();
