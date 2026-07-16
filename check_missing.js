import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

const expectedIds = [
"CAI0047", "CAI0050", "CAI0048", "CAI0043", "CAI0054", "CAI0055", "CAI0056", "CAI0034", "CAI0032",
"CAI0031", "CAI0036", "CAI0030", "CAI0046", "CAI0044", "CAI0045", "CAI0015", "CAI0016", "CAI0024",
"CAI0022", "CAI0025", "CAI0023", "CAI0017", "CAI0035", "CAI0027", "CAI0028", "CAI0052", "CAI0051"
];

async function run() {
  const result = await db.execute("SELECT u.id, u.name, s.student_code FROM users u JOIN students s ON u.email = s.portal_login_email");
  const foundCodes = result.rows.map(r => r.student_code);
  const foundUserIds = result.rows.map(r => r.id);
  
  // also check if they are in users table but missing in students table
  const allUsers = await db.execute("SELECT id, name FROM users");
  const allUserNames = allUsers.rows.map(r => r.name);

  console.log(`Found ${foundCodes.length} linked students in DB.`);
  
  let missing = [];
  for (const id of expectedIds) {
      if (!foundCodes.includes(id) && !foundUserIds.includes(`usr_${id}`)) {
          missing.push(id);
      }
  }

  console.log('Missing IDs:', missing);
  console.log('User names in DB:', allUserNames.filter(n => typeof n === 'string' && (n.includes('Geethanjali') || n.includes('Venkat') || n.includes('student') || n.includes('test'))));
  
}

run().catch(console.error);
