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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function executeWithRetry(query: string, args: any[] = [], retries = MAX_RETRIES): Promise<any> {
  try {
    if (!client) throw new Error('Database client not configured');
    return await client.execute({ sql: query, args });
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeWithRetry(query, args, retries - 1);
    }
    throw error;
  }
}

export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute(`
        SELECT ma.id, ma.sale_id, l.name as lead_name, s.course_id as course, s.amount_paid, s.total_fee, ma.status, s.timestamp as created_at
        FROM manager_approvals ma
        JOIN sales s ON ma.sale_id = s.id
        JOIN crm_leads l ON s.lead_id = l.id
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
      
      // Fetch onboarding record to link student
      const onbResult = await client.execute({ sql: `SELECT id FROM onboardings WHERE sale_id = ? ORDER BY rowid DESC LIMIT 1`, args: [saleId] });
      let onbId = onbResult.rows.length > 0 ? onbResult.rows[0].id : null;

      // Find the lead associated with this sale to update bucket
      const saleResult = await client.execute({ sql: `SELECT lead_id FROM sales WHERE id = ?`, args: [saleId] });
      if (saleResult.rows.length > 0) {
        const leadId = saleResult.rows[0].lead_id;
        
        // Generate student credentials
        const studentId = 'stu_' + Date.now().toString(36);
        const studentCode = 'CNX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        const email = `${studentCode.toLowerCase()}@student.cynexai.com`;
        
        await client.execute({
          sql: `INSERT INTO students (id, onboarding_id, student_code, portal_login_email, status) VALUES (?, ?, ?, ?, ?)`,
          args: [studentId, onbId, studentCode, email, 'Active']
        });

        // AUTOMATION: MOCKED EMAIL DISPATCH
        console.log(`[AUTOMATION: EMAIL] 🚀 Sent welcome email to ${email} with portal login credentials.`);

        await client.execute({ sql: `UPDATE crm_leads SET status = 'Closed Won' WHERE id = ?`, args: [leadId] });
        return { leadId, studentCode, email };
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
      
      await client.execute({ sql: `UPDATE crm_leads SET status = 'Closed Won' WHERE id = ?`, args: [leadId] });
      
      // Create Manager Approval task
      const apprId = 'appr_' + Date.now().toString(36);
      await client.execute({
        sql: `INSERT INTO manager_approvals (id, sale_id, checklist_json, status, notes, approver_id, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [apprId, saleId, JSON.stringify({
          payment_verified: false,
          course_confirmed: false,
          batch_available: false,
          docs_received: false,
          teacher_assignable: false,
          joining_date_feasible: false
        }), 'Pending', '', null, null]
      });

      return "APPROVAL_PENDING";
    } catch(e) { console.error(e); }
  }
  return null;
};

export const getManagerAnalytics = async () => {
  if (isTursoConfigured && client) {
    try {
      const stats = {
        totalStudents: 0,
        totalLeads: 0,
        totalRevenue: 0,
        classesCompleted: 0
      };
      
      const stdRes = await client.execute("SELECT COUNT(*) as c FROM students");
      if(stdRes.rows.length) stats.totalStudents = Number(stdRes.rows[0].c);
      
      const leadRes = await client.execute("SELECT COUNT(*) as c FROM crm_leads");
      if(leadRes.rows.length) stats.totalLeads = Number(leadRes.rows[0].c);
      
      const revRes = await client.execute("SELECT SUM(amount_paid) as sum FROM sales");
      if(revRes.rows.length) stats.totalRevenue = Number(revRes.rows[0].sum) || 0;
      
      const clsRes = await client.execute("SELECT COUNT(*) as c FROM classes WHERE status = 'completed'");
      if(clsRes.rows.length) stats.classesCompleted = Number(clsRes.rows[0].c);

      return stats;
    } catch(e) { console.error(e); }
  }
  return { totalStudents: 0, totalLeads: 0, totalRevenue: 0, classesCompleted: 0 };
};

export const getApprovalDetails = async (id: string) => {
  try {
    const res = await executeWithRetry(
      `SELECT ma.*, s.amount_paid, s.total_fee, s.course_id, l.name as lead_name, l.id as lead_id
       FROM manager_approvals ma
       JOIN sales s ON ma.sale_id = s.id
       JOIN crm_leads l ON s.lead_id = l.id
       WHERE ma.id = ?`,
      [id]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getManagerTasks = async (userId: string) => {
  try {
    const res = await executeWithRetry("SELECT * FROM tasks WHERE created_by = ? ORDER BY id DESC", [userId]);
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const deleteManagerTask = async (id: string) => {
  try {
    await executeWithRetry("DELETE FROM tasks WHERE id = ?", [id]);
  } catch (e) {
    console.error(e);
  }
};

export const getOnboardingDetails = async (saleId: string) => {
  try {
    const res = await executeWithRetry(
      `SELECT s.id, l.name as lead_name, l.id as lead_id, s.course_id 
       FROM sales s JOIN crm_leads l ON s.lead_id = l.id WHERE s.id = ?`,
      [saleId]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getErpUsers = async () => {
  try {
    const res = await executeWithRetry("SELECT id, name, email, role FROM erp_users WHERE role != 'Student' ORDER BY created_at DESC");
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getErpModules = async () => {
  try {
    const res = await executeWithRetry("SELECT id, title, instructor_id FROM modules ORDER BY title ASC");
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveErpUser = async (form: any) => {
  try {
    if (form.id.startsWith('usr_')) {
      await executeWithRetry("UPDATE erp_users SET name = ?, email = ?, role = ? WHERE id = ?", [form.name, form.email, form.role, form.id]);
    } else {
      await executeWithRetry("INSERT INTO erp_users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)", [form.id, form.name, form.email, form.password, form.role]);
    }
  } catch (e) {
    console.error(e);
  }
};

export const assignModulesToInstructor = async (instructorId: string, moduleIds: string[]) => {
  try {
    await executeWithRetry("UPDATE modules SET instructor_id = NULL WHERE instructor_id = ?", [instructorId]);
    for (const mid of moduleIds) {
      await executeWithRetry("UPDATE modules SET instructor_id = ? WHERE id = ?", [instructorId, mid]);
    }
  } catch (e) {
    console.error(e);
  }
};
