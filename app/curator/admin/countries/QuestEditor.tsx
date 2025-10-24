"use client";
import { useState } from "react";
import { useCountry } from "@/app/shared/CountryContext";
import type { UniversityProfile } from "./page";
import QuestEditModal from "./QuestEditModal";

type Props = {
  profile?: UniversityProfile;
  onUpdateProfile: (updatedProfile: UniversityProfile) => void;
};

export default function QuestEditor({ profile, onUpdateProfile }: Props) {
  const { universities, quests: questTemplates } = useCountry();
  const [editingQuest, setEditingQuest] = useState<any | null>(null);

  if (!profile) {
    return <div className="p-4 text-center text-zinc-500">Выберите университет</div>;
  }

  const university = universities.find(u => u.id === profile.universityId);

  const handleRemoveQuest = (questId: number) => {
    const updatedQuests = profile.assignedQuests.filter(q => q.id !== questId);
    onUpdateProfile({ ...profile, assignedQuests: updatedQuests });
  };
  
  const handleSaveQuest = (updatedQuest: any) => {
      let updatedQuests;
      // Если ID существует, обновляем, иначе добавляем
      if (profile.assignedQuests.some(q => q.id === updatedQuest.id)) {
          updatedQuests = profile.assignedQuests.map(q => q.id === updatedQuest.id ? updatedQuest : q);
      } else {
          updatedQuests = [...profile.assignedQuests, updatedQuest];
      }
      onUpdateProfile({ ...profile, assignedQuests: updatedQuests });
      setEditingQuest(null);
  };
  
  const handleCreateNew = () => {
    setEditingQuest({
        id: -Date.now(), // Временный уникальный ID
        title: "Новая задача",
        stage: "Кастомная",
        description: "",
        xp: 10,
    });
  };

  return (
    <div>
      <h2 className="font-semibold px-2 mb-2">{university?.name}</h2>
      <div className="p-2">
        <button onClick={handleCreateNew} className="btn btn-primary w-full text-sm">
          + Создать новую задачу
        </button>
      </div>
      <ul className="space-y-2 mt-2">
        {profile.assignedQuests.map(quest => (
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
