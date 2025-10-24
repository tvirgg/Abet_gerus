// app/student/quests/QuestDetailModal.tsx

"use client";
import { useEffect, useRef, useState } from "react";
import { QuestTemplate } from "@/app/shared/CountryContext";
import { useProgress, ProgressItem } from "@/app/shared/ProgressContext";

type Props = {
  quest: QuestTemplate & {
    submission_type?: "none" | "text" | "link" | "file" | "credentials";
    submission_label?: string; // For simple types
    submission_fields?: { key: string; label: string }[]; // For complex types
  };
  onClose: () => void;
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const renderInput = (
  type: Props["quest"]["submission_type"],
  fields: Props["quest"]["submission_fields"],
  value: string,
  onTextChange: (value: string) => void,
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  fileInputRef?: React.RefObject<HTMLInputElement | null>
) => {
  switch (type) {
    case "text":
      return (
        <input
          type="text"
          className="w-full rounded-xl border px-4 py-2 bg-white dark:bg-zinc-800"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
        />
      );
    case "link":
      return (
        <input
          type="url"
          className="w-full rounded-xl border px-4 py-2 bg-white dark:bg-zinc-800"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
        />
      );
    case "file":
      return (
        <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
          <UploadIcon />
          <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {value ? "Файл выбран" : "Нажмите, чтобы выбрать файл"}
          </span>
          <p className="text-xs text-zinc-400 mt-1">
            Убедитесь, что скан четкий и все данные видны
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={onFileChange}
          />
        </label>
      );
    default:
      return null;
  }
};

export default function QuestDetailModal({ quest, onClose }: Props) {
  const { progress, submitQuest, uncompleteQuest, approveQuest } = useProgress();
  const [inputValue, setInputValue] = useState<any>(
    quest.submission_type === "credentials" ? {} : ""
  );
  const [validationError, setValidationError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const questProgress: ProgressItem | undefined = progress[quest.id];

  useEffect(() => {
    setIsEditing(false);
    const defaultValue = quest.submission_type === "credentials" ? {} : "";
    if (questProgress && questProgress.submission != null) {
      setInputValue(questProgress.submission ?? defaultValue);
    } else {
      setInputValue(defaultValue);
    }
  }, [quest.id, questProgress, quest.submission_type]);

  const isSubmitDisabled = () => {
    if (questProgress?.status === 'done') return true; // Всегда блокируем, если выполнено
    if (quest.submission_type === "none") return false;
    if (quest.submission_type === "credentials" && quest.submission_fields) {
      return quest.submission_fields.some((field) => !inputValue[field.key]);
    }
    if (validationError) return true;
    return !inputValue;
  };

  const handleSubmit = () => {
    if (isSubmitDisabled()) return;
    if (isEditing && questProgress) {
      uncompleteQuest(quest.id);
    }
    submitQuest(quest.id, inputValue);
    onClose();
  };

  const handleStartReplace = () => {
    setIsEditing(true);
    setValidationError("");
    setInputValue("");
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleDelete = () => {
    if (!questProgress) return;
    const ok = confirm("Удалить прикреплённый файл? Это действие можно будет отменить только новой загрузкой.");
    if (!ok) return;
    uncompleteQuest(quest.id);
    setValidationError("");
    setInputValue("");
    setIsEditing(false);
  };

  const handleApprove = () => {
    approveQuest(quest.id);
    onClose();
  };

  const handleOpenFile = () => {
    if (typeof questProgress?.submission === "string") {
      alert(`Симуляция открытия файла: ${questProgress.submission}`);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setInputValue((prev: object) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError("");

    if (!file) {
      setInputValue("");
      return;
    }

    if (file.type !== "application/pdf") {
      setValidationError("Пожалуйста, выберите файл в формате PDF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        `Размер файла не должен превышать ${MAX_FILE_SIZE_MB} МБ. Вы можете сжать ваш PDF файл.`
      );
      return;
    }

    setInputValue(file.name);
  };

  const showSubmitBlockedOverlay =
    quest.submission_type === "credentials" && !!questProgress && !isEditing;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold mb-2">{quest.title}</h2>
          <button onClick={onClose} className="text-2xl leading-none">
            &times;
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
          <span>
            Награда: <b className="text-yellow-500">{quest.xp} XP</b>
          </span>
          <span>
            Дедлайн: <b>{quest.deadline}</b>
          </span>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 space-y-3">
          {quest.description.split("\n").map((line, index) => {
            if (line.trim() === "") return null;
            const boldRegex = /\*\*(.*?)\*\*/;
            const match = line.match(boldRegex);
            if (match) {
              const boldText = match[1];
              const remainingText = line.substring(match[0].length);
              return (
                <p key={index} className="!my-0">
                  <strong>{boldText}</strong>
                  {remainingText}
                </p>
              );
            }
            return (
              <p key={index} className="!my-0">
                {line}
              </p>
            );
          })}
        </div>

        <div className="mt-6 border-t pt-4">
          {/* --- НОВОЕ: Блок для отображения комментария от куратора --- */}
          {questProgress?.status === 'changes_requested' && questProgress.comment && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Комментарий куратора:</h4>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                {questProgress.comment}
              </p>
            </div>
          )}

          <h3 className="text-sm font-medium">Выполнение задачи</h3>

          {quest.submission_type === "credentials" ? (
            <div className="my-3 space-y-3 relative">
              {showSubmitBlockedOverlay && (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-10" />
              )}
              {quest.submission_fields?.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.key.includes("password") ? "password" : "text"}
                    className="w-full rounded-xl border px-4 py-2 bg-white dark:bg-zinc-800"
                    value={inputValue[field.key] || ""}
                    onChange={(e) =>
                      handleCredentialChange(field.key, e.target.value)
                    }
                  />
                </div>
              ))}
              {questProgress && !isEditing && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="text-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <div className="font-semibold">Данные были отправлены</div>
                    <div className="text-xs text-zinc-500">
                      {typeof questProgress.submission === "object" &&
                      (questProgress.submission as any)?.email
                        ? `Email: ${(questProgress.submission as any).email}`
                        : "Форма отправлена на проверку"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : quest.submission_type === "file" && questProgress && !isEditing ? (
            <div className="my-3 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
                Вы загрузили файл: <b>{questProgress.submission}</b>
              </p>
              <div className="flex items-center justify-center gap-2">
                <button className="btn btn-primary" onClick={handleOpenFile}>
                  Открыть файл
                </button>
                {/* --- ИЗМЕНЕНИЕ: Скрываем кнопки, если статус 'done' --- */}
                {questProgress.status !== 'done' && (
                  <>
                    <button className="btn bg-amber-500/10 text-amber-600" onClick={handleStartReplace}>
                      Заменить файл
                    </button>
                    <button className="btn bg-red-500/10 text-red-600" onClick={handleDelete}>
                      Удалить файл
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : quest.submission_type !== "none" ? (
            <div className="my-3">
              {quest.submission_label && (
                <label className="block text-xs text-zinc-500 mb-1">
                  {quest.submission_label}
                </label>
              )}
              {renderInput(
                quest.submission_type,
                quest.submission_fields,
                inputValue,
                setInputValue,
                handleFileChange,
                fileInputRef
              )}
              {quest.submission_type === "file" && inputValue && (
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Выбранный файл: <b>{inputValue}</b>
                </p>
              )}
              {validationError && (
                <div className="text-xs text-red-500 mt-2 text-center">
                  {validationError}
                  {validationError.includes("сжать") && (
                    <a
                      href="https://www.ilovepdf.com/ru/compress_pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline ml-1 font-semibold"
                    >
                      здесь.
                    </a>
                  )}
                </div>
              )}
              {isEditing && quest.submission_type === "file" && (
                <div className="flex justify-center mt-3">
                  <button
                    className="btn bg-zinc-200 dark:bg-zinc-700"
                    onClick={() => {
                      setIsEditing(false);
                      setInputValue("");
                      setValidationError("");
                    }}
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 my-3">
              Для этого квеста достаточно просто отметить его выполнение.
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled() || (!!questProgress && !isEditing)}
              className="flex-1 btn btn-primary disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed"
            >
              {questProgress?.status === 'changes_requested'
                ? 'Отправить повторно'
                : questProgress?.status === 'done'
                ? "Задача выполнена"
                : questProgress && !isEditing
                ? "Отправлено на проверку"
                : "Отправить на проверку" }
            </button>
            {/* --- ИЗМЕНЕНИЕ: Скрываем кнопку повторной отправки, если статус 'done' --- */}
            {questProgress && questProgress.status !== 'done' && (
              <button
                onClick={() => {
                  if (quest.submission_type === "file") {
                    handleStartReplace();
                  } else if (quest.submission_type === "credentials") {
                    uncompleteQuest(quest.id);
                    setInputValue({});
                  } else {
                    uncompleteQuest(quest.id);
                    setInputValue("");
                  }
                }}
                className="btn bg-red-500/10 text-red-500"
              >
                {quest.submission_type === "file"
                  ? "Заменить файл"
                  : quest.submission_type === "credentials"
                  ? "Изменить данные"
                  : "Отправить заново"}
              </button>
            )}
          </div>

          {questProgress?.status === "review" && (
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Ваша задача на проверке у куратора. После одобрения она переместится в
              "Done".
            </p>
          )}
          {questProgress?.status === "done" && (
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Задача выполнена и одобрена.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
