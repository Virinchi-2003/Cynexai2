const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function listTables() {
  try {
    const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("=== TABLES IN DATABASE ===");
    res.rows.forEach(r => console.log(r.name));
  } catch (e) {
    console.error(e);
  }
}

listTables();
