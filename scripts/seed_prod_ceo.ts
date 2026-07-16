import 'dotenv/config';
import { createClient } from '@libsql/client';
import CryptoJS from 'crypto-js';

export const seedCEO = async () => {
  // Use process.env since this runs in Node, not Vite
  const url = process.env.VITE_TURSO_DATABASE_URL;
  const authToken = process.env.VITE_TURSO_AUTH_TOKEN;
  const secret = process.env.VITE_APP_SECRET;

  if (!url || !authToken || !secret) {
    console.error("Missing required environment variables in .env file.");
    return;
  }

  const client = createClient({ url, authToken });

  try {
    // 1. Create the users table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password_encrypted TEXT,
        role TEXT,
        avatar TEXT,
        salary REAL,
        created_at TEXT
      )
    `);

    // 2. Prepare the CEO user
    const ceo = { 
      id: 'usr_ceo', 
      name: 'CEO', 
      email: 'ceo@cynexai.com', 
      password: 'admin123', 
      role: 'CEO', 
      salary: 150000 
    };
    
    // Encrypt the password using CryptoJS exactly like the frontend does
    const encryptedPassword = CryptoJS.AES.encrypt(ceo.password, secret).toString();
    
    // 3. Check if CEO exists
    const result = await client.execute({
      sql: "SELECT count(*) as count FROM users WHERE id = ?",
      args: [ceo.id]
    });
    
    if (Number(result.rows[0].count) === 0) {
      await client.execute({
        sql: `INSERT INTO users (id, name, email, password_encrypted, role, salary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [ceo.id, ceo.name, ceo.email, encryptedPassword, ceo.role, ceo.salary, new Date().toISOString()]
      });
      console.log("✅ Successfully created the single CEO account in the database!");
    } else {
      console.log("⚠️ CEO account already exists in this database.");
    }
  } catch (e) {
    console.error("❌ Failed to seed CEO user:", e);
  }
};

seedCEO();
