import { client } from '../turso';
import { getCurrentUser } from '../auth';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
}

export const getTemplates = async (): Promise<WhatsAppTemplate[]> => {
  try {
    if (!client) return [];
    const res = await client.execute('SELECT * FROM whatsapp_templates ORDER BY name ASC');
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      body: row.body,
      category: row.category,
    }));
  } catch (e) {
    console.error('Failed to get WhatsApp templates', e);
    return [];
  }
};

export const createTemplate = async (name: string, body: string, category: string): Promise<string | null> => {
  try {
    const user = getCurrentUser();
    if (!user || !['Manager', 'CEO', 'DM'].includes(user.role)) return null;
    
    if (!client) return null;
    const id = 'tpl_' + Math.random().toString(36).substr(2, 9);
    
    await client.execute({
      sql: 'INSERT INTO whatsapp_templates (id, name, body, category) VALUES (?, ?, ?, ?)',
      args: [id, name, body, category]
    });
    return id;
  } catch (e) {
    console.error('Failed to create WhatsApp template', e);
    return null;
  }
};

export const updateTemplate = async (id: string, name: string, body: string, category: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !['Manager', 'CEO', 'DM'].includes(user.role)) return false;
    
    if (!client) return false;
    await client.execute({
      sql: 'UPDATE whatsapp_templates SET name = ?, body = ?, category = ? WHERE id = ?',
      args: [name, body, category, id]
    });
    return true;
  } catch (e) {
    console.error('Failed to update WhatsApp template', e);
    return false;
  }
};

export const deleteTemplate = async (id: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !['Manager', 'CEO', 'DM'].includes(user.role)) return false;
    
    if (!client) return false;
    await client.execute({
      sql: 'DELETE FROM whatsapp_templates WHERE id = ?',
      args: [id]
    });
    return true;
  } catch (e) {
    console.error('Failed to delete WhatsApp template', e);
    return false;
  }
};
