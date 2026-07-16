import { createClient } from '@libsql/client';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.VITE_TURSO_DATABASE_URL;
  const authToken = process.env.VITE_TURSO_AUTH_TOKEN;
  const SECRET_KEY = process.env.VITE_APP_SECRET;
  
  if (!url || !authToken || !SECRET_KEY) {
    console.error("Missing config");
    return;
  }
  
  const client = createClient({ url, authToken });
  
  const pw = 'student123';
  const encrypted = CryptoJS.AES.encrypt(pw, SECRET_KEY).toString();
  
  try {
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = ?",
      args: [encrypted, 'geethanjali2229@gmail.com']
    });
    
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = ?",
      args: [encrypted, 'mailmededeepyayannam@gmail.com']
    });
    
    console.log("Updated passwords to student123 for geethanjali and dedeepya");
  } catch (e) {
    console.error("DB Error:", e.message);
  }
}

main();
