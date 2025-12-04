"use client";
import { useState } from "react";
import QuestEditModal from "./QuestEditModal";

type Props = {
  profile?: any;
  onUpdateProfile: (p: any) => void;
  apiSave?: (quest: any) => void;
  apiDelete?: (id: number) => void;
};

export default function QuestEditor({ profile, apiSave, apiDelete }: Props) {
  const [editingQuest, setEditingQuest] = useState<any | null>(null);

  if (!profile) {
    return <div className="p-4 text-center text-zinc-500">Выберите область</div>;
  }

  const handleRemoveQuest = (questId: number) => {
    if (confirm("Удалить задачу навсегда?")) {
        apiDelete?.(questId);
    }
  };
  
  const handleSaveQuest = (updatedQuest: any) => {
      apiSave?.(updatedQuest);
      setEditingQuest(null);
  };
  
  const handleCreateNew = () => {
    setEditingQuest({
        id: -Date.now(),
        title: "Новая задача",
        stage: "Документы",
        description: "Описание задачи...",
        xpReward: 10,
    });
  };

  return (
    <div>
      <h2 className="font-semibold px-2 mb-2">Задачи ({profile.assignedQuests.length})</h2>
      <div className="p-2">
        <button onClick={handleCreateNew} className="btn btn-primary w-full text-sm">
          + Создать новую задачу
        </button>
      </div>
      <ul className="space-y-2 mt-2">
        {profile.assignedQuests.map((quest: any) => (
          <li key={quest.id} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/50">
            <div className="flex justify-between items-center">
              <span className="text-sm">{quest.title}</span>
              <div className="flex gap-2">
                <button onClick={() => setEditingQuest(quest)} className="text-xs text-blue-400 hover:underline">Ред.</button>
                <button onClick={() => handleRemoveQuest(quest.id)} className="text-xs text-red-400 hover:underline">Удал.</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {editingQuest && (
        <QuestEditModal
          quest={editingQuest}
          onSave={handleSaveQuest}
          onClose={() => setEditingQuest(null)}
        />
      )}
    </div>
  );
}
