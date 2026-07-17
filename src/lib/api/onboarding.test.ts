import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPendingStudent, approveStudent, rejectStudent, getPendingStudents } from './users';
import { client } from '../turso';

// Mock the turso database client
vi.mock('../turso', () => ({
  client: {
    execute: vi.fn()
  }
}));

describe('Onboarding Approval API Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createPendingStudent inserts a student with Pending status and no portal user', async () => {
    const studentData = {
      name: 'Test Lead',
      phone: '1234567890',
      email: 'test@example.com',
      fees_total: 50000,
      fees_paid: 10000,
      fees_pending: 40000,
      joining_date: '2026-07-01',
      training_start_date: '2026-07-15',
      course: 'AI Masterclass',
      documents_submitted: 1,
      gender: 'Male',
      dob: '2000-01-01'
    };

    (client.execute as any).mockResolvedValueOnce({ rows: [] });

    await createPendingStudent(studentData);

    // Verify it inserts into students table with approval_status = Pending
    expect(client.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO students'),
        args: expect.arrayContaining(['test@example.com', '1234567890', 50000, 'Male'])
      })
    );

    // Verify it does NOT insert into users table (since it's pending)
    expect(client.execute).not.toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.stringContaining('INSERT INTO users') })
    );
  });

  it('approveStudent updates student status and creates a portal user', async () => {
    const studentId = 'stu_123';
    const portalId = 'CYN-2026-9999';
    const password = 'securepassword';

    (client.execute as any).mockResolvedValue({ rows: [] });

    await approveStudent(studentId, portalId, password, 'test@example.com', 'Test Lead');

    // Verify it updates student status to Approved
    expect(client.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE students SET approval_status = ?'),
        args: expect.arrayContaining(['Approved', portalId, studentId])
      })
    );

    // Verify it inserts into users table for portal login
    expect(client.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO users'),
        args: expect.arrayContaining([expect.any(String), 'Test Lead', 'test@example.com'])
      })
    );
  });

  it('rejectStudent updates student status to Rejected without creating portal user', async () => {
    const studentId = 'stu_456';

    (client.execute as any).mockResolvedValueOnce({ rows: [] });

    await rejectStudent(studentId);

    // Verify it updates student status
    expect(client.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE students SET approval_status = ?'),
        args: expect.arrayContaining(['Rejected', studentId])
      })
    );

    // Verify it does NOT insert into users table
    expect(client.execute).not.toHaveBeenCalledWith(
      expect.objectContaining({ sql: expect.stringContaining('INSERT INTO users') })
    );
  });

  it('getPendingStudents fetches only students with Pending status', async () => {
    (client.execute as any).mockResolvedValueOnce({
      rows: [{ id: '1', name: 'John', approval_status: 'Pending' }]
    });

    const result = await getPendingStudents();

    expect(client.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('SELECT * FROM students WHERE approval_status = ?'),
        args: ['Pending']
      })
    );
    expect(result).toHaveLength(1);
  });
});
