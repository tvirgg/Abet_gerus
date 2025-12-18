"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";


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
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);


  return (
    <>
    {/* Mobile Toggle */}
    <button 
      className="sm:hidden fixed bottom-4 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg"
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      {mobileOpen ? "✕" : "☰"}
    </button>

    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-zinc-50 dark:bg-black p-4 transform transition-transform duration-200 ease-in-out sm:relative sm:translate-x-0 sm:w-64 flex flex-col h-screen sm:h-auto
       ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
     `}>
      {/* Логотип / Название */}
      <div className="px-4 py-3 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold">A</div>
          <span className="font-bold text-lg tracking-tight">Abbit</span>
      </div>

      <div className="card p-2 space-y-1 flex-1">
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
          {(user?.role === "curator" || user?.role === "admin") && (
            <>
              {/* --- ИЗМЕНЕНИЕ: Ссылка "Студенты" переименована в "Панель Студентов" --- */}
              <NavItem href="/curator/admin/moderators" label="Кураторы" />
              <NavItem href="/curator/students" label="Студенты" />
              <NavItem href="/curator/admin/countries" label="Страны и программы" />
              <NavItem href="/curator/programs-search" label="Поиск программ" />
            </>
          )}
        </nav>
      </div>

    </aside>
    
    {/* Overlay for mobile */}
    {mobileOpen && (
      <div className="fixed inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setMobileOpen(false)} />
    )}
    </>
  );
}
