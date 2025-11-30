"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { useCountry } from "./CountryContext";
import { useProgress } from "./ProgressContext";

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const { quests, selectedCountry } = useCountry();
  // ИСПРАВЛЕНО: Используем tasks вместо progress
  const { tasks } = useProgress();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const notifications = useMemo(() => {
    const notifs: { id: string; type: "review" | "done" | "deadline"; message: string }[] = [];
    if (!selectedCountry) return [];

    const TODAY = new Date("2025-10-24T12:00:00Z"); // Заданная дата для расчета дедлайнов
    const DEADLINE_THRESHOLD_DAYS = 7;

    const requiredQuestIds = new Set(selectedCountry.required_quest_ids);
    const relevantQuests = quests.filter((q) => requiredQuestIds.has(q.id));

    for (const quest of relevantQuests) {
      // ИСПРАВЛЕНО: Находим задачу по названию (т.к. ID в БД отличаются от шаблонов)
      const task = tasks.find(t => t.title === quest.title);

      // Если задача еще не создана, пропускаем
      if (!task) continue;

      // ИСПРАВЛЕНО: Проверяем статусы в верхнем регистре (как они приходят с API)
      if (task.status === "REVIEW") {
        notifs.push({
          id: `s-review-${quest.id}`,
          type: "review",
          message: `Задача "${quest.title}" отправлена на проверку.`,
        });
      } else if (task.status === "DONE") {
        notifs.push({ id: `s-done-${quest.id}`, type: "done", message: `Задача "${quest.title}" одобрена! ✅` });
      }

      if (task.status !== "DONE") {
        const deadlineDate = new Date(quest.deadline);
        const diffTime = deadlineDate.getTime() - TODAY.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= DEADLINE_THRESHOLD_DAYS) {
          notifs.push({
            id: `d-${quest.id}`,
            type: "deadline",
            message: `Дедлайн для "${quest.title}" истекает ${quest.deadline}.`,
          });
        }
      }
    }
    return notifs;
  }, [selectedCountry, quests, tasks]); // ИСПРАВЛЕНО: зависимость от tasks

  const typeStyles = {
    review: "border-l-4 border-yellow-500",
    done: "border-l-4 border-green-500",
    deadline: "border-l-4 border-red-500",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        aria-label={`Уведомления (${notifications.length})`}
      >
        <BellIcon />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="card absolute left-[30px] top-[-10px] mt-2 w-80 max-h-96 overflow-y-auto p-2 shadow-xl z-10">
          <div className="p-2 font-semibold text-sm">Уведомления</div>
          {notifications.length > 0 ? (
            <ul className="space-y-1">
              {notifications.map((n) => (
                <li key={n.id} className={`p-2 rounded-lg text-xs ${typeStyles[n.type]} bg-black/5 dark:bg-white/5`}>{n.message}</li>
              ))}
            </ul>
          ) : (<p className="p-4 text-center text-xs text-zinc-500">Нет новых уведомлений.</p>)}
        </div>
      )}
    </div>
  );
}