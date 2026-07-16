require('dotenv').config();
import('@libsql/client').then(async m => {
  const client = m.createClient({url: process.env.VITE_TURSO_DATABASE_URL, authToken: process.env.VITE_TURSO_AUTH_TOKEN});
  try {
    const r2 = await client.execute("SELECT sql FROM sqlite_schema WHERE name = 'crm_stage_history'");
    console.log('History schema:', r2.rows[0].sql);
  } catch(e) {
    console.error('Error:', e.message);
  }
});
