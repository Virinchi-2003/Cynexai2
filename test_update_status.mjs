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
  try {
    const leads = await client.execute("SELECT id FROM crm_leads LIMIT 1");
    if (leads.rows.length === 0) return console.log("No leads");
    const id = leads.rows[0].id;
    
    // Simulate what updateLeadStatus does for Admission
    console.log("Checking activities...");
    await client.execute({
      sql: "SELECT * FROM crm_activities WHERE lead_id = ? ORDER BY created_at DESC",
      args: [id]
    });
    
    console.log("Checking demos...");
    const demosRes = await client.execute({
      sql: "SELECT * FROM demos WHERE lead_id = ? AND status = 'Completed'",
      args: [id]
    });
    console.log("demosRes", demosRes.rows);
  } catch(e) {
    console.error("Exception thrown:", e.message);
  }
}

main();
