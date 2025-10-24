"use client";
import { useCountry, QuestTemplate } from "@/app/shared/CountryContext";
import { useProgress } from "@/app/shared/ProgressContext";
import { useState } from "react";
import QuestDetailModal from "../quests/QuestDetailModal";

const KanbanColumn = ({
  title,
  quests,
  onSelectQuest,
}: {
  title: string;
  quests: QuestTemplate[];
  onSelectQuest: (quest: QuestTemplate) => void;
}) => (
  <div className="flex-1">
    <h2 className="text-lg font-semibold mb-4 px-1">{title}</h2>
    <div className="space-y-3 h-[calc(100vh-18rem)] overflow-y-auto pr-2">
      {quests.map((q) => (
        <div
          key={q.id}
          onClick={() => onSelectQuest(q)}
          className="card p-4 transition hover:shadow-lg cursor-pointer bg-white dark:bg-zinc-800"
        >
          <div className="font-medium text-sm">{q.title}</div>
          <div className="text-xs text-yellow-500 font-bold mt-2">XP: {q.xp}</div>
        </div>
      ))}
    </div>
  </div>
);

export default function KanbanPage() {
  const { quests, selectedCountry } = useCountry();
  const { progress } = useProgress();
  const [selectedQuest, setSelectedQuest] = useState<QuestTemplate | null>(null);

  if (!selectedCountry) return null;

  const requiredIds = new Set(selectedCountry.required_quest_ids);
  const allQuests = quests.filter((q) => requiredIds.has(q.id));

  // --- ИЗМЕНЕНИЕ: Задачи, требующие правок, теперь тоже попадают в "To Do" ---
  const todoQuests = allQuests.filter(q => !progress[q.id] || progress[q.id]?.status === 'changes_requested');
  const onReviewQuests = allQuests.filter(q => progress[q.id]?.status === 'review');
  const doneQuests = allQuests.filter(q => progress[q.id]?.status === 'done');

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold mb-2">Kanban Доска</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">
          Управляйте вашими задачами в удобном формате.
        </p>
        <div className="flex gap-6">
          <KanbanColumn
            title={`To Do (${todoQuests.length})`}
            quests={todoQuests}
            onSelectQuest={setSelectedQuest}
          />
          <KanbanColumn
            title={`On Review (${onReviewQuests.length})`}
            quests={onReviewQuests}
            onSelectQuest={setSelectedQuest}
          />
          <KanbanColumn
            title={`Done (${doneQuests.length})`}
            quests={doneQuests}
            onSelectQuest={setSelectedQuest}
          />
        </div>
      </div>
      {selectedQuest && (
        <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}
    </>
  );
}
