import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { getCurrentUser } from '../../lib/auth';
import { getTeacherTimetables } from '../../lib/api/teacher';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]; // Mapping for Date().getDay() where 0 is Sunday

// Generate 30-min intervals from 08:00 to 20:00
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 20; h++) {
  const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  const ampm = h >= 12 ? 'PM' : 'AM';
  TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:00 ${ampm}`);
  TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:30 ${ampm}`);
}

const parseTimeString = (timingStr: string) => {
  // e.g. "10-11am", "6:30-7:30pm", "12-1pm"
  const [startStr, endStr] = timingStr.toLowerCase().split('-');
  if (!startStr || !endStr) return { start: 0, end: 0 };
  
  const isPm = endStr.includes('pm');
  
  const parsePart = (part: string, isEnd: boolean) => {
    let raw = part.replace(/[a-z]/g, '');
    let [h, m] = raw.split(':');
    let hr = parseInt(h);
    let min = m ? parseInt(m) : 0;
    
    // logic to determine am/pm
    // If hr < 12 and it's PM (either explicitly or inferred from end string)
    // Actually, "10-11am": start 10 is AM.
    // "12-1pm": start 12 is PM.
    // "6:30-7:30pm": start 6 is PM.
    // "9-10pm": start 9 is PM.
    let isThisPm = isPm;
    if (part.includes('am')) isThisPm = false;
    if (part.includes('pm')) isThisPm = true;
    
    if (hr === 12 && !isThisPm) hr = 0; // 12am = 0
    if (hr < 12 && isThisPm) hr += 12;  // 1pm = 13
    
    return hr + min / 60;
  };
  
  return {
    start: parsePart(startStr, false),
    end: parsePart(endStr, true)
  };
};

export default function TeacherTimetable() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  const resolvedUserId = user?.id === 'usr_teacher' ? 'usr_venkatesh' : user?.id;
  const [rawTimetable, setRawTimetable] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    
    // Fetch timetable
    const fetchTimetable = async () => {
      try {
        // Match by user ID first (which is what teacher_id column stores)
        let matchedRows = await getTeacherTimetables(resolvedUserId || '');

        // Fallback: get all slots
        if (matchedRows.length === 0) {
          matchedRows = await getTeacherTimetables('');
        }

        const dayMap: Record<string, number> = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
        
        // Deduplicate: only one entry per (batch_id + day_of_week + timing)
        const seen = new Set<string>();
        const formattedTimetable = matchedRows
          .filter((r: any) => {
            const key = `${r.batch_id}__${r.day_of_week}__${r.timing}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((r: any) => ({
            id: r.id,
            batchId: r.id, // use actual slot ID for navigation
            batchName: r.batch_id,       // e.g. "Batch 1"
            course: r.course_name || r.batch_id,  // e.g. "SQL" — the module being taught
            time: r.timing,              // use raw timing col e.g. "10-11am"
            day: dayMap[r.day_of_week as string] || 1
          }));
        setRawTimetable(formattedTimetable);
      } catch(e) {
        console.error(e);
      }
    };
    fetchTimetable();

    return () => clearInterval(timer);
  }, [user, resolvedUserId]);

  const getStatusColor = (day: number, startHour: number) => {
    const today = currentTime.getDay();
    let classDay = day; // 1=Mon, 2=Tue... 0=Sun (wait, the JSON uses 1=Mon...5=Fri)
    if (classDay === 7) classDay = 0; // standard JS day

    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

    // Is it in the past? (Previous day in week, or today but time passed)
    // Note: this assumes we are only looking at the current week.
    let isPastDay = false;
    // Map Monday to 0 ... Sunday to 6 for easy comparison
    const jsToNorm = (d: number) => d === 0 ? 6 : d - 1; 
    const normToday = jsToNorm(today);
    const normClassDay = jsToNorm(classDay);

    if (normClassDay < normToday) isPastDay = true;
    else if (normClassDay === normToday && startHour < currentHour) isPastDay = true;

    if (isPastDay) return 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed grayscale';

    // Is it happening within the next 1 hour?
    if (normClassDay === normToday && startHour >= currentHour && startHour - currentHour <= 1.0) {
      return 'bg-red-500/10 border-red-500 text-red-700 hover:bg-red-500/20 shadow-sm animate-pulse cursor-pointer';
    }

    // Future (Upcoming)
    return 'bg-orange-500/10 border-orange-500 text-orange-700 hover:bg-orange-500/20 shadow-sm cursor-pointer';
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 h-auto text-erp-text/60">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-500" /> My Timetable
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Full weekly view. Past classes are locked. Upcoming are clickable.</p>
          </div>
        </div>

        <Card className="bg-erp-surface rounded-xl border border-erp-border overflow-x-auto relative">
          <div className="min-w-[1000px] grid grid-cols-[100px_repeat(7,1fr)]">
            
            {/* Header */}
            <div className="col-span-1 border-b-2 border-r border-erp-border bg-erp-background p-4 flex items-center justify-center font-bold text-erp-text/60">
              <Clock className="w-5 h-5" />
            </div>
            {DAYS.map(day => (
              <div key={day} className="col-span-1 border-b-2 border-r border-erp-border bg-erp-background p-4 text-center font-bold text-erp-text">
                {day}
              </div>
            ))}

            {/* Grid Body */}
            <div className="col-span-1 relative">
              {TIME_SLOTS.map((time, i) => (
                <div key={time} className={`h-[40px] border-r border-b border-erp-border/50 text-xs font-bold text-erp-text/40 flex items-center justify-center ${i % 2 === 0 ? '' : 'bg-erp-background/50'}`}>
                  {time}
                </div>
              ))}
            </div>

            {DAYS.map((day, dIndex) => {
              // dIndex 0 = Monday.
              const jsonDay = dIndex + 1; // JSON uses 1=Mon, 2=Tue
              const dayClasses = rawTimetable.filter((t: any) => t.day === jsonDay);

              return (
                <div key={day} className="col-span-1 border-r border-erp-border/50 relative bg-erp-background/30">
                  {/* Grid Lines */}
                  {TIME_SLOTS.map((time, i) => (
                    <div key={time} className={`h-[40px] border-b border-erp-border/50 ${i % 2 === 0 ? '' : 'bg-erp-background/50'}`} />
                  ))}

                  {/* Absolute Positioned Events */}
                  {dayClasses.map((cls: any, idx: number) => {
                    const { start, end } = parseTimeString(cls.time);
                    if (isNaN(start) || isNaN(end) || start < 8 || start > 20) return null; // out of bounds

                    const startOffset = start - 8; // 8 AM is 0
                    const duration = end - start;

                    const top = startOffset * 80; // 80px per hour (40px per 30m)
                    const height = duration * 80;

                    const colorClasses = getStatusColor(jsonDay, start);
                    const isClickable = !colorClasses.includes('not-allowed');

                    return (
                      <div 
                        key={idx}
                        onClick={() => isClickable ? navigate(`/teacher/live?classId=${cls.batchId}&time=${encodeURIComponent(cls.time)}&day=${cls.day}`) : null}
                        className={`absolute left-1 right-1 rounded-md border-l-4 p-2 transition-transform hover:scale-[1.02] overflow-hidden ${colorClasses}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-bold opacity-80">{cls.time}</p>
                          {colorClasses.includes('red') && <Zap className="w-3 h-3 animate-bounce" />}
                        </div>
                        <h4 className="font-bold text-xs leading-tight mb-0.5">{cls.course}</h4>
                        <p className="text-[10px] font-medium opacity-80">{cls.batchName}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
