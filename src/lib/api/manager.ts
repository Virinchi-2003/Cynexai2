import { client, isTursoConfigured } from '../turso';

export type PendingApproval = {
  id: string;
  sale_id: string;
  lead_name: string;
  course: string;
  amount_paid: number;
  total_fee: number;
  status: string;
  created_at: string;
};

export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute(`
        SELECT ma.id, ma.sale_id, l.name as lead_name, s.course_id as course, s.amount_paid, s.total_fee, ma.status, s.timestamp as created_at
        FROM manager_approvals ma
        JOIN sales s ON ma.sale_id = s.id
        JOIN leads l ON s.lead_id = l.id
        WHERE ma.status = 'Pending'
        ORDER BY s.timestamp DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id as string,
        sale_id: row.sale_id as string,
        lead_name: row.lead_name as string,
        course: row.course as string,
        amount_paid: row.amount_paid as number,
        total_fee: row.total_fee as number,
        status: row.status as string,
        created_at: row.created_at as string
      }));
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

export const approveSale = async (approvalId: string, approverId: string, saleId: string) => {
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `UPDATE manager_approvals SET status = 'Approved', approver_id = ?, decided_at = ? WHERE id = ?`,
        args: [approverId, new Date().toISOString(), approvalId]
      });
      // Find the lead associated with this sale to update bucket
      const saleResult = await client.execute({ sql: `SELECT lead_id FROM sales WHERE id = ?`, args: [saleId] });
      if (saleResult.rows.length > 0) {
        const leadId = saleResult.rows[0].lead_id;
        await client.execute({ sql: `UPDATE leads SET bucket_stage = 'F' WHERE id = ?`, args: [leadId] });
        return leadId;
      }
    } catch(e) { console.error(e); }
  }
  return null;
};

export const rejectSale = async (approvalId: string, approverId: string, notes: string) => {
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `UPDATE manager_approvals SET status = 'Rejected', notes = ?, approver_id = ?, decided_at = ? WHERE id = ?`,
        args: [notes, approverId, new Date().toISOString(), approvalId]
      });
      return true;
    } catch(e) { console.error(e); }
  }
  return false;
};

export const completeOnboarding = async (saleId: string, batchId: string, teacherId: string, mode: string, joiningDate: string, remarks: string, leadId: string) => {
  if (isTursoConfigured && client) {
    const id = 'onb_' + Date.now().toString(36);
    try {
      await client.execute({
        sql: `INSERT INTO onboardings (id, sale_id, batch_id, teacher_id, mode, joining_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, saleId, batchId, teacherId, mode, joiningDate, remarks]
      });
      
      const studentId = 'stu_' + Date.now().toString(36);
      const studentCode = 'CNX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const email = `${studentCode.toLowerCase()}@student.cynexai.com`;
      
      await client.execute({
        sql: `INSERT INTO students (id, onboarding_id, student_code, portal_login_email, status) VALUES (?, ?, ?, ?, ?)`,
        args: [studentId, id, studentCode, email, 'Active']
      });

      await client.execute({ sql: `UPDATE leads SET bucket_stage = 'G' WHERE id = ?`, args: [leadId] });
      
      // AUTOMATION: MOCKED EMAIL DISPATCH
      console.log(`[AUTOMATION: EMAIL] 🚀 Sent welcome email to ${email} with portal login credentials.`);

      return studentCode;
    } catch(e) { console.error(e); }
  }
  return null;
};
