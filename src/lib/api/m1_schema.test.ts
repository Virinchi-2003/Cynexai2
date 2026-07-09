import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { runMigration } from '../../../migrate_m1_1.js';

describe('M1.1: DB Schema modifications', () => {
  let clientSchema;
  let clientMigration;

  beforeAll(async () => {
    // 1. Setup client for schema.sql testing
    const testDbSchemaPath = 'test_m1_schema.db';
    if (fs.existsSync(testDbSchemaPath)) fs.unlinkSync(testDbSchemaPath);
    clientSchema = createClient({ url: 'file:' + testDbSchemaPath });
    
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await clientSchema.executeMultiple(schemaSql);

    // 2. Setup client for migration testing
    const testDbMigPath = 'test_m1_mig.db';
    if (fs.existsSync(testDbMigPath)) fs.unlinkSync(testDbMigPath);
    clientMigration = createClient({ url: 'file:' + testDbMigPath });
    
    // Create base tables (mimicking before migration)
    await clientMigration.executeMultiple(`
      CREATE TABLE IF NOT EXISTS erp_users (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS crm_leads (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id TEXT,
        created_by TEXT,
        priority TEXT DEFAULT 'Medium',
        due_date TEXT,
        status TEXT DEFAULT 'To Do',
        task_type TEXT DEFAULT 'One-Time',
        target_number INTEGER,
        current_number INTEGER DEFAULT 0,
        related_entity TEXT,
        start_date TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS crm_activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES erp_users(id)
      );
    `);
    
    // Run the migration
    await runMigration(clientMigration);
  });

  const checkDb = (getClient) => {
    it('should have lead_id, student_id, assignee_id, and created_by in tasks table', async () => {
      const client = getClient();
      const tableInfo = await client.execute("PRAGMA table_info(tasks);");
      const columns = tableInfo.rows.map((row: any) => row.name);
      
      expect(columns).toContain('lead_id');
      expect(columns).toContain('student_id');
      expect(columns).toContain('assignee_id');
      expect(columns).toContain('created_by');
    });

    it('should have student_id and nullable lead_id in crm_activities table', async () => {
      const client = getClient();
      const tableInfo = await client.execute("PRAGMA table_info(crm_activities);");
      const columns = tableInfo.rows.map((row: any) => row.name);
      
      expect(columns).toContain('student_id');
      expect(columns).toContain('lead_id');

      const leadIdRow = tableInfo.rows.find((row: any) => row.name === 'lead_id');
      expect(leadIdRow?.notnull).toBe(0); // nullable
    });

    it('should have foreign keys for references in tasks table', async () => {
      const client = getClient();
      const fkInfo = await client.execute("PRAGMA foreign_key_list(tasks);");
      const fkColumns = fkInfo.rows.map((row: any) => ({ from: row.from, table: row.table, to: row.to, on_delete: row.on_delete }));
      
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'lead_id', table: 'crm_leads', to: 'id', on_delete: 'CASCADE' }));
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'student_id', table: 'erp_users', to: 'id', on_delete: 'CASCADE' }));
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'assignee_id', table: 'erp_users', to: 'id' }));
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'created_by', table: 'erp_users', to: 'id' }));
    });

    it('should have foreign keys for student_id and lead_id in crm_activities table', async () => {
      const client = getClient();
      const fkInfo = await client.execute("PRAGMA foreign_key_list(crm_activities);");
      const fkColumns = fkInfo.rows.map((row: any) => ({ from: row.from, table: row.table, to: row.to, on_delete: row.on_delete }));
      
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'lead_id', table: 'crm_leads', to: 'id', on_delete: 'CASCADE' }));
      expect(fkColumns).toContainEqual(expect.objectContaining({ from: 'student_id', table: 'erp_users', to: 'id', on_delete: 'CASCADE' }));
    });
  };

  describe('schema.sql', () => {
    checkDb(() => clientSchema);
  });

  describe('migrate_m1_1.js', () => {
    checkDb(() => clientMigration);
  });
});
