import { client, isTursoConfigured } from '../turso';

export interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  assignee_id: string;
  created_by: string;
  due_date: string;
  recurrence_rule: string;
  status: string;
  check_in_count: number;
  target_check_in_count: number;
}

export const getTasksForUser = async (userId: string): Promise<Task[]> => {
  if (isTursoConfigured && client) {
    try {
      const result = await client.execute({
        sql: "SELECT * FROM tasks WHERE assignee_id = ? ORDER BY due_date ASC",
        args: [userId]
      });
      return result.rows.map(row => ({
        id: row.id as string,
        type: row.type as string,
        title: row.title as string,
        description: row.description as string,
        target_value: Number(row.target_value),
        current_value: Number(row.current_value),
        assignee_id: row.assignee_id as string,
        created_by: row.created_by as string,
        due_date: row.due_date as string,
        recurrence_rule: row.recurrence_rule as string,
        status: row.status as string,
        check_in_count: Number(row.check_in_count || 0),
        target_check_in_count: Number(row.target_check_in_count || 1)
      }));
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  }
  
  // Local storage fallback
  const localTasks = localStorage.getItem(`erp_tasks_dev_${userId}`);
  if (localTasks) {
    return JSON.parse(localTasks);
  }
  
  // Seed demo task
  const demoTasks = [
    { id: 'tsk_demo_1', type: 'daily', title: 'Check HR Policies', description: 'Review the new HR policies for Q3.', target_value: 0, current_value: 0, assignee_id: userId, created_by: 'manager', due_date: '2026-07-10', recurrence_rule: 'none', status: 'Pending', check_in_count: 0, target_check_in_count: 1 },
    { id: 'tsk_demo_2', type: 'daily', title: 'Call 30 Leads', description: 'Reach out to new leads from the Meta campaign.', target_value: 30, current_value: 0, assignee_id: userId, created_by: 'manager', due_date: '2026-07-10', recurrence_rule: 'daily', status: 'Pending', check_in_count: 5, target_check_in_count: 30 }
  ];
  localStorage.setItem(`erp_tasks_dev_${userId}`, JSON.stringify(demoTasks));
  return demoTasks;
};

export const checkInTask = async (taskId: string, newCount: number, targetCount: number) => {
  const newStatus = newCount >= targetCount ? 'Completed' : 'Pending';
  
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `UPDATE tasks SET check_in_count = ?, status = ? WHERE id = ?`,
        args: [newCount, newStatus, taskId]
      });
      return true;
    } catch (e) {
      console.error("Failed to check in task", e);
    }
  } else {
    // Local fallback
    // In local fallback, we update all users just in case (hack for dev mode)
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('erp_tasks_dev_')) {
        const tasks = JSON.parse(localStorage.getItem(key) || '[]');
        const tIndex = tasks.findIndex((t: Task) => t.id === taskId);
        if (tIndex >= 0) {
          tasks[tIndex].check_in_count = newCount;
          tasks[tIndex].status = newStatus;
          localStorage.setItem(key, JSON.stringify(tasks));
          return true;
        }
      }
    }
  }
  return false;
};

export const createTask = async (task: Omit<Task, 'id' | 'status' | 'current_value' | 'check_in_count'>) => {
  const id = 'tsk_' + Date.now().toString(36);
  if (isTursoConfigured && client) {
    try {
      await client.execute({
        sql: `INSERT INTO tasks (id, type, title, description, target_value, current_value, assignee_id, created_by, due_date, recurrence_rule, status, check_in_count, target_check_in_count) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, task.type, task.title, task.description, task.target_value, 0, task.assignee_id, task.created_by, task.due_date, task.recurrence_rule, 'Pending', 0, task.target_check_in_count
        ]
      });
      return id;
    } catch (e) {
      console.error("Failed to create task", e);
    }
  } else {
    // Local fallback
    const key = `erp_tasks_dev_${task.assignee_id}`;
    const tasks = JSON.parse(localStorage.getItem(key) || '[]');
    tasks.push({
      id, ...task, current_value: 0, status: 'Pending', check_in_count: 0
    });
    localStorage.setItem(key, JSON.stringify(tasks));
    return id;
  }
  return null;
};
