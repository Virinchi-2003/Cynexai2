import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const SECRET_KEY = process.env.VITE_APP_SECRET;

const decryptPassword = (encryptedPassword) => {
  if (!encryptedPassword) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return 'decryption_failed';
  }
};

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  const rolesMap = {};

  try {
    const users = await client.execute("SELECT name, email, password_encrypted, role FROM users");
    for (const u of users.rows) {
      const p = decryptPassword(u.password_encrypted);
      if (!rolesMap[u.role]) rolesMap[u.role] = [];
      rolesMap[u.role].push({ email: u.email, password: p, name: u.name, source: 'users' });
    }
  } catch(e) {}

  try {
    const erp = await client.execute("SELECT name, email, password_hash, role FROM erp_users");
    for (const u of erp.rows) {
      if (!rolesMap[u.role]) rolesMap[u.role] = [];
      rolesMap[u.role].push({ email: u.email, password: u.password_hash, name: u.name, source: 'erp_users' });
    }
  } catch(e) {}

  console.log(JSON.stringify(rolesMap, null, 2));
}

main();
