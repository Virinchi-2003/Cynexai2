import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { QrCode, ArrowLeft, CheckCircle, AlertCircle, Key, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getCurrentUser } from '../../lib/auth';
import { getStudentMode } from '../../lib/api/student';
import { logQRAttendance, logAttendance } from '../../lib/api/teacher';

export default function AttendancePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [studentMode, setStudentMode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getStudentMode(user.id).then(mode => setStudentMode(mode));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!scanning) return;

    let scanner: Html5QrcodeScanner | null = null;
    let mounted = true;

    const timer = setTimeout(() => {
      if (!mounted) return;
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          if (scanner) {
            scanner.clear();
          }
          setScanning(false);
          
          try {
            let classId = decodedText;
            try {
              const data = JSON.parse(decodedText);
              classId = data.classId || data.token || decodedText;
            } catch (e) {}

            if (classId && user) {
              await logQRAttendance(user.id, classId);
              setResult({ success: true, message: 'Successfully marked offline QR attendance!' });
            } else {
              setResult({ success: false, message: 'Invalid QR code format.' });
            }
          } catch (e) {
            console.error(e);
            setResult({ success: false, message: 'Failed to record attendance. Please try again.' });
          }
        },
        () => {}
      );
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [scanning, user?.id]);

  const handleManualCheckIn = async () => {
    if (!manualCode.trim() || !user) return;
    setSubmittingManual(true);
    setResult(null);

    try {
      await logQRAttendance(user.id, manualCode.trim());
      setResult({ success: true, message: 'Attendance marked successfully via session code!' });
      setManualCode('');
    } catch (e) {
      setResult({ success: false, message: 'Failed to check in. Please check session code.' });
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-16 sm:pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 h-auto text-erp-text/60">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <QrCode className="w-8 h-8 text-blue-500" /> Offline & Hybrid Check-In
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Scan classroom QR code or enter session check-in token.</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full space-y-6">
          <Card className="bg-erp-surface border-erp-border p-6 shadow-md flex flex-col items-center">
            
            {result && (
              <div className={`w-full p-4 mb-6 rounded-xl flex items-center gap-3 border ${result.success ? 'bg-green-50 border-green-200 text-green-700 dark:text-white' : 'bg-red-50 border-red-200 text-red-700 dark:text-white'}`}>
                {result.success ? <CheckCircle className="w-6 h-6 shrink-0 text-emerald-500" /> : <AlertCircle className="w-6 h-6 shrink-0 text-red-500" />}
                <p className="font-bold text-sm">{result.message}</p>
              </div>
            )}

            {!scanning ? (
              <div className="w-full text-center py-4">
                <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold font-display text-erp-text mb-1">Classroom QR Check-In</h2>
                <p className="text-erp-text/60 mb-6 text-sm">Scan the QR code projected on classroom screen.</p>
                <Button 
                  onClick={() => {
                    setResult(null);
                    setScanning(true);
                  }} 
                  className="w-full max-w-xs mx-auto py-3 font-bold"
                >
                  Start Camera Scanner
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-erp-text text-sm">Scan Classroom QR Code</h3>
                  <Button variant="secondary" onClick={() => setScanning(false)} size="sm">Cancel</Button>
                </div>
                <div className="rounded-xl overflow-hidden border-4 border-slate-200 dark:border-white/10 bg-black">
                  <div id="qr-reader" className="w-full"></div>
                </div>
              </div>
            )}
          </Card>

          {/* Manual Token Check-In */}
          <Card className="bg-erp-surface border-erp-border p-6 shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-erp-text/70 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-500" /> Manual Session Token Input
            </h3>
            <p className="text-xs text-erp-text/60 mb-4">If camera scanning is unavailable, enter the session code displayed by your teacher.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. class_123 or session_token..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
                className="flex-1 bg-erp-background border border-erp-border px-4 py-2.5 rounded-xl text-erp-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button onClick={handleManualCheckIn} disabled={!manualCode.trim() || submittingManual} className="font-bold flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Check In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
