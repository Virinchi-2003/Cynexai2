import { createClient } from '@libsql/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;

const encryptPassword = (password: string): string => {
  if (!password) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32),
      iv
    );
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return '';
  }
};

async function resetStudentPassword() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });

  try {
    const newEncrypted = encryptPassword('admin123');
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'student@cynexai.in'",
      args: [newEncrypted]
    });
    console.log("Successfully reset password for student@cynexai.in to admin123");
  } catch (e) {
    console.error(e);
  }
}

resetStudentPassword();
