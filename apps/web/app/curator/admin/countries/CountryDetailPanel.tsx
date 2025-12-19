"use client";
import { useState, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import QuestEditModal from "./QuestEditModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Props = {
  countryId: string;
  onSaveTask: (task: any) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  refreshData?: () => Promise<void>; // Добавляем проп для обновления данных
};

export default function CountryDetailPanel({ countryId, onSaveTask, onDeleteTask, refreshData }: Props) {
  const { countries, documents, quests } = useCountry();
  const [editingQuest, setEditingQuest] = useState<any | null>(null);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [tempRequiredDocs, setTempRequiredDocs] = useState<number[]>([]);

  const country = useMemo(() => countries.find(c => c.id === countryId), [countries, countryId]);

  // Задачи страны
  const countryTasks = useMemo(() => {
    return quests.filter((q: any) => q.countryId === countryId && !q.programId);
  }, [quests, countryId]);

  // Требования (документы)
  const requirements = useMemo(() => {
     if (!country) return [];
     const reqIds = country.required_document_ids || []; 
     return documents.filter(d => reqIds.includes(d.id));
  }, [documents, country]);

  // Инициализация tempRequiredDocs при входе в режим редактирования
  const enterEditMode = () => {
    if (country) {
      setTempRequiredDocs(country.required_document_ids || []);
    }
    setIsEditingDocs(true);
  };

  // Обработка сохранения документов страны
  const handleSaveCountryDocs = async () => {
      if (!country) return;
      const token = localStorage.getItem("accessToken");
      
      try {
          const res = await fetch(`${API_URL}/admin/countries/${country.id}`, {
              method: "PATCH",
              headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ requiredDocumentIds: tempRequiredDocs })
          });

          if (!res.ok) throw new Error("Ошибка сохранения");
          
          setIsEditingDocs(false);
          if (refreshData) await refreshData(); // Обновляем данные на клиенте
      } catch(e) {
          console.error(e);
          alert("Не удалось сохранить список документов");
      }
  };

  // Exit edit mode
  const exitEditMode = () => {
    setIsEditingDocs(false);
    setTempRequiredDocs([]);
  };

  // Toggle checkbox
  const toggleDoc = (docId: number) => {
    setTempRequiredDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
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

  const handleRemoveQuest = (questId: number) => {
    if (confirm("Удалить задачу из шаблона страны?")) {
        onDeleteTask(questId);
    }
  };
  
  const handleSaveQuest = async (updatedQuest: any) => {
      await onSaveTask(updatedQuest);
      setEditingQuest(null);
  };

  if (!country) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-4xl mb-3 opacity-50">🌍</div>
            <p>Выберите страну слева, чтобы настроить её трек.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-xl">
      
      {/* --- HEADER (как в модалке) --- */}
      <div className="relative h-48 bg-zinc-800 shrink-0">
          {/* Фоновое изображение (можно сделать динамическим, пока ставим красивый плейсхолдер) */}
          <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-900 opacity-80" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          
          <div className="absolute bottom-5 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs backdrop-blur-md border border-white/10 uppercase tracking-wider font-bold">
                      Базовый трек
                  </span>
                  <span className="text-2xl">{country.flag_icon}</span>
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight shadow-sm">{country.name}</h2>
          </div>
      </div>

      {/* --- CONTENT (как в модалке) --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-900">
          
          {/* Info Row */}
          <div className="flex flex-wrap gap-6 text-sm pb-6 border-b border-zinc-800">
              <div className="flex flex-col">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Статус</span>
                  <span className="font-semibold text-green-400">Активна</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Студентов</span>
                  <span className="font-semibold text-zinc-200">12 (Demo)</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Задач</span>
                  <span className="font-semibold text-zinc-200">{countryTasks.length}</span>
              </div>
          </div>

          {/* Requirements Section */}
          <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="text-blue-500">📄</span> Требования к поступлению
              </h3>
              {!isEditingDocs ? (
                <>
                  {requirements.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                          {requirements.map((doc: any) => (
                              <div key={doc.id} className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 text-sm flex items-center gap-3">
                                  <span className="text-green-500 text-xs">●</span>
                                  <span className="text-zinc-300">{doc.title}</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-zinc-500 italic p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                          Список документов не настроен.
                      </p>
                  )}
                  <button 
                    onClick={enterEditMode}
                    className="mt-3 text-xs text-blue-500 hover:text-blue-400 transition flex items-center gap-1 font-medium"
                  >
                      ✏️ Настроить список документов
                  </button>
                </>
              ) : (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {documents.map((doc: any) => (
                      <label key={doc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempRequiredDocs.includes(doc.id)}
                          onChange={() => toggleDoc(doc.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-zinc-300">{doc.title}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700">
                    <button
                      onClick={handleSaveCountryDocs}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={exitEditMode}
                      className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Tasks Section (Путь поступления) */}
          <div>
               <div className="flex justify-between items-end mb-4">
                   <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      <span className="text-yellow-500">🚩</span> Путь поступления
                  </h3>
                  <button 
                    onClick={handleCreateNew}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition shadow-sm font-medium"
                  >
                    + Задача
                  </button>
               </div>
              
              <div className="space-y-2">
                   {countryTasks.length > 0 ? countryTasks.map((task: any) => (
                       <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800 transition relative overflow-hidden">
                           <div className="relative z-10">
                               <div className="flex items-center gap-2 mb-0.5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">{task.stage}</div>
                                    {task.isCritical && <span className="text-[9px] bg-red-500/20 text-red-500 px-1 rounded border border-red-500/30">Критично</span>}
                               </div>
                               <div className="font-medium text-sm text-zinc-200">{task.title}</div>
                           </div>
                           
                           <div className="flex items-center gap-3 relative z-10">
                               {/* Submission Type Icon */}
                               <div className="text-zinc-500 text-xs" title={`Тип сдачи: ${task.submissionType}`}>
                                   {task.submissionType === 'file' ? '📄' : task.submissionType === 'link' ? '🔗' : task.submissionType === 'text' ? '📝' : '☑️'}
                               </div>
                               <div className="text-xs font-bold text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">
                                   +{task.xpReward} XP
                               </div>
                               
                               {/* Hover Actions */}
                               <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 bg-zinc-800 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                       onClick={() => setEditingQuest(task)} 
                                       className="p-1.5 hover:bg-zinc-700 rounded text-blue-400"
                                       title="Редактировать"
                                   >
                                       ✏️
                                   </button>
                                   <button 
                                       onClick={() => handleRemoveQuest(task.id)} 
                                       className="p-1.5 hover:bg-zinc-700 rounded text-red-400"
                                       title="Удалить"
                                   >
                                       🗑️
                                   </button>
                               </div>
                           </div>
                       </div>
                   )) : (
                       <div className="text-center py-8 text-zinc-500 text-sm bg-zinc-800/30 rounded-xl border border-dashed border-zinc-800">
                           Список задач пуст. Добавьте первую задачу.
                       </div>
                   )}
              </div>

          </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur flex justify-between items-center text-xs text-zinc-500">
          <span>ID: {country.id}</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition">
                Настройки страны
            </button>
          </div>
      </div>

      {/* Edit Modal */}
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
