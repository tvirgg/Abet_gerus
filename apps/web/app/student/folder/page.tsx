"use client";
import { useCountry } from "@/shared/CountryContext";
import { useProgress } from "@/shared/ProgressContext";
import { useMemo, useState } from "react";

export default function FolderPage() {
  const { documents, selectedCountry, quests } = useCountry();
  const { tasks } = useProgress(); // Используем tasks вместо progress

  // CRITICAL FIX: useState must be called BEFORE any conditional returns
  const [isDownloading, setIsDownloading] = useState(false);

  const completedDocumentIds = useMemo(() => {
    const doneDocIds = new Set<number>();
    if (!selectedCountry) return doneDocIds;

    // 1. Находим выполненные задачи
    const doneTasks = tasks.filter((t) => t.status === 'DONE');

    // 2. Находим, к каким документам эти квесты привязаны.
    // Сопоставляем Task (из БД) с QuestTemplate (из JSON) по названию,
    // так как ID у них разные.
    doneTasks.forEach((task) => {
      const template = quests.find(q => q.title === task.title);
      if (template && template.links_to_document_id) {
        doneDocIds.add(template.links_to_document_id);
      }
    });

    return doneDocIds;
  }, [tasks, quests, selectedCountry]);

  if (!selectedCountry) return null;

  const required = new Set(selectedCountry.required_document_ids);
  const filtered = documents.filter((d) => required.has(d.id) && completedDocumentIds.has(d.id));

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

      const res = await fetch(`${API_URL}/tasks/download-zip`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to download");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "documents.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Не удалось скачать архив. Попробуйте позже.");
    } finally {
      setIsDownloading(false);
    }
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
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={filtered.length === 0 || isDownloading}
        >
          {isDownloading ? 'Скачивание...' : 'Скачать архивом'}
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
