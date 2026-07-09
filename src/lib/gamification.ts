import { client } from './turso';

export const awardGamificationCoins = async (studentId: string, taskType: string): Promise<boolean> => {
  if (!client) return false;
  try {
    // 1. Check if the task type is enabled in gamification_settings
    const settingRes = await client.execute({
      sql: "SELECT is_enabled, reward_amount FROM gamification_settings WHERE task_type = ?",
      args: [taskType]
    });
    
    if (settingRes.rows.length === 0) return false; // Task type not found
    
    const setting = settingRes.rows[0];
    if (!setting.is_enabled) return false; // Turned off by manager
    
    const rewardAmount = Number(setting.reward_amount);
    
    // 2. Award coins to the student
    await client.execute({
      sql: "UPDATE students SET coins = coins + ? WHERE id = ? OR student_code = ?",
      args: [rewardAmount, studentId, studentId]
    });
    
    return true;
  } catch (e) {
    console.error("Failed to award gamification coins:", e);
    return false;
  }
};
