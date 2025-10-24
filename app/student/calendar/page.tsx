"use client";

import { useMemo } from "react";
import { useCountry } from "../../shared/CountryContext";
import Calendar, { CalendarEvent } from "../../shared/Calendar";

export default function StudentCalendarPage() {
  const { selectedCountry, quests, programs } = useCountry();

  const studentEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    if (!selectedCountry) return [];

    // 1. Дедлайны по квестам для выбранной страны
    const requiredQuestIds = new Set(selectedCountry.required_quest_ids);
    quests
      .filter(q => requiredQuestIds.has(q.id) && q.deadline)
      .forEach(q => {
        events.push({
          date: q.deadline,
          title: q.title,
          type: 'quest'
        });
      });

    // 2. Дедлайны по подаче в университеты (для примера возьмем все)
    programs.forEach(p => {
      events.push({
        date: p.deadline,
        title: `Подача: ${p.title}`,
        type: 'program'
      });
    });
    
    return events;
  }, [selectedCountry, quests, programs]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Календарь</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-6">Ваши личные дедлайны по задачам и программам.</p>
      <Calendar events={studentEvents} />
    </div>
  );
}
