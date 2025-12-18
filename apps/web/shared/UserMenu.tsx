"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Avatar from "./Avatar";
import Link from "next/link";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/10 p-1.5 pr-3 rounded-full transition"
      >
        <Avatar name={user.name} level={1} className="w-8 h-8 text-xs" />
        <div className="text-left hidden sm:block">
          <div className="text-sm font-semibold leading-none">{user.name}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{user.role}</div>
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 sm:hidden">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
            
            <div className="py-1">
                <Link 
                    href={user.role === 'student' ? `/student/${user.id}` : `/curator/admin/moderators`}
                    className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    onClick={() => setIsOpen(false)}
                >
                    ⚙️ Настройки профиля
                </Link>
                {user.role === 'student' && (
                     <Link 
                        href="/student/folder"
                        className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        onClick={() => setIsOpen(false)}
                    >
                        📂 Мои документы
                    </Link>
                )}
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
            
            <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
            >
                Выйти
            </button>
        </div>
      )}
    </div>
  );
}
