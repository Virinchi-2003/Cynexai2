import { client, isTursoConfigured } from './turso';

export type Role = 'Admin' | 'Manager' | 'Sales/HR' | 'Teacher' | 'Student' | 'CEO' | 'DM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Simple local storage key for session
const SESSION_KEY = 'erp_session_token';

// A mock function to get the current user session
export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login';
};

// Seed function if no users exist
export const seedInitialUsers = async () => {
  if (!isTursoConfigured || !client) return;
  
  try {
    const result = await client.execute("SELECT COUNT(*) as count FROM erp_users");
    if (result.rows[0].count === 0) {
      const defaultUsers = [
        { id: 'usr_sales', name: 'Sandeep', email: 'sandeep.cynexai@gmail.com', password: 'Sandeep@142', role: 'Sales/HR' },
        { id: 'usr_manager', name: 'Manager', email: 'manager@cynexai.com', password: 'admin123', role: 'Manager' },
        { id: 'usr_ceo', name: 'CEO', email: 'ceo@cynexai.com', password: 'admin123', role: 'CEO' },
        { id: 'usr_dm', name: 'Marketer', email: 'dm@cynexai.com', password: 'admin123', role: 'DM' },
        { id: 'usr_teacher', name: 'Teacher', email: 'teacher@cynexai.com', password: 'admin123', role: 'Teacher' },
        { id: 'usr_student', name: 'Student', email: 'student@cynexai.com', password: 'admin123', role: 'Student' }
      ];
      for (const u of defaultUsers) {
        await client.execute({
          sql: `INSERT INTO erp_users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.name, u.email, u.password, u.role, new Date().toISOString()]
        });
      }
      console.log("Seeded initial users into erp_users");
    }
  } catch (e) {
    console.error("Failed to seed initial users:", e);
  }
};

export const login = async (email: string, password: string): Promise<User | null> => {
  await seedInitialUsers();
  
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute({
        sql: "SELECT id, name, email, role, password_hash FROM erp_users WHERE email = ?",
        args: [email]
      });
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        // Plaintext comparison for development speed as requested
        if (row.password_hash === password) {
          const user: User = {
            id: row.id as string,
            name: row.name as string,
            email: row.email as string,
            role: row.role as Role
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          return user;
        } else {
          console.error("Invalid password.");
        }
      } else {
        console.error("User not found.");
      }
    } catch (e) {
      console.error("Login DB error:", e);
    }
  } else {
      console.error("Turso database is not configured. Missing API keys.");
  }
  
  return null;
};
