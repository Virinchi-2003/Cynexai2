import React, { useState } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Calendar, Clock, AlertTriangle, Plus, X } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];

interface Session {
  id: string;
  day: string;
  time: string;
  module: string;
  teacher: string;
  room: string;
}

export default function TimetableManager() {
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', day: 'Monday', time: '11:00 AM', module: 'HTML/CSS (M1)', teacher: 'Sarah Jenkins', room: 'Virtual A' },
    { id: '2', day: 'Monday', time: '02:00 PM', module: 'Python Core (M1)', teacher: 'Dr. Alan Math', room: 'Virtual B' },
    { id: '3', day: 'Wednesday', time: '09:00 AM', module: 'JavaScript (M2)', teacher: 'Sarah Jenkins', room: 'Virtual A' },
  ]);

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState<Partial<Session>>({
    day: 'Monday',
    time: '09:00 AM',
    module: '',
    teacher: '',
    room: ''
  });

  const checkConflicts = (newSess: Partial<Session>) => {
    const existing = sessions.find(s => 
      s.day === newSess.day && 
      s.time === newSess.time && 
      (s.teacher === newSess.teacher || s.room === newSess.room)
    );
    if (existing) {
      if (existing.teacher === newSess.teacher) return `Teacher ${newSess.teacher} is already booked at this time.`;
      if (existing.room === newSess.room) return `Room ${newSess.room} is already booked at this time.`;
    }
    return null;
  };

  const handleAddSession = () => {
    if (!newSession.module || !newSession.teacher || !newSession.room) {
      alert("Fill all fields");
      return;
    }
    const conflict = checkConflicts(newSession);
    if (conflict) {
      setConflicts([...conflicts, conflict]);
      return;
    }
    setSessions([...sessions, { ...newSession, id: Date.now().toString() } as Session]);
    setIsModalOpen(false);
    setNewSession({ day: 'Monday', time: '09:00 AM', module: '', teacher: '', room: '' });
  };

  const removeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background relative">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Calendar className="w-8 h-8 text-erp-primary" /> Timetable Engine
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage rolling batch schedules and detect conflicts</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Schedule Class
          </Button>
        </div>

        {conflicts.length > 0 && (
          <Card className="bg-red-500/10 border-red-500 mb-6">
            <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
              <AlertTriangle className="w-5 h-5" /> Conflicts Detected
            </div>
            <ul className="list-disc pl-5 text-red-400 text-sm font-medium">
              {conflicts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <Button variant="ghost" onClick={() => setConflicts([])} className="text-red-400 hover:bg-red-500/20 mt-2 px-3 py-1 h-auto text-xs">Clear Warnings</Button>
          </Card>
        )}

        <div className="bg-erp-surface rounded-xl border border-erp-border overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-erp-border bg-erp-background">
                <th className="p-4 font-bold text-erp-text/70 w-32 border-r border-erp-border"><Clock className="w-5 h-5" /></th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 font-bold text-erp-text text-center border-r border-erp-border last:border-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className="border-b border-erp-border last:border-0">
                  <td className="p-4 font-bold text-sm text-erp-text/70 border-r border-erp-border align-top">{time}</td>
                  {DAYS.map(day => {
                    const session = sessions.find(s => s.day === day && s.time === time);
                    return (
                      <td key={day} className="p-2 border-r border-erp-border last:border-0 min-h-[100px] align-top relative group">
                        {session ? (
                          <div className="bg-erp-primary/10 border border-erp-primary/30 p-2 rounded-lg relative">
                            <button onClick={() => removeSession(session.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-erp-secondary hover:text-red-400 bg-erp-surface rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                            <p className="font-bold text-xs text-erp-primary mb-1 leading-tight">{session.module}</p>
                            <p className="text-[10px] text-erp-text/70 font-medium">{session.teacher}</p>
                            <p className="text-[10px] text-erp-text/50">{session.room}</p>
                          </div>
                        ) : (
                          <div className="h-full w-full min-h-[60px] border-2 border-dashed border-transparent group-hover:border-erp-border rounded-lg transition-colors cursor-pointer" onClick={() => { setNewSession({...newSession, day, time}); setIsModalOpen(true); }}></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-erp-surface">
            <h2 className="text-xl font-bold font-display text-erp-text mb-4">Schedule Class</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Day</label>
                <select className="w-full bg-erp-background border-2 border-erp-border rounded-xl p-3 text-erp-text" value={newSession.day} onChange={e => setNewSession({...newSession, day: e.target.value})}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Time</label>
                <select className="w-full bg-erp-background border-2 border-erp-border rounded-xl p-3 text-erp-text" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})}>
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Module</label>
                <input className="w-full bg-erp-background border-2 border-erp-border rounded-xl p-3 text-erp-text" placeholder="e.g. React Basics (M3)" value={newSession.module} onChange={e => setNewSession({...newSession, module: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Teacher</label>
                <input className="w-full bg-erp-background border-2 border-erp-border rounded-xl p-3 text-erp-text" placeholder="Teacher Name" value={newSession.teacher} onChange={e => setNewSession({...newSession, teacher: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Room</label>
                <input className="w-full bg-erp-background border-2 border-erp-border rounded-xl p-3 text-erp-text" placeholder="e.g. Virtual A, Room 101" value={newSession.room} onChange={e => setNewSession({...newSession, room: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddSession} className="flex-1">Save Class</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
