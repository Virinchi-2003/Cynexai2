require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Updating first class to type 'live' and status 'draft'...");
    // 1. Get the first class
    const res = await db.execute("SELECT id, title FROM course_classes LIMIT 1");
    if (res.rows.length > 0) {
      const firstClass = res.rows[0];
      console.log(`Found class: ${firstClass.title} (${firstClass.id})`);
      
      // 2. Update it to type = 'live' and status = 'draft' and clean up old AI stuff if any
      await db.execute({
        sql: "UPDATE course_classes SET type = 'live', status = 'draft', ai_ppt_markdown = NULL, ai_script = NULL, ai_keypoints = NULL, ai_summary = NULL WHERE id = ?",
        args: [firstClass.id]
      });
      console.log("Database updated successfully!");
    } else {
      console.log("No classes found to update.");
    }
  } catch (e) {
    console.error("Failed to update database:", e);
  }
}

run();
