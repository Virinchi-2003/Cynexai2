/**
 * CYNEXAI - DEMO SETUP SCRIPT
 * Run: node demo_setup.js
 * Sets up a complete live class demo environment.
 */
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log('\n🚀 CynexAI Demo Setup Starting...\n');

    // ─── 1. Show all available classes ───────────────────────────────────────
    const allClasses = await db.execute("SELECT id, title, type, status FROM classes LIMIT 20");
    console.log(`📋 Found ${allClasses.rows.length} classes in DB:`);
    allClasses.rows.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.id}] "${c.title}" | type=${c.type} | status=${c.status}`);
    });

    if (allClasses.rows.length === 0) {
      console.log('❌ No classes found! Run seed_from_excel.py first.');
      process.exit(1);
    }

    // ─── 2. Pick the first class and set it to LIVE ───────────────────────────
    const target = allClasses.rows[0];
    const jitsiRoom = `CynexAI-Class-${target.id}`;
    const jitsiLink = `https://meet.jit.si/${jitsiRoom}`;

    console.log(`\n🎯 Setting class as LIVE: "${target.title}"`);
    console.log(`   Jitsi Room: ${jitsiLink}`);

    await db.execute({
      sql: `UPDATE classes 
            SET type = 'live', 
                status = 'draft', 
                meet_link = ?,
                ai_ppt_markdown = NULL, 
                ai_script = NULL, 
                ai_keypoints = NULL, 
                ai_summary = NULL,
                youtube_video_id = NULL
            WHERE id = ?`,
      args: [jitsiLink, target.id]
    });
    console.log('   ✅ Class updated to LIVE type!');

    // ─── 3. Ensure timetable table has demo records ───────────────────────────
    try {
      await db.execute(`CREATE TABLE IF NOT EXISTS timetables (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        teacher_id TEXT,
        room_or_link TEXT,
        day_of_week TEXT,
        start_time TEXT,
        end_time TEXT
      )`);

      const ttCount = await db.execute("SELECT COUNT(*) as count FROM timetables");
      if (Number(ttCount.rows[0].count) === 0) {
        const slots = [
          ['tt_1', 'Data Science Batch A', 'usr_teacher', jitsiLink, 'Monday', '10:00 AM', '11:30 AM'],
          ['tt_2', 'Aider AI Batch', 'usr_teacher', jitsiLink, 'Monday', '02:00 PM', '03:30 PM'],
          ['tt_3', 'Caveman Dev Batch', 'usr_teacher', jitsiLink, 'Tuesday', '11:00 AM', '12:30 PM'],
          ['tt_4', 'Data Science Batch B', 'usr_teacher', jitsiLink, 'Tuesday', '03:00 PM', '04:30 PM'],
          ['tt_5', 'Data Science Batch A', 'usr_teacher', jitsiLink, 'Wednesday', '10:00 AM', '11:30 AM'],
          ['tt_6', 'Aider AI Batch', 'usr_teacher', jitsiLink, 'Thursday', '09:00 AM', '10:30 AM'],
          ['tt_7', 'Caveman Dev Batch', 'usr_teacher', jitsiLink, 'Thursday', '02:00 PM', '03:30 PM'],
          ['tt_8', 'Data Science Batch A', 'usr_teacher', jitsiLink, 'Friday', '10:00 AM', '11:30 AM'],
          ['tt_9', 'Data Science Batch B', 'usr_teacher', jitsiLink, 'Friday', '12:00 PM', '01:30 PM'],
          ['tt_10', 'All Batches Review', 'usr_teacher', jitsiLink, 'Saturday', '11:00 AM', '12:30 PM'],
        ];
        for (const s of slots) {
          await db.execute({
            sql: `INSERT OR IGNORE INTO timetables (id, batch_id, teacher_id, room_or_link, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: s
          });
        }
        console.log('\n📅 Timetable seeded with 10 batch slots!');
      } else {
        console.log('\n📅 Timetable already has records. Skipping seed.');
      }
    } catch (e) {
      console.warn('Timetable seeding warning:', e.message);
    }

    // ─── 4. Add a class_questions MCQ for demo ────────────────────────────────
    try {
      await db.execute(`CREATE TABLE IF NOT EXISTS class_questions (
        id TEXT PRIMARY KEY,
        class_id TEXT,
        type TEXT,
        question_text TEXT,
        options_json TEXT,
        correct_index INTEGER,
        boilerplate_json TEXT,
        test_cases_json TEXT,
        created_at TEXT
      )`);

      const existingQ = await db.execute({ 
        sql: "SELECT id FROM class_questions WHERE class_id = ? LIMIT 1", 
        args: [target.id] 
      });
      
      if (existingQ.rows.length === 0) {
        const now = new Date().toISOString();
        // MCQ
        await db.execute({
          sql: `INSERT OR IGNORE INTO class_questions (id, class_id, type, question_text, options_json, correct_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `mcq_demo_${Date.now()}`,
            target.id,
            'mcq',
            `What is the primary purpose of the topic covered in "${target.title}"?`,
            JSON.stringify([
              'To structure and efficiently manage data',
              'To create beautiful frontend animations',
              'To deploy web servers on the cloud',
              'To build mobile apps faster'
            ]),
            0,
            now
          ]
        });
        // Coding Question
        await db.execute({
          sql: `INSERT OR IGNORE INTO class_questions (id, class_id, type, question_text, boilerplate_json, test_cases_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `code_demo_${Date.now()}`,
            target.id,
            'coding',
            `Write a Python function that demonstrates the concept from "${target.title}". The function should be named 'solution' and return a result.`,
            JSON.stringify({ code: `# ${target.title} - Coding Challenge\n# Complete the function below\n\ndef solution(data):\n    # Your code here\n    result = data  # Modify this\n    return result\n\n# Test your function\nprint(solution("Hello from CynexAI!"))` }),
            JSON.stringify([
              { input: '"Hello"', expected: '"Hello"' },
              { input: '"CynexAI"', expected: '"CynexAI"' }
            ]),
            now
          ]
        });
        console.log('\n❓ Demo MCQ + Coding questions added!');
      } else {
        console.log('\n❓ Questions already exist for this class. Skipping.');
      }
    } catch (e) {
      console.warn('Question seeding warning:', e.message);
    }

    // ─── 5. Print Demo Test Guide ─────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('✅ DEMO SETUP COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\n📱 HOW TO TEST:\n');
    console.log('🔗 App URL: http://localhost:5173/login');
    console.log('\n👨‍🏫 TEACHER LOGIN:');
    console.log('   Email:    teacher@cynexai.com');
    console.log('   Password: admin123');
    console.log('   → Go to: /teacher → Click "Live Stream" in sidebar');
    console.log('   → Click "Prep AI Materials" first, then "Start Class"');
    console.log('   → A Jitsi window opens for screensharing');
    console.log(`   → Jitsi Room: ${jitsiRoom}`);
    console.log('\n📚 STUDENT LOGIN (phone or browser):');
    console.log('   Email:    student@cynexai.com');
    console.log('   Password: admin123');
    console.log('   → Go to: /student → Click first class node');
    console.log('   → The Jitsi live view will show inside ClassFlow!');
    console.log(`   → Student Jitsi Link: ${jitsiLink}`);
    console.log('\n🎬 AFTER CLASS:');
    console.log('   → Teacher clicks "End & Generate Summary"');
    console.log('   → Enter YouTube recording URL (e.g. from YouTube Studio)');
    console.log('   → AI generates post-class summary');
    console.log('   → Student sees YouTube embed + AI summary in Step 4');
    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (e) {
    console.error('❌ Setup failed:', e);
  }
}

run();
