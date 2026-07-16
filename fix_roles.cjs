const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function fixRoles() {
  // Fix all lowercase 'student' -> 'Student'
  const r1 = await client.execute("UPDATE users SET role = 'Student' WHERE role = 'student'");
  console.log(`Fixed 'student' -> 'Student': ${r1.rowsAffected} rows`);

  // Fix 'trainer' -> 'Teacher'
  const r2 = await client.execute("UPDATE users SET role = 'Teacher' WHERE role = 'trainer'");
  console.log(`Fixed 'trainer' -> 'Teacher': ${r2.rowsAffected} rows`);

  // Fix any other lowercase roles
  const r3 = await client.execute("UPDATE users SET role = 'Manager' WHERE role = 'manager'");
  const r4 = await client.execute("UPDATE users SET role = 'CEO' WHERE role = 'ceo'");
  const r5 = await client.execute("UPDATE users SET role = 'Admin' WHERE role = 'admin'");
  const r6 = await client.execute("UPDATE users SET role = 'Sales/HR' WHERE role = 'clerk'");
  console.log(`Other role fixes: manager=${r3.rowsAffected}, ceo=${r4.rowsAffected}, admin=${r5.rowsAffected}, clerk->Sales/HR=${r6.rowsAffected}`);

  // Verify final role distribution
  const res = await client.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC");
  console.log('\n=== ROLE DISTRIBUTION ===');
  res.rows.forEach(r => console.log(`  ${r.role}: ${r.count}`));
}

fixRoles().catch(console.error);
