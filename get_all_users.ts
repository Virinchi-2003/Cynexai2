import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function getAllUsers() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT id, name, email, role FROM users");
    
    console.log("--- ALL USERS IN DB ---");
    for (const row of res.rows) {
      console.log(`Role: ${row.role}`);
      console.log(`Email: ${row.email}`);
      console.log("------------------------");
    }
  } catch (e) {
    console.error(e);
  }
}

getAllUsers();
