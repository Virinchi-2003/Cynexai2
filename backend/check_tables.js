require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const resCourses = await db.execute("SELECT COUNT(*) as count FROM courses");
    console.log("Courses count:", resCourses.rows[0].count);
    
    const resModules = await db.execute("SELECT COUNT(*) as count FROM course_modules");
    console.log("Modules count:", resModules.rows[0].count);
    
    const resClasses = await db.execute("SELECT COUNT(*) as count FROM course_classes");
    console.log("Classes count:", resClasses.rows[0].count);
  } catch (e) {
    console.error("DB check failed:", e);
  }
}

run();
