import { recordAdmission } from './src/lib/api/sales';

async function test() {
  const result = await recordAdmission('test_lead', 100, "10", "2026-10-10", "2026-10-11", "ref");
  console.log('Result:', result);
}
test();
