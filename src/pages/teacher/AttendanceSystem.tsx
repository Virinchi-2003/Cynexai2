import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { QrCode, Video, Users, CheckCircle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { getActiveLiveClass, logAttendance } from '../../lib/api/teacher';
import { generateQRAttendance, QRCodeResult } from '../../lib/api/ux';
import { QRCodeSVG } from 'qrcode.react';

export default function AttendanceSystem() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeClass, setActiveClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QRCodeResult | null>(null);

  useEffect(() => {
    async function fetchClass() {
      if (!user) return;
      try {
        setLoading(true);
        const cls = await getActiveLiveClass(user.id);
        
        if (cls) {
          setActiveClass(cls);
          

          const { getUsers } = await import('../../lib/api/users');
          const allUsers = await getUsers();
          setStudents(allUsers.filter((u: any) => u.role === 'Student'));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchClass();
  }, [user]);

  const handleGenerateQR = async () => {
    if (!activeClass) return;
    try {
      const data = await generateQRAttendance(activeClass.id);
      setQrData(data);
    } catch (e) {
      console.error('Error generating QR', e);
    }
  };

  const handleManualCheckIn = async (studentId: string) => {
    if (!activeClass) return;
    try {
      await logAttendance(studentId, activeClass.id);
      alert('Student marked as present!');
    } catch(e) {
      console.error(e);
      alert('Failed to check in student.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" /> Attendance System
          </h1>
          {loading ? (
            <p className="text-erp-text/70 font-medium mt-1 animate-pulse">Loading active class...</p>
          ) : activeClass ? (
            <p className="text-erp-text/70 font-medium mt-1">
              {activeClass.module_title} • {activeClass.title}
            </p>
          ) : (
            <p className="text-erp-text/70 font-medium mt-1 text-orange-500">
              No active classes found for attendance.
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/teacher')} variant="secondary">Back to Portal</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Offline Attendance (QR) */}
        <Card className="bg-erp-surface border-erp-border flex flex-col items-center p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-erp-text mb-2">Offline Attendance</h2>
          <p className="text-erp-text/60 mb-8">Project this QR code on the screen for students in the classroom to scan.</p>
          
          <div className="bg-white p-4 rounded-xl border-4 border-slate-200 mb-6 flex flex-col items-center justify-center">
            {qrData ? (
              <>
                <QRCodeSVG 
                  value={JSON.stringify({ classId: activeClass.id, token: qrData.qrCode })} 
                  size={160} 
                  level="H" 
                />
                <div className="text-slate-500 font-mono text-[10px] mt-4">
                  Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="w-40 h-40 bg-slate-100 flex items-center justify-center rounded">
                <QrCode className="w-10 h-10 text-slate-300" />
              </div>
            )}
          </div>
          
          <Button className="w-full" disabled={!activeClass} onClick={handleGenerateQR}>
            {qrData ? 'Regenerate QR Code' : 'Generate QR Code'}
          </Button>
        </Card>

        {/* Online Attendance (Meet Link) */}
        <Card className="bg-erp-surface border-erp-border flex flex-col items-center p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-erp-text mb-2">Online Attendance</h2>
          <p className="text-erp-text/60 mb-8">Share this Google Meet link. Attendance is tracked automatically.</p>
          
          <div className="w-full flex items-center gap-2 bg-erp-background border border-erp-border p-3 rounded-lg mb-6 text-left">
            <div className="flex-1 font-mono text-sm text-erp-text/80 truncate">
              {activeClass ? `meet.google.com/cnx-${activeClass.id.substring(0,6)}` : 'No active class link'}
            </div>
            <Button variant="ghost" className="p-2 h-auto text-erp-secondary" disabled={!activeClass}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col justify-end w-full">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
              <div className="text-left text-sm">
                <span className="font-bold text-green-400 block">Auto-Tracking Active</span>
                <span className="text-erp-text/60">Students joining via portal are marked present.</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

      <div className="mt-8">
        <Card className="bg-erp-surface border-erp-border p-6">
          <h2 className="text-xl font-bold font-display text-erp-text mb-4">Enrolled Students</h2>
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <div key={student.id} className="bg-erp-background border border-erp-border p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-erp-text">{student.name}</h3>
                    <p className="text-xs text-erp-text/60">{student.email}</p>
                  </div>
                  <Button size="sm" onClick={() => handleManualCheckIn(student.id)} disabled={!activeClass}>
                    Check In
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-erp-text/60">No students enrolled yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
