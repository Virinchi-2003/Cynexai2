import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function main() {
  const users = [
    { id: 'usr_dev_manager', name: 'Dev Manager', email: 'manager@cynexai.com', role: 'Manager' },
    { id: 'usr_dev_sales', name: 'Dev Sales', email: 'sales@cynexai.com', role: 'Sales/HR' },
    { id: 'usr_venkatesh', name: 'Venkatesh', email: 'venkatesh@cynexai.com', role: 'Teacher' },
    { id: '1', name: 'Test CEO', email: 'ceo@cynexai.com', role: 'CEO' },
    { id: 'user_1', name: 'Test CEO 2', email: 'ceo2@cynexai.com', role: 'CEO' }
  ];

  for (const u of users) {
    try {
      await client.execute({
        sql: 'INSERT INTO erp_users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        args: [u.id, u.name, u.email, 'hash', u.role]
      });
      console.log(`Inserted ${u.id}`);
    } catch (e) {
      console.log(`Failed or exists ${u.id}:`, e.message);
    }
  }
}

main();
