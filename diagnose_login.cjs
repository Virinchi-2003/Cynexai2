const { createClient } = require('@libsql/client');
const crypto = require('crypto');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const SECRET_KEY = process.env.VITE_APP_SECRET;

// Exactly mirrors src/lib/crypto.ts
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
    return null;
  }
};

// Target emails we reset
const targetEmails = [
  'mailmededeepyayannam@gmail.com',
  'diliprajrallabandi@gmail.com',
  'gsasidhar546@gmail.com',
  'harshithchinnu28@gmail.com',
];

const NEW_PASSWORD = 'cynex123';

async function diagnoseAndFix() {
  console.log(`=== SECRET_KEY loaded: ${SECRET_KEY ? 'YES (' + SECRET_KEY.substring(0, 10) + '...)' : 'NO!'}\n`);

  // Step 1: Show what's actually stored in password_encrypted for these users
  const res = await client.execute({
    sql: `SELECT id, name, email, role, password_encrypted FROM users WHERE email IN (${targetEmails.map(() => '?').join(',')})`,
    args: targetEmails
  });

  console.log('=== CURRENT DB STATE ===');
  for (const row of res.rows) {
    const decrypted = decryptPassword(row.password_encrypted);
    console.log(`\nName:  ${row.name}`);
    console.log(`Email: ${row.email}`);
    console.log(`Role:  ${row.role}`);
    console.log(`Encrypted PW (first 40 chars): ${row.password_encrypted ? String(row.password_encrypted).substring(0, 40) + '...' : 'NULL'}`);
    console.log(`Decrypts to: "${decrypted}"`);
    console.log(`Matches '${NEW_PASSWORD}'?: ${decrypted === NEW_PASSWORD ? 'YES ✓' : 'NO ✗'}`);
  }

  // Step 2: Re-encrypt and save with the correct key
  console.log('\n=== RE-ENCRYPTING PASSWORDS ===');
  const freshEncrypted = encryptPassword(NEW_PASSWORD);
  console.log(`Sample encrypted: ${freshEncrypted.substring(0, 40)}...`);
  const checkDecrypt = decryptPassword(freshEncrypted);
  console.log(`Decrypts back to: "${checkDecrypt}"`);

  // Re-write all target users
  for (const email of targetEmails) {
    const enc = encryptPassword(NEW_PASSWORD);
    await client.execute({
      sql: "UPDATE users SET password_encrypted = ? WHERE email = ?",
      args: [enc, email]
    });
    console.log(`Updated ${email}`);
  }

  // Verify
  console.log('\n=== VERIFICATION ===');
  const res2 = await client.execute({
    sql: `SELECT name, email, role, password_encrypted FROM users WHERE email IN (${targetEmails.map(() => '?').join(',')})`,
    args: targetEmails
  });
  for (const row of res2.rows) {
    const decrypted = decryptPassword(row.password_encrypted);
    console.log(`${row.name} (${row.email}) [role: ${row.role}] -> decrypts to: "${decrypted}" ${decrypted === NEW_PASSWORD ? '✓' : '✗'}`);
  }
}

diagnoseAndFix().catch(console.error);
