import { client, isTursoConfigured } from '../turso';
import { Lead, LeadBucket } from '../types';


export const getLeads = async (): Promise<Lead[]> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute("SELECT * FROM leads ORDER BY created_at DESC");
      return result.rows.map(row => ({
        id: row.id as string,
        name: row.name as string,
        phone: row.phone as string,
        course_interest: row.course_interest as string,
        source: row.source as string,
        bucket_stage: row.bucket_stage as LeadBucket,
        assigned_to: row.assigned_to as string,
        created_at: row.created_at as string
      }));
    } catch (e) {
      console.error("Failed to fetch leads", e);
    }
  }
  
  // Local storage fallback for development
  const localLeads = localStorage.getItem('erp_leads_dev');
  if (localLeads) {
    return JSON.parse(localLeads);
  }
  
  // Seed demo lead if none exist
  const demoLeads = [
    { id: 'lead_demo_1', name: 'Rahul Demo', phone: '9876543210', course_interest: 'Data Science', source: 'Facebook', bucket_stage: 'Demo Scheduled', assigned_to: 'usr_dev_sales', created_at: new Date().toISOString() }
  ];
  localStorage.setItem('erp_leads_dev', JSON.stringify(demoLeads));
  return demoLeads;
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute({
        sql: "SELECT * FROM leads WHERE id = ?",
        args: [id]
      });
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id as string,
          name: row.name as string,
          phone: row.phone as string,
          course_interest: row.course_interest as string,
          source: row.source as string,
          bucket_stage: row.bucket_stage as LeadBucket,
          assigned_to: row.assigned_to as string,
          created_at: row.created_at as string
        };
      }
    } catch (e) {
      console.error("Failed to fetch lead", e);
    }
  } else {
    const leads = JSON.parse(localStorage.getItem('erp_leads_dev') || '[]');
    return leads.find((l: Lead) => l.id === id) || null;
  }
  return null;
};

export const createLead = async (lead: Omit<Lead, 'id' | 'created_at'>) => {
  const id = 'lead_' + Date.now().toString(36);
  const created_at = new Date().toISOString();
  
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `INSERT INTO leads (id, name, phone, course_interest, source, bucket_stage, assigned_to, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, lead.name, lead.phone, lead.course_interest, lead.source, lead.bucket_stage, lead.assigned_to, created_at]
      });
      return id;
    } catch (e) {
      console.error("Failed to create lead", e);
    }
  } else {
    // Local fallback
    const leads = JSON.parse(localStorage.getItem('erp_leads_dev') || '[]');
    leads.push({ id, ...lead, created_at });
    localStorage.setItem('erp_leads_dev', JSON.stringify(leads));
    return id;
  }
  return null;
};

export const updateLeadStatus = async (id: string, newStatus: string) => {
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `UPDATE leads SET bucket_stage = ? WHERE id = ?`,
        args: [newStatus, id]
      });
      return true;
    } catch (e) {
      console.error("Failed to update lead status", e);
    }
  } else {
    // Local fallback
    const leads = JSON.parse(localStorage.getItem('erp_leads_dev') || '[]');
    const leadIndex = leads.findIndex((l: Lead) => l.id === id);
    if (leadIndex >= 0) {
      leads[leadIndex].bucket_stage = newStatus;
      localStorage.setItem('erp_leads_dev', JSON.stringify(leads));
      return true;
    }
  }
  return false;
};
