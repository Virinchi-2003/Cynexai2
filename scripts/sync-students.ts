import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manually load env from .env.local or .env
const envPathLocal = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPathLocal)) dotenv.config({ path: envPathLocal });
else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || '',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
});

async function run() {
  console.log('Starting DB Synchronization...');
  
  // Ensure student_progress has created_at
  try {
    await client.execute('ALTER TABLE student_progress ADD COLUMN created_at TEXT');
  } catch (e) {
    // Column might already exist
  }

  // 1. Sync Names from users -> students
  console.log('Syncing student names...');
  await client.execute(`
    UPDATE students 
    SET name = (SELECT name FROM users WHERE users.email = students.portal_login_email) 
    WHERE name IS NULL OR name = ''
  `);
  console.log('Names synced!');

  // 2. Map Legacy Progress to Course CMS
  console.log('Mapping legacy JSON progress to Course CMS...');
  
  // Get all users who have classes_attended_json and are students
  const res = await client.execute(`
    SELECT u.email, s.classes_attended_json, s.id as student_id, s.course
    FROM users u
    JOIN students s ON u.email = s.portal_login_email
    WHERE u.role = 'Student' AND s.classes_attended_json IS NOT NULL AND s.classes_attended_json != '{}'
  `);
  
  const defaultCurriculum: Record<string, string[]> = {
    'Data Science with AI': ['Python', 'SQL', 'Machine Learning', 'Artificial Intelligence', 'PowerBI', 'Excel', 'Soft Skills', 'SDLC'],
    'Full Stack Web Development': ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git/GitHub', 'Deployment'],
    'Python Full Stack': ['Python Basics', 'Django/Flask', 'HTML/CSS', 'JavaScript', 'Database Design', 'REST APIs', 'Version Control', 'Deployment'],
    'Cyber Security': ['Networking Basics', 'Ethical Hacking', 'Cryptography', 'Web App Security', 'Network Security', 'Incident Response', 'Malware Analysis', 'Risk Management'],
    'Cloud Computing (AWS/Azure)': ['Cloud Concepts', 'Compute Services', 'Storage Solutions', 'Networking', 'Security & IAM', 'Databases', 'Serverless', 'Cost Management'],
    'UI/UX Design': ['Design Principles', 'User Research', 'Wireframing', 'Prototyping', 'Figma', 'Visual Design', 'Usability Testing', 'Portfolio Building'],
    'Digital Marketing': ['SEO', 'Content Marketing', 'Social Media', 'Email Marketing', 'PPC & SEM', 'Google Analytics', 'Strategy', 'Campaign Management'],
    'Blockchain Development': ['Blockchain Basics', 'Smart Contracts', 'Solidity', 'Ethereum', 'Web3.js/Ethers.js', 'DApps', 'Tokens & NFTs', 'Security Best Practices'],
    'App Development (Flutter/React Native)': ['Dart/JS Basics', 'UI Layouts', 'State Management', 'Navigation', 'API Integration', 'Local Storage', 'Firebase', 'App Store Deployment']
  };

  for (const row of res.rows) {
    const studentId = row.student_id as string;
    const courseName = (row.course as string) || 'Data Science with AI';
    let progress: Record<string, number> = {};
    try { progress = JSON.parse((row.classes_attended_json as string) || '{}'); } catch(e) {}
    
    if (Object.keys(progress).length === 0) continue;

    console.log(`Processing student: ${row.email} (Course: ${courseName})`);

    // Ensure course exists
    let courseRes = await client.execute({ sql: `SELECT id FROM courses WHERE title = ?`, args: [courseName] });
    let courseId = courseRes.rows[0]?.id as string;
    
    if (!courseId) {
      courseId = `crs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.execute({
        sql: `INSERT INTO courses (id, title, status) VALUES (?, ?, 'Active')`,
        args: [courseId, courseName]
      });
      console.log(`Created course: ${courseName}`);
    }

    const modulesToMap = defaultCurriculum[courseName] || Object.keys(progress);
    
    // Ensure modules exist for this course
    for (let i = 0; i < modulesToMap.length; i++) {
      const modName = modulesToMap[i];
      let modRes = await client.execute({ sql: `SELECT id FROM modules WHERE title = ?`, args: [modName] });
      let modId = modRes.rows[0]?.id as string;

      if (!modId) {
        modId = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await client.execute({
          sql: `INSERT INTO modules (id, title, description) VALUES (?, ?, ?)`,
          args: [modId, modName, `${modName} concepts`]
        });
      }

      // Ensure mapping exists
      let mappingRes = await client.execute({
        sql: `SELECT * FROM course_module_mapping WHERE course_id = ? AND module_id = ?`,
        args: [courseId, modId]
      });
      if (mappingRes.rows.length === 0) {
        await client.execute({
          sql: `INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)`,
          args: [courseId, modId, i]
        });
      }

      // Check classes completed for this module from legacy JSON
      const classesCompleted = progress[modName] || 0;
      if (classesCompleted > 0) {
        // Find existing classes for this module to map against
        let classRes = await client.execute({
          sql: `SELECT id FROM classes WHERE module_id = ? ORDER BY order_index ASC`,
          args: [modId]
        });

        // Ensure at least classesCompleted number of classes exist
        for (let j = classRes.rows.length; j < classesCompleted; j++) {
          const classId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await client.execute({
            sql: `INSERT INTO classes (id, module_id, title, order_index) VALUES (?, ?, ?, ?)`,
            args: [classId, modId, `${modName} Class ${j + 1}`, j]
          });
          classRes.rows.push({ id: classId } as any);
        }

        // Insert into student_progress for the completed classes
        for (let j = 0; j < classesCompleted; j++) {
          const lessonId = classRes.rows[j].id as string;
          // Check if already completed
          let progRes = await client.execute({
            sql: `SELECT id FROM student_progress WHERE student_id = ? AND lesson_id = ? AND completed = 1`,
            args: [studentId, lessonId]
          });

          if (progRes.rows.length === 0) {
            const spId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await client.execute({
              sql: `INSERT INTO student_progress (id, student_id, lesson_id, completed, created_at) VALUES (?, ?, ?, 1, ?)`,
              args: [spId, studentId, lessonId, new Date().toISOString()]
            });
          }
        }
      }
    }
  }

  console.log('Progress mapped successfully!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
