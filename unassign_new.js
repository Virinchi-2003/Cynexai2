import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function run() {
  try {
    const result = await client.execute("UPDATE crm_leads SET assigned_to = '' WHERE status = 'New'");
    console.log(`Unassigned ${result.rowsAffected} leads in the 'New' stage.`);
  } catch (e) {
    console.log("Error updating leads:", e.message);
  }
}
run();
