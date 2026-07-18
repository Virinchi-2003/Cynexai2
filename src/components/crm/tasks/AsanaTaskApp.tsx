import React, { useState, useEffect } from 'react';
import {
  Task, getTasksForUser, getAllTasks, getTasksByCreator,
  createTask, getTasksByProject, updateTaskStatus, deleteTask
} from '../../../lib/api/tasks';
import { Project, getProjects } from '../../../lib/api/projects';
import { getCurrentUser } from '../../../lib/auth';
import { Button } from '../../ui/erp/Button';
import { TaskListView } from './TaskListView';
import { TaskBoardView } from './TaskBoardView';
import { TaskCalendarView } from './TaskCalendarView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TaskAppSidebar } from './TaskAppSidebar';
import { ProjectModal } from './ProjectModal';
import { ProjectHierarchyPanel } from './ProjectHierarchyPanel';
import {
  LayoutList, LayoutGrid, CalendarDays, Plus, Search, X,
  FolderOpen, Users, Crown, Shield, Clock, Target, BarChart2,
  ChevronDown, AlertTriangle, CheckCircle2, Circle, Timer, Zap
} from 'lucide-react';
import { getErpUsers } from '../../../lib/api/manager';
import { getActiveTimeLog } from '../../../lib/api/reports';

type ViewMode = 'list' | 'board' | 'calendar';

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'text-red-600 bg-red-100 border-red-200',
  High: 'text-orange-600 bg-orange-100 border-orange-200',
  Medium: 'text-blue-600 bg-blue-100 border-blue-200',
  Low: 'text-slate-600 bg-slate-100 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'text-slate-500 bg-slate-50 border-slate-200',
  'In Progress': 'text-blue-600 bg-blue-50 border-blue-200',
  'Review': 'text-purple-600 bg-purple-50 border-purple-200',
  'Done': 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ tasks, isManagerOrAbove }: { tasks: Task[]; isManagerOrAbove: boolean }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done').length;
  const urgent = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
      {[
        { label: 'Total', value: total, icon: <Target className="w-3.5 h-3.5" />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
        { label: 'Done', value: `${done} (${pct}%)`, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { label: 'In Progress', value: inProgress, icon: <Circle className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { label: 'Overdue', value: overdue, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: overdue > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-400 bg-slate-50 border-slate-100' },
        { label: 'Urgent', value: urgent, icon: <Zap className="w-3.5 h-3.5" />, color: urgent > 0 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-slate-400 bg-slate-50 border-slate-100' },
      ].map(s => (
        <div key={s.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${s.color}`}>
          {s.icon}
          <span className="truncate">{s.label}: {s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── New Task Form ─────────────────────────────────────────────────────────────
interface NewTaskFormProps {
  users: any[];
  projects: Project[];
  currentProjectId: string | null;
  currentUserId: string;
  isManagerOrAbove: boolean;
  onCancel: () => void;
  onCreated: () => void;
}

function NewTaskForm({ users, projects, currentProjectId, currentUserId, isManagerOrAbove, onCancel, onCreated }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(currentUserId);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [taskType, setTaskType] = useState<'One-Time' | 'Daily' | 'Yes/No' | 'Number'>('One-Time');
  const [projectId, setProjectId] = useState(currentProjectId || '');
  const [targetNum, setTargetNum] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await createTask({
      title: title.trim(),
      description,
      assignee_id: assignee || currentUserId,
      created_by: currentUserId,
      priority,
      due_date: dueDate,
      project_id: projectId || null,
      task_type: taskType,
      target_number: taskType === 'Number' ? Number(targetNum) : undefined,
      current_number: 0,
      tags: tags || null,
    });
    setSubmitting(false);
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 bg-white border-2 border-erp-primary/30 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-erp-border/50">
        <input
          type="text"
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task name..."
          className="w-full bg-transparent border-none outline-none text-erp-text text-base font-bold placeholder-erp-text/30"
          required
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add description (optional)..."
          rows={2}
          className="w-full bg-transparent border-none outline-none text-erp-text text-sm mt-2 resize-none placeholder-erp-text/30"
        />
      </div>

      <div className="p-3 bg-erp-surface/60 flex flex-wrap gap-2 items-center">
        {/* Assignee */}
        {isManagerOrAbove && (
          <select
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none"
          >
            <option value={currentUserId}>Assign to me</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        )}

        {/* Due date */}
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none"
        />

        {/* Priority */}
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as any)}
          className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none"
        >
          <option value="Low">🟢 Low</option>
          <option value="Medium">🔵 Medium</option>
          <option value="High">🟠 High</option>
          <option value="Urgent">🔴 Urgent</option>
        </select>

        {/* Task type */}
        <select
          value={taskType}
          onChange={e => setTaskType(e.target.value as any)}
          className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none"
        >
          <option value="One-Time">📌 One-Time</option>
          <option value="Daily">🔄 Daily</option>
          <option value="Yes/No">✅ Yes/No</option>
          <option value="Number">🎯 Number</option>
        </select>

        {/* Target (for Number type) */}
        {taskType === 'Number' && (
          <input
            type="number"
            value={targetNum}
            onChange={e => setTargetNum(e.target.value)}
            placeholder="Target #"
            className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none w-24"
          />
        )}

        {/* Project */}
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none"
        >
          <option value="">No Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Tags */}
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma-sep)"
          className="bg-white border border-erp-border rounded-lg px-2 py-1.5 text-xs font-semibold text-erp-text outline-none w-36"
        />

        <div className="ml-auto flex gap-2">
          <Button type="submit" disabled={submitting} className="h-8 px-4 text-xs">
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
          <button type="button" onClick={onCancel} className="h-8 px-3 text-xs text-erp-text/50 hover:text-erp-text border border-erp-border rounded-xl">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function AsanaTaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState('my-tasks');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTimeLog, setActiveTimeLog] = useState<any>(null);
  const [showHierarchyForProject, setShowHierarchyForProject] = useState<Project | null>(null);

  const user = getCurrentUser();
  const isManagerOrAbove = !!user && ['Manager', 'CEO', 'Admin'].includes(user.role);
  const isCEO = user?.role === 'CEO';

  const loadData = async () => {
    if (!user) return;
    try {
      const projs = await getProjects();
      setProjects(projs);

      let fetched: Task[] = [];
      if (currentView === 'my-tasks') {
        fetched = await getTasksForUser(user.id);
      } else if (currentView === 'delegated') {
        fetched = await getTasksByCreator(user.id);
        fetched = fetched.filter(t => t.assignee_id !== user.id);
      } else if (currentView === 'all-tasks') {
        fetched = await getAllTasks();
      } else if (currentView.startsWith('project_') && currentProjectId) {
        fetched = await getTasksByProject(currentProjectId);
      } else {
        fetched = await getTasksForUser(user.id);
      }

      setTasks(fetched);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (user) {
      getErpUsers().then(setUsers);
    }
    // Check active time log
    if (user) {
      getActiveTimeLog(user.id).then(setActiveTimeLog);
    }
  }, [currentView, currentProjectId]);

  const viewBtnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${active ? 'bg-erp-primary text-white shadow-sm' : 'text-erp-text/50 hover:text-erp-text hover:bg-erp-surface'}`;

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  const filteredTasks = tasks
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => !filterPriority || t.priority === filterPriority)
    .filter(t => !filterStatus || t.status === filterStatus);

  const viewTitle = () => {
    if (currentProject) return currentProject.name;
    if (currentView === 'my-tasks') return 'My Tasks';
    if (currentView === 'delegated') return 'Delegated Tasks';
    if (currentView === 'all-tasks') return 'All Tasks';
    return currentView.replace('-', ' ');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background relative">

      {/* Sidebar */}
      <TaskAppSidebar
        currentView={currentView}
        onViewChange={(view, projectId) => {
          setCurrentView(view);
          setCurrentProjectId(projectId || null);
          setSelectedTask(null);
          setShowHierarchyForProject(null);
        }}
        projects={projects}
        onNewProject={() => setShowNewProject(true)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col p-4 md:p-6 min-w-0 h-full transition-all duration-300 overflow-y-auto ${selectedTask ? 'hidden lg:flex lg:pr-4' : 'w-full'}`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-3 border-b border-erp-border/50 pb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {currentProject && (
              <div className="w-4 h-4 rounded mt-1.5 flex-shrink-0" style={{ backgroundColor: currentProject.color || '#94a3b8' }} />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold text-erp-text truncate">{viewTitle()}</h1>
              {currentProject?.description && (
                <p className="text-sm text-erp-text/50 mt-0.5 truncate">{currentProject.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Active timer indicator */}
            {activeTimeLog && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                Timer running
              </div>
            )}

            {/* CEO: Show project hierarchy button when in a project */}
            {isCEO && currentProject && (
              <button
                onClick={() => setShowHierarchyForProject(showHierarchyForProject ? null : currentProject)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${showHierarchyForProject ? 'bg-erp-primary text-white border-erp-primary' : 'bg-erp-surface border-erp-border text-erp-text/70 hover:bg-erp-background'}`}
              >
                <Crown className="w-3.5 h-3.5" /> Hierarchy
              </button>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-erp-text/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-white border-2 border-erp-border rounded-xl pl-9 pr-3 py-2 text-sm w-36 focus:outline-none focus:border-erp-primary font-medium transition-all focus:w-48"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-erp-text/40 hover:text-erp-text">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-white border-2 border-erp-border rounded-xl px-2 py-2 text-xs font-semibold text-erp-text outline-none"
            >
              <option value="">All Priority</option>
              <option value="Urgent">🔴 Urgent</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🔵 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border-2 border-erp-border rounded-xl px-2 py-2 text-xs font-semibold text-erp-text outline-none"
            >
              <option value="">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-erp-surface rounded-xl p-1 border-2 border-erp-border gap-0.5">
              <button onClick={() => setViewMode('list')} className={viewBtnClass(viewMode === 'list')} title="List">
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('board')} className={viewBtnClass(viewMode === 'board')} title="Board">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('calendar')} className={viewBtnClass(viewMode === 'calendar')} title="Calendar">
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            {/* New Task */}
            <Button
              onClick={() => setShowNewTask(v => !v)}
              className="flex items-center gap-2 flex-shrink-0 bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Project Hierarchy Panel (CEO) */}
        {showHierarchyForProject && (
          <div className="mb-4 bg-white border-2 border-erp-border rounded-2xl p-4">
            <ProjectHierarchyPanel project={showHierarchyForProject} />
          </div>
        )}

        {/* Stats Bar */}
        <StatsBar tasks={filteredTasks} isManagerOrAbove={isManagerOrAbove} />

        {/* New Task Form */}
        {showNewTask && (
          <NewTaskForm
            users={users}
            projects={projects}
            currentProjectId={currentProjectId}
            currentUserId={user?.id || ''}
            isManagerOrAbove={isManagerOrAbove}
            onCancel={() => setShowNewTask(false)}
            onCreated={() => {
              setShowNewTask(false);
              loadData();
            }}
          />
        )}

        {/* Role-based context banner */}
        {currentView === 'all-tasks' && isManagerOrAbove && (
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            {isCEO ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {isCEO ? 'CEO View: All tasks across all teams' : 'Manager View: All tasks across your team'}
          </div>
        )}
        {currentView === 'delegated' && (
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
            <Users className="w-3.5 h-3.5" />
            Tasks you assigned to others — track their progress here
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 bg-erp-surface/30 rounded-2xl p-1 border border-erp-border/50">
          {filteredTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-erp-text/40 space-y-3 py-16">
              <FolderOpen className="w-12 h-12 stroke-1" />
              <p className="font-bold text-sm">No tasks found</p>
              <p className="text-xs text-erp-text/30">
                {searchQuery || filterPriority || filterStatus ? 'Try clearing your filters' : 'Click "New Task" to get started'}
              </p>
              {(searchQuery || filterPriority || filterStatus) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterPriority(''); setFilterStatus(''); }}
                  className="text-xs font-bold text-erp-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
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
        <div className="absolute inset-0 z-20 bg-erp-background lg:relative lg:inset-auto lg:w-[470px] lg:flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.08)] border-l-2 border-erp-border h-full animate-in slide-in-from-right duration-250">
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
