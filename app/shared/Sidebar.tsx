"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import Notifications from "./Notifications";
import CountrySwitcher from "./CountrySwitcher";

const NavItem = ({ href, label }: { href: string; label: string }) => {
  const path = usePathname();
  const active = path === href;
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded-xl transition ${
        active ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-full sm-w-64 shrink-0">
      {user?.role === "student" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Текущая операция</div>
            <Notifications />
          </div>
          <CountrySwitcher />
        </div>
      )}
      <div className="mt-4 card p-2 space-y-1">
        <nav className="space-y-1">
          {user?.role === "student" && (
            <>
              <NavItem href="/student/dashboard" label="Главная" />
              {/* --- НОВОЕ: Ссылка на Календарь для студента --- */}
              <NavItem href="/student/calendar" label="Календарь" />
              <NavItem href="/student/quests" label="Мои Квесты" />
              <NavItem href="/student/kanban" label="Kanban Доска" />
              {/* --- НОВОЕ: Добавлена ссылка на раздел "Мои Программы" --- */}
              <NavItem href="/student/programs" label="Мои Программы" />
              <NavItem href="/student/folder" label="Моя Папка" />
            </>
          )}
          {user?.role === "curator" && (
            <>
              {/* --- ИЗМЕНЕНИЕ: Ссылка "Студенты" переименована в "Панель Студентов" --- */}
              <NavItem href="/curator/students" label="Панель Студентов" />
              {/* --- НОВОЕ: Ссылка на Календарь для куратора --- */}
              <NavItem href="/curator/calendar" label="Календарь" />
              <NavItem href="/curator/review" label="Ревью Задач" />
              <NavItem href="/curator/admin/countries" label="Конфигуратор Стран" />
            </>
          )}
        </nav>
        <div className="h-px bg-black/5 dark:bg-white/10 my-2 !mt-3 !mb-2" />
        <button onClick={logout} className="block w-full text-left px-4 py-2 rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10">Выйти</button>
      </div>
    </aside>
  );
}
