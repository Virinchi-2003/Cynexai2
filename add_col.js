import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function run() {
  try {
    await client.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'");
    console.log("Added status column to users table.");
  } catch (e) {
    console.log("Column may already exist:", e.message);
  }
}
run();
