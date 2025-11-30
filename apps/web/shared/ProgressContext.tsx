"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type TaskStatus = "TODO" | "REVIEW" | "CHANGES_REQUESTED" | "DONE";

export type Task = {
  id: number;
  stage: string;
  title: string;
  description: string;
  xpReward: number;
  status: TaskStatus;
  submission?: any;
  student?: { fullName: string }; // for curator view
};

type ProgressContextType = {
  tasks: Task[];
  reviewQueue: Task[];
  fetchTasks: () => Promise<void>;
  fetchReviewQueue: () => Promise<void>;
  submitQuest: (questId: number, submission: any) => Promise<void>;
  approveQuest: (questId: number) => Promise<void>;
  requestChanges: (questId: number, comment: string) => Promise<void>;
};

const ProgressCtx = createContext<ProgressContextType | null>(null);

export const ProgressProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Task[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
        fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
          const res = await fetch(`${API_URL}/student/tasks`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) setTasks(await res.json());
      } catch (e) { console.error(e); }
  };

  const fetchReviewQueue = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
          const res = await fetch(`${API_URL}/curator/review`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) setReviewQueue(await res.json());
      } catch (e) { console.error(e); }
  };

  const submitQuest = async (questId: number, submission: any) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_URL}/student/tasks/${questId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submission })
    });
    await fetchTasks();
  };

  const approveQuest = async (questId: number) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_URL}/curator/tasks/${questId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
    await fetchReviewQueue();
  };

  const requestChanges = async (questId: number, comment: string) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_URL}/curator/tasks/${questId}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment })
    });
    await fetchReviewQueue();
  };

  const value: ProgressContextType = {
    tasks,
    reviewQueue,
    fetchTasks,
    fetchReviewQueue,
    submitQuest,
    approveQuest,
    requestChanges,
  };

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
};

export const useProgress = () => {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
};
