import React, { useState, useEffect } from 'react';
import { Task, getTasksForUser, getAllTasks, getTasksByCreator, createTask, getTasksByProject } from '../../../lib/api/tasks';
import { Project, getProjects } from '../../../lib/api/projects';
import { getCurrentUser } from '../../../lib/auth';
import { Button } from '../../ui/erp/Button';
import { TaskListView } from './TaskListView';
import { TaskBoardView } from './TaskBoardView';
import { TaskCalendarView } from './TaskCalendarView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TaskAppSidebar } from './TaskAppSidebar';
import { ProjectModal } from './ProjectModal';
import { LayoutList, LayoutGrid, CalendarDays, Plus, Search, X, FolderOpen } from 'lucide-react';
import { getErpUsers } from '../../../lib/api/manager';

type ViewMode = 'list' | 'board' | 'calendar';

export default function AsanaTaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState('my-tasks'); // 'my-tasks', 'inbox', 'home', or 'project_ID'
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const user = getCurrentUser();

  const loadData = async () => {
    if (!user) return;
    try {
      // Load Projects
      const projs = await getProjects();
      setProjects(projs);

      // Load Tasks based on view
      let fetched: Task[] = [];
      if (currentView === 'my-tasks') {
        fetched = await getTasksForUser(user.id);
      } else if (currentView === 'delegated') {
        fetched = await getTasksByCreator(user.id);
        // Filter out tasks assigned to self if you want, or just show all created by you
        fetched = fetched.filter(t => t.assignee_id !== user.id);
      } else if (currentView === 'all-tasks') {
        fetched = await getAllTasks();
      } else if (currentView.startsWith('project_') && currentProjectId) {
        fetched = await getTasksByProject(currentProjectId);
      } else if (currentView === 'home' || currentView === 'inbox') {
        // Inbox could show recently assigned or commented
        // Home could show a mix of recent projects and tasks
        // For now, default to my tasks
        fetched = await getTasksForUser(user.id);
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
  }, [currentView, currentProjectId]);

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
      project_id: currentProjectId, // Auto-assign to current project if in project view
      task_type: 'One-Time',
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskPriority('Medium');
    setShowNewTask(false);
    loadData();
  };

  const isManagerOrAbove = user && ['Manager', 'CEO', 'Admin'].includes(user.role);

  const filteredTasks = searchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  const viewBtnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${
      active ? 'bg-erp-primary text-white shadow-sm' : 'text-erp-text/50 hover:text-erp-text hover:bg-erp-surface'
    }`;

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background relative">
      
      {/* Sidebar */}
      <TaskAppSidebar 
        currentView={currentView}
        onViewChange={(view, projectId) => {
          setCurrentView(view);
          setCurrentProjectId(projectId || null);
          setSelectedTask(null); // Close details on view change
        }}
        projects={projects}
        onNewProject={() => setShowNewProject(true)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-4 md:p-8 min-w-0 h-full transition-all duration-300 overflow-y-auto ${selectedTask ? 'hidden lg:flex lg:pr-4' : 'w-full'}`}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4 border-b border-erp-border/50 pb-4">
          <div className="flex items-center gap-3">
            {currentProject ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: currentProject.color || '#94a3b8' }} />
                  <h1 className="text-3xl font-display font-bold text-erp-text">{currentProject.name}</h1>
                </div>
                {currentProject.description && (
                  <p className="text-sm text-erp-text/60 mt-1">{currentProject.description}</p>
                )}
              </div>
            ) : (
              <h1 className="text-3xl font-display font-bold text-erp-text capitalize">
                {currentView.replace('-', ' ')}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-erp-text/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
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
            <Button onClick={() => setShowNewTask(v => !v)} className="flex items-center gap-2 flex-shrink-0 bg-emerald-600 hover:bg-emerald-500">
              <Plus className="w-4 h-4" />
              New Task
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
        <div className="flex-1 min-h-0 bg-erp-surface/30 rounded-2xl p-1 border border-erp-border/50">
          {filteredTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-erp-text/40 space-y-3">
              <FolderOpen className="w-12 h-12 stroke-1" />
              <p className="font-medium text-sm">No tasks found here</p>
            </div>
          ) : (
            <>
              {viewMode === 'list' && <TaskListView tasks={filteredTasks} users={users} onTaskClick={setSelectedTask} onUpdate={loadData} />}
              {viewMode === 'board' && <TaskBoardView tasks={filteredTasks} users={users} onTaskClick={setSelectedTask} onUpdate={loadData} />}
              {viewMode === 'calendar' && <TaskCalendarView tasks={filteredTasks} onTaskClick={setSelectedTask} />}
            </>
          )}
        </div>
      </div>

      {/* Slide-out Detail Panel */}
      {selectedTask && (
        <div className="absolute inset-0 z-20 bg-erp-background lg:relative lg:inset-auto lg:w-[450px] lg:flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.08)] border-l-2 border-erp-border h-full animate-in slide-in-from-right duration-250">
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={loadData}
            currentUserRole={user?.role || ''}
          />
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <ProjectModal
          onClose={() => setShowNewProject(false)}
          onSuccess={(newId) => {
            setShowNewProject(false);
            loadData();
            setCurrentView(`project_${newId}`);
            setCurrentProjectId(newId);
          }}
        />
      )}
    </div>
  );
}
