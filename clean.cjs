require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });
  await db.execute("DELETE FROM erp_users WHERE name IN ('Test CEO', 'Test CEO 2')");
  console.log('Deleted Test CEOs');
}
main();
