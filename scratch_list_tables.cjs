const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

client.execute("SELECT name FROM sqlite_master WHERE type='table'")
  .then(res => {
    console.log('Tables:', res.rows.map(r => r.name));
  })
  .catch(console.error);
