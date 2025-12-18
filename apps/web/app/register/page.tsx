"use client";
import { useAuth } from "@/shared/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "curator" | "admin">("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.user) {
      const r = auth.user.role.toLowerCase();
      router.replace(r === "student" ? "/student/dashboard" : "/curator/dashboard");
    }
  }, [auth.user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await auth.register({ email, password, role });
    } catch (err: any) {
      setError(err.message || "Не удалось выполнить регистрацию");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl shadow p-8 bg-white dark:bg-zinc-900">
        <div className="pt-4 mt-2">
          <h2 className="text-sm font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
            Регистрация
          </h2>
          <form className="space-y-3" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Пароль</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Роль</label>
              <div className="grid grid-cols-3 gap-2">
                {(["student", "curator", "admin"] as const).map((r) => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`text-xs py-2 rounded-lg border transition ${
                            role === r 
                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent" 
                            : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                    >
                        {r === 'student' ? 'Студент' : r === 'curator' ? 'Куратор' : 'Админ'}
                    </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 rounded-2xl py-2.5 font-medium bg-blue-600 text-white disabled:bg-blue-300 hover:bg-blue-700 transition"
            >
              {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs text-red-500 text-center">
              {error}
            </p>
          )}

          <div className="mt-6 text-center text-xs text-zinc-500">
             Есть аккаунт?{" "}
             <Link href="/login" className="text-blue-500 hover:underline">
               Войти
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
