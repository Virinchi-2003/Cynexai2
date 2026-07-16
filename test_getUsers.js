import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function run() {
    const filters = { role: 'Student' };
    const conditions = [];
    const args = [];
    for (const [key, val] of Object.entries(filters)) {
        if (typeof val === 'string' && val.trim() !== '') {
            conditions.push(`${key} LIKE ?`);
            args.push(`%${val}%`);
        }
    }
    const query = `SELECT u.*, s.classes_attended_json, s.preferred_mode FROM users u LEFT JOIN students s ON u.email = s.portal_login_email WHERE ${conditions.join(' AND ')}`;
    console.log("Executing:", query, args);
    const res = await db.execute({sql: query, args});
    console.log("Result rows count:", res.rows.length);
    console.log("Names:", res.rows.map(r => r.name));
}

run().catch(console.error);
