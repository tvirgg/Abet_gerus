"use client";
import { useProgress, Task } from "@/shared/ProgressContext";
import { useState } from "react";
import QuestDetailModal from "./QuestDetailModal";

export default function QuestsPage() {
  const { tasks } = useProgress();
  const [selectedQuest, setSelectedQuest] = useState<Task | null>(null);

  // Группировка по Stage
  const byStage = tasks.reduce<Record<string, Task[]>>((acc, q) => {
    acc[q.stage] = acc[q.stage] || [];
    acc[q.stage].push(q);
    return acc;
  }, {});

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold mb-2">Мои Квесты</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">
          Список задач формируется на основе профиля страны.
        </p>
        <div className="space-y-6">
          {Object.entries(byStage).map(([stage, items]) => (
            <section key={stage}>
              <h2 className="text-lg font-semibold mb-3">{stage}</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {items.map((q) => {
                  const isDone = q.status === 'DONE';
                  const isReview = q.status === 'REVIEW';

                  return (
                    <li
                      key={q.id}
                      className="card p-4 transition hover:shadow-lg cursor-pointer"
                      onClick={() => setSelectedQuest(q)}
                    >
 <div className="flex items-start justify-between gap-4">
  <div>
 <div className={`font-medium ${isDone ? 'line-through text-zinc-500' : ''}`}>{q.title}</div>
 <div className="text-xs text-yellow-500 font-bold mt-1">XP: {q.xpReward}</div>
  </div>
 {isDone ? <div className="text-2xl" title="Выполнено">✅</div> :
  isReview ? <div className="text-2xl" title="На проверке">⏳</div> :
  <button className="btn btn-primary text-xs">Детали</button>}
 </div>
                    </li>
                  ); 
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
      {selectedQuest && (
        <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}
    </>
  );
}
