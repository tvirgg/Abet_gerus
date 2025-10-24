"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

/* --- ИЗМЕНЕНИЕ: Добавлен статус для задач, требующих правок --- */
export type ProgressStatus = "review" | "done" | "changes_requested";
export type ProgressItem = {
  status: ProgressStatus;
  submission: any; // Allow storing strings or objects
  comment?: string; // Комментарий куратора
};
type ProgressState = Record<number, ProgressItem>;

type ProgressContextType = {
  progress: ProgressState;
  submitQuest: (questId: number, submission: any) => void;
  uncompleteQuest: (questId: number) => void;
  approveQuest: (questId: number) => void;
  requestChanges: (questId: number, comment: string) => void;
};

const ProgressCtx = createContext<ProgressContextType | null>(null);

// app/shared/ProgressContext.tsx

const STORAGE_KEY = "userProgress_submissions";
const MOCK_INITIAL_PROGRESS: ProgressState = {
  1: { status: "review", submission: { email: "student@gmail.com", password: "password123" } },
  11: { status: "review", submission: "photo_for_passport.jpg" }, // <--- ВОТ ИЗМЕНЕНИЕ
  10: { status: "done", submission: "passport_scan.pdf" },
  12: { status: "done", submission: "school_apostille.pdf" },
  13: { status: "done", submission: "college_docs.pdf" },
};

export const ProgressProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [progress, setProgress] = useState<ProgressState>({});

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(STORAGE_KEY);
      if (storedProgress) {
        setProgress(JSON.parse(storedProgress));
      } else {
        // Если нет прогресса в хранилище, заполняем его мок-данными
        setProgress(MOCK_INITIAL_PROGRESS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL_PROGRESS));
      }
    } catch (e) {
      console.error("Failed to parse progress from localStorage", e);
    }
  }, []);

  const submitQuest = (questId: number, submission: any) => {
    // All submissions first go to "review" status
    // If resubmitting after changes were requested, clear the old comment
    setProgress((prev) => {
      const updatedProgress = {
        ...prev,
        // При повторной отправке задача снова уходит на проверку, комментарий очищается
        [questId]: { status: "review" as ProgressStatus, submission }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    });
  };

  const uncompleteQuest = (questId: number) => {
    setProgress((prev) => {
      const updatedProgress = { ...prev };
      delete updatedProgress[questId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    });
  };

  const approveQuest = (questId: number) => {
    setProgress((prev) => {
      if (!prev[questId]) return prev; // Cannot approve something that doesn't exist
      const updatedProgress = { ...prev };
      updatedProgress[questId] = { ...updatedProgress[questId], status: "done" as ProgressStatus };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    });
  };

  /* --- НОВОЕ: Функция для отправки задачи на доработку --- */
  const requestChanges = (questId: number, comment: string) => {
    setProgress((prev) => {
      if (!prev[questId]) return prev;
      const updatedProgress = { ...prev };
      updatedProgress[questId] = { ...updatedProgress[questId], status: "changes_requested" as ProgressStatus, comment };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    });
  };

  const value = {
    progress,
    submitQuest,
    uncompleteQuest,
    approveQuest,
    requestChanges,
  };

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
};

export const useProgress = () => {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
};
