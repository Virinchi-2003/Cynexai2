import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

try {
  const leadId = 'lead_mrbxjw6t';
  const newStatus = 'Interested';
  
  // 1. Get current status
  const leadRes = await client.execute({ sql: "SELECT * FROM crm_leads WHERE id = ?", args: [leadId] });
  if (leadRes.rows.length === 0) throw new Error("Lead not found");
  const oldStatus = leadRes.rows[0].status;
  console.log('Old status:', oldStatus);
  
  // 3. Update status
  await client.execute({
    sql: `UPDATE crm_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [newStatus, leadId]
  });
  console.log('Update success');

  // 4. Log stage change history
  await client.execute({
    sql: "INSERT INTO crm_stage_history (id, lead_id, old_stage, new_stage) VALUES (?, ?, ?, ?)",
    args: ['hist_' + Date.now().toString(36), leadId, oldStatus, newStatus]
  });
  console.log('Insert success');
} catch(e) {
  console.error('Error:', e.message);
}
