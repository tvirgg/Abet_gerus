"use client";
import { useCountry } from "@/app/shared/CountryContext";
import { useProgress } from "@/app/shared/ProgressContext";
import { useMemo, useState } from "react";

type CommentState = Record<number, string>;

// --- НОВОЕ: Иконка для кнопки "Отправить на доработку" ---
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 003.5 14" />
  </svg>
);

// --- НОВОЕ: Хелпер для определения, является ли строка именем файла ---
const isFileName = (submission: any): boolean => {
  if (typeof submission !== 'string') return false;
  // Проверяем на наличие популярных расширений файлов
  return /\.(pdf|jpg|jpeg|png|doc|docx)$/i.test(submission);
};

export default function ReviewPage() {
  const { quests } = useCountry();
  const { progress, approveQuest, requestChanges } = useProgress();
  const [comments, setComments] = useState<CommentState>({});

  const questsForReview = useMemo(() => {
    return Object.keys(progress)
      .map(Number)
      .filter(questId => progress[questId].status === 'review')
      .map(questId => quests.find(q => q.id === questId))
      .filter(Boolean); // отсеиваем undefined, если квест не найден
  }, [progress, quests]);

  const handleCommentChange = (questId: number, text: string) => {
    setComments(prev => ({ ...prev, [questId]: text }));
  };

  const handleRequestChanges = (questId: number) => {
    const comment = comments[questId];
    if (!comment) {
      alert("Пожалуйста, напишите комментарий для студента.");
      return;
    }
    requestChanges(questId, comment);
    setComments(prev => {
      const updated = { ...prev };
      delete updated[questId];
      return updated;
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Ревью Задач</h1>
        <p className="text-zinc-600 dark:text-zinc-300">
          Здесь отображаются все задачи студентов, ожидающие вашей проверки.
        </p>
      </div>

      {questsForReview.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-semibold">Все задачи проверены</h3>
          <p className="text-sm text-zinc-500">Новых задач на проверку пока нет.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questsForReview.map(quest => {
            if (!quest) return null;
            const submission = progress[quest.id]?.submission;
            return (
              <div key={quest.id} className="card p-5 bg-zinc-800/50 border border-zinc-700/50">
                <h3 className="font-semibold text-lg">{quest.title}</h3>
                <div className="text-xs text-zinc-400 mb-4">
                  {/* В будущем здесь будет имя студента */}
                  Отправлено: Студент 1
                </div>

                <div className="bg-zinc-900 rounded-lg p-3 text-sm mb-4">
                  <p className="font-medium text-zinc-400 mb-2">Прикрепленные данные:</p>
                  {isFileName(submission) ? (
                    <div className="flex items-center justify-between">
                        <span className="text-xs break-words font-mono text-zinc-300">{String(submission)}</span>
                        <div className="flex gap-3 shrink-0 ml-4">
                            <button onClick={() => alert(`Симуляция открытия файла: ${submission}`)} className="text-xs text-blue-400 hover:underline">Открыть</button>
                            <button onClick={() => alert(`Симуляция скачивания файла: ${submission}`)} className="text-xs text-blue-400 hover:underline">Скачать</button>
                        </div>
                    </div>
                  ) : typeof submission === 'object' ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono text-zinc-300"><code>{JSON.stringify(submission, null, 2)}</code></pre>
                  ) : (
                    <p className="text-xs break-words font-mono text-zinc-300">{String(submission)}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400">
                    Комментарий для доработки (если требуется)
                  </label>
                  <textarea
                    value={comments[quest.id] || ""}
                    onChange={(e) => handleCommentChange(quest.id, e.target.value)}
                    className="w-full mt-2 rounded-xl border border-zinc-700 p-3 text-sm bg-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    rows={3}
                    placeholder="Например: Пожалуйста, загрузите скан в более высоком разрешении."
                  />
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    className="flex-1 btn bg-white text-black font-semibold hover:bg-zinc-200 flex items-center justify-center gap-2"
                    onClick={() => approveQuest(quest.id)}
                  >
                    <span className="text-green-500">✅</span> Одобрить
                  </button>
                  <button
                    className="flex-1 btn border border-amber-500/50 text-amber-400 font-semibold hover:bg-amber-500/10 flex items-center justify-center gap-2"
                    onClick={() => handleRequestChanges(quest.id)}
                  >
                    <RefreshIcon /> Отправить на доработку
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
