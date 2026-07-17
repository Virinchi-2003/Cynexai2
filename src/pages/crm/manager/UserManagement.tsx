import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Users, Key, DollarSign, Plus, X, Lock, Unlock, Eye, EyeOff, Edit, Search, Filter, Trash2 } from 'lucide-react';
import { decryptPassword } from '../../../lib/crypto';
import { getCurrentUser } from '../../../lib/auth';
import { getUsers, saveUser, patchUser, updateStudentAttended, getFilterOptions, getCourseCurriculum, deleteUser } from '../../../lib/api/users';
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
  joining_date?: string;
  batch_number?: string;
  course?: string;
}

const ClassesAttendedCell = ({ user, curriculum }: { user: ERPUser, curriculum: Record<string, string[]> }) => {
  let data: Record<string, number> = {};
  try {
    data = JSON.parse(user.classes_attended_json || '{}');
  } catch (e) {
    data = {};
  }
  
  const courseModules = (user.course && curriculum[user.course]) ? curriculum[user.course] : Object.keys(data);
  if (courseModules.length === 0) courseModules.push('General');

  return (
    <div className="flex gap-1 w-32 h-2 items-center">
      {courseModules.map(mod => {
        const count = data[mod] || 0;
        const progress = Math.min(100, (count / 20) * 100);
        return (
          <div key={mod} title={`${mod}: ${count} Classes`} className="flex-1 h-full bg-erp-border/30 rounded-sm overflow-hidden cursor-help">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        );
      })}
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

  // Filter Options State
  const [courses, setCourses] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [curriculum, setCurriculum] = useState<Record<string, string[]>>({});

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

  useEffect(() => {
    getFilterOptions().then(res => {
      setCourses(res.courses);
      setBatches(res.batches);
    });
    getCourseCurriculum().then(res => {
      setCurriculum(res);
    });
  }, []);

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

  const handleDelete = async (row: ERPUser) => {
    if (window.confirm(`Are you sure you want to completely delete ${row.name}? This action cannot be undone.`)) {
      try {
        await deleteUser(row.id, row.email);
        setUsers(prev => prev.filter(u => u.id !== row.id));
      } catch (e) {
        console.error("Failed to delete user", e);
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  const staffColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'salary', header: 'Salary' },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const studentColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Portal Login' },
    { key: 'preferred_mode', header: 'Mode' },
    { key: 'classes_attended', header: 'Classes', render: (row: any) => <ClassesAttendedCell user={row} curriculum={curriculum} /> },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const columns = activeTab === 'staff' ? staffColumns : studentColumns;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-20 md:pb-8">
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
            onClick={() => {
              setActiveTab('staff');
              setFilters({}); // Clear filters when switching tabs
            }}
          >
            Staff Members
          </button>
          <button
            className={`pb-2 px-1 font-bold ${activeTab === 'students' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => {
              setActiveTab('students');
              setFilters({}); // Clear filters when switching tabs
            }}
          >
            Students
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-erp-surface border border-erp-border p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/50" />
              <input 
                type="text" 
                value={filters.search || ''}
                placeholder="Search by Name, Email, or ID..." 
                className="w-full bg-erp-background border border-erp-border rounded-lg pl-10 pr-4 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
                onChange={(e) => handleFilter('search', e.target.value)}
              />
            </div>
          </div>
          {activeTab === 'students' && (
            <>
              <div className="w-48">
                <label className="block text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-2">Course</label>
                <select 
                  className="w-full bg-erp-background border border-erp-border rounded-lg px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
                  onChange={(e) => handleFilter('course', e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-2">Batch</label>
                <select 
                  className="w-full bg-erp-background border border-erp-border rounded-lg px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
                  onChange={(e) => handleFilter('batch', e.target.value)}
                >
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="w-40">
            <label className="block text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-2">Joined After</label>
            <input 
              type="date" 
              className="w-full bg-erp-background border border-erp-border rounded-lg px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
              onChange={(e) => handleFilter('startDate', e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-2">Joined Before</label>
            <input 
              type="date" 
              className="w-full bg-erp-background border border-erp-border rounded-lg px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
              onChange={(e) => handleFilter('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-erp-surface/50 flex items-center justify-center z-10 rounded-xl">
              <span className="font-bold text-erp-text/70 bg-erp-surface px-4 py-2 rounded shadow">Loading users...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={users}
            onSort={handleSort}
            onEdit={handleEdit}
            sortBy={sortBy}
            sortDir={sortDir}
            renderExpandedRow={activeTab === 'students' ? (row) => {
              let moduleProgress: Record<string, number> = {};
              try {
                moduleProgress = JSON.parse(row.classes_attended_json || '{}');
              } catch (e) {
                moduleProgress = {};
              }
              const modules = Object.keys(moduleProgress).length > 0 ? moduleProgress : { 'General': 0 };

              return (
                <div className="p-6 bg-erp-background/50 flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-erp-text/70 uppercase tracking-wider mb-4">Student Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-erp-text/50 mb-1">Batch Number</p>
                        <p className="font-medium text-erp-text">{row.batch_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-erp-text/50 mb-1">Course</p>
                        <p className="font-medium text-erp-text">{row.course || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-erp-text/50 mb-1">Joining Date</p>
                        <p className="font-medium text-erp-text">{row.joining_date || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-3 mt-4">
                        <p className="text-xs text-erp-text/50 mb-3 uppercase tracking-wider font-bold">Module Progress</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                          {(() => {
                            let moduleProgress: Record<string, number> = {};
                            try { moduleProgress = JSON.parse(row.classes_attended_json || '{}'); } catch (e) {}
                            
                            const courseModules = (row.course && curriculum[row.course]) ? curriculum[row.course] : Object.keys(moduleProgress);
                            if (courseModules.length === 0) courseModules.push('General');

                            return courseModules.map((mod: string) => {
                              const count = moduleProgress[mod] || 0;
                              return (
                                <div key={mod} className="flex flex-col gap-2 bg-erp-background p-3 rounded-lg border border-erp-border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold truncate pr-2" title={mod}>{mod}</span>
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{count} Cls</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={async () => {
                                        const newData = { ...moduleProgress, [mod]: Math.max(0, count - 1) };
                                        const jsonStr = JSON.stringify(newData);
                                        setUsers(prev => prev.map(u => u.id === row.id ? { ...u, classes_attended_json: jsonStr } : u));
                                        try { await updateStudentAttended(row.email, jsonStr); } catch (e) { fetchUsersData(); }
                                      }} 
                                      className="w-5 h-5 rounded bg-erp-surface text-red-500 hover:bg-red-50 border border-erp-border flex items-center justify-center font-bold transition-colors text-[10px]"
                                    >-</button>
                                    <div className="flex-1 h-1.5 bg-erp-surface rounded-full overflow-hidden">
                                      {count > 0 ? (
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (count / 20) * 100)}%` }} />
                                      ) : (
                                        <div className="h-full bg-erp-border/30 rounded-full w-full" />
                                      )}
                                    </div>
                                    <button 
                                      onClick={async () => {
                                        const newData = { ...moduleProgress, [mod]: Math.max(0, count + 1) };
                                        const jsonStr = JSON.stringify(newData);
                                        setUsers(prev => prev.map(u => u.id === row.id ? { ...u, classes_attended_json: jsonStr } : u));
                                        try { await updateStudentAttended(row.email, jsonStr); } catch (e) { fetchUsersData(); }
                                      }} 
                                      className="w-5 h-5 rounded bg-erp-surface text-green-500 hover:bg-green-50 border border-erp-border flex items-center justify-center font-bold transition-colors text-[10px]"
                                    >+</button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } : undefined}
          />
        </div>

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
