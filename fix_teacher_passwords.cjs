const { createClient } = require('@libsql/client');
const crypto = require('crypto');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const SECRET_KEY = process.env.VITE_APP_SECRET;

const encryptPassword = (password) => {
  if (!password) return '';
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
};

async function fixPasswords() {
  try {
    const defaultEnc = encryptPassword('admin123');
    const cynexEnc = encryptPassword('cynex123');

    // 1. teacher@cynexai.com -> admin123
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'teacher@cynexai.com'",
      args: [defaultEnc]
    });
    console.log("Updated teacher@cynexai.com to admin123");

    // 2. venkateswarreddykatreddy29@gmail.com -> cynex123
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'venkateswarreddykatreddy29@gmail.com'",
      args: [cynexEnc]
    });
    console.log("Updated venkateswarreddykatreddy29@gmail.com to cynex123");

    // 3. leonardsam001@gmail.com -> cynex123
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'leonardsam001@gmail.com'",
      args: [cynexEnc]
    });
    console.log("Updated leonardsam001@gmail.com to cynex123");

  } catch (e) {
    console.error(e);
  }
}

fixPasswords();
