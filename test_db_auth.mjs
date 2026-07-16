import { createClient } from '@libsql/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;

const decryptPassword = (encryptedText) => {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, encryptedHex] = parts;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32),
      Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return "Error decrypting: " + error.message;
  }
};

async function test() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });
  const res = await client.execute("SELECT role, email, password_encrypted, password_hash FROM users WHERE role IN ('CEO', 'Admin', 'Manager', 'DM', 'Sales/HR', 'Teacher')");
  for (const r of res.rows) {
    const enc = r.password_encrypted || r.password_hash;
    console.log(r.role, r.email, "=> DECRYPTED:", decryptPassword(enc));
  }
}
test();
