import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { QrCode, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getCurrentUser } from '../../lib/auth';
import { logAttendance } from '../../lib/api/teacher';

export default function AttendancePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!scanning) return;

    // Start scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        // Stop scanner immediately after a scan
        scanner.clear();
        setScanning(false);
        
        try {
          const data = JSON.parse(decodedText);
          if (data.classId && user) {
            await logAttendance(user.id, data.classId);
            setResult({ success: true, message: 'Successfully marked attendance!' });
          } else {
            setResult({ success: false, message: 'Invalid QR code format.' });
          }
        } catch (e) {
          console.error(e);
          setResult({ success: false, message: 'Failed to read QR code. Please try again.' });
        }
      },
      (error) => {
        // ignore continuous scanning errors
      }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [scanning, user]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 h-auto text-erp-text/60">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <QrCode className="w-8 h-8 text-blue-500" /> Mark Attendance
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Scan the QR code projected by your teacher.</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full">
          <Card className="bg-erp-surface border-erp-border p-6 shadow-md flex flex-col items-center">
            
            {result && (
              <div className={`w-full p-4 mb-6 rounded-xl flex items-center gap-3 border ${result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {result.success ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                <p className="font-bold">{result.message}</p>
              </div>
            )}

            {!scanning ? (
              <div className="w-full text-center py-8">
                <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold font-display text-erp-text mb-2">Offline Check-In</h2>
                <p className="text-erp-text/60 mb-8">Make sure your camera is allowed.</p>
                <Button 
                  onClick={() => {
                    setResult(null);
                    setScanning(true);
                  }} 
                  className="w-full max-w-xs mx-auto py-3 font-bold"
                >
                  Start Scanner
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-erp-text">Scan QR Code</h3>
                  <Button variant="secondary" onClick={() => setScanning(false)} size="sm">Cancel</Button>
                </div>
                <div className="rounded-xl overflow-hidden border-4 border-slate-200 bg-black">
                  <div id="qr-reader" className="w-full"></div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
