import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  try {
    const users = await client.execute("SELECT id, name, email, password_encrypted, role FROM users WHERE role IN ('Admin', 'Manager', 'CEO') LIMIT 5");
    console.log("users table:");
    console.table(users.rows);
  } catch(e) { console.error("users error:", e.message) }
  
  try {
    const erp = await client.execute("SELECT id, name, email, password_hash, role FROM erp_users LIMIT 5");
    console.log("\nerp_users table:");
    console.table(erp.rows);
  } catch(e) { console.error("erp_users error:", e.message) }
}

main();
