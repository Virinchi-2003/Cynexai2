import { createClient } from '@libsql/client';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'cynex-ai-secure-erp-key-2026'; 

export const decryptPassword = (encryptedPassword: string): string => {
  if (!encryptedPassword) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return 'Failed to decrypt';
  }
};

async function run() {
  const client = createClient({
    url: 'libsql://cynex-ai-cynexai.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MTk5MzYsImlkIjoiMDE5ZWE3MTktNzkwMS03Y2Y3LTgxNDItYmI3ZTdhY2RiZGUyIiwicmlkIjoiZDhlZjQ2NjQtNGZjNy00MTc0LWJlMTItOWIwNDczN2RjNGIyIn0.nzy6qJrwAHywKfZwRZ28eMJFbD20IFojBH-tYxX1xS8Ouaokn7SZcKT2FiG_M5umsbw9HN24TXc0vsKgOJlhDw'
  });

  const newPassword = 'password123';
  const encrypted = CryptoJS.AES.encrypt(newPassword, SECRET_KEY).toString();
  await client.execute({
    sql: "UPDATE users SET password_encrypted = ? WHERE email = ?",
    args: [encrypted, 'Jyothikap0201@gmail.com']
  });
  console.log("Password updated for Jyothikap0201@gmail.com");
  
  const others = await client.execute("SELECT email, password_encrypted, role FROM users WHERE email = 'demo@student.cynexai.com' OR email = 'student@cynexai.com'");
  console.log("\nSpecific users:");
  others.rows.forEach(r => {
      console.log(`${r.role} - ${r.email} - ${decryptPassword(r.password_encrypted as string)}`);
  });
}

run();
