import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.VITE_TURSO_DATABASE_URL;
  const authToken = process.env.VITE_TURSO_AUTH_TOKEN;
  
  if (!url || !authToken) {
    console.error("Missing Turso config in .env");
    return;
  }
  
  const client = createClient({ url, authToken });
  
  try {
    const res = await client.execute("SELECT name, email, role, password_encrypted FROM users WHERE role = 'Student' LIMIT 5");
    console.log("=== Student Users ===");
    res.rows.forEach(r => console.log(r));
    
    const adminRes = await client.execute("SELECT name, email, role, password_encrypted FROM users WHERE role != 'Student' LIMIT 5");
    console.log("\n=== Other Users ===");
    adminRes.rows.forEach(r => console.log(r));
  } catch (e) {
    console.error("DB Error:", e.message);
  }
}

main();
