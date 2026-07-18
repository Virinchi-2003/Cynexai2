require('dotenv').config({path: require('fs').existsSync('.env.prod') ? '.env.prod' : '.env'});
// To sync to prod, run this with the PROD credentials in .env or pass them directly.
// Example: VITE_TURSO_DATABASE_URL=... VITE_TURSO_AUTH_TOKEN=... node scripts/sync_prod_schema.cjs

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const client = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN 
});

const schemaPath = path.join(__dirname, '..', 'schema.json');
const idealSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

async function sync() {
  console.log('Starting sync with database:', process.env.VITE_TURSO_DATABASE_URL.substring(0, 30) + '...');
  const tablesRes = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
  const existingTables = tablesRes.rows.map(r => r.name);

  for (const [tableName, columns] of Object.entries(idealSchema)) {
    if (!existingTables.includes(tableName)) {
      console.log(`Table ${tableName} does not exist. (Creating missing tables is not fully automated by this script yet)`);
      // We could add CREATE TABLE logic here if needed.
      continue;
    }

    const info = await client.execute('PRAGMA table_info(' + tableName + ')');
    const existingColumns = info.rows.map(c => c.name);

    for (const col of columns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding missing column ${col.name} to ${tableName}...`);
        const type = col.type || 'TEXT';
        let query = `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${type}`;
        if (col.dflt_value !== null) {
          query += ` DEFAULT ${col.dflt_value}`;
        }
        try {
            await client.execute(query);
            console.log(`Successfully added ${col.name}`);
        } catch (e) {
            console.error(`Failed to add ${col.name}:`, e.message);
        }
      }
    }
  }
  console.log('Sync complete!');
}

sync().catch(console.error);
