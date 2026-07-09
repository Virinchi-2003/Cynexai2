import { encryptPassword, decryptPassword } from './crypto';
import { getUserByEmail } from './api/auth';

export type Role = 'Admin' | 'Manager' | 'Sales/HR' | 'Teacher' | 'Student' | 'CEO' | 'DM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  salary?: number;
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

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    const row = await getUserByEmail(email);
    
    if (row) {
      // Decrypt password from DB and compare
      const decryptedDbPassword = decryptPassword(row.password_encrypted as string);
      
      if (decryptedDbPassword === password) {
        const user: User = {
          id: row.id as string,
          name: row.name as string,
          email: row.email as string,
          role: row.role as Role,
          salary: Number(row.salary) || 0
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
  
  return null;
};
