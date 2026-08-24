import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { 
  QrCode, Video, Users, CheckCircle, Copy, ExternalLink, 
  RefreshCw, Search, UserCheck, UserX, Clock, Sparkles, ShieldCheck, 
  Laptop, MapPin, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { 
  getActiveLiveClass, 
  getAllAvailableClasses, 
  logAttendance, 
  removeAttendance, 
  getLiveAttendance 
} from '../../lib/api/teacher';
import { getAllBatches, BatchItem } from '../../lib/api/batches';
import { generateQRAttendance, QRCodeResult } from '../../lib/api/ux';
import { QRCodeSVG } from 'qrcode.react';

export default function AttendanceSystem() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const userId = user?.id;

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [activeClass, setActiveClass] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [qrData, setQrData] = useState<QRCodeResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'pending' | 'absent'>('all');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Selected batch metadata
  const selectedBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId || b.name === selectedBatchId);
  }, [batches, selectedBatchId]);

  const batchMode = selectedBatch?.mode || 'Hybrid';

  // Sync live attendance logs from database for the given classId or selected batch
  const syncAttendanceFromDB = useCallback(async (classId: string, batchName?: string) => {
    if (!classId && !batchName) return;
    try {
      setSyncing(true);
      const logs = await getLiveAttendance(classId || 'default', batchName);
      setLiveLogs(logs || []);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Error syncing live attendance:', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Initial load of batches, classes, and student list
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [batchList, primaryClass, classList, usersModule] = await Promise.all([
          getAllBatches(),
          getActiveLiveClass(userId),
          getAllAvailableClasses(),
          import('../../lib/api/users')
        ]);

        if (!isMounted) return;

        setBatches(batchList || []);
        if (batchList && batchList.length > 0) {
          setSelectedBatchId(batchList[0].id);
        }

        setAvailableClasses(classList || []);
        const currentClass = primaryClass || (classList && classList.length > 0 ? classList[0] : null);
        setActiveClass(currentClass);

        // Load all students
        const allUsers = await usersModule.getUsers();
        if (isMounted) {
          setStudents((allUsers || []).filter((u: any) => u.role === 'Student'));
        }

        if (currentClass?.id || batchList?.[0]?.name) {
          await syncAttendanceFromDB(currentClass?.id || 'default', batchList?.[0]?.name);
        }
      } catch (e) {
        console.error('Error initializing attendance system:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [userId, syncAttendanceFromDB]);

  // Periodic silent polling every 6s for real-time DB sync
  useEffect(() => {
    const classId = activeClass?.id || 'default';
    const batchName = selectedBatch?.name;

    const interval = setInterval(() => {
      syncAttendanceFromDB(classId, batchName);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeClass?.id, selectedBatch?.name, syncAttendanceFromDB]);

  // Handle switching selected batch
  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setQrData(null);
    const targetBatch = batches.find(b => b.id === batchId || b.name === batchId);
    await syncAttendanceFromDB(activeClass?.id || 'default', targetBatch?.name);
  };

  // Handle switching selected class
  const handleSelectClass = async (classId: string) => {
    const selected = availableClasses.find(c => c.id === classId) || activeClass;
    if (selected) {
      setActiveClass(selected);
      setQrData(null);
      await syncAttendanceFromDB(selected.id, selectedBatch?.name);
    }
  };

  const handleGenerateQR = async () => {
    const sessionToken = activeClass?.id || selectedBatch?.id || `batch_session_${Date.now()}`;
    try {
      const data = await generateQRAttendance(sessionToken);
      setQrData(data);
    } catch (e) {
      console.error('Error generating QR:', e);
    }
  };

  const handleMarkPresent = async (studentId: string) => {
    const targetClassId = activeClass?.id || 'default';
    try {
      await logAttendance(studentId, targetClassId, 'Manual');
      await syncAttendanceFromDB(targetClassId, selectedBatch?.name);
    } catch (e) {
      console.error('Failed to mark present:', e);
      alert('Failed to update attendance in database.');
    }
  };

  const handleMarkAbsent = async (studentId: string) => {
    const targetClassId = activeClass?.id || 'default';
    try {
      await removeAttendance(studentId, targetClassId);
      await syncAttendanceFromDB(targetClassId, selectedBatch?.name);
    } catch (e) {
      console.error('Failed to mark absent:', e);
      alert('Failed to update attendance in database.');
    }
  };

  const handleMarkAllPresent = async () => {
    const targetClassId = activeClass?.id || 'default';
    if (batchStudents.length === 0) return;
    try {
      setSyncing(true);
      const absentStudents = batchStudents.filter(s => {
        const log = presentStudentMap.get(s.id) || presentStudentMap.get(s.email?.toLowerCase());
        const isPresent = log && (log.duration_minutes >= 5 || log.status === 'Present' || log.attendance_type === 'Offline_QR');
        return !isPresent;
      });
      await Promise.all(absentStudents.map(s => logAttendance(s.id, targetClassId, 'Manual')));
      await syncAttendanceFromDB(targetClassId, selectedBatch?.name);
    } catch (e) {
      console.error('Failed to mark all present:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyMeetLink = () => {
    const link = activeClass 
      ? `https://meet.google.com/cnx-${activeClass.id.substring(0, 8)}`
      : `https://meet.google.com/cnx-${selectedBatch?.name?.toLowerCase().replace(/\s+/g, '-') || 'live'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Map of present student IDs / Emails to attendance logs
  const presentStudentMap = useMemo(() => {
    const map = new Map<string, any>();
    liveLogs.forEach(log => {
      if (log.student_id) {
        map.set(log.student_id, log);
      }
      if (log.student_email) {
        map.set(log.student_email.toLowerCase(), log);
      }
    });
    return map;
  }, [liveLogs]);

  // Filter students strictly by selected batch
  const batchStudents = useMemo(() => {
    if (selectedBatchId === 'all' || !selectedBatch) return students;
    const cleanSelectedBatchName = selectedBatch.name.trim().toLowerCase();
    return students.filter(s => {
      const studentBatch = (s.batch_number || s.batch_name || s.batch || '').trim().toLowerCase();
      return studentBatch === cleanSelectedBatchName || studentBatch === selectedBatch.id.toLowerCase();
    });
  }, [students, selectedBatchId, selectedBatch]);

  // Metrics for batch
  const totalStudentsCount = batchStudents.length;
  
  const presentCount = useMemo(() => {
    return batchStudents.filter(s => {
      const log = presentStudentMap.get(s.id) || presentStudentMap.get(s.email?.toLowerCase());
      if (!log) return false;
      const duration = Number(log.duration_minutes) || 0;
      return duration >= 5 || log.status === 'Present' || log.attendance_type === 'Offline_QR' || log.attendance_type === 'Manual';
    }).length;
  }, [batchStudents, presentStudentMap]);

  const pendingCount = useMemo(() => {
    return batchStudents.filter(s => {
      const log = presentStudentMap.get(s.id) || presentStudentMap.get(s.email?.toLowerCase());
      if (!log) return false;
      const duration = Number(log.duration_minutes) || 0;
      return duration > 0 && duration < 5 && log.status !== 'Present' && log.attendance_type !== 'Offline_QR' && log.attendance_type !== 'Manual';
    }).length;
  }, [batchStudents, presentStudentMap]);

  const absentCount = Math.max(0, totalStudentsCount - presentCount - pendingCount);
  const presentPercentage = totalStudentsCount > 0 ? Math.round((presentCount / totalStudentsCount) * 100) : 0;

  // Filtered student list for search & status tabs
  const filteredStudents = useMemo(() => {
    return batchStudents.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const log = presentStudentMap.get(s.id) || presentStudentMap.get(s.email?.toLowerCase());
      const duration = Number(log?.duration_minutes) || 0;
      const isPresent = log && (duration >= 5 || log.status === 'Present' || log.attendance_type === 'Offline_QR' || log.attendance_type === 'Manual');
      const isPending = log && duration > 0 && duration < 5 && !isPresent;
      const isAbsent = !isPresent && !isPending;

      if (filterStatus === 'present') return matchesSearch && isPresent;
      if (filterStatus === 'pending') return matchesSearch && isPending;
      if (filterStatus === 'absent') return matchesSearch && isAbsent;
      return matchesSearch;
    });
  }, [batchStudents, searchQuery, filterStatus, presentStudentMap]);

  const meetUrl = activeClass 
    ? `https://meet.google.com/cnx-${activeClass.id.substring(0, 8)}`
    : `https://meet.google.com/cnx-${selectedBatch?.name?.toLowerCase().replace(/\s+/g, '-') || 'live'}`;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3 whitespace-nowrap">
            <Users className="w-8 h-8 text-blue-500 shrink-0" /> 
            <span>Batch Attendance System</span>
          </h1>
          <p className="text-xs text-erp-text/60 font-medium mt-1">
            Manage Online (5-min threshold), Offline (QR Code), & Hybrid attendance in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/teacher')} variant="secondary" size="md">
            Back to Portal
          </Button>
        </div>
      </div>

      {/* Active Batch & Class Control Card */}
      <Card className="bg-erp-surface border-erp-border p-5 mb-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Batch Focus
            </span>

            {/* Mode Badge */}
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border flex items-center gap-1 ${
              batchMode === 'Online'
                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                : batchMode === 'Offline'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-purple-500/10 text-purple-500 border-purple-500/30'
            }`}>
              {batchMode === 'Online' ? <Laptop className="w-3 h-3" /> : batchMode === 'Offline' ? <MapPin className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {batchMode} Mode
            </span>

            {activeClass?.status && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Class: {activeClass.status}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-erp-text/70 font-medium text-sm animate-pulse">Loading batch and class session...</p>
          ) : (
            <div className="min-w-0">
              <h2 className="text-xl font-black text-erp-text truncate flex items-center gap-2">
                {selectedBatch ? selectedBatch.name : 'All Batches'}
                {selectedBatch?.course_name && (
                  <span className="text-xs font-bold text-erp-text/60">({selectedBatch.course_name})</span>
                )}
              </h2>
              <p className="text-xs text-erp-text/60 font-medium truncate mt-0.5">
                Active Session: <span className="font-bold text-erp-text">{activeClass?.title || 'General Batch Session'}</span>
                {selectedBatch?.timing && ` • Timing: ${selectedBatch.timing}`}
              </p>
            </div>
          )}
        </div>

        {/* Dropdowns & DB Sync Button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Batch Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-erp-text/60 hidden sm:inline">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => handleSelectBatch(e.target.value)}
              className="bg-erp-background border border-erp-border text-erp-text font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.mode || 'Hybrid'})
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          {availableClasses.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-erp-text/60 hidden sm:inline">Class:</span>
              <select
                value={activeClass?.id || ''}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="bg-erp-background border border-erp-border text-erp-text font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
              >
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button 
            onClick={() => syncAttendanceFromDB(activeClass?.id || 'default', selectedBatch?.name)} 
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 font-bold"
            disabled={syncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync DB
          </Button>
        </div>
      </Card>

      {/* Sync & Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Batch Enrolled</p>
            <h3 className="text-2xl font-black text-erp-text mt-0.5">{totalStudentsCount}</h3>
          </div>
        </Card>

        <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Present (&gt;=5m / QR)</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-0.5">{presentCount}</h3>
          </div>
        </Card>

        <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Pending (&lt;5m)</p>
            <h3 className="text-2xl font-black text-amber-500 mt-0.5">{pendingCount}</h3>
          </div>
        </Card>

        <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xl shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Attendance Rate</p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-purple-500">{presentPercentage}%</h3>
              {lastSyncedTime && (
                <span className="text-[10px] font-mono text-erp-text/50 truncate">
                  Synced {lastSyncedTime}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Attendance Mode Options Grid (Online 5-Min Rule & Offline QR Code) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Offline Attendance (QR Code) Card */}
        <Card className={`bg-erp-surface border-erp-border flex flex-col items-center p-6 md:p-8 text-center shadow-sm relative ${batchMode === 'Online' ? 'opacity-70' : ''}`}>
          {batchMode === 'Online' && (
            <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/20">
              Batch is Online Mode
            </div>
          )}
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-display text-erp-text mb-1">Offline QR Attendance</h2>
          <p className="text-xs text-erp-text/60 mb-5 max-w-sm">
            Project this QR code on the classroom screen for offline students to scan via their portal.
          </p>
          
          <div className="bg-white dark:bg-black p-4 rounded-2xl border-4 border-slate-200 dark:border-white/10 mb-5 flex flex-col items-center justify-center shadow-inner">
            {qrData ? (
              <>
                <QRCodeSVG 
                  value={JSON.stringify({ classId: activeClass?.id || selectedBatch?.id || 'batch_session', token: qrData.qrCode })} 
                  size={160} 
                  level="H" 
                />
                <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px] mt-3 flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-3 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Expires: {new Date(qrData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </>
            ) : (
              <div className="w-40 h-40 bg-slate-100 dark:bg-zinc-900/50 flex flex-col items-center justify-center rounded-xl text-slate-400">
                <QrCode className="w-10 h-10 mb-2" />
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Click below to project QR</span>
              </div>
            )}
          </div>
          
          <Button className="w-full font-bold py-2.5 text-sm" onClick={handleGenerateQR}>
            {qrData ? 'Regenerate Classroom QR' : 'Generate Classroom QR Code'}
          </Button>
        </Card>

        {/* Online Attendance (5-Min Threshold Rule & Live Meet) Card */}
        <Card className={`bg-erp-surface border-erp-border flex flex-col items-center p-6 md:p-8 text-center shadow-sm relative ${batchMode === 'Offline' ? 'opacity-70' : ''}`}>
          {batchMode === 'Offline' && (
            <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/20">
              Batch is Offline Mode
            </div>
          )}
          <div className="w-14 h-14 bg-cyan-500/10 text-cyan-500 rounded-2xl flex items-center justify-center mb-4 shrink-0">
            <Video className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-display text-erp-text mb-1">Online Attendance (5-Min Rule)</h2>
          <p className="text-xs text-erp-text/60 mb-5 max-w-sm">
            Share this live class link. Students staying in class for <span className="font-black text-cyan-500">at least 5 minutes</span> are automatically marked PRESENT.
          </p>
          
          <div className="w-full flex items-center gap-2 bg-erp-background border border-erp-border p-3 rounded-xl mb-5 text-left">
            <div className="flex-1 font-mono text-xs text-erp-text/90 truncate">
              {meetUrl}
            </div>
            <Button 
              variant="ghost" 
              onClick={handleCopyMeetLink} 
              className="p-2 h-auto text-blue-500 hover:bg-blue-500/10" 
            >
              {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-cyan-500 hover:bg-cyan-500/10 font-bold text-xs flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex-1 flex flex-col justify-end w-full">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-cyan-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-cyan-500 block">5-Minute Automated Rule Active</span>
                <span className="text-erp-text/60 text-[11px]">System tracks stay duration every 30s. Automatically commits to Turso DB at 5 minutes.</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* Enrolled Students & Live Duration Status Roster */}
      <div className="mt-4">
        <Card className="bg-erp-surface border-erp-border p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-erp-text flex items-center gap-2">
                Batch Student Roster
                <span className="text-xs bg-erp-background border border-erp-border px-2.5 py-1 rounded-full text-erp-text/70 font-mono font-bold">
                  {filteredStudents.length} / {totalStudentsCount} Students
                </span>
              </h2>
              <p className="text-xs text-erp-text/60 mt-1">
                Real-time duration tracking (&gt;= 5 min = Present), QR scans, and manual attendance controls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-erp-text/40" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-erp-background border border-erp-border rounded-xl text-erp-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-erp-background border border-erp-border rounded-xl p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-blue-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('present')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${filterStatus === 'present' ? 'bg-emerald-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  Pending (&lt;5m)
                </button>
                <button
                  onClick={() => setFilterStatus('absent')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${filterStatus === 'absent' ? 'bg-red-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  Absent
                </button>
              </div>

              <Button onClick={handleMarkAllPresent} variant="secondary" size="sm" className="font-bold text-xs">
                Mark Roster Present
              </Button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-xl border border-erp-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-erp-background/80 text-[11px] font-black text-erp-text/60 uppercase tracking-wider border-b border-erp-border">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Class Stay Duration</th>
                  <th className="py-3 px-4">Check-In Type</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-erp-border text-xs font-medium text-erp-text">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-erp-text/50 font-bold">
                      No students found for the selected batch/filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const log = presentStudentMap.get(student.id) || presentStudentMap.get(student.email?.toLowerCase());
                    const durationMins = Number(log?.duration_minutes) || 0;
                    const isPresent = log && (durationMins >= 5 || log.status === 'Present' || log.attendance_type === 'Offline_QR' || log.attendance_type === 'Manual');
                    const isPending = log && durationMins > 0 && durationMins < 5 && !isPresent;
                    const attType = log?.attendance_type || (isPresent ? 'Manual' : '-');

                    return (
                      <tr key={student.id} className="hover:bg-erp-background/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-erp-text">{student.name || 'Unnamed Student'}</div>
                          <div className="text-[10px] text-erp-text/50">{student.email || student.student_code || 'No email'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold text-[10px]">
                            {student.batch_number || selectedBatch?.name || 'Global'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {durationMins > 0 ? (
                            <span className={durationMins >= 5 ? 'text-emerald-500 flex items-center gap-1' : 'text-amber-500 flex items-center gap-1'}>
                              <Clock className="w-3.5 h-3.5" />
                              {durationMins} min {durationMins >= 5 ? '✓ (>=5m Threshold Passed)' : '⏳ (Needs 5m)'}
                            </span>
                          ) : (
                            <span className="text-erp-text/40">0 min</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-erp-background border border-erp-border">
                            {attType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <UserCheck className="w-3.5 h-3.5" /> Present
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" /> Pending ({5 - durationMins}m left)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                              <UserX className="w-3.5 h-3.5" /> Absent
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPresent ? (
                            <Button
                              onClick={() => handleMarkAbsent(student.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:bg-red-500/10 font-bold px-2 py-1"
                            >
                              Mark Absent
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleMarkPresent(student.id)}
                              variant="secondary"
                              size="sm"
                              className="text-xs text-emerald-500 hover:bg-emerald-500/10 font-bold px-2.5 py-1"
                            >
                              Mark Present
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
