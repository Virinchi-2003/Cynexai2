import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Task } from '../../../lib/api/tasks';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High:   '#f97316',
  Medium: '#3b82f6',
  Low:    '#9ca3af',
};

export const TaskCalendarView: React.FC<Props> = ({ tasks, onTaskClick }) => {
  const events = useMemo(() => {
    return tasks
      .filter(t => t.due_date)
      .map(task => {
        const dueDate = new Date(task.due_date);
        const start = task.start_date ? new Date(task.start_date) : dueDate;
        return {
          id: task.id,
          title: task.title,
          start,
          end: dueDate,
          resource: task,
          allDay: true,
        };
      });
  }, [tasks]);

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    const color = PRIORITY_COLORS[task.priority] || '#6b7280';
    return {
      style: {
        backgroundColor: task.status === 'Done' ? '#d1fae5' : color,
        borderColor: task.status === 'Done' ? '#6ee7b7' : color,
        color: task.status === 'Done' ? '#065f46' : '#ffffff',
        borderRadius: '6px',
        border: `1.5px solid`,
        fontWeight: '700',
        fontSize: '11px',
        padding: '1px 5px',
        opacity: task.status === 'Done' ? 0.7 : 1,
        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    onTaskClick(event.resource as Task);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-erp-border p-4 overflow-hidden" style={{ height: '700px' }}>
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 10px 4px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-radius: 12px; overflow: hidden; }
        .rbc-toolbar button { font-weight: 700; border-radius: 8px; font-size: 13px; }
        .rbc-toolbar button.rbc-active { background: #b8ff22; color: #1a1a1a; border-color: #b8ff22; }
        .rbc-toolbar button:hover { background: #f3f4f6; }
        .rbc-today { background: #fffbeb !important; }
        .rbc-event:focus { outline: none; }
        .rbc-show-more { font-weight: 700; color: #6366f1; font-size: 11px; }
        .rbc-toolbar { margin-bottom: 16px; }
        .rbc-toolbar-label { font-weight: 800; font-size: 18px; color: #111827; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        defaultView={Views.MONTH}
        popup
        tooltipAccessor={(event: any) => `${(event.resource as Task).priority} | ${(event.resource as Task).status}`}
      />
    </div>
  );
};
