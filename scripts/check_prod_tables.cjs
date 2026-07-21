const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  const r = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables found:', r.rows.map(x => x.name));
}

run().catch(console.error);
