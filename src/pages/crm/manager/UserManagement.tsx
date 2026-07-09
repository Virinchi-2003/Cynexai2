import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Users, Key, DollarSign, Plus, X, Lock, Unlock, Eye, EyeOff, Edit } from 'lucide-react';
import { decryptPassword } from '../../../lib/crypto';
import { getCurrentUser } from '../../../lib/auth';
import { getUsers, saveUser, patchUser, updateStudentAttended } from '../../../lib/api/users';
import { DataTable } from '../../../components/ui/erp/DataTable';

interface ERPUser {
  id: string;
  name: string;
  email: string;
  password_encrypted: string;
  role: string;
  salary: number;
  status?: string;
  permissions_json?: string;
  classes_attended_json?: string;
  preferred_mode?: string;
}

const ClassesAttendedCell = ({ user, onUpdate }: { user: ERPUser, onUpdate: (user: ERPUser, json: string) => void }) => {
  let data: Record<string, number> = {};
  try {
    data = JSON.parse(user.classes_attended_json || '{}');
  } catch (e) {
    data = {};
  }
  
  if (Object.keys(data).length === 0) {
    data = { "General": 0 };
  }

  const handleAdjust = (mod: string, delta: number) => {
    const newData = { ...data, [mod]: Math.max(0, (data[mod] || 0) + delta) };
    onUpdate(user, JSON.stringify(newData));
  };

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(data).map(([mod, count]) => (
        <div key={mod} className="flex items-center gap-3 bg-erp-background p-1.5 rounded-lg border border-erp-border">
          <span className="text-xs font-bold w-16 truncate" title={mod}>{mod}</span>
          <div className="flex items-center gap-1 bg-erp-surface rounded-md">
            <button onClick={() => handleAdjust(mod, -1)} className="px-2 py-0.5 text-red-500 hover:bg-red-50 rounded-l-md font-bold">-</button>
            <span className="text-xs font-bold w-4 text-center">{count}</span>
            <button onClick={() => handleAdjust(mod, 1)} className="px-2 py-0.5 text-green-500 hover:bg-green-50 rounded-r-md font-bold">+</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function UserManagement() {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<ERPUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');

  // DataTable state
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<ERPUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Sales/HR');
  const [salary, setSalary] = useState<number | ''>(0);
  const [status, setStatus] = useState('Active');
  const [batchId, setBatchId] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    crm: false,
    timetable: false,
    leaves: false,
    settings: false
  });

  useEffect(() => {
    fetchUsersData();
  }, [filters, sortBy, sortDir]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const queryFilters = { ...filters };
      if (activeTab === 'students') {
        queryFilters.role = 'Student';
      } else {
        queryFilters.role = { _neq: 'Student' } as any; // Hack to simulate not equal, if API supports it, else we rely on JS filter later if this is just mocked
      }
      
      const fetchedUsers = await getUsers(queryFilters, sortBy, sortDir);
      setUsers(fetchedUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  // Need to run fetchUsersData when activeTab changes since we didn't add it to dependency array
  useEffect(() => {
    fetchUsersData();
  }, [activeTab]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  };

  const handleEdit = async (row: any, key: string, value: string) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === row.id ? { ...u, [key]: value } : u))
    );
    try {
      await patchUser(row.id, { [key]: value });
    } catch (e) {
      // Revert if failed
      await fetchUsersData();
    }
  };

  const handleOpenModal = (user: ERPUser | null) => {
    if (user) {
      setEditUser(user);
      setName(user.name);
      setEmail(user.email);
      setPassword(decryptPassword(user.password_encrypted));
      setRole(user.role || 'Sales/HR');
      setSalary(user.salary || 0);
      setStatus(user.status || 'Active');
      if (user.permissions_json) {
        try {
          setPermissions(JSON.parse(user.permissions_json));
        } catch {
          setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
        }
      } else {
        setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
      }
    } else {
      setEditUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole('Sales/HR');
      setSalary(0);
      setStatus('Active');
      setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const userPayload = {
        id: editUser ? editUser.id : '',
        name,
        email,
        password,
        role,
        status,
        salary: Number(salary) || 0,
        permissions_json: JSON.stringify(permissions)
      };
      
      await saveUser(userPayload);
      await fetchUsersData();
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to save user", e);
      alert("Failed to save user. Check if email is unique.");
    }
  };

  const staffColumns = [
    { key: 'name', header: 'Name', editable: true },
    { key: 'email', header: 'Email', editable: true },
    { key: 'role', header: 'Role', editable: true },
    { key: 'status', header: 'Status', editable: true },
    { key: 'salary', header: 'Salary', editable: currentUser?.role === 'CEO' },
    { key: 'actions', header: 'Actions', render: (row: any) => (
      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
        <Edit className="w-4 h-4" />
      </button>
    )}
  ];

  const studentColumns = [
    { key: 'name', header: 'Name', editable: true },
    { key: 'email', header: 'Portal Login', editable: true },
    { key: 'preferred_mode', header: 'Mode', editable: true },
    { key: 'classes_attended', header: 'Classes', render: (row: any) => <ClassesAttendedCell user={row} onUpdate={async (u, json) => {
      // Optimistic update
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, classes_attended_json: json } : usr));
      try {
        await updateStudentAttended(u.email, json);
      } catch (e) {
        fetchUsersData();
      }
    }} /> },
    { key: 'status', header: 'Status', editable: true },
    { key: 'actions', header: 'Actions', render: (row: any) => (
      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
        <Edit className="w-4 h-4" />
      </button>
    )}
  ];

  const columns = activeTab === 'staff' ? staffColumns : studentColumns;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Users className="w-8 h-8 text-erp-primary" /> User Management
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage system logins, roles, and salaries securely.</p>
          </div>
          <Button onClick={() => handleOpenModal(null)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add User
          </Button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-erp-border">
          <button
            className={`pb-2 px-1 font-bold ${activeTab === 'staff' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff Members
          </button>
          <button
            className={`pb-2 px-1 font-bold ${activeTab === 'students' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-erp-text/50 font-bold">Loading users...</div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onSort={handleSort}
            onFilter={handleFilter}
            onEdit={handleEdit}
            sortBy={sortBy}
            sortDir={sortDir}
          />
        )}

        {/* Edit User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
                <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" /> {editUser ? 'Edit User' : 'Create User'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-erp-text/50 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-erp-text/70 mb-2">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-erp-text/70 mb-2">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-erp-text/70 mb-2">Password</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
                {role !== 'Student' ? (
                  <div>
                    <label className="block text-sm font-bold text-erp-text/70 mb-2">Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500">
                      {['Sales/HR', 'Manager', 'Teacher', 'CEO', 'DM'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-erp-text/70 mb-2">Assigned Batch</label>
                    <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500">
                      <option value="">No Batch Assigned</option>
                      <option value="batch_july_ds">Data Science - July Batch</option>
                      <option value="batch_aug_fsd">Full Stack - August Batch</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-erp-text/70 mb-2">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500">
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    {role === 'Student' && <option value="Alumni">Alumni</option>}
                  </select>
                </div>
                {currentUser?.role === 'CEO' && role !== 'Student' && (
                  <div>
                    <label className="block text-sm font-bold text-erp-text/70 mb-2">Salary (₹)</label>
                    <input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500" />
                  </div>
                )}
                {role !== 'Student' && (
                  <div className="pt-2 border-t border-erp-border">
                    <label className="block text-sm font-bold text-erp-text mb-3">Access Control Matrix</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['crm', 'timetable', 'leaves', 'settings'].map(perm => (
                        <label key={perm} className="flex items-center gap-2 text-sm text-erp-text/80 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={permissions[perm] || false}
                            onChange={e => setPermissions(p => ({ ...p, [perm]: e.target.checked }))}
                            className="w-4 h-4 rounded border-erp-border bg-erp-background text-indigo-500 focus:ring-indigo-500 focus:ring-offset-erp-surface"
                          />
                          {perm.charAt(0).toUpperCase() + perm.slice(1)} Access
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-erp-border bg-slate-900/30 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveUser}>Save User</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
