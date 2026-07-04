import { client, isTursoConfigured } from '../turso';

export const recordAdmission = async (leadId: string, amount: number, discountLocked: string, expiry: string, expectedSaleDate: string, referredBy: string | null = null) => {
  if (isTursoConfigured && client) {
    const id = 'adm_' + Date.now().toString(36);
    try {
      await client.execute({
        sql: `INSERT INTO admissions (id, lead_id, amount, discount_locked, offer_expiry, expected_sale_date, status, referred_by_student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, leadId, amount, discountLocked, expiry, expectedSaleDate, 'Active', referredBy]
      });
      // Move lead to Admission bucket D
      await client.execute({
        sql: `UPDATE leads SET bucket_stage = 'D' WHERE id = ?`,
        args: [leadId]
      });
      return id;
    } catch (e) { console.error(e); }
  }
  return null;
};

export const getAdmissionForLead = async (leadId: string): Promise<any | null> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute({
        sql: "SELECT * FROM admissions WHERE lead_id = ? AND status = 'Active' ORDER BY rowid DESC LIMIT 1",
        args: [leadId]
      });
      if (result.rows.length > 0) return result.rows[0];
    } catch (e) { console.error(e); }
  }
  return null;
};

export const recordSale = async (leadId: string, courseId: string, totalFee: number, amountPaid: number, admissionId: string | null, salesExecId: string, referredBy: string | null = null, paymentMode: string = 'UPI') => {
  if (isTursoConfigured && client) {
    const id = 'sal_' + Date.now().toString(36);
    const status = amountPaid >= totalFee ? 'Sale Completed' : 'Sale Partial Closed';
    try {
      await client.execute({
        sql: `INSERT INTO sales (id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id, referred_by_student_id, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, leadId, admissionId, courseId, totalFee, amountPaid, status, salesExecId, referredBy, paymentMode]
      });
      // Move lead to proper Sales bucket E
      await client.execute({
        sql: `UPDATE leads SET bucket_stage = 'E' WHERE id = ?`,
        args: [leadId]
      });
      // Create Manager Approval task
      const apprId = 'appr_' + Date.now().toString(36);
      await client.execute({
        sql: `INSERT INTO manager_approvals (id, sale_id, checklist_json, status, notes, approver_id, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [apprId, id, JSON.stringify({
          payment_verified: false,
          course_confirmed: false,
          batch_available: false,
          docs_received: false,
          teacher_assignable: false,
          joining_date_feasible: false
        }), 'Pending', '', null, null]
      });
      return id;
    } catch (e) { console.error(e); }
  }
  return null;
};
export interface Sale {
  id: string;
  lead_id: string;
  admission_id: string | null;
  course_id: string;
  total_fee: number;
  amount_paid: number;
  status: string;
  sales_exec_id: string;
  referred_by_student_id: string | null;
  created_at?: string;
}

export const getSales = async (): Promise<Sale[]> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute("SELECT * FROM sales ORDER BY created_at DESC");
      return result.rows.map(row => ({
        id: row.id as string,
        lead_id: row.lead_id as string,
        admission_id: row.admission_id as string | null,
        course_id: row.course_id as string,
        total_fee: row.total_fee as number,
        amount_paid: row.amount_paid as number,
        status: row.status as string,
        sales_exec_id: row.sales_exec_id as string,
        referred_by_student_id: row.referred_by_student_id as string | null,
        created_at: row.created_at as string
      }));
    } catch (e) {
      console.error(e);
    }
  }

  // Local fallback
  const localSales = localStorage.getItem('erp_sales_dev');
  if (localSales) {
    return JSON.parse(localSales);
  }

  // Seed data
  const demoSales: Sale[] = [
    {
      id: 'sal_demo_1',
      lead_id: 'lead_demo_1',
      admission_id: null,
      course_id: 'Data Science Bootcamp',
      total_fee: 50000,
      amount_paid: 25000,
      status: 'Sale Partial Closed',
      sales_exec_id: 'usr_dev_sales',
      referred_by_student_id: null,
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('erp_sales_dev', JSON.stringify(demoSales));
  return demoSales;
};
