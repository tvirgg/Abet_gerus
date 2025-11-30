"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress, Task } from "@/shared/ProgressContext";

type Props = {
  quest: Task & {
    submission_type?: "none" | "text" | "link" | "file" | "credentials";
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
        
        <div className="prose dark:prose-invert">
            {quest.description}
        </div>

        {/* Simple input for MVP - text only for now to test connectivity */}
        <div className="mt-4">
            <textarea 
                className="w-full bg-zinc-100 dark:bg-zinc-800 p-2 rounded"
                placeholder="Введите ответ..."
                value={typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue)}
                onChange={e => setInputValue(e.target.value)}
                disabled={quest.status === 'DONE'}
            />
        </div>

        <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={quest.status === 'DONE'}
              className="btn btn-primary"
            >
              {quest.status === 'DONE' ? 'Выполнено' : 'Отправить'}
            </button>
        </div>
      </div>
    </div>
  );
}
