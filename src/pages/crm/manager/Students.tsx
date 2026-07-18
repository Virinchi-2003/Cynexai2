import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, ChevronDown, ChevronRight, X,
  GraduationCap, Flame, Coins, Shield, Trophy, Loader2,
  TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart2,
  Plus, Minus, Award, BookOpen, Zap, Eye, Edit2,
  Phone, Mail, MapPin, Calendar, Hash,
} from 'lucide-react';
import { getCurrentUser } from '../../../lib/auth';
import { client } from '../../../lib/turso';

interface StudentStat {
  id: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  batch_number?: string;
  status?: string;
  joining_date?: string;
  streak: number;
  coins: number;
  badges: number;
  completedClasses: number;
  totalModules: number;
  attendancePct: number;
  level: number;
  portal_login_email?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function StatPill({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl" style={{ background: `${color}10` }}>
      <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
      <span className="text-base font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const navigate = useNavigate();
  const me = getCurrentUser();

  const [students, setStudents] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentStat | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // Gamification adjustment modal
  const [adjustModal, setAdjustModal] = useState<{ student: StudentStat; field: 'coins' | 'streak' | 'badges' } | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  useEffect(() => { loadStudents(); }, [courseFilter, batchFilter, statusFilter, search]);

  const loadStudents = async () => {
    if (!client) return;
    setLoading(true);
    try {
      let sql = `
        SELECT 
          s.id, s.name, s.portal_login_email as email, s.phone, s.course,
          s.batch_number, s.status, s.joining_date,
          s.portal_login_email,
          COALESCE(s.streak, 0) as streak,
          COALESCE(s.coins, 0) as coins,
          (SELECT COUNT(*) FROM badges b WHERE b.student_id = s.id) as badges,
          (SELECT COUNT(*) FROM student_progress sp WHERE sp.student_id = s.id AND sp.completed = 1) as completedClasses
        FROM students s
        WHERE 1=1
      `;
      const args: any[] = [];
      if (search) { sql += ` AND (s.name LIKE ? OR s.portal_login_email LIKE ? OR s.phone LIKE ?)`; const q = `%${search}%`; args.push(q, q, q); }
      if (courseFilter) { sql += ` AND s.course = ?`; args.push(courseFilter); }
      if (batchFilter) { sql += ` AND s.batch_number = ?`; args.push(batchFilter); }
      if (statusFilter) { sql += ` AND s.status = ?`; args.push(statusFilter); }
      sql += ` ORDER BY s.name ASC LIMIT 200`;

      const res = await client.execute({ sql, args });
      const data = res.rows.map((r: any) => ({
        id: r.id, name: r.name || 'Unknown', email: r.email, phone: r.phone,
        course: r.course, batch_number: r.batch_number, status: r.status,
        joining_date: r.joining_date, portal_login_email: r.portal_login_email,
        streak: Number(r.streak) || 0,
        coins: Number(r.coins) || 0,
        badges: Number(r.badges) || 0,
        completedClasses: Number(r.completedClasses) || 0,
        totalModules: 0, attendancePct: 0,
        level: Math.floor((Number(r.completedClasses) || 0) / 10) + 1,
      }));
      setStudents(data);

      // Load filter options
      const cRes = await client.execute({ sql: `SELECT DISTINCT course FROM students WHERE course IS NOT NULL AND course != '' ORDER BY course`, args: [] }).catch(() => ({ rows: [] }));
      const bRes = await client.execute({ sql: `SELECT DISTINCT batch_number FROM students WHERE batch_number IS NOT NULL AND batch_number != '' ORDER BY batch_number`, args: [] }).catch(() => ({ rows: [] }));
      setCourses(cRes.rows.map((r: any) => r.course).filter(Boolean));
      setBatches(bRes.rows.map((r: any) => r.batch_number).filter(Boolean));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openStudentDetail = async (stu: StudentStat) => {
    setSelectedStudent(stu);
    setDetailLoading(true);
    setDetailData(null);
    try {
      if (!client) return;
      // Get module progress from actual classes table
      const modRes = await client.execute({
        sql: `
          SELECT m.id, m.title,
            (SELECT COUNT(*) FROM classes c WHERE c.module_id = m.id) as totalClasses,
            (SELECT COUNT(*) FROM student_progress sp
              JOIN classes c ON sp.lesson_id = c.id
              WHERE sp.student_id = ? AND sp.completed = 1 AND c.module_id = m.id) as completedClasses
          FROM modules m
          JOIN course_module_mapping cmm ON m.id = cmm.module_id
          JOIN courses co ON cmm.course_id = co.id
          WHERE (co.name = ? OR co.title = ?)
          ORDER BY cmm.order_index ASC
        `,
        args: [stu.id, stu.course || '', stu.course || ''],
      }).catch(() => ({ rows: [] }));

      // Recent activity
      const actRes = await client.execute({
        sql: `SELECT sp.created_at, c.title as class_title, m.title as module_title
              FROM student_progress sp
              JOIN classes c ON sp.lesson_id = c.id
              JOIN modules m ON c.module_id = m.id
              WHERE sp.student_id = ? AND sp.completed = 1
              ORDER BY sp.created_at DESC LIMIT 10`,
        args: [stu.id],
      }).catch(() => ({ rows: [] }));

      // Attendance (from student_progress as proxy)
      const attRes = await client.execute({
        sql: `SELECT DATE(created_at) as day FROM student_progress WHERE student_id = ? AND completed = 1 GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30`,
        args: [stu.id],
      }).catch(() => ({ rows: [] }));

      setDetailData({
        modules: modRes.rows,
        recentActivity: actRes.rows,
        attendanceDays: attRes.rows.map((r: any) => r.day),
      });
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleAdjust = async () => {
    if (!adjustModal || !client) return;
    setAdjustSaving(true);
    try {
      const { student, field } = adjustModal;
      const col = field === 'badges' ? null : field; // badges handled separately
      if (field === 'badges' && adjustDelta > 0) {
        for (let i = 0; i < adjustDelta; i++) {
          await client.execute({
            sql: `INSERT INTO badges (id, student_id, name, awarded_at) VALUES (?, ?, ?, ?)`,
            args: [`bdg_${Date.now()}_${i}`, student.id, adjustReason || 'Achievement Badge', new Date().toISOString()],
          });
        }
      } else if (col) {
        await client.execute({
          sql: `UPDATE students SET ${col} = MAX(0, COALESCE(${col}, 0) + ?) WHERE id = ?`,
          args: [adjustDelta, student.id],
        });
      }
      setAdjustModal(null);
      setAdjustDelta(0);
      setAdjustReason('');
      await loadStudents();
      if (selectedStudent?.id === student.id) openStudentDetail(student);
    } catch (e) { console.error(e); alert('Failed to adjust. Please try again.'); }
    finally { setAdjustSaving(false); }
  };

  const statusColor: Record<string, string> = {
    Active: '#10b981', Suspended: '#ef4444', Alumni: '#8b5cf6', Pending: '#f59e0b',
  };

  // ── Filtered students ───────────────────────────────────────────────────────
  const filtered = students; // filtering happens server-side

  const inputCls = "w-full bg-erp-background border border-erp-border rounded-xl px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500";

  const handleModuleAdjust = async (moduleId: string, action: 'add' | 'remove') => {
    if (!selectedStudent || !client) return;
    setDetailLoading(true);
    try {
      if (action === 'add') {
        // Find the first uncompleted class in this module
        const res = await client.execute({
          sql: `SELECT c.id FROM classes c 
                WHERE c.module_id = ? 
                AND c.id NOT IN (SELECT lesson_id FROM student_progress WHERE student_id = ? AND completed = 1)
                ORDER BY c.order_index ASC LIMIT 1`,
          args: [moduleId, selectedStudent.id]
        });
        if (res.rows.length > 0) {
          const classId = res.rows[0].id as string;
          const ts = new Date().toISOString();
          await client.execute({
            sql: `INSERT INTO student_progress (id, student_id, lesson_id, completed, created_at) VALUES (?, ?, ?, 1, ?)`,
            args: [`sp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, selectedStudent.id, classId, ts]
          });
        }
      } else {
        // Find the most recently completed class in this module
        const res = await client.execute({
          sql: `SELECT sp.id FROM student_progress sp
                JOIN classes c ON sp.lesson_id = c.id
                WHERE sp.student_id = ? AND c.module_id = ? AND sp.completed = 1
                ORDER BY sp.created_at DESC LIMIT 1`,
          args: [selectedStudent.id, moduleId]
        });
        if (res.rows.length > 0) {
          await client.execute({
            sql: `DELETE FROM student_progress WHERE id = ?`,
            args: [res.rows[0].id]
          });
        }
      }
      await openStudentDetail(selectedStudent);
    } catch (e) {
      console.error(e);
      alert('Failed to update module progress');
      setDetailLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">

      {/* ── Left: Student List ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden p-4 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-erp-text flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
              Students
            </h1>
            <p className="text-erp-text/60 text-sm mt-0.5">{students.length} students enrolled</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/user-management')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-erp-surface border border-erp-border text-erp-text/70 hover:text-erp-text transition-colors">
              <Edit2 className="w-4 h-4" />
              Manage Users
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-erp-surface border border-erp-border rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className={`${inputCls} pl-9`} />
          </div>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className={`w-48 ${inputCls}`}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className={`w-36 ${inputCls}`}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`w-32 ${inputCls}`}>
            <option value="">All Status</option>
            {['Active', 'Suspended', 'Alumni', 'Pending'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Students', value: students.length, color: '#6366f1', icon: Users },
            { label: 'Active', value: students.filter(s => s.status === 'Active').length, color: '#10b981', icon: CheckCircle2 },
            { label: 'Avg Streak', value: students.length ? Math.round(students.reduce((a, s) => a + s.streak, 0) / students.length) : 0, color: '#f97316', icon: Flame },
            { label: 'Avg Coins', value: students.length ? Math.round(students.reduce((a, s) => a + s.coins, 0) / students.length) : 0, color: '#f59e0b', icon: Coins },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-erp-surface border border-erp-border rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-black text-erp-text">{value}</div>
                <div className="text-[11px] text-erp-text/50 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Student table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-erp-text/40">
              <Users className="w-12 h-12 mb-2" />
              <p className="font-bold">No students found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(stu => (
                <div key={stu.id}
                  onClick={() => openStudentDetail(stu)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedStudent?.id === stu.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-erp-border bg-erp-surface hover:border-erp-border/60'}`}>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                    {stu.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-erp-text text-sm truncate">{stu.name}</p>
                      <Badge color={statusColor[stu.status || 'Active'] || '#64748b'}>{stu.status || 'Active'}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-erp-text/50 mt-0.5">
                      {stu.course && <span className="truncate max-w-[160px]">{stu.course}</span>}
                      {stu.batch_number && <span>Batch {stu.batch_number}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                      <Flame className="w-3 h-3" />{stu.streak}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                      <Coins className="w-3 h-3" />{stu.coins}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      <BookOpen className="w-3 h-3" />{stu.completedClasses}
                    </span>
                    <span className="text-xs font-black px-2 py-1 rounded-lg text-white" style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}>
                      LVL {stu.level}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-erp-text/30 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Student Detail Panel ── */}
      {selectedStudent && (
        <div className="hidden lg:flex flex-col w-96 flex-shrink-0 border-l border-erp-border bg-erp-surface overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-erp-border">
            <h2 className="font-black text-erp-text text-base">Student Profile</h2>
            <button onClick={() => setSelectedStudent(null)} className="text-erp-text/40 hover:text-erp-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
                {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-black text-erp-text text-lg">{selectedStudent.name}</p>
                <Badge color={statusColor[selectedStudent.status || 'Active'] || '#64748b'}>{selectedStudent.status || 'Active'}</Badge>
                <p className="text-erp-text/50 text-xs mt-1">{selectedStudent.course || 'No course'} · Batch {selectedStudent.batch_number || '—'}</p>
              </div>
            </div>

            {/* Gamification Stats */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-erp-text/40">Gamification</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdjustModal({ student: selectedStudent, field: 'streak' })}
                  className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
                  <span className="text-xl font-black" style={{ color: '#f97316' }}>{selectedStudent.streak}</span>
                  <span className="text-[10px] font-bold text-erp-text/40 uppercase">Streak</span>
                </button>
                <button onClick={() => setAdjustModal({ student: selectedStudent, field: 'coins' })}
                  className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Coins className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  <span className="text-xl font-black" style={{ color: '#f59e0b' }}>{selectedStudent.coins}</span>
                  <span className="text-[10px] font-bold text-erp-text/40 uppercase">Coins</span>
                </button>
                <button onClick={() => setAdjustModal({ student: selectedStudent, field: 'badges' })}
                  className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Shield className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                  <span className="text-xl font-black" style={{ color: '#8b5cf6' }}>{selectedStudent.badges}</span>
                  <span className="text-[10px] font-bold text-erp-text/40 uppercase">Badges</span>
                </button>
              </div>
              <p className="text-[10px] text-erp-text/30 text-center mt-1">Tap a stat to adjust it</p>
            </div>

            {/* Contact info */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-erp-text/40 mb-2">Contact</p>
              <div className="space-y-2">
                {selectedStudent.email && (
                  <div className="flex items-center gap-2 text-sm text-erp-text/70">
                    <Mail className="w-4 h-4 text-erp-text/30" />
                    <span className="truncate">{selectedStudent.email}</span>
                  </div>
                )}
                {selectedStudent.phone && (
                  <div className="flex items-center gap-2 text-sm text-erp-text/70">
                    <Phone className="w-4 h-4 text-erp-text/30" />
                    {selectedStudent.phone}
                  </div>
                )}
                {selectedStudent.joining_date && (
                  <div className="flex items-center gap-2 text-sm text-erp-text/70">
                    <Calendar className="w-4 h-4 text-erp-text/30" />
                    Joined {new Date(selectedStudent.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            {/* Module Progress (from actual CMS) */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-erp-text/40 mb-2">
                Module Progress <span className="text-[9px] text-emerald-400 ml-1">← from Course CMS</span>
              </p>
              {detailLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : detailData?.modules?.length > 0 ? (
                <div className="space-y-2">
                  {detailData.modules.map((mod: any) => {
                    const total = Number(mod.totalClasses) || 0;
                    const done = Number(mod.completedClasses) || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={mod.id} className="bg-erp-background rounded-xl p-3 border border-erp-border">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-erp-text truncate flex-1 mr-2">{mod.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-black text-indigo-400">{done}/{total}</span>
                            <div className="flex items-center bg-erp-background border border-erp-border rounded-lg overflow-hidden">
                              <button onClick={() => handleModuleAdjust(mod.id, 'remove')} disabled={done === 0 || detailLoading}
                                className="px-1.5 py-0.5 hover:bg-erp-border/30 disabled:opacity-30 text-erp-text/60 hover:text-erp-text transition-colors">
                                <Minus className="w-3 h-3" strokeWidth={3} />
                              </button>
                              <button onClick={() => handleModuleAdjust(mod.id, 'add')} disabled={done >= total || detailLoading}
                                className="px-1.5 py-0.5 hover:bg-erp-border/30 disabled:opacity-30 text-erp-text/60 hover:text-erp-text transition-colors border-l border-erp-border">
                                <Plus className="w-3 h-3" strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-erp-border/40">
                          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-erp-text/40 mt-1">{pct}% complete</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-erp-text/30">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No modules found for this course.</p>
                  <p className="text-xs mt-1">Add classes via Course CMS first.</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {detailData?.recentActivity?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-erp-text/40 mb-2">Recent Activity</p>
                <div className="space-y-1.5">
                  {detailData.recentActivity.slice(0, 5).map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-erp-text/70 flex-1 truncate">{act.class_title}</span>
                      <span className="text-[11px] text-erp-text/30 flex-shrink-0">
                        {act.created_at ? new Date(act.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Adjust Modal ── */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-erp-border">
              <h3 className="font-black text-erp-text flex items-center gap-2">
                {adjustModal.field === 'streak' && <Flame className="w-4 h-4 text-orange-400" />}
                {adjustModal.field === 'coins' && <Coins className="w-4 h-4 text-amber-400" />}
                {adjustModal.field === 'badges' && <Shield className="w-4 h-4 text-violet-400" />}
                Adjust {adjustModal.field.charAt(0).toUpperCase() + adjustModal.field.slice(1)}
              </h3>
              <button onClick={() => { setAdjustModal(null); setAdjustDelta(0); setAdjustReason(''); }}
                className="text-erp-text/40 hover:text-erp-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-erp-text/60">
                Current {adjustModal.field}: <strong className="text-erp-text">
                  {adjustModal.field === 'streak' ? adjustModal.student.streak :
                   adjustModal.field === 'coins' ? adjustModal.student.coins :
                   adjustModal.student.badges}
                </strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Adjustment Amount</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdjustDelta(d => d - 1)} disabled={adjustModal.field === 'badges'}
                    className="w-10 h-10 rounded-xl border border-erp-border text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center font-black disabled:opacity-30">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={adjustDelta} onChange={e => setAdjustDelta(Number(e.target.value))}
                    className="flex-1 text-center font-black text-2xl bg-erp-background border border-erp-border rounded-xl py-2 text-erp-text focus:outline-none focus:border-indigo-500" />
                  <button onClick={() => setAdjustDelta(d => d + 1)}
                    className="w-10 h-10 rounded-xl border border-erp-border text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center justify-center font-black">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {adjustModal.field === 'badges' && <p className="text-xs text-amber-400 mt-1">Badges can only be added, not removed here.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Reason (optional)</label>
                <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  placeholder={adjustModal.field === 'badges' ? 'Badge name, e.g. "Top Performer"' : 'e.g. Completed assignment, Penalty...'}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-3 py-2 text-sm text-erp-text focus:outline-none focus:border-indigo-500" />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setAdjustModal(null); setAdjustDelta(0); setAdjustReason(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-erp-border text-erp-text/70 text-sm font-bold hover:bg-erp-background transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdjust} disabled={adjustDelta === 0 || adjustSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {adjustSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Apply ({adjustDelta > 0 ? '+' : ''}{adjustDelta})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
