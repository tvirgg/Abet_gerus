"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

import { useProgress, Task } from "@/shared/ProgressContext";

type Props = {
  quest: Task & {
    submission_type?: "none" | "text" | "link" | "file" | "credentials";
    comment?: string;
    submission_label?: string;
    submission_fields?: { key: string; label: string }[];
    hint?: string; // NEW: Custom hint for this quest
    accepted_formats?: string[]; // NEW: Allowed file formats (e.g., ['pdf', 'jpg', 'png'])
    advice?: string; // NEW: Rich text advice/instruction
  };
  onClose: () => void;
};

// Подсказки по умолчанию для разных типов заданий
const DEFAULT_HINTS = {
  file: {
    icon: "📎",
    title: "Загрузка файла",
    description: "Загрузите скан документа в формате PDF или изображение (JPG, PNG). Убедитесь, что файл читаемый и качественный.",
  },
  text: {
    icon: "✍️",
    title: "Текстовый ответ",
    description: "Введите ваш ответ в текстовое поле. Постарайтесь быть конкретным и структурированным.",
  },
  link: {
    icon: "🔗",
    title: "Ссылка",
    description: "Вставьте ссылку на документ (Google Drive, Dropbox и т.д.). Убедитесь, что доступ открыт для просмотра.",
  },
  credentials: {
    icon: "🔐",
    title: "Учетные данные",
    description: "Введите логин и пароль от личного кабинета университета или другой системы.",
  },
  none: {
    icon: "✅",
    title: "Информационное задание",
    description: "Это задание не требует отправки файлов или текста. Просто отметьте его как выполненное после завершения.",
  }
};

// Иконки для разных типов файлов
const getFileIcon = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return '🖼️';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  if (['xls', 'xlsx'].includes(ext || '')) return '📊';
  return '📁';
};

export default function QuestDetailModal({ quest, onClose }: Props) {
  const { submitQuest } = useProgress();
  const [inputValue, setInputValue] = useState<any>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    if (quest.submission) {
      setInputValue(quest.submission);
    }
  }, [quest]);

  const validateFile = (file: File): boolean => {
    setValidationError("");

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError("Файл слишком большой. Максимальный размер: 10 МБ");
      return false;
    }

    // Check file format if specified
    if (quest.accepted_formats && quest.accepted_formats.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !quest.accepted_formats.includes(ext)) {
        setValidationError(`Неподдерживаемый формат. Допустимые форматы: ${quest.accepted_formats.join(', ').toUpperCase()}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate based on submission type
    if (quest.submission_type === 'link' && inputValue) {
      try {
        new URL(inputValue);
      } catch {
        setValidationError("Пожалуйста, введите корректную ссылку (начинается с http:// или https://)");
        return;
      }
    }

    if (!inputValue && quest.submission_type !== 'none') {
      setValidationError("Пожалуйста, заполните это поле");
      return;
    }

    await submitQuest(quest.id, inputValue);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (!validateFile(file)) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setInputValue(data.url);
      setValidationError("");
    } catch (err) {
      setValidationError("Ошибка загрузки файла. Попробуйте еще раз.");
    } finally {
      setUploading(false);
    }
  };

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
      handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
    }
  }, []);

  const submissionType = quest.submission_type || 'text';
  const hint = DEFAULT_HINTS[submissionType];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{quest.title}</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                {quest.xpReward} XP
              </span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                {quest.stage}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            ×
          </button>
        </div>

        <div className="prose dark:prose-invert prose-sm max-w-none mb-4 text-zinc-600 dark:text-zinc-300">
          {quest.description}
        </div>

        {/* Advice Block (Rich Text) */}
        {quest.advice && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">🎓</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100 mb-1">Инструкция</h4>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-purple-800 dark:text-purple-200"
                  dangerouslySetInnerHTML={{ __html: quest.advice }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Кастомная подсказка от задания или по умолчанию */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{hint.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                💡 {hint.title}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {quest.hint || hint.description}
              </p>
              {quest.accepted_formats && quest.accepted_formats.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  Форматы: {quest.accepted_formats.join(', ').toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Блок комментария от куратора */}
        {quest.status === 'CHANGES_REQUESTED' && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
              ⚠️ Требуются правки
            </p>
            <p className="text-sm text-red-800 dark:text-red-200">
              {quest.comment || "Куратор не оставил комментария, но что-то не так."}
            </p>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
            <p className="text-sm text-orange-700 dark:text-orange-300">⚠️ {validationError}</p>
          </div>
        )}

        {/* Динамический инпут */}
        <div className="mt-4">
          {submissionType === 'file' ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
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
                accept={quest.accepted_formats ? quest.accepted_formats.map(f => `.${f}`).join(',') : '*'}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={quest.status === 'DONE'}
              />

              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin text-4xl mb-3">⏳</div>
                  <p className="text-zinc-500 animate-pulse">Загрузка файла...</p>
                </div>
              ) : inputValue ? (
                <div className="flex flex-col items-center">
                  <div className="text-5xl mb-3">{getFileIcon(inputValue)}</div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Файл загружен</p>
                  <a
                    href={inputValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline z-10 relative mb-3"
                  >
                    Посмотреть файл →
                  </a>
                  <p className="text-xs text-zinc-400">Перетащите новый файл или нажмите для замены</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-zinc-500">
                  <div className="text-5xl mb-3">☁️</div>
                  <p className="text-sm font-medium mb-1">Перетащите файл сюда</p>
                  <p className="text-xs text-zinc-400">или нажмите для выбора с компьютера</p>
                </div>
              )}
            </div>
          ) : submissionType === 'link' ? (
            <input
              type="url"
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="https://..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={quest.status === 'DONE'}
            />
          ) : submissionType === 'credentials' ? (
            <div className="space-y-3">
              <input
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Логин / Email"
                value={typeof inputValue === 'object' ? inputValue.login : ''}
                onChange={e => setInputValue({ ...inputValue, login: e.target.value })}
                disabled={quest.status === 'DONE'}
              />
              <input
                type="password"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Пароль"
                value={typeof inputValue === 'object' ? inputValue.password : ''}
                onChange={e => setInputValue({ ...inputValue, password: e.target.value })}
                disabled={quest.status === 'DONE'}
              />
            </div>
          ) : submissionType !== 'none' ? (
            <textarea
              rows={6}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="Введите ваш ответ..."
              value={typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue)}
              onChange={e => setInputValue(e.target.value)}
              disabled={quest.status === 'DONE'}
            />
          ) : (
            <div className="text-center py-6 text-zinc-500">
              <p className="text-sm">Это задание не требует загрузки файлов</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={quest.status === 'DONE' || uploading}
            className="btn btn-primary flex items-center gap-2"
          >
            {quest.status === 'DONE' ? (
              <>✓ Выполнено</>
            ) : (
              <>Отправить →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
