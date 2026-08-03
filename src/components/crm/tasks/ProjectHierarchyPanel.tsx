import React, { useState, useEffect } from 'react';
import { Project } from '../../../lib/api/projects';
import { getProjectMembers, addProjectMember, removeProjectMember, updateProjectMemberRole, ProjectMember } from '../../../lib/api/reports';
import { getErpUsers } from '../../../lib/api/manager';
import { getCurrentUser } from '../../../lib/auth';
import { Users, Star, Shield, User, Plus, Trash2, Crown, ChevronDown } from 'lucide-react';

interface Props {
  project: Project;
}

const ROLE_LABELS: Record<string, string> = {
  general_manager: 'General Manager',
  manager: 'Manager',
  member: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  general_manager: 'bg-orange-100 text-orange-700 border-orange-200',
  manager: 'bg-sky-100 text-sky-700 border-sky-200',
  member: 'bg-slate-100 dark:bg-zinc-900/50 text-slate-600 border-slate-200 dark:border-white/10',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  general_manager: <Star className="w-3.5 h-3.5" />,
  manager: <Shield className="w-3.5 h-3.5" />,
  member: <User className="w-3.5 h-3.5" />,
};

export const ProjectHierarchyPanel: React.FC<Props> = ({ project }) => {
  const currentUser = getCurrentUser();
  const isCEO = currentUser?.role === 'CEO';
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<ProjectMember['role']>('member');

  const load = async () => {
    const [m, u] = await Promise.all([
      getProjectMembers(project.id),
      getErpUsers(),
    ]);
    setMembers(m);
    setAllUsers(u.filter((u: any) => u.role !== 'Student'));
  };

  useEffect(() => { load(); }, [project.id]);

  const handleAdd = async () => {
    if (!newUserId || !currentUser) return;
    await addProjectMember(project.id, newUserId, newRole, currentUser.id);
    setAdding(false);
    setNewUserId('');
    setNewRole('member');
    load();
  };

  const handleRemove = async (userId: string) => {
    await removeProjectMember(project.id, userId);
    load();
  };

  const handleRoleChange = async (userId: string, newR: ProjectMember['role']) => {
    await updateProjectMemberRole(project.id, userId, newR);
    load();
  };

  // Group by role
  const gms = members.filter(m => m.role === 'general_manager');
  const mgrs = members.filter(m => m.role === 'manager');
  const mems = members.filter(m => m.role === 'member');

  const MemberRow = ({ m }: { m: ProjectMember }) => (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-erp-background group">
      <div className="w-7 h-7 rounded-full bg-erp-primary/20 border border-erp-primary/30 flex items-center justify-center text-xs font-bold text-erp-primary flex-shrink-0">
        {(m.user_name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-erp-text truncate">{m.user_name || m.user_id}</p>
        <span className="text-xs text-erp-text/40">{m.user_role}</span>
      </div>
      {isCEO ? (
        <select
          value={m.role}
          onChange={e => handleRoleChange(m.user_id, e.target.value as ProjectMember['role'])}
          className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${ROLE_COLORS[m.role]}`}
        >
          <option value="general_manager">General Manager</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
      ) : (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${ROLE_COLORS[m.role]}`}>
          {ROLE_ICONS[m.role]} {ROLE_LABELS[m.role]}
        </span>
      )}
      {isCEO && (
        <button
          onClick={() => handleRemove(m.user_id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  const Section = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: ProjectMember[] }) => {
    if (items.length === 0 && !isCEO) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-bold text-erp-text/40 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 px-2">
          {icon} {title}
        </p>
        {items.length === 0 ? (
          <p className="text-xs text-erp-text/30 px-2 py-1">None assigned</p>
        ) : (
          items.map(m => <MemberRow key={m.id} m={m} />)
        )}
      </div>
    );
  };

  const assignedIds = members.map(m => m.user_id);
  const availableUsers = allUsers.filter(u => !assignedIds.includes(u.id));

  return (
    <div className="pt-4 border-t border-erp-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-erp-text/70 font-bold">
          <Crown className="w-4 h-4" /> Project Hierarchy
        </div>
        {isCEO && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 text-xs font-bold text-erp-primary hover:text-erp-primary/80"
          >
            <Plus className="w-3.5 h-3.5" /> Assign
          </button>
        )}
      </div>

      {/* Add member form */}
      {adding && isCEO && (
        <div className="bg-erp-background rounded-xl p-3 mb-3 border border-erp-border space-y-2">
          <select
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            className="w-full bg-erp-surface border border-erp-border rounded-lg px-2 py-1.5 text-sm text-erp-text outline-none"
          >
            <option value="">Select employee...</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as ProjectMember['role'])}
              className="flex-1 bg-erp-surface border border-erp-border rounded-lg px-2 py-1.5 text-sm text-erp-text outline-none"
            >
              <option value="general_manager">General Manager</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newUserId}
              className="px-3 py-1.5 bg-erp-primary text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-erp-primary/90"
            >
              Add
            </button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 border border-erp-border rounded-lg text-xs font-bold text-erp-text/60">
              Cancel
            </button>
          </div>
        </div>
      )}

      <Section title="General Manager" icon={<Star className="w-3 h-3 text-orange-500" />} items={gms} />
      <Section title="Managers" icon={<Shield className="w-3 h-3 text-sky-500" />} items={mgrs} />
      <Section title="Team Members" icon={<Users className="w-3 h-3 text-slate-500" />} items={mems} />
    </div>
  );
};
