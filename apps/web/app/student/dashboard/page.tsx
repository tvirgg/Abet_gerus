"use client";
import { useAuth } from "@/shared/AuthContext";
import { useCountry } from "@/shared/CountryContext";
import { useProgress } from "@/shared/ProgressContext";
import Link from "next/link";
import { useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedCountry, quests } = useCountry(); // documents не используется здесь напрямую
  const { tasks } = useProgress(); // Используем tasks вместо progress

  const { totalQuests, completedQuests, progressPercentage, totalXp } = useMemo(() => {
    if (!selectedCountry) {
      return { totalQuests: 0, completedQuests: 0, progressPercentage: 0, totalXp: 0 };
    }

    // 1. Определяем ID и Заголовки обязательных квестов для выбранной страны
    const requiredQuestIds = new Set(selectedCountry.required_quest_ids);
    const requiredQuestTitles = new Set(
      quests
        .filter((q) => requiredQuestIds.has(q.id))
        .map((q) => q.title)
    );

    // 2. Находим выполненные задачи из списка задач пользователя (tasks), 
    // которые совпадают по названию с обязательными квестами
    const relevantCompletedTasks = tasks.filter(
      (t) => requiredQuestTitles.has(t.title) && t.status === 'DONE'
    );

    // 3. Считаем процент (по количеству обязательных квестов)
    const progressValue = requiredQuestIds.size > 0 
      ? (relevantCompletedTasks.length / requiredQuestIds.size) * 100 
      : 0;

    // 4. Считаем XP (берем награду из выполненных задач)
    const xp = relevantCompletedTasks.reduce((sum, t) => sum + (t.xpReward || 0), 0);

    return {
      totalQuests: requiredQuestIds.size,
      completedQuests: relevantCompletedTasks.length,
      progressPercentage: progressValue,
      totalXp: xp,
    };
  }, [selectedCountry, tasks, quests]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Адаптивный Штаб</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-6">
        Добро пожаловать, {user?.name}! Здесь ваш центр управления операцией «Поступление».
      </p>

      <div className="grid sm:grid-cols-[1fr_2fr] gap-6 mb-6">
        <div className="card p-4 flex flex-col items-center text-center">
          <div className="text-5xl mb-2">🎓</div>
          <div className="font-semibold">{user?.name}</div>
          <div className="text-sm text-zinc-500">Уровень 1</div>
          <div className="mt-2 text-lg font-bold text-yellow-500">{totalXp} XP</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Прогресс по стране: {selectedCountry?.flag_icon} {selectedCountry?.name}</h2>
            <span className="text-sm font-medium">{completedQuests} / {totalQuests}</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Выполнение квестов повышает ваш прогресс и опыт.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/student/quests"
          className="card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition h-[200px] flex flex-col justify-center text-center"
        >
          <div className="text-xl font-semibold mb-1">Мои Квесты ({totalQuests})</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Динамический список задач по стране.</div>
        </Link>
        <Link
          href="/student/kanban"
          className="card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition h-[200px] flex flex-col justify-center text-center"
        >
          <div className="text-xl font-semibold mb-1">Kanban Доска</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Визуальное управление задачами.</div>
        </Link>
        <Link
          href="/student/programs"
          className="card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition h-[200px] flex flex-col justify-center text-center"
        >
          <div className="text-xl font-semibold mb-1">Мои Программы</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Целевые университеты и их требования.</div>
        </Link>
        <Link
          href="/student/folder"
          className="card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition h-[200px] flex flex-col justify-center text-center"
        >
          <div className="text-xl font-semibold mb-1">Моя Папка ({selectedCountry?.required_document_ids.length || 0})</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Чек-лист документов для выбранной страны.</div>
        </Link>
      </div>
    </div>
  );
}
