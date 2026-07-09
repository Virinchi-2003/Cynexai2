import { describe, it, expect, beforeAll } from 'vitest';
import { getUserByEmail } from './auth';
import { decryptPassword } from '../crypto';

describe('Production Authentication Enforcement', () => {
  it('should DENY access to deleted demo accounts', async () => {
    const demoAccounts = ['admin@cynexai.in', 'ceo@cynexai.com', 'clerk@cynexai.in'];
    
    for (const email of demoAccounts) {
      const user = await getUserByEmail(email);
      expect(user, `Demo account ${email} should NOT exist`).toBeNull();
    }
  });

  it('should ALLOW access to real employee accounts with correct roles', async () => {
    const realEmployees = [
      { email: 'eswarsudheer98@gmail.com', role: 'CEO' },
      { email: 'leonard001@gmail.com', role: 'Manager' },
      { email: 'leela@gmail.com', role: 'DM' },
      { email: 'sandeep.cynexai@gmail.com', role: 'Sales/HR' },
      { email: 'venkateswarreddykatreddy29@gmail.com', role: 'Teacher' }
    ];

    for (const emp of realEmployees) {
      const user = await getUserByEmail(emp.email);
      expect(user, `Employee ${emp.email} should exist`).not.toBeNull();
      expect(user?.role).toBe(emp.role);
      
      const decrypted = decryptPassword(user?.password_encrypted as string);
      expect(decrypted, `Employee ${emp.email} should have cynex123 password`).toBe('cynex123');
    }
  });

  it('should successfully decrypt a real student password', async () => {
    // Testing one of the imported students
    const user = await getUserByEmail('cai0047@student.cynexai.com');
    expect(user).not.toBeNull();
    
    const decrypted = decryptPassword(user?.password_encrypted as string);
    // Student password should be CAI0047 or cynex123
    expect(decrypted).toBeTruthy(); 
    expect(decrypted !== '', 'Student password should decrypt properly without error').toBe(true);
  });
});
