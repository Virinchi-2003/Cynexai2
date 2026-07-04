import React, { useEffect, useState } from 'react';
import { getTasksForUser, checkInTask, Task } from '../../lib/api/tasks';
import { getCurrentUser } from '../../lib/auth';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { CheckCircle, Circle } from 'lucide-react';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const user = getCurrentUser();

  const loadData = () => {
    if (user) {
      getTasksForUser(user.id).then(setTasks);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTaskCheckIn = async (task: Task, amount: number = 1) => {
    if (task.status === 'Completed') return;
    const newCount = Math.min(task.target_check_in_count, task.check_in_count + amount);
    await checkInTask(task.id, newCount, task.target_check_in_count);
    loadData();
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <h1 className="text-3xl font-display font-bold text-erp-text mb-6">My Tasks</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold font-display text-erp-text mb-4 border-b-2 border-erp-border pb-2">Pending ({pendingTasks.length})</h2>
            <div className="flex flex-col gap-4">
              {pendingTasks.length === 0 ? (
                <div className="text-center p-10 text-erp-text/50 font-bold border-2 border-dashed border-erp-border rounded-3xl">
                  You're all caught up!
                </div>
              ) : (
                pendingTasks.map(task => (
                  <Card key={task.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <button className="text-erp-primary" onClick={() => task.target_check_in_count === 1 && handleTaskCheckIn(task, 1)}>
                        <Circle className="w-6 h-6" />
                      </button>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-erp-text">{task.title}</h4>
                          {task.is_recurring && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Recurring</span>
                          )}
                        </div>
                        <p className="text-xs text-erp-text/70">{task.description}</p>
                      </div>
                    </div>

                    {task.target_check_in_count > 1 && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs font-bold mb-2 text-erp-text">
                          <span>Progress</span>
                          <span>{task.check_in_count} / {task.target_check_in_count}</span>
                        </div>
                        <div className="w-full h-2 bg-erp-border rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full bg-erp-primary transition-all" 
                            style={{ width: `${Math.min(100, (task.check_in_count / task.target_check_in_count) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" onClick={() => handleTaskCheckIn(task, 1)} className="py-1 px-3 text-xs">+1</Button>
                          <Button variant="info" onClick={() => handleTaskCheckIn(task, 5)} className="py-1 px-3 text-xs">+5</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-erp-text mb-4 border-b-2 border-erp-border pb-2">Completed ({completedTasks.length})</h2>
            <div className="flex flex-col gap-4 opacity-75">
              {completedTasks.map(task => (
                <Card key={task.id} className="flex items-center gap-3 bg-erp-surface/50 border-transparent shadow-none">
                  <div className="text-erp-primary">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-erp-text/50 line-through">{task.title}</h4>
                    <p className="text-xs text-erp-text/50">{task.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
