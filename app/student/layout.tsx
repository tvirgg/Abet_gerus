"use client";
import "../globals.css";
import { useAuth } from "../shared/AuthContext";
import Sidebar from "../shared/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">Проверка доступа...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container py-6">
        <div className="grid grid-cols-1 sm:grid-cols-[16rem_1fr] gap-6">
          <Sidebar />
          <main className="card p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
