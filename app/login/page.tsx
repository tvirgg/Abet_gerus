"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../shared/AuthContext";
import { useEffect } from "react";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь уже залогинен, перенаправляем его
    if (auth.user) {
      router.replace(auth.user.role === "student" ? "/student/dashboard" : "/curator/dashboard");
    }
  }, [auth.user, router]);

  const handleLogin = (role: "student" | "curator") => {
    auth.login(role);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl shadow p-8 bg-white dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold mb-3 text-zinc-900 dark:text-zinc-50">Вход в систему</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">Выберите роль для входа (mock).</p>
        <div className="space-y-3">
          <button
            onClick={() => handleLogin("student")}
            className="w-full rounded-2xl py-3 font-medium bg-black text-white dark:bg-white dark:text-black"
          >
            Войти как Студент
          </button>
          <button
            onClick={() => handleLogin("curator")}
            className="w-full rounded-2xl py-3 font-medium border border-black/10 dark:border-white/20"
          >
            Войти как Куратор
          </button>
        </div>
      </div>
    </div>
  );
}
