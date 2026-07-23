import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Users, Key, Plus, X, Edit, Search, Trash2, Shield } from 'lucide-react';
import { decryptPassword } from '../../../lib/crypto';
import { getCurrentUser } from '../../../lib/auth';
import { getUsers, saveUser, deleteUser, patchUser } from '../../../lib/api/users';
import { getErpModules, assignModulesToInstructor } from '../../../lib/api/manager';
import { DataTable } from '../../../components/ui/erp/DataTable';

interface ERPUser {
  id: string; name: string; email: string;
  password_encrypted: string; role: string; salary: number;
  status?: string; permissions_json?: string;
  phone?: string;
}

export default function UserManagement() {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<ERPUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<ERPUser | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Sales/HR');
  const [salary, setSalary] = useState<number | ''>(0);
  const [status, setStatus] = useState('Active');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({ crm: false, timetable: false, leaves: false, settings: false });

  const [allModules, setAllModules] = useState<any[]>([]);
  const [assignedModules, setAssignedModules] = useState<string[]>([]);

  useEffect(() => { 
    fetchUsersData(); 
    getErpModules().then(setAllModules).catch(console.error);
  }, [filters, sortBy, sortDir]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const queryFilters = { ...filters, role: { _neq: 'Student' } };
      const data = await getUsers(queryFilters, sortBy, sortDir);
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => { const n = { ...prev }; if (value) n[key] = value; else delete n[key]; return n; });
  };

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setPassword(''); setRole('Sales/HR'); setSalary(0); setStatus('Active');
    setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
  };

  const handleOpenModal = (user: ERPUser | null) => {
    if (user) {
      setEditUser(user);
      setName(user.name); setEmail(user.email); setPhone(user.phone || '');
      setPassword(decryptPassword(user.password_encrypted));
      setRole(user.role || 'Sales/HR'); setSalary(user.salary || 0);
      setStatus(user.status || 'Active');
      if (user.permissions_json) {
        try { setPermissions(JSON.parse(user.permissions_json)); }
        catch { setPermissions({ crm: false, timetable: false, leaves: false, settings: false }); }
      } else {
        setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
      }
      setAssignedModules(allModules.filter(m => m.instructor_id === user.id).map(m => m.id));
    } else {
      setEditUser(null);
      resetForm();
      setAssignedModules([]);
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!name.trim() || !email.trim()) { alert('Name and email are required.'); return; }
    try {
      const newUserId = editUser?.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await saveUser({ id: newUserId, name, email, phone, password, role, status, salary: Number(salary) || 0, permissions_json: JSON.stringify(permissions) });
      
      if (role === 'Teacher') {
        await assignModulesToInstructor(newUserId, assignedModules);
        const updatedMods = await getErpModules();
        setAllModules(updatedMods);
      }

      await fetchUsersData();
      setIsStaffModalOpen(false);
    } catch (e) {
      console.error('Failed to save user', e);
      alert('Failed to save user. Check if email is already in use.');
    }
  };

  const handleDelete = async (row: ERPUser) => {
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await deleteUser(row.id, row.email);
      setUsers(prev => prev.filter(u => u.id !== row.id));
    } catch (e) { alert('Failed to delete user.'); }
  };

  const staffColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'salary', header: 'Salary' },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ];

  const inputCls = "w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-sm text-erp-text focus:outline-none focus:border-indigo-500";

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-20 md:pb-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Shield className="w-8 h-8 text-erp-primary" /> Staff Management
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage employees, roles, and access controls.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button className="flex items-center gap-2 text-sm" onClick={() => handleOpenModal(null)}>
              <Plus className="w-4 h-4" /> Add Staff Member
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-erp-surface border border-erp-border p-4 rounded-xl mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/50" />
            <input type="text" value={filters.search || ''} placeholder="Search by Name, Email, or ID..."
              className={`${inputCls} pl-10`} onChange={e => handleFilter('search', e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-erp-surface/50 flex items-center justify-center z-10 rounded-xl">
              <span className="font-bold text-erp-text/70 bg-erp-surface px-4 py-2 rounded shadow">Loading staff...</span>
            </div>
          )}
          <DataTable columns={staffColumns} data={users} onSort={handleSort} sortBy={sortBy} sortDir={sortDir} />
        </div>
      </div>

      {/* ─── Add/Edit Staff Modal ─── */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-erp-border bg-erp-background/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                {editUser ? 'Edit Staff Member' : 'Create Staff Member'}
              </h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-erp-text/50 hover:text-erp-text"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@cynexai.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Password</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} font-mono`} placeholder="Leave blank for default: cynex123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
                    {['Sales/HR', 'Manager', 'Teacher', 'CEO', 'DM'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {currentUser?.role === 'CEO' && (
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Salary (₹)</label>
                    <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} className={inputCls} />
                  </div>
                )}
                
                {role === 'Teacher' && (
                  <div className="md:col-span-2 mt-2 border border-erp-border rounded-xl p-4 bg-erp-background/50">
                    <label className="block text-xs font-bold text-erp-text/60 mb-2 uppercase tracking-wider">Assign Modules</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {allModules.map(m => (
                        <label key={m.id} className="flex items-start gap-2 text-sm text-erp-text/80 cursor-pointer p-1.5 hover:bg-erp-surface rounded">
                          <input type="checkbox" checked={assignedModules.includes(m.id)}
                            onChange={e => {
                              if (e.target.checked) setAssignedModules(p => [...p, m.id]);
                              else setAssignedModules(p => p.filter(id => id !== m.id));
                            }}
                            className="mt-1 w-4 h-4 rounded accent-indigo-500" />
                          <span className="leading-tight">{m.title}</span>
                        </label>
                      ))}
                      {allModules.length === 0 && <div className="text-xs text-erp-text/50">No modules available</div>}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-erp-border pt-4">
                <label className="block text-xs font-bold text-erp-text/60 mb-2 uppercase tracking-wider">Access Control</label>
                <div className="grid grid-cols-2 gap-2">
                  {['crm', 'timetable', 'leaves', 'settings'].map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-erp-text/80 cursor-pointer">
                      <input type="checkbox" checked={permissions[perm] || false}
                        onChange={e => setPermissions(p => ({ ...p, [perm]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-indigo-500" />
                      {perm.charAt(0).toUpperCase() + perm.slice(1)} Access
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-erp-border flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveUser}>
                {editUser ? 'Save Changes' : 'Create Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
