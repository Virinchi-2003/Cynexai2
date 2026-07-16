require('dotenv').config();
import('@libsql/client').then(async m => {
  try {
    const client = m.createClient({
      url: process.env.VITE_TURSO_DATABASE_URL,
      authToken: process.env.VITE_TURSO_AUTH_TOKEN
    });
    
    const tables = ['users', 'erp_users', 'crm_leads', 'leads', 'sales'];
    for (const table of tables) {
      const res = await client.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
      if (res.rows.length > 0) {
        console.log(`SCHEMA FOR ${table}:`);
        console.log(res.rows[0].sql);
        console.log('---');
      }
    }
  } catch (err) {
    console.error(err);
  }
}).catch(console.error);
