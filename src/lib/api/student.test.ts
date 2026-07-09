import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentDashboardData } from './student';
import { client } from '../turso';

vi.mock('../turso', () => ({
  client: {
    execute: vi.fn()
  }
}));

describe('Student API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentDashboardData', () => {
    it('should fetch all dashboard components', async () => {
      // Mock 5 successive DB calls
      vi.mocked(client.execute)
        .mockResolvedValueOnce({ rows: [{ id: 'c1', title: 'Course 1' }] } as any) // Course
        .mockResolvedValueOnce({ rows: [{ streak: 5, coins: 100 }] } as any) // Gamification
        .mockResolvedValueOnce({ rows: [{ id: 'm1', title: 'Module 1', map_order: 1 }] } as any) // Modules
        .mockResolvedValueOnce({ rows: [{ id: 'cl1', module_id: 'm1', status: 'completed' }] } as any) // Classes
        .mockResolvedValueOnce({ rows: [{ lesson_id: 'cl1' }] } as any); // Progress

      const result = await getStudentDashboardData('std_1');

      expect(client.execute).toHaveBeenCalledTimes(5);
      expect(result.course.title).toBe('Course 1');
      expect(result.gamification.streak).toBe(5);
      expect(result.modules[0].completedClasses).toBe(1);
    });

    it('should return null course if no active course found', async () => {
      vi.mocked(client.execute).mockResolvedValueOnce({ rows: [] } as any).mockResolvedValueOnce({ rows: [] } as any);
      const result = await getStudentDashboardData('std_1');
      expect(result.course).toBeNull();
    });
  });
});
