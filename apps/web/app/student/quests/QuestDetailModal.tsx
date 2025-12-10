"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

import { useProgress, Task } from "@/shared/ProgressContext";

type Props = {
  quest: Task & {
    submission_type?: "none" | "text" | "link" | "file" | "credentials";
    comment?: string; // Добавляем поле комментария
    submission_label?: string; // For simple types
    submission_fields?: { key: string; label: string }[]; // For complex types
  };
  onClose: () => void;
};

export default function QuestDetailModal({ quest, onClose }: Props) {
  const { submitQuest } = useProgress();
  const [inputValue, setInputValue] = useState<any>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Инициализация значения
    if (quest.submission) {
      setInputValue(quest.submission);
    }
  }, [quest]);

  const handleSubmit = async () => {
    await submitQuest(quest.id, inputValue);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      setUploading(true);
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      
      try {
          const token = localStorage.getItem("accessToken");
          const res = await fetch(`${API_URL}/files/upload`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
          });
          const data = await res.json();
          setInputValue(data.url);
      } catch (err) {
          alert("Ошибка загрузки файла");
      } finally {
          setUploading(false);
      }
  };

  // Drag and Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Вызываем тот же обработчик, что и для input
      handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
    }
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold mb-2">{quest.title}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        
        <div className="prose dark:prose-invert text-sm text-zinc-600 dark:text-zinc-300 mb-4">
            {quest.description}
        </div>

        {/* Блок комментария от куратора, если есть возврат */}
        {quest.status === 'CHANGES_REQUESTED' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">⚠️ Требуются правки:</p>
            <p className="text-sm text-red-800 dark:text-red-200">{quest.comment || "Куратор не оставил комментария, но что-то не так."}</p>
          </div>
        )}

        {/* Динамический инпут */}
        <div className="mt-4">
          {quest.submission_type === 'file' ? (
            <div 
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploading ? (
                <div className="text-zinc-500 animate-pulse">Загрузка файла...</div>
              ) : inputValue ? (
                <div className="flex flex-col items-center">
                   <div className="text-2xl mb-2">📄</div>
                   <p className="text-sm font-medium text-green-600 mb-1">Файл загружен</p>
                   <a href={inputValue} target="_blank" className="text-xs text-blue-500 hover:underline z-10 relative">Посмотреть</a>
                   <p className="text-xs text-zinc-400 mt-2">Нажмите или перетащите, чтобы заменить</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-zinc-500">
                  <div className="text-2xl mb-2">☁️</div>
                  <p className="text-sm">Перетащите файл сюда или нажмите для выбора</p>
                </div>
              )}
            </div>
          ) : (
            <textarea 
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Введите ответ..."
              value={typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue)}
              onChange={e => setInputValue(e.target.value)}
              disabled={quest.status === 'DONE'}
            />
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={quest.status === 'DONE' || uploading}
              className="btn btn-primary"
            >
              {quest.status === 'DONE' ? 'Выполнено' : 'Отправить'}
            </button>
        </div>
      </div>
    </div>
  );
}
