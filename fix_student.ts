import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function fixStudentRole() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });

  try {
    await client.execute({
      sql: "UPDATE users SET role = 'Student' WHERE email = 'student@cynexai.in'"
    });
    console.log("Successfully updated role for student@cynexai.in to Student");
  } catch (e) {
    console.error(e);
  }
}

fixStudentRole();
