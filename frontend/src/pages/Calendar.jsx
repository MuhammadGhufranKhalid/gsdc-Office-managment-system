import { useEffect, useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  format, isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { resource } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';

export default function Calendar() {
  const [cursor, setCursor] = useState(new Date());
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    resource('meetings').list({ limit: 100 }).then((r) => setMeetings(r.data)).catch(() => {});
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const arr = [];
    let d = start;
    while (d <= end) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [cursor]);

  const meetingsOn = (day) =>
    meetings.filter((m) => m.startTime && isSameDay(parseISO(m.startTime), day));

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Meetings & events"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="btn-ghost !px-2"><FiChevronLeft /></button>
            <span className="font-semibold w-36 text-center">{format(cursor, 'MMMM yyyy')}</span>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn-ghost !px-2"><FiChevronRight /></button>
          </div>
        }
      />
      <div className="card p-4">
        <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const evts = meetingsOn(day);
            const muted = !isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[90px] rounded-lg border p-1.5 text-left ${
                  muted ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/50 text-slate-300'
                        : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className={`text-xs font-semibold ${today ? 'grid h-6 w-6 place-items-center rounded-full bg-primary text-white' : ''}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {evts.slice(0, 3).map((m) => (
                    <div key={m._id} className="truncate rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
                      {m.title}
                    </div>
                  ))}
                  {evts.length > 3 && <p className="text-[10px] text-slate-400">+{evts.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
