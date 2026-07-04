import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { Video, BookOpen, Users, Calendar, Play, Clock, ChevronRight, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../lib/turso';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Hardcoded timetable slots – can later be stored in DB
const TIMETABLE: Record<number, { time: string; batch: string; color: string }[]> = {
  1: [{ time: '10:00 AM', batch: 'Data Science Batch A', color: 'border-indigo-500' }, { time: '02:00 PM', batch: 'Aider AI Batch', color: 'border-purple-500' }],
  2: [{ time: '11:00 AM', batch: 'Caveman Dev Batch', color: 'border-orange-500' }, { time: '03:00 PM', batch: 'Data Science Batch B', color: 'border-indigo-500' }],
  3: [{ time: '10:00 AM', batch: 'Data Science Batch A', color: 'border-indigo-500' }],
  4: [{ time: '09:00 AM', batch: 'Aider AI Batch', color: 'border-purple-500' }, { time: '02:00 PM', batch: 'Caveman Dev Batch', color: 'border-orange-500' }],
  5: [{ time: '10:00 AM', batch: 'Data Science Batch A', color: 'border-indigo-500' }, { time: '12:00 PM', batch: 'Data Science Batch B', color: 'border-indigo-400' }],
  6: [{ time: '11:00 AM', batch: 'All Batches Review', color: 'border-green-500' }],
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const today = new Date().getDay();

  const [nextClass, setNextClass] = useState<any>(null);
  const [recentCompleted, setRecentCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(today);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    if (!client) { setLoading(false); return; }
    try {
      // Next class to teach
      const res = await client.execute('SELECT * FROM classes WHERE status != "completed" ORDER BY order_index ASC LIMIT 1');
      if (res.rows.length > 0) setNextClass(res.rows[0]);

      // Last 3 completed
      const done = await client.execute('SELECT * FROM classes WHERE status = "completed" ORDER BY order_index DESC LIMIT 3');
      setRecentCompleted(done.rows as any[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!nextClass || !client) return;
    setActivating(true);
    try {
      // Mark the class as "live" type so teacher can test Jitsi
      await client.execute({
        sql: 'UPDATE classes SET type = "live" WHERE id = ?',
        args: [nextClass.id]
      });
      navigate('/teacher/live');
    } catch (e) {
      console.error(e);
      setActivating(false);
    }
  };

  const todaySlots = TIMETABLE[today] || [];
  const selectedSlots = TIMETABLE[selectedDay] || [];

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Teacher Portal</h1>
            <p className="text-erp-text/70 font-medium mt-1">{FULL_DAYS[today]}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-erp-primary/5 transition-colors border-erp-primary" onClick={() => navigate('/teacher/live')}>
            <Video className="w-8 h-8 text-erp-primary mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Start Live Class</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-purple-500/5 transition-colors" onClick={() => navigate('/teacher/cms')}>
            <BookOpen className="w-8 h-8 text-purple-400 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Course CMS</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-green-500/5 transition-colors" onClick={() => navigate('/teacher/attendance')}>
            <Users className="w-8 h-8 text-green-400 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Attendance</span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-blue-500/5 transition-colors">
            <Calendar className="w-8 h-8 text-blue-400 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">My Schedule</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Upcoming Class Card */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-indigo-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="font-bold text-white text-lg">Next Upcoming Class</h2>
              </div>

              {loading ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                </div>
              ) : nextClass ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Class Title</p>
                    <h3 className="text-xl font-bold text-white mb-1">{nextClass.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{nextClass.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                        {nextClass.type === 'live' ? '🔴 Live Session' : '🎬 Video Lesson'}
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                        {nextClass.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGoLive}
                      disabled={activating}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white border-green-700 font-bold"
                    >
                      {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {activating ? 'Launching...' : 'Go Live Now'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/teacher/live')}
                      className="flex items-center gap-2"
                    >
                      Open Dashboard <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-center py-6">
                  All classes completed! 🎉
                </div>
              )}
            </Card>

            {/* Recently Completed */}
            <Card>
              <h2 className="text-lg font-bold text-erp-text mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Recently Completed
              </h2>
              {recentCompleted.length === 0 ? (
                <p className="text-erp-text/50 text-sm">No completed classes yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentCompleted.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between bg-erp-surface border border-erp-border rounded-xl px-4 py-3">
                      <div>
                        <p className="font-bold text-erp-text text-sm">{cls.title}</p>
                        <p className="text-xs text-erp-text/50 mt-0.5">Recording saved · AI Summary generated</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-green-900/30 text-green-400 border border-green-700/30 px-2 py-1 rounded">Done</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Timetable */}
          <div>
            <Card className="h-full">
              <h2 className="text-lg font-bold text-erp-text mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Weekly Timetable
              </h2>

              {/* Day Selector */}
              <div className="flex gap-1 mb-5 bg-erp-surface rounded-xl p-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                      selectedDay === i
                        ? 'bg-indigo-600 text-white shadow'
                        : i === today
                        ? 'text-indigo-400 bg-indigo-900/20'
                        : 'text-erp-text/50 hover:text-erp-text'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Slots */}
              <div className="space-y-3">
                {selectedSlots.length === 0 ? (
                  <div className="text-center py-8 text-erp-text/40 text-sm">
                    No classes scheduled {FULL_DAYS[selectedDay]}.
                  </div>
                ) : (
                  selectedSlots.map((slot, i) => (
                    <div key={i} className={`border-l-4 ${slot.color} bg-erp-surface rounded-r-xl px-4 py-3`}>
                      <p className="font-bold text-erp-text text-sm">{slot.batch}</p>
                      <p className="text-xs text-erp-text/60 mt-0.5 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {slot.time}
                        {selectedDay === today && <span className="ml-2 text-green-400">Today</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {selectedDay === today && todaySlots.length > 0 && (
                <Button
                  onClick={() => navigate('/teacher/live')}
                  className="w-full mt-5 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                >
                  <Video className="w-4 h-4" /> Open Live Dashboard
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
