require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function seedQuestions() {
  const classId = 'class_python_1';

  // Check existing
  const ex = await db.execute({ sql: 'SELECT id FROM class_questions WHERE class_id = ? LIMIT 1', args: [classId] });
  if (ex.rows.length > 0) {
    console.log('Questions already exist for class_python_1. Deleting and re-seeding...');
    await db.execute({ sql: 'DELETE FROM class_questions WHERE class_id = ?', args: [classId] });
  }

  // MCQ
  await db.execute({
    sql: 'INSERT INTO class_questions (id, class_id, type, question_text, options_json, correct_answer_idx) VALUES (?, ?, ?, ?, ?, ?)',
    args: [
      'mcq_demo_1',
      classId,
      'mcq',
      'What is Python primarily used for?',
      JSON.stringify([
        'Only for building websites',
        'Data Science, AI, Automation, Web Dev and much more',
        'Only for system-level programming',
        'Only for mobile apps'
      ]),
      1
    ]
  });
  console.log('MCQ question seeded!');

  // Coding
  const boilerplate = {
    code: [
      '# Python - Class 1: Functions Practice',
      '# Write a function that greets a student by name',
      '',
      'def solution(name):',
      '    # Return a greeting like "Hello, Raju!"',
      '    return "Hello, " + name + "!"',
      '',
      '# Test your function',
      'print(solution("CynexAI Student"))',
    ].join('\n')
  };

  const testCases = [
    { input: 'Raju', expected: 'Hello, Raju!' },
    { input: 'HITEC City', expected: 'Hello, HITEC City!' },
  ];

  await db.execute({
    sql: 'INSERT INTO class_questions (id, class_id, type, question_text, boilerplate_json, test_cases_json) VALUES (?, ?, ?, ?, ?, ?)',
    args: [
      'code_demo_1',
      classId,
      'coding',
      'Complete the solution() function that takes a name and returns a greeting string like "Hello, Raju!"',
      JSON.stringify(boilerplate),
      JSON.stringify(testCases)
    ]
  });
  console.log('Coding question seeded!');
  console.log('Done!');
}

seedQuestions().catch(console.error);
