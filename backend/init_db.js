require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

async function initDb() {
  console.log('Connecting to Turso...');
  
  if (!process.env.VITE_TURSO_DATABASE_URL || !process.env.VITE_TURSO_AUTH_TOKEN) {
      console.error('Error: VITE_TURSO_DATABASE_URL and VITE_TURSO_AUTH_TOKEN must be set in .env');
      process.exit(1);
  }

  const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Read and execute schema
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split statements by semicolon
    const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Executing ${statements.length} schema statements...`);
    for (let stmt of statements) {
       await db.execute(stmt);
    }
    console.log('Schema created successfully.');

    // 2. Seed Default Users
    console.log('Seeding default users...');
    const defaultUsers = [
      { id: 'usr_sales', name: 'Sandeep', email: 'sandeep.cynexai@gmail.com', password: 'Sandeep@142', role: 'Sales/HR' },
      { id: 'usr_manager', name: 'Manager', email: 'manager@cynexai.com', password: 'admin123', role: 'Manager' },
      { id: 'usr_ceo', name: 'CEO', email: 'ceo@cynexai.com', password: 'admin123', role: 'CEO' },
      { id: 'usr_dm', name: 'Marketer', email: 'dm@cynexai.com', password: 'admin123', role: 'DM' },
      { id: 'usr_teacher', name: 'Teacher', email: 'teacher@cynexai.com', password: 'admin123', role: 'Teacher' },
      { id: 'usr_student', name: 'Student', email: 'student@cynexai.com', password: 'admin123', role: 'Student' }
    ];

    for (const u of defaultUsers) {
      try {
        await db.execute({
          sql: `INSERT INTO erp_users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.name, u.email, u.password, u.role, new Date().toISOString()]
        });
        console.log(`Seeded user: ${u.role}`);
      } catch (e) {
        // If UNIQUE constraint fails, it just means they already exist, which is fine
        if (e.message.includes('UNIQUE constraint failed')) {
           console.log(`User ${u.role} already exists, skipping.`);
        } else {
           throw e;
        }
      }
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

initDb();
