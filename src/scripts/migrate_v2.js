import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const dbUrl = process.env.VITE_TURSO_DATABASE_URL;
const dbAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!dbUrl || !dbAuthToken) {
    console.error("Missing Turso credentials in .env");
    process.exit(1);
}

const client = createClient({
    url: dbUrl,
    authToken: dbAuthToken
});

const statements = [
    `CREATE TABLE IF NOT EXISTS task_comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES erp_users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS task_subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT CHECK(status IN ('To Do', 'Done')) DEFAULT 'To Do',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS crm_activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT CHECK(type IN ('Call', 'Email', 'Meeting', 'Note')) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES erp_users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS crm_stage_history (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        old_stage TEXT,
        new_stage TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE
    );`
];

async function migrate() {
    console.log("Connecting to Turso to run v2 migrations...");
    try {
        for (const sql of statements) {
            console.log(`Executing: \n${sql}\n`);
            await client.execute(sql);
        }
        console.log("v2 Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

migrate();
