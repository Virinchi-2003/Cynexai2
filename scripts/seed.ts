import 'dotenv/config';
import { client } from '../src/lib/turso';
import { encryptPassword } from '../src/lib/crypto';

export const seedInitialUsers = async () => {
  if (!client) {
    console.error("Turso client not configured.");
    return;
  }
  try {
    const result = await client.execute("SELECT COUNT(*) as count FROM users");
    if (result.rows[0].count === 0) {
      const defaultUsers = [
        { id: 'usr_sales', name: 'Sandeep', email: 'sandeep.cynexai@gmail.com', password: 'Sandeep@142', role: 'Sales/HR', salary: 45000 },
        { id: 'usr_manager', name: 'Manager', email: 'manager@cynexai.com', password: 'admin123', role: 'Manager', salary: 85000 },
        { id: 'usr_ceo', name: 'CEO', email: 'ceo@cynexai.com', password: 'admin123', role: 'CEO', salary: 150000 },
        { id: 'usr_dm', name: 'Marketer', email: 'dm@cynexai.com', password: 'admin123', role: 'DM', salary: 60000 },
        { id: 'usr_teacher', name: 'Teacher', email: 'teacher@cynexai.com', password: 'admin123', role: 'Teacher', salary: 50000 },
        { id: 'usr_student', name: 'Student', email: 'student@cynexai.com', password: 'admin123', role: 'Student', salary: 0 }
      ];
      for (const u of defaultUsers) {
        await client.execute({
          sql: `INSERT INTO users (id, name, email, password_encrypted, role, salary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.name, u.email, encryptPassword(u.password), u.role, u.salary, new Date().toISOString()]
        });
      }
      console.log("Seeded initial users into users table");
    } else {
      console.log("users table already seeded");
    }
  } catch (e) {
    console.error("Failed to seed initial users:", e);
  }
};

seedInitialUsers();
