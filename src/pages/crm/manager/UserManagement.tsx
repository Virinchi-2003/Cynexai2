import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/erp/Button';
import { 
  Users, Key, Plus, X, Edit, Search, Trash2, Shield,
  Layers, Calendar, Clock, BookOpen, GraduationCap, UserCheck, UserPlus, UserMinus,
  CheckSquare, Square
} from 'lucide-react';
import { decryptPassword } from '../../../lib/crypto';
import { getCurrentUser, updateCurrentUserSession } from '../../../lib/auth';
import { getUsers, saveUser, deleteUser, patchUser, getFilterOptions } from '../../../lib/api/users';
import { getErpModules, assignModulesToInstructor } from '../../../lib/api/manager';
import { 
  getAllBatches, createBatch, updateBatch, deleteBatch, BatchItem,
  getStudentsInBatch, getAllStudentsForAssignment, assignStudentsToBatch,
  removeStudentFromBatch, StudentAssignmentItem 
} from '../../../lib/api/batches';
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
  const [activeTab, setActiveTab] = useState<'staff' | 'batches'>('staff');

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<ERPUser | null>(null);

  // Staff Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Sales/HR');
  const [salary, setSalary] = useState<number | ''>(0);
  const [status, setStatus] = useState('Active');

  // Batches State
  const [batchesList, setBatchesList] = useState<BatchItem[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('');
  const [batchCourseFilter, setBatchCourseFilter] = useState('');
  const [availableCourseOptions, setAvailableCourseOptions] = useState<string[]>([]);

  // Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [batchName, setBatchName] = useState('');
  const [batchCourse, setBatchCourse] = useState('');
  const [batchTeacherId, setBatchTeacherId] = useState('');
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchTiming, setBatchTiming] = useState('');
  const [batchMaxStudents, setBatchMaxStudents] = useState<number>(30);
  const [batchStatus, setBatchStatus] = useState<'Active' | 'Upcoming' | 'Completed' | 'Paused'>('Active');

  // Student Batch Assignment Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [activeBatchForStudents, setActiveBatchForStudents] = useState<BatchItem | null>(null);
  const [batchStudents, setBatchStudents] = useState<StudentAssignmentItem[]>([]);
  const [allStudentsList, setAllStudentsList] = useState<StudentAssignmentItem[]>([]);
  const [studentModalTab, setStudentModalTab] = useState<'enrolled' | 'add'>('enrolled');
  const [studentModalSearch, setStudentModalSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  
  type AccessLevel = 'none' | 'view' | 'full';
  const DEFAULT_PERMISSIONS: Record<string, AccessLevel> = {
    dashboard: 'full', users: 'none', students: 'full', courses: 'full',
    timetable: 'full', classes: 'full', finance: 'full', leaves: 'full', settings: 'full'
  };
  const MODULES_LIST = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'User Management' },
    { id: 'students', label: 'Student Management' },
    { id: 'courses', label: 'Courses & Curriculum' },
    { id: 'timetable', label: 'Timetable & Scheduling' },
    { id: 'classes', label: 'Live Classes & Attendance' },
    { id: 'finance', label: 'Finance & Fees' },
    { id: 'leaves', label: 'Leave Management' },
    { id: 'settings', label: 'System Settings' }
  ];
  
  const [permissions, setPermissions] = useState<Record<string, AccessLevel>>(DEFAULT_PERMISSIONS);

  const [allModules, setAllModules] = useState<any[]>([]);
  const [assignedModules, setAssignedModules] = useState<string[]>([]);

  useEffect(() => { 
    fetchUsersData(); 
    getErpModules().then(setAllModules).catch(console.error);
    getFilterOptions().then(opt => setAvailableCourseOptions(opt.courses)).catch(console.error);
  }, [filters, sortBy, sortDir]);

  // Load batches when switching to batches tab
  useEffect(() => {
    if (activeTab === 'batches') {
      fetchBatchesData();
    }
  }, [activeTab]);

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

  const fetchBatchesData = async () => {
    try {
      setBatchesLoading(true);
      const data = await getAllBatches();
      setBatchesList(data);
    } catch (e) {
      console.error('Failed to load batches', e);
    } finally {
      setBatchesLoading(false);
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
    setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleOpenModal = (user: ERPUser | null) => {
    if (user) {
      setEditUser(user);
      setName(user.name); setEmail(user.email); setPhone(user.phone || '');
      setPassword(decryptPassword(user.password_encrypted));
      setRole(user.role || 'Sales/HR'); setSalary(user.salary || 0);
      setStatus(user.status || 'Active');
      if (user.permissions_json) {
        try { 
          const parsed = JSON.parse(user.permissions_json);
          const upgraded = { ...DEFAULT_PERMISSIONS };
          for (const key of Object.keys(parsed)) {
            if (typeof parsed[key] === 'boolean') {
              upgraded[key] = parsed[key] ? 'full' : 'none';
            } else if (typeof parsed[key] === 'string') {
              upgraded[key] = parsed[key] as AccessLevel;
            }
          }
          setPermissions(upgraded);
        } catch { setPermissions(DEFAULT_PERMISSIONS); }
      } else {
        setPermissions(DEFAULT_PERMISSIONS);
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
      const permissionsStr = JSON.stringify(permissions);
      await saveUser({ id: newUserId, name, email, phone, password, role, status, salary: Number(salary) || 0, permissions_json: permissionsStr });
      
      if (currentUser && (currentUser.id === newUserId || currentUser.email.toLowerCase() === email.toLowerCase())) {
        updateCurrentUserSession({ permissions_json: permissionsStr });
      }

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

  // --- Batch CRUD Handlers ---
  const handleOpenBatchModal = (batch: BatchItem | null) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchName(batch.name);
      setBatchCourse(batch.course_name || batch.course_id || '');
      setBatchTeacherId(batch.primary_teacher_id || '');
      setBatchStartDate(batch.start_date || '');
      setBatchTiming(batch.timing || batch.schedule_pattern || '');
      setBatchMaxStudents(batch.max_students || 30);
      setBatchStatus(batch.status || 'Active');
    } else {
      setEditingBatch(null);
      setBatchName('');
      setBatchCourse('');
      setBatchTeacherId('');
      setBatchStartDate('');
      setBatchTiming('');
      setBatchMaxStudents(30);
      setBatchStatus('Active');
    }
    setIsBatchModalOpen(true);
  };

  const handleSaveBatch = async () => {
    if (!batchName.trim()) {
      alert('Batch Name is required.');
      return;
    }
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.id, {
          name: batchName,
          course_id: batchCourse,
          primary_teacher_id: batchTeacherId,
          start_date: batchStartDate,
          timing: batchTiming,
          schedule_pattern: batchTiming,
          max_students: batchMaxStudents,
          status: batchStatus
        });
      } else {
        await createBatch({
          name: batchName,
          course_id: batchCourse,
          primary_teacher_id: batchTeacherId,
          start_date: batchStartDate,
          timing: batchTiming,
          schedule_pattern: batchTiming,
          max_students: batchMaxStudents,
          status: batchStatus
        });
      }
      await fetchBatchesData();
      setIsBatchModalOpen(false);
    } catch (e) {
      console.error('Failed to save batch', e);
      alert('Failed to save batch.');
    }
  };

  const handleDeleteBatch = async (batch: BatchItem) => {
    if (!window.confirm(`Delete batch "${batch.name}"? This cannot be undone.`)) return;
    try {
      await deleteBatch(batch.id);
      setBatchesList(prev => prev.filter(b => b.id !== batch.id));
    } catch (e) {
      alert('Failed to delete batch.');
    }
  };

  // --- Student Batch Assignment Handlers ---
  const handleOpenStudentModal = async (batch: BatchItem) => {
    setActiveBatchForStudents(batch);
    setStudentModalTab('enrolled');
    setStudentModalSearch('');
    setSelectedStudentIds(new Set());
    setIsStudentModalOpen(true);
    await loadStudentModalData(batch.name);
  };

  const loadStudentModalData = async (batchName: string) => {
    try {
      setStudentModalLoading(true);
      const [enrolled, all] = await Promise.all([
        getStudentsInBatch(batchName),
        getAllStudentsForAssignment()
      ]);
      setBatchStudents(enrolled);
      setAllStudentsList(all);
    } catch (e) {
      console.error('Error loading student modal data', e);
    } finally {
      setStudentModalLoading(false);
    }
  };

  const handleAssignSelectedStudents = async () => {
    if (!activeBatchForStudents || selectedStudentIds.size === 0) return;
    try {
      setStudentModalLoading(true);
      await assignStudentsToBatch(
        activeBatchForStudents.name,
        activeBatchForStudents.id,
        Array.from(selectedStudentIds)
      );
      setSelectedStudentIds(new Set());
      await loadStudentModalData(activeBatchForStudents.name);
      await fetchBatchesData();
      setStudentModalTab('enrolled');
    } catch (e) {
      console.error('Error assigning students', e);
      alert('Failed to assign students to batch.');
    } finally {
      setStudentModalLoading(false);
    }
  };

  const handleRemoveStudentFromBatch = async (studentId: string) => {
    if (!activeBatchForStudents) return;
    if (!window.confirm('Remove this student from the batch?')) return;
    try {
      setStudentModalLoading(true);
      await removeStudentFromBatch(studentId, activeBatchForStudents.name, activeBatchForStudents.id);
      await loadStudentModalData(activeBatchForStudents.name);
      await fetchBatchesData();
    } catch (e) {
      console.error('Error removing student', e);
      alert('Failed to remove student.');
    } finally {
      setStudentModalLoading(false);
    }
  };

  const handleCellEdit = async (row: ERPUser, colKey: string, value: string) => {
    try {
      setUsers(prev => prev.map(u => u.id === row.id ? { ...u, [colKey]: value } : u));
      await patchUser(row.id, { [colKey]: value });
    } catch (e) {
      console.error('Failed to patch user', e);
      fetchUsersData();
    }
  };

  const staffColumns = [
    { key: 'name', header: 'Name', editable: true },
    { key: 'email', header: 'Email', editable: true },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'salary', header: 'Salary', editable: true },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ];

  const inputCls = "w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-sm text-erp-text focus:outline-none focus:border-indigo-500";

  // Filtered Batches List
  const filteredBatches = batchesList.filter(b => {
    const matchesSearch = !batchSearch.trim() ||
      b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
      (b.course_name && b.course_name.toLowerCase().includes(batchSearch.toLowerCase())) ||
      (b.primary_teacher_name && b.primary_teacher_name.toLowerCase().includes(batchSearch.toLowerCase()));
    const matchesStatus = !batchStatusFilter || b.status === batchStatusFilter;
    const matchesCourse = !batchCourseFilter || b.course_name === batchCourseFilter || b.course_id === batchCourseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const teacherOptions = users.filter(u => u.role === 'Teacher' || u.role === 'CEO' || u.role === 'Manager');

  // Filtered Students for Assignment Modal
  const availableStudentsForModal = allStudentsList.filter(s => {
    const isAlreadyInBatch = batchStudents.some(b => 
      b.id === s.id || 
      (b.email && s.email && b.email.toLowerCase().trim() === s.email.toLowerCase().trim())
    );
    if (isAlreadyInBatch) return false;

    const searchLower = studentModalSearch.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      (s.student_code && s.student_code.toLowerCase().includes(searchLower)) ||
      (s.course && s.course.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  // Summary Metrics
  const activeBatchesCount = batchesList.filter(b => b.status === 'Active').length;
  const totalEnrolledCount = batchesList.reduce((acc, b) => acc + (b.current_enrolled || 0), 0);
  const totalCapacityCount = batchesList.reduce((acc, b) => acc + (b.max_students || 30), 0);
  const upcomingBatchesCount = batchesList.filter(b => b.status === 'Upcoming').length;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-20 md:pb-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Shield className="w-8 h-8 text-erp-primary" /> Staff Management
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage employees, roles, batches, and access controls.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'batches' ? (
              <Button className="flex items-center gap-2 text-sm" onClick={() => handleOpenBatchModal(null)}>
                <Plus className="w-4 h-4" /> Add Batch
              </Button>
            ) : (
              <Button className="flex items-center gap-2 text-sm" onClick={() => handleOpenModal(null)}>
                <Plus className="w-4 h-4" /> Add Staff Member
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              activeTab === 'staff' ? 'bg-erp-primary text-white shadow-md' : 'bg-erp-surface text-erp-text hover:bg-erp-border'
            }`}
          >
            <Users className="w-4 h-4" /> Staff List
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              activeTab === 'batches' ? 'bg-erp-primary text-white shadow-md' : 'bg-erp-surface text-erp-text hover:bg-erp-border'
            }`}
          >
            <Layers className="w-4 h-4" /> Batches
          </button>
        </div>

        {/* --- STAFF LIST TAB --- */}
        {activeTab === 'staff' && (
          <>
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
              <DataTable columns={staffColumns} data={users} onSort={handleSort} onEdit={handleCellEdit} sortBy={sortBy} sortDir={sortDir} />
            </div>
          </>
        )}

        {/* --- BATCHES TAB --- */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-erp-surface border border-erp-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Active Batches</p>
                  <h3 className="text-2xl font-black text-erp-text mt-0.5">{activeBatchesCount} <span className="text-xs font-medium text-erp-text/40">/ {batchesList.length} total</span></h3>
                </div>
              </div>

              <div className="bg-erp-surface border border-erp-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Enrolled Students</p>
                  <h3 className="text-2xl font-black text-erp-text mt-0.5">{totalEnrolledCount}</h3>
                </div>
              </div>

              <div className="bg-erp-surface border border-erp-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Total Capacity</p>
                  <h3 className="text-2xl font-black text-erp-text mt-0.5">{totalCapacityCount} <span className="text-xs font-medium text-erp-text/40">seats</span></h3>
                </div>
              </div>

              <div className="bg-erp-surface border border-erp-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Upcoming Batches</p>
                  <h3 className="text-2xl font-black text-erp-text mt-0.5">{upcomingBatchesCount}</h3>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-erp-surface border border-erp-border p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-1 min-w-[240px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/50" />
                <input
                  type="text"
                  value={batchSearch}
                  onChange={e => setBatchSearch(e.target.value)}
                  placeholder="Search batch name, course, or teacher..."
                  className={`${inputCls} pl-10`}
                />
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={batchStatusFilter}
                  onChange={e => setBatchStatusFilter(e.target.value)}
                  className="bg-erp-background border border-erp-border rounded-xl px-3 py-2 text-sm text-erp-text font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>

                <select
                  value={batchCourseFilter}
                  onChange={e => setBatchCourseFilter(e.target.value)}
                  className="bg-erp-background border border-erp-border rounded-xl px-3 py-2 text-sm text-erp-text font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Courses</option>
                  {availableCourseOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {(batchSearch || batchStatusFilter || batchCourseFilter) && (
                  <button
                    onClick={() => { setBatchSearch(''); setBatchStatusFilter(''); setBatchCourseFilter(''); }}
                    className="text-xs font-bold text-indigo-500 hover:underline px-2 py-1"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Batches Table / Cards */}
            <div className="bg-erp-surface border border-erp-border rounded-2xl overflow-hidden shadow-sm relative">
              {batchesLoading && (
                <div className="absolute inset-0 bg-erp-surface/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <span className="font-bold text-erp-text/70 bg-erp-surface px-4 py-2 rounded-xl border border-erp-border shadow-md">
                    Loading batches...
                  </span>
                </div>
              )}

              {filteredBatches.length === 0 && !batchesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-erp-text/40">
                  <Layers className="w-12 h-12 mb-3 text-erp-text/20" />
                  <p className="font-bold text-base">No batches found</p>
                  <p className="text-xs mt-1">Click "Add Batch" to create your first batch.</p>
                  <Button onClick={() => handleOpenBatchModal(null)} className="mt-4 text-xs flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Batch
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-erp-border bg-erp-background/50 text-[11px] font-bold text-erp-text/60 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Batch Name</th>
                        <th className="py-3.5 px-4">Course</th>
                        <th className="py-3.5 px-4">Primary Teacher</th>
                        <th className="py-3.5 px-4">Timing & Schedule</th>
                        <th className="py-3.5 px-4">Start Date</th>
                        <th className="py-3.5 px-4">Enrolled / Capacity</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-erp-border text-sm text-erp-text">
                      {filteredBatches.map(batch => {
                        const enrolled = batch.current_enrolled || 0;
                        const maxCap = batch.max_students || 30;
                        const pct = Math.min(100, Math.round((enrolled / maxCap) * 100));

                        let statusBg = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
                        if (batch.status === 'Upcoming') statusBg = 'bg-blue-500/10 text-blue-500 border-blue-500/30';
                        else if (batch.status === 'Completed') statusBg = 'bg-gray-500/10 text-gray-400 border-gray-500/30';
                        else if (batch.status === 'Paused') statusBg = 'bg-amber-500/10 text-amber-500 border-amber-500/30';

                        return (
                          <tr key={batch.id} className="hover:bg-erp-background/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-erp-text">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                {batch.name}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-erp-text/80 font-medium">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                {batch.course_name || batch.course_id || '—'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-erp-text/80 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-erp-text/40 flex-shrink-0" />
                                {batch.primary_teacher_name || 'Unassigned'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-erp-text/70 font-medium text-xs">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-erp-text/40 flex-shrink-0" />
                                {batch.timing || batch.schedule_pattern || 'Flexible'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-erp-text/70 font-medium text-xs">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-erp-text/40 flex-shrink-0" />
                                {batch.start_date || '—'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="w-36">
                                <div className="flex justify-between items-center text-xs font-bold mb-1">
                                  <span>{enrolled} <span className="text-erp-text/40 font-normal">/ {maxCap}</span></span>
                                  <span className="text-[10px] text-erp-text/50">{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-erp-border rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBg}`}>
                                {batch.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenStudentModal(batch)}
                                  className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-colors"
                                  title="Add/Manage Students in Batch"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Students</span>
                                </button>
                                <button
                                  onClick={() => handleOpenBatchModal(batch)}
                                  className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                  title="Edit Batch"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBatch(batch)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                  title="Delete Batch"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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
              <div className="border-t border-erp-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-erp-text uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-erp-primary" /> Advanced Access Control
                  </label>
                  <span className="text-xs text-erp-text/50">Granular module permissions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MODULES_LIST.map(mod => (
                    <div key={mod.id} className="bg-erp-background border border-erp-border rounded-lg p-3 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-erp-text/80">{mod.label}</span>
                      <select 
                        value={permissions[mod.id] || 'none'} 
                        onChange={e => setPermissions(p => ({ ...p, [mod.id]: e.target.value as AccessLevel }))}
                        className="w-full bg-erp-surface border border-erp-border rounded px-2 py-1.5 text-xs text-erp-text focus:outline-none focus:border-indigo-500"
                      >
                        <option value="none">No Access</option>
                        <option value="view">View Only</option>
                        <option value="full">Full Access</option>
                      </select>
                    </div>
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

      {/* ─── Add/Edit Batch Modal ─── */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-erp-border bg-erp-background/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
              </h2>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-erp-text/50 hover:text-erp-text">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Batch Name / Code *</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="e.g. DS-2026-A, Batch 101"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Course</label>
                <input
                  list="course-options-list"
                  type="text"
                  value={batchCourse}
                  onChange={e => setBatchCourse(e.target.value)}
                  placeholder="Select or type Course Title (e.g. Data Science with AI)"
                  className={inputCls}
                />
                <datalist id="course-options-list">
                  {availableCourseOptions.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Primary Teacher / Instructor</label>
                <select
                  value={batchTeacherId}
                  onChange={e => setBatchTeacherId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Select Instructor --</option>
                  {teacherOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Timing & Schedule</label>
                  <input
                    type="text"
                    value={batchTiming}
                    onChange={e => setBatchTiming(e.target.value)}
                    placeholder="e.g. Mon-Fri 10:00 AM - 12:00 PM"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={e => setBatchStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Max Student Capacity</label>
                  <input
                    type="number"
                    value={batchMaxStudents}
                    onChange={e => setBatchMaxStudents(Number(e.target.value))}
                    min={1}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Status</label>
                  <select
                    value={batchStatus}
                    onChange={e => setBatchStatus(e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-erp-border flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsBatchModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveBatch}>
                {editingBatch ? 'Save Batch Changes' : 'Create Batch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Manage Students in Batch Modal ─── */}
      {isStudentModalOpen && activeBatchForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-erp-border bg-erp-background/50 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-emerald-500" />
                  Manage Students — <span className="text-indigo-400">{activeBatchForStudents.name}</span>
                </h2>
                <p className="text-xs text-erp-text/60 mt-1 flex items-center gap-2">
                  <span>Course: <strong className="text-erp-text">{activeBatchForStudents.course_name || activeBatchForStudents.course_id || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Enrolled: <strong className="text-emerald-500">{batchStudents.length} / {activeBatchForStudents.max_students || 30} seats</strong></span>
                </p>
              </div>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-erp-text/50 hover:text-erp-text">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-erp-border px-5 pt-3 gap-2 bg-erp-surface flex-shrink-0">
              <button
                onClick={() => setStudentModalTab('enrolled')}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 ${
                  studentModalTab === 'enrolled'
                    ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                    : 'border-transparent text-erp-text/60 hover:text-erp-text'
                }`}
              >
                Enrolled Students ({batchStudents.length})
              </button>
              <button
                onClick={() => setStudentModalTab('add')}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 ${
                  studentModalTab === 'add'
                    ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                    : 'border-transparent text-erp-text/60 hover:text-erp-text'
                }`}
              >
                + Add / Assign Students
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {studentModalLoading && (
                <div className="p-8 text-center text-erp-text/50 font-bold text-xs">
                  Syncing batch students...
                </div>
              )}

              {/* ENROLLED TAB */}
              {studentModalTab === 'enrolled' && !studentModalLoading && (
                <div>
                  {batchStudents.length === 0 ? (
                    <div className="py-12 text-center text-erp-text/40">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-bold text-sm">No students in this batch yet</p>
                      <button
                        onClick={() => setStudentModalTab('add')}
                        className="mt-3 text-xs font-bold text-indigo-500 hover:underline"
                      >
                        + Click here to assign students
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {batchStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-erp-background border border-erp-border rounded-xl hover:border-indigo-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-erp-text leading-tight">{student.name}</p>
                              <p className="text-xs text-erp-text/50">{student.email} {student.student_code ? `• ${student.student_code}` : ''}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStudentFromBatch(student.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Remove student from batch"
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADD / ASSIGN TAB */}
              {studentModalTab === 'add' && !studentModalLoading && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/50" />
                    <input
                      type="text"
                      value={studentModalSearch}
                      onChange={e => setStudentModalSearch(e.target.value)}
                      placeholder="Search students by name, email, or code..."
                      className={`${inputCls} pl-10`}
                    />
                  </div>

                  <div className="text-xs font-bold text-erp-text/50 flex justify-between items-center">
                    <span>Available Students ({availableStudentsForModal.length})</span>
                    <span>Selected: {selectedStudentIds.size}</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {availableStudentsForModal.length === 0 ? (
                      <div className="py-8 text-center text-erp-text/40 text-xs font-medium">
                        No available students found to assign.
                      </div>
                    ) : (
                      availableStudentsForModal.map(student => {
                        const isSelected = selectedStudentIds.has(student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentIds(prev => {
                                const next = new Set(prev);
                                if (next.has(student.id)) next.delete(student.id);
                                else next.add(student.id);
                                return next;
                              });
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-500/10 border-indigo-500 text-erp-text'
                                : 'bg-erp-background border-erp-border hover:border-erp-primary/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-erp-text/30 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-bold text-sm text-erp-text leading-tight">{student.name}</p>
                                <p className="text-xs text-erp-text/50">{student.email} {student.batch_number ? `(Current Batch: ${student.batch_number})` : '(Unassigned)'}</p>
                              </div>
                            </div>
                            {student.course && (
                              <span className="text-[10px] font-bold text-erp-primary bg-erp-primary/10 px-2 py-0.5 rounded-full">
                                {student.course}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-erp-border bg-erp-background/50 flex justify-between items-center flex-shrink-0">
              <Button variant="ghost" onClick={() => setIsStudentModalOpen(false)}>Done</Button>
              {studentModalTab === 'add' && (
                <Button
                  onClick={handleAssignSelectedStudents}
                  disabled={selectedStudentIds.size === 0}
                  className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Selected ({selectedStudentIds.size})</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
