import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { 
  QrCode, Video, Users, CheckCircle, Copy, ExternalLink, 
  RefreshCw, Search, UserCheck, UserX, Clock, Sparkles, ShieldCheck 
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
import { generateQRAttendance, QRCodeResult } from '../../lib/api/ux';
import { QRCodeSVG } from 'qrcode.react';

export default function AttendanceSystem() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const userId = user?.id;

  const [activeClass, setActiveClass] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [qrData, setQrData] = useState<QRCodeResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Sync live attendance logs from database for the given classId
  const syncAttendanceFromDB = useCallback(async (classId: string) => {
    if (!classId) return;
    try {
      setSyncing(true);
      const logs = await getLiveAttendance(classId);
      setLiveLogs(logs || []);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Error syncing live attendance:', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Initial load of classes and student list
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load active class & available classes
        const [primaryClass, classList, usersModule] = await Promise.all([
          getActiveLiveClass(userId),
          getAllAvailableClasses(),
          import('../../lib/api/users')
        ]);

        if (!isMounted) return;

        setAvailableClasses(classList || []);
        
        const currentClass = primaryClass || (classList && classList.length > 0 ? classList[0] : null);
        setActiveClass(currentClass);

        // Load all students
        const allUsers = await usersModule.getUsers();
        if (isMounted) {
          setStudents((allUsers || []).filter((u: any) => u.role === 'Student'));
        }

        if (currentClass?.id) {
          await syncAttendanceFromDB(currentClass.id);
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

  // Periodic silent polling every 8s for real-time DB sync
  useEffect(() => {
    if (!activeClass?.id) return;
    const interval = setInterval(() => {
      syncAttendanceFromDB(activeClass.id);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeClass?.id, syncAttendanceFromDB]);

  // Handle switching selected class
  const handleSelectClass = async (classId: string) => {
    const selected = availableClasses.find(c => c.id === classId) || activeClass;
    if (selected) {
      setActiveClass(selected);
      setQrData(null);
      await syncAttendanceFromDB(selected.id);
    }
  };

  const handleGenerateQR = async () => {
    if (!activeClass?.id) return;
    try {
      const data = await generateQRAttendance(activeClass.id);
      setQrData(data);
    } catch (e) {
      console.error('Error generating QR:', e);
    }
  };

  const handleMarkPresent = async (studentId: string) => {
    if (!activeClass?.id) return;
    try {
      await logAttendance(studentId, activeClass.id);
      await syncAttendanceFromDB(activeClass.id);
    } catch (e) {
      console.error('Failed to mark present:', e);
      alert('Failed to update attendance in database.');
    }
  };

  const handleMarkAbsent = async (studentId: string) => {
    if (!activeClass?.id) return;
    try {
      await removeAttendance(studentId, activeClass.id);
      await syncAttendanceFromDB(activeClass.id);
    } catch (e) {
      console.error('Failed to mark absent:', e);
      alert('Failed to update attendance in database.');
    }
  };

  const handleMarkAllPresent = async () => {
    if (!activeClass?.id || students.length === 0) return;
    try {
      setSyncing(true);
      const absentStudents = students.filter(s => !presentStudentMap.has(s.id));
      await Promise.all(absentStudents.map(s => logAttendance(s.id, activeClass.id)));
      await syncAttendanceFromDB(activeClass.id);
    } catch (e) {
      console.error('Failed to mark all present:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyMeetLink = () => {
    if (!activeClass?.id) return;
    const link = `https://meet.google.com/cnx-${activeClass.id.substring(0, 8)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Map of present student IDs to check-in metadata
  const presentStudentMap = useMemo(() => {
    const map = new Map<string, any>();
    liveLogs.forEach(log => {
      if (log.student_id) {
        map.set(log.student_id, log);
      }
    });
    return map;
  }, [liveLogs]);

  // Attendance metrics
  const totalStudentsCount = students.length;
  const presentCount = students.filter(s => presentStudentMap.has(s.id)).length;
  const absentCount = Math.max(0, totalStudentsCount - presentCount);
  const presentPercentage = totalStudentsCount > 0 ? Math.round((presentCount / totalStudentsCount) * 100) : 0;

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const isPresent = presentStudentMap.has(s.id);
      if (filterStatus === 'present') return matchesSearch && isPresent;
      if (filterStatus === 'absent') return matchesSearch && !isPresent;
      return matchesSearch;
    });
  }, [students, searchQuery, filterStatus, presentStudentMap]);

  const meetUrl = activeClass ? `https://meet.google.com/cnx-${activeClass.id.substring(0, 8)}` : '';

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3 whitespace-nowrap">
            <Users className="w-8 h-8 text-blue-500 shrink-0" /> 
            <span>Attendance System</span>
          </h1>
        </div>
        <Button onClick={() => navigate('/teacher')} variant="secondary" size="md">
          Back to Portal
        </Button>
      </div>

      {/* Active Class Control Card */}
      <Card className="bg-erp-surface border-erp-border p-5 mb-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Active Class
            </span>
            {activeClass?.status && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {activeClass.status}
              </span>
            )}
          </div>
          {loading ? (
            <p className="text-erp-text/70 font-medium text-sm animate-pulse">Loading class session...</p>
          ) : activeClass ? (
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-erp-text truncate">
                {activeClass.title}
              </h2>
              {activeClass.module_title && (
                <p className="text-xs text-erp-text/60 font-medium truncate">
                  Module: {activeClass.module_title}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-amber-500">No active classes found.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {availableClasses.length > 0 && (
            <select
              value={activeClass?.id || ''}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="bg-erp-background border border-erp-border text-erp-text font-medium rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.module_title ? `${c.module_title}: ` : ''}{c.title}
                </option>
              ))}
            </select>
          )}

          <Button 
            onClick={() => activeClass?.id && syncAttendanceFromDB(activeClass.id)} 
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
            disabled={syncing || !activeClass}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync DB
          </Button>
        </div>
      </Card>

      {/* Sync & Stats Banner */}
      {activeClass && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Enrolled Students</p>
              <h3 className="text-2xl font-black text-erp-text mt-0.5">{totalStudentsCount}</h3>
            </div>
          </Card>

          <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xl shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Present</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-0.5">{presentCount}</h3>
            </div>
          </Card>

          <Card className="bg-erp-surface border-erp-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-erp-text/60 uppercase tracking-wider">Absent</p>
              <h3 className="text-2xl font-black text-amber-500 mt-0.5">{absentCount}</h3>
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
      )}

      {/* Main Attendance Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Offline Attendance (QR) */}
        <Card className="bg-erp-surface border-erp-border flex flex-col items-center p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shrink-0">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-erp-text mb-2">Offline Attendance</h2>
          <p className="text-erp-text/60 mb-6 max-w-sm">Project this QR code on the classroom screen for students to scan via their portal.</p>
          
          <div className="bg-white dark:bg-black p-5 rounded-2xl border-4 border-slate-200 dark:border-white/10 mb-6 flex flex-col items-center justify-center shadow-inner">
            {qrData && activeClass ? (
              <>
                <QRCodeSVG 
                  value={JSON.stringify({ classId: activeClass.id, token: qrData.qrCode })} 
                  size={180} 
                  level="H" 
                />
                <div className="text-slate-500 dark:text-zinc-400 font-mono text-xs mt-4 flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Expires: {new Date(qrData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </>
            ) : (
              <div className="w-44 h-44 bg-slate-100 dark:bg-zinc-900/50 flex flex-col items-center justify-center rounded-xl text-slate-400">
                <QrCode className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">Click below to display QR</span>
              </div>
            )}
          </div>
          
          <Button className="w-full font-bold py-3" disabled={!activeClass} onClick={handleGenerateQR}>
            {qrData ? 'Regenerate QR Code' : 'Generate QR Code'}
          </Button>
        </Card>

        {/* Online Attendance (Meet Link) */}
        <Card className="bg-erp-surface border-erp-border flex flex-col items-center p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shrink-0">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-erp-text mb-2">Online Attendance</h2>
          <p className="text-erp-text/60 mb-6 max-w-sm">Share this Google Meet link with online students. Attendance is automatically logged upon joining.</p>
          
          <div className="w-full flex items-center gap-2 bg-erp-background border border-erp-border p-3.5 rounded-xl mb-6 text-left">
            <div className="flex-1 font-mono text-sm text-erp-text/90 truncate">
              {activeClass ? `meet.google.com/cnx-${activeClass.id.substring(0, 8)}` : 'No active class link'}
            </div>
            <Button 
              variant="ghost" 
              onClick={handleCopyMeetLink} 
              className="p-2.5 h-auto text-blue-500 hover:bg-blue-500/10" 
              disabled={!activeClass}
            >
              {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            {activeClass && (
              <a
                href={meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-end w-full">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-left">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
              <div className="text-sm">
                <span className="font-bold text-emerald-500 block">Database Auto-Sync Active</span>
                <span className="text-erp-text/60 text-xs">Students joining live session via student portal are marked present in real time.</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* Enrolled Students & Manual Check-in Section */}
      <div className="mt-4">
        <Card className="bg-erp-surface border-erp-border p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-erp-text flex items-center gap-2">
                Enrolled Students Roster
                <span className="text-xs bg-erp-background border border-erp-border px-2.5 py-1 rounded-full text-erp-text/70 font-mono">
                  {filteredStudents.length} / {totalStudentsCount}
                </span>
              </h2>
              <p className="text-xs text-erp-text/60 mt-1">Manage individual student attendance or mark the entire roster present.</p>
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
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-erp-background border border-erp-border rounded-xl text-erp-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-erp-background border border-erp-border rounded-xl p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-blue-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('present')}
                  className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'present' ? 'bg-emerald-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setFilterStatus('absent')}
                  className={`px-3 py-1 rounded-lg transition-colors ${filterStatus === 'absent' ? 'bg-amber-500 text-white' : 'text-erp-text/70 hover:text-erp-text'}`}
                >
                  Absent ({absentCount})
                </button>
              </div>

              {/* Mark All Present button */}
              <Button
                size="sm"
                onClick={handleMarkAllPresent}
                disabled={!activeClass || absentCount === 0 || syncing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Mark All Present
              </Button>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => {
                const log = presentStudentMap.get(student.id);
                const isPresent = Boolean(log);

                return (
                  <div 
                    key={student.id} 
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isPresent 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-erp-background border-erp-border'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-erp-text truncate">{student.name}</h3>
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                            <CheckCircle className="w-3 h-3" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 shrink-0">
                            Absent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-erp-text/60 truncate mt-0.5">{student.email}</p>
                      {isPresent && log?.join_time && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                          Checked in at {new Date(log.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    <div>
                      {isPresent ? (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleMarkAbsent(student.id)} 
                          disabled={!activeClass || syncing}
                          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          Unmark
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkPresent(student.id)} 
                          disabled={!activeClass || syncing}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-erp-background rounded-xl border border-dashed border-erp-border">
              <Users className="w-10 h-10 text-erp-text/30 mx-auto mb-2" />
              <p className="text-erp-text/60 font-medium">No students match your filter criteria.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Live Attendance History Stream */}
      {liveLogs.length > 0 && (
        <div className="mt-8">
          <Card className="bg-erp-surface border-erp-border p-6 shadow-sm">
            <h2 className="text-lg font-bold font-display text-erp-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Attendance Check-Ins
            </h2>
            <div className="divide-y divide-erp-border">
              {liveLogs.slice(0, 10).map((log, idx) => (
                <div key={log.id || idx} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-erp-text">{log.student_name || 'Student'}</p>
                      <p className="text-xs text-erp-text/60">{log.student_email || log.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-erp-text/70 block">
                      {log.join_time ? new Date(log.join_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase">Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
