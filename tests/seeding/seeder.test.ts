import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { seedCurriculum } from '../../scripts/seeding/seeder';
import { db, initTestDb, clearTestDb } from './db';
import { ModuleData } from '../../scripts/seeding/parser';

describe('seedCurriculum', () => {
  const mockData: ModuleData[] = [
    {
      title: 'Module 1',
      classes: [
        { title: 'Intro', type: 'Video', status: 'Published' }
      ]
    },
    {
      title: 'Module 2',
      classes: [
        { title: 'Deep Learning', type: 'Document', status: 'Published' },
        { title: 'RL', type: 'Video', status: 'Draft' }
      ]
    }
  ];

  beforeAll(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  beforeEach(async () => {
    // Add some garbage data to verify wipe
    await db.execute("INSERT INTO modules (id, title, sequence_order) VALUES ('old-mod', 'Old', 1)");
    await db.execute("INSERT INTO classes (id, module_id, title, order_index) VALUES ('old-cls', 'old-mod', 'Old Class', 1)");
    await db.execute("INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES ('main-course', 'old-mod', 1)");
  });

  it('wipes old data and inserts new modules and classes', async () => {
    await seedCurriculum(db, mockData);

    const modules = await db.execute('SELECT * FROM modules ORDER BY sequence_order ASC');
    expect(modules.rows.length).toBe(2);
    expect(modules.rows[0].title).toBe('Module 1');
    expect(modules.rows[1].title).toBe('Module 2');

    const classes = await db.execute('SELECT * FROM classes ORDER BY order_index ASC');
    expect(classes.rows.length).toBe(3);
    
    // Module 1 classes
    const mod1Classes = classes.rows.filter(r => r.module_id === modules.rows[0].id);
    expect(mod1Classes.length).toBe(1);
    expect(mod1Classes[0].title).toBe('Intro');
    expect(mod1Classes[0].type).toBe('Video');
    expect(mod1Classes[0].status).toBe('Published');

    // Module 2 classes
    const mod2Classes = classes.rows.filter(r => r.module_id === modules.rows[1].id);
    expect(mod2Classes.length).toBe(2);
    expect(mod2Classes[0].title).toBe('Deep Learning');
    expect(mod2Classes[1].title).toBe('RL');

    const mappings = await db.execute('SELECT * FROM course_module_mapping');
    expect(mappings.rows.length).toBe(2);
  });
});
