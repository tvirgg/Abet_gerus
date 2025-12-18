"use client";
import { useMemo } from "react";
import { useCountry, Program } from "../../../../shared/CountryContext";

type Props = {
  program: Program;
  onClose: () => void; // Вернуться к стране
  onEdit: () => void;
};

export default function ProgramDetailPanel({ program, onClose, onEdit }: Props) {
  const { documents, quests, universities, countries } = useCountry();

  const university = useMemo(() => 
    universities.find(u => u.id === program.university_id), 
  [universities, program]);

  const country = useMemo(() => 
    countries.find(c => c.id === university?.countryId), 
  [countries, university]);

  // Получаем связанные задачи (логика как в модалке)
  const relatedTasks = useMemo(() => {
    return quests.filter((q: any) => 
        (university?.countryId && q.countryId === university.countryId) ||
        (q.universityId === program.university_id) ||
        (q.programId === program.id)
    );
  }, [quests, program, university]);

  // Требования (документы)
  const requirements = useMemo(() => {
     const reqIds = program.required_document_ids || []; 
     return documents.filter((d: any) => reqIds.includes(d.id));
  }, [documents, program]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-xl">
      
      {/* --- HEADER --- */}
      <div className="relative h-48 bg-zinc-800 shrink-0">
          {program.image_url ? (
              <img src={program.image_url} alt={program.title} className="w-full h-full object-cover opacity-60" />
          ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-80" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          
          {/* Кнопка "Назад" / "Закрыть" */}
          <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-md z-20 border border-white/10"
              title="Вернуться к стране"
          >
              ✕
          </button>

          <div className="absolute bottom-5 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs backdrop-blur-md border border-white/10">
                      {program.category || "General"}
                  </span>
                  {university && country && (
                       <span className="px-2 py-0.5 rounded-full bg-black/40 text-white text-xs backdrop-blur-md border border-white/10 flex items-center gap-1">
                           <span>{country.flag_icon}</span>
                           <span className="truncate max-w-[150px]">{university.name}</span>
                       </span>
                  )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight shadow-sm">{program.title}</h2>
          </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-900 custom-scrollbar">
          
          {/* Основная инфо */}
          <div className="flex flex-col gap-3 text-sm text-zinc-400 border-b border-zinc-800 pb-6">
              <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Дедлайн подачи:</span>
                  <b className="text-zinc-200">{program.deadline || "Не указан"}</b>
              </div>
              {program.link && (
                  <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Источник:</span>
                      <a href={program.link} target="_blank" className="flex items-center gap-2 text-blue-500 hover:underline">
                          Официальный сайт ↗
                      </a>
                  </div>
              )}
          </div>

          {/* Требования */}
          <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="text-blue-500">📄</span> Требования к поступлению
              </h3>
              <div className="space-y-2">
                  {requirements.length > 0 ? requirements.map((doc: any) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 text-sm flex items-start gap-3">
                          <span className="text-green-500 text-xs mt-1">●</span>
                          <div>
                              <div className="text-zinc-300 font-medium">{doc.title}</div>
                              <div className="text-zinc-500 text-xs">{doc.category}</div>
                          </div>
                      </div>
                  )) : (
                      <p className="text-sm text-zinc-500 italic p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                          Требования не указаны
                      </p>
                  )}
              </div>
          </div>

          {/* Путь абитуриента (Задачи) */}
          <div>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      <span className="text-yellow-500">🚩</span> Путь поступления
                  </h3>
               </div>
               
              <div className="space-y-2">
                  {relatedTasks.length > 0 ? relatedTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-800/30">
                          <div className="overflow-hidden">
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide mb-0.5">{task.stage}</div>
                              <div className="font-medium text-sm text-zinc-200 truncate pr-2">{task.title}</div>
                          </div>
                          <div className="text-xs font-bold text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded shrink-0">
                              +{task.xpReward} XP
                          </div>
                      </div>
                  )) : (
                      <div className="text-center py-6 text-zinc-500 text-sm bg-zinc-800/30 rounded-xl border border-dashed border-zinc-800">
                          Будут применены стандартные задачи страны.
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur flex justify-between items-center gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-sm"
          >
              Закрыть
          </button>
          <button 
            onClick={onEdit} 
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-sm font-medium"
          >
              Редактировать программу
          </button>
      </div>
    </div>
  );
}
