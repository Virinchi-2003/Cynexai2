import React from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { QrCode, Video, Users, CheckCircle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceSystem() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" /> Attendance System
          </h1>
          <p className="text-erp-text/70 font-medium mt-1">Data Foundations A • Today, 10:00 AM</p>
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
          
          <div className="bg-white p-4 rounded-xl border-4 border-slate-200 mb-6 w-48 h-48 flex items-center justify-center">
            {/* Fake QR Code using CSS grid */}
            <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1">
              {[...Array(25)].map((_, i) => (
                <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'} rounded-sm`}></div>
              ))}
            </div>
          </div>
          
          <Button className="w-full">Regenerate QR Code</Button>
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
              meet.google.com/abc-defg-hij
            </div>
            <Button variant="ghost" className="p-2 h-auto text-erp-secondary">
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
    </div>
  );
}
