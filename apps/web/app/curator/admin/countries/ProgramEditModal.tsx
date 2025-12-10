"use client";
import { useState, useEffect, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import QuestEditor from "./QuestEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Props = {
  program?: any; // Если null - создание, иначе редактирование
  universityId: string;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
};

const CATEGORIES = ["IT", "Business", "Engineering", "Arts/Design", "Law", "Medicine", "Science", "Humanities"];

export default function ProgramEditModal({ program, universityId, onSave, onClose }: Props) {
  const { documents, quests, refreshData } = useCountry();
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'tasks'>('info');
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    title: "",
    category: "IT",
    deadline: "",
    link: "",
    imageUrl: "",
    universityId: universityId,
    requiredDocumentIds: [] as number[]
  });

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title,
        category: program.category || "IT",
        deadline: program.deadline || "",
        link: program.link || "",
        imageUrl: program.imageUrl || "",
        universityId: program.university?.id || universityId,
        requiredDocumentIds: program.required_document_ids || []
      });
    }
  }, [program, universityId]);

  // --- Handlers for Info & Docs ---

  const handleSubmitInfo = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...formData, id: program?.id });
      // Не закрываем модалку сразу, если это редактирование, чтобы пользователь мог перейти к таскам
      if (!program) onClose(); 
      else alert("Информация сохранена");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (docId: number) => {
      setFormData(prev => {
          const ids = new Set(prev.requiredDocumentIds);
          if (ids.has(docId)) ids.delete(docId);
          else ids.add(docId);
          return { ...prev, requiredDocumentIds: Array.from(ids) };
      });
  };

  // --- Handlers for Tasks (QuestEditor) ---

  // Профиль для QuestEditor, фильтрующий задачи только этой программы
  const programProfile = useMemo(() => {
      if (!program) return null;
      // Фильтруем квесты, у которых programId совпадает с текущим
      // (В реальном приложении это поле должно приходить с бэка в массиве quests)
      // Для мока пока используем логику "если бы оно было"
      const programTasks = quests.filter((q: any) => q.programId === program.id);
      
      return {
          universityId: "program-specific",
          countryId: "program-specific",
          programId: program.id, // Важно для сохранения
          assignedQuests: programTasks
      };
  }, [program, quests]);

  const handleSaveTask = async (task: any) => {
      if (!program?.id) {
          alert("Сначала сохраните программу, чтобы добавлять к ней задачи.");
          return;
      }
      const token = localStorage.getItem("accessToken");
      const payload = {
          ...task,
          programId: program.id, // Привязываем к программе
          countryId: null,      // Отвязываем от страны
          universityId: null    // Отвязываем от вуза
      };
      if (task.id < 0) delete payload.id;

      await fetch(`${API_URL}/admin/task-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
      });
      await refreshData(); // Обновляем глобальный контекст
  };

  const handleDeleteTask = async (id: number) => {
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_URL}/admin/task-templates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await refreshData();
  };

  const inputClass = "w-full mt-1 p-2 rounded bg-zinc-800 border border-zinc-700 text-sm focus:border-blue-500 focus:outline-none transition";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold">{program ? "Настройка программы" : "Создание программы"}</h2>
                <p className="text-sm text-zinc-500">{program?.title || "Новая программа"}</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition text-2xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6">
            <button 
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'info' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                1. Основное
            </button>
            <button 
                onClick={() => setActiveTab('docs')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'docs' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                2. Документы
            </button>
            <button 
                onClick={() => setActiveTab('tasks')}
                disabled={!program} // Нельзя добавлять задачи, пока программа не создана
                className={`py-3 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'tasks' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
                3. Задачи (Кастомизация)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* TAB: INFO */}
            {activeTab === 'info' && (
                <form id="prog-form" onSubmit={handleSubmitInfo} className="space-y-4 max-w-lg">
                     <div>
                        <label className="text-xs text-zinc-400">Название (Специальность)</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} required placeholder="MSc Computer Science" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400">Категория</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Дедлайн</label>
                            <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-400">Ссылка на сайт</label>
                        <input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className={inputClass} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-400">URL картинки (Cover)</label>
                        <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className={inputClass} placeholder="https://..." />
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="btn btn-primary w-full">
                            {loading ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB: DOCS */}
            {activeTab === 'docs' && (
                <div className="space-y-4">
                    <p className="text-sm text-zinc-400 mb-4">
                        Выберите документы, которые <b>обязательны</b> именно для этой программы (в дополнение к страновым).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {documents.map(doc => {
                            const isSelected = formData.requiredDocumentIds.includes(doc.id);
                            return (
                                <div 
                                    key={doc.id} 
                                    onClick={() => toggleDocument(doc.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
                                        isSelected 
                                        ? 'bg-blue-900/20 border-blue-500/50' 
                                        : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-zinc-500'}`}>
                                        {isSelected && <span className="text-xs text-white">✓</span>}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-zinc-200">{doc.title}</div>
                                        <div className="text-xs text-zinc-500">{doc.category}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => handleSubmitInfo()} className="btn btn-primary mt-4">Сохранить список документов</button>
                </div>
            )}

            {/* TAB: TASKS */}
            {activeTab === 'tasks' && program && (
                <div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6">
                        <h4 className="text-yellow-500 font-bold text-sm mb-1">Кастомизация трека</h4>
                        <p className="text-xs text-yellow-200/70">
                            Задачи, добавленные здесь, появятся у студента <b>только</b> если он выберет эту программу. 
                            Они дополнят стандартный список задач по стране.
                        </p>
                    </div>

                    <QuestEditor 
                        profile={programProfile}
                        onUpdateProfile={() => {}}
                        apiSave={handleSaveTask}
                        apiDelete={handleDeleteTask}
                    />
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
