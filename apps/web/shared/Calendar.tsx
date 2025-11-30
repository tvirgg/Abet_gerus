"use client";
import { useState, useMemo } from "react";

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  title: string;
  type: 'quest' | 'program' | 'custom';
};

type Props = {
  events: CalendarEvent[];
};

export default function Calendar({ events }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date("2025-10-24T12:00:00Z"));

  const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Pad start with previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const eventColors = {
    quest: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    program: 'bg-red-500/20 text-red-300 border-red-500/50',
    custom: 'bg-green-500/20 text-green-300 border-green-500/50',
  };

  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="btn text-xl">‹</button>
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="btn text-xl">›</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="text-center text-xs text-zinc-400 font-semibold py-2">{day}</div>
        ))}
        {daysInMonth.map((day, index) => (
          <div key={index} className="h-32 border border-zinc-700/50 bg-zinc-900/50 rounded-lg p-1.5 overflow-hidden">
            {day && (
              <>
                <span className="text-xs font-bold">{day.getDate()}</span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-24 pr-1">
                  {events
                    .filter(e => e.date === day.toISOString().split('T')[0])
                    .map((event, eventIndex) => (
                       <div
                         key={eventIndex}
                         className={`text-[10px] p-1 rounded border-l-2 ${eventColors[event.type]}`}
                         title={event.title}
                       >
                         {event.title}
                       </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
