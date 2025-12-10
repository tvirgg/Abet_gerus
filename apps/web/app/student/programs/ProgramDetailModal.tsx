 "use client";
import { useMemo } from "react";
import type { Program, QuestTemplate } from "../../../shared/CountryContext";
import { useCountry } from "../../../shared/CountryContext";
import { useProgress } from "../../../shared/ProgressContext";

type Props = {
  program: Program;
  onClose: () => void;
};

export default function ProgramDetailModal({ program, onClose }: Props) {
  const { documents, quests } = useCountry();
  const { tasks: myTasks } = useProgress();

  // 1. Получаем список документов
  const requiredDocs = useMemo(() => {
      const ids = program.required_document_ids || []; // Берем из entity
      return documents.filter((d: any) => ids.includes(d.id));
  }, [program, documents]);

  // 2. Получаем задачи, специфичные для этой программы
  // (В реальном приложении мы бы фильтровали мои задачи по programId, здесь симулируем это через шаблоны)
  const programTasks = useMemo(() => {
      return quests.filter((q: QuestTemplate) => q.universityId?.toString() === program.university_id);
  }, [quests, program]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 shrink-0 bg-zinc-800">
            {program.image_url ? (
                 // eslint-disable-next-line @next/next/no-img-element
                <img src={program.image_url} alt={program.title} className="w-full h-full object-cover opacity-80" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition backdrop-blur-md">
                ✕
            </button>

            <div className="absolute bottom-5 left-6 right-6">
                 <span className="px-2 py-1 rounded bg-white/20 text-white text-xs backdrop-blur-md border border-white/10 mb-2 inline-block">
                    {program.category || "Образование"}
                </span>
                <h2 className="text-2xl font-bold text-white shadow-sm leading-tight">{program.title}</h2>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Info Row */}
            <div className="flex flex-wrap gap-6 text-sm pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col">
                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Дедлайн</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{program.deadline || "TBD"}</span>
                </div>
                {program.link && (
                    <div className="flex flex-col">
                         <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Сайт</span>
                         <a href={program.link} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Перейти на сайт ↗</a>
                    </div>
                )}
            </div>

            {/* Requirements Section */}
            <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="text-blue-500">📋</span> Документы для подачи
                </h3>
                {requiredDocs.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {requiredDocs.map((doc: any) => (
                            <li key={doc.id} className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm">
                                <div className="mt-0.5 text-blue-500">●</div>
                                <div>
                                    <div className="font-medium">{doc.title}</div>
                                    <div className="text-xs text-zinc-500">{doc.category}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-zinc-500 italic">Специальных документов не требуется (только общие).</p>
                )}
            </div>

            {/* Program Tasks Section */}
            <div>
                 <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="text-yellow-500">⚡️</span> Специфические задачи
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-4">
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mb-3">
                        Эти задачи нужно выполнить специально для поступления на эту программу. Они появятся в вашем общем списке квестов.
                    </p>
                    {programTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {programTasks.map((task: QuestTemplate) => (
                                <li key={task.id} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <span className="text-sm font-medium">{task.title}</span>
                                    <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 px-2 py-1 rounded">+{task.xpReward} XP</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-400">Нет специфических задач.</p>
                    )}
                </div>
            </div>

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors">
                Закрыть
            </button>
            {/* Здесь можно добавить кнопку "Выбрать эту программу", если логика предполагает выбор пользователем */}
        </div>
      </div>
    </div>
  );
}
