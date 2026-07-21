const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  const r1 = await client.execute("SELECT id, name, role FROM users WHERE role='Student'");
  console.log('users with role Student:', r1.rows);
  
  const r2 = await client.execute("SELECT id, name FROM students");
  console.log('students table:', r2.rows);
}

run().catch(console.error);
