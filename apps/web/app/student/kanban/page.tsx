"use client";
import { Task } from "@/shared/ProgressContext";
import { useProgress } from "@/shared/ProgressContext";
import { useState } from "react";
import QuestDetailModal from "../quests/QuestDetailModal";

const KanbanColumn = ({
  title,
  tasks,
  onSelectQuest,
}: {
  title: string;
  tasks: Task[];
  onSelectQuest: (task: Task) => void;
}) => (
  <div className="flex-1">
    <h2 className="text-lg font-semibold mb-4 px-1">{title}</h2>
    <div className="space-y-3">
      {tasks.map((q) => (
        <div
          key={q.id}
          onClick={() => onSelectQuest(q)}
          className="card p-4 transition hover:shadow-lg cursor-pointer bg-white dark:bg-zinc-800"
        >
          <div className="font-medium text-sm">{q.title}</div>
          <div className="text-xs text-yellow-500 font-bold mt-2">XP: {q.xpReward}</div>
        </div>
      ))}
    </div>
  </div>
);

export default function KanbanPage() {
  const { tasks } = useProgress();
  const [selectedQuest, setSelectedQuest] = useState<Task | null>(null);

  const todoQuests = tasks.filter(q => q.status === 'TODO' || q.status === 'CHANGES_REQUESTED');
  const onReviewQuests = tasks.filter(q => q.status === 'REVIEW');
  const doneQuests = tasks.filter(q => q.status === 'DONE');

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
            tasks={todoQuests}
            onSelectQuest={setSelectedQuest}
          />
          <KanbanColumn
            title={`On Review (${onReviewQuests.length})`}
            tasks={onReviewQuests}
            onSelectQuest={setSelectedQuest}
          />
          <KanbanColumn
            title={`Done (${doneQuests.length})`}
            tasks={doneQuests}
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
