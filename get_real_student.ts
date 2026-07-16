import { createClient } from '@libsql/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;

const decryptPassword = (encryptedText: string): string => {
  if (!encryptedText) return '';
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) return encryptedText;

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
    return "Error decrypting";
  }
};

async function getRealStudent() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT id, name, email, password_encrypted, password_hash, role FROM users WHERE email = 'student@cynexai.in'");
    
    console.log("--- REAL STUDENT ---");
    for (const row of res.rows) {
      const encPw = row.password_encrypted || row.password_hash;
      let pw = "N/A";
      if (encPw) {
         pw = decryptPassword(encPw as string);
         if (pw === "Error decrypting") {
             pw = `(Raw DB Value: ${encPw})`;
         }
      }
      console.log(`Role: ${row.role}`);
      console.log(`Email: ${row.email}`);
      console.log(`Password: ${pw}`);
      console.log("------------------------");
    }
  } catch (e) {
    console.error(e);
  }
}

getRealStudent();
