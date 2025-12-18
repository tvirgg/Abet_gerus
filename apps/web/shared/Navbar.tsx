"use client";
import { useAuth } from "./AuthContext";
import Notifications from "./Notifications";
import CountrySwitcher from "./CountrySwitcher";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="mb-6 flex items-center justify-between bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-30 py-3 px-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
      {/* Левая часть: Контекст (только для студентов пока актуально) */}
      <div className="flex-1">
        {user?.role === "student" ? (
           <div className="max-w-[200px]">
               <CountrySwitcher />
           </div>
        ) : (
           <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
               Панель управления
           </div>
        )}
      </div>

      {/* Правая часть: Действия и Профиль */}
      <div className="flex items-center gap-4">
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        <Notifications />
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        <UserMenu />
      </div>
    </header>
  );
}
