import { ModuleData } from './parser';
import { Client } from '@libsql/client';
import crypto from 'crypto';

export async function seedCurriculum(db: Client, data: ModuleData[]) {
  // Wipe existing tables
  await db.execute('DELETE FROM classes');
  await db.execute('DELETE FROM course_module_mapping');
  await db.execute('DELETE FROM modules');

  const courseId = 'main-course';

  for (let i = 0; i < data.length; i++) {
    const moduleData = data[i];
    const moduleId = crypto.randomUUID();
    const moduleOrder = i + 1;

    // Insert module
    await db.execute({
      sql: 'INSERT INTO modules (id, title, sequence_order) VALUES (?, ?, ?)',
      args: [moduleId, moduleData.title, moduleOrder]
    });

    // Insert course mapping
    await db.execute({
      sql: 'INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)',
      args: [courseId, moduleId, moduleOrder]
    });

    // Insert classes
    for (let j = 0; j < moduleData.classes.length; j++) {
      const cls = moduleData.classes[j];
      const classId = crypto.randomUUID();
      const classOrder = j + 1;

      await db.execute({
        sql: 'INSERT INTO classes (id, module_id, title, type, status, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        args: [classId, moduleId, cls.title, cls.type, cls.status, classOrder]
      });
    }
  }
}
