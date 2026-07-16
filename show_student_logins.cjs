const { createClient } = require('@libsql/client');
const crypto = require('crypto');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const SECRET_KEY = process.env.VITE_APP_SECRET;

const encryptPassword = (password) => {
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

// Pick 5 representative students across batches
const targetEmails = [
  'mailmededeepyayannam@gmail.com',   // Batch 1 - 14 classes done
  'diliprajrallabandi@gmail.com',      // Batch 1 - 14 classes done
  'harshithchinnu28@gmail.com',        // Batch 4 - 30 classes done
  'jyothikap0201@gmail.com',           // Batch 5 - 9 classes done
  'gsasidhar546@gmail.com',            // Batch 5 - 9 classes done
];

const NEW_PASSWORD = 'cynex123';

async function resetAndShow() {
  const encPw = encryptPassword(NEW_PASSWORD);

  for (const email of targetEmails) {
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = ?",
      args: [encPw, email]
    });
  }

  const res = await client.execute({
    sql: `SELECT name, email FROM users WHERE email IN (${targetEmails.map(() => '?').join(',')}) ORDER BY name`,
    args: targetEmails
  });

  console.log('\n=== STUDENT LOGIN CREDENTIALS ===');
  console.log(`Password for all below: ${NEW_PASSWORD}\n`);
  res.rows.forEach(r => {
    console.log(`Name:  ${r.name}`);
    console.log(`Email: ${r.email}`);
    console.log(`Pass:  ${NEW_PASSWORD}`);
    console.log('---');
  });
}

resetAndShow().catch(console.error);
