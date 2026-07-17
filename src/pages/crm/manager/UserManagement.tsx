import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import {
  Users, Key, DollarSign, Plus, X, Edit, Search, Trash2,
  Upload, Camera, FileText, Eye, Download, CheckCircle,
  UserPlus, FileSpreadsheet, AlertCircle, Loader2
} from 'lucide-react';
import { decryptPassword } from '../../../lib/crypto';
import { getCurrentUser } from '../../../lib/auth';
import {
  getUsers, saveUser, patchUser, updateStudentAttended,
  getFilterOptions, getCourseCurriculum, deleteUser,
  uploadStudentDocument, getStudentDocuments, deleteStudentDocument,
  updateStudentProfile, bulkImportStudents,
  getPendingStudents, approveStudent, rejectStudent
} from '../../../lib/api/users';
import { DataTable } from '../../../components/ui/erp/DataTable';

interface ERPUser {
  id: string; name: string; email: string;
  password_encrypted: string; role: string; salary: number;
  status?: string; permissions_json?: string;
  classes_attended_json?: string; preferred_mode?: string;
  joining_date?: string; batch_number?: string; course?: string;
  phone?: string; dob?: string; address?: string;
  father_name?: string; mother_name?: string;
  emergency_contact?: string; blood_group?: string;
}

const DOC_TYPES = ['Aadhaar', 'Marksheet', 'Certificate', 'Photo', 'Offer Letter', 'Other'];

const ClassesAttendedCell = ({ user, curriculum }: { user: ERPUser, curriculum: Record<string, string[]> }) => {
  let data: Record<string, number> = {};
  try { data = JSON.parse(user.classes_attended_json || '{}'); } catch (e) { data = {}; }
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

// ─── Document Panel ───────────────────────────────────────────────────────────
const StudentDocumentPanel = ({ studentId, uploadedBy }: { studentId: string; uploadedBy: string }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [viewDoc, setViewDoc] = useState<{ data: string; type: string; name: string } | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    const data = await getStudentDocuments(studentId);
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [studentId]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await uploadStudentDocument(studentId, selectedDocType, file.name, base64, uploadedBy);
        await loadDocs();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed', err);
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    await deleteStudentDocument(docId);
    await loadDocs();
  };

  const handleView = async (doc: any) => {
    const { getStudentDocumentData } = await import('../../../lib/api/users');
    const data = await getStudentDocumentData(doc.id);
    if (data) setViewDoc({ data, type: doc.doc_type, name: doc.file_name });
  };

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-400" /> Documents & KYC
      </h4>

      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-erp-background rounded-xl border border-erp-border">
        <select
          value={selectedDocType}
          onChange={e => setSelectedDocType(e.target.value)}
          className="bg-erp-surface border border-erp-border rounded-lg px-3 py-1.5 text-sm text-erp-text focus:outline-none"
        >
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <Button className="text-xs h-8 flex items-center gap-1.5" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
          <Camera className="w-3.5 h-3.5" /> Camera
        </Button>
        <Button variant="secondary" className="text-xs h-8 flex items-center gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="w-3.5 h-3.5" /> Upload File
        </Button>
        {uploading && <span className="flex items-center gap-1 text-xs text-indigo-400"><Loader2 className="w-3 h-3 animate-spin" />Uploading...</span>}
      </div>

      {/* Document List */}
      {loading ? (
        <p className="text-xs text-erp-text/50">Loading documents...</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-erp-text/40 italic">No documents uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {docs.map(doc => (
            <div key={doc.id} className="bg-erp-background border border-erp-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-erp-text truncate">{doc.doc_type}</p>
                  <p className="text-[10px] text-erp-text/40 truncate">{doc.file_name}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleView(doc)} className="flex-1 text-[10px] py-1 px-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button onClick={() => handleDelete(doc.id)} className="text-[10px] py-1 px-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewDoc(null)}>
          <div className="max-w-2xl w-full bg-erp-surface rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-erp-border">
              <p className="font-bold text-erp-text">{viewDoc.type} — {viewDoc.name}</p>
              <div className="flex gap-2">
                <a href={viewDoc.data} download={viewDoc.name} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400">
                  <Download className="w-3 h-3" /> Download
                </a>
                <button onClick={() => setViewDoc(null)} className="p-1.5 text-erp-text/60 hover:text-erp-text"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto flex items-center justify-center">
              {viewDoc.data.startsWith('data:image') ? (
                <img src={viewDoc.data} alt={viewDoc.name} className="max-w-full rounded-lg" />
              ) : (
                <div className="text-center text-erp-text/60">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-indigo-400" />
                  <p className="text-sm">Document preview not available.</p>
                  <a href={viewDoc.data} download={viewDoc.name} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-400">
                    <Download className="w-4 h-4" /> Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<ERPUser[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'pending'>('staff');

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [courses, setCourses] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [curriculum, setCurriculum] = useState<Record<string, string[]>>({});

  // Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<ERPUser | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Sales/HR');
  const [salary, setSalary] = useState<number | ''>(0);
  const [status, setStatus] = useState('Active');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({ crm: false, timetable: false, leaves: false, settings: false });

  // Full student profile fields
  const [stuPhone, setStuPhone] = useState('');
  const [stuDob, setStuDob] = useState('');
  const [stuAddress, setStuAddress] = useState('');
  const [stuFather, setStuFather] = useState('');
  const [stuMother, setStuMother] = useState('');
  const [stuEmergency, setStuEmergency] = useState('');
  const [stuBlood, setStuBlood] = useState('');
  const [stuCourse, setStuCourse] = useState('');
  const [stuBatch, setStuBatch] = useState('');
  const [stuJoining, setStuJoining] = useState('');
  const [stuFeesTotal, setStuFeesTotal] = useState(0);
  const [stuFeesPaid, setStuFeesPaid] = useState(0);
  const [stuTrainingStart, setStuTrainingStart] = useState('');
  const [stuGender, setStuGender] = useState('Male');
  const [stuDocsSubmitted, setStuDocsSubmitted] = useState(0);
  const [isExistingStudent, setIsExistingStudent] = useState(true);

  // CSV Import
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Pending Approval Modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState({ student_id: '', password: '' });

  const downloadSampleCsv = () => {
    const csvContent = "name,email,phone,course,batch_number,joining_date,status,existing_student_y_n\nJohn Doe,john@example.com,1234567890,Frontend,July 2026,2026-07-15,Active,Y\nJane Doe,jane@example.com,0987654321,Backend,Aug 2026,2026-08-01,Active,N";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };


  useEffect(() => { fetchUsersData(); }, [filters, sortBy, sortDir]);
  useEffect(() => { fetchUsersData(); }, [activeTab]);
  useEffect(() => {
    getFilterOptions().then(res => { setCourses(res.courses); setBatches(res.batches); });
    getCourseCurriculum().then(res => setCurriculum(res));
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const pending = await getPendingStudents();
        setPendingStudents(pending);
      } else {
        const queryFilters = { ...filters };
        if (activeTab === 'students') queryFilters.role = 'Student';
        else if (activeTab === 'staff') queryFilters.excludeRole = 'Student';
        const data = await getUsers(queryFilters);
        let sorted = [...data];
        if (sortBy) {
          sorted.sort((a: any, b: any) => {
            const valA = a[sortBy] || '';
            const valB = b[sortBy] || '';
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        setUsers(sorted);
      }
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

  const handleEdit = async (row: any, key: string, value: string) => {
    setUsers(prev => prev.map(u => u.id === row.id ? { ...u, [key]: value } : u));
    try { await patchUser(row.id, { [key]: value }); }
    catch (e) { await fetchUsersData(); }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setRole('Sales/HR'); setSalary(0); setStatus('Active');
    setPermissions({ crm: false, timetable: false, leaves: false, settings: false });
    setStuPhone(''); setStuDob(''); setStuAddress(''); setStuFather(''); setStuMother('');
    setStuEmergency(''); setStuBlood(''); setStuCourse(''); setStuBatch(''); setStuJoining('');
    setStuFeesTotal(0); setStuFeesPaid(0); setStuTrainingStart(''); setStuGender('Male'); setStuDocsSubmitted(0);
    setIsExistingStudent(true);
    setApproveForm({ student_id: '', password: '' });
  };

  const handleOpenModal = (user: ERPUser | null, type?: 'staff' | 'student') => {
    if (user) {
      setEditUser(user);
      setName(user.name); setEmail(user.email);
      setPassword(decryptPassword(user.password_encrypted));
      setRole(user.role || 'Sales/HR'); setSalary(user.salary || 0);
      setStatus(user.status || 'Active');
      setStuPhone(user.phone || ''); setStuDob(user.dob || '');
      setStuAddress(user.address || ''); setStuFather(user.father_name || '');
      setStuMother(user.mother_name || ''); setStuEmergency(user.emergency_contact || '');
      setStuBlood(user.blood_group || ''); setStuCourse(user.course || '');
      setStuBatch(user.batch_number || ''); setStuJoining(user.joining_date || '');
      if (user.permissions_json) {
        try { setPermissions(JSON.parse(user.permissions_json)); }
        catch { setPermissions({ crm: false, timetable: false, leaves: false, settings: false }); }
      }
      
      if (user.role === 'Student') {
        setIsStudentModalOpen(true);
      } else {
        setIsStaffModalOpen(true);
      }
    } else {
      setEditUser(null);
      resetForm();
      if (type === 'student') {
        setRole('Student');
        setIsStudentModalOpen(true);
      } else {
        setRole('Sales/HR');
        setIsStaffModalOpen(true);
      }
    }
  };

  const handleSaveUser = async (isStudentForm: boolean) => {
    if (!name.trim() || !email.trim()) { alert('Name and email are required.'); return; }
    try {
      const userRole = isStudentForm ? 'Student' : role;
      await saveUser({ id: editUser?.id || '', name, email, password, role: userRole, status, salary: Number(salary) || 0, permissions_json: JSON.stringify(permissions) });

      // If student, also update student profile
      if (userRole === 'Student' || editUser?.role === 'Student') {
        // Find student id by email
        const allUsers = await getUsers({ role: 'Student' });
        const stu = allUsers.find((u: any) => u.email === email);
        if (stu) {
          await updateStudentProfile(stu.id, {
            phone: stuPhone, dob: stuDob, address: stuAddress,
            father_name: stuFather, mother_name: stuMother,
            emergency_contact: stuEmergency, blood_group: stuBlood,
            course: stuCourse, batch_number: stuBatch, joining_date: stuJoining, status,
            fees_total: stuFeesTotal, fees_paid: stuFeesPaid, fees_pending: stuFeesTotal - stuFeesPaid,
            training_start_date: stuTrainingStart, gender: stuGender, documents_submitted: stuDocsSubmitted
          });
        }
      }
      await fetchUsersData();
      setIsStaffModalOpen(false);
      setIsStudentModalOpen(false);
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

  // CSV handling
  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      // Filter out rows where 'existing_student' is 'N', 'No', 'False', or '0'
      const validRows = rows.filter(row => {
        const existing = (row.existing_student_y_n || row.existing_student || row.existing || '').toLowerCase();
        return !['n', 'no', 'false', '0'].includes(existing);
      });
      if (validRows.length < rows.length) {
        alert(`Filtered out ${rows.length - validRows.length} rows where 'Existing student' was N.`);
      }
      setCsvPreview(validRows);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    const result = await bulkImportStudents(csvPreview);
    setCsvResult(result);
    setCsvImporting(false);
    await fetchUsersData();
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

  const studentColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Portal Login' },
    { key: 'course', header: 'Course' },
    { key: 'batch_number', header: 'Batch' },
    { key: 'preferred_mode', header: 'Mode' },
    { key: 'classes_attended', header: 'Progress', render: (row: any) => <ClassesAttendedCell user={row} curriculum={curriculum} /> },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ];

  const pendingColumns = [
    { key: 'name', header: 'Name' },
    { key: 'portal_login_email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'course', header: 'Course' },
    { key: 'fees_total', header: 'Total Fee' },
    { key: 'fees_paid', header: 'Paid Fee' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions', filterable: false, render: (row: any) => (
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); setApprovingStudentId(row.id); setIsApproveModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg">Approve</button>
        <button onClick={async (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to reject this student?')) {
            await rejectStudent(row.id);
            fetchUsersData();
          }
        }} className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg">Reject</button>
      </div>
    )}
  ];

  const columns = activeTab === 'staff' ? staffColumns : (activeTab === 'pending' ? pendingColumns : studentColumns);

  const inputCls = "w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-sm text-erp-text focus:outline-none focus:border-indigo-500";

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-20 md:pb-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Users className="w-8 h-8 text-erp-primary" /> User Management
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage staff, students, roles, documents & access.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'students' && (
              <>
                <Button variant="ghost" className="flex items-center gap-2 text-sm text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10" onClick={downloadSampleCsv}>
                  <Download className="w-4 h-4" /> Sample CSV
                </Button>
                <Button variant="secondary" className="flex items-center gap-2 text-sm" onClick={() => setShowCsvModal(true)}>
                  <FileSpreadsheet className="w-4 h-4" /> Import CSV
                </Button>
                <Button className="flex items-center gap-2 text-sm" onClick={() => handleOpenModal(null, 'student')}>
                  <UserPlus className="w-4 h-4" /> Add Student
                </Button>
              </>
            )}
            {activeTab === 'staff' && (
              <Button className="flex items-center gap-2 text-sm" onClick={() => handleOpenModal(null, 'staff')}>
                <Plus className="w-4 h-4" /> Add Staff
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-5 border-b border-erp-border">
          <button
            className={`pb-2 px-1 font-bold capitalize ${activeTab === 'staff' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => { setActiveTab('staff'); setFilters({}); }}
          >Staff Members</button>
          <button
            className={`pb-2 px-1 font-bold capitalize ${activeTab === 'students' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => { setActiveTab('students'); setFilters({}); }}
          >Students</button>
          {(currentUser?.role === 'CEO' || currentUser?.role === 'Manager') && (
            <button
              className={`pb-2 px-1 font-bold capitalize ${activeTab === 'pending' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
              onClick={() => { setActiveTab('pending'); setFilters({}); }}
            >
              Pending Approvals {pendingStudents.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">{pendingStudents.length}</span>}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-erp-surface border border-erp-border p-4 rounded-xl mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/50" />
            <input type="text" value={filters.search || ''} placeholder="Search by Name, Email, or ID..."
              className={`${inputCls} pl-10`} onChange={e => handleFilter('search', e.target.value)} />
          </div>
          {activeTab === 'students' && (
            <>
              <select className={`w-44 ${inputCls}`} onChange={e => handleFilter('course', e.target.value)}>
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={`w-36 ${inputCls}`} onChange={e => handleFilter('batch', e.target.value)}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </>
          )}
          <input type="date" className={`w-40 ${inputCls}`} onChange={e => handleFilter('startDate', e.target.value)} title="Joined After" />
          <input type="date" className={`w-40 ${inputCls}`} onChange={e => handleFilter('endDate', e.target.value)} title="Joined Before" />
        </div>

        {/* Table */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-erp-surface/50 flex items-center justify-center z-10 rounded-xl">
              <span className="font-bold text-erp-text/70 bg-erp-surface px-4 py-2 rounded shadow">Loading users...</span>
            </div>
          )}
          <DataTable columns={columns} data={activeTab === 'pending' ? pendingStudents : users} onSort={handleSort} onEdit={activeTab === 'pending' ? undefined : handleEdit} sortBy={sortBy} sortDir={sortDir}
            renderExpandedRow={activeTab === 'students' ? (row) => {
              let moduleProgress: Record<string, number> = {};
              try { moduleProgress = JSON.parse(row.classes_attended_json || '{}'); } catch (e) {}
              const courseModules = (row.course && curriculum[row.course]) ? curriculum[row.course] : Object.keys(moduleProgress);
              if (courseModules.length === 0) courseModules.push('General');
              return (
                <div className="p-6 bg-erp-background/50">
                  {/* Full Profile */}
                  <h4 className="text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-3">Full Student Profile</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    {[
                      ['Name', row.name], ['Email', row.email], ['Phone', row.phone],
                      ['DOB', row.dob], ['Blood Group', row.blood_group],
                      ['Father', row.father_name], ['Mother', row.mother_name],
                      ['Emergency', row.emergency_contact], ['Address', row.address],
                      ['Course', row.course], ['Batch', row.batch_number],
                      ['Joining Date', row.joining_date], ['Status', row.status], ['Mode', row.preferred_mode]
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-[10px] text-erp-text/40 uppercase tracking-wider mb-0.5">{label as string}</p>
                        <p className="text-sm font-medium text-erp-text">{(val as string) || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Module Progress */}
                  <h4 className="text-xs font-bold text-erp-text/70 uppercase tracking-wider mb-3 mt-2">Module Progress</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                    {courseModules.map((mod: string) => {
                      const count = moduleProgress[mod] || 0;
                      return (
                        <div key={mod} className="flex flex-col gap-2 bg-erp-surface p-3 rounded-lg border border-erp-border">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold truncate pr-2" title={mod}>{mod}</span>
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded">{count} Cls</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={async () => {
                              const newData = { ...moduleProgress, [mod]: Math.max(0, count - 1) };
                              const jsonStr = JSON.stringify(newData);
                              setUsers(prev => prev.map(u => u.id === row.id ? { ...u, classes_attended_json: jsonStr } : u));
                              try { await updateStudentAttended(row.email, jsonStr); } catch { fetchUsersData(); }
                            }} className="w-5 h-5 rounded bg-erp-surface text-red-500 hover:bg-red-50 border border-erp-border flex items-center justify-center font-bold text-[10px]">-</button>
                            <div className="flex-1 h-1.5 bg-erp-border/30 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (count / 20) * 100)}%` }} />
                            </div>
                            <button onClick={async () => {
                              const newData = { ...moduleProgress, [mod]: count + 1 };
                              const jsonStr = JSON.stringify(newData);
                              setUsers(prev => prev.map(u => u.id === row.id ? { ...u, classes_attended_json: jsonStr } : u));
                              try { await updateStudentAttended(row.email, jsonStr); } catch { fetchUsersData(); }
                            }} className="w-5 h-5 rounded bg-erp-surface text-green-500 hover:bg-green-50 border border-erp-border flex items-center justify-center font-bold text-[10px]">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Documents */}
                  <StudentDocumentPanel studentId={row.id} uploadedBy={currentUser?.id || ''} />
                </div>
              );
            } : undefined}
          />
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
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Email / Portal Login *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@cynexai.com" />
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

              {/* Staff-only fields */}
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
              <Button variant="primary" onClick={() => handleSaveUser(false)}>
                {editUser ? 'Save Changes' : 'Create Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Student Modal ─── */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-erp-border bg-erp-background/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                {editUser ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-erp-text/50 hover:text-erp-text"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Email / Portal Login *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@cynexai.com" />
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
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
              </div>

              {/* Student profile fields */}
              <div className="border-t border-erp-border pt-4">
                <p className="text-xs font-bold text-erp-text/60 uppercase tracking-wider mb-3">Academic Info</p>

                <div className="mb-4 p-3 bg-erp-background border-2 border-erp-border rounded-xl">
                  <label className="flex items-center gap-2 text-sm font-bold text-erp-text">
                    <input type="checkbox" checked={isExistingStudent} onChange={e => setIsExistingStudent(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                    Is this an existing student? (Check for Yes)
                  </label>
                  {!isExistingStudent && (
                    <p className="text-xs text-red-500 mt-2 font-bold"><AlertCircle className="w-3 h-3 inline mr-1"/>New leads should be added via the CRM pipeline first.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Course</label>
                    <select value={stuCourse} onChange={e => setStuCourse(e.target.value)} className={inputCls}>
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Batch</label>
                    <input type="text" value={stuBatch} onChange={e => setStuBatch(e.target.value)} className={inputCls} placeholder="e.g. July 2026" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Joining Date</label>
                    <input type="date" value={stuJoining} onChange={e => setStuJoining(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Training Start Date</label>
                    <input type="date" value={stuTrainingStart} onChange={e => setStuTrainingStart(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Total Fees</label>
                    <input type="number" value={stuFeesTotal} onChange={e => setStuFeesTotal(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Fees Paid</label>
                    <input type="number" value={stuFeesPaid} onChange={e => setStuFeesPaid(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Fees Pending</label>
                    <input type="number" readOnly value={stuFeesTotal - stuFeesPaid} className={`${inputCls} bg-erp-surface text-erp-text/50`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Documents Submitted?</label>
                    <select value={stuDocsSubmitted} onChange={e => setStuDocsSubmitted(Number(e.target.value))} className={inputCls}>
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t border-erp-border pt-4">
                <p className="text-xs font-bold text-erp-text/60 uppercase tracking-wider mb-3">Personal Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Phone</label>
                    <input type="tel" value={stuPhone} onChange={e => setStuPhone(e.target.value)} className={inputCls} placeholder="10-digit mobile" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Date of Birth</label>
                    <input type="date" value={stuDob} onChange={e => setStuDob(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Gender</label>
                    <select value={stuGender} onChange={e => setStuGender(e.target.value)} className={inputCls}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Blood Group</label>
                    <select value={stuBlood} onChange={e => setStuBlood(e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Emergency Contact</label>
                    <input type="tel" value={stuEmergency} onChange={e => setStuEmergency(e.target.value)} className={inputCls} placeholder="Guardian phone" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-erp-text/60 mb-1">Address</label>
                    <textarea rows={2} value={stuAddress} onChange={e => setStuAddress(e.target.value)} className={`${inputCls} resize-none`} placeholder="Full residential address" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-erp-border flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsStudentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!isExistingStudent} onClick={() => handleSaveUser(true)}>
                {editUser ? 'Save Changes' : 'Add Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CSV Import Modal ─── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-erp-border">
              <h2 className="text-xl font-bold text-erp-text flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-400" /> Bulk Import Students (CSV)
              </h2>
              <button onClick={() => { setShowCsvModal(false); setCsvPreview([]); setCsvResult(null); }}><X className="w-6 h-6 text-erp-text/60" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex-1">
                  <p className="font-bold mb-1">CSV Format Required:</p>
                  <code className="block text-[10px] sm:text-xs">name, email, phone, course, batch_number, joining_date, status, existing_student_y_n</code>
                  <p className="mt-2 text-indigo-400">Rows where <code className="font-bold">existing_student_y_n</code> is "N" will be auto-rejected.</p>
                  <p className="mt-1 text-indigo-400">Default password for imported students: <strong>cynex123</strong></p>
                </div>
                <Button variant="secondary" className="flex items-center gap-2 text-xs flex-shrink-0" onClick={downloadSampleCsv}>
                  <Download className="w-4 h-4" /> Download Sample CSV
                </Button>
              </div>

              <input ref={csvInputRef} type="file" accept=".csv" className="hidden"
                onChange={e => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />

              {csvPreview.length === 0 ? (
                <button onClick={() => csvInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-erp-border rounded-xl p-8 text-erp-text/50 hover:border-indigo-500 hover:text-indigo-400 transition-colors text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-bold">Click to select CSV file</p>
                </button>
              ) : (
                <>
                  <div className="text-xs font-bold text-erp-text/60 mb-2">{csvPreview.length} students found in CSV</div>
                  <div className="overflow-x-auto rounded-xl border border-erp-border">
                    <table className="w-full text-xs">
                      <thead className="bg-erp-background">
                        <tr>{Object.keys(csvPreview[0]).map(h => <th key={h} className="px-3 py-2 text-left font-bold text-erp-text/60 uppercase">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-erp-border">
                            {Object.values(row).map((val: any, j) => <td key={j} className="px-3 py-2 text-erp-text">{val}</td>)}
                          </tr>
                        ))}
                        {csvPreview.length > 5 && <tr><td colSpan={10} className="px-3 py-2 text-erp-text/40 italic">...and {csvPreview.length - 5} more rows</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {csvResult && (
                <div className={`p-3 rounded-xl border text-sm ${csvResult.errors.length === 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  <p className="font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Imported {csvResult.imported} students successfully.</p>
                  {csvResult.errors.length > 0 && (
                    <ul className="mt-2 text-xs space-y-1 text-red-400">
                      {csvResult.errors.map((e, i) => <li key={i} className="flex gap-1.5"><AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-erp-border flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setCsvPreview([]); setCsvResult(null); }}>Clear</Button>
              <Button variant="primary" disabled={csvPreview.length === 0 || csvImporting} onClick={handleCsvImport}>
                {csvImporting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Importing...</> : `Import ${csvPreview.length} Students`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Approve Pending Student Modal ─── */}
      {isApproveModalOpen && approvingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-erp-border">
              <h2 className="text-lg font-bold text-erp-text flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Approve Student
              </h2>
              <button onClick={() => { setIsApproveModalOpen(false); setApprovingStudentId(null); }} className="text-erp-text/50 hover:text-erp-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-erp-text/70 mb-2">Assign an ID and password for this student to access the portal.</p>
              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Assign Student ID (optional)</label>
                <input type="text" value={approveForm.student_id} onChange={e => setApproveForm({...approveForm, student_id: e.target.value})} className={inputCls} placeholder="Leave blank to auto-generate" />
              </div>
              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Set Password *</label>
                <input type="text" value={approveForm.password} onChange={e => setApproveForm({...approveForm, password: e.target.value})} className={inputCls} placeholder="e.g. Temp@123" />
              </div>
            </div>
            <div className="p-5 border-t border-erp-border flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setIsApproveModalOpen(false); setApprovingStudentId(null); }}>Cancel</Button>
              <Button variant="primary" onClick={async () => {
                if (!approveForm.password) return alert("Password is required to approve a student.");
                await approveStudent(approvingStudentId, approveForm.password, approveForm.student_id || undefined);
                alert("Student approved successfully!");
                setIsApproveModalOpen(false);
                setApprovingStudentId(null);
                fetchUsersData();
              }}>Approve</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
