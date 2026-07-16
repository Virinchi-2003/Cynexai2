import { createClient } from '@libsql/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;

const encryptPassword = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

async function resetPasswords() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN
  });
  
  const emailsToReset = [
    'admin@cynexai.in',
    'clerk@cynexai.in',
    'john@gmail.com',
    'manager@cynexai.com',
    'ceo@cynexai.com',
    'dm@cynexai.com',
    'trainer@cynexai.in',
    'student@cynexai.in',
    'teacher@cynexai.com',
    'venkateswarreddykatreddy29@gmail.com'
  ];
  
  const newPassword = 'admin123';
  const encrypted = encryptPassword(newPassword);

  console.log('Setting new password encrypted string to:', encrypted);

  for (const email of emailsToReset) {
    try {
      await client.execute({
        sql: "UPDATE users SET password_encrypted = ?, password_hash = ? WHERE email = ?",
        args: [encrypted, encrypted, email]
      });
      
      // We also update erp_users just in case there's dual logic for other APIs.
      try {
        await client.execute({
          sql: "UPDATE erp_users SET password_hash = ? WHERE email = ?",
          args: [encrypted, email]
        });
      } catch (innerE) {}
      
      console.log(`Successfully reset password for ${email}`);
    } catch (e) {
      console.error(`Failed to reset ${email}:`, e);
    }
  }
}

resetPasswords();
