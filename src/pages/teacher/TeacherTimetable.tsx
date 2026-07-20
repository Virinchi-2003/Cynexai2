import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, Video, MapPin, Users, AlarmClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { getCurrentUser } from '../../lib/auth';
import { getGlobalTimetable, GlobalTimetableSlot, getBatchesList } from '../../lib/api/manager';
import { RescheduleModal } from '../../components/crm/classes/RescheduleModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

const getDurationHours = (start: string, end: string) => {
  const sHour = parseInt(start.split(':')[0]);
  const eHour = parseInt(end.split(':')[0]);
  return (eHour - sHour) || 1;
};

const renderClassTags = (classItem: GlobalTimetableSlot, batches: any[], isOnline: boolean) => {
  try {
    const cList = JSON.parse(classItem.course_name || '[]');
    const bMap = JSON.parse(classItem.batch_id || '{}');
    if (Array.isArray(cList) && cList.length > 0) {
      return (
        <div className="flex flex-col gap-1.5">
          {cList.map((c: string) => {
            const batchNames = (bMap[c] || []).map((bid: string) => batches.find((b: any) => b.id === bid)?.name || bid).join(', ');
            return (
              <div key={c} className="leading-tight">
                <div className={`text-[9px] font-extrabold uppercase truncate ${isOnline ? 'text-emerald-700' : 'text-indigo-700'}`}>{c}</div>
                <div className="text-[11px] font-bold text-erp-text truncate">{batchNames || 'No Batches'}</div>
              </div>
            );
          })}
        </div>
      );
    }
    throw new Error('Fallback');
  } catch {
    return (
      <>
        <div className="font-bold text-xs text-erp-text truncate leading-tight">{classItem.batch_name || classItem.batch_id}</div>
        <div className={`text-[10px] font-bold mt-1 truncate ${isOnline ? 'text-emerald-700' : 'text-indigo-700'}`}>
          {classItem.course_name}
        </div>
      </>
    );
  }
};

export default function TeacherTimetable() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const resolvedUserId = user?.id === 'usr_teacher' ? 'usr_venkatesh' : (user?.id || '');

  const [schedule, setSchedule] = useState<GlobalTimetableSlot[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reschedulingSlot, setReschedulingSlot] = useState<GlobalTimetableSlot | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        getGlobalTimetable({ teacher: resolvedUserId, weekStart: currentWeekStart }),
        getBatchesList()
      ]);
      setSchedule(s || []);
      setBatches(b || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentWeekStart, resolvedUserId]);

  const getStatusColor = (day: string, startHourStr: string) => {
    const today = currentTime.getDay(); // 0=Sun, 1=Mon
    const classDayIdx = DAYS.indexOf(day); // 0=Mon, 6=Sun
    // Convert current JS day to standard index where Mon=0, Sun=6
    const normToday = today === 0 ? 6 : today - 1;
    
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
    const startHour = parseInt(startHourStr.split(':')[0]);

    if (classDayIdx < normToday) return 'past';
    if (classDayIdx === normToday && startHour < currentHour - 1) return 'past'; // class ended
    
    if (classDayIdx === normToday && startHour >= currentHour - 1 && startHour <= currentHour + 1) {
      return 'live';
    }

    return 'upcoming';
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 h-auto text-erp-text/60">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
                <Calendar className="w-8 h-8 text-indigo-500" /> My Timetable
              </h1>
              <p className="text-erp-text/70 font-medium mt-1">Full weekly view. View classes assigned to you.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-erp-surface border border-erp-border rounded-lg px-2 py-1 shadow-sm">
              <button 
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() - 7);
                  setCurrentWeekStart(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 hover:bg-erp-primary/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-erp-text" />
              </button>
              <div className="w-px h-4 bg-erp-border"></div>
              <button 
                onClick={() => setCurrentWeekStart(getMonday(new Date()))}
                className="px-3 py-1 text-xs font-bold text-erp-primary hover:bg-erp-primary/10 transition-colors"
              >
                TODAY
              </button>
              <div className="w-px h-4 bg-erp-border"></div>
              <button 
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() + 7);
                  setCurrentWeekStart(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 hover:bg-erp-primary/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-erp-text" />
              </button>
            </div>
            <p className="text-xs text-erp-text/50 font-bold text-right">
              Week of {new Date(currentWeekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-erp-surface rounded-xl border border-erp-border overflow-hidden relative shadow-md">
          <div className="overflow-x-auto">
            {loading && <div className="absolute inset-0 bg-erp-surface/80 backdrop-blur-sm z-50 flex items-center justify-center font-bold text-erp-primary">Loading Schedule...</div>}
            
            <div className="min-w-[1200px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b-2 border-erp-border bg-erp-background/50">
                <div className="p-4 border-r border-erp-border font-bold text-xs text-erp-text/50 text-center uppercase flex items-center justify-center">
                  <Clock className="w-5 h-5 mr-1" /> Time
                </div>
                {DAYS.map(day => {
                  const today = currentTime.getDay();
                  const normToday = today === 0 ? 6 : today - 1;
                  const isCurrentDay = DAYS.indexOf(day) === normToday && currentWeekStart === getMonday(currentTime);
                  return (
                    <div key={day} className={`p-4 border-r border-erp-border font-bold text-sm text-center last:border-r-0 ${isCurrentDay ? 'text-indigo-600 bg-indigo-50/50' : 'text-erp-text'}`}>
                      {day}
                      {isCurrentDay && <div className="text-[10px] uppercase text-indigo-500 mt-0.5">Today</div>}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              {TIME_SLOTS.map(time => (
                <div key={time} className="grid grid-cols-8 border-b border-erp-border/50 transition-colors">
                  <div className="p-3 border-r border-erp-border text-xs font-bold text-erp-text/50 text-center sticky left-0 bg-erp-surface">
                    {time}
                  </div>
                  
                  {DAYS.map(day => {
                    const classItems = schedule.filter(s => {
                      const isTimeMatch = (s.start_time === time || s.start_time?.startsWith(time.split(':')[0]));
                      if (!isTimeMatch) return false;
                      
                      if (s.status === 'ongoing') {
                        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
                      }
                      return s.day_of_week === day;
                    });
                    
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        className="border-r border-erp-border/50 last:border-r-0 p-2 flex flex-wrap gap-2 content-start hover:bg-erp-primary/5 transition-colors"
                        style={{ minHeight: '100px' }}
                      >
                        {classItems.map(classItem => {
                          const isOnline = classItem.timing?.toLowerCase().includes('online') || classItem.timing?.includes('zoom');
                          const durationHrs = getDurationHours(classItem.start_time, classItem.end_time);
                          const statusColor = getStatusColor(day, classItem.start_time);
                          
                          let bgStyle = 'bg-indigo-50 border-indigo-200';
                          if (isOnline) bgStyle = 'bg-emerald-50 border-emerald-200';
                          if (statusColor === 'past') bgStyle = 'bg-slate-100 border-slate-300 opacity-60 grayscale';
                          if (statusColor === 'live') bgStyle = 'bg-red-50 border-red-400 animate-pulse ring-2 ring-red-400/50';

                          return (
                            <div 
                              key={classItem.id}
                              className={`w-full rounded-xl p-3 z-10 border-2 flex flex-col justify-between shadow-sm
                                ${bgStyle}`}
                              style={{ minHeight: `${Math.max(80, durationHrs * 80)}px` }}
                            >
                              <div className="flex-1 overflow-hidden">
                                {renderClassTags(classItem, batches, isOnline)}
                                <div className="text-[10px] font-bold text-erp-text/60 mt-1.5 flex justify-between items-center">
                                  <span>{classItem.start_time} - {classItem.end_time}</span>
                                  {statusColor === 'live' && <span className="text-red-600 bg-red-100 px-1.5 rounded uppercase tracking-wider animate-bounce">Live</span>}
                                </div>
                              </div>
                              <div className="mt-3 pt-2 border-t border-black/5 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-erp-text/70 truncate">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-indigo-500" />
                                    <span>{classItem.timing}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-erp-primary">
                                    {isOnline ? <Video className="w-3 h-3 text-emerald-500"/> : <Users className="w-3 h-3 text-indigo-500"/>}
                                  </div>
                                </div>
                                {statusColor !== 'past' && (
                                  <div className="flex flex-col gap-1">
                                    <Button 
                                      onClick={() => navigate(`/teacher/live?classId=${classItem.id}&type=${classItem.status}`)}
                                      variant="primary"
                                      className={`w-full py-1.5 text-[10px] h-auto ${statusColor === 'live' ? 'bg-red-600 hover:bg-red-700 border-red-700 shadow-md' : 'bg-indigo-600'}`}
                                    >
                                      <Video className="w-3 h-3 mr-1" /> 
                                      {statusColor === 'live' ? 'JOIN LIVE CLASS' : 'Launch Studio'}
                                    </Button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setReschedulingSlot(classItem); }}
                                      className="w-full py-1 text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <AlarmClock className="w-3 h-3" /> Postpone
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>

    {/* Reschedule Modal */}
    {reschedulingSlot && (
      <RescheduleModal
        slot={{
          id: reschedulingSlot.id,
          title: reschedulingSlot.course_name || reschedulingSlot.batch_name || 'Class',
          start_time: reschedulingSlot.start_time,
          batch_id: reschedulingSlot.batch_id,
        }}
        onClose={() => setReschedulingSlot(null)}
        onSuccess={() => { fetchData(); }}
      />
    )}
  </div>
  );
}
