import { createClient } from '@libsql/client';
import fs from 'fs';

async function testMigrate() {
  const dbFile = 'test_migrate_temp.db';
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  
  const client = createClient({ url: 'file:' + dbFile });
  
  // Create old schema
  await client.executeMultiple(`
    CREATE TABLE erp_users (id TEXT PRIMARY KEY);
    CREATE TABLE crm_leads (id TEXT PRIMARY KEY);
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT
    );
    CREATE TABLE crm_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME
    );
    INSERT INTO erp_users VALUES ('u1');
    INSERT INTO crm_leads VALUES ('l1');
    INSERT INTO crm_activities VALUES ('a1', 'l1', 'u1', 'Call', 'Hello', '2023-01-01');
  `);
  
  // Run migration statements
  await client.execute('ALTER TABLE tasks ADD COLUMN student_id TEXT REFERENCES erp_users(id);');
  await client.execute('ALTER TABLE tasks ADD COLUMN lead_id TEXT REFERENCES crm_leads(id);');
  
  await client.execute('PRAGMA foreign_keys=off;');
  await client.execute('BEGIN TRANSACTION;');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS crm_activities_new (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      student_id TEXT,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('Call', 'Email', 'Meeting', 'Note')) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES erp_users(id),
      FOREIGN KEY (user_id) REFERENCES erp_users(id)
    );
  `);
  await client.execute(`
    INSERT INTO crm_activities_new (id, lead_id, user_id, type, content, created_at)
    SELECT id, lead_id, user_id, type, content, created_at FROM crm_activities;
  `);
  await client.execute('DROP TABLE crm_activities;');
  await client.execute('ALTER TABLE crm_activities_new RENAME TO crm_activities;');
  await client.execute('COMMIT;');
  await client.execute('PRAGMA foreign_keys=on;');
  
  const res = await client.execute("PRAGMA table_info(crm_activities);");
  console.log(res.rows);
  const data = await client.execute("SELECT * FROM crm_activities;");
  console.log(data.rows);
}

testMigrate().catch(console.error);
