import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGamificationSettings, updateGamificationSetting, awardCoinsManually } from './gamification';
import { client } from '../turso';

vi.mock('../turso', () => ({
  client: {
    execute: vi.fn()
  }
}));

describe('Gamification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGamificationSettings', () => {
    it('should fetch settings from database', async () => {
      const mockRows = [{ task_type: 'daily_login', is_enabled: 1, reward_amount: 10 }];
      vi.mocked(client.execute).mockResolvedValueOnce({ rows: mockRows } as any);
      
      const result = await getGamificationSettings();
      
      expect(client.execute).toHaveBeenCalledWith({ sql: 'SELECT * FROM gamification_settings', args: [] });
      expect(result).toEqual([{ task_type: 'daily_login', is_enabled: true, reward_amount: 10 }]);
    });
  });

  describe('updateGamificationSetting', () => {
    it('should update the setting correctly', async () => {
      vi.mocked(client.execute).mockResolvedValueOnce({ rows: [] } as any);
      await updateGamificationSetting('daily_login', false, 20);
      expect(client.execute).toHaveBeenCalledWith({
        sql: "UPDATE gamification_settings SET is_enabled = ?, reward_amount = ? WHERE task_type = ?",
        args: [0, 20, 'daily_login']
      });
    });
  });

  describe('awardCoinsManually', () => {
    it('should increment coins for a specific student', async () => {
      vi.mocked(client.execute).mockResolvedValueOnce({ rows: [] } as any);
      await awardCoinsManually('std_1', 50);
      expect(client.execute).toHaveBeenCalledWith({
        sql: "UPDATE students SET coins = coins + ? WHERE student_code = ? OR id = ?",
        args: [50, 'std_1', 'std_1']
      });
    });
  });
});
