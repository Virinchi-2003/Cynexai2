import { createClient } from '@libsql/client';

export const db = createClient({ url: 'file::memory:' });

export async function initTestDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      sequence_order INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS course_module_mapping (
      course_id TEXT,
      module_id TEXT,
      order_index INTEGER,
      PRIMARY KEY (course_id, module_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      module_id TEXT,
      title TEXT,
      type TEXT,
      status TEXT,
      order_index INTEGER
    )
  `);
}

export async function clearTestDb() {
  await db.execute('DELETE FROM classes');
  await db.execute('DELETE FROM course_module_mapping');
  await db.execute('DELETE FROM modules');
}
