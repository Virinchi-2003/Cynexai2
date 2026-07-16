const { createClient } = require('@libsql/client');
const crypto = require('crypto');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const SECRET_KEY = process.env.VITE_APP_SECRET;

const decryptPassword = (encryptedText) => {
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
    return 'Error decrypting: ' + error.message;
  }
};

async function checkTeachers() {
  try {
    const res = await client.execute("SELECT id, name, email, role, password_encrypted FROM users WHERE role = 'Teacher'");
    console.log("=== TEACHERS ===");
    for (const r of res.rows) {
      console.log(`ID: ${r.id}`);
      console.log(`Name: ${r.name}`);
      console.log(`Email: ${r.email}`);
      console.log(`Role: ${r.role}`);
      console.log(`Raw Password: ${r.password_encrypted}`);
      console.log(`Decrypted: ${decryptPassword(r.password_encrypted)}`);
      console.log("---");
    }
  } catch (e) {
    console.error(e);
  }
}

checkTeachers();
