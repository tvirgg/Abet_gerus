"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Ждем, пока AuthContext определит состояние пользователя

    if (!user) {
      router.replace("/login");
    } else if (user.role === "student") {
      router.replace("/student/dashboard");
    } else if (user.role === "curator") {
      router.replace("/curator/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">Загрузка...</div>
  );
}