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
    let query = 'SELECT u.*, s.classes_attended_json, s.preferred_mode, s.batch_number, s.course, s.topic_completed, s.joining_date FROM users u LEFT JOIN students s ON u.email = s.portal_login_email';
    const args: any[] = [];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      for (const [key, val] of Object.entries(filters)) {
        if (!val) continue;

        if (key === 'search') {
          conditions.push(`(u.name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)`);
          args.push(`%${val}%`, `%${val}%`, `%${val}%`);
        } else if (key === 'course') {
          conditions.push(`s.course = ?`);
          args.push(val);
        } else if (key === 'batch') {
          conditions.push(`s.batch_number = ?`);
          args.push(val);
        } else if (key === 'startDate') {
          conditions.push(`s.joining_date >= ?`);
          args.push(val);
        } else if (key === 'endDate') {
          conditions.push(`s.joining_date <= ?`);
          args.push(val);
        } else if (key === 'role') {
          if (typeof val === 'object' && val !== null && val._neq !== undefined) {
            conditions.push(`u.role != ?`);
            args.push(val._neq);
          } else {
            conditions.push(`u.role = ?`);
            args.push(val);
          }
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    if (sortBy && sortBy !== 'actions') {
      // Map UI keys to DB columns
      const sortColumnMap: Record<string, string> = {
        'name': 'u.name',
        'email': 'u.email',
        'role': 'u.role',
        'status': 'u.status',
        'salary': 'u.salary'
      };
      const dbColumn = sortColumnMap[sortBy];
      
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn}`;
        if (sortDir === 'desc' || sortDir === 'asc') {
          query += ` ${sortDir.toUpperCase()}`;
        }
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

export async function getFilterOptions(): Promise<{courses: string[], batches: string[]}> {
  try {
    const res = await executeWithRetry('SELECT DISTINCT course, batch_number FROM students WHERE course IS NOT NULL OR batch_number IS NOT NULL');
    const courses = Array.from(new Set(res.rows.map((r: any) => String(r.course)).filter(c => c && c !== 'null')));
    const batches = Array.from(new Set(res.rows.map((r: any) => String(r.batch_number)).filter(b => b && b !== 'null')));
    return { courses, batches };
  } catch (error) {
    console.error('Failed to get filter options', error);
    return { courses: [], batches: [] };
  }
}

export async function getCourseCurriculum(): Promise<Record<string, string[]>> {
  try {
    const res = await executeWithRetry(`
      SELECT c.title as course_title, m.title as module_title 
      FROM courses c 
      JOIN course_module_mapping cmm ON c.id = cmm.course_id 
      JOIN modules m ON cmm.module_id = m.id
      ORDER BY c.title, cmm.order_index
    `);
    
    const mapping: Record<string, string[]> = {};
    for (const row of res.rows) {
      const course = String(row.course_title);
      const mod = String(row.module_title);
      if (!mapping[course]) mapping[course] = [];
      mapping[course].push(mod);
    }
    return mapping;
  } catch (error) {
    console.error('Failed to get course curriculum', error);
    return {};
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

export async function deleteUser(id: string, email: string): Promise<void> {
  try {
    // Delete from users table
    await executeWithRetry("DELETE FROM users WHERE id = ?", [id]);
    
    // Attempt to delete from students table as well if email exists
    if (email) {
      await executeWithRetry("DELETE FROM students WHERE portal_login_email = ?", [email]);
    }
  } catch (error) {
    console.error('Failed to delete user', error);
    throw error;
  }
}

// ─── STUDENT DOCUMENTS ──────────────────────────────────────────────────────

export async function uploadStudentDocument(
  studentId: string,
  docType: string,
  fileName: string,
  fileData: string, // base64 string
  uploadedBy: string
): Promise<string> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await executeWithRetry(
    `INSERT INTO student_documents (id, student_id, doc_type, file_name, file_data, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, studentId, docType, fileName, fileData, uploadedBy, new Date().toISOString()]
  );
  return id;
}

export async function getStudentDocuments(studentId: string): Promise<any[]> {
  try {
    const res = await executeWithRetry(
      `SELECT id, student_id, doc_type, file_name, uploaded_by, uploaded_at FROM student_documents WHERE student_id = ? ORDER BY uploaded_at DESC`,
      [studentId]
    );
    return res.rows;
  } catch (error) {
    console.error('Failed to get student documents', error);
    return [];
  }
}

export async function getStudentDocumentData(docId: string): Promise<string | null> {
  try {
    const res = await executeWithRetry(
      `SELECT file_data FROM student_documents WHERE id = ?`,
      [docId]
    );
    return res.rows[0]?.file_data as string ?? null;
  } catch (error) {
    console.error('Failed to get document data', error);
    return null;
  }
}

export async function deleteStudentDocument(docId: string): Promise<void> {
  await executeWithRetry(`DELETE FROM student_documents WHERE id = ?`, [docId]);
}

export async function updateStudentProfile(studentId: string, profile: {
  phone?: string; dob?: string; address?: string;
  father_name?: string; mother_name?: string;
  emergency_contact?: string; blood_group?: string;
  batch_number?: string; course?: string; joining_date?: string; status?: string;
}): Promise<void> {
  const fields = Object.keys(profile) as (keyof typeof profile)[];
  if (fields.length === 0) return;
  const setClauses = fields.map(f => `${f} = ?`).join(', ');
  const args = [...fields.map(f => (profile[f] ?? null) as any), studentId];
  await executeWithRetry(`UPDATE students SET ${setClauses} WHERE id = ?`, args);
}

// ─── CSV BULK STUDENT IMPORT ────────────────────────────────────────────────

export async function bulkImportStudents(rows: {
  name: string; email: string; phone?: string;
  course?: string; batch_number?: string; joining_date?: string;
  status?: string; password?: string;
}[]): Promise<{ imported: number; errors: string[] }> {
  const { encryptPassword } = await import('../crypto');
  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.name || !row.email) {
      errors.push(`Skipped row — missing name or email: ${JSON.stringify(row)}`);
      continue;
    }
    try {
      const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const studentId = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const studentCode = `CNX-${new Date().getFullYear()}-${String(imported + 1).padStart(4, '0')}`;
      const encPw = encryptPassword(row.password || 'cynex123');

      await executeWithRetry(
        `INSERT OR IGNORE INTO users (id, name, email, phone, role, status, password_hash, password_encrypted)
         VALUES (?, ?, ?, ?, 'Student', ?, ?, ?)`,
        [userId, row.name, row.email, row.phone || '', row.status || 'Active', encPw, encPw]
      );
      await executeWithRetry(
        `INSERT OR IGNORE INTO students (id, student_code, portal_login_email, status, course, batch_number, joining_date, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, studentCode, row.email, row.status || 'Active', row.course || null, row.batch_number || null, row.joining_date || null, row.phone || null]
      );
      imported++;
    } catch (err: any) {
      errors.push(`Failed for ${row.email}: ${err.message}`);
    }
  }

  return { imported, errors };
}
