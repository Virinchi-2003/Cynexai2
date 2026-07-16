import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function getAllStudents() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT id, name, email, password_encrypted, role FROM users WHERE role = 'Student'");
    
    console.log("--- ALL STUDENTS IN DB ---");
    for (const row of res.rows) {
      console.log(`Name: ${row.name}`);
      console.log(`Email: ${row.email}`);
      console.log(`Encrypted PW: ${row.password_encrypted}`);
      console.log("------------------------");
    }
  } catch (e) {
    console.error(e);
  }
}

getAllStudents();
