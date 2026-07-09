import { client } from '../turso';
import { encryptPassword } from '../crypto';

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

export async function getUsers(filters?: Record<string, any>, sortBy?: string, sortDir?: string): Promise<any[]> {
  try {
    let query = 'SELECT u.*, s.classes_attended_json, s.preferred_mode FROM users u LEFT JOIN students s ON u.email = s.portal_login_email';
    const args: any[] = [];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      for (const [key, val] of Object.entries(filters)) {
        if (typeof val === 'object' && val !== null && val._neq !== undefined) {
          conditions.push(`${key} != ?`);
          args.push(val._neq);
        } else if (typeof val === 'string' && val.trim() !== '') {
          conditions.push(`${key} LIKE ?`);
          args.push(`%${val}%`);
        } else {
          conditions.push(`${key} = ?`);
          args.push(val);
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    if (sortBy) {
      query += ` ORDER BY u.${sortBy}`;
      if (sortDir) {
        query += ` ${sortDir}`;
      }
    }

    const res = await executeWithRetry(query, args);
    return res.rows.map((row: any) => ({
      ...row,
      salary: Number(row.salary) || 0
    }));
  } catch (error) {
    console.error('Failed to fetch users', error);
    return [];
  }
}

export async function saveUser(user: any): Promise<void> {
  try {
    const encPw = user.password ? encryptPassword(user.password) : encryptPassword('cynex123');
    const salary = user.salary || 0;
    const status = user.status || 'Active';

    if (user.id) {
      await executeWithRetry(
        "UPDATE users SET name=?, email=?, phone=?, role=?, salary=?, status=?, password_hash=?, password_encrypted=? WHERE id=?",
        [user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw, user.id]
      );
    } else {
      const newId = `usr_${Date.now()}`;
      await executeWithRetry(
        "INSERT INTO users (id, name, email, phone, role, salary, status, password_hash, password_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newId, user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw]
      );
    }
  } catch (error) {
    console.error('Failed to save user', error);
    throw error;
  }
}

export async function patchUser(id: string, updates: Record<string, any>): Promise<void> {
  try {
    if (!updates || Object.keys(updates).length === 0) return;
    
    const setClauses = Object.keys(updates).map(key => `${key} = ?`);
    const args = [...Object.values(updates), id];
    
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
    await executeWithRetry(query, args);
  } catch (error) {
    console.error('Failed to patch user', error);
    throw error;
  }
}

export async function updateStudentAttended(email: string, classesAttendedJson: string): Promise<void> {
  try {
    await executeWithRetry(
      "UPDATE students SET classes_attended_json = ? WHERE portal_login_email = ?",
      [classesAttendedJson, email]
    );
  } catch (error) {
    console.error('Failed to update student attended classes', error);
    throw error;
  }
}
