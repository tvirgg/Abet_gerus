"use client";
import { useCountry } from "@/app/shared/CountryContext";
import { useProgress } from "@/app/shared/ProgressContext";
import { useMemo } from "react";

export default function FolderPage() {
  const { documents, selectedCountry, quests } = useCountry();
  const { progress } = useProgress();

  const completedDocumentIds = useMemo(() => {
    const doneDocIds = new Set<number>();
    if (!selectedCountry) return doneDocIds;

    // 1. Получаем ID всех выполненных квестов
    const doneQuestIds = Object.keys(progress)
      .map(Number)
      .filter((questId) => progress[questId].status === "done");

    // 2. Находим, к каким документам эти квесты привязаны
    doneQuestIds.forEach((questId) => {
      const quest = quests.find((q) => q.id === questId);
      if (quest && quest.links_to_document_id) {
        doneDocIds.add(quest.links_to_document_id);
      }
    });
    return doneDocIds;
  }, [progress, quests, selectedCountry]);

  if (!selectedCountry) return null;

  const required = new Set(selectedCountry.required_document_ids);
  const filtered = documents.filter((d) => required.has(d.id) && completedDocumentIds.has(d.id));

  const handleDownload = () => {
    alert("Имитация скачивания архива. В реальном приложении здесь будет логика для создания и скачивания ZIP-файла.");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Моя Папка</h1>
          <p className="text-zinc-600 dark:text-zinc-300">
            Здесь хранятся все готовые и проверенные документы.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleDownload} disabled={filtered.length === 0}>
          Скачать архивом
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-zinc-500">Папка пуста. Выполненные документы появятся здесь.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <li key={d.id} className="card p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs text-zinc-500">{d.category}</div>
                <div className="font-medium mt-1">{d.title}</div>
              </div>
              <div className="text-xs text-green-500 mt-3 font-semibold">Проверен</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
