"use client";
import { useState } from "react";
import QuestEditModal from "./QuestEditModal";

type Props = {
  profile?: any;
  countryName?: string;
  flagIcon?: string;
  onUpdateProfile: (p: any) => void;
  apiSave?: (quest: any) => void;
  apiDelete?: (id: number) => void;
};

export default function QuestEditor({ profile, countryName, flagIcon, apiSave, apiDelete }: Props) {
  const [editingQuest, setEditingQuest] = useState<any | null>(null);

  if (!profile) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">🌍</div>
            <p>Выберите страну слева, чтобы настроить её задачи.</p>
        </div>
    );
  }

  const handleRemoveQuest = (questId: number) => {
    if (confirm("Удалить задачу из шаблона страны?")) {
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
        description: "",
        xpReward: 10,
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative">
      {/* Header с фоном */}
      <div className="relative h-40 shrink-0 bg-zinc-800">
         <div className="w-full h-full bg-gradient-to-br from-blue-900 via-zinc-900 to-black opacity-80" />
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
         
         <div className="absolute bottom-4 left-5 right-5">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{flagIcon}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] uppercase tracking-wider backdrop-blur-md border border-white/10">
                    Базовый трек
                </span>
             </div>
             <h2 className="text-xl font-bold text-white leading-tight shadow-sm">
                 {countryName || "Страна не выбрана"}
             </h2>
             <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                 Задачи, обязательные для всех поступающих в эту страну.
             </p>
         </div>
      </div>

      {/* Список задач */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-950/50">
          
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <span className="text-yellow-500">🚩</span> Путь поступления
              </h3>
              <button 
                onClick={handleCreateNew}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
              >
                <span>+</span> Задача
              </button>
          </div>

          {profile.assignedQuests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                  <div className="text-2xl mb-2 opacity-50">📭</div>
                  <p className="text-xs text-zinc-500">Список задач пуст</p>
                  <button onClick={handleCreateNew} className="mt-3 text-xs text-blue-400 hover:underline">
                      Создать первую задачу
                  </button>
              </div>
          ) : (
            <div className="space-y-2">
                {profile.assignedQuests.map((quest: any) => (
                <div key={quest.id} className="group flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition cursor-default relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5 flex items-center gap-2">
                            {quest.stage}
                        </div>
                        <div className="font-medium text-sm text-zinc-200">
                            {quest.title}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="text-xs font-bold text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">
                            +{quest.xpReward} XP
                        </div>
                        
                        {/* Actions overlay */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 bg-zinc-900 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => setEditingQuest(quest)} 
                                className="p-1.5 hover:bg-zinc-800 rounded text-blue-400"
                                title="Редактировать"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={() => handleRemoveQuest(quest.id)} 
                                className="p-1.5 hover:bg-zinc-800 rounded text-red-400"
                                title="Удалить"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
          )}
      </div>

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
