import { beforeAll, afterEach } from 'vitest';
import { initTestDb, clearTestDb } from './db';

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  await clearTestDb();
});
