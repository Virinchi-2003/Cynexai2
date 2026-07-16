require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });
  
  try {
    console.log('Purging mock data from timetable_slots...');
    await db.execute("DELETE FROM timetable_slots");

    console.log('Purging mock data from leaves...');
    await db.execute("DELETE FROM leaves WHERE user_id IN ('Priya', 'Rahul') OR reason LIKE '%Demo%'");

    console.log('Purging mock data from leads...');
    await db.execute("DELETE FROM leads WHERE id LIKE '%demo%' OR name LIKE '%Demo%' OR name LIKE '%Test%'");

    console.log('Purging mock data from admissions...');
    await db.execute("DELETE FROM admissions WHERE id LIKE '%demo%'");

    console.log('Purging mock data from students...');
    await db.execute("DELETE FROM students WHERE id LIKE '%demo%'");

    console.log('Purging mock users...');
    await db.execute("DELETE FROM erp_users WHERE email LIKE '%test%' OR email = 'venkat@gmail.com' OR name LIKE '%Demo%'");

    console.log('Purging mock data from crm_activities...');
    await db.execute("DELETE FROM crm_activities WHERE content LIKE '%Demo%'");

    console.log('Purge completed successfully.');
  } catch (error) {
    console.error('Purge failed:', error);
  }
}
main();
