import React, { useState, useEffect } from 'react';
import { Task, getTasksForUser, getAllTasks, getTasksByCreator, createTask, getTasksByDateRange } from '../../../lib/api/tasks';
import { getCurrentUser } from '../../../lib/auth';
import { Button } from '../../ui/erp/Button';
import { TaskListView } from './TaskListView';
import { TaskBoardView } from './TaskBoardView';
import { TaskCalendarView } from './TaskCalendarView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { LayoutList, LayoutGrid, CalendarDays, Plus, Search, X } from 'lucide-react';
import { getErpUsers } from '../../../lib/api/manager';

type ViewMode = 'list' | 'board' | 'calendar';
type FilterMode = 'today' | 'my' | 'all' | 'assigned';

export default function AsanaTaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [taskFilter, setTaskFilter] = useState<FilterMode>('today');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskType, setNewTaskType] = useState<'One-Time' | 'Daily' | 'Yes/No' | 'Number'>('One-Time');
  const [newTaskTargetNumber, setNewTaskTargetNumber] = useState('10');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const user = getCurrentUser();

  const loadData = async () => {
    if (!user) return;
    try {
      let fetched: Task[] = [];
      if (taskFilter === 'my') {
        const myTasks = await getTasksForUser(user.id);
        const createdNew = await ensureDailyTasks(myTasks, user.id);
        fetched = createdNew ? await getTasksForUser(user.id) : myTasks;
      } else if (taskFilter === 'today') {
        const allMyTasks = await getTasksForUser(user.id);
        await ensureDailyTasks(allMyTasks, user.id);
        const refreshedTasks = await getTasksForUser(user.id);
        const today = new Date().toISOString().split('T')[0];
        fetched = refreshedTasks.filter(t => !t.due_date || t.due_date <= today);
      } else if (taskFilter === 'all') {
        fetched = await getAllTasks();
      } else if (taskFilter === 'assigned') {
        fetched = await getTasksByCreator(user.id);
      }
      if (viewMode === 'calendar') {
        // For calendar, always fetch wider range for better view
        fetched = await (taskFilter === 'all' ? getAllTasks() : getTasksForUser(user.id));
      }
      setTasks(fetched);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (user && ['Manager', 'CEO', 'Admin'].includes(user.role)) {
      getErpUsers().then(setUsers);
    }
  }, [taskFilter, viewMode]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    await createTask({
      title: newTaskTitle.trim(),
      description: '',
      assignee_id: newTaskAssignee || user.id,
      created_by: user.id,
      priority: newTaskPriority,
      due_date: newTaskDueDate,
      task_type: newTaskType,
      target_number: newTaskType === 'Number' ? parseInt(newTaskTargetNumber, 10) || 10 : undefined,
    });

    setNewTaskTitle('');
    setNewTaskType('One-Time');
    setNewTaskDueDate('');
    setNewTaskPriority('Medium');
    setShowNewTask(false);
    loadData();
  };

  const isManagerOrAbove = user && ['Manager', 'CEO', 'Admin'].includes(user.role);

  const filteredTasks = searchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  const tabClass = (active: boolean) =>
    `text-sm font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${
      active ? 'border-erp-primary text-erp-text' : 'border-transparent text-erp-text/50 hover:text-erp-text/80'
    }`;

  const viewBtnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${
      active ? 'bg-erp-primary text-white shadow-sm' : 'text-erp-text/50 hover:text-erp-text hover:bg-erp-surface'
    }`;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background relative">
      <div className={`flex-1 flex flex-col p-4 md:p-8 min-w-0 h-full transition-all duration-300 overflow-y-auto ${selectedTask ? 'hidden lg:flex lg:pr-4' : 'w-full'}`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Tasks</h1>
            <div className="flex gap-5 mt-3 overflow-x-auto no-scrollbar">
              <button onClick={() => setTaskFilter('today')} className={tabClass(taskFilter === 'today')}>Today</button>
              <button onClick={() => setTaskFilter('my')} className={tabClass(taskFilter === 'my')}>All My Tasks</button>
              {isManagerOrAbove && (
                <>
                  <button onClick={() => setTaskFilter('assigned')} className={tabClass(taskFilter === 'assigned')}>Assigned by Me</button>
                  <button onClick={() => setTaskFilter('all')} className={tabClass(taskFilter === 'all')}>All Tasks</button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-erp-text/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-white border-2 border-erp-border rounded-xl pl-9 pr-3 py-2 text-sm w-40 focus:outline-none focus:border-erp-primary font-medium transition-all focus:w-52"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-erp-surface rounded-xl p-1 border-2 border-erp-border gap-0.5">
              <button onClick={() => setViewMode('list')} className={viewBtnClass(viewMode === 'list')} title="List view">
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('board')} className={viewBtnClass(viewMode === 'board')} title="Kanban view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('calendar')} className={viewBtnClass(viewMode === 'calendar')} title="Calendar view">
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            {/* Add Task */}
            <Button onClick={() => setShowNewTask(v => !v)} className="flex items-center gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Quick Add Form */}
        {showNewTask && (
          <form
            onSubmit={handleCreateTask}
            className="mb-6 bg-white border-2 border-erp-primary/40 p-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <Plus className="w-5 h-5 text-erp-primary flex-shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task name..."
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-erp-text text-sm font-semibold py-1"
                required
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="bg-erp-surface border-none outline-none text-xs font-bold px-2 py-1.5 rounded-lg text-erp-text/70 w-36"
              />
              {isManagerOrAbove && (
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="bg-erp-surface border-none outline-none text-xs font-bold px-2 py-1.5 rounded-lg text-erp-text/70 max-w-[140px] truncate"
                >
                  <option value={user?.id}>Assign to me</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              )}
              <select
                value={newTaskType}
                onChange={e => setNewTaskType(e.target.value as any)}
                className="bg-erp-surface border-none outline-none text-xs font-bold px-2 py-1.5 rounded-lg text-erp-text/70 w-28"
              >
                <option value="One-Time">📌 One-Time</option>
                <option value="Daily">🔁 Daily</option>
                <option value="Yes/No">✅ Yes/No</option>
                <option value="Number">📊 Number</option>
              </select>
              {newTaskType === 'Number' && (
                <input
                  type="number"
                  value={newTaskTargetNumber}
                  onChange={e => setNewTaskTargetNumber(e.target.value)}
                  placeholder="Target #"
                  className="bg-erp-surface border-none outline-none text-xs font-bold px-2 py-1.5 rounded-lg text-erp-text/90 w-20"
                  required
                />
              )}
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as any)}
                className="bg-erp-surface border-none outline-none text-xs font-bold px-2 py-1.5 rounded-lg text-erp-text/70 w-24"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🔵 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
              <Button type="submit" className="h-8 px-4 text-xs flex-shrink-0">Create</Button>
              <button type="button" onClick={() => setShowNewTask(false)} className="text-erp-text/40 hover:text-erp-text flex-shrink-0 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Task Count Summary */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-bold text-erp-text/50">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <span className="text-xs font-medium text-erp-primary bg-erp-primary/10 px-2 py-0.5 rounded-full">
              Filtered: "{searchQuery}"
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            {['To Do', 'In Progress', 'Review', 'Done'].map(s => {
              const count = filteredTasks.filter(t => t.status === s).length;
              const colors: Record<string, string> = { 'To Do': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-blue-100 text-blue-700', 'Review': 'bg-purple-100 text-purple-700', 'Done': 'bg-green-100 text-green-700' };
              return count > 0 ? (
                <span key={s} className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[s]}`}>
                  {s}: {count}
                </span>
              ) : null;
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {viewMode === 'list' && (
            <TaskListView tasks={filteredTasks} onTaskClick={setSelectedTask} onUpdate={loadData} />
          )}
          {viewMode === 'board' && (
            <TaskBoardView tasks={filteredTasks} onTaskClick={setSelectedTask} onUpdate={loadData} />
          )}
          {viewMode === 'calendar' && (
            <TaskCalendarView tasks={filteredTasks} onTaskClick={setSelectedTask} />
          )}
        </div>
      </div>

      {/* Slide-out Detail Panel */}
      {selectedTask && (
        <div className="absolute inset-0 z-20 bg-erp-background lg:relative lg:inset-auto lg:w-[420px] lg:flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.08)] border-l-2 border-erp-border h-full animate-in slide-in-from-right duration-250">
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={() => {
              loadData();
            }}
            currentUserRole={user?.role || ''}
          />
        </div>
      )}
    </div>
  );
}
