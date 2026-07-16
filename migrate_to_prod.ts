import { createClient } from '@libsql/client';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.VITE_APP_SECRET;

const encryptPassword = (password: string): string => {
  if (!password) return '';
  return CryptoJS.AES.encrypt(password, SECRET_KEY as string).toString();
};

async function migrate() {
  const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN!
  });

  console.log("1. Deleting demo accounts...");
  const demoEmails = [
    'admin@cynexai.in', 'ceo@cynexai.com', 'manager@cynexai.com', 
    'dm@cynexai.com', 'clerk@cynexai.in', 'john@gmail.com',
    'trainer@cynexai.in', 'student@cynexai.in', 'teacher@cynexai.com', 'v123@gmail.com'
  ];
  for (const email of demoEmails) {
    await client.execute({ sql: "DELETE FROM users WHERE email = ?", args: [email] });
    await client.execute({ sql: "DELETE FROM erp_users WHERE email = ?", args: [email] });
  }

  console.log("2. Inserting real employees...");
  const realEmployees = [
    { id: 'usr_ceo', email: 'eswarsudheer98@gmail.com', role: 'CEO', name: 'Eswar Sudheer' },
    { id: 'usr_manager', email: 'leonard001@gmail.com', role: 'Manager', name: 'Leonard' },
    { id: 'usr_dm', email: 'leela@gmail.com', role: 'DM', name: 'Leela' },
    { id: 'usr_sales', email: 'sandeep.cynexai@gmail.com', role: 'Sales/HR', name: 'Sandeep' },
    { id: 'usr_venkatesh', email: 'venkateswarreddykatreddy29@gmail.com', role: 'Teacher', name: 'Venkatesh' },
    { id: 'usr_prudhvi', email: 'prudhvi@gmail.com', role: 'Teacher', name: 'Prudhvi' }
  ];

  const defaultEncPassword = encryptPassword('cynex123');

  for (const emp of realEmployees) {
    // Upsert logic for users table
    try {
      await client.execute({
        sql: "DELETE FROM users WHERE email = ?", args: [emp.email]
      });
      await client.execute({
        sql: "INSERT INTO users (id, name, email, role, password_encrypted, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
        args: [emp.id, emp.name, emp.email, emp.role, defaultEncPassword, defaultEncPassword]
      });
      console.log(`Inserted ${emp.email} as ${emp.role}`);
    } catch (e) {
      console.error(`Failed to insert employee ${emp.email}:`, e);
    }
  }

  console.log("3. Syncing students into users table...");
  // Fetch all students from students table
  const studentsRes = await client.execute("SELECT id, student_code, portal_login_email FROM students");
  for (const row of studentsRes.rows) {
    const email = row.portal_login_email as string;
    const name = `Student ${row.student_code}`;
    const sId = `usr_${row.id}`;
    
    // Check if exists
    const check = await client.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
    if (check.rows.length === 0) {
      await client.execute({
        sql: "INSERT INTO users (id, name, email, role, password_encrypted, password_hash) VALUES (?, ?, ?, 'Student', ?, ?)",
        args: [sId, name, email, defaultEncPassword, defaultEncPassword]
      });
      console.log(`Synced student ${email}`);
    } else {
      await client.execute({
        sql: "UPDATE users SET password_encrypted = ?, password_hash = ? WHERE email = ?",
        args: [defaultEncPassword, defaultEncPassword, email]
      });
    }
  }

  console.log("Migration complete!");
}

migrate();
