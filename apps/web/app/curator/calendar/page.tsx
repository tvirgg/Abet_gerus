"use client";
import allStudents from "@/mock/students.json";
import allQuestTemplates from "@/mock/quest_templates.json";
import allPrograms from "@/mock/programs.json";
import { useMemo } from "react";
import Calendar, { CalendarEvent } from "@/shared/Calendar";

export default function CuratorCalendarPage() {

  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Собираем дедлайны по квестам для каждого студента
    allStudents.forEach(student => {
        // В реальном приложении здесь нужно будет брать назначенные квесты
        // Для мока, возьмем несколько случайных квестов
        const assignedQuestIds = [1, 10, 11, 20, 21].filter(() => Math.random() > 0.5);
        
        assignedQuestIds.forEach(questId => {
            const quest = allQuestTemplates.find(q => q.id === questId);
            if (quest && quest.deadline) {
                events.push({
                    date: quest.deadline,
                    title: `${quest.title} (${student.name})`,
                    type: 'quest'
                });
            }
        });

        // Добавляем дедлайны по программам
        student.selected_program_ids.forEach(progId => {
            const program = allPrograms.find(p => p.id === progId);
            if (program && program.deadline) {
                events.push({
                    date: program.deadline,
                    title: `Подача: ${program.title.substring(0, 15)}... (${student.name})`,
                    type: 'program'
                });
            }
        });
    });

    return events;
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Календарь Дедлайнов</h1>
      <p className="text-zinc-400 text-sm mb-6">Обзор всех дедлайнов по студентам.</p>
      <Calendar events={allEvents} />
    </div>
  );
}
