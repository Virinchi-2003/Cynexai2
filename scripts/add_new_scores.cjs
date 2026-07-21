const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  console.log(`Connecting to ${process.env.VITE_TURSO_DATABASE_URL}`);
  const columnsToAdd = [
    { name: 'quiz_score', type: 'INTEGER DEFAULT 0' },
    { name: 'interview_score', type: 'INTEGER DEFAULT 0' },
    { name: 'coding_test_score', type: 'INTEGER DEFAULT 0' },
  ];

  for (const col of columnsToAdd) {
    try {
      await client.execute(`ALTER TABLE manager_student_progress ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column: ${col.name}`);
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log(`  Already exists: ${col.name}`);
      } else {
        console.error(`✗ Failed to add ${col.name}:`, e.message);
      }
    }
  }
  console.log("Done!");
}

run().catch(console.error);
