require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });
  
  const res = await db.execute("SELECT name, sql FROM sqlite_master WHERE type='table'");
  for (const row of res.rows) {
    if (row.name.includes('user')) {
      console.log(row.name);
    }
  }
}
main();
