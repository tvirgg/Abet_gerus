"use client";
import { useState, useMemo } from "react";
import { useCountry } from "../../../../shared/CountryContext";

type Props = {
  program: any;
  onClose: () => void;
  onEdit: () => void;
};

export default function ProgramDetailModal({ program, onClose, onEdit }: Props) {
  const { documents, quests } = useCountry();

  // Имитация получения связанных задач (в реале это связь через БД)
  // Берем задачи страны + специфичные задачи программы (если бы они были)
  const relatedTasks = useMemo(() => {
    return quests.filter(q => 
        // Либо задачи конкретно этой страны
        (program.university?.countryId && q.countryId === program.university.countryId) ||
        // Либо задачи конкретно этого университета (если есть)
        (q.universityId === program.universityId)
    );
  }, [quests, program]);

  // Требования (документы)
  const requirements = useMemo(() => {
     // Берем айдишники из программы
     const reqIds = program.required_document_ids || []; 
     // Для демо добавим пару дефолтных, если список пуст
     const idsToShow = reqIds.length > 0 ? reqIds : [101, 201, 502]; 
     return documents.filter(d => idsToShow.includes(d.id));
  }, [documents, program]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Красивый Header с фоном */}
        <div className="relative h-48 bg-zinc-800 shrink-0">
            {program.imageUrl ? (
                <img src={program.imageUrl} alt={program.title} className="w-full h-full object-cover opacity-60" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-80" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            
            <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs backdrop-blur-md border border-white/10">
                        {program.category || "General"}
                    </span>
                    {program.university && (
                         <span className="px-2 py-0.5 rounded-full bg-black/40 text-white text-xs backdrop-blur-md border border-white/10 flex items-center gap-1">
                             <span>{program.university.country?.flagIcon}</span>
                             {program.university.name}
                         </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight shadow-sm">{program.title}</h2>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition backdrop-blur-sm"
            >
                ✕
            </button>
        </div>

        {/* Контент с прокруткой */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Основная инфо */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Дедлайн: <b className="text-zinc-900 dark:text-zinc-100">{program.deadline || "Не указан"}</b></span>
                </div>
                {program.link && (
                    <a href={program.link} target="_blank" className="flex items-center gap-2 text-blue-500 hover:underline">
                        <span>🔗</span> Официальный сайт
                    </a>
                )}
            </div>

            {/* Требования */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-blue-500">📄</span> Требования к поступлению
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {requirements.map(doc => (
                        <div key={doc.id} className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-sm flex items-center gap-2">
                            <span className="text-green-500 text-xs">●</span>
                            {doc.title}
                        </div>
                    ))}
                    {requirements.length === 0 && <span className="text-zinc-500 italic text-sm">Требования не указаны</span>}
                </div>
            </div>

            {/* Путь абитуриента (Задачи) */}
            <div>
                 <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-yellow-500">🚩</span> Путь поступления
                </h3>
                <div className="space-y-2">
                    {relatedTasks.length > 0 ? relatedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/20">
                            <div>
                                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wide mb-0.5">{task.stage}</div>
                                <div className="font-medium text-sm">{task.title}</div>
                            </div>
                            <div className="text-xs font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                +{task.xpReward} XP
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-zinc-500 text-sm bg-zinc-50 dark:bg-zinc-800/30 rounded-xl">
                            Стандартные задачи страны будут применены автоматически.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Футер действий */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 shrink-0">
            <button onClick={onEdit} className="btn bg-zinc-200 dark:bg-zinc-800 text-sm">
                Редактировать
            </button>
            <button onClick={onClose} className="btn btn-primary text-sm">
                Закрыть
            </button>
        </div>
      </div>
    </div>
  );
}
