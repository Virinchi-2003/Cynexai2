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

async function fixVenkats() {
  try {
    const defaultEnc = encryptPassword('cynex123');

    // 1. venkateswarreddykatreddy29@gmail.com -> cynex123 (Venkatesh / Teacher)
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'venkateswarreddykatreddy29@gmail.com'",
      args: [defaultEnc]
    });
    console.log("Updated venkateswarreddykatreddy29@gmail.com to cynex123");

    // 2. venky@gmail.com -> cynex123 (venkateswarreddy katreddy / Student)
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'venky@gmail.com'",
      args: [defaultEnc]
    });
    console.log("Updated venky@gmail.com to cynex123");

    // 3. venkat@gmail.com -> cynex123 (Venkat / Student)
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = 'venkat@gmail.com'",
      args: [defaultEnc]
    });
    console.log("Updated venkat@gmail.com to cynex123");

  } catch (e) {
    console.error(e);
  }
}

fixVenkats();
